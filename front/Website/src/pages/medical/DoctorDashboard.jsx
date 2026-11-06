import { useState, useEffect, useRef, useMemo } from "react";
import ErrorBoundary from "../../components/ErrorBoundary";
import DashSelect from "../../components/ui/DashSelect";
import TimePicker from "../../components/ui/TimePicker";
import { ParticlesHero } from '../../components/backgrounds/MedParticles';
import { T } from "../_shared/theme";
import ContactAdminCard from "../../components/ContactAdminCard";
import {
  Users,
  User,
  FileText,
  Star,
  Bell,
  Moon,
  Sun,
  Check,
  X,
  ChevronDown,
  Search,
  Plus,
  Activity,
  LogOut,
  Settings,
  Menu,
  Calendar,
  TrendingUp,
  Clock,
  Eye,
  EyeOff,
  ArrowLeft,
  Send,
  Trash2,
  MapPin,
  Link as LinkIcon,
  Download,
  Zap,
  ChevronRight,
  AlertTriangle,
  QrCode,
  MessageSquare,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import * as api from "../../services/api";
import WeekCalendar from "../../components/medical/WeekCalendar";
import ConversationList from "../../components/chat/ConversationList";
import ChatWindow from "../../components/chat/ChatWindow";
import { format, isSameDay } from "date-fns";

// ============================================================================
// CONSTANTES & UTILITAIRES MUTUALISÉS
// ============================================================================

const AVATAR_COLORS = [
  "#6492C9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#3B82F6",
  "#6366F1",
];
const PAGE_SIZE = 6;
const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "As needed",
];

const DAYS = [
  { day: "Lun" },
  { day: "Mar" },
  { day: "Mer" },
  { day: "Jeu" },
  { day: "Ven" },
  { day: "Sam" },
  { day: "Dim" },
];

function getInitials(a = "", b = "") {
  return `${a[0] || ""}${b[0] || ""}`.toUpperCase();
}

// ─── Reusable components ──────────────────────────────────────────────────────
function Card({ children, className = "", style = {}, dk, empty = false, onClick }) {
  const c = dk ? T.dark : T.light;
  const hoverClasses = empty ? "" : "card-hover";
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm border ${hoverClasses} ${className}`}
      style={{ background: c.card, borderColor: c.border, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function Badge({ color, bg, children, className = "" }) {
  return (
    <span
      className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full border ${className}`}
      style={{ color, background: bg, borderColor: color + "44" }}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, trend, dk, onClick }) {
  const c = dk ? T.dark : T.light;
  return (
    <Card dk={dk} style={{ padding: 18, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: color + "18" }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 text-xs font-bold"
            style={{
              color:
                trend.startsWith("+") || !trend.includes("-")
                  ? "#2D8C6F"
                  : "#E05555",
            }}
          >
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: c.txt }}>
        {value}
      </p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: c.txt2 }}>
        {label}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: c.txt3 }}>
          {sub}
        </p>
      )}
    </Card>
  );
}

// ─── NEW COMPONENT : TODAYS SCHEDULE ──────────────────────────────────────────
function TodaysSchedule({ appointments = [], onStartConsultation }) {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;
  const { t } = useLanguage();
  const [startingId, setStartingId] = useState(null);
  const [startErrors, setStartErrors] = useState({});
  const [cancelTarget, setCancelTarget] = useState(null); // { id, name }
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const { refreshDoctorAppointments, refreshDashboardData } = useData();

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancellingId(cancelTarget.id);
    setCancelError("");
    try {
      await api.doctorCancelAppointment(cancelTarget.id, cancelReason);
      setCancelTarget(null);
      setCancelReason("");
      refreshDoctorAppointments();
      if (typeof refreshDashboardData === "function") refreshDashboardData();
    } catch (err) {
      setCancelError(err.message || "Erreur lors de l'annulation");
    } finally {
      setCancellingId(null);
    }
  };

  const defaultData = [];

  // Defensive array handling
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const data = safeAppointments.length > 0 ? safeAppointments : defaultData;
  const count = data.filter((a) => a.type !== "empty").length;

  const getTypeStyles = (type) => {
    const t = type?.toLowerCase() || "";
    if (
      t.includes("in-person") ||
      t.includes("person") ||
      t.includes("clinic")
    ) {
      return dk
        ? "bg-[#7F77DD]/10 border-[#7F77DD] text-[#A59FEC]"
        : "bg-[#EEF2FB] border-[#7F77DD] text-[#3C3489]";
    }
    if (t.includes("tele")) {
      return dk
        ? "bg-[#1D9E75]/10 border-[#1D9E75] text-[#5ECEA3]"
        : "bg-[#EAF5EE] border-[#1D9E75] text-[#085041]";
    }
    if (t.includes("home") || t.includes("visite")) {
      return dk
        ? "bg-[#EF9F27]/10 border-[#EF9F27] text-[#F4BC6B]"
        : "bg-[#FEF6E4] border-[#EF9F27] text-[#633806]";
    }
    return "";
  };

  return (
    <div
      className={`border rounded-xl p-5 shadow-sm transition-all duration-300 ${
        dk ? "bg-[#141B27] border-[#638ECB]/20" : "bg-white border-[#E4EAF5]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2
          className={`text-lg font-bold ${dk ? "text-[#F0F3FA]" : "text-[#0D1B2E]"}`}
        >
          {t('dashboard.doctor.schedule.title')}
        </h2>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            dk
              ? "bg-[#638ECB]/10 text-[#8AAEE0] border-[#4A6FA5]/20"
              : "bg-[#EEF2FB] text-[#4A6FA5] border-[#4A6FA5]/20"
          }`}
        >
          {t('dashboard.doctor.schedule.appointmentsCount', { count })}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {data.map((item, idx) => {
          // Normalize field names: API returns patient_name + start_time; mock uses name/patient + time
          const displayName = item.patient_name || item.name || item.patient || "—";
          const displayTime = item.time || (item.start_time ? item.start_time.slice(0, 5) : "");
          const displayType = item.type || item.motif || "Consultation";
          const itemStatus  = item.status?.toLowerCase() || "";
          return (
          <div key={idx} className="flex items-start gap-4">
            {/* Time Column */}
            <div className="w-12 shrink-0 py-2">
              <span
                className={`text-sm font-bold ${dk ? "text-[#8AAEE0]" : "text-[#5A6E8A]"}`}
              >
                {displayTime}
              </span>
            </div>

            {/* Entry Column */}
            <div className="flex-1">
              {displayType === "empty" ? (
                <div className="h-full flex items-center min-h-[40px]">
                  <div
                    className={`w-full border-b border-dashed ${dk ? "border-[#638ECB]/20" : "border-[#E4EAF5]"}`}
                  />
                </div>
              ) : (
                <div
                  className={`py-3 px-4 border-l-[3px] rounded-r-lg shadow-sm transition-all hover:translate-x-1 ${getTypeStyles(displayType)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate">
                      {displayName}{" "}
                      <span className="mx-1 opacity-40">·</span> {displayType}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {onStartConsultation && (itemStatus === "confirmed" || itemStatus === "scheduled") && (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            disabled={startingId === item.id}
                            onClick={async () => {
                              setStartingId(item.id);
                              setStartErrors((p) => ({ ...p, [item.id]: null }));
                              try {
                                const updated = await api.startConsultation(item.id);
                                onStartConsultation(updated || { ...item, status: "in_progress" });
                              } catch (err) {
                                setStartErrors((p) => ({ ...p, [item.id]: err.message || "Erreur" }));
                                setStartingId(null);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                            style={{ background: c.blue }}
                          >
                            {startingId === item.id ? (
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                            ) : "▶"} {t('dashboard.doctor.consultation.start')}
                          </button>
                          {startErrors[item.id] && (
                            <p className="text-xs font-semibold mt-1 px-2 py-1 rounded-lg" style={{ color: c.red, background: c.red + "15" }}>{startErrors[item.id]}</p>
                          )}
                        </div>
                      )}
                      {(itemStatus === "confirmed" || itemStatus === "pending" || itemStatus === "scheduled") && (
                        <button
                          onClick={() => { setCancelTarget({ id: item.id, name: displayName }); setCancelReason(""); setCancelError(""); }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all hover:opacity-80"
                          style={{ color: c.red, borderColor: c.red + "44", background: c.red + "10" }}
                          title="Annuler ce rendez-vous"
                        >
                          <X size={12} /> Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* ── Modal confirmation annulation ── */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setCancelTarget(null); }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden" style={{ background: dk ? "#141B27" : "#fff", borderColor: c.border }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.red + "18" }}>
                  <X size={18} style={{ color: c.red }} />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: c.txt }}>Annuler le rendez-vous</h3>
                  <p className="text-xs" style={{ color: c.txt3 }}>Le patient recevra une notification</p>
                </div>
              </div>
              <button onClick={() => setCancelTarget(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ background: c.bg }}>
                <X size={16} style={{ color: c.txt3 }} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm" style={{ color: c.txt2 }}>
                Annuler le RDV de <strong style={{ color: c.txt }}>{cancelTarget.name}</strong> ?
              </p>
              <div className="relative">
                <span className="absolute -top-2.5 left-3 px-1 text-[11px] font-medium" style={{ color: c.txt3, background: dk ? "#141B27" : "#fff" }}>Motif (optionnel)</span>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="ex : Indisponibilité imprévue"
                  className="w-full px-3 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: c.border, background: dk ? "#0D1117" : "#F8FAFC", color: c.txt }}
                />
              </div>
              {cancelError && <p className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ color: c.red, background: c.red + "15" }}>{cancelError}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleCancelConfirm}
                disabled={cancellingId === cancelTarget.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: c.red }}
              >
                {cancellingId === cancelTarget.id
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><X size={15} /> Confirmer l'annulation</>}
              </button>
              <button onClick={() => setCancelTarget(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border hover:opacity-80" style={{ borderColor: c.border, color: c.txt2 }}>
                Garder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NEW COMPONENT : PATIENT REQUESTS ─────────────────────────────────────────

// Plus de données fictives — l'UI affiche un état vide propre si le backend retourne [].
const MOCK_REQUESTS = [];

function PatientRequests({ requests, onStartConsultation }) {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;
  const { t } = useLanguage();
  const [startingId, setStartingId] = useState(null);
  const [startErrors, setStartErrors] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const { refreshDoctorAppointments, refreshPatientRequests, setPatientRequests } = useData();
  const isRealRequest = Array.isArray(requests) && requests.length > 0;
  // En production : pas de données fictives. En dev : MOCK_REQUESTS pour visualiser le rendu.
  const safeRequests = isRealRequest ? requests : MOCK_REQUESTS;

  const handleConfirm = async (reqId) => {
    if (!reqId || !isRealRequest) return;
    setActionError("");
    setProcessingId(`confirm-${reqId}`);
    try {
      await api.confirmAppointment(reqId);
      if (typeof setPatientRequests === "function") {
        setPatientRequests(prev => prev.filter(r => r.id !== reqId));
      }
      if (typeof refreshDoctorAppointments === "function") refreshDoctorAppointments();
      if (typeof refreshPatientRequests === "function") refreshPatientRequests();
    } catch (err) {
      setActionError(err?.message || "Erreur lors de la confirmation.");
      setTimeout(() => setActionError(""), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefuse = async (reqId) => {
    if (!reqId || !isRealRequest) return;
    setActionError("");
    setProcessingId(`refuse-${reqId}`);
    try {
      await api.refuseAppointment(reqId);
      if (typeof setPatientRequests === "function") {
        setPatientRequests(prev => prev.filter(r => r.id !== reqId));
      }
      if (typeof refreshPatientRequests === "function") refreshPatientRequests();
    } catch (err) {
      setActionError(err?.message || "Erreur lors du refus.");
      setTimeout(() => setActionError(""), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div
      className={`border rounded-xl p-5 shadow-sm h-full transition-all duration-300 ${
        dk ? "bg-[#141B27] border-[#638ECB]/20" : "bg-white border-[#E4EAF5]"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[16px] font-bold" style={{ color: c.txt }}>
          {t('dashboard.doctor.patients.requests')}
        </h2>
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            dk
              ? "bg-amber-900/20 text-amber-500 border-amber-800/30"
              : "bg-amber-50 text-amber-600 border-amber-200"
          }`}
        >
          {safeRequests.length} {t('dashboard.doctor.patients.pending')}
        </span>
      </div>

      {actionError && (
        <div
          className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold border"
          style={{ background: c.red + "18", borderColor: c.red + "44", color: c.red }}
        >
          {actionError}
        </div>
      )}

      {safeRequests.length === 0 ? (
        <div className="text-center py-10 opacity-70">
          <Clock size={28} className="mx-auto mb-2" style={{ color: c.txt3 }} />
          <p className="text-sm font-semibold" style={{ color: c.txt2 }}>
            Aucune demande en attente
          </p>
        </div>
      ) : (
      <div className="flex flex-col gap-5">
        {safeRequests.map((req, idx) => {
          const patientName = req.patient_name || req.name || "Patient";
          const detail = req.motif || req.detail || "Consultation";
          const displayTime = req.start_time ? req.start_time.slice(0, 5) : (req.time || "");
          const displayDate = req.date || "";
          return (
          <div key={req.id || idx} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div>
                <div
                  className="text-[13px] font-bold leading-tight"
                  style={{ color: c.txt }}
                >
                  {patientName}
                </div>
                <div
                  className="text-[11.5px] font-medium mt-0.5"
                  style={{ color: c.txt3 }}
                >
                  {detail}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-3">
                {/* Requested Slot Badge */}
                <div
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                    dk
                      ? "bg-[#1A2333]/50 border-[#638ECB]/15 text-[#8AAEE0]"
                      : "bg-[#EEF3FB] border-[#E4EAF5] text-[#4A6FA5]"
                  }`}
                >
                  <Clock size={12} strokeWidth={2.5} />
                  <span className="text-[11px] font-bold whitespace-nowrap">
                    {displayDate} · {displayTime}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleConfirm(req.id)}
                    disabled={!isRealRequest || processingId === `confirm-${req.id}` || processingId === `refuse-${req.id}`}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:bg-emerald-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                      dk
                        ? "bg-emerald-900/20 text-emerald-400 border-emerald-800/30"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}
                    title={isRealRequest ? "Accept" : "Données de démo"}
                  >
                    {processingId === `confirm-${req.id}` ? (
                      <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check size={16} strokeWidth={2.5} />
                    )}
                  </button>
                  <button
                    onClick={() => handleRefuse(req.id)}
                    disabled={!isRealRequest || processingId === `confirm-${req.id}` || processingId === `refuse-${req.id}`}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                      dk
                        ? "bg-red-900/20 text-red-400 border-red-800/30"
                        : "bg-red-50 text-red-500 border-red-100"
                    }`}
                    title={isRealRequest ? "Decline" : "Données de démo"}
                  >
                    {processingId === `refuse-${req.id}` ? (
                      <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <X size={16} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-VIEW : DASHBOARD HOME
// ============================================================================

function DashboardHome({
  onNavigate,
  patients,
  appointments,
  patientRequests,
  onStartConsultation,
  dashboardData,
}) {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;
  const { t } = useLanguage();

  const apiKpis = dashboardData?.kpis;
  const avgRatingTotal = apiKpis?.total_reviews ?? 0;
  const avgRating = (avgRatingTotal > 0 && apiKpis?.avg_rating != null)
    ? Number(apiKpis.avg_rating).toFixed(1)
    : "—";

  const kpis = [
    {
      label: t('dashboard.doctor.kpis.todaysConsultations'),
      value: apiKpis?.today_consultations ?? (Array.isArray(appointments) ? appointments.length : 0),
      icon: Users,
      color: c.green,
    },
    {
      label: t('dashboard.doctor.kpis.totalPatients'),
      value: apiKpis?.total_patients ?? (Array.isArray(patients) ? patients.length : 0),
      icon: User,
      color: c.blue,
    },
    {
      label: t('dashboard.doctor.kpis.pendingRequests'),
      value: apiKpis?.pending_requests ?? (Array.isArray(patientRequests) ? patientRequests.length : 0),
      icon: Clock,
      color: c.amber,
    },
    {
      label: t('dashboard.doctor.kpis.avgRating'),
      value: avgRating,
      sub: avgRatingTotal > 0 ? `${avgRatingTotal} avis` : undefined,
      icon: Star,
      color: c.purple,
    },
  ];

  const todaySchedule = Array.isArray(dashboardData?.todays_schedule)
    ? dashboardData.todays_schedule
    : [];

  const scheduleItems =
    todaySchedule.length > 0
      ? todaySchedule
      : Array.isArray(appointments)
        ? appointments.filter(item => {
            if (!item.date) return false;
            const d = new Date(item.date);
            const now = new Date();
            return d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth() &&
              d.getDate() === now.getDate();
          })
        : [];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((k, i) => (
          <StatCard
            key={i}
            dk={dk}
            label={k.label}
            value={k.value}
            sub={k.sub}
            icon={k.icon}
            color={k.color}
            trend={k.trend}
            onClick={i === 3 ? () => onNavigate("my-reviews") : undefined}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {/* Le planning du jour ici */}
          <TodaysSchedule appointments={scheduleItems} onStartConsultation={onStartConsultation} />
        </div>
        <div className="lg:col-span-1">
          {/* Les requêtes en attente ici */}
          <PatientRequests requests={patientRequests} onStartConsultation={onStartConsultation} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-VIEW : SCHEDULE
// ============================================================================

function NewAppointmentModal({ dk, onClose, onCreated, initialDate }) {
  const c = dk ? T.dark : T.light;
  const { patients = [] } = useData();
  const [mode, setMode] = useState("linked"); // "linked" | "external"
  const [extMode, setExtMode] = useState("existing"); // "existing" | "new"
  const [patientId, setPatientId] = useState("");
  const [extPatientId, setExtPatientId] = useState("");
  const [extFirstName, setExtFirstName] = useState("");
  const [extLastName, setExtLastName] = useState("");
  const [extPhone, setExtPhone] = useState("");
  const [externalPatients, setExternalPatients] = useState([]);
  const [date, setDate] = useState(initialDate || format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [motif, setMotif] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getExternalPatients()
      .then(d => setExternalPatients(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => {});
  }, []);

  const linkedPatients = (Array.isArray(patients) ? patients : []).map(p => ({
    id: p.id,
    name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || `Patient #${p.id}`,
  }));

  const handleSubmit = async () => {
    setError("");
    if (mode === "linked" && !patientId) { setError("Sélectionnez un patient."); return; }
    if (mode === "external" && extMode === "existing" && !extPatientId) { setError("Sélectionnez un patient externe."); return; }
    if (mode === "external" && extMode === "new" && (!extFirstName.trim() || !extLastName.trim())) {
      setError("Prénom et nom requis.");
      return;
    }
    if (!motif.trim()) { setError("Le motif est requis."); return; }
    if (endTime <= startTime) { setError("L'heure de fin doit être après l'heure de début."); return; }
    setSubmitting(true);
    try {
      const payload = {
        date,
        start_time: startTime.length === 5 ? startTime + ":00" : startTime,
        end_time:   endTime.length   === 5 ? endTime   + ":00" : endTime,
        motif: motif.trim(),
      };
      if (mode === "linked") {
        payload.patient_id = Number(patientId);
      } else if (extMode === "existing") {
        payload.external_patient_id = Number(extPatientId);
      } else {
        payload.external_first_name = extFirstName.trim();
        payload.external_last_name  = extLastName.trim();
        payload.external_phone      = extPhone.trim();
      }
      const created = await api.doctorCreateAppointment(payload);
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Échec de la création du RDV.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden" style={{ background: c.card, borderColor: c.border }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.blue + "18" }}>
              <Calendar size={18} style={{ color: c.blue }} />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: c.txt }}>Nouveau rendez-vous</h3>
              <p className="text-xs" style={{ color: c.txt3 }}>Sera automatiquement confirmé</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ background: c.bg }}>
            <X size={16} style={{ color: c.txt3 }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Toggle Patient lié / Personne extérieure */}
          <div className="flex p-1 rounded-xl border" style={{ borderColor: c.border, background: c.bg }}>
            {[
              { key: "linked",   label: "Patient lié" },
              { key: "external", label: "Personne extérieure" },
            ].map(opt => {
              const active = mode === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMode(opt.key)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: active ? c.card : "transparent",
                    color: active ? c.blue : c.txt2,
                    boxShadow: active ? `0 1px 3px ${c.border}` : "none",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Mode "Patient lié" */}
          {mode === "linked" && (
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>Patient</label>
              {linkedPatients.length === 0 ? (
                <p className="text-xs italic px-3 py-3 rounded-xl border" style={{ borderColor: c.amber + "44", background: c.amber + "12", color: c.amber }}>
                  Aucun patient lié. Utilisez "Personne extérieure" ou envoyez une demande de liaison depuis l'onglet Patients.
                </p>
              ) : (
                <DashSelect
                  dk={dk}
                  c={c}
                  value={patientId}
                  onSelect={setPatientId}
                  placeholder="Choisir un patient…"
                  options={linkedPatients.map(p => ({ value: String(p.id), label: p.name }))}
                />
              )}
            </div>
          )}

          {/* Mode "Personne extérieure" */}
          {mode === "external" && (
            <div className="space-y-3">
              {/* Sous-toggle : existant / nouveau */}
              <div className="flex p-1 rounded-lg border" style={{ borderColor: c.border, background: c.bg }}>
                {[
                  { key: "existing", label: `Existant (${externalPatients.length})` },
                  { key: "new",      label: "+ Nouveau" },
                ].map(opt => {
                  const active = extMode === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setExtMode(opt.key)}
                      className="flex-1 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: active ? c.card : "transparent",
                        color: active ? c.blue : c.txt3,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {extMode === "existing" ? (
                externalPatients.length === 0 ? (
                  <p className="text-xs italic px-3 py-3 rounded-xl border" style={{ borderColor: c.amber + "44", background: c.amber + "12", color: c.amber }}>
                    Aucun patient externe enregistré. Choisissez "+ Nouveau" pour en créer un.
                  </p>
                ) : (
                  <DashSelect
                    dk={dk}
                    c={c}
                    value={extPatientId}
                    onSelect={setExtPatientId}
                    placeholder="Choisir un patient externe…"
                    options={externalPatients.map(p => ({
                      value: String(p.id),
                      label: `${p.first_name} ${p.last_name}`.trim(),
                    }))}
                  />
                )
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>Prénom</label>
                      <input type="text" value={extFirstName} onChange={(e) => setExtFirstName(e.target.value)}
                        placeholder="Ahmed"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none"
                        style={{ background: c.bg, borderColor: c.border, color: c.txt }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>Nom</label>
                      <input type="text" value={extLastName} onChange={(e) => setExtLastName(e.target.value)}
                        placeholder="Meziane"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none"
                        style={{ background: c.bg, borderColor: c.border, color: c.txt }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>Téléphone <span className="opacity-50 normal-case tracking-normal">(optionnel)</span></label>
                    <input type="tel" value={extPhone} onChange={(e) => setExtPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="0555 00 00 00"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ background: c.bg, borderColor: c.border, color: c.txt }} />
                  </div>
                  <p className="text-[11px] px-3 py-2 rounded-lg" style={{ background: c.blue + "10", color: c.txt3 }}>
                    Ce patient sera ajouté à votre liste de patients externes — vous pourrez lui prescrire des ordonnances et consulter son dossier comme un patient lié.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none"
              style={{ background: c.bg, borderColor: c.border, color: c.txt }} />
          </div>

          {/* Heures */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>Début</label>
              <TimePicker value={startTime} onChange={setStartTime} theme={c} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>Fin</label>
              <TimePicker value={endTime} onChange={setEndTime} theme={c} />
            </div>
          </div>

          {/* Motif */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>Motif</label>
            <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)}
              placeholder="ex : Suivi tension"
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: c.bg, borderColor: c.border, color: c.txt }} />
          </div>

          {error && (
            <p className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2" style={{ color: c.red, background: c.red + "15" }}>
              <AlertTriangle size={14} /> {error}
            </p>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={handleSubmit}
            disabled={submitting || (mode === "linked" && linkedPatients.length === 0)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: c.blue }}>
            {submitting
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Plus size={15} /> Créer le rendez-vous</>}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold border hover:opacity-80" style={{ borderColor: c.border, color: c.txt2 }}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleView({ dk, onStartConsultation }) {
  const c = dk ? T.dark : T.light;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("week"); // "week" | "month"
  const [successBanner, setSuccessBanner] = useState(false);
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [newApptBanner, setNewApptBanner] = useState(null);
  const { appointments = [], patientRequests = [], refreshDoctorAppointments } = useData();

  const loadWeeklySchedules = async () => {
    try {
      const data = await api.getMySlots();
      setWeeklySchedules(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {}
  };

  useEffect(() => { loadWeeklySchedules(); }, []);

  const handleStartConsultation = (appointment) => {
    setSuccessBanner(true);
    setTimeout(() => setSuccessBanner(false), 4000);
    setTimeout(() => {
      if (onStartConsultation) onStartConsultation(appointment);
    }, 800);
  };

  const SAMPLE = [];

  const allAppointments =
    Array.isArray(appointments) && appointments.length > 0
      ? appointments
      : SAMPLE;
  const pending = Array.isArray(patientRequests) ? patientRequests : [];

  // Filter appointments for the selected date
  const filteredAppointments = allAppointments.filter((app) => {
    if (app.type === "break") return true; // Keep breaks for daily view logic if needed
    if (!app.date) return false;
    try {
      return isSameDay(new Date(app.date), selectedDate);
    } catch (e) {
      return false;
    }
  });

  // Calculate appointment counts for the WeekCalendar
  const appointmentCounts = useMemo(() => {
    const counts = {};
    allAppointments.forEach((app) => {
      if (app.date) {
        const d = format(new Date(app.date), "yyyy-MM-dd");
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return counts;
  }, [allAppointments]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Success banner */}
      {successBanner && (
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl border font-semibold text-sm animate-in fade-in duration-300"
          style={{ background: c.green + "18", borderColor: c.green + "44", color: c.green }}
        >
          <Check size={16} />
          Consultation démarrée.
        </div>
      )}

      {newApptBanner && (
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl border font-semibold text-sm animate-in fade-in duration-300"
          style={{
            background: (newApptBanner.type === "success" ? c.green : c.red) + "18",
            borderColor: (newApptBanner.type === "success" ? c.green : c.red) + "44",
            color: newApptBanner.type === "success" ? c.green : c.red,
          }}
        >
          {newApptBanner.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {newApptBanner.msg}
        </div>
      )}

      {showNewAppt && (
        <NewAppointmentModal
          dk={dk}
          onClose={() => setShowNewAppt(false)}
          initialDate={format(selectedDate, "yyyy-MM-dd")}
          onCreated={(appt) => {
            setNewApptBanner({ type: "success", msg: `RDV créé pour le ${appt?.date || ""} à ${appt?.start_time?.slice(0,5) || ""}.` });
            setTimeout(() => setNewApptBanner(null), 5000);
            if (typeof refreshDoctorAppointments === "function") refreshDoctorAppointments();
          }}
        />
      )}

      {/* Dynamic Week Calendar */}
      <WeekCalendar
        selectedDate={selectedDate}
        onDateChange={(date) => setSelectedDate(date)}
        appointmentCounts={appointmentCounts}
        weeklySchedules={weeklySchedules}
        view={view}
        onViewChange={(v) => setView(v)}
        headerRight={
          <button
            onClick={() => setShowNewAppt(true)}
            className="px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-1.5 transition-all hover:scale-105 shadow-lg active:scale-95"
            style={{ background: c.blue, boxShadow: `0 4px 12px ${c.blue}44` }}
          >
            <Plus size={16} strokeWidth={2.5} /> Nouveau rendez-vous
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {/* Le planning du jour filtré */}
          <TodaysSchedule
            appointments={filteredAppointments}
            onStartConsultation={onStartConsultation ? handleStartConsultation : undefined}
          />
        </div>
        <div className="lg:col-span-1">
          {/* Les requêtes en attente ici */}
          <PatientRequests
            requests={pending}
            onStartConsultation={onStartConsultation ? handleStartConsultation : undefined}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-VIEW : PATIENTS
// ============================================================================

function PatientsView({ onSelectPatient, onMessagePatient }) {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;
  const { t } = useLanguage();

  const { patients = [], refreshDoctorPatients } = useData();
  const [localSearch, setLocalSearch] = useState("");
  const [page, setPage] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Global search (API) ──
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [sendingLinkId, setSendingLinkId] = useState(null);
  const [linkMessages, setLinkMessages] = useState({});

  // ── External patient modal ──
  const [showExtModal, setShowExtModal] = useState(false);
  const [extPatient, setExtPatient] = useState({ firstName: "", lastName: "", age: "", phone: "", condition: "", notes: "" });
  const [extSaving, setExtSaving] = useState(false);
  const [extError, setExtError] = useState("");
  const [externalPatients, setExternalPatients] = useState([]);

  // ── Résiliation de liaison ──
  const [unlinkingId, setUnlinkingId] = useState(null);
  const [unlinkConfirmId, setUnlinkConfirmId] = useState(null); // id en attente de confirmation

  // ── Suppression patient externe ──
  const [deleteExtConfirmId, setDeleteExtConfirmId] = useState(null);
  const [deletingExtId, setDeletingExtId] = useState(null);

  const handleDeleteExternal = async (rawExtId) => {
    setDeletingExtId(rawExtId);
    try {
      await api.deleteExternalPatient(rawExtId);
      setExternalPatients(prev => prev.filter(ep => ep.id !== rawExtId));
      setDeleteExtConfirmId(null);
    } catch (err) {
      console.error("Erreur suppression patient externe:", err);
    } finally {
      setDeletingExtId(null);
    }
  };

  // Load external patients on mount
  useEffect(() => {
    api.getExternalPatients().then(d => setExternalPatients(Array.isArray(d) ? d : (d?.results ?? []))).catch(() => {});
  }, []);

  // Debounce global search
  useEffect(() => {
    if (globalQuery.length < 2) { setGlobalResults([]); setGlobalError(""); return; }
    const timer = setTimeout(async () => {
      setGlobalLoading(true);
      setGlobalError("");
      try {
        const data = await api.searchPatients(globalQuery);
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setGlobalResults(list);
      } catch (err) {
        console.error("[PatientsSearch] erreur API:", err);
        setGlobalResults([]);
        setGlobalError(err?.message || "Erreur de recherche");
      }
      finally { setGlobalLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [globalQuery]);

  const handleSendLinkRequest = async (patientId) => {
    setSendingLinkId(patientId);
    try {
      await api.sendLinkRequest(patientId);
      setGlobalResults(prev => prev.map(r => r.id === patientId ? { ...r, link_status: "pending" } : r));
      setLinkMessages(prev => ({ ...prev, [patientId]: { ok: true, msg: "Demande envoyée — le patient recevra une notification." } }));
    } catch (err) {
      setLinkMessages(prev => ({ ...prev, [patientId]: { ok: false, msg: err.message || "Erreur" } }));
    } finally { setSendingLinkId(null); }
  };

  const handleSaveExternal = async () => {
    if (!extPatient.firstName.trim() || !extPatient.lastName.trim()) return;
    setExtSaving(true); setExtError("");
    try {
      const saved = await api.createExternalPatient({
        first_name: extPatient.firstName, last_name: extPatient.lastName,
        age: extPatient.age ? parseInt(extPatient.age) : null,
        phone: extPatient.phone, condition: extPatient.condition, notes: extPatient.notes,
      });
      setExternalPatients(prev => [saved, ...prev]);
      setExtPatient({ firstName: "", lastName: "", age: "", phone: "", condition: "", notes: "" });
      setShowExtModal(false);
    } catch (err) { setExtError(err.message || "Erreur"); }
    finally { setExtSaving(false); }
  };

  const handleUnlink = async (patientId) => {
    setUnlinkingId(patientId);
    try {
      await api.unlinkPatient(patientId);
      setUnlinkConfirmId(null);
      await refreshDoctorPatients(); // recharge la liste sans le patient révoqué
    } catch (err) {
      console.error("Erreur résiliation:", err);
    } finally {
      setUnlinkingId(null);
    }
  };

  const apiPatients = (Array.isArray(patients) ? patients : []).map(p => ({
    id: p.id,
    user_id: p.user_id,
    firstName: p.first_name || p.firstName || "",
    lastName: p.last_name || p.lastName || "",
    age: p.age || "—",
    blood_group: p.blood_group || p.medical_profile?.blood_group || null,
    allergies: Array.isArray(p.allergies) ? p.allergies : (Array.isArray(p.medical_profile?.allergies) ? p.medical_profile.allergies : []),
    lastVisit: p.last_visit || p.last_appointment || null,
    _type: "linked",
  }));
  const extMapped = externalPatients.map(p => ({
    id: `ext-${p.id}`, firstName: p.first_name, lastName: p.last_name, age: p.age || "—",
    blood_group: null, allergies: [], lastVisit: null, _type: "external",
  }));
  const allPatients = [...apiPatients, ...extMapped];
  const filtered = allPatients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(localSearch.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getBadgeProps = (label) => {
    const l = (label || "").toLowerCase();
    if (l.includes("diabetes") || l.includes("hypertension")) return { color: c.red, bg: c.red + "15" };
    if (l.includes("active") || l.includes("stable"))         return { color: c.green, bg: c.green + "15" };
    if (l.includes("critical"))  return { color: c.red, bg: c.red + "25" };
    if (l.includes("externe"))   return { color: c.amber, bg: c.amber + "15" };
    if (l.includes("pending"))   return { color: c.amber, bg: c.amber + "15" };
    return { color: c.blue, bg: c.blue + "15" };
  };

  const linkStatusLabel = (st) => {
    if (st === "linked" || st === "accepted") return { label: "Lié", color: c.green };
    if (st === "pending")  return { label: "En attente", color: c.amber };
    if (st === "refused")  return { label: "Refusé", color: c.red };
    return null;
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-5">

      {/* ── Modal : nouveau patient sans compte ── */}
      {showExtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowExtModal(false); }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden" style={{ background: dk ? "#141B27" : "#fff", borderColor: c.border }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.blue + "18" }}><Plus size={18} style={{ color: c.blue }} /></div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: c.txt }}>Nouveau patient (sans compte)</h3>
                  <p className="text-xs" style={{ color: c.txt3 }}>Ajouté localement à votre liste</p>
                </div>
              </div>
              <button onClick={() => setShowExtModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ background: c.bg }}>
                <X size={16} style={{ color: c.txt3 }} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[["Prénom", "firstName", "Ahmed"], ["Nom", "lastName", "Meziane"]].map(([label, key, ph]) => (
                  <div key={key} className="relative">
                    <span className="absolute -top-2.5 left-3 px-1 text-[11px] font-medium" style={{ color: c.txt3, background: dk ? "#141B27" : "#fff" }}>{label}</span>
                    <input type="text" value={extPatient[key]} onChange={e => setExtPatient(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={ph} className="w-full px-3 py-3 rounded-xl border text-sm outline-none"
                      style={{ borderColor: c.border, background: dk ? "#0D1117" : "#fff", color: c.txt }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[["Âge", "age", "35"], ["Téléphone", "phone", "0555 00 00 00"]].map(([label, key, ph]) => (
                  <div key={key} className="relative">
                    <span className="absolute -top-2.5 left-3 px-1 text-[11px] font-medium" style={{ color: c.txt3, background: dk ? "#141B27" : "#fff" }}>{label}</span>
                    <input type="text" value={extPatient[key]} onChange={e => setExtPatient(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={ph} className="w-full px-3 py-3 rounded-xl border text-sm outline-none"
                      style={{ borderColor: c.border, background: dk ? "#0D1117" : "#fff", color: c.txt }} />
                  </div>
                ))}
              </div>
              <div className="relative">
                <span className="absolute -top-2.5 left-3 px-1 text-[11px] font-medium" style={{ color: c.txt3, background: dk ? "#141B27" : "#fff" }}>Condition / Motif</span>
                <input type="text" value={extPatient.condition} onChange={e => setExtPatient(p => ({ ...p, condition: e.target.value }))}
                  placeholder="ex: Hypertension" className="w-full px-3 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: c.border, background: dk ? "#0D1117" : "#fff", color: c.txt }} />
              </div>
              <div className="relative">
                <span className="absolute -top-2.5 left-3 px-1 text-[11px] font-medium" style={{ color: c.txt3, background: dk ? "#141B27" : "#fff" }}>Notes</span>
                <textarea value={extPatient.notes} onChange={e => setExtPatient(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Observations initiales…"
                  className="w-full px-3 py-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: c.border, background: dk ? "#0D1117" : "#fff", color: c.txt }} />
              </div>
              {extError && <p className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ color: c.red, background: c.red + "15" }}>{extError}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleSaveExternal} disabled={extSaving || !extPatient.firstName.trim() || !extPatient.lastName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${c.blue}, #304B71)` }}>
                {extSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={15} /> Enregistrer</>}
              </button>
              <button onClick={() => setShowExtModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border hover:opacity-80" style={{ borderColor: c.border, color: c.txt2 }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ligne 1 : barre de recherche système + bouton nouveau patient ── */}
      <div className="flex items-center gap-3">
        {/* Barre de recherche avec dropdown de résultats */}
        <div className="relative flex-1">
          <div className="flex items-center px-5 py-2 rounded-2xl border transition-all duration-300"
            style={{ borderColor: searchFocused ? "#6492C9" : c.border, background: c.card, boxShadow: searchFocused ? "0 0 0 4px rgba(100,146,201,0.15)" : "none", minHeight: 52 }}>
            <Search size={18} className="mr-3 shrink-0 transition-colors" style={{ color: searchFocused ? "#6492C9" : c.txt3 }} />
            <input
              type="text"
              placeholder="Rechercher un patient dans le système…"
              value={globalQuery}
              onChange={e => { setGlobalQuery(e.target.value); setPage(1); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder:font-normal placeholder:text-[#9AACBE]"
              style={{ color: c.txt }}
            />
            {globalLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2 shrink-0" style={{ color: c.blue }} />
            )}
            {globalQuery && (
              <button onClick={() => { setGlobalQuery(""); setGlobalResults([]); }} className="ml-2 shrink-0 opacity-40 hover:opacity-70">
                <X size={15} style={{ color: c.txt3 }} />
              </button>
            )}
          </div>

          {/* Dropdown résultats système — apparaît par-dessus la liste en dessous */}
          {globalQuery.length >= 2 && (
            <div className="absolute left-0 right-0 mt-2 z-40 rounded-2xl border shadow-2xl overflow-hidden"
              style={{ background: c.card, borderColor: c.border, boxShadow: `0 8px 32px rgba(0,0,0,${dk ? "0.5" : "0.15"})` }}>
              {/* En-tête */}
              <div className="px-5 py-2.5 border-b flex items-center justify-between" style={{ borderColor: c.border, background: c.bg }}>
                <div className="flex items-center gap-2">
                  <Search size={13} style={{ color: c.txt3 }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.txt3 }}>
                    Résultats système
                  </span>
                </div>
                {!globalLoading && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: c.blue + "18", color: c.blue }}>
                    {globalResults.length} patient{globalResults.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Corps */}
              <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
                {globalError ? (
                  <div className="py-6 text-center">
                    <p className="text-sm font-bold" style={{ color: c.red }}>Erreur : {globalError}</p>
                  </div>
                ) : globalResults.length === 0 && !globalLoading ? (
                  <div className="py-8 flex flex-col items-center gap-3">
                    <p className="text-sm font-semibold" style={{ color: c.txt2 }}>Aucun patient trouvé</p>
                    <button
                      onClick={() => { setShowExtModal(true); setExtPatient(p => ({ ...p, firstName: globalQuery.split(" ")[0] || "", lastName: globalQuery.split(" ").slice(1).join(" ") || "" })); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
                      style={{ color: c.blue, borderColor: c.blue + "44", background: c.blue + "10" }}>
                      <Plus size={15} /> Ajouter "{globalQuery}" sans compte
                    </button>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: c.border }}>
                    {globalResults.map((r, i) => {
                      const ls = linkStatusLabel(r.link_status);
                      const msg = linkMessages[r.id];
                      return (
                        <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:opacity-90 transition-opacity">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                              {getInitials(r.first_name, r.last_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate" style={{ color: c.txt }}>{r.first_name} {r.last_name}</p>
                              {r.age && <p className="text-xs" style={{ color: c.txt3 }}>{r.age} ans</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {ls && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                                style={{ color: ls.color, background: ls.color + "15", borderColor: ls.color + "33" }}>
                                {ls.label}
                              </span>
                            )}
                            {msg && (
                              <span className="text-xs font-semibold" style={{ color: msg.ok ? c.green : c.red }}>{msg.msg}</span>
                            )}
                            {(r.link_status === "linked" || r.link_status === "accepted") && (
                              <button
                                onClick={() => { onSelectPatient?.({ id: r.id, firstName: r.first_name, lastName: r.last_name, age: r.age, _type: "linked" }); setGlobalQuery(""); setGlobalResults([]); }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:opacity-80"
                                style={{ color: c.blue, borderColor: c.blue, background: c.blue + "12" }}>
                                Voir profil
                              </button>
                            )}
                            {(!r.link_status || r.link_status === "refused") && !msg?.ok && (
                              <button onClick={() => handleSendLinkRequest(r.id)} disabled={sendingLinkId === r.id}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                                style={{ background: c.blue }}>
                                {sendingLinkId === r.id
                                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : <><Plus size={11} /> Demander</>}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bouton nouveau patient */}
        <button onClick={() => setShowExtModal(true)}
          className="px-5 py-3 rounded-2xl text-white text-sm font-bold flex items-center gap-2 shrink-0 transition-all hover:opacity-90"
          style={{ background: "#304B71", boxShadow: "0 4px 12px rgba(48,75,113,0.35)" }}>
          <Plus size={17} /> Nouveau patient
        </button>
      </div>

      {/* ── Card : Mes patients ── */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden ${dk ? "bg-[#172133] border-gray-800" : "bg-white border-gray-100"}`}>
        {/* Header card */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${dk ? "border-gray-800" : "border-gray-100"}`}>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold" style={{ color: dk ? "#ffffff" : "#0D2644" }}>Mes patients</span>
            <span className="text-[15px] font-semibold" style={{ color: "#A0B5CD" }}>·</span>
            <span className="text-[15px] font-bold" style={{ color: c.blue }}>{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor: c.border, background: dk ? "#0D1117" : "#F8FAFC" }}>
            <Search size={13} style={{ color: "#A0B5CD" }} />
            <input
              type="text"
              placeholder="Filtrer…"
              value={localSearch}
              onChange={e => { setLocalSearch(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-sm w-28"
              style={{ color: dk ? "#ffffff" : "#0D2644" }}
            />
            {localSearch && (
              <button onClick={() => { setLocalSearch(""); setPage(1); }} className="opacity-40 hover:opacity-70">
                <X size={12} style={{ color: "#A0B5CD" }} />
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: dk ? "rgba(30,45,74,0.3)" : "#F8FAFC" }}>
              <Search size={20} style={{ color: "#A0B5CD" }} />
            </div>
            <p className="font-bold mb-1" style={{ color: dk ? "#ffffff" : "#0D2644" }}>
              {localSearch ? `Aucun résultat pour "${localSearch}"` : "Aucun patient lié pour l'instant"}
            </p>
            <p className="text-sm" style={{ color: "#5C738A" }}>
              {localSearch ? "Essayez un autre terme" : "Recherchez un patient dans le système"}
            </p>
          </div>
        ) : (
          <>
            {paginated.map((p, idx) => {
              const fi = (page - 1) * PAGE_SIZE + idx;
              const isConfirming = unlinkConfirmId === p.id;
              const isUnlinking = unlinkingId === p.id;
              const visitDate = p.lastVisit ? (() => { try { return new Date(p.lastVisit).toLocaleDateString("fr-FR"); } catch { return null; } })() : null;
              const severeAllergies = Array.isArray(p.allergies) ? p.allergies.filter(a => a && a.severity === "severe") : [];
              return (
                <div
                  key={p.id || idx}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 ${idx < paginated.length - 1 ? (dk ? "border-b border-gray-800" : "border-b border-gray-50") : ""}`}
                  onMouseEnter={e => { e.currentTarget.style.background = dk ? "rgba(30,45,74,0.3)" : "#F8FAFC"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: AVATAR_COLORS[fi % AVATAR_COLORS.length] }}>
                    {getInitials(p.firstName, p.lastName)}
                  </div>

                  {/* Nom + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[13.5px]" style={{ color: dk ? "#ffffff" : "#0D2644" }}>
                        {p.firstName} {p.lastName}
                      </span>
                      {p.blood_group && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FCEBEB", color: "#A32D2D" }}>
                          {p.blood_group}
                        </span>
                      )}
                      {severeAllergies.map((a, i) => (
                        <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#FFF7ED", color: "#C2410C" }}>
                          <AlertTriangle size={10} /> {a.substance || a.name || String(a)}
                        </span>
                      ))}
                      {p._type === "external" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: c.amber, background: c.amber + "18" }}>Sans compte</span>
                      )}
                    </div>
                  </div>

                  {/* Âge + Dernier RDV */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium" style={{ color: "#5C738A" }}>{p.age} ans</p>
                    {p._type === "external" ? (
                      <p className="text-xs" style={{ color: "#A0B5CD" }}>Patient externe</p>
                    ) : (
                      <p className="text-xs" style={{ color: "#A0B5CD" }}>
                        {visitDate ? `Dernier RDV : ${visitDate}` : "—"}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 ml-1">
                    {p._type !== "external" && p.user_id && (
                      <button
                        onClick={() => onMessagePatient?.({ id: p.user_id, name: `${p.firstName} ${p.lastName}`.trim(), role: "patient" })}
                        className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:opacity-80 flex items-center gap-1"
                        style={{ color: c.green, borderColor: c.green, background: c.green + "0D" }}>
                        <MessageSquare size={12} />
                        Message
                      </button>
                    )}
                    <button
                      onClick={() => onSelectPatient?.(p)}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:opacity-80"
                      style={{ color: c.blue, borderColor: c.blue, background: c.blue + "0D" }}>
                      Voir profil
                    </button>
                    {p._type === "external" ? (
                      (() => {
                        const rawExtId = String(p.id).replace(/^ext-/, "");
                        const isDeleting = deletingExtId === rawExtId;
                        const isAskingDelete = deleteExtConfirmId === rawExtId;
                        return isAskingDelete ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border animate-in fade-in"
                            style={{ borderColor: "#FECACA", background: dk ? "rgba(239,68,68,0.08)" : "#FFF5F5" }}>
                            <span className="text-[11px] font-bold" style={{ color: "#EF4444" }}>Retirer ?</span>
                            <button
                              onClick={() => handleDeleteExternal(rawExtId)}
                              disabled={isDeleting}
                              className="text-[11px] font-black px-2 py-0.5 rounded-lg text-white bg-red-500 transition-all disabled:opacity-60">
                              {isDeleting ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : "Oui"}
                            </button>
                            <button
                              onClick={() => setDeleteExtConfirmId(null)}
                              className="text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all hover:opacity-70"
                              style={{ color: "#5C738A", borderColor: c.border }}>
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteExtConfirmId(rawExtId)}
                            className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:bg-red-50 flex items-center gap-1"
                            style={{ color: "#EF4444", borderColor: "#FECACA", background: "transparent" }}
                            title="Retirer ce patient externe">
                            <Trash2 size={11} /> Retirer
                          </button>
                        );
                      })()
                    ) : (
                      isConfirming ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border animate-in fade-in"
                          style={{ borderColor: "#FECACA", background: dk ? "rgba(239,68,68,0.08)" : "#FFF5F5" }}>
                          <span className="text-[11px] font-bold" style={{ color: "#EF4444" }}>Confirmer ?</span>
                          <button
                            onClick={() => handleUnlink(p.id)}
                            disabled={isUnlinking}
                            className="text-[11px] font-black px-2 py-0.5 rounded-lg text-white bg-red-500 transition-all disabled:opacity-60">
                            {isUnlinking ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : "Oui"}
                          </button>
                          <button
                            onClick={() => setUnlinkConfirmId(null)}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all hover:opacity-70"
                            style={{ color: "#5C738A", borderColor: c.border }}>
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUnlinkConfirmId(p.id)}
                          className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:bg-red-50"
                          style={{ color: "#EF4444", borderColor: "#FECACA", background: "transparent" }}>
                          Résilier
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className={`flex items-center justify-between px-5 py-3.5 border-t ${dk ? "border-gray-800" : "border-gray-100"}`}>
                <p className="text-xs font-medium" style={{ color: "#A0B5CD" }}>
                  Page {page} / {totalPages} · {filtered.length} patients
                </p>
                <div className="flex gap-2">
                  {[["‹ Préc.", () => setPage(p => Math.max(1, p - 1)), page === 1],
                    ["Suiv. ›", () => setPage(p => Math.min(totalPages, p + 1)), page === totalPages]
                  ].map(([label, fn, dis]) => (
                    <button key={label} onClick={fn} disabled={dis}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-30"
                      style={{ color: c.txt2, borderColor: c.border, background: c.card }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-VIEW : PRESCRIPTIONS
// ============================================================================

// ── helpers locaux ────────────────────────────────────────────────────────────
const FREQ_DISPLAY = {
  "1x_day":   "1x/jour",
  "2x_day":   "2x/jour",
  "3x_day":   "3x/jour",
  "every_8h": "toutes les 8h",
  "as_needed":"si besoin",
};
const FREQ_OPTIONS_UI = ["1x/jour", "2x/jour", "3x/jour", "toutes les 8h", "si besoin"];
const FREQ_UI_TO_API  = {
  "1x/jour":       "1x_day",
  "2x/jour":       "2x_day",
  "3x/jour":       "3x_day",
  "toutes les 8h": "every_8h",
  "si besoin":     "as_needed",
};

function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function isExpired(validUntil) {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
}

function PrescriptionsView() {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;
  const { t } = useLanguage();

  const { patients = [], prescriptions: ctxPrescriptions = [], addPrescription, refreshDoctorPrescriptions } = useData();

  // ── état liste ──────────────────────────────────────────────────────────────
  const [rxList, setRxList]       = useState([]);
  const [search, setSearch]       = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [qrModal, setQrModal]     = useState(null); // { rx }
  const [qrBlob, setQrBlob]       = useState(null);
  const [pdfLoading, setPdfLoading] = useState({});
  const [banner, setBanner]       = useState(null); // { type, msg }

  // ── état formulaire ──────────────────────────────────────────────────────────
  const [externalPatients, setExternalPatients] = useState([]);
  const [showOverlay, setShowOverlay]   = useState(false);
  const overlayRef                      = useRef(null);
  const [patientName, setPatientName]   = useState("");
  const [patientId, setPatientId]       = useState("");
  const [externalPatientId, setExtId]   = useState("");
  const [patientType, setPatientType]   = useState("");
  const [meds, setMeds] = useState([{ name: "", dosage: "", frequency: "1x/jour", duration: "" }]);
  const [formNotes, setFormNotes]       = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState("");

  // ── init data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    api.getExternalPatients()
      .then(d => setExternalPatients(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setRxList(Array.isArray(ctxPrescriptions) ? ctxPrescriptions : []);
  }, [ctxPrescriptions]);

  // ── fermer overlay patient au clic extérieur ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) setShowOverlay(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── liste patients fusionnée ──────────────────────────────────────────────
  const linkedList = (Array.isArray(patients) ? patients : []).map(p => {
    const name = `${p.first_name || p.user?.first_name || ""} ${p.last_name || p.user?.last_name || ""}`.trim()
               || p.email || `Patient #${p.id}`;
    return { id: p.id, name, _type: "linked" };
  });
  const extList = (Array.isArray(externalPatients) ? externalPatients : []).map(p => ({
    id: p.id, name: `${p.first_name} ${p.last_name}`.trim(), _type: "external",
  }));
  const allPatients = [...linkedList, ...extList];
  const ptQuery = patientName.toLowerCase().trim();
  const filteredPts = ptQuery
    ? allPatients.filter(p => p.name.toLowerCase().includes(ptQuery))
    : allPatients;

  const handleSelectPatient = (p) => {
    setPatientName(p.name);
    setPatientId(p._type === "linked" ? p.id : "");
    setExtId(p._type === "external" ? p.id : "");
    setPatientType(p._type);
    setShowOverlay(false);
  };

  // ── médicaments ───────────────────────────────────────────────────────────
  const addMed    = () => setMeds(prev => [...prev, { name: "", dosage: "", frequency: "1x/jour", duration: "" }]);
  const removeMed = (i) => setMeds(prev => prev.filter((_, idx) => idx !== i));
  const updateMed = (i, field, val) => setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  // ── annuler ordonnance ───────────────────────────────────────────────────
  const handleCancelRx = async (rxId) => {
    setCancellingId(rxId);
    try {
      await api.apiFetch(`/prescriptions/prescriptions/${rxId}/`, { method: "DELETE" });
      setRxList(prev => prev.map(r => r.id === rxId ? { ...r, status: "cancelled" } : r));
      if (refreshDoctorPrescriptions) refreshDoctorPrescriptions().catch(() => {});
    } catch (err) {
      setBanner({ type: "error", msg: err?.message || "Impossible d'annuler l'ordonnance." });
      setTimeout(() => setBanner(null), 4000);
    } finally {
      setCancellingId(null);
    }
  };

  // ── PDF ──────────────────────────────────────────────────────────────────
  const handlePdfDownload = async (rxId) => {
    setPdfLoading(prev => ({ ...prev, [rxId]: true }));
    try {
      const blob = await api.apiFetchBlob(`/prescriptions/${rxId}/pdf-download/`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `ordonnance-${String(rxId).slice(0, 8)}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch {}
    setPdfLoading(prev => ({ ...prev, [rxId]: false }));
  };

  // ── QR ────────────────────────────────────────────────────────────────────
  const handleQrOpen = async (rx) => {
    setQrModal(rx); setQrBlob(null);
    try {
      const blob = await api.apiFetchBlob(`/prescriptions/${String(rx.id)}/qr-image/`);
      setQrBlob(URL.createObjectURL(blob));
    } catch {}
  };

  // ── submit formulaire ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError("");
    if (!patientId && !externalPatientId) return setFormError("Sélectionnez un patient depuis la liste.");
    if (meds.some(m => !m.name.trim())) return setFormError("Chaque médicament doit avoir un nom.");

    setSubmitting(true);
    try {
      const payload = {
        notes: formNotes || "",
        items: meds.map(m => ({
          drug_name: m.name.trim(),
          dosage:    m.dosage.trim(),
          frequency: FREQ_UI_TO_API[m.frequency] || "1x_day",
          duration:  m.duration.trim(),
        })),
      };
      if (patientType === "external") payload.external_patient_id = externalPatientId;
      else                            payload.patient_id          = patientId;

      const created = await api.createQuickPrescription(payload);
      if (created) setRxList(prev => [created, ...prev]);
      if (typeof addPrescription === "function" && created) addPrescription(created);

      setPatientName(""); setPatientId(""); setExtId(""); setPatientType("");
      setMeds([{ name: "", dosage: "", frequency: "1x/jour", duration: "" }]);
      setFormNotes("");
      setBanner({ type: "success", msg: "Ordonnance créée avec succès." });
      setTimeout(() => setBanner(null), 3500);
    } catch (err) {
      setFormError(err?.message || "Échec de la création de l'ordonnance.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── filtrage liste ────────────────────────────────────────────────────────
  const filteredRx = rxList.filter(rx => {
    if (!search) return true;
    const q = search.toLowerCase();
    const drugs = (rx.items || []).map(it => (it.drug_name || "").toLowerCase()).join(" ");
    const pname = (rx.patient_name || "").toLowerCase();
    return drugs.includes(q) || pname.includes(q);
  });

  const thisMonth = rxList.filter(rx => {
    const d = rx.created_at ? new Date(rx.created_at) : null;
    if (!d) return false;
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // ── input style helper ────────────────────────────────────────────────────
  const inp = {
    background:  dk ? "rgba(30,45,74,0.35)" : "#F8FAFC",
    borderColor: c.border,
    color:       c.txt,
  };

  return (
    <div className="animate-in fade-in duration-500">

      {/* Bannière globale */}
      {banner && (
        <div className="mb-4 px-4 py-3 rounded-xl border flex items-center gap-2 animate-in slide-in-from-top-3"
          style={{
            background:  banner.type === "success" ? c.green + "15" : c.red + "15",
            borderColor: banner.type === "success" ? c.green + "44" : c.red + "44",
          }}>
          {banner.type === "success"
            ? <Check size={15} style={{ color: c.green }} />
            : <X size={15} style={{ color: c.red }} />}
          <p className="text-sm font-bold" style={{ color: banner.type === "success" ? c.green : c.red }}>{banner.msg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-xl font-black" style={{ color: c.txt }}>Ordonnances</h1>
          <p className="text-sm mt-0.5" style={{ color: c.txt3 }}>{thisMonth} ordonnance{thisMonth !== 1 ? "s" : ""} ce mois</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 14, alignItems: "start" }}>

        {/* ══ COLONNE GAUCHE — liste ══════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border"
            style={{ background: dk ? c.card : "#fff", borderColor: c.border }}>
            <Search size={15} style={{ color: c.txt3, flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par médicament ou patient…"
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ color: c.txt }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 hover:opacity-70 transition-opacity">
                <X size={13} style={{ color: c.txt3 }} />
              </button>
            )}
          </div>

          {/* Liste ordonnances */}
          {filteredRx.length === 0 ? (
            <div className="text-center py-16 opacity-50">
              <FileText size={44} className="mx-auto mb-3" style={{ color: c.txt3 }} />
              <p className="text-sm font-bold" style={{ color: c.txt3 }}>
                {search ? "Aucun résultat pour cette recherche" : "Aucune ordonnance"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRx.map(rx => {
                const expired = isExpired(rx.valid_until);
                const cancelled = rx.status === "cancelled";
                const statusColor = cancelled ? c.txt3 : expired ? c.txt3 : c.green;
                const statusLabel = cancelled ? "Annulée" : expired ? "Expirée" : "Active";
                const isConfirming = cancellingId === `confirm-${rx.id}`;
                const isCancelling = cancellingId === rx.id;
                const items = Array.isArray(rx.items) ? rx.items : [];

                return (
                  <div key={rx.id}
                    className="rounded-2xl border p-4 transition-all duration-200"
                    style={{ background: c.card, borderColor: c.border }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#6492C9"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = c.border; }}
                  >
                    {/* Row 1 — patient + statut */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                          style={{ background: "#304B71" }}>
                          {(rx.patient_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: c.txt }}>{rx.patient_name || "—"}</p>
                          <p className="text-xs" style={{ color: c.txt3 }}>
                            {fmtDateShort(rx.created_at)}
                            {rx.valid_until && (
                              <> · Valide jusqu'au <span style={{ color: expired ? c.red : c.txt3 }}>{fmtDateShort(rx.valid_until)}</span></>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: statusColor + "18", color: statusColor }}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Row 2 — pills médicaments */}
                    {items.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {items.map((it, i) => (
                          <span key={i}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: c.blue + "15", color: c.blue }}>
                            {it.drug_name}{it.dosage ? ` · ${it.dosage}` : ""}
                            {it.frequency ? ` · ${FREQ_DISPLAY[it.frequency] || it.frequency}` : ""}
                            {it.duration  ? ` · ${it.duration}` : ""}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic mb-3" style={{ color: c.txt3 }}>Aucun médicament enregistré</p>
                    )}

                    {/* Row 3 — actions */}
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <button
                        onClick={() => handleQrOpen(rx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:opacity-80"
                        style={{ borderColor: c.border, color: c.txt2 }}>
                        <QrCode size={12} /> QR Code
                      </button>
                      <button
                        onClick={() => handlePdfDownload(rx.id)}
                        disabled={!!pdfLoading[rx.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ borderColor: c.border, color: c.txt2 }}>
                        {pdfLoading[rx.id]
                          ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          : <Download size={12} />}
                        PDF
                      </button>
                      {!cancelled && !expired && (
                        isConfirming ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setCancellingId(null); handleCancelRx(rx.id); }}
                              className="px-3 py-1.5 rounded-xl text-xs font-black text-white"
                              style={{ background: c.red }}>Confirmer</button>
                            <button
                              onClick={() => setCancellingId(null)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
                              style={{ borderColor: c.border, color: c.txt2 }}>Annuler</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancellingId(`confirm-${rx.id}`)}
                            disabled={isCancelling}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ borderColor: c.red + "55", color: c.red }}>
                            {isCancelling
                              ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              : <Trash2 size={12} />}
                            Annuler
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══ COLONNE DROITE — formulaire sticky ═════════════════════════════ */}
        <div id="rx-form-panel" style={{ position: "sticky", top: 72 }}>
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: c.card, borderColor: c.border }}>
            <h2 className="font-black text-[15px]" style={{ color: c.txt }}>Nouvelle ordonnance</h2>

            {formError && (
              <div className="px-3 py-2 rounded-xl border text-xs font-semibold"
                style={{ background: c.red + "12", borderColor: c.red + "44", color: c.red }}>
                {formError}
              </div>
            )}

            {/* Patient autocomplete */}
            <div ref={overlayRef} className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>
                Patient
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                style={{ ...inp, borderColor: c.border }}>
                <Search size={13} style={{ color: c.txt3, flexShrink: 0 }} />
                <input
                  type="text"
                  value={patientName}
                  onChange={e => { setPatientName(e.target.value); setPatientId(""); setExtId(""); setPatientType(""); setShowOverlay(true); }}
                  onFocus={() => setShowOverlay(true)}
                  placeholder="Nom du patient…"
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  style={{ color: c.txt }}
                  autoComplete="off"
                />
                {patientType && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg shrink-0"
                    style={{ background: patientType === "external" ? c.amber + "20" : c.green + "20",
                             color: patientType === "external" ? c.amber : c.green }}>
                    {patientType === "external" ? "Ext." : "Lié"}
                  </span>
                )}
              </div>
              {showOverlay && filteredPts.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-2xl z-[100] overflow-hidden max-h-48 overflow-y-auto"
                  style={{ background: c.card, borderColor: c.border }}>
                  {filteredPts.slice(0, 20).map((p, i) => (
                    <button key={`${p._type}-${p.id}-${i}`} type="button"
                      onMouseDown={e => { e.preventDefault(); handleSelectPatient(p); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors"
                      style={{ color: c.txt }}
                      onMouseEnter={e => e.currentTarget.style.background = c.blue + "12"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                        style={{ background: p._type === "external" ? c.amber + "25" : c.green + "25",
                                 color: p._type === "external" ? c.amber : c.green }}>
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 font-semibold">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Section médicaments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.txt3 }}>
                  Médicaments ({meds.length}/10)
                </label>
                {meds.length < 10 && (
                  <button type="button" onClick={addMed}
                    className="text-[11px] font-black px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                    style={{ background: c.blue + "15", color: c.blue }}>
                    + Ajouter
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {meds.map((m, i) => (
                  <div key={i} className="rounded-xl p-3 space-y-2"
                    style={{ background: dk ? "rgba(30,45,74,0.35)" : "#F8FAFC", border: `1px solid ${c.border}` }}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={m.name}
                        onChange={e => updateMed(i, "name", e.target.value)}
                        placeholder="Nom du médicament *"
                        className="flex-1 bg-transparent border-none outline-none text-sm font-semibold"
                        style={{ color: c.txt }}
                      />
                      {meds.length > 1 && (
                        <button type="button" onClick={() => removeMed(i)}
                          className="w-5 h-5 flex items-center justify-center rounded-md hover:opacity-70 transition-opacity shrink-0"
                          style={{ color: c.red }}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={m.dosage}
                        onChange={e => updateMed(i, "dosage", e.target.value)}
                        placeholder="Dosage (ex: 500mg)"
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                        style={inp}
                      />
                      <DashSelect
                        value={m.frequency}
                        options={FREQ_OPTIONS_UI}
                        onSelect={val => updateMed(i, "frequency", val)}
                        dk={dk} c={c}
                        placeholder="Fréquence"
                      />
                    </div>
                    <input
                      type="text"
                      value={m.duration}
                      onChange={e => updateMed(i, "duration", e.target.value)}
                      placeholder="Durée (ex: 30 jours)"
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                      style={inp}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: c.txt3 }}>
                Notes <span className="font-normal normal-case" style={{ color: c.txt3 }}>(optionnel)</span>
              </label>
              <textarea
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                rows={2}
                placeholder="Instructions spéciales, précautions…"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                style={inp}
              />
            </div>

            {/* Soumettre */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #304B71, #6492C9)" }}>
              {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {submitting ? "Génération…" : "Générer l'ordonnance"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal QR ──────────────────────────────────────────────────────── */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl max-w-xs w-full shadow-2xl flex flex-col items-center relative">
            <button onClick={() => { setQrModal(null); if (qrBlob) URL.revokeObjectURL(qrBlob); setQrBlob(null); }}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <X size={18} className="text-gray-600" />
            </button>
            <h3 className="font-black text-lg text-gray-900 mb-1">QR Code</h3>
            <p className="text-xs text-gray-500 mb-5 uppercase tracking-widest">{qrModal.patient_name}</p>
            <div className="w-48 h-48 rounded-2xl border border-gray-100 shadow-lg flex items-center justify-center mb-4 bg-white p-3">
              {qrBlob
                ? <img src={qrBlob} alt="QR" className="w-full h-full object-contain" />
                : <span className="w-8 h-8 border-2 border-[#395886] border-t-transparent rounded-full animate-spin" />}
            </div>
            <p className="text-xs text-gray-400">Présentez ce code au pharmacien</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-VIEW : PATIENT DETAIL (DOSSIER MÉDICAL)
// ============================================================================

function PatientDetailView({ patient, onBack, dk, onStartConsultation }) {
  const c = dk ? T.dark : T.light;

  const [patientData, setPatientData] = useState({});
  const [history, setHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", description: "", date: "", type: "Chronique" });
  const [pdfLoading, setPdfLoading] = useState({});

  const patientId = patient?.id;
  const isExternal = patient?._type === "external" || String(patientId || "").startsWith("ext-");
  const rawExtId = isExternal ? String(patientId).replace(/^ext-/, "") : null;

  useEffect(() => {
    if (!patientId) { setLoading(false); return; }

    if (isExternal) {
      // Patient externe : utilise les endpoints dédiés
      Promise.all([
        api.getExternalPatient(rawExtId).catch(() => null),
        api.getExternalPatientPrescriptions(rawExtId).catch(() => []),
        api.getExternalPatientConsultations(rawExtId).catch(() => []),
      ]).then(([record, rxList, consults]) => {
        setPatientData({
          profile: record ? {
            first_name: record.first_name,
            last_name: record.last_name,
            phone: record.phone,
            age: record.age,
          } : {},
          medical_profile: { allergies: [], blood_group: null },
          _external: record,
        });
        setHistory([]);
        setPrescriptions(Array.isArray(rxList) ? rxList : (rxList?.results ?? []));
        setConsultations(Array.isArray(consults) ? consults : (consults?.results ?? []));
        setLoading(false);
      });
    } else {
      Promise.all([
        api.getPatientRecord(patientId).catch(() => null),
        api.getPatientPrescriptions(patientId).catch(() => []),
        api.getMyConsultations(patientId).catch(() => []),
      ]).then(([record, rxList, consults]) => {
        setPatientData(record || {});
        setHistory(Array.isArray(record?.history) ? record.history : []);
        setPrescriptions(Array.isArray(rxList) ? rxList : []);
        setConsultations(Array.isArray(consults) ? consults : []);
        setLoading(false);
      });
    }
  }, [patientId, isExternal, rawExtId]);

  if (!patient) return null;

  const name = `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "—";
  const age = patient.age || "—";
  const sex = patientData?.profile?.gender || patientData?.gender || null;
  const bloodGroup =
    patientData?.medical_profile?.blood_group ||
    patientData?.medical_profile?.blood_type ||
    null;
  const allergies = Array.isArray(patientData?.medical_profile?.allergies)
    ? patientData.medical_profile.allergies
    : [];
  const weight = patientData?.medical_profile?.weight ?? null;
  const height = patientData?.medical_profile?.height ?? null;
  const bmi = patientData?.medical_profile?.bmi ?? null;
  const phone = patientData?.phone || patientData?.profile?.phone || null;
  const emergencyPhone = patientData?.medical_profile?.emergency_contact_phone || null;

  const completedConsults = consultations.filter((ct) => ct.status === "completed");
  const lastVisit = completedConsults.length > 0 ? completedConsults[0].consulted_at : null;
  const avatarIdx = typeof patientId === "number" ? patientId % AVATAR_COLORS.length : 0;
  const avatarColor = AVATAR_COLORS[avatarIdx];
  const avatarInitials = getInitials(patient.firstName || "", patient.lastName || "");

  const fmtDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return String(d); }
  };

  const allergyBadgeStyle = (severity) => {
    if (severity === "severe")   return { bg: "#FCEBEB", color: "#A32D2D" };
    if (severity === "moderate") return { bg: "#FAEEDA", color: "#854F0B" };
    return { bg: "#E6F1FB", color: "#185FA5" };
  };

  const antecedentBadgeStyle = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "chronique" || t === "chronic") return { bg: "#E6F1FB", color: "#185FA5", border: false };
    if (t === "en cours")                     return { bg: "#FAEEDA", color: "#854F0B", border: false };
    return { bg: "transparent", color: c.txt3, border: true };
  };

  const handleDeleteAntecedent = async (id) => {
    try { await api.deleteAntecedent(id); } catch {}
    setHistory((prev) => prev.filter((a) => a.id !== id));
    setConfirmDelete(null);
  };

  const handleAddAntecedent = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    let newItem = null;
    try {
      newItem = await api.addDiagnosisToPatient(patientId, {
        condition: addForm.name,
        description: addForm.description || undefined,
        diagnosis_date: addForm.date || undefined,
        type: addForm.type,
      });
    } catch {}
    setHistory((prev) => [
      ...prev,
      newItem || { name: addForm.name, diagnosis_date: addForm.date, type: addForm.type, description: addForm.description },
    ]);
    setAddForm({ name: "", description: "", date: "", type: "Chronique" });
    setShowAddForm(false);
  };

  const handleDownloadPdf = async (rxId) => {
    setPdfLoading((prev) => ({ ...prev, [rxId]: true }));
    try {
      const blob = await api.apiFetchBlob(`/prescriptions/${rxId}/pdf-download/`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ordonnance-${rxId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setPdfLoading((prev) => ({ ...prev, [rxId]: false }));
  };

  // Correction 3 — photo de profil
  const photoUrl =
    patientData?.photo ||
    patientData?.profile?.photo ||
    patientData?.user?.photo ||
    null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div
          className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: c.blue + "44", borderTopColor: c.blue }}
        />
      </div>
    );
  }

  // Tokens alignés MedicalProfilePage
  const pdvCard   = dk ? "bg-[#172133] border-gray-800"  : "bg-white border-gray-100";
  const pdvItem   = dk ? "bg-[#1E2D4A]/30" : "bg-[#F8FAFC]";
  const pdvTxt    = dk ? "#ffffff" : "#0D2644";
  const pdvTxt2   = dk ? "#9CA3AF" : "#5C738A";
  const pdvLabel  = "#A0B5CD";

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-10 min-h-screen px-1">
      {/* Retour */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold transition-all hover:opacity-70"
        style={{ color: c.blue }}
      >
        <ArrowLeft size={18} /> Retour
      </button>

      {/* SECTION 1 — HEADER PATIENT */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: dk
            ? "linear-gradient(135deg, #0D1B2E 0%, #1A2845 50%, #213354 100%)"
            : "linear-gradient(135deg, #304B71 0%, #4A6FA5 60%, #638ECB 100%)",
        }}
      >
        {/* Cercles décoratifs */}
        <div style={{ position: "absolute", top: -50, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: 60, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Photo patient"
                  style={{
                    width: 64, height: 64, borderRadius: "50%",
                    objectFit: "cover", flexShrink: 0,
                    border: "3px solid rgba(255,255,255,0.30)",
                  }}
                  onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                />
              )}
              <div
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "3px solid rgba(255,255,255,0.30)",
                  display: photoUrl ? "none" : "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 21, fontWeight: 700, color: "rgba(255,255,255,0.95)",
                  flexShrink: 0,
                }}
              >
                {avatarInitials}
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{name}</h1>
              <p className="text-sm mt-1 flex items-center flex-wrap gap-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                <span>{age} ans</span>
                {sex && (<><span className="opacity-50">·</span><span>{sex}</span></>)}
                {lastVisit && (<><span className="opacity-50">·</span><span>Dernier RDV : {fmtDate(lastVisit)}</span></>)}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {bloodGroup && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#FCEBEB", color: "#A32D2D" }}>
                    {bloodGroup}
                  </span>
                )}
                {allergies.filter((a) => a.severity === "severe").map((a, i) => (
                  <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(255,247,237,0.90)", color: "#C2410C" }}>
                    <AlertTriangle size={11} /> {a.substance || a.name || String(a)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:flex-col sm:items-end">
            <button
              onClick={() => setShowAddForm(true)}
              disabled={isExternal}
              title={isExternal ? "Non disponible pour un patient externe" : ""}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "rgba(255,255,255,0.90)", borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.12)" }}
            >
              Antécédent
            </button>
            {!isExternal && (
              <button
                onClick={onStartConsultation}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.35)", color: "#ffffff" }}
              >
                <Activity size={15} /> Démarrer consultation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2 — 3 COLONNES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`rounded-2xl p-5 border shadow-sm ${pdvCard}`}
          style={{ transition: "transform 0.2s, border-color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#6492C9"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = ""; }}>
          <h3 className="text-[11px] font-bold mb-4 tracking-wider uppercase" style={{ color: pdvLabel }}>Données physiques</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Poids",  value: weight != null ? `${weight} kg` : "—" },
              { label: "Taille", value: height != null ? `${height} cm` : "—" },
              { label: "IMC",    value: bmi    != null ? Number(bmi).toFixed(1) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: dk ? "rgba(30,45,74,0.3)" : "#F8FAFC" }}>
                <p className="text-lg font-black" style={{ color: pdvTxt }}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "#A0B5CD" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl p-5 border shadow-sm ${pdvCard}`}
          style={{ transition: "transform 0.2s, border-color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#6492C9"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = ""; }}>
          <h3 className="text-[11px] font-bold mb-4 tracking-wider uppercase" style={{ color: pdvLabel }}>Allergies</h3>
          {allergies.length === 0 ? (
            <p className="text-sm italic" style={{ color: pdvTxt2 }}>Aucune allergie connue</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allergies.map((a, i) => {
                const s = allergyBadgeStyle(a.severity);
                return (
                  <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
                    {a.substance || a.name || String(a)}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className={`rounded-2xl p-5 border shadow-sm ${pdvCard}`}
          style={{ transition: "transform 0.2s, border-color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#6492C9"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = ""; }}>
          <h3 className="text-[11px] font-bold mb-4 tracking-wider uppercase" style={{ color: pdvLabel }}>Contact</h3>
          <div className="space-y-2">
            <p className="text-sm font-bold" style={{ color: pdvTxt }}>{phone || "—"}</p>
            <p className="text-sm" style={{ color: pdvTxt2 }}>
              Urgence : <span className="font-bold" style={{ color: pdvTxt }}>{emergencyPhone || "Non renseigné"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3 — 2 COLONNES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Antécédents */}
        <div className={`rounded-2xl p-5 border shadow-sm ${pdvCard}`}
          style={{ transition: "transform 0.2s, border-color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#6492C9"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = ""; }}>
          <h3 className="text-[11px] font-bold mb-4 tracking-wider uppercase" style={{ color: pdvLabel }}>Antécédents médicaux</h3>
          <div className="space-y-3">
            {history.length === 0 && !showAddForm && (
              <p className="text-sm italic" style={{ color: pdvTxt2 }}>Aucun antécédent enregistré.</p>
            )}
            {history.map((ant, idx) => {
              const antId = ant.id;
              const antName = ant.condition || ant.name || "—";
              const bs = antecedentBadgeStyle(ant.type);
              const isConfirming = confirmDelete === antId;
              return (
                <div key={antId ?? idx} className={`flex items-center justify-between px-4 py-3 rounded-xl ${pdvItem}`}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: pdvTxt }}>{antName}</p>
                    {ant.diagnosis_date && (
                      <p className="text-xs mt-0.5" style={{ color: pdvTxt2 }}>Depuis {fmtDate(ant.diagnosis_date)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {ant.type && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${bs.border ? "border" : ""}`}
                        style={{ background: bs.bg, color: bs.color, borderColor: bs.border ? c.border : undefined }}
                      >
                        {ant.type}
                      </span>
                    )}
                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteAntecedent(antId)}
                          className="text-xs font-black px-2 py-1 rounded-lg text-white"
                          style={{ background: c.red }}
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs font-black px-2 py-1 rounded-lg border"
                          style={{ color: pdvTxt2, borderColor: c.border }}
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(antId)}
                        className="w-6 h-6 rounded-md border flex items-center justify-center transition-colors"
                        style={{ color: pdvTxt2, borderColor: dk ? "#374151" : "#E5E7EB", background: "transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#FECACA"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = pdvTxt2; e.currentTarget.style.borderColor = dk ? "#374151" : "#E5E7EB"; }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {showAddForm && (
              <div className="p-4 rounded-xl border-2 space-y-3" style={{ borderColor: c.blue + "44", background: dk ? "#1A2333" : "#F8FAFC" }}>
                <input
                  placeholder="Nom de l'antécédent *"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: dk ? "#172133" : "#fff", borderColor: c.border, color: pdvTxt }}
                />
                <textarea
                  placeholder="Description (optionnel)"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none h-16"
                  style={{ background: dk ? "#172133" : "#fff", borderColor: c.border, color: pdvTxt }}
                />
                <input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: dk ? "#172133" : "#fff", borderColor: c.border, color: pdvTxt }}
                />
                <div className="flex gap-2">
                  {["Chronique", "En cours", "Résolu"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, type: t })}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                      style={{
                        background: addForm.type === t ? c.blue : "transparent",
                        color: addForm.type === t ? "white" : pdvTxt2,
                        borderColor: addForm.type === t ? c.blue : c.border,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAntecedent}
                    className="flex-1 py-2 rounded-xl text-white text-sm font-bold"
                    style={{ background: c.blue }}
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 rounded-xl border text-sm font-bold"
                    style={{ borderColor: c.border, color: pdvTxt2 }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Consultations passées */}
        <div className={`rounded-2xl p-5 border shadow-sm ${pdvCard}`}
          style={{ transition: "transform 0.2s, border-color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#6492C9"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = ""; }}>
          <h3 className="text-[11px] font-bold mb-4 tracking-wider uppercase" style={{ color: pdvLabel }}>Consultations passées</h3>
          {completedConsults.length === 0 ? (
            <p className="text-sm italic" style={{ color: pdvTxt2 }}>Aucune consultation enregistrée.</p>
          ) : (
            <div className="space-y-3">
              {completedConsults.slice(0, 5).map((ct, i) => (
                <div key={ct.id || i} className={`flex items-center justify-between px-4 py-3 rounded-xl ${pdvItem}`}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: pdvTxt }}>{ct.diagnosis || "Consultation"}</p>
                    {ct.chief_complaint && (
                      <p className="text-xs mt-0.5" style={{ color: pdvTxt2 }}>Motif : {ct.chief_complaint}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold shrink-0 ml-2" style={{ color: pdvTxt2 }}>{fmtDate(ct.consulted_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4 — ORDONNANCES */}
      <div className={`rounded-2xl p-5 border shadow-sm ${pdvCard}`}
        style={{ transition: "transform 0.2s, border-color 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#6492C9"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = ""; }}>
        <h3 className="text-[11px] font-bold mb-4 tracking-wider uppercase" style={{ color: pdvLabel }}>Ordonnances passées</h3>
        {prescriptions.length === 0 ? (
          <p className="text-sm italic" style={{ color: pdvTxt2 }}>Aucune ordonnance disponible.</p>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx, i) => (
              <div key={rx.id || i} className={`flex items-center justify-between px-4 py-3 rounded-xl ${pdvItem}`}>
                <div>
                  <p className="text-sm font-bold" style={{ color: pdvTxt }}>
                    {rx.items?.[0]?.drug_name || "Ordonnance"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: pdvTxt2 }}>{fmtDate(rx.created_at)}</p>
                </div>
                {rx.id && (
                  <button
                    onClick={() => handleDownloadPdf(rx.id)}
                    disabled={!!pdfLoading[rx.id]}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ color: c.blue, borderColor: c.blue, background: c.blue + "0D" }}
                  >
                    {pdfLoading[rx.id] ? (
                      <span
                        className="w-4 h-4 border-2 rounded-full animate-spin inline-block"
                        style={{ borderColor: c.blue + "44", borderTopColor: c.blue }}
                      />
                    ) : (
                      <Download size={14} />
                    )}
                    PDF
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorReviewsView() {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c  = dk ? T.dark : T.light;

  const [reviews, setReviews]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    import("../../services/api").then(api =>
      api.getMyDoctorReviews().catch(() => null)
    ).then(data => {
      if (data) {
        setSummary({ rating: data.rating, total_reviews: data.total_reviews });
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const cardBg    = dk ? "#172133" : "#ffffff";
  const labelStyle = { color: dk ? "#A0B5CD" : "#5C738A", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" };
  const total     = summary?.total_reviews ?? reviews.length;
  const rating    = (total > 0 && summary?.rating) ? Number(summary.rating) : 0;

  function StarRow({ value }) {
    return (
      <span className="flex gap-0.5">
        {[1,2,3,4,5].map(n => (
          <Star key={n} size={14} fill={n <= Math.round(value) ? "#F0A500" : "none"} stroke={n <= Math.round(value) ? "#F0A500" : "#A0B5CD"} />
        ))}
      </span>
    );
  }

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold mb-6" style={{ color: c.txt }}>Mes Avis &amp; Notes</h2>

      <div className="rounded-2xl p-6 border mb-6 flex items-center gap-6" style={{ background: cardBg, borderColor: c.border }}>
        <div className="flex flex-col items-center justify-center w-28 shrink-0">
          <span className="text-5xl font-bold" style={{ color: c.txt }}>{loading ? "—" : rating.toFixed(1)}</span>
          <StarRow value={rating} />
          <span className="text-xs mt-1" style={{ color: c.txt3 }}>{loading ? "—" : total} avis</span>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5,4,3,2,1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span style={{ color: c.txt3, width: 8 }}>{star}</span>
                <Star size={11} fill="#F0A500" stroke="#F0A500" />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: c.border }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#F0A500" }} />
                </div>
                <span style={{ color: c.txt3, width: 28, textAlign: "right" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: cardBg, borderColor: c.border }}>
        <div className="px-5 pt-5 pb-3">
          <span style={labelStyle}>AVIS DES PATIENTS</span>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: c.txt3 }}>Chargement…</div>
        ) : reviews.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <Star size={28} style={{ color: c.txt3, opacity: 0.4 }} />
            <p className="text-sm" style={{ color: c.txt3 }}>Aucun avis reçu pour le moment.</p>
          </div>
        ) : reviews.map((rev, i) => (
          <div key={rev.id || i} className="px-5 py-4 border-b" style={{ borderColor: c.border }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: c.txt }}>{rev.patient_name || "Patient"}</p>
                {rev.comment && (
                  <p className="text-sm mt-1" style={{ color: c.txt2 }}>{rev.comment}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StarRow value={rev.rating} />
                <span className="text-[10px]" style={{ color: c.txt3 }}>
                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatisticsView() {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;
  const { t } = useLanguage();

  const data = useData();
  const appointments = Array.isArray(data?.appointments) ? data.appointments : [];
  const prescriptions = Array.isArray(data?.prescriptions) ? data.prescriptions : [];
  const patients = Array.isArray(data?.patients) ? data.patients : [];
  const apiKpis = data?.dashboardData?.kpis;
  const realTotal = apiKpis?.total_reviews ?? 0;
  const realAvg = (realTotal > 0 && apiKpis?.avg_rating != null)
    ? Number(apiKpis.avg_rating).toFixed(1)
    : "—";

  const stats = [
    {
      label: t('dashboard.doctor.nav.schedule'),
      value: appointments.length || 0,
      icon: Users,
      color: c.green,
    },
    {
      label: t('dashboard.doctor.nav.prescriptions'),
      value: prescriptions.length || 0,
      icon: FileText,
      color: c.blue,
    },
    {
      label: t('dashboard.doctor.nav.patients'),
      value: patients.length || 0,
      icon: Users,
      color: c.purple,
    },
    {
      label: t('dashboard.doctor.kpis.avgRating'),
      value: realAvg,
      icon: Star,
      color: c.amber,
    },
  ];

  const weekly = [38, 52, 45, 61, 58, 74, 69];
  const maxW = Math.max(...weekly) || 100;

  return (
    <div className="animate-in slide-in-from-bottom duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, i) => (
          <StatCard
            key={i}
            dk={dk}
            label={s.label}
            value={s.value}
            icon={s.icon}
            color={s.color}
            trend={s.trend}
          />
        ))}
      </div>

      <Card dk={dk} className="p-6">
        <h2 className="text-[17px] font-bold mb-8" style={{ color: c.txt }}>
          {t('dashboard.doctor.statistics.weeklyActivity')}
        </h2>
        <div className="flex items-end gap-3 h-48 mb-4 px-2">
          {weekly.map((h, i) => {
            const isLast = i === weekly.length - 1;
            const barHeight = maxW > 0 ? (h / maxW) * 100 : 0;
            // Assurer une largeur minimale et une couleur visible
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full group"
              >
                <div
                  className="relative w-full max-w-[32px] rounded-t-lg transition-all duration-300 group-hover:scale-x-110 shadow-sm"
                  style={{
                    height: `${Math.max(barHeight, 2)}%`,
                    background: isLast ? c.blue : c.blue + "44",
                    opacity: isLast ? 1 : 0.7,
                  }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-[#0D1B2E] text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all shadow-xl pointer-events-none z-10 whitespace-nowrap">
                    {t('dashboard.doctor.statistics.appointmentsTooltip', { count: h })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between px-2">
          {(DAYS || []).map((d, i) => (
            <span
              key={d?.day || i}
              className="text-[10px] font-black flex-1 text-center uppercase tracking-widest"
              style={{ color: c.txt3 }}
            >
              {d?.day || "---"}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// SUB-VIEW : SETTINGS
// ============================================================================

const WILAYAS_LIST = [
  "Alger","Oran","Constantine","Annaba","Blida","Batna","Sétif","Tlemcen",
  "Tizi Ouzou","Béjaïa","Jijel","Médéa","Mostaganem","Bouira","Bordj Bou Arréridj",
  "Boumerdès","Tipaza","Aïn Defla","Tissemsilt","Relizane","Chlef","Skikda",
  "Guelma","Souk Ahras","El Tarf","Mila","Khenchela","Oum El Bouaghi","Tébessa",
  "Biskra","Djelfa","Laghouat","El Bayadh","Naâma","Saïda","Mascara","Tiaret",
  "Adrar","Béchar","Tamanrasset","Illizi","Tindouf","El Oued","Ouargla",
  "Ghardaïa","Aïn Témouchent","Sidi Bel Abbès","Mascara","Autres",
];

function SettingsView() {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;
  const { userData: user, refreshUserData } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [showPwd, setShowPwd] = useState(false);
  const [locSaved, setLocSaved] = useState(false);
  const [msgDisabled, setMsgDisabled] = useState(() => !!user?.messages_disabled);
  const [msgToggling, setMsgToggling] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [pwdStatus, setPwdStatus] = useState({ type: "", msg: "" });
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  // ── Location state ──
  const [locForm, setLocForm] = useState({
    address: "",
    commune: "",
    wilaya: "Alger",
    mapsUrl: "",
  });
  const [identityReason, setIdentityReason] = useState("");
  const [emailReason, setEmailReason] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setLocForm(f => ({
        ...f,
        address: user.address || "",
        commune: user.city    || "",
        wilaya:  user.wilaya  || "",
        mapsUrl: user.maps_url || "",
      }));
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setStatus({ type: "", msg: "" });
      const nameChanged = form.first_name !== (user?.first_name || "") || form.last_name !== (user?.last_name || "");
      const emailChanged = form.email !== (user?.email || "");

      if (nameChanged && !identityReason) {
        setStatus({ type: "info", msg: "Veuillez indiquer le motif du changement de nom." });
        setIsSaving(false);
        return;
      }
      if (emailChanged && !emailReason) {
        setStatus({ type: "info", msg: "Veuillez indiquer le motif du changement d'email." });
        setIsSaving(false);
        return;
      }

      const updatePromises = [
        api.updateMe({ email: emailChanged ? form.email : undefined, phone: form.phone }),
      ];
      if (nameChanged && identityReason) {
        updatePromises.push(
          api.requestProfileUpdate({ new_first_name: form.first_name, new_last_name: form.last_name, reason: identityReason })
        );
      } else if (!nameChanged) {
        updatePromises[0] = api.updateMe({
          first_name: form.first_name,
          last_name: form.last_name,
          email: emailChanged ? form.email : undefined,
          phone: form.phone,
        });
      }

      await Promise.all(updatePromises);
      setStatus({
        type: "success",
        msg: nameChanged
          ? "Profil mis à jour. La demande de changement de nom a été envoyée à l'administrateur."
          : t('dashboard.doctor.settings.profileUpdated'),
      });
      setIdentityReason("");
      setEmailReason("");
      setTimeout(() => setStatus({ type: "", msg: "" }), 4000);
    } catch (err) {
      setStatus({ type: "error", msg: t('dashboard.doctor.settings.profileError') });
      setTimeout(() => setStatus({ type: "", msg: "" }), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePwd = async () => {
    try {
      setIsSavingPwd(true);
      setPwdStatus({ type: "", msg: "" });
      await api.changePassword(pwdForm);
      setPwdStatus({ type: "success", msg: t('dashboard.doctor.settings.passwordUpdated') });
      setPwdForm({ currentPassword: "", newPassword: "" });
      setTimeout(() => setPwdStatus({ type: "", msg: "" }), 4000);
    } catch (err) {
      setPwdStatus({ type: "error", msg: t('dashboard.doctor.settings.passwordError') });
      setTimeout(() => setPwdStatus({ type: "", msg: "" }), 4000);
    } finally {
      setIsSavingPwd(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      await api.updateMe({
        address: locForm.address || undefined,
        city:    locForm.commune || undefined,
        wilaya:  locForm.wilaya || undefined,
        maps_url: locForm.mapsUrl || undefined,
      });
      setLocSaved(true);
    } catch (err) {
      console.error("Doctor location save failed:", err);
    } finally {
      setTimeout(() => setLocSaved(false), 3000);
    }
  };

  // Helper: input style
  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all focus:ring-2";
  const inputStyle = { background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt };
  const labelCls = "block text-xs font-bold uppercase tracking-wide mb-1.5";

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* ── Top 2-col grid: Profile + Security ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

        {/* Profile card */}
        <Card dk={dk}>
          <p className="font-semibold mb-5" style={{ color: c.txt }}>{t('dashboard.doctor.settings.profile')}</p>
          {status.msg && (
            <div className="mb-4 p-3 rounded-xl text-xs font-semibold" style={{
              background: status.type === "success" ? "#2D8C6F12" : status.type === "info" ? "#E8A83812" : "#E0555512",
              color: status.type === "success" ? "#2D8C6F" : status.type === "info" ? "#E8A838" : "#E05555",
              border: `1px solid ${status.type === "success" ? "#2D8C6F44" : status.type === "info" ? "#E8A83844" : "#E0555544"}`,
            }}>{status.msg}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: c.txt3 }}>Prénom</label>
              <input type="text"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className="px-3 py-2 border rounded-xl text-sm w-full outline-none transition-all"
                style={{ background: c.card, borderColor: c.border, color: c.txt }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: c.txt3 }}>Nom</label>
              <input type="text"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className="px-3 py-2 border rounded-xl text-sm w-full outline-none transition-all"
                style={{ background: c.card, borderColor: c.border, color: c.txt }}
              />
            </div>
            {(form.first_name !== (user?.first_name || "") || form.last_name !== (user?.last_name || "")) && (
              <div className="sm:col-span-2 animate-in fade-in slide-in-from-top-2">
                <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#E8A838" }}>
                  Motif du changement de nom (Requis pour validation Admin)
                </label>
                <textarea
                  value={identityReason}
                  onChange={(e) => setIdentityReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous souhaitez modifier votre identité officielle..."
                  className="px-3 py-2 border rounded-xl text-sm w-full outline-none transition-all min-h-[60px]"
                  style={{ background: "#E8A83808", borderColor: "#E8A83844", color: c.txt }}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: c.txt3 }}>Email</label>
              <input type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="px-3 py-2 border rounded-xl text-sm w-full outline-none transition-all"
                style={{ background: c.card, borderColor: c.border, color: c.txt }}
              />
            </div>
            {form.email !== (user?.email || "") && (
              <div className="sm:col-span-2 animate-in fade-in slide-in-from-top-2">
                <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#E8A838" }}>
                  Motif du changement d'email (Requis)
                </label>
                <textarea
                  value={emailReason}
                  onChange={(e) => setEmailReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous souhaitez changer votre adresse email..."
                  className="px-3 py-2 border rounded-xl text-sm w-full outline-none transition-all min-h-[60px]"
                  style={{ background: "#E8A83808", borderColor: "#E8A83844", color: c.txt }}
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: c.txt3 }}>Téléphone</label>
              <input type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="px-3 py-2 border rounded-xl text-sm w-full outline-none transition-all"
                style={{ background: c.card, borderColor: c.border, color: c.txt }}
              />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: c.blue, opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? t('dashboard.doctor.settings.saving') : t('dashboard.doctor.settings.saveChanges')}
          </button>
        </Card>

        {/* Security card */}
        <Card dk={dk}>
          <p className="font-semibold mb-5" style={{ color: c.txt }}>{t('dashboard.doctor.settings.security')}</p>
          {pwdStatus.msg && (
            <div className="mb-4 p-3 rounded-xl text-xs font-semibold" style={{
              background: pwdStatus.type === "success" ? "#2D8C6F12" : "#E0555512",
              color: pwdStatus.type === "success" ? "#2D8C6F" : "#E05555",
              border: `1px solid ${pwdStatus.type === "success" ? "#2D8C6F44" : "#E0555544"}`,
            }}>{pwdStatus.msg}</div>
          )}
          {[
            { label: t('dashboard.doctor.settings.currentPwd'), key: "currentPassword" },
            { label: t('dashboard.doctor.settings.newPwd'),     key: "newPassword" },
          ].map((field) => (
            <div key={field.key} className="mb-4 relative">
              <label className={labelCls} style={{ color: c.txt2 }}>{field.label}</label>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={pwdForm[field.key]}
                onChange={(e) => setPwdForm({ ...pwdForm, [field.key]: e.target.value })}
                className={`${inputCls} pr-12`}
                style={inputStyle}
              />
              <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-8" style={{ color: c.txt3 }}>
                {showPwd ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          ))}
          <button
            onClick={handleSavePwd}
            disabled={isSavingPwd}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80 active:scale-95"
            style={{ color: c.blue, borderColor: c.border, opacity: isSavingPwd ? 0.7 : 1 }}
          >
            {isSavingPwd ? t('dashboard.doctor.settings.updating') : t('dashboard.doctor.settings.updatePwd')}
          </button>
        </Card>
      </div>

      {/* ── Clinic Location & Maps ── */}
      <Card dk={dk}>
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.blue + "18" }}>
            <MapPin size={18} style={{ color: c.blue }} />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: c.txt }}>{t('dashboard.doctor.settings.clinicLocation')}</p>
            <p className="text-xs" style={{ color: c.txt3 }}>{t('dashboard.doctor.settings.manageAddress')}</p>
          </div>
        </div>

        {/* Success banner */}
        {locSaved && (
          <div className="mb-5 p-3 rounded-xl text-xs font-semibold flex items-center gap-2" style={{
            background: "#2D8C6F12", color: "#2D8C6F", border: "1px solid #2D8C6F44",
          }}>
            <Check size={14} /> {t('dashboard.doctor.settings.mapSaved')}
          </div>
        )}

        {/* Responsive 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: form fields */}
          <div className="space-y-5">

            {/* Adresse de l'établissement */}
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>{t('dashboard.doctor.settings.clinicAddress')}</label>
              <input
                type="text"
                placeholder="Ex: 12 Rue Didouche Mourad"
                value={locForm.address}
                onChange={(e) => setLocForm((f) => ({ ...f, address: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </div>

            {/* Commune */}
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>{t('dashboard.doctor.settings.commune')}</label>
              <input
                type="text"
                placeholder="Ex: Alger-Centre"
                value={locForm.commune}
                onChange={(e) => setLocForm((f) => ({ ...f, commune: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </div>

            {/* Wilaya */}
            <div>
              <DashSelect
                label="Wilaya"
                value={locForm.wilaya}
                options={WILAYAS_LIST}
                onSelect={w => setLocForm(f => ({ ...f, wilaya: w }))}
                dk={dk}
                c={c}
              />
            </div>

            {/* Google Maps URL */}
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>{t('dashboard.doctor.settings.mapsLink')}</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('dashboard.doctor.settings.pasteMaps')}
                  value={locForm.mapsUrl}
                  onChange={(e) => setLocForm((f) => ({ ...f, mapsUrl: e.target.value }))}
                  className={`${inputCls} pl-10`}
                  style={inputStyle}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.txt3 }}>
                  <LinkIcon size={15} />
                </div>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveLocation}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, #304B71, ${c.blue})` }}
            >
              <MapPin size={15} /> {t('dashboard.doctor.settings.updateMap')}
            </button>
          </div>

          {/* Right: map preview with Smart Parser */}
          <div className="flex flex-col gap-3">
            <label className={labelCls} style={{ color: c.txt2 }}>{t('dashboard.doctor.settings.mapPreview')}</label>
            {(() => {
              const addressQuery = [locForm.address, locForm.commune, locForm.wilaya]
                .filter(Boolean)
                .join(", ");
              
              let embedSrc = null;
              let openUrl = locForm.mapsUrl || null;

              if (locForm.mapsUrl) {
                // If it's already an embed output link
                if (locForm.mapsUrl.includes("output=embed") || locForm.mapsUrl.includes("/embed")) {
                  embedSrc = locForm.mapsUrl;
                } else {
                  // Regex to find Coordinates (@lat,lng) or Place Names (/place/Nom)
                  const coordMatch = locForm.mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                  const placeMatch = locForm.mapsUrl.match(/\/place\/([^\/]+)/);
                  const rawCoord = locForm.mapsUrl.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/); // If user typed exact coordinates

                  if (rawCoord) {
                    embedSrc = `https://maps.google.com/maps?q=${rawCoord[1]},${rawCoord[2]}&hl=fr&z=15&output=embed`;
                  } else if (coordMatch) {
                    embedSrc = `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&hl=fr&z=15&output=embed`;
                  } else if (placeMatch) {
                    embedSrc = `https://maps.google.com/maps?q=${placeMatch[1]}&hl=fr&z=15&output=embed`;
                  } else {
                    // Fallback to query mapping if it's a short link or weird format
                    embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(locForm.mapsUrl)}&hl=fr&z=15&output=embed`;
                  }
                }
              } else if (addressQuery) {
                // Fallback to text query based on the typed address
                embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}&hl=fr&z=15&output=embed`;
                openUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}`;
              }

              return embedSrc ? (
                /* ── Real map ── */
                <div className="relative flex-1 min-h-[280px] rounded-2xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: c.blue + "55", background: c.card }}>
                  <iframe
                    key={embedSrc}
                    title="Map Preview"
                    src={embedSrc}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: 280, display: "block" }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  {/* Floating open button */}
                  {openUrl && (
                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:opacity-90"
                      style={{ background: c.blue }}
                    >
                      <MapPin size={12} /> {t('dashboard.doctor.settings.openInMaps')}
                    </a>
                  )}
                </div>
              ) : (
                /* ── Empty state ── */
                <div
                  className="flex-1 min-h-[280px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all"
                  style={{ background: dk ? "#0D1117" : "#F4F8FB", borderColor: c.border }}
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: c.blue + "18" }}>
                      <MapPin size={28} style={{ color: c.blue }} />
                    </div>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{ background: c.blue }} />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-bold" style={{ color: c.txt }}>{t('dashboard.doctor.settings.mapPreview')}</p>
                    <p className="text-xs mt-1" style={{ color: c.txt3 }}>
                      {t('dashboard.doctor.settings.noAddressHint')}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </Card>

      {/* ── Confidentialité messages ── */}
      <Card dk={dk}>
        <p className="font-semibold mb-1" style={{ color: c.txt }}>Confidentialité</p>
        <p className="text-xs mb-4" style={{ color: c.txt3 }}>
          Contrôlez qui peut vous envoyer des messages sur Healy.
        </p>
        <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: c.border }}>
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-sm font-semibold" style={{ color: c.txt }}>Désactiver les messages</p>
            <p className="text-xs mt-0.5" style={{ color: c.txt3 }}>
              {msgDisabled
                ? "Vous n'êtes pas joignable par messagerie. Les autres utilisateurs verront que vos messages sont désactivés."
                : "Vous pouvez recevoir des messages de vos patients."}
            </p>
          </div>
          <button
            onClick={async () => {
              if (msgToggling) return;
              setMsgToggling(true);
              const next = !msgDisabled;
              try {
                await api.updateMe({ messages_disabled: next });
                setMsgDisabled(next);
                await refreshUserData();
              } catch { /* silencieux */ }
              finally { setMsgToggling(false); }
            }}
            className="relative shrink-0 w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
            style={{ background: msgDisabled ? c.red : c.green, opacity: msgToggling ? 0.6 : 1 }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
              style={{ transform: msgDisabled ? "translateX(24px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </Card>

      {/* ── Language + About ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card dk={dk}>
          <p className="font-semibold mb-4" style={{ color: c.txt }}>{t('dashboard.doctor.settings.language')}</p>
          <div className="flex gap-2 flex-wrap">
            {["Français", "English"].map((langName, i) => {
              const targetLang = i === 0 ? 'fr' : 'en';
              const active = lang === targetLang;
              return (
                <button
                  key={langName}
                  onClick={() => setLang(targetLang)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                  style={{
                    background: active ? c.blue : "transparent",
                    color: active ? "#fff" : c.txt2,
                    borderColor: active ? c.blue : c.border,
                  }}
                >
                  {langName}
                </button>
              );
            })}
          </div>
        </Card>
        <Card dk={dk}>
          <p className="font-semibold mb-2" style={{ color: c.txt }}>{t('dashboard.doctor.settings.about')}</p>
          <p className="text-sm" style={{ color: c.txt2 }}>{t('dashboard.doctor.settings.aboutDesc')}</p>
          <p className="text-xs mt-1" style={{ color: c.txt3 }}>{t('dashboard.doctor.settings.certified')}</p>
        </Card>
      </div>

      <ContactAdminCard dk={dk} />
    </div>
  );
}

// ============================================================================
// SUB-VIEW : PATIENT CONSULTATION VIEW
// ============================================================================

const FALLBACK_PATIENT = {
  history: [],
  labs: [],
  prescriptions: [],
};

function PatientConsultationView({ appointment, onComplete, dk, c, setCurrentPage, doctorName }) {
  const { t } = useLanguage();
  // ── Tabs ──
  const [activeTab, setActiveTab] = useState("history");

  // ── Patient record (API or fallback) ──
  const [patientData, setPatientData] = useState(FALLBACK_PATIENT);
  const [history, setHistory] = useState(FALLBACK_PATIENT.history);
  const [labs, setLabs] = useState(FALLBACK_PATIENT.labs);
  const [prescriptions, setPrescriptions] = useState(FALLBACK_PATIENT.prescriptions);
  const [isDataFallback, setIsDataFallback] = useState(false);

  useEffect(() => {
    const pid = appointment?.patient_id ?? appointment?.id ?? null;
    if (!pid) {
      setPatientData(FALLBACK_PATIENT);
      setIsDataFallback(true);
      return;
    }
    api.getPatientRecord(pid)
      .then(data => {
        if (data) {
          setPatientData(data);
          setIsDataFallback(false);
        } else {
          setPatientData(FALLBACK_PATIENT);
          setIsDataFallback(true);
        }
      })
      .catch(() => {
        setPatientData(FALLBACK_PATIENT);
        setIsDataFallback(true);
      });
  }, [appointment]);

  useEffect(() => {
    const normalizeHistory = (h) => ({
      ...h,
      date:  h.date  || h.diagnosis_date || "",
      note:  h.note  || h.description   || "",
      doc:   h.doc   || h.doctor_name   || "",
      title: h.title || h.condition     || "",
      type:  h.type  || "Chronic",
    });
    const normalizeLab = (l) => ({
      ...l,
      test:   l.test   || l.test_name || "",
      ref:    l.ref    || l.lab_name  || "—",
      result: l.result != null ? l.result : "—",
      status: l.status || "Requested",
    });
    const normalizeRx = (p) => ({
      ...p,
      med:  p.med  || p.medication        || "",
      freq: p.freq || p.frequency         || "",
      dur:  p.dur  || p.duration          || "",
      date: p.date || p.prescription_date || "",
    });
    setHistory(prev => {
      const localOnly = prev.filter(h => h._local);
      return [...localOnly, ...(patientData.history || []).map(normalizeHistory)];
    });
    setLabs(prev => {
      const localOnly = prev.filter(l => l._local);
      return [...localOnly, ...(patientData.lab_results || patientData.labs || []).map(normalizeLab)];
    });
    setPrescriptions(prev => {
      const localOnly = prev.filter(p => p._local);
      return [...localOnly, ...(patientData.prescriptions || []).map(normalizeRx)];
    });
  }, [patientData]);

  const [showAddHistory, setShowAddHistory] = useState(false);
  const [newHist, setNewHist] = useState({ title: "", date: "", type: "Chronic" });
  const [showAddLab, setShowAddLab] = useState(false);
  const [newLab, setNewLab] = useState({ test: "", note: "" });
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // ── Right column ──
  const [vitals, setVitals] = useState({ bp: "", hr: "", temp: "", spo2: "" });
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [diagnosisError, setDiagnosisError] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [terminateError, setTerminateError] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);
  const [pdfDownloading, setPdfDownloading] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [qrBlobUrl, setQrBlobUrl] = useState(null);
  const [qrBlobMap, setQrBlobMap] = useState({});
  const diagnosisRef = useRef(null);

  const fetchQrBlob = (rawUrl) => {
    const path = rawUrl.replace(/^https?:\/\/[^/]+/, "").replace(/^\/api/, "");
    return api.apiFetchBlob(path).then(blob => URL.createObjectURL(blob)).catch(() => null);
  };

  useEffect(() => {
    if (!sessionResult?.prescription_qr_url) return;
    let active = true;
    fetchQrBlob(sessionResult.prescription_qr_url).then(url => {
      if (active && url) setQrBlobUrl(url);
    });
    return () => { active = false; };
  }, [sessionResult?.prescription_qr_url]);

  useEffect(() => {
    const withQr = prescriptions.filter(p => p.prescription_qr_url && !p._local);
    if (!withQr.length) return;
    let active = true;
    Promise.all(withQr.map(p =>
      fetchQrBlob(p.prescription_qr_url).then(url => ({ key: p.id || p.prescription_qr_url, url }))
    )).then(results => {
      if (!active) return;
      const map = {};
      results.forEach(({ key, url }) => { if (url) map[key] = url; });
      setQrBlobMap(map);
    });
    return () => { active = false; };
  }, [prescriptions]);

  const handleDownloadRxPdf = async (rxId) => {
    if (!rxId) return;
    const idStr = String(rxId);
    setPdfDownloading(idStr);
    setPdfError(null);
    try {
      const blob = await api.apiFetchBlob(`/prescriptions/${idStr}/pdf-download/`);
      if (blob.type === "application/json") {
        const text = await blob.text();
        const errData = JSON.parse(text);
        throw new Error(errData.detail || "Erreur serveur");
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `ordonnance-${idStr.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Erreur PDF:", err);
      setPdfError({ id: idStr, msg: err.message || "Erreur de téléchargement" });
    } finally {
      setPdfDownloading(null);
    }
  };

  // ── Patient info (from appointment or API) ──
  const patientName = appointment?.patient_name || appointment?.patient || appointment?.name || "Patient";
  const patientAge = (() => {
    if (appointment?.age) return appointment.age;
    const bd = patientData?.profile?.birth_date || appointment?.birth_date;
    if (!bd) return "—";
    const birth = new Date(bd);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  })();
  const bloodGroup = patientData?.medical_profile?.blood_group
    || patientData?.medical_profile?.blood_type
    || null;
  const patientAllergies = Array.isArray(patientData?.medical_profile?.allergies)
    ? patientData.medical_profile.allergies.map(a => a?.substance || a?.name || a).filter(Boolean)
    : [];

  // ── Handlers ──
  const handleAddHistory = (e) => {
    e.preventDefault();
    if (!newHist.title) return;
    setHistory(prev => [{ ...newHist, doc: doctorName || "Dr. Current", note: "Ajouté pendant la consultation.", _local: true }, ...prev]);
    setNewHist({ title: "", date: "", type: "Chronic" });
    setShowAddHistory(false);
    const pid = appointment?.patient_id ?? appointment?.id ?? null;
    if (pid) {
      api.addDiagnosisToPatient(pid, {
        condition: newHist.title,
        diagnosis_date: newHist.date || undefined,
      }).catch(() => {});
    }
  };
  const handleDeleteHistory = (i) => setHistory(prev => prev.filter((_, idx) => idx !== i));

  const handleAddLab = (e) => {
    e.preventDefault();
    if (!newLab.test) return;
    setLabs(prev => [{ test: newLab.test, result: "Pending", ref: "—", status: "Requested", _local: true }, ...prev]);
    setNewLab({ test: "", note: "" });
    setShowAddLab(false);
  };
  const handleDeleteLab = (i) => setLabs(prev => prev.filter((_, idx) => idx !== i));


  const handleTerminate = async () => {
    if (!diagnosis.trim()) {
      setDiagnosisError(true);
      diagnosisRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      diagnosisRef.current?.focus();
      return;
    }
    if (!appointment?.id) {
      setTerminateError(
        "Aucun rendez-vous associé à cette consultation. Pour clôturer une consultation, lancez-la depuis le planning (un RDV confirmé est requis)."
      );
      return;
    }
    setDiagnosisError(false);
    setTerminateError(null);
    setIsTerminating(true);

    try {
      const payload = {
        appointment_id: appointment.id,
        symptoms,
        diagnosis,
        treatment_plan: plan || undefined,
        vitals: {
          blood_pressure:    vitals.bp   || null,
          heart_rate:        vitals.hr   ? Number(vitals.hr)   : null,
          temperature:       vitals.temp ? Number(vitals.temp) : null,
          oxygen_saturation: vitals.spo2 ? Number(vitals.spo2) : null,
        },
        prescriptions: prescriptions
          .filter(p => p._local)
          .map(p => {
            const FREQ_MAP = {
              // Labels anglais (FREQUENCY_OPTIONS du formulaire de consultation)
              "Once daily":        "1x_day",
              "Twice daily":       "2x_day",
              "Three times daily": "3x_day",
              "Every 8 hours":     "every_8h",
              "As needed":         "as_needed",
              // Labels français (formulaire rapide PrescriptionsView)
              "1x/jour":           "1x_day",
              "2x/jour":           "2x_day",
              "3x/jour":           "3x_day",
              "toutes les 8h":     "every_8h",
              "si besoin":         "as_needed",
              // Valeurs API directes (déjà mappées)
              "1x_day":   "1x_day",
              "2x_day":   "2x_day",
              "3x_day":   "3x_day",
              "every_8h": "every_8h",
              "as_needed":"as_needed",
            };
            return {
              drug_name: p.med,
              frequency: FREQ_MAP[p.freq] || "1x_day",
              duration:  p.dur,
            };
          }),
        lab_requests: labs
          .filter(l => l._local)
          .map(l => ({
            test:  l.test,
            notes: l.note || "",
          })),
      };
      const result = await api.completeSession(payload);

      const entry = {
        date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
        title: diagnosis,
        doc: doctorName || "Dr. Current",
        note: symptoms || "Consultation terminée.",
        type: "Normal",
        _local: true,
      };
      setHistory(prev => [entry, ...prev]);
      setSessionResult(result || {});
      setShowSummaryModal(true);
    } catch (err) {
      setTerminateError(err.message || "Erreur lors de la clôture de la session.");
    } finally {
      setIsTerminating(false);
    }
  };

  // ── Base URL pour les ressources relatives du backend ──
  const API_ORIGIN = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://127.0.0.1:8000";

  const localPrescriptions = prescriptions.filter(p => p._local);
  const qrUrl = sessionResult?.prescription_qr_url
    ? (sessionResult.prescription_qr_url.startsWith("http")
        ? sessionResult.prescription_qr_url
        : `${API_ORIGIN}${sessionResult.prescription_qr_url}`)
    : null;

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-10">

      {/* ── Modal résumé post-consultation ── */}
      {showSummaryModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
        }}>
          <div style={{
            background: dk ? "#141B27" : "#fff",
            borderRadius: 28, padding: 36, maxWidth: 520, width: "100%",
            boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
            border: `1px solid ${c.border}`,
            maxHeight: "90vh", overflowY: "auto",
          }}>
            {/* En-tête */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: c.green + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check size={26} style={{ color: c.green }} />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: c.txt, margin: 0 }}>{t('dashboard.doctor.consultation.recorded')}</p>
                <p style={{ fontSize: 13, color: c.txt3, margin: 0, marginTop: 2 }}>
                  {sessionResult?.consultation_id ? `#${String(sessionResult.consultation_id).slice(0, 8).toUpperCase()}` : ""}
                </p>
              </div>
            </div>

            {/* Patient */}
            <div style={{ padding: "14px 18px", borderRadius: 14, background: c.blue + "10", marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: c.txt3, margin: 0, marginBottom: 4 }}>Patient</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: c.txt, margin: 0 }}>{patientName}</p>
            </div>

            {/* Diagnostic */}
            <div style={{ padding: "14px 18px", borderRadius: 14, background: c.blueLight, marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: c.txt3, margin: 0, marginBottom: 6 }}>{t('dashboard.doctor.consultation.diagnosis')}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: c.txt, margin: 0, lineHeight: 1.5 }}>{diagnosis}</p>
            </div>

            {/* Symptômes */}
            {symptoms.trim() && (
              <div style={{ padding: "14px 18px", borderRadius: 14, background: c.blueLight, marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: c.txt3, margin: 0, marginBottom: 6 }}>{t('dashboard.doctor.consultation.symptomsLabel')}</p>
                <p style={{ fontSize: 13, color: c.txt2, margin: 0, lineHeight: 1.6 }}>{symptoms}</p>
              </div>
            )}

            {/* Prescriptions ajoutées */}
            {localPrescriptions.length > 0 && (
              <div style={{ padding: "14px 18px", borderRadius: 14, background: c.blueLight, marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: c.txt3, margin: 0, marginBottom: 10 }}>
                  {t('dashboard.doctor.consultation.prescriptions')} ({localPrescriptions.length})
                </p>
                {localPrescriptions.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < localPrescriptions.length - 1 ? 8 : 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.blue, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: c.txt, margin: 0 }}>
                      {p.med} <span style={{ color: c.txt3, fontWeight: 400 }}>— {p.freq} · {p.dur}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* QR Code */}
            {sessionResult?.prescription_qr_url && (
              <div style={{ padding: "14px 18px", borderRadius: 14, border: `2px solid ${c.border}`, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                {qrBlobUrl
                  ? <img src={qrBlobUrl} alt="QR ordonnance" style={{ width: 80, height: 80, borderRadius: 10, background: "#fff", padding: 4, flexShrink: 0 }} />
                  : <div style={{ width: 80, height: 80, borderRadius: 10, background: c.blueLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 10, color: c.txt3 }}>Chargement…</span></div>
                }
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: c.txt, margin: 0 }}>{t('dashboard.doctor.consultation.qrCode')}</p>
                  <p style={{ fontSize: 11, color: c.txt3, margin: 0, marginTop: 3 }}>
                    Token : {sessionResult?.prescription_token || "—"}
                  </p>
                  {(() => {
                    const summaryRxId = sessionResult?.prescription_id || sessionResult?.prescription?.id;
                    const idStr = summaryRxId ? String(summaryRxId) : null;
                    const isLoading = idStr && pdfDownloading === idStr;
                    const hasErr = idStr && pdfError?.id === idStr;
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDownloadRxPdf(summaryRxId)}
                          disabled={!summaryRxId || isLoading}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "6px 14px", borderRadius: 8, background: c.blue + "15", color: c.blue, fontSize: 12, fontWeight: 700, border: "none", cursor: summaryRxId && !isLoading ? "pointer" : "not-allowed", opacity: !summaryRxId || isLoading ? 0.6 : 1 }}>
                          {isLoading ? (
                            <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: c.blue }} />
                          ) : (
                            <Download size={13} />
                          )}
                          {t('dashboard.doctor.consultation.downloadRx')}
                        </button>
                        {hasErr && (
                          <p style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, background: c.red + "15", border: `1px solid ${c.red}40`, color: c.red, fontSize: 11, fontWeight: 600 }}>
                            {pdfError.msg}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Bouton fermer → redirection */}
            <button
              onClick={() => { setShowSummaryModal(false); onComplete(); }}
              style={{ width: "100%", padding: "14px", borderRadius: 16, background: `linear-gradient(135deg, ${c.blue}, #304B71)`, color: "#fff", fontSize: 14, fontWeight: 800, border: "none", cursor: "pointer", letterSpacing: "0.5px" }}
            >
              {t('dashboard.doctor.consultation.returnToSchedule')}
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER pleine largeur ── */}
      <div className={`rounded-2xl p-4 border shadow-sm flex items-center justify-between gap-4 flex-wrap ${dk ? "bg-[#172133] border-gray-800" : "bg-white border-gray-100"}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: "#304B71" }}>
            {getInitials(...(patientName + " ").split(" ").slice(0, 2))}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[15px]" style={{ color: dk ? "#ffffff" : "#0D2644" }}>{patientName}</span>
              <span className="text-sm" style={{ color: "#5C738A" }}>{patientAge} ans</span>
              {bloodGroup && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FCEBEB", color: "#A32D2D" }}>{bloodGroup}</span>
              )}
              {patientAllergies.slice(0, 2).map((a, i) => (
                <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#FFF7ED", color: "#C2410C" }}>
                  <AlertTriangle size={9} /> {a}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showQuitConfirm ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{ borderColor: "#FECACA", background: dk ? "rgba(239,68,68,0.08)" : "#FFF5F5" }}>
              <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "#5C738A" }}>Quitter sans sauvegarder ?</span>
              <button onClick={() => onComplete()} className="px-3 py-1 rounded-lg text-xs font-black text-white bg-red-500">Confirmer</button>
              <button onClick={() => setShowQuitConfirm(false)} className="px-3 py-1 rounded-lg text-xs font-bold border"
                style={{ color: "#5C738A", borderColor: dk ? "#374151" : "#E5E7EB" }}>Annuler</button>
            </div>
          ) : (
            <button onClick={() => setShowQuitConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-bold transition-all hover:bg-red-50"
              style={{ color: "#EF4444", borderColor: "#FECACA", background: "transparent" }}>
              <X size={15} /> Quitter
            </button>
          )}
          <button onClick={handleTerminate} disabled={isTerminating}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#304B71" }}>
            {isTerminating
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Check size={15} />}
            Terminer la session
          </button>
        </div>
      </div>

      {/* ── 2 COLONNES ── */}
      <div className="flex gap-5 items-start">

        {/* COLONNE GAUCHE — dossier patient */}
        <div className="flex-1 space-y-4 min-w-0">

          {/* Card Antécédents médicaux (lecture seule) */}
          <div className={`rounded-2xl p-5 border shadow-sm ${dk ? "bg-[#172133] border-gray-800" : "bg-white border-gray-100"}`}>
            <h3 className="text-[11px] font-bold mb-4 tracking-wider uppercase" style={{ color: "#A0B5CD" }}>Antécédents médicaux</h3>
            {history.length === 0 ? (
              <p className="text-sm italic" style={{ color: dk ? "#9CA3AF" : "#5C738A" }}>Aucun antécédent enregistré.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => {
                  const typeKey = (h.type || "").toLowerCase();
                  const typeBg = typeKey === "chronic" || typeKey === "chronique" ? "#E6F1FB"
                    : typeKey === "en cours" ? "#FAEEDA" : "transparent";
                  const typeColor = typeKey === "chronic" || typeKey === "chronique" ? "#185FA5"
                    : typeKey === "en cours" ? "#854F0B" : (dk ? "#9CA3AF" : "#5C738A");
                  return (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: dk ? "rgba(30,45,74,0.3)" : "#F8FAFC" }}>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: dk ? "#ffffff" : "#0D2644" }}>{h.title || h.condition || "—"}</p>
                        {(h.date || h.diagnosis_date) && (
                          <p className="text-xs mt-0.5" style={{ color: dk ? "#9CA3AF" : "#5C738A" }}>
                            Depuis {h.date || h.diagnosis_date}
                          </p>
                        )}
                      </div>
                      {h.type && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2" style={{ background: typeBg, color: typeColor }}>
                          {h.type}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card Allergies connues */}
          <div className={`rounded-2xl p-5 border shadow-sm ${dk ? "bg-[#172133] border-gray-800" : "bg-white border-gray-100"}`}>
            <h3 className="text-[11px] font-bold mb-4 tracking-wider uppercase" style={{ color: "#A0B5CD" }}>Allergies connues</h3>
            {Array.isArray(patientData?.medical_profile?.allergies) && patientData.medical_profile.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patientData.medical_profile.allergies.map((a, i) => {
                  const sev = a?.severity;
                  const bg = sev === "severe" ? "#FCEBEB" : sev === "moderate" ? "#FAEEDA" : "#E6F1FB";
                  const col = sev === "severe" ? "#A32D2D" : sev === "moderate" ? "#854F0B" : "#185FA5";
                  return (
                    <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: bg, color: col }}>
                      {a?.substance || a?.name || String(a)}
                    </span>
                  );
                })}
              </div>
            ) : patientAllergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patientAllergies.map((a, i) => (
                  <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#E6F1FB", color: "#185FA5" }}>{a}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: dk ? "#9CA3AF" : "#5C738A" }}>Aucune allergie connue</p>
            )}
          </div>
        </div>

        {/* COLONNE DROITE — compte-rendu */}
        <div style={{ width: 360, flexShrink: 0 }} className="space-y-4">

          {/* Card Constantes vitales */}
          <div className={`rounded-2xl p-5 border shadow-sm ${dk ? "bg-[#172133] border-gray-800" : "bg-white border-gray-100"}`}>
            <h3 className="text-[11px] font-bold mb-4 tracking-wider uppercase" style={{ color: "#A0B5CD" }}>Constantes vitales</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "bp",   label: "Tension",     placeholder: "120/80", unit: "mmHg" },
                { key: "hr",   label: "FC",           placeholder: "72",     unit: "bpm"  },
                { key: "temp", label: "Température",  placeholder: "37.2",   unit: "°C"   },
                { key: "spo2", label: "SpO₂",         placeholder: "98",     unit: "%"    },
              ].map(({ key, label, placeholder, unit }) => (
                <div key={key} className="rounded-xl p-2.5 flex flex-col gap-1"
                  style={{ background: dk ? "rgba(30,45,74,0.3)" : "#F8FAFC" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#A0B5CD" }}>{label}</span>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={vitals[key]}
                      onChange={e => setVitals(v => ({ ...v, [key]: e.target.value }))}
                      className="flex-1 min-w-0 bg-transparent border-none outline-none font-medium placeholder:opacity-40"
                      style={{ fontSize: 16, fontWeight: 500, color: dk ? "#ffffff" : "#0D2644" }}
                    />
                    <span className="text-xs shrink-0" style={{ color: "#A0B5CD" }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card formulaire */}
          <div className={`rounded-2xl p-5 border shadow-sm ${dk ? "bg-[#172133] border-gray-800" : "bg-white border-gray-100"}`}>
            <div className="space-y-4">

              {/* Symptômes / Motif */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#A0B5CD" }}>Symptômes / Motif</label>
                <textarea
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border outline-none resize-none text-sm placeholder:opacity-40"
                  style={{ padding: "8px 10px", background: dk ? "rgba(30,45,74,0.3)" : "#F8FAFC", borderColor: dk ? "#374151" : "#E5E7EB", color: dk ? "#ffffff" : "#0D2644" }}
                  placeholder="Décrire les symptômes…"
                />
              </div>

              {/* Diagnostic */}
              <div className="space-y-1.5" ref={diagnosisRef}>
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: diagnosisError ? "#EF4444" : "#A0B5CD" }}>
                  Diagnostic <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  value={diagnosis}
                  onChange={e => { setDiagnosis(e.target.value); if (e.target.value.trim()) setDiagnosisError(false); }}
                  className="w-full rounded-xl border outline-none text-sm placeholder:opacity-40"
                  style={{ padding: "8px 10px", background: dk ? "rgba(30,45,74,0.3)" : "#F8FAFC", borderColor: diagnosisError ? "#EF4444" : (dk ? "#374151" : "#E5E7EB"), color: dk ? "#ffffff" : "#0D2644" }}
                  placeholder="Diagnostic principal…"
                />
                {diagnosisError && (
                  <p className="text-xs font-semibold" style={{ color: "#EF4444" }}>Le diagnostic est requis</p>
                )}
              </div>

              {/* Plan de traitement */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#A0B5CD" }}>Plan de traitement</label>
                <textarea
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border outline-none resize-none text-sm placeholder:opacity-40"
                  style={{ padding: "8px 10px", background: dk ? "rgba(30,45,74,0.3)" : "#F8FAFC", borderColor: dk ? "#374151" : "#E5E7EB", color: dk ? "#ffffff" : "#0D2644" }}
                  placeholder="Plan de traitement proposé…"
                />
              </div>

              {terminateError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold"
                  style={{ background: c.red + "15", borderColor: c.red + "40", color: c.red }}>
                  <X size={13} /> {terminateError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-VIEW : WORK SCHEDULE MANAGEMENT
// ============================================================================

function WorkScheduleView({ dk }) {
  const { t } = useLanguage();
  const c = dk ? T.dark : T.light;
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Display order: Sunday first (Algerian/Arab convention).
  // Backend day_of_week: 0=Mon, 1=Tue, ..., 5=Sat, 6=Sun
  // → display order: [6, 0, 1, 2, 3, 4, 5] = Dim, Lun, Mar, Mer, Jeu, Ven, Sam
  const DAY_DISPLAY_ORDER = [6, 0, 1, 2, 3, 4, 5];
  const initialDays = DAY_DISPLAY_ORDER.map(d => ({
    day_of_week: d,
    start_time: "09:00",
    end_time: "17:00",
    break_start: "",
    break_end: "",
    slot_duration: 30,
    is_active: true
  }));

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const resp = await api.getSchedules();
      // Handle both array and paginated results ({ results: [] })
      const data = Array.isArray(resp) ? resp : (resp?.results || []);

      // Map existing data to our 7-day grid
      const fullGrid = initialDays.map(day => {
        const existing = data.find(s => Number(s.day_of_week) === day.day_of_week);
        if (existing) {
          return {
            ...existing,
            day_of_week: Number(existing.day_of_week),
            start_time: existing.start_time ? existing.start_time.slice(0, 5) : "09:00",
            end_time: existing.end_time ? existing.end_time.slice(0, 5) : "17:00",
            break_start: existing.break_start ? existing.break_start.slice(0, 5) : "",
            break_end: existing.break_end ? existing.break_end.slice(0, 5) : "",
          };
        }
        return day;
      });
      setSchedules(fullGrid);
      setMessage(null);
    } catch (err) {
      console.error("Error loading schedules:", err);
      setSchedules(initialDays);
      setMessage({ type: "error", text: `Échec du chargement: ${err?.message || "erreur inconnue"}. Les valeurs par défaut sont affichées.` });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (idx) => {
    const next = [...schedules];
    next[idx].is_active = !next[idx].is_active;
    setSchedules(next);
  };

  const handleChange = (idx, field, value) => {
    const next = [...schedules];
    next[idx][field] = value;
    setSchedules(next);
  };

  const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const validateDay = (day) => {
    const s = day.start_time, e = day.end_time;
    const bs = day.break_start, be = day.break_end;
    if (!s || !e) return "Heures de travail manquantes";
    if (e <= s) return "L'heure de fin doit être après l'heure de début";
    if ((bs && !be) || (!bs && be)) return "Pause incomplète (renseignez début ET fin)";
    if (bs && be) {
      if (be <= bs) return "La fin de pause doit être après le début";
      if (bs < s || be > e) return "La pause doit être comprise dans les heures de travail";
    }
    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Client-side validation per day (use real day_of_week, not array index)
    const errors = schedules
      .map((day) => ({ dow: day.day_of_week, err: validateDay(day) }))
      .filter(x => x.err);
    if (errors.length) {
      const list = errors.map(x => `${DAY_LABELS[x.dow]}: ${x.err}`).join(" • ");
      setMessage({ type: "error", text: list });
      setSaving(false);
      setTimeout(() => setMessage(null), 7000);
      return;
    }

    const toTime = (t) => (!t || t.trim() === "") ? null : (t.length === 5 ? `${t}:00` : t);
    const results = await Promise.allSettled(schedules.map(day => {
      const payload = {
        ...day,
        start_time: toTime(day.start_time),
        end_time: toTime(day.end_time),
        break_start: toTime(day.break_start),
        break_end: toTime(day.break_end),
      };
      return api.saveSchedule(payload);
    }));

    const failures = results
      .map((r, i) => ({ dow: schedules[i].day_of_week, r }))
      .filter(x => x.r.status === "rejected");

    if (failures.length === 0) {
      setMessage({ type: "success", text: t('dashboard.doctor.workSchedule.saveSuccess') });
    } else {
      const detail = failures.map(f => `${DAY_LABELS[f.dow]}: ${f.r.reason?.message || "erreur"}`).join(" • ");
      setMessage({ type: "error", text: detail });
    }

    setSaving(false);
    setTimeout(() => setMessage(null), 7000);
  };

  if (loading) return <div className="p-10 text-center opacity-50">{t('common.loading')}</div>;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: c.txt }}>{t('dashboard.doctor.workSchedule.title')}</h2>
          <p className="text-sm opacity-70" style={{ color: c.txt2 }}>{t('dashboard.doctor.workSchedule.subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{ background: "#638ECB" }}
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>

      {message && (
        <div 
          className="p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-4"
          style={{ 
            background: (message.type === "success" ? c.green : c.red) + "15",
            borderColor: (message.type === "success" ? c.green : c.red) + "33",
            color: message.type === "success" ? c.green : c.red
          }}
        >
          {message.type === "success" ? <Check size={20} /> : <X size={20} />}
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {schedules.map((day, idx) => (
          <Card key={idx} dk={dk} className="relative overflow-hidden group">
            {/* Visual background for active/inactive */}
            {!day.is_active && (
              <div className="absolute inset-0 z-10 bg-black/5 dark:bg-black/20 backdrop-blur-[1px] pointer-events-none" />
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                  style={{ 
                    background: day.is_active ? "#638ECB18" : c.bg,
                    color: day.is_active ? "#638ECB" : c.txt3
                  }}
                >
                  {t(`dashboard.doctor.workSchedule.days.${day.day_of_week}`).slice(0, 3)}
                </div>
                <h3 className="font-bold text-lg" style={{ color: day.is_active ? c.txt : c.txt3 }}>
                  {t(`dashboard.doctor.workSchedule.days.${day.day_of_week}`)}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mr-1">
                  {day.is_active ? t('dashboard.doctor.workSchedule.working') : t('dashboard.doctor.workSchedule.off')}
                </span>
                <button
                  onClick={() => handleToggleDay(idx)}
                  className="w-12 h-6 rounded-full relative transition-colors duration-300 border"
                  style={{ 
                    background: day.is_active ? "#638ECB" : c.bg,
                    borderColor: day.is_active ? "#638ECB33" : c.border
                  }}
                >
                  <div 
                    className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${day.is_active ? "left-7 bg-white" : "left-1 bg-gray-400"}`}
                  />
                </button>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity duration-300 ${day.is_active ? "opacity-100" : "opacity-40"}`}>
              {/* Working Hours */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: c.blue }}>
                  <Clock size={14} /> {t('dashboard.doctor.workSchedule.hours')}
                </h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <TimePicker
                      value={day.start_time}
                      onChange={(v) => handleChange(idx, "start_time", v)}
                      disabled={!day.is_active}
                      theme={c}
                    />
                  </div>
                  <span className="opacity-30">→</span>
                  <div className="flex-1">
                    <TimePicker
                      value={day.end_time}
                      onChange={(v) => handleChange(idx, "end_time", v)}
                      disabled={!day.is_active}
                      theme={c}
                    />
                  </div>
                </div>
              </div>

              {/* Break Time */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: c.amber }}>
                  {(day.break_start || day.break_end) && day.is_active && (
                    <button
                      type="button"
                      onClick={() => {
                        handleChange(idx, "break_start", "");
                        handleChange(idx, "break_end", "");
                      }}
                      className="w-4 h-4 rounded-full flex items-center justify-center border transition-all hover:bg-red-500 hover:text-white hover:border-red-500"
                      style={{ borderColor: c.amber + "66", color: c.amber }}
                      title="Supprimer la pause"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  )}
                  <Moon size={14} /> {t('dashboard.doctor.workSchedule.break')}
                </h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <TimePicker
                      value={day.break_start}
                      onChange={(v) => handleChange(idx, "break_start", v)}
                      disabled={!day.is_active}
                      placeholder="Aucune"
                      theme={c}
                    />
                  </div>
                  <span className="opacity-30">→</span>
                  <div className="flex-1">
                    <TimePicker
                      value={day.break_end}
                      onChange={(v) => handleChange(idx, "break_end", v)}
                      disabled={!day.is_active}
                      placeholder="Aucune"
                      theme={c}
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Duration */}
              <div className="sm:col-span-2 space-y-3 pt-4 border-t" style={{ borderColor: c.border }}>
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: c.green }}>
                  <Activity size={14} /> {t('dashboard.doctor.workSchedule.duration')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[15, 20, 30, 45, 60, 90].map(val => {
                    const active = day.slot_duration === val;
                    return (
                      <button
                        type="button"
                        key={val}
                        disabled={!day.is_active}
                        onClick={() => handleChange(idx, "slot_duration", val)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-black outline-none transition-all tabular-nums ${day.is_active ? "hover:scale-105 active:scale-95" : "opacity-50 cursor-not-allowed"}`}
                        style={{
                          background: active ? c.green : c.bg,
                          borderColor: active ? c.green : c.border,
                          color: active ? "#fff" : c.txt2,
                          boxShadow: active ? `0 2px 8px ${c.green}44` : "none",
                        }}
                      >
                        {val} {t('dashboard.doctor.workSchedule.durationHint')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
// SUB-VIEW : NOTIFICATIONS
// ============================================================================

function NotificationsView() {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;
  const { globalNotifications = [], markNotificationRead, markAllNotificationsRead } = useData();

  const TYPE_META = {
    appointment: { label: "Rendez-vous", color: "#4A6FA5" },
    caretaker:   { label: "Patient",     color: "#7B5EA7" },
    pharmacy:    { label: "Pharmacie",   color: "#E8A838" },
    system:      { label: "Système",     color: "#5A6E8A" },
    info:        { label: "Info",        color: "#4A6FA5" },
    success:     { label: "Succès",      color: "#2D8C6F" },
    warning:     { label: "Alerte",      color: "#E8A838" },
    error:       { label: "Erreur",      color: "#E05555" },
  };

  const fmt = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  const unread = globalNotifications.filter(n => !n.is_read).length;

  return (
    <div className="animate-in fade-in duration-500 space-y-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: c.txt }}>Notifications</h1>
          <p className="text-sm" style={{ color: c.txt3 }}>
            {unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Toutes lues"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllNotificationsRead?.()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border hover:opacity-80"
            style={{ borderColor: c.border, color: c.blue }}
          >
            <Check size={13} /> Tout marquer comme lu
          </button>
        )}
      </header>

      {globalNotifications.length === 0 ? (
        <Card dk={dk}>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.blueLight }}>
              <Bell size={28} style={{ color: c.blue }} />
            </div>
            <p className="text-sm font-medium" style={{ color: c.txt3 }}>Aucune notification</p>
          </div>
        </Card>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: c.card, borderColor: c.border }}>
          {globalNotifications.map(n => {
            const type = n.notification_type || n.type || "system";
            const meta = TYPE_META[type] || TYPE_META.system;
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && markNotificationRead?.(n.id)}
                className="flex items-start gap-3 px-5 py-4 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-black/[.02]"
                style={{ borderColor: c.border, background: n.is_read ? "transparent" : meta.color + "08" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: meta.color + "18", border: `1px solid ${meta.color}33` }}
                >
                  <Bell size={15} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: c.txt }}>{n.title}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{ background: meta.color + "18", color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    {!n.is_read && <span className="w-2 h-2 rounded-full ml-auto shrink-0" style={{ background: meta.color }} />}
                  </div>
                  {n.message && (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: c.txt2 }}>{n.message}</p>
                  )}
                  {n.created_at && (
                    <p className="text-[10px] mt-1" style={{ color: c.txt3 }}>{fmt(n.created_at)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================


export default function DoctorDashboard({ onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;
  const { t } = useLanguage();

  const { userData: user } = useAuth();
  const { patients = [], appointments = [], patientRequests = [], globalNotifications = [], markAllNotificationsRead, markNotificationRead, dashboardData } = useData();

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Ferme le panneau notifications au clic extérieur
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const unreadNotifCount = (globalNotifications || []).filter(n => !n.is_read).length;
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState(null);

  // ── Messagerie ──
  const [activeConv, setActiveConv] = useState(null);
  const [msgRefresh, setMsgRefresh] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [msgInitialInterlocutor, setMsgInitialInterlocutor] = useState(null);

  const firstName = user?.first_name || user?.firstName || "";
  const lastName = user?.last_name || user?.lastName || "";
  const doctorName =
    firstName && lastName ? `Dr. ${firstName} ${lastName}` : "Dr. Benali Karim";
  const doctorRole = user?.specialty || user?.role || t('doctor_role_label');
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : "DR";

  const safePatients = Array.isArray(patients) ? patients : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeRequests = Array.isArray(patientRequests) ? patientRequests : [];

  const NAV = [
    { id: "dashboard",     label: t('dashboard.doctor.nav.dashboard') },
    { id: "schedule",      label: t('dashboard.doctor.nav.schedule') },
    { id: "work-schedule", label: t('dashboard.doctor.nav.workSchedule') || "Emploi du temps" },
    { id: "patients",      label: t('dashboard.doctor.nav.patients') },
    { id: "prescriptions", label: t('dashboard.doctor.nav.prescriptions') },
    { id: "statistics",    label: t('dashboard.doctor.nav.statistics') },
  ];

  const isInConsultation = currentPage === "consultation-session";

  const renderContent = () => {
    switch (currentPage.toLowerCase()) {
      case "consultation-session":
        return (
          <PatientConsultationView
            appointment={activeConsultation}
            onComplete={() => {
              setActiveConsultation(null);
              setCurrentPage("schedule");
            }}
            dk={dk}
            c={c}
            setCurrentPage={setCurrentPage}
            doctorName={doctorName}
          />
        );
      case "schedule":
        return (
          <ScheduleView
            dk={dk}
            onStartConsultation={(appointment) => {
              setActiveConsultation(appointment);
              setCurrentPage("consultation-session");
            }}
          />
        );
      case "work-schedule":
        return <WorkScheduleView dk={dk} />;
      case "patients":
        return (
          <PatientsView
            onSelectPatient={(p) => {
              setSelectedPatient(p);
              setCurrentPage("patient-detail");
            }}
            onMessagePatient={(interlocutor) => {
              setMsgInitialInterlocutor({ ts: Date.now(), ...interlocutor });
              setCurrentPage("messages");
            }}
          />
        );
      case "prescriptions":
        return <PrescriptionsView />;
      case "statistics":
        return <StatisticsView />;
      case "my-reviews":
        return <DoctorReviewsView />;
      case "settings":
        return <SettingsView onLogout={onLogout} />;
      case "notifications":
        return <NotificationsView />;
      case "patient-detail":
        return (
          <PatientDetailView
            patient={selectedPatient}
            dk={dk}
            onBack={() => {
              setSelectedPatient(null);
              setCurrentPage("patients");
            }}
            onStartConsultation={() => {
              setActiveConsultation({
                patient: selectedPatient?.id,
                patient_name: `${selectedPatient?.firstName || ""} ${selectedPatient?.lastName || ""}`.trim(),
              });
              setCurrentPage("consultation-session");
            }}
          />
        );
      default:
        return (
          <DashboardHome
            onNavigate={setCurrentPage}
            patients={safePatients}
            appointments={safeAppointments}
            patientRequests={safeRequests}
            dashboardData={dashboardData}
            onStartConsultation={(appointment) => {
              setActiveConsultation(appointment);
              setCurrentPage("consultation-session");
            }}
          />
        );
    }
  };

  return (
    <div
      className={`min-h-screen relative transition-all duration-500 ${dk ? "dark" : ""}`}
      style={{
        background: c.bg,
        color: c.txt,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <ParticlesHero darkMode={dk} />
      <div className="relative z-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { transition: background-color 0.2s, border-color 0.2s, color 0.15s; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${c.border}; border-radius: 10px; }
        button, select, label, a { cursor: pointer !important; }
        .nav-link:not(.active-nav):hover { background: rgba(100,146,201,0.15) !important; color: #6492C9 !important; }
        .nav-link:active { transform: translateY(0); }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pd-item { color: #64748B; background: transparent; transition: background 0.15s, color 0.15s; }
        .pd-item:hover { background: #F8FAFC; color: #1E293B; }
        .dark .pd-item:hover { background: #1A2333; color: #F0F3FA; }
        .pd-item-danger { color: #EF4444; background: transparent; transition: background 0.15s; }
        .pd-item-danger:hover { background: rgba(239,68,68,0.08); }
      `}</style>

      <nav
        className="sticky top-0 z-40 transition-all border-b"
        style={{
          background: c.nav,
          borderColor: c.border,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="w-full px-6 h-[65px] flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center shrink-0 mr-2">
            <img src="/healy-logo.svg" alt="Healy" className="h-9 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div
            className="hidden lg:flex items-center justify-center gap-1 flex-1 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {NAV.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`nav-link${isActive ? " active-nav" : ""} relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all`}
                  style={{
                    color: isActive ? "#fff" : c.txt2,
                    background: isActive ? c.blue : "transparent",
                    opacity: isInConsultation ? 0.4 : 1,
                    pointerEvents: isInConsultation ? "none" : "auto",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80 border"
                style={{ borderColor: c.border, background: "transparent" }}
                title="Notifications"
              >
                <Bell size={18} style={{ color: notifOpen ? c.blue : c.txt2 }} />
                {unreadNotifCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white font-bold px-1"
                    style={{ background: c.red, fontSize: 9 }}
                  >
                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  className="absolute right-0 top-12 w-80 max-h-[420px] rounded-2xl border overflow-hidden shadow-xl z-50 flex flex-col animate-in slide-in-from-top-2 duration-200"
                  style={{ background: c.card, borderColor: c.border }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
                    <p className="text-sm font-bold" style={{ color: c.txt }}>Notifications</p>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead?.()}
                        className="text-[10px] font-bold uppercase tracking-wide hover:opacity-70"
                        style={{ color: c.blue }}
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {(!globalNotifications || globalNotifications.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Bell size={28} style={{ color: c.txt3, opacity: 0.4 }} />
                        <p className="text-xs" style={{ color: c.txt3 }}>Aucune notification</p>
                      </div>
                    ) : (
                      globalNotifications.slice(0, 12).map(n => (
                        <button
                          key={n.id}
                          onClick={() => { if (!n.is_read) markNotificationRead?.(n.id); }}
                          className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-black/[.03]"
                          style={{ borderColor: c.border, background: n.is_read ? "transparent" : c.blue + "08" }}
                        >
                          <div className="flex items-start gap-2">
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: c.blue }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: c.txt }}>{n.title}</p>
                              {n.message && (
                                <p className="text-xs line-clamp-2 mt-0.5" style={{ color: c.txt2 }}>{n.message}</p>
                              )}
                              {n.created_at && (
                                <p className="text-[10px] mt-1" style={{ color: c.txt3 }}>
                                  {new Date(n.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => { setNotifOpen(false); setCurrentPage("notifications"); }}
                    className="px-4 py-2.5 text-xs font-bold border-t hover:opacity-80"
                    style={{ borderColor: c.border, color: c.blue, background: c.blue + "08" }}
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              )}
            </div>

            {/* Messages Button */}
            <button
              onClick={() => setCurrentPage("messages")}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80 border"
              style={{
                borderColor: currentPage === "messages" ? c.blue + "44" : c.border,
                background: currentPage === "messages" ? c.blue + "11" : "transparent",
              }}
              title="Messages"
            >
              <MessageSquare size={18} style={{ color: currentPage === "messages" ? c.blue : c.txt2 }} />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: c.red, fontSize: 9 }}>
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </span>
              )}
            </button>
            {/* Profile Dropdown */}
            <div className="relative">
              {safeRequests.length > 0 && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 z-10 flex items-center justify-center"
                  style={{
                    borderColor: c.nav,
                    fontSize: 7,
                    color: "#fff",
                    fontWeight: 800,
                    pointerEvents: "none",
                  }}
                >
                  {safeRequests.length}
                </div>
              )}
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:opacity-80"
                style={{
                  border: `1px solid ${c.border}`,
                  background: "transparent",
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #304B71, #6492C9)",
                  }}
                >
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: c.txt }}
                  >
                    {doctorName}
                  </p>

                </div>
                <ChevronDown size={13} style={{ color: c.txt3 }} />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 top-12 w-60 rounded-[20px] overflow-hidden z-50 shadow-xl border animate-in slide-in-from-top-2 duration-200"
                  style={{
                    background: dk ? c.card : "#ffffff",
                    borderColor: c.border,
                  }}
                >
                  {/* User header */}
                  <div
                    className="px-4 py-3 border-b"
                    style={{ borderColor: c.border }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, #304B71, #6492C9)",
                        }}
                      >
                        {initials}
                      </div>
                      <div className="overflow-hidden">
                        <p
                          className="text-sm font-bold truncate"
                          style={{ color: c.txt }}
                        >
                          {doctorName}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: c.txt3 }}
                        >
                          {doctorRole}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-1">
                    {/* Notifications */}
                    <button
                      onClick={() => {
                        setCurrentPage("notifications");
                        setProfileOpen(false);
                      }}
                      className="pd-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl"
                    >
                      <Bell size={16} />
                      Notifications
                      {unreadNotifCount > 0 && (
                        <span
                          className="ml-auto min-w-[18px] h-[18px] rounded-full text-white text-[9px] font-black flex items-center justify-center px-1"
                          style={{ background: c.red }}
                        >
                          {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                        </span>
                      )}
                    </button>

                    {/* Settings */}
                    <button
                      onClick={() => {
                        setCurrentPage("settings");
                        setProfileOpen(false);
                      }}
                      className="pd-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl"
                    >
                      <Settings size={16} />
                      {t('dashboard.doctor.nav.settings') || "Paramètres"}
                    </button>

                    {/* Dark mode */}
                    <div className="pd-item w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl">
                      <Sun
                        size={14}
                        style={{ color: dk ? c.txt3 : c.amber }}
                      />
                      <button
                        onClick={toggleTheme}
                        className="relative w-10 h-5 rounded-full transition-all duration-300"
                        style={{
                          background: dk
                            ? "linear-gradient(135deg, #304B71, #4A6FA5)"
                            : "#D5DEEF",
                          border: `1px solid ${dk ? c.blue + "80" : "#BBC8DC"}`,
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-md transition-all duration-300"
                          style={{ left: dk ? "20px" : "2px" }}
                        />
                      </button>
                      <Moon size={13} style={{ color: dk ? c.blue : c.txt3 }} />
                    </div>

                    <div
                      className="h-px my-1 mx-2"
                      style={{ background: c.border }}
                    />

                    {/* Logout */}
                    <button
                      onClick={onLogout}
                      className="pd-item-danger w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl"
                    >
                      <LogOut size={16} /> {t('dashboard.doctor.nav.logout') || "Déconnexion"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border"
              style={{
                background: c.card,
                borderColor: c.border,
                color: c.txt2,
              }}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenu && (
          <div
            className="lg:hidden px-4 py-4 border-t animate-in slide-in-from-top duration-300"
            style={{ background: c.nav, borderColor: c.border }}
          >
            <div className="grid grid-cols-2 gap-2">
              {NAV.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMobileMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      color: isActive ? "#fff" : c.txt2,
                      background: isActive ? c.blue : c.bg + "44",
                      opacity: isInConsultation ? 0.4 : 1,
                      pointerEvents: isInConsultation ? "none" : "auto",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {isInConsultation && (
        <div
          className="w-full px-6 py-2 flex items-center gap-3 border-b"
          style={{ background: c.amber + "18", borderColor: c.amber + "44" }}
        >
          <span style={{ color: c.amber }}>⚠</span>
          <p className="text-xs font-semibold" style={{ color: c.amber }}>
            {t('dashboard.doctor.consultation.ongoingWarning')}
          </p>
        </div>
      )}

      {/* Panel messages — always mounted, toggled via display */}
      <div style={{ display: currentPage === "messages" ? "block" : "none" }} className="w-full px-6 py-6">
        <div className="flex gap-5" style={{ height: "calc(100vh - 120px)", minHeight: 500 }}>
          <div
            className="rounded-2xl border overflow-hidden shrink-0 flex flex-col"
            style={{ width: "30%", minWidth: 260, background: c.card, borderColor: c.border }}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0" style={{ borderColor: c.border }}>
              <MessageSquare size={15} style={{ color: c.blue }} />
              <h2 className="font-bold text-sm" style={{ color: c.txt }}>Messages</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList
                open={true}
                onClose={() => {}}
                onSelectConv={(conv) => setActiveConv(conv)}
                isDoctor={true}
                onUnreadChange={(n) => setUnreadChatCount(n)}
                refreshTrigger={msgRefresh}
                initialConv={msgInitialInterlocutor}
                c={c}
                dk={dk}
                inline={true}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {activeConv && !user?.messages_disabled ? (
              <ChatWindow
                conv={activeConv}
                onClose={() => setActiveConv(null)}
                onBack={null}
                onNewMessage={() => setMsgRefresh(n => n + 1)}
                onDeleteConv={() => { setActiveConv(null); setMsgRefresh(n => n + 1); }}
                c={c}
                dk={dk}
                embedded={true}
              />
            ) : (
              <div
                className="h-full rounded-2xl border flex flex-col items-center justify-center gap-4"
                style={{ background: c.card, borderColor: c.border }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: user?.messages_disabled ? "#E0555512" : c.blueLight }}>
                  <MessageSquare size={28} style={{ color: user?.messages_disabled ? "#E05555" : c.blue }} />
                </div>
                <p className="text-sm font-medium" style={{ color: c.txt3 }}>
                  {user?.messages_disabled ? "Messagerie désactivée" : "Sélectionnez une conversation"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 pb-24" style={{ display: currentPage === "messages" ? "none" : "block" }}>
        <ErrorBoundary>{renderContent()}</ErrorBoundary>
      </main>

      {profileOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </div>
    </div>
  );
}
