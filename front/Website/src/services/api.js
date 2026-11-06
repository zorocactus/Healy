// ─────────────────────────────────────────────────────────────────────────────
// src/services/api.js
// Fichier central de communication avec le backend Healy
// Tous les appels API passent par ici — NE PAS faire de fetch directement
// dans les composants React.
// ─────────────────────────────────────────────────────────────────────────────

// IMP-01 fix : BASE_URL via variable d'environnement Vite (définie dans .env)
const RAW_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");
const buildUrl = (endpoint) => `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

// ─── Helpers internes ─────────────────────────────────────────────────────────

/** Récupère le token JWT sauvegardé au login */
const getToken = () => localStorage.getItem("access_token");

/** Récupère le refresh token */
const getRefreshToken = () => localStorage.getItem("refresh_token");

/** Sauvegarde les tokens après login */
const saveTokens = ({ access, refresh, role }) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  if (role) localStorage.setItem("mock_role", role); // Stockage temporaire pour le mock
};

/** Supprime les tokens et l'historique de chat (logout) */
const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("mock_role");
  // Isolation des données patient : vider l'historique IA au logout
  // pour empêcher qu'un autre compte voie les conversations du précédent
  localStorage.removeItem("aiActiveSession");
  localStorage.removeItem("chatMessagesMap");
  localStorage.removeItem("diagResultsMap");
};

/**
 * Fonction fetch centrale avec gestion automatique des erreurs et du token.
 * Si le token expire (401), elle tente un refresh automatique.
 */
export async function apiFetch(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Ne pas forcer application/json si c'est un FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  // Ajoute le token JWT si disponible
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestUrl = buildUrl(endpoint);
  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (token) {
      // Authenticated request whose token expired → try refresh once
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        headers["Authorization"] = `Bearer ${getToken()}`;
        const retryResponse = await fetch(requestUrl, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) throw new Error(`Erreur ${retryResponse.status}`);
        return retryResponse.json();
      } else {
        // Refresh failed → session ended (expired or suspended)
        clearTokens();
        window.location.href = "/?expired=1";
        return;
      }
    }
    // No token = unauthenticated request (login, register…) — propagate the error normally
    let errorMsg = "Erreur 401";
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch (e) {
      if (!(e instanceof SyntaxError)) throw e;
    }
    throw new Error(errorMsg);
  }

  if (!response.ok) {
    // Tente de lire le message d'erreur du backend
    let errorMsg = `Erreur ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // IMP-11 : ne pas avaler les erreurs qui ne sont pas liées au parsing JSON
      if (!(e instanceof SyntaxError)) throw e;
    }
    throw new Error(errorMsg);
  }

  // 204 No Content (DELETE, etc.) → pas de JSON à retourner
  if (response.status === 204) return null;

  return response.json();
}

/**
 * Version de apiFetch pour récupérer des fichiers binaires (blobs)
 * Utile pour les PDF, Images, etc. qui nécessitent authentification.
 */
export async function apiFetchBlob(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const requestUrl = buildUrl(endpoint);
  let response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  if (response.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getToken()}`;
      response = await fetch(requestUrl, { ...options, headers });
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      return response.blob();
    } else {
      clearTokens();
      window.location.href = "/?expired=1";
      return;
    }
  }

  if (!response.ok) throw new Error(`Erreur ${response.status}`);
  return response.blob();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTHENTIFICATION  →  /api/auth/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Connexion — retourne { access, refresh, role, user_id }
 * @param {string} email
 * @param {string} password
 */
export async function login(email, password) {
  const responseData = await apiFetch("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  
  if (responseData?.access) saveTokens(responseData);
  return responseData;
}

/**
 * Rafraîchit le token d'accès avec le refresh token.
 * Appelé automatiquement par apiFetch si le token expire.
 */
export async function refreshAccessToken() {
  try {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    const res = await fetch(buildUrl("/auth/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem("access_token", data.access);
    return true;
  } catch {
    return false;
  }
}

/**
 * Déconnexion — révoque le refresh token côté serveur (blacklist) puis vide localStorage.
 * En cas d'échec réseau on vide quand même les tokens locaux : la session locale est cassée.
 */
export async function logout() {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await fetch(buildUrl("/auth/logout/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ refresh }),
      });
    } catch { /* network down — proceed with local cleanup */ }
  }
  clearTokens();
}

/**
 * Inscription patient
 * @param {object} userData — { email, email, password, first_name, last_name, ... }
 */
export async function registerPatient(userData) {
  const isFormData = userData instanceof FormData;
  return apiFetch("/auth/register/patient/", {
    method: "POST",
    body: isFormData ? userData : JSON.stringify(userData),
  });
}

/**
 * Inscription médecin
 * @param {FormData} userData — multipart/form-data (practice_authorization FileField requis)
 */
export async function registerDoctor(userData) {
  const isFormData = userData instanceof FormData;
  return apiFetch("/auth/register/doctor/", {
    method: "POST",
    body: isFormData ? userData : JSON.stringify(userData),
  });
}

/**
 * Inscription pharmacien
 * @param {FormData} userData — multipart/form-data (agreement_scan + registre_commerce FileFields requis)
 */
export async function registerPharmacist(userData) {
  const isFormData = userData instanceof FormData;
  return apiFetch("/auth/register/pharmacist/", {
    method: "POST",
    body: isFormData ? userData : JSON.stringify(userData),
  });
}

/**
 * Inscription garde-malade
 * @param {FormData} userData — multipart/form-data (criminal_record_scan FileField requis)
 */
export async function registerCaretaker(userData) {
  const isFormData = userData instanceof FormData;
  return apiFetch("/auth/register/caretaker/", {
    method: "POST",
    body: isFormData ? userData : JSON.stringify(userData),
  });
}

/**
 * Récupère les infos de l'utilisateur connecté
 * Retourne { id, email, first_name, last_name, role, ... }
 */
export async function getMe() {
  return apiFetch("/auth/me/");
}

/**
 * Met à jour les informations de base de l'utilisateur connecté
 * @param {object} data — champs à modifier
 */
export async function updateMe(data) {
  if (data instanceof FormData || Object.values(data).some((v) => v instanceof File)) {
    const fd = data instanceof FormData ? data : (() => {
      const f = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v != null) f.append(k, v); });
      return f;
    })();
    return apiFetch("/auth/me/", { method: "PATCH", body: fd });
  }
  return apiFetch("/auth/me/", { method: "PATCH", body: JSON.stringify(data) });
}

/**
 * (Patient) Demande de changement de nom/prénom (soumis à validation Admin)
 * @param {object} data — { new_first_name, new_last_name, reason }
 */
export async function requestProfileUpdate(data) {
  return apiFetch("/auth/request-profile-update/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MÉDECINS  →  /api/doctors/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Liste des médecins avec filtres optionnels
 * @param {object} filters — { nom, specialite, ville, note_min, ... }
 * Exemple : getDoctors({ specialite: "Cardiologie", ville: "Alger" })
 */
export async function getDoctors(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/doctors/list/${params ? "?" + params : ""}`);
}

