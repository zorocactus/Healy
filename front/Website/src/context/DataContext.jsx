import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import * as api from "../services/api";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convertit un plan médicamenteux backend → format utilisé dans le frontend */
function normalizeSchedule(s) {
  const meds = s.medications || {};
  return {
    id:          s.id,
    patient_id:  s.patient_id,
    patientName: s.patient_name || "",
    initials:    (s.patient_name || "?")
                   .split(" ")
                   .map(w => w[0])
                   .join("")
                   .toUpperCase()
                   .slice(0, 2),
    condition:   s.condition || "",
    status:      "Active",
    morning:     meds.morning   || [],
    afternoon:   meds.afternoon || [],
    evening:     meds.evening   || [],
    care_request: s.care_request,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }) {
  const { userData } = useAuth();
  const [patients, setPatients]               = useState([]);
  const [appointments, setAppointments]       = useState([]);
  const [patientRequests, setPatientRequests] = useState([]);
  const [prescriptions, setPrescriptions]     = useState([]);
  const [gmPatients, setGmPatients]           = useState([]);
  const [gmTreatments, setGmTreatments]       = useState([]);
  const [globalNotifications, setGlobalNotifications] = useState([]);
  const [unreadChatCount, setUnreadChatCount]         = useState(0);
  const [globalSearch, setGlobalSearch]               = useState("");
  const [dashboardData, setDashboardData]             = useState(null);
  const chatPollRef = useRef(null);

  // ── Notifications ──────────────────────────────────────────────────────────
  //
  // Le state `globalNotifications` mélange deux sources :
  //   1. Notifs réelles du backend (charge via api.getNotifications)
  //   2. Notifs locales transitoires (erreurs côté client) flaggées `local: true`
  // Les deux exposent le même schéma : { id, title, message, type, is_read, created_at, local }

  function normalizeServerNotif(n) {
    return {
      id:         n.id,
      title:      n.title || "",
      message:    n.message || "",
      type:       n.notification_type || "system",
      is_read:    !!n.is_read,
      created_at: n.created_at,
      local:      false,
    };
  }

  const refreshGlobalNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      const list = Array.isArray(data) ? data : (data?.results || []);
      const server = list.map(normalizeServerNotif);
      // Préserve les notifs locales transitoires (erreurs client) en tête de liste
      setGlobalNotifications(prev => {
        const local = prev.filter(n => n.local);
        return [...local, ...server];
      });
    } catch { /* silencieux : on ne casse pas l'app pour une notif */ }
  }, []);

  function addNotification(title, message, type = "info") {
    setGlobalNotifications(prev => [
      {
        id:         `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title, message, type,
        is_read:    false,
        created_at: new Date().toISOString(),
        local:      true,
      },
      ...prev,
    ]);
  }

  function addErrorNotification(message) {
    addNotification("Erreur", message, "error");
  }

  async function markNotificationRead(id) {
    setGlobalNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    // Pas d'appel API pour les notifs locales (id préfixé "local-")
    if (typeof id === 'number') {
      try { await api.markNotificationRead(id); } catch { /* silencieux */ }
    }
  }

  async function markAllNotificationsRead() {
    setGlobalNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try { await api.markAllNotificationsRead(); } catch { /* silencieux */ }
  }

  // ── Chat polling ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userData) return;
    const fetchUnread = async () => {
      try {
        const data = await api.getConversations();
        if (Array.isArray(data)) {
          const total = data.reduce((acc, c) => acc + (c.unread || 0), 0);
          setUnreadChatCount(total);
        }
      } catch { /* silencieux */ }
    };
    fetchUnread();
    chatPollRef.current = setInterval(fetchUnread, 60_000);
    return () => clearInterval(chatPollRef.current);
  }, [userData?.role]);

  // ── Refresh functions ───────────────────────────────────────────────────────

  const refreshDoctorAppointments = useCallback(async () => {
    try {
      const data = await api.getDoctorAppointments();
      setAppointments(Array.isArray(data) ? data : (data?.results || []));
    } catch (e) {
      addErrorNotification("Impossible de charger les rendez-vous : " + e.message);
    }
  }, []);

  const refreshDashboardData = useCallback(async () => {
    try {
      const data = await api.getDoctorDashboard();
      if (data) setDashboardData(data);
    } catch { /* silencieux pour le dashboard */ }
  }, []);

  const refreshPatientRequests = useCallback(async () => {
    try {
      const data = await api.getPendingAppointments();
      setPatientRequests(Array.isArray(data) ? data : (data?.results || []));
    } catch (e) {
      addErrorNotification("Impossible de charger les demandes de patients : " + e.message);
    }
  }, []);

  const refreshDoctorPatients = useCallback(async () => {
    try {
      const data = await api.getDoctorPatients();
      setPatients(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (e) {
      setPatients([]);
      addErrorNotification("Impossible de charger la liste des patients : " + e.message);
    }
  }, []);

  const refreshDoctorPrescriptions = useCallback(async () => {
    try {
      const data = await api.getMyPrescriptions();
      setPrescriptions(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (e) {
      addErrorNotification("Impossible de charger les ordonnances : " + e.message);
    }
  }, []);

  const refreshGmPatients = useCallback(async () => {
    try {
      const data = await api.getCaretakerDashboard();
      setGmPatients(Array.isArray(data?.my_patients) ? data.my_patients : []);
    } catch (e) {
      setGmPatients([]);
      addErrorNotification("Impossible de charger vos patients : " + e.message);
    }
  }, []);

  const refreshGmTreatments = useCallback(async () => {
    try {
      const data = await api.getMedicationSchedules();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setGmTreatments(list.map(normalizeSchedule));
    } catch (e) {
      setGmTreatments([]);
      addErrorNotification("Impossible de charger les plans médicamenteux : " + e.message);
    }
  }, []);

  // ── Mount effect ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (userData?.role === "doctor") {
      refreshDoctorAppointments();
      refreshPatientRequests();
      refreshDoctorPatients();
      refreshDashboardData();
      refreshDoctorPrescriptions();
      refreshGlobalNotifications();
      // Poll modéré (60s) pour ne pas saturer le throttle backend.
      // Les données rarement changeantes (patients, prescriptions) ne sont pas
      // rafraîchies dans le poll — elles le seront sur action utilisateur.
      const poll = setInterval(() => {
        refreshPatientRequests();
        refreshDoctorAppointments();
        refreshGlobalNotifications();
      }, 60_000);
      return () => clearInterval(poll);
    } else if (userData?.role === "caretaker") {
      refreshGmPatients();
      refreshGmTreatments();
      refreshGlobalNotifications();
      // Poll uniquement notifs (les données changent rarement).
      const poll = setInterval(refreshGlobalNotifications, 90_000);
      return () => clearInterval(poll);
    } else if (userData?.role === "patient" || userData?.role === "pharmacist") {
      refreshGlobalNotifications();
      const poll = setInterval(refreshGlobalNotifications, 90_000);
      return () => clearInterval(poll);
    } else {
      setAppointments([]);
      setPatientRequests([]);
      setPatients([]);
      setDashboardData(null);
      setGmPatients([]);
      setGmTreatments([]);
      setGlobalNotifications([]);
    }
  }, [userData?.role]);

  // ── Prescriptions helpers ───────────────────────────────────────────────────

  function addPrescription(rx) {
    setPrescriptions(prev => [rx, ...prev]);
  }

  async function loadGMDemoData() {
    await Promise.all([refreshGmPatients(), refreshGmTreatments()]);
  }

  // ── Medication schedule mutations (avec appel API + mise à jour optimiste) ──

  async function addMedicationToTreatment(scheduleId, timeSlot, newMed) {
    const current = gmTreatments.find(t => t.id === scheduleId);
    if (!current) return;

    const updatedMeds = {
      morning:   current.morning,
      afternoon: current.afternoon,
      evening:   current.evening,
      [timeSlot]: [...(current[timeSlot] || []), { ...newMed, done: false }],
    };

    // Mise à jour optimiste immédiate
    setGmTreatments(prev => prev.map(t =>
      t.id === scheduleId ? { ...t, ...updatedMeds } : t
    ));

    try {
      await api.updateMedicationSchedule(scheduleId, { medications: updatedMeds });
    } catch (e) {
      // Rollback si l'API échoue
      setGmTreatments(prev => prev.map(t =>
        t.id === scheduleId ? current : t
      ));
      addErrorNotification("Impossible d'ajouter le médicament : " + e.message);
    }
  }

  async function removeMedicationFromTreatment(scheduleId, timeSlot, medIndex) {
    const current = gmTreatments.find(t => t.id === scheduleId);
    if (!current) return;

    const updatedMeds = {
      morning:   current.morning,
      afternoon: current.afternoon,
      evening:   current.evening,
      [timeSlot]: (current[timeSlot] || []).filter((_, i) => i !== medIndex),
    };

    setGmTreatments(prev => prev.map(t =>
      t.id === scheduleId ? { ...t, ...updatedMeds } : t
    ));

    try {
      await api.updateMedicationSchedule(scheduleId, { medications: updatedMeds });
    } catch (e) {
      setGmTreatments(prev => prev.map(t =>
        t.id === scheduleId ? current : t
      ));
      addErrorNotification("Impossible de supprimer le médicament : " + e.message);
    }
  }

  async function addPatientToTreatments(patient) {
    // Vérifie par care_request (clé unique) pour éviter les doublons même si l'état est désynchronisé
    if (gmTreatments.find(t => String(t.care_request) === String(patient.care_request_id))) return;

    try {
      const created = await api.createMedicationSchedule({
        care_request: patient.care_request_id,
        condition:    patient.condition || "",
        medications:  { morning: [], afternoon: [], evening: [] },
      });
      setGmTreatments(prev => [...prev, normalizeSchedule(created)]);
    } catch (e) {
      addErrorNotification("Impossible d'ajouter le patient au plan : " + e.message);
    }
  }

  async function removePatientFromTreatments(scheduleId) {
    const snapshot = gmTreatments;
    setGmTreatments(prev => prev.filter(t => t.id !== scheduleId));

    try {
      await api.deleteMedicationSchedule(scheduleId);
    } catch (e) {
      setGmTreatments(snapshot);
      addErrorNotification("Impossible de retirer le patient : " + e.message);
    }
  }

  // ── Provider value ──────────────────────────────────────────────────────────

  return (
    <DataContext.Provider value={{
      patients, appointments, patientRequests, prescriptions, addPrescription,
      setAppointments, setPatientRequests,
      refreshDoctorAppointments, refreshPatientRequests,
      refreshDoctorPatients, refreshDoctorPrescriptions, refreshGmPatients, refreshGmTreatments,
      dashboardData, refreshDashboardData,
      gmPatients, gmTreatments, loadGMDemoData,
      addMedicationToTreatment, removeMedicationFromTreatment,
      addPatientToTreatments, removePatientFromTreatments,
      globalNotifications, addNotification, markNotificationRead, markAllNotificationsRead, refreshGlobalNotifications,
      unreadChatCount, setUnreadChatCount,
      globalSearch, setGlobalSearch,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData doit être utilisé dans <DataProvider>");
  return ctx;
}
