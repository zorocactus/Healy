"""
Crée les comptes initiaux après déploiement.

Usage (sur Railway shell) :
    python create_initial_accounts.py

Les mots de passe sont lus depuis l'environnement si présents, sinon générés.
Tout est affiché à la fin — copier dans un gestionnaire de mots de passe puis purger les logs.

Variables d'env optionnelles :
    INIT_ADMIN_EMAIL, INIT_ADMIN_PASSWORD
    INIT_DOCTOR_EMAIL, INIT_DOCTOR_PASSWORD
    INIT_PATIENT_EMAIL, INIT_PATIENT_PASSWORD
"""

import os
import secrets
import string
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()


def gen_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def upsert(email: str, password: str, *, role: str, **extra) -> tuple[User, str, bool]:
    """Crée ou met à jour un user. Retourne (user, password_used, created)."""
    user, created = User.objects.get_or_create(
        email=email,
        defaults={'username': email, 'role': role, **extra},
    )
    if created:
        user.set_password(password)
        for k, v in extra.items():
            setattr(user, k, v)
        user.save()
        return user, password, True
    # Existant : on ne touche pas au mot de passe pour ne pas écraser.
    return user, '(inchangé — compte déjà existant)', False


def main():
    print("\n" + "═" * 60)
    print("  HEALY — création des comptes initiaux")
    print("═" * 60)

    accounts = []

    # 1) Admin (superuser)
    admin_email = os.environ.get('INIT_ADMIN_EMAIL', 'admin@healy.app')
    admin_pwd = os.environ.get('INIT_ADMIN_PASSWORD') or gen_password()
    user, pwd_used, created = upsert(
        admin_email, admin_pwd,
        role='admin',
        is_staff=True,
        is_superuser=True,
        is_active=True,
        verification_status='verified',
        first_name='Admin',
        last_name='Healy',
    )
    accounts.append(('ADMIN', admin_email, pwd_used, created))

    # 2) Médecin de test (vérifié, pour pouvoir tester le dashboard doctor)
    doc_email = os.environ.get('INIT_DOCTOR_EMAIL', 'doctor@healy.app')
    doc_pwd = os.environ.get('INIT_DOCTOR_PASSWORD') or gen_password()
    user, pwd_used, created = upsert(
        doc_email, doc_pwd,
        role='doctor',
        is_active=True,
        verification_status='verified',
        first_name='Dr',
        last_name='Test',
    )
    accounts.append(('DOCTOR', doc_email, pwd_used, created))

    # 3) Patient de test
    pat_email = os.environ.get('INIT_PATIENT_EMAIL', 'patient@healy.app')
    pat_pwd = os.environ.get('INIT_PATIENT_PASSWORD') or gen_password()
    user, pwd_used, created = upsert(
        pat_email, pat_pwd,
        role='patient',
        is_active=True,
        verification_status='verified',
        first_name='Patient',
        last_name='Test',
    )
    accounts.append(('PATIENT', pat_email, pwd_used, created))

    # ── Affichage final ────────────────────────────────────────────────
    print("\n" + "─" * 60)
    print(f"  {'RÔLE':<10} {'EMAIL':<30} {'MOT DE PASSE'}")
    print("─" * 60)
    for role, email, pwd, created in accounts:
        tag = "NEW" if created else "EXIST"
        print(f"  [{tag:<5}] {role:<8} {email:<30} {pwd}")
    print("─" * 60)
    print("\n⚠️  Copie ces credentials MAINTENANT dans un gestionnaire de mots de passe.")
    print("    Ils ne seront PAS réaffichés. Pour réinitialiser : Django admin.\n")


if __name__ == '__main__':
    main()