/**
 * Détails complets d'un médecin
 * @param {number} doctorId
 */
export async function getDoctorById(doctorId) {
  return apiFetch(`/doctors/${doctorId}/`);
}

/**
 * Créneaux disponibles d'un médecin
 * BUG-02 fix : URL corrigée de /doctors/{id}/slots/ → /doctors/{id}/availability/
 * @param {number} doctorId
 * @param {string} date — format "YYYY-MM-DD" (optionnel)
 * Retourne : { doctor_id, date, slots: [{ start_time, end_time }] }
 */
export async function getDoctorSlots(doctorId, date = null) {
  const query = date ? `?date=${date}` : "";
  return apiFetch(`/doctors/${doctorId}/availability/${query}`);
}

/**
 * Avis publics d'un médecin
 * @param {number} doctorId
 */
export async function getDoctorReviews(doctorId) {
  return apiFetch(`/doctors/${doctorId}/reviews/`);
}

export async function getMyDoctorReviews() {
  return apiFetch("/doctors/my-reviews/");
}

export async function getCaretakerReviews() {
  return apiFetch("/caretaker/reviews/");
}

export async function submitCaretakerReview(data) {
  return apiFetch("/caretaker/reviews/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Médecin : gestion de son propre profil ───────────────────────────────────

/**
 * (Médecin) Récupère son profil professionnel
 */
export async function getDoctorProfile() {
  return apiFetch("/doctors/profile/");
}

/**
 * (Médecin) Met à jour son profil professionnel
 * @param {object} data — { specialite, experience, tarif, ... }
 */
export async function updateDoctorProfile(data) {
  return apiFetch("/doctors/profile/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * (Médecin) Liste son planning hebdomadaire
 */
export async function getSchedules() {
  return apiFetch("/doctors/my-schedule/");
}

/**
 * (Médecin) Met à jour ou crée un jour de planning
 */
export async function saveSchedule(data) {
  if (data.id) {
    return apiFetch(`/doctors/my-schedule/${data.id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  return apiFetch("/doctors/my-schedule/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMySlots() {
  return apiFetch("/doctors/my-schedule/");
}

/**
 * (Médecin) Crée une plage horaire hebdomadaire
 * BUG-03 fix : URL corrigée de /doctors/slots/ → /doctors/my-schedule/
 * @param {object} slotData — { day_of_week, start_time, end_time, slot_duration, is_active }
 */
export async function createSlot(slotData) {
  return apiFetch("/doctors/my-schedule/", {
    method: "POST",
    body: JSON.stringify(slotData),
  });
}

/**
 * (Médecin) Supprime une plage horaire
 * BUG-03 fix : URL corrigée de /doctors/slots/{id}/ → /doctors/my-schedule/{id}/
 * @param {number} slotId
 */
export async function deleteSlot(slotId) {
  return apiFetch(`/doctors/my-schedule/${slotId}/`, {
    method: "DELETE",
  });
}

/**
 * (Médecin) Modifie une plage horaire
 * BUG-03 fix : URL corrigée de /doctors/slots/{id}/ → /doctors/my-schedule/{id}/
 * @param {number} slotId
 * @param {object} data
 */
export async function updateSlot(slotId, data) {
  return apiFetch(`/doctors/my-schedule/${slotId}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PATIENTS & DOSSIER MÉDICAL  →  /api/patients/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère le profil personnel du patient (adresse, contacts)
 */
export async function getPatientProfile() {
  return apiFetch("/patients/profile/");
}

/**
 * Met à jour le profil personnel du patient
 * @param {object} data
 */
export async function updatePatientProfile(data) {
  return apiFetch("/patients/profile/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Récupère le profil médical du patient (groupe sanguin, allergies, etc.)
 */
export async function getMedicalProfile() {
  return apiFetch("/patients/medical-profile/");
}

/**
 * Met à jour le profil médical du patient
 * @param {object} data — { blood_group, allergies, ... }
 *   ⚠️ backend attend `blood_group` (PAS `blood_type`). Si l'appelant fournit
 *      `blood_type`, on le rename pour éviter un échec silencieux.
 */
export async function updateMedicalProfile(data) {
  const payload = { ...data };
  if (payload.blood_type !== undefined && payload.blood_group === undefined) {
    payload.blood_group = payload.blood_type;
    delete payload.blood_type;
  }
  return apiFetch("/patients/medical-profile/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Historique des antécédents médicaux
 * @param {number} [patientId] — si fourni (vue médecin), filtre par patient
 */
export async function getAntecedents(patientId) {
  const q = patientId ? `?patient=${patientId}` : "";
  return apiFetch(`/patients/antecedents/${q}`);
}

/**
 * (Médecin) Supprime un antécédent du dossier patient
 * @param {number} antecedentId
 */
export async function deleteAntecedent(antecedentId) {
  return apiFetch(`/patients/antecedents/${antecedentId}/`, { method: "DELETE" });
}

/**
 * Ordonnances du patient connecté
 * Returns: [{ id, status, notes, valid_until, created_at, items: [{drug_name, dosage, frequency, duration}], qr_token: {token}, doctor_name }]
 */
export async function getMyPrescriptions() {
  return apiFetch("/prescriptions/prescriptions/");
}

/**
 * Consultations du patient connecté (ou d'un patient spécifique vu par le médecin)
 * @param {number} [patientId] — si fourni, filtre par patient
 * Returns: [{ id, doctor_name, patient_name, chief_complaint, diagnosis, status, consulted_at }]
 */
export async function getMyConsultations(patientId) {
  const q = patientId ? `?patient=${patientId}` : "";
  return apiFetch(`/consultations/consultations/${q}`);
}

/**
 * (Médecin) Ordonnances d'un patient lié
 * @param {number} patientId
 * Returns: [{ id, status, created_at, items: [{drug_name, dosage, frequency, duration}] }]
 */
export async function getPatientPrescriptions(patientId) {
  return apiFetch(`/prescriptions/prescriptions/?patient=${patientId}`);
}

/**
 * Traitements en cours
 */
export async function getTreatments() {
  return apiFetch("/patients/treatments/");
}

/**
 * Résultats d'examens et analyses
 */
export async function getLabResults() {
  return apiFetch("/patients/medical-documents/");
}

/**
 * Historique des analyses de symptômes IA
 */
export async function getSymptomHistory() {
  return apiFetch("/patients/symptom-analysis/");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RENDEZ-VOUS  →  /api/appointments/  et  /api/doctor/
// ─────────────────────────────────────────────────────────────────────────────

// ─── Côté Patient ─────────────────────────────────────────────────────────────

/**
 * Liste les rendez-vous du patient connecté
 */
export async function getMyAppointments() {
  return apiFetch("/appointments/appointments/");
}

/**
 * Prendre un nouveau rendez-vous
 * BUG-14/21 fix : le backend attend { doctor_id, date, start_time, end_time, motif }
 * et non { doctor_id, slot_id, motif }.
 * @param {object} data — { doctor_id, date, start_time, end_time, motif }
 */
export async function bookAppointment(data) {
  return apiFetch("/appointments/appointments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Détails d'un rendez-vous spécifique
 * @param {number} appointmentId
 */
export async function getAppointmentById(appointmentId) {
  return apiFetch(`/appointments/appointments/${appointmentId}/`);
}

/**
 * Annuler un rendez-vous
 * @param {number} appointmentId
 */
export async function cancelAppointment(appointmentId) {
  return apiFetch(`/appointments/appointments/${appointmentId}/cancel/`, {
    method: "POST",
  });
}

/**
 * Reprogrammer un rendez-vous
 * @param {number} appointmentId
 * @param {object} data — { new_slot_id, ... }
 */
export async function rescheduleAppointment(appointmentId, data) {
  // NOTE: le backend monte `appointments/<pk>/reschedule/` sous le prefix
  // `/api/appointments/`, d'où le double segment "appointments/".
  return apiFetch(`/appointments/appointments/${appointmentId}/reschedule/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Laisser un avis sur une consultation terminée
 * BUG-15 fix : les champs backend sont { rating, comment } et non { note, commentaire }.
 * @param {number} appointmentId
 * @param {object} data — { rating (1-5), comment }
 */
export async function leaveReview(appointmentId, data) {
  return apiFetch(`/appointments/${appointmentId}/review/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Côté Médecin ──────────────────────────────────────────────────────────────

/**
 * (Médecin) Planning du jour
 * BUG-04 fix : URL corrigée — le backend expose /doctor/schedule/ (sans /today/).
 * Filtrer par date du jour est le comportement par défaut du backend.
 */
export async function getTodaySchedule() {
  return apiFetch("/doctor/schedule/");
}

/**
 * (Médecin) Demandes en attente de validation
 */
export async function getPendingAppointments() {
  return apiFetch("/doctor/appointments/pending/");
}

/**
 * (Médecin) Historique complet de ses rendez-vous
 */
export async function getDoctorAppointments() {
  return apiFetch("/doctor/appointments/");
}

/**
 * (Médecin) Confirmer une demande
 * @param {number} appointmentId
 */
export async function confirmAppointment(appointmentId) {
  return apiFetch(`/doctor/appointments/${appointmentId}/confirm/`, {
    method: "POST",
  });
}

/**
 * (Médecin) Refuser une demande
 * @param {number} appointmentId
 */
export async function refuseAppointment(appointmentId) {
  return apiFetch(`/doctor/appointments/${appointmentId}/refuse/`, {
    method: "POST",
  });
}

/**
 * (Médecin) Marquer comme terminé
 * @param {number} appointmentId
 */
export async function completeAppointment(appointmentId) {
  return apiFetch(`/doctor/appointments/${appointmentId}/complete/`, {
    method: "POST",
  });
}

/**
 * (Médecin) Crée un RDV directement pour un patient lié (auto-confirmé)
 * @param {object} data — { patient_id, date: "YYYY-MM-DD", start_time: "HH:MM", end_time: "HH:MM", motif }
 */
export async function doctorCreateAppointment(data) {
  return apiFetch("/doctor/appointments/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * (Médecin) Annuler un RDV — notifie le patient
 * @param {number} appointmentId
 * @param {string} [reason]
 */
export async function doctorCancelAppointment(appointmentId, reason = "") {
  return apiFetch(`/doctor/appointments/${appointmentId}/cancel/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NOTIFICATIONS  →  /api/notifications/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère toutes les notifications de l'utilisateur
 */
export async function getNotifications() {
  return apiFetch("/notifications/");
}

/**
 * Marque une notification comme lue
 * @param {number} notificationId
 */
export async function markNotificationRead(notificationId) {
  return apiFetch(`/notifications/${notificationId}/read/`, {
    method: "POST",
  });
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsRead() {
  return apiFetch("/notifications/mark_all_as_read/", {
    method: "POST",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PHARMACIE  →  /api/pharmacy/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Liste des pharmacies partenaires avec filtres optionnels
 * @param {object} filters — { city, is_open_24h, search }
 */
export async function getPharmacies(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/pharmacy/list/${params ? "?" + params : ""}`);
}

/**
 * Recherche de pharmacies par nom ou ville
 * @param {string} query
 */
export async function searchPharmacies(query) {
  return apiFetch(`/pharmacy/list/?search=${encodeURIComponent(query)}`);
}

/**
 * Liste des succursales / points de vente
 */
export async function getPharmacyBranches() {
  return apiFetch("/pharmacy/branches/");
}

// ─── Pharmacien : stock & stats ───────────────────────────────────────────────

/**
 * (Pharmacien) Liste de son stock
 * GET /api/pharmacy/stock/
 */
export async function getPharmacyStock() {
  return apiFetch("/pharmacy/stock/");
}

/**
 * GET /api/pharmacy/stock/public-stock/?pharmacy_id=...
 * Patient : consulter le stock d'une pharmacie spécifique
 */
export async function getPublicPharmacyStock(pharmacyId) {
  return apiFetch(`/pharmacy/stock/public-stock/?pharmacy_id=${pharmacyId}`);
}

/**
 * (Pharmacien) Crée une ligne de stock
 * POST /api/pharmacy/stock/
 * @param {object} data — { medication, quantity, selling_price?, expiry_date? }
 */
export async function createPharmacyStock(data) {
  return apiFetch("/pharmacy/stock/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * (Pharmacien) Met à jour une ligne de stock (PATCH partiel : quantity/prix/etc.)
 * PATCH /api/pharmacy/stock/{id}/
 * @param {number} stockId
 * @param {object} data
 */
export async function updatePharmacyStock(stockId, data) {
  return apiFetch(`/pharmacy/stock/${stockId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * (Pharmacien) Supprime une ligne de stock
 * DELETE /api/pharmacy/stock/{id}/
 */
export async function deletePharmacyStock(stockId) {
  return apiFetch(`/pharmacy/stock/${stockId}/`, { method: "DELETE" });
}

/**
 * (Pharmacien) KPIs et alertes du dashboard
 * GET /api/pharmacy/dashboard/
 */
export async function getPharmacyStats() {
  return apiFetch("/pharmacy/dashboard/");
}

/**
 * (Pharmacien) Mise à jour de statut d'une commande
 * PATCH /api/pharmacy/orders/{id}/status/
 * @param {string|number} orderId
 * @param {object} data — { status, pharmacist_note?, estimated_ready? }
 */
export async function updatePharmacyOrderStatus(orderId, data) {
  return apiFetch(`/pharmacy/orders/${orderId}/status/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * (Pharmacien) Scan d'un QR code de prescription (saisie manuelle ou caméra)
 * POST /api/prescriptions/scan/
 * @param {string} token
 */
export async function scanPrescriptionQr(token) {
  return apiFetch("/prescriptions/scan/", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/**
 * (Pharmacien) Crée une commande après scan QR ou manuellement
 * POST /api/pharmacy/orders/
 * @param {object} data — { prescription_id, notes? }
 */
export async function createPharmacyOrder(data) {
  return apiFetch("/pharmacy/orders/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * (Patient) Liste les commandes pharmacie de l'utilisateur connecté
 * GET /api/pharmacy/orders/my/
 */
export async function getMyPharmacyOrders() {
  return apiFetch("/pharmacy/orders/");
}

// ─── Médecin : patients ayant un RDV avec le médecin connecté ─────────────────

/**
 * (Médecin) Liste les patients qui ont eu au moins un RDV avec le médecin
 * GET /api/patients/my-patients/
 */
export async function getDoctorPatients() {
  return apiFetch("/patients/my-patients/");
}

/** (Médecin) Rechercher un patient par nom/email dans tout le système */
export async function searchPatients(q) {
  return apiFetch(`/patients/search/?q=${encodeURIComponent(q)}`);
}

/** (Médecin) Envoyer une demande de liaison à un patient */
export async function sendLinkRequest(patientId) {
  return apiFetch("/patients/link-requests/", {
    method: "POST",
    body: JSON.stringify({ patient_id: patientId }),
  });
}

/** (Patient) Lister les demandes d'accès en attente */
export async function getMyLinkRequests() {
  return apiFetch("/patients/my-link-requests/");
}

/** (Patient) Répondre à une demande d'accès */
export async function respondLinkRequest(id, action) {
  return apiFetch(`/patients/link-requests/${id}/respond/`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

/** (Médecin) Résilier la liaison avec un patient */
export async function unlinkPatient(patientId) {
  return apiFetch(`/patients/${patientId}/unlink/`, { method: "POST" });
}

/** (Médecin) Créer un patient sans compte */
export async function createExternalPatient(data) {
  return apiFetch("/patients/external/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** (Médecin) Lister ses patients sans compte */
export async function getExternalPatients() {
  return apiFetch("/patients/external/");
}

/** (Médecin) Détail d'un patient externe */
export async function getExternalPatient(externalPatientId) {
  return apiFetch(`/patients/external/${externalPatientId}/`);
}

/** (Médecin) Mettre à jour un patient externe */
export async function updateExternalPatient(externalPatientId, data) {
  return apiFetch(`/patients/external/${externalPatientId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** (Médecin) Supprimer un patient externe */
export async function deleteExternalPatient(externalPatientId) {
  return apiFetch(`/patients/external/${externalPatientId}/`, { method: "DELETE" });
}

/** (Médecin) Ordonnances d'un patient sans compte */
export async function getExternalPatientPrescriptions(externalPatientId) {
  return apiFetch(`/patients/external/${externalPatientId}/prescriptions/`);
}

/** (Médecin) Comptes rendus d'un patient sans compte */
export async function getExternalPatientConsultations(externalPatientId) {
  return apiFetch(`/patients/external/${externalPatientId}/consultations/`);
}

/** (Médecin) Créer un compte rendu pour un patient sans compte */
export async function createExternalPatientConsultation(externalPatientId, data) {
  return apiFetch(`/patients/external/${externalPatientId}/consultations/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Garde-malade : patients assignés + dashboard ─────────────────────────────

/**
 * (Garde-malade) Dashboard : patients acceptés + nb demandes en attente
 * GET /api/caretaker/dashboard/
 */
export async function getCaretakerDashboard() {
  return apiFetch("/caretaker/dashboard/");
}

/**
 * (Garde-malade) Lire son propre profil professionnel
 * GET /api/caretaker/profile/
 */
export async function getCaretakerProfile() {
  return apiFetch("/caretaker/profile/");
}

/**
 * (Garde-malade) Mettre à jour son profil professionnel
 * PATCH /api/caretaker/profile/
 */
export async function updateCaretakerProfile(data) {
  return apiFetch("/caretaker/profile/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * (Garde-malade ou Patient) Liste des demandes de soins
 * GET /api/caretaker/requests/
 */
export async function getCareRequests() {
  return apiFetch("/caretaker/requests/");
}

/**
 * (Patient) Crée une nouvelle demande de soins
 * POST /api/caretaker/requests/
 */
export async function createCareRequest(data) {
  return apiFetch("/caretaker/requests/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * (Patient) Annule sa propre demande de soins (pending ou accepted)
 * DELETE /api/caretaker/requests/{id}/
 */
export async function cancelCareRequest(careRequestId) {
  return apiFetch(`/caretaker/requests/${careRequestId}/`, { method: "DELETE" });
}

/**
 * (Garde-malade) Répondre à une offre (accepter / refuser)
 * POST /api/caretaker/requests/{id}/respond_to_offer/
 * @param {number} requestId
 * @param {"accepted"|"rejected"} status
 */
export async function respondToCareRequest(requestId, status) {
  return apiFetch(`/caretaker/requests/${requestId}/respond_to_offer/`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

/**
 * (Garde-malade) Se résilier d'un patient (mettre fin à la prise en charge)
 * POST /api/caretaker/requests/{id}/terminate/
 */
export async function resignFromPatient(careRequestId, reason = "") {
  return apiFetch(`/caretaker/requests/${careRequestId}/terminate/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/**
 * (Garde-malade) Liste des ordonnances de ses patients assignés
 * GET /api/prescriptions/caregiver-patients/
 */
export async function getCaretakerPatientsPrescriptions() {
  return apiFetch("/prescriptions/caregiver-patients/");
}

// ─── Plans médicamenteux (garde-malade) ──────────────────────────────────────

/** Liste tous les plans médicamenteux du garde-malade connecté */
export async function getMedicationSchedules() {
  return apiFetch("/caretaker/medication-schedules/");
}

/** Crée un nouveau plan pour un patient (via care_request_id) */
export async function createMedicationSchedule(data) {
  return apiFetch("/caretaker/medication-schedules/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Met à jour les médicaments d'un plan existant */
export async function updateMedicationSchedule(scheduleId, data) {
  return apiFetch(`/caretaker/medication-schedules/${scheduleId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Supprime un plan médicamenteux */
export async function deleteMedicationSchedule(scheduleId) {
  return apiFetch(`/caretaker/medication-schedules/${scheduleId}/`, {
    method: "DELETE",
  });
}

/**
 * (Patient/Médecin) Dashboard endpoint dédié
 * GET /api/patients/dashboard/  ou  GET /api/doctors/dashboard/
 */
export async function getPatientDashboard() {
  return apiFetch("/patients/dashboard/");
}

export async function getDoctorDashboard() {
  return apiFetch("/doctors/dashboard/");
}

// IMP-02 : getCaretakerServices supprimée car non utilisée.

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES EXPORTÉS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie si l'utilisateur est connecté (token présent)
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Change le mot de passe de l'utilisateur connecté
 * @param {object} data — { old_password, new_password }
 */
export async function changePassword(data) {
  return apiFetch("/auth/password/change/", {
    method: "POST",
    body: JSON.stringify({
      old_password: data.currentPassword || data.old_password,
      new_password: data.newPassword || data.new_password,
      new_password_confirm: data.newPasswordConfirm || data.newPassword || data.new_password,
    }),
  });
}

// ─── Inscription — pré-vérification email (étape 1.5) ────────────────────────

/**
 * Envoie un OTP à l'email pour vérifier qu'il est disponible avant inscription.
 * @param {string} email
 */
export async function sendRegisterOTP(email) {
  return apiFetch("/auth/register/send-otp/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Vérifie le code OTP de pré-inscription (sans le marquer utilisé).
 * @param {string} email
 * @param {string} code — 6 chiffres
 */
export async function verifyRegisterOTP(email, code) {
  return apiFetch("/auth/register/verify-otp/", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

// ─── Mot de passe oublié — flux 3 étapes ─────────────────────────────────────

/**
 * Étape 1 : demande l'envoi d'un OTP par email.
 * Le backend répond toujours 200 (anti-énumération).
 * @param {string} email
 */
export async function requestPasswordReset(email) {
  return apiFetch("/auth/password/reset/request/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Étape 2 : valide le code OTP et récupère un reset_token signé.
 * @param {string} email
 * @param {string} code — OTP à 6 chiffres
 * Returns: { message, reset_token }
 */
export async function verifyResetCode(email, code) {
  return apiFetch("/auth/password/reset/verify/", {
    method: "POST",
    body: JSON.stringify({ email, otp: code }),
  });
}

/**
 * Étape 3 : définit le nouveau mot de passe via le reset_token.
 * @param {string} token — reset_token reçu à l'étape 2
 * @param {string} newPassword
 * @param {string} confirmPassword
 */
export async function confirmPasswordReset(token, newPassword, confirmPassword) {
  return apiFetch("/auth/password/reset/set/", {
    method: "POST",
    body: JSON.stringify({
      reset_token: token,
      new_password: newPassword,
      new_password_confirm: confirmPassword,
    }),
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// 8. DOSSIER PATIENT (vue médecin)  →  /api/doctor/patients/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * (Médecin) Récupère le dossier médical complet d'un patient
 * @param {number} patientId
 * Returns: { profile, medical_profile, history, lab_results, prescriptions }
 */
export async function getPatientRecord(patientId) {
  return apiFetch(`/doctor/patients/${patientId}/record/`);
}

/**
 * (Médecin) Ajoute une ordonnance dans le dossier d'un patient
 * @param {object} data — { patient_id, medication, dosage, frequency, duration, ... }
 */
export async function addPrescription(data) {
  return apiFetch("/consultations/prescriptions/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * (Médecin) Crée une ordonnance "rapide" sans rendez-vous parent.
 * Le backend crée automatiquement une consultation détachée.
 * POST /api/prescriptions/quick/
 * @param {object} data — { patient_id, chief_complaint, notes, valid_until?, items: [{drug_name, dosage, frequency, duration, instructions?, quantity?}] }
 */
export async function createQuickPrescription(data) {
  return apiFetch("/prescriptions/quick/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. CONSULTATION SESSION  →  /api/appointments/ + /api/consultations/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * (Médecin) Démarre une consultation — verrouille le créneau (status → in_progress)
 * @param {number} appointmentId
 * Returns: updated Appointment object
 */
export async function startConsultation(appointmentId) {
  return apiFetch(`/appointments/${appointmentId}/start/`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

/**
 * (Médecin) Complète une session de consultation en créant la consultation + l'ordonnance
 * @param {object} payload — voir shape dans la doc
 * Returns: Consultation object with prescription_token + prescription_qr_url
 */
export async function completeSession(payload) {
  return apiFetch("/consultations/complete-session/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Recherche de médicaments par nom
 * Backend route : /api/medications/registry/ (router DRF dans medications/urls.py)
 * @param {string} query — terme de recherche (min 2 chars)
 * Returns: array of { id, name, dosage_form, strength }
 */
export async function searchMedications(query) {
  return apiFetch(`/medications/registry/?search=${encodeURIComponent(query)}`);
}

/**
 * Liste des gardes-malades disponibles (vue patient)
 * Returns: array of caretaker profiles
 */
export async function getCaretakers(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/caretaker/search/${params ? "?" + params : ""}`);
}

/**
 * Exporte clearTokens pour que AuthContext puisse l'utiliser
 */
export { clearTokens };

// ─────────────────────────────────────────────────────────────────────────────
// DOSSIER PATIENT — écriture par le médecin
// POST /api/doctor/patients/{id}/add-diagnosis/
// POST /api/doctor/patients/{id}/add-treatment/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * (Médecin) Ajoute un diagnostic/antécédent dans le dossier du patient
 * @param {number} patientId
 * @param {object} data — { condition: str, description?: str, diagnosis_date?: "YYYY-MM-DD" }
 */
export async function addDiagnosisToPatient(patientId, data) {
  return apiFetch(`/doctor/patients/${patientId}/add-diagnosis/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * (Médecin) Ajoute un traitement en cours dans le dossier du patient
 * @param {number} patientId
 * @param {object} data — { medication_name: str, dosage?: str, start_date?: "YYYY-MM-DD", end_date?: "YYYY-MM-DD" }
 */
export async function addTreatmentToPatient(patientId, data) {
  return apiFetch(`/doctor/patients/${patientId}/add-treatment/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GARDE-MALADE — tâches  →  /api/caretaker/tasks/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * (Garde-malade / Patient) Liste les tâches (filtrées par rôle côté backend)
 */
export async function getCaretakerTasks() {
  return apiFetch("/caretaker/tasks/");
}

/**
 * (Garde-malade) Crée une tâche liée à une demande de soins acceptée
 * @param {object} data — { care_request: uuid, title: str, description?: str, due_date?: "YYYY-MM-DD" }
 */
export async function createCaretakerTask(data) {
  return apiFetch("/caretaker/tasks/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * (Garde-malade) Mise à jour partielle d'une tâche (ex: marquer comme effectuée)
 * @param {number|string} taskId
 * @param {object} data — { status: "done" | "cancelled", title?, description?, due_date? }
 */
export async function updateCaretakerTask(taskId, data) {
  return apiFetch(`/caretaker/tasks/${taskId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * (Garde-malade) Supprime une tâche
 * @param {number|string} taskId
 */
export async function deleteCaretakerTask(taskId) {
  return apiFetch(`/caretaker/tasks/${taskId}/`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — stats alias
// ─────────────────────────────────────────────────────────────────────────────

/**
 * (Admin) Statistiques globales — alias de getAdminDashboard()
 * GET /api/admin/stats/
 */
export async function getAdminStats() {
  return apiFetch("/admin/stats/");
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — fonctions supplémentaires
// ─────────────────────────────────────────────────────────────────────────────

/** (Admin) Approuver un professionnel (médecin / pharmacien / garde-malade) */
export async function verifyUser(userId) {
  return apiFetch(`/admin/users/${userId}/verify_professional/`, { method: "POST" });
}

/** (Admin) Récupérer tous les utilisateurs avec filtres (role, search, etc.) */
export async function getAdminUsers(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/admin/users/${params ? "?" + params : ""}`);
}

/** Alias pour compatibilité héritée */
export const getUsers = getAdminUsers;

/** (Admin) Mettre à jour un utilisateur (admin total access) */
export async function updateAdminUser(userId, data) {
  return apiFetch(`/admin/users/${userId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** (Admin) Liste des pros en attente de validation */
export async function getPendingDoctors() {
  return apiFetch("/admin/users/?verification_status=pending");
}

/** (Admin) Rejeter un professionnel avec motif */
export async function rejectUser(userId, reason = "") {
  return apiFetch(`/admin/users/${userId}/reject_professional/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/** (Admin) Suspendre / Réactiver un utilisateur */
export async function toggleSuspendUser(userId) {
  return apiFetch(`/admin/users/${userId}/toggle_suspend/`, { method: "POST" });
}

/** (Admin) Journal d'audit — filtres optionnels : ?level=success|warning|error|info */
export async function getAuditLogs(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/admin/audit-logs/${params ? "?" + params : ""}`);
}

/** (Admin) Dashboard global : KPIs de la plateforme */
export async function getAdminDashboard() {
  return apiFetch("/admin/dashboard/");
}

/** (Admin) État système : versions backend/DB, statut email, compteurs users */
export async function getSystemStatus() {
  return apiFetch("/admin/system-status/");
}

/** (Admin) Catalogue médicaments — ?search=nom&category=cardio */
export async function getMedications(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/medications/registry/${params ? "?" + params : ""}`);
}

/** (Admin) Liste des pharmacies */
export async function getAllPharmacies(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/pharmacy/list/${params ? "?" + params : ""}`);
}

/** (Admin) Commandes pharmacie — filtres optionnels */
export async function getPharmacyOrders(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/pharmacy/orders/${params ? "?" + params : ""}`);
}

/** (Admin) Demandes de soins garde-malade — filtres optionnels */
export async function getAdminCareRequests(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/caretaker/requests/${params ? "?" + params : ""}`);
}

/** (Admin) Tous les rendez-vous — filtres : ?status=pending&... */
export async function getAdminAppointments(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/admin/appointments/${params ? "?" + params : ""}`);
}

/** (Admin) Liste des garde-malades */
export async function getAllCaretakers(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/caretaker/search/${params ? "?" + params : ""}`);
}

/** (Admin) File d'attente consultation dynamique */
export async function getAdminQueue(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/admin/queue/${params ? "?" + params : ""}`);
}

/** (Admin) Changer le statut d'une consultation en file d'attente */
export async function updateQueueStatus(id, status) {
  return apiFetch(`/admin/queue/${id}/update_status/`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

/** (Admin) Créer un nouveau médicament dans le catalogue */
export async function createMedication(data) {
  return apiFetch("/medications/registry/", { method: "POST", body: JSON.stringify(data) });
}

/** (Admin) Rejeter un document soumis par un médecin */
export async function rejectDoctorDocument(doctorId, docId) {
  return apiFetch(`/admin/doctors/${doctorId}/documents/${docId}/reject/`, { method: "POST" });
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT  →  /api/chat/
// Ces fonctions échoueront silencieusement tant que le backend n'est pas prêt.
// Quand le backend sera branché, rien d'autre ne changera côté front.
// ─────────────────────────────────────────────────────────────────────────────

/** Liste les conversations de l'utilisateur connecté */
export async function getConversations() {
  return apiFetch("/chat/conversations/");
}

/**
 * Crée une nouvelle conversation (patient uniquement)
 * @param {number} interlocutorId — id du pharmacien ou garde-malade
 */
export async function createConversation(interlocutorId) {
  return apiFetch("/chat/conversations/", {
    method: "POST",
    body: JSON.stringify({ interlocutor_id: interlocutorId }),
  });
}

/**
 * Récupère les messages d'une conversation (paginé)
 * @param {number} conversationId
 */
export async function getMessages(conversationId) {
  return apiFetch(`/chat/conversations/${conversationId}/messages/`);
}

/**
 * Envoie un message dans une conversation (texte et/ou fichier)
 * @param {number} conversationId
 * @param {string} content
 * @param {File|null} file
 */
export async function sendMessage(conversationId, content, file = null) {
  if (file) {
    const form = new FormData();
    if (content) form.append("content", content);
    form.append("file", file);
    return apiFetch(`/chat/conversations/${conversationId}/messages/`, {
      method: "POST",
      body: form,
    });
  }
  return apiFetch(`/chat/conversations/${conversationId}/messages/`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

/**
 * Modifie un message existant
 * @param {number} messageId
 * @param {string} content
 */
export async function updateMessage(messageId, content) {
  return apiFetch(`/chat/messages/${messageId}/`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

/**
 * Supprime (désactive) un message
 * @param {number} messageId
 */
export async function deleteMessage(messageId) {
  return apiFetch(`/chat/messages/${messageId}/`, {
    method: "DELETE",
  });
}

/**
 * Marque tous les messages de l'interlocuteur comme lus
 * @param {number} conversationId
 */
export async function markConversationRead(conversationId) {
  return apiFetch(`/chat/conversations/${conversationId}/read/`, {
    method: "POST",
  });
}

/**
 * Bloquer un utilisateur
 * @param {number} userId
 */
export async function deleteConversation(conversationId) {
  return apiFetch(`/chat/conversations/${conversationId}/`, { method: "DELETE" });
}

export async function blockUser(userId) {
  return apiFetch(`/chat/block/${userId}/`, { method: "POST" });
}

export async function unblockUser(userId) {
  return apiFetch(`/chat/block/${userId}/`, { method: "DELETE" });
}

/**
 * Signaler un utilisateur aux administrateurs.
 * @param {number} userId
 * @param {string} reason
 * @param {string} [category] - "harassment" | "spam" | "fraud" | "inappropriate" | "misinformation" | "other"
 */
export async function reportUser(userId, reason, category = "other") {
  return apiFetch("/chat/report/", {
    method: "POST",
    body: JSON.stringify({ reported_user_id: userId, reason, category }),
  });
}

/**
 * Récupère tous les signalements (Admin uniquement)
 */
export async function getReports() {
  return apiFetch("/chat/reports/");
}

/**
 * Traite un signalement (Admin uniquement) avec une vraie action de modération.
 * @param {number} reportId
 * @param {string} action - "warn" | "suspend" | "dismiss"
 *   - warn    : avertit le user signalé (notif in-app)
 *   - suspend : désactive le compte du user signalé + notif
 *   - dismiss : signalement classé sans suite
 * @param {string} [notes] - notes internes admin (visibles dans le détail du report)
 */
export async function handleReportAction(reportId, action, notes = "") {
  return apiFetch(`/chat/reports/${reportId}/action/`, {
    method: "POST",
    body: JSON.stringify({ action, notes }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. DIAGNOSTIC IA  →  /api/diagnostic/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoie les symptômes pour analyse IA (Streaming ou Normal)
 * @param {object} data — { symptoms, lang, history }
 */
export async function analyzeSymptoms(data) {
  return apiFetch("/diagnostic/chat/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Version streaming pour une expérience plus fluide (type ChatGPT)
 * @param {object} data — { symptoms, lang, history }
 * @param {function} onChunk — callback appelé pour chaque morceau de texte
 * @param {function} onMeta — callback appelé pour les données (urgence, spécialiste...)
 */
export async function analyzeSymptomsStream(data, onChunk, onMeta, onAlert = () => {}) {
  const token = getToken();
  const response = await fetch(buildUrl("/diagnostic/chat/stream/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Erreur streaming");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6).trim();
        if (dataStr === "[DONE]") continue;
        try {
          const payload = JSON.parse(dataStr);
          if (payload.type === "chunk") onChunk(payload.text);
          if (payload.type === "alert") onAlert(payload);
          if (payload.type === "meta" || payload.type === "session_saved") onMeta(payload);
        } catch (e) {
          console.warn("Erreur parsing stream chunk:", e);
        }
      }
    }
  }
}

/**
 * Analyse un document médical en streaming (SSE)
 * @param {File} file
 * @param {string} message — question du patient
 * @param {string} lang
 * @param {Array} history — historique de la conversation
 * @param {function} onChunk — callback pour chaque morceau de texte
 * @param {function} onMeta — callback pour les métadonnées (file_type, clarification)
 */
export async function analyzeMedicalFileStream(file, message = "", lang = "fr", history = [], onChunk, onMeta) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("message", message);
  formData.append("lang", lang);
  formData.append("history", JSON.stringify(history));

  const response = await fetch(buildUrl("/diagnostic/chat/analyze-file/"), {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) throw new Error(`Erreur analyse fichier: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const dataStr = line.slice(6).trim();
      if (dataStr === "[DONE]") return;
      try {
        const payload = JSON.parse(dataStr);
        if (payload.type === "chunk") onChunk?.(payload.text);
        else if (payload.type === "file_type" || payload.type === "clarification") onMeta?.(payload);
      } catch { /* chunk mal formé — ignorer */ }
    }
  }
}

// Les endpoints /diagnostic/chat/sessions/* sont réservés au rôle "patient"
// côté backend (SessionListView/SessionDetailView). On évite l'appel pour
// les autres rôles → pas de 404 inutiles dans la console DevTools.
function _isPatient() {
  return (localStorage.getItem("mock_role") || "").toLowerCase() === "patient";
}

/** Récupère les sessions de conversation IA passées (patient uniquement) */
export async function getAISessions() {
  if (!_isPatient()) return { sessions: [] };
  return apiFetch("/diagnostic/chat/sessions/");
}

/** Récupère le détail (historique complet) d'une session IA (patient uniquement) */
export async function getAISession(sessionId) {
  if (!_isPatient()) return null;
  return apiFetch(`/diagnostic/chat/sessions/${sessionId}/`);
}

/** Supprime une session IA par son identifiant (patient uniquement) */
export async function deleteAISession(sessionId) {
  if (!_isPatient()) return null;
  return apiFetch(`/diagnostic/chat/sessions/${sessionId}/`, { method: "DELETE" });
}

/** Récupère l'historique complet des interactions IA */
export async function getAIHistory() {
  if (!_isPatient()) return { results: [] };
  return apiFetch("/diagnostic/chat/history/");
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * (Admin) Récupère la liste des demandes de changement de profil
 */
export async function getAdminProfileUpdates() {
  return apiFetch("/admin/profile-updates/");
}

/**
 * (Admin) Approuve ou rejette une demande de changement de profil
 * @param {number} requestId
 * @param {string} action — "approve" | "reject"
 * @param {string} notes — motif du rejet (optionnel)
 */
export async function actionProfileUpdate(requestId, action, notes = "") {
  return apiFetch(`/admin/profile-updates/${requestId}/action/`, {
    method: "POST",
    body: JSON.stringify({ action, ...(notes ? { notes } : {}) }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT ADMIN — disponible depuis toutes les pages Paramètres
// ─────────────────────────────────────────────────────────────────────────────

/**
 * (Tous rôles) Envoie une demande à l'administrateur depuis Paramètres
 * @param {object} data — { category, subject, message }
 */
export async function createAdminContactRequest(data) {
  return apiFetch("/admin/contact-requests/me/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * (Tous rôles) Liste mes propres demandes envoyées à l'admin
 */
export async function getMyAdminContactRequests() {
  return apiFetch("/admin/contact-requests/me/");
}

/**
 * (Admin) Liste toutes les demandes reçues
 * @param {object} params — { status, category, search }
 */
export async function getAdminContactRequests(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  ).toString();
  return apiFetch(`/admin/contact-requests/${qs ? "?" + qs : ""}`);
}

/**
 * (Admin) Répond / change le statut d'une demande
 * @param {number} requestId
 * @param {object} payload — { status, admin_response }
 */
export async function respondAdminContactRequest(requestId, payload) {
  return apiFetch(`/admin/contact-requests/${requestId}/respond/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}