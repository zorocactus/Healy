# 🚀 Healy — Guide de déploiement

**Stack cible :**
- Backend Django → **Railway** (`https://healy-api.up.railway.app`)
- Postgres → **Railway** (plugin Postgres managé)
- Frontend React/Vite → **Vercel** (`https://healy.vercel.app`)
- Bot IA (diagnostic_ai) → **désactivé** (réactivable plus tard, voir fin du doc)

---

## 0. Prérequis (à faire une fois)

1. **Compte GitHub** — pour pousser le code (Railway + Vercel lisent depuis Git).
2. **Compte Railway** → https://railway.app (login GitHub, plan Hobby gratuit suffit au début).
3. **Compte Vercel** → https://vercel.com (login GitHub, free tier OK).
4. **Initialiser le repo Git** (à la racine du projet) :
   ```powershell
   cd c:\Users\yassi\OneDrive\Documents\projet-medical
   git init
   git add .
   git commit -m "Initial commit — ready to deploy"
   ```
5. **Créer un repo GitHub** vide nommé `healy`, puis :
   ```powershell
   git remote add origin https://github.com/<TON_USER>/healy.git
   git branch -M main
   git push -u origin main
   ```

---

## 1. Backend sur Railway

### 1.1 Créer le projet
1. https://railway.app/new → **Deploy from GitHub repo** → choisir `healy`.
2. Railway détecte du Python. Dans **Settings → Root Directory**, mettre `back`.
3. **Settings → Networking → Generate Domain** → noter l'URL, ex : `healy-api-production.up.railway.app`.

### 1.2 Ajouter Postgres
1. Sur le canvas du projet → **+ New** → **Database** → **PostgreSQL**.
2. Railway injecte automatiquement `DATABASE_URL` dans le service backend.

### 1.3 Variables d'environnement
Dans le service backend → **Variables** → coller :

```env
SECRET_KEY=<générer une nouvelle clé, voir ci-dessous>
DEBUG=False
ALLOWED_HOSTS=healy-api-production.up.railway.app
FRONTEND_URL=https://healy.vercel.app

CORS_ALLOW_ALL=False
CORS_ALLOWED_ORIGINS=https://healy.vercel.app

EMAIL_HOST_USER=medicalsmartapp@gmail.com
EMAIL_HOST_PASSWORD=<ton app password Gmail>

ENABLE_AI=False
```

**Générer une SECRET_KEY** :
```powershell
python -c "import secrets; print(secrets.token_urlsafe(60))"
```

> ⚠️ Remplace `healy-api-production.up.railway.app` par l'URL exacte que Railway t'a donnée.
> ⚠️ `https://healy.vercel.app` sera connu après le step 2 — tu pourras revenir le corriger.

### 1.4 Premier déploiement
Railway redéploie automatiquement à chaque push GitHub. Le `build.sh` (ou la `startCommand` de `railway.json`) va :
1. `pip install -r requirements-prod.txt`
2. `collectstatic`
3. `migrate`
4. `createcachetable`
5. lancer gunicorn

**Logs** → onglet **Deployments** → cliquer sur le run en cours.

### 1.5 Créer les comptes initiaux
Une fois le déploiement OK :

1. Sur Railway, service backend → **⋮ → Open Shell** (ou `railway shell` via la CLI).
2. Exécuter :
   ```bash
   python create_initial_accounts.py
   ```
3. **Copier immédiatement** les credentials affichés (admin / doctor / patient) dans un gestionnaire de mots de passe.

Pour fixer toi-même les mots de passe au lieu de les générer, ajoute d'abord ces variables dans Railway :
```env
INIT_ADMIN_PASSWORD=...
INIT_DOCTOR_PASSWORD=...
INIT_PATIENT_PASSWORD=...
```

### 1.6 Vérifier
```
https://healy-api-production.up.railway.app/api/schema/swagger-ui/
```
Doit afficher la doc Swagger. Login via `/api/auth/token/`.

---

## 2. Frontend sur Vercel

### 2.1 Importer le projet
1. https://vercel.com/new → **Import Git Repository** → `healy`.
2. **Root Directory** : `front/Website`
3. **Framework Preset** : Vite (auto-détecté).
4. **Environment Variables** :
   ```
   VITE_API_URL = https://healy-api-production.up.railway.app/api
   ```
   (avec `/api` à la fin, et l'URL Railway exacte du step 1.3)
5. **Deploy**.

### 2.2 Récupérer l'URL Vercel et boucler
Une fois déployé, Vercel donne une URL type `https://healy.vercel.app` (ou `healy-xxx.vercel.app`).

**Retourner sur Railway** → variables → mettre à jour :
```env
ALLOWED_HOSTS=healy-api-production.up.railway.app
CORS_ALLOWED_ORIGINS=https://healy.vercel.app
FRONTEND_URL=https://healy.vercel.app
```
Puis Railway redéploie automatiquement.

### 2.3 Vérifier de bout en bout
1. Ouvrir `https://healy.vercel.app`
2. Login avec le compte **admin** créé au 1.5
3. Vérifier dashboard + appel API OK (onglet Network du navigateur)

---

## 3. Récap des comptes & URLs

| Quoi | Où |
|---|---|
| API backend | `https://healy-api-production.up.railway.app/api/` |
| Doc Swagger | `.../api/schema/swagger-ui/` |
| Django admin | `.../admin/` |
| Frontend | `https://healy.vercel.app` |
| DB Postgres | Railway → service Postgres → onglet Variables (`DATABASE_URL`) |
| Comptes initiaux | Affichés UNE fois par `create_initial_accounts.py` |

---

## 4. Réactiver le bot IA (plus tard)

Le module `diagnostic_ai` (RAG + Gemini + torch + chromadb) a été désactivé pour permettre un déploiement léger. Pour le réactiver :

1. Upgrade Railway → service backend → **Settings → Resources** → 2 GB RAM minimum (~$10–20/mo).
2. Dans `nixpacks.toml` ou `railway.json`, remplacer `requirements-prod.txt` par `requirements.txt`.
3. Ajouter les variables :
   ```env
   ENABLE_AI=True
   GEMINI_API_KEY=<clé Google AI Studio>
   GEMINI_MODEL=gemini-2.5-flash
   ```
4. Uploader `chroma_db/` sur un volume Railway (ou re-générer via `build_dataset.py`).
5. Redeployer. Premier démarrage = ~5 min (download du modèle `multilingual-e5-large` 2 GB).

---

## 5. Brancher un vrai domaine (plus tard)

- **Vercel** : Settings → Domains → ajouter `healy.com` (ou autre). Configurer le DNS chez ton registrar (CNAME → `cname.vercel-dns.com`).
- **Railway** : Settings → Networking → Custom Domain → ajouter `api.healy.com`. CNAME → URL Railway.
- Mettre à jour côté backend :
  ```env
  ALLOWED_HOSTS=api.healy.com
  CORS_ALLOWED_ORIGINS=https://healy.com,https://www.healy.com
  FRONTEND_URL=https://healy.com
  ```
- Mettre à jour côté frontend :
  ```env
  VITE_API_URL=https://api.healy.com/api
  ```

---

## 6. Troubleshooting

| Symptôme | Cause probable | Fix |
|---|---|---|
| `DisallowedHost` au login | `ALLOWED_HOSTS` ne contient pas le domaine Railway | Ajouter l'URL exacte (sans https://) dans la variable |
| CORS error dans console | `CORS_ALLOWED_ORIGINS` n'inclut pas l'origine Vercel | Ajouter `https://healy.vercel.app` |
| `psycopg2.OperationalError: SSL required` | DB Railway exige SSL | Déjà géré dans settings.py (`ssl_require=not DEBUG`) — vérifier que `DEBUG=False` |
| Frontend appelle `127.0.0.1:8000` | `VITE_API_URL` pas défini au build Vercel | Settings → Environment Variables → ajouter puis **Redeploy** |
| Build Railway plante sur torch | `requirements.txt` lu au lieu de `requirements-prod.txt` | Vérifier `nixpacks.toml` / `railway.json` |
| 500 sur `/admin/` après deploy | `collectstatic` n'a pas tourné | Re-run `build.sh` ou exécuter `python manage.py collectstatic --noinput` dans le shell Railway |

---

✅ **Voilà. Suis les sections 0 → 1 → 2 dans l'ordre, et tu es en ligne en ~30 minutes.**
