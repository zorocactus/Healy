import React, { useState, useEffect, useRef } from "react";
import ErrorBoundary from "../../components/ErrorBoundary";
import DashSelect from "../../components/ui/DashSelect";
import { ParticlesHero } from '../../components/backgrounds/MedParticles';
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useData } from "../../context/DataContext";
import * as api from "../../services/api";
import ChatButton from "../../components/chat/ChatButton";
import ConversationList from "../../components/chat/ConversationList";
import ChatWindow from "../../components/chat/ChatWindow";
import { useLanguage } from "../../context/LanguageContext";
import {
  Users, Heart, Calendar, Star, CheckCircle2, Circle, Phone, AlertCircle,
  MoreHorizontal, ChevronRight, MapPin, ShieldAlert, Navigation, Activity,
  Droplet, User, UserPlus, Bell, Pill, X, ChevronLeft, FileText, Trash2,
  Plus, ShoppingCart, AlertTriangle, Search, Filter, Minus, RefreshCw,
  QrCode, Download, Eye, EyeOff, Clock, ExternalLink, Stethoscope, Shield, Settings,
  ClipboardList, ChevronDown, LogOut, Menu, Sun, Moon, Check,
  Link as LinkIcon, Brain, Send, MessageSquare,
  Mic, Paperclip, History
} from "lucide-react";
import { T } from "../_shared/theme";
import ContactAdminCard from "../../components/ContactAdminCard";

// ─── Reusable Card Component ──────────────────────────────────────────────────
function Card({ children, className = "", style = {}, dk, empty = false }) {
  const c = dk ? T.dark : T.light;
  const hoverClasses = empty ? "" : "card-hover";
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm border ${hoverClasses} ${className}`}
      style={{ background: c.card, borderColor: c.border, ...style }}
    >
      {children}
    </div>
  );
}


// ─── StatCard component ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, dk }) {
  const c = dk ? T.dark : T.light;
  return (
    <Card dk={dk} className="group hover:border-blue-500/30">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ background: color + "18" }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold leading-tight" style={{ color: c.txt }}>
          {value}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-widest mt-2" style={{ color: c.txt3 }}>
          {label}
        </div>
        {sub && (
          <div className="text-[10px] font-bold mt-1 uppercase tracking-tighter" style={{ color: c.blue }}>
            {sub}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// CONSTANTES STATIQUES
// ============================================================================



// ─── AI HISTORIQUE ─────────────────────────────────────────────────────────────

// ─── WILAYAS_LIST ─────────────────────────────────────────────────────────────
const WILAYAS_LIST = [
  "Alger","Oran","Constantine","Annaba","Blida","Batna","Sétif","Tlemcen",
  "Tizi Ouzou","Béjaïa","Jijel","Médéa","Mostaganem","Bouira","Bordj Bou Arréridj",
  "Boumerdès","Tipaza","Aïn Defla","Tissemsilt","Relizane","Chlef","Skikda",
  "Guelma","Souk Ahras","El Tarf","Mila","Khenchela","Oum El Bouaghi","Tébessa",
  "Biskra","Djelfa","Laghouat","El Bayadh","Naâma","Saïda","Mascara","Tiaret",
  "Adrar","Béchar","Tamanrasset","Illizi","Tindouf","El Oued","Ouargla",
  "Ghardaïa","Aïn Témouchent","Sidi Bel Abbès","Autres",
];

// ─── EmergencyModal (copie exacte du Patient Dashboard) ──────────────────────
function EmergencyModal({ onClose, dk }) {
  const { t } = useLanguage();
  const c = dk ? T.dark : T.light;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="rounded-2xl p-8 w-full max-w-md shadow-2xl border-2"
        style={{ background: c.card, borderColor: "#E05555" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(224,85,85,0.15)" }}
            >
              <AlertTriangle size={22} style={{ color: "#E05555" }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: c.txt }}>
                {t('emergency_title') || "Emergency Alert"}
              </h3>
              <p className="text-xs" style={{ color: c.txt2 }}>
                {t('emergency_desc') || "Contacts will be notified immediately"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
          >
            <X size={18} style={{ color: c.txt3 }} />
          </button>
        </div>
        <div
          className="rounded-xl p-4 mb-5"
          style={{
            background: "rgba(224,85,85,0.08)",
            border: "1px solid rgba(224,85,85,0.2)",
          }}
        >
          <p className="text-sm" style={{ color: c.txt2 }}>
            {t('emergency_warning') || "This will alert your emergency contacts and share your GPS location with nearby medical services."}
          </p>
        </div>
        <div className="space-y-3 mb-4">
          <button
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#E05555", boxShadow: "0 4px 20px rgba(224,85,85,0.4)" }}
          >
            <Phone size={16} /> {t('call_samu_btn') || "Appeler le 1021 (SAMU)"}
          </button>
          <button
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            style={{
              background: "rgba(224,85,85,0.1)",
              color: "#E05555",
              border: "1px solid rgba(224,85,85,0.2)",
            }}
          >
            <MapPin size={15} /> {t('share_location_btn') || "Share My Location"}
          </button>
          <button
            className="w-full py-3 rounded-xl font-semibold transition-colors"
            style={{
              background: "rgba(224,85,85,0.06)",
              color: "#E05555",
              border: "1px solid rgba(224,85,85,0.15)",
            }}
          >
            {t('notify_contacts_btn') || "Notify Emergency Contact"}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 text-sm font-medium rounded-xl transition-colors"
          style={{ color: c.txt3, background: "transparent", border: `1px solid ${c.border}` }}
        >
          {t('im_fine_btn') || "Cancel — I'm fine"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

const AVATAR_COLORS = ["#4A6FA5", "#2D8C6F", "#E8A838", "#7B5EA7", "#E05555", "#2196F3", "#00897B", "#F4511E"];

function formatDate(date) {
  const s = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatNotifDate(created_at) {
  if (!created_at) return "";
  const d = new Date(created_at);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "À l'instant";
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function HomeView({ onChangePage, dk, c }) {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const userName = userData?.first_name || userData?.firstName || "—";

  const [patients, setPatients]       = useState([]);
  const [requests, setRequests]       = useState([]);
  const [schedules, setSchedules]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showEmergency, setShowEmergency] = useState(false);
  const todayKey = new Date().toISOString().slice(0, 10);
  const [checkedMeds, setCheckedMeds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("gm_checkedMeds") || "{}");
      return stored.date === todayKey ? stored.keys : {};
    } catch { return {}; }
  });
  const [responding, setResponding]   = useState({});
  const [myRating, setMyRating]       = useState(null);
  const [totalReviews, setTotalReviews] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getCaretakerDashboard().catch(() => null),
      api.getCareRequests().catch(() => null),
      api.getMedicationSchedules().catch(() => null),
      api.getNotifications().catch(() => null),
      api.getCaretakerProfile().catch(() => null),
    ]).then(([dashboard, reqs, scheds, , profile]) => {
      setPatients(Array.isArray(dashboard?.my_patients) ? dashboard.my_patients : []);
      const reqList = Array.isArray(reqs) ? reqs : (reqs?.results || []);
      setRequests(reqList.filter(r => r.status === "pending" || !r.status));
      const schedList = Array.isArray(scheds) ? scheds : (scheds?.results || []);
      setSchedules(schedList);
      if (profile) {
        setMyRating(profile.rating ?? null);
        setTotalReviews(profile.total_reviews ?? null);
      }
    }).finally(() => setLoading(false));
  }, []);

  // ── Medication planning ──────────────────────────────────────────────────────
  const SLOT_TIMES = { morning: "08:00", afternoon: "14:00", evening: "20:00" };
  const todayMeds = schedules.flatMap(sch => {
    const patientName = sch.patient_name || sch.patientName || "Patient";
    return ["morning", "afternoon", "evening"].flatMap(slot => {
      const meds = (sch.medications || {})[slot] || [];
      return meds.map((med, idx) => ({
        key: `${patientName}__${slot}__${med.name || ""}__${idx}`,
        time: med.time || SLOT_TIMES[slot],
        label: `${patientName} — ${med.name || ""}${med.dosage ? ` ${med.dosage}` : ""}`.trim(),
      }));
    });
  }).sort((a, b) => a.time.localeCompare(b.time));

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const medsWithStatus = todayMeds.map(item => {
    const [h, m] = item.time.split(":").map(Number);
    const itemMinutes = h * 60 + m;
    const isDone   = !!checkedMeds[item.key];
    const isMissed = !isDone && itemMinutes < currentMinutes;
    return { ...item, isDone, isMissed };
  });

  const allDone = medsWithStatus.length > 0 && medsWithStatus.every(it => it.isDone);

  const upcomingMeds = medsWithStatus
    .filter(item => !item.isDone)
    .sort((a, b) => {
      const [ah, am] = a.time.split(":").map(Number);
      const [bh, bm] = b.time.split(":").map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    })
    .slice(0, 4);

  const hiddenCount = medsWithStatus.filter(it => !it.isDone).length - upcomingMeds.length;

  function toggleDone(key) {
    setCheckedMeds(prev => {
      const n = { ...prev };
      if (n[key]) delete n[key]; else n[key] = true;
      localStorage.setItem("gm_checkedMeds", JSON.stringify({ date: todayKey, keys: n }));
      return n;
    });
  }

  // ── Quick accept / dismiss from HomeView ────────────────────────────────────
  async function handleQuickAccept(id) {
    setResponding(prev => ({ ...prev, [id]: true }));
    try {
      await api.respondToCareRequest(id, "accepted");
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch { /* silencieux */ }
    finally { setResponding(prev => ({ ...prev, [id]: false })); }
  }

  async function handleQuickDismiss(id) {
    setResponding(prev => ({ ...prev, [id]: true }));
    try {
      await api.respondToCareRequest(id, "rejected");
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch { /* silencieux */ }
    finally { setResponding(prev => ({ ...prev, [id]: false })); }
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const pendingCount = requests.length;

  const patientEmergencyContacts = patients
    .filter(p => p.emergencyContact || p.emergency_contact_name || p.emergencyPhone || p.emergency_contact_phone)
    .map(p => ({
      name:        p.emergencyContact || p.emergency_contact_name || "Contact",
      patientName: p.name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Patient",
      phone:       p.emergencyPhone   || p.emergency_contact_phone || "",
      initials:    (p.emergencyContact || p.emergency_contact_name || "?").charAt(0).toUpperCase(),
    }));

  const labelStyle = { color: dk ? "#A0B5CD" : "#5C738A", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" };
  const cardBg     = dk ? "#172133" : "#ffffff";

  const ratingDisplay = loading ? "—" : (myRating != null ? Number(myRating).toFixed(1) : "—");
  const kpis = [
    { label: "Patients assignés",       value: loading ? "—" : patients.length,  color: c.blue },
    { label: "Médicaments aujourd'hui", value: loading ? "—" : todayMeds.length, color: c.green },
    { label: "Nouvelles offres",        value: loading ? "—" : pendingCount,     color: c.amber },
    {
      label: "Mes Avis",
      value: ratingDisplay,
      sub: loading ? "" : (totalReviews != null ? `${totalReviews} avis` : "0 avis"),
      color: c.purple || "#7B5EA7",
      onClick: () => onChangePage("reviews"),
    },
  ];

  // ── SAMU base styles ─────────────────────────────────────────────────────────
  const samuBg     = "#FCEBEB";
  const samuBorder = "#F09595";
  const samuText   = "#A32D2D";
  const samuBtn    = "#E24B4A";

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: c.txt }}>
            Bonjour, <span style={{ color: dk ? "#ffffff" : "#0D2644" }}>{userName}</span>
          </h1>
          <p className="mt-1" style={labelStyle}>{formatDate(new Date())}</p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 border card-hover"
            style={{ background: cardBg, borderColor: c.border, cursor: kpi.onClick ? "pointer" : "default" }}
            onClick={kpi.onClick}
          >
            <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, color: c.txt, marginBottom: 6 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#A0B5CD" }}>
              {kpi.label}
            </div>
            {kpi.sub && (
              <div style={{ fontSize: 10, fontWeight: 600, color: kpi.color, marginTop: 3 }}>{kpi.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── 2-column layout ── */}
      <div className="flex gap-6 items-start">

        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Patients card */}
          <div className="rounded-2xl border overflow-hidden card-hover" style={{ background: cardBg, borderColor: c.border }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span style={labelStyle}>MES PATIENTS</span>
              <button onClick={() => onChangePage("myPatients")} className="text-xs font-bold hover:underline" style={{ color: c.blue }}>
                Voir tout
              </button>
            </div>
            <div>
              {loading ? (
                <div className="px-5 py-8 text-center text-sm" style={{ color: c.txt3 }}>Chargement…</div>
              ) : patients.length === 0 ? (
                <div className="px-5 py-8 flex flex-col items-center gap-3">
                  <Users size={28} style={{ color: c.txt3, opacity: 0.4 }} />
                  <p className="text-sm text-center" style={{ color: c.txt3 }}>Aucun patient assigné.</p>
                </div>
              ) : patients.slice(0, 3).map((p, i) => {
                const name      = p.name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Patient";
                const initials  = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                const condition = p.condition || p.medical_condition || "—";
                const age       = p.age ? `${p.age} ans` : "";
                return (
                  <div key={p.id || i} className="flex items-center gap-4 px-5 py-4 border-b transition-colors hover:bg-black/[.02]"
                    style={{ borderColor: c.border }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: c.txt }}>{name}</p>
                      <p className="text-xs truncate" style={{ color: c.txt3 }}>{[age, condition].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onChangePage("myPatients")}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: c.border, color: c.txt2, background: "transparent" }}>
                        Profil
                      </button>
                      {(p.phone || p.emergencyPhone) && (
                        <a href={`tel:${p.phone || p.emergencyPhone}`}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors hover:opacity-80"
                          style={{ borderColor: c.red + "40", color: c.red, background: c.red + "0A" }}>
                          <Phone size={11} /> Alerter
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Planning médicaments card */}
          <div className="rounded-2xl border overflow-hidden card-hover" style={{ background: cardBg, borderColor: c.border }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span style={labelStyle}>PLANNING MÉDICAMENTS</span>
              <button onClick={() => onChangePage("treatments")} className="text-xs font-bold hover:underline" style={{ color: c.blue }}>
                Voir tout
              </button>
            </div>

            {loading ? (
              <div className="px-5 py-8 text-center text-sm" style={{ color: c.txt3 }}>Chargement…</div>
            ) : todayMeds.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm" style={{ color: c.txt3 }}>
                Aucun médicament à administrer aujourd'hui.
              </div>
            ) : allDone ? (
              <div className="px-5 py-6 flex items-center gap-2 text-sm font-medium" style={{ color: c.green }}>
                <CheckCircle2 size={16} /> Tous les médicaments ont été administrés aujourd'hui.
              </div>
            ) : (
              <>
                {upcomingMeds.map(item => (
                  <div key={item.key}
                    className="flex items-center gap-4 px-5 border-b"
                    style={{ borderColor: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", minHeight: 48, padding: "10px 20px" }}>
                    <div className="text-xs font-bold tabular-nums shrink-0" style={{ color: c.blue, minWidth: 40 }}>{item.time}</div>
                    <button
                      onClick={() => toggleDone(item.key)}
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all"
                      style={
                        item.isDone
                          ? { background: c.green, border: `1.5px solid ${c.green}` }
                          : item.isMissed
                            ? { background: c.red, border: `1.5px solid ${c.red}` }
                            : { background: "transparent", border: "1.5px solid #A0B5CD" }
                      }>
                      {item.isDone   && <Check size={9} color="#fff" />}
                      {item.isMissed && <X size={9} color="#fff" />}
                    </button>
                    <p className="text-sm truncate" style={{
                      color: item.isDone ? c.txt3 : c.txt,
                      textDecoration: item.isDone ? "line-through" : "none",
                      opacity: item.isDone ? 0.55 : 1,
                    }}>
                      {item.label}
                    </p>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => onChangePage("treatments")}
                    className="w-full px-5 py-3 text-xs font-bold text-left transition-colors hover:opacity-80"
                    style={{ color: c.blue }}>
                    Voir les {hiddenCount} autre{hiddenCount > 1 ? "s" : ""} médicament{hiddenCount > 1 ? "s" : ""} →
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="shrink-0 space-y-6" style={{ width: 300 }}>

          {/* Nouvelles offres card */}
          <div className="rounded-2xl border overflow-hidden card-hover" style={{ background: cardBg, borderColor: c.border }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span style={labelStyle}>NOUVELLES OFFRES</span>
              <button onClick={() => onChangePage("jobRequests")} className="text-xs font-bold hover:underline" style={{ color: c.blue }}>
                Voir tout
              </button>
            </div>
            {loading ? (
              <div className="px-5 py-6 text-center text-sm" style={{ color: c.txt3 }}>Chargement…</div>
            ) : requests.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm" style={{ color: c.txt3 }}>Aucune nouvelle offre.</div>
            ) : requests.slice(0, 3).map((req, i) => {
              const patName  = req.patient_name || [req.patient?.first_name, req.patient?.last_name].filter(Boolean).join(" ") || "Patient";
              const initials = patName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              const careType = req.care_type || (req.patient_message?.substring(0, 40)?.trimEnd()) || "Soins";
              const wilaya   = req.patient_city || req.location || "";
              return (
                <div key={req.id || i} className="px-5 py-4 border-b" style={{ borderColor: c.border }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                      style={{ background: AVATAR_COLORS[(i + 3) % AVATAR_COLORS.length] }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: c.txt }}>{patName}</p>
                      <p className="text-[11px] truncate" style={{ color: c.txt3 }}>
                        {careType}{wilaya ? ` · ${wilaya}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickAccept(req.id)}
                      disabled={!!responding[req.id]}
                      className="flex-1 text-xs font-bold py-1.5 rounded-lg text-white transition-all active:scale-95 disabled:opacity-50"
                      style={{ background: c.green }}>
                      {responding[req.id]
                        ? <span className="inline-block w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        : "Accepter"}
                    </button>
                    <button
                      onClick={() => handleQuickDismiss(req.id)}
                      disabled={!!responding[req.id]}
                      className="flex-1 text-xs font-bold py-1.5 rounded-lg border transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
                      style={{ borderColor: c.red + "50", color: c.red, background: "transparent" }}>
                      Refuser
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contacts d'urgence card */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: dk ? "rgba(252,235,235,0.04)" : "#FFF8F8", borderColor: dk ? "rgba(240,149,149,0.3)" : samuBorder }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span style={{ ...labelStyle, color: samuText }}>CONTACTS D'URGENCE</span>
              <button onClick={() => onChangePage("emergencies")} className="text-xs font-bold hover:underline" style={{ color: c.blue }}>
                Voir tout
              </button>
            </div>
            <div>
              {/* SAMU Algérie */}
              <div className="flex items-center gap-3 px-5 py-3 border-b"
                style={{ borderColor: dk ? "rgba(240,149,149,0.15)" : "rgba(240,149,149,0.2)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: samuBg, color: samuText, border: `1px solid ${samuBorder}` }}>
                  <Phone size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: c.txt }}>SAMU Algérie</p>
                  <p className="text-xs font-bold" style={{ color: samuText }}>1021</p>
                </div>
                <a href="tel:1021"
                  className="text-xs font-bold px-3 py-1.5 text-white shrink-0 transition-opacity hover:opacity-80"
                  style={{ background: samuBtn, borderRadius: 8 }}>
                  Appeler
                </a>
              </div>
              {/* Contacts famille patients */}
              {patientEmergencyContacts.map((ec, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: c.border }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {ec.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: c.txt }}>{ec.name}</p>
                    <p className="text-xs truncate" style={{ color: c.txt3 }}>
                      Contact de <span style={{ color: c.blue, fontWeight: 600 }}>{ec.patientName}</span>
                      {ec.phone ? ` · ${ec.phone}` : ""}
                    </p>
                  </div>
                  {ec.phone && (
                    <a href={`tel:${ec.phone}`}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border shrink-0 transition-opacity hover:opacity-80"
                      style={{ borderColor: c.border, color: c.txt2 }}>
                      Appeler
                    </a>
                  )}
                </div>
              ))}
              {patientEmergencyContacts.length === 0 && (
                <div className="px-5 py-3 text-xs" style={{ color: c.txt3 }}>Aucun contact patient.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Emergency Modal ── */}
      {showEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowEmergency(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ background: cardBg }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} style={{ color: "#DC2626" }} />
                <span className="font-bold text-base" style={{ color: c.txt }}>Numéros d'urgence</span>
              </div>
              <button onClick={() => setShowEmergency(false)} className="p-1 rounded-lg hover:opacity-70" style={{ color: c.txt3 }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[{ name: "SAMU Algérie", num: "1021" }].map(s => (
                <a key={s.num} href={`tel:${s.num}`}
                  className="flex items-center gap-4 p-4 rounded-xl border hover:opacity-80 transition-opacity"
                  style={{ borderColor: samuBorder, background: samuBg }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: samuBtn }}><Phone size={18} color="#fff" /></div>
                  <div>
                    <p className="font-bold" style={{ color: samuText }}>{s.name}</p>
                    <p className="text-lg font-bold" style={{ color: samuText }}>{s.num}</p>
                  </div>
                </a>
              ))}
              {patientEmergencyContacts.map((ec, i) => (
                <a key={i} href={ec.phone ? `tel:${ec.phone}` : undefined}
                  className="flex items-center gap-4 p-4 rounded-xl border hover:opacity-80 transition-opacity"
                  style={{ borderColor: c.border, background: dk ? "rgba(255,255,255,0.03)" : "#F8FAFC" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{ec.initials}</div>
                  <div>
                    <p className="font-bold" style={{ color: c.txt }}>{ec.name}</p>
                    <p className="text-sm" style={{ color: c.txt3 }}>{ec.phone || "—"}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmergenciesView({ dk, c }) {
  const { t } = useLanguage();
  const { gmPatients: patients } = useData();

  const samuContacts = [
    { name: "SAMU Algérie", number: "1021", tel: "1021" },
  ];

  const familyContacts = patients
    .filter(p => p.emergencyContact || p.emergency_contact_name || p.emergencyPhone || p.emergency_contact_phone)
    .map(p => {
      const patientName = p.name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Patient";
      const contactName = p.emergencyContact || p.emergency_contact_name || "Contact d'urgence";
      return {
        contactName,
        patientName,
        phone: p.emergencyPhone || p.emergency_contact_phone || "",
        initials: contactName.charAt(0).toUpperCase(),
      };
    });

  const procedures = [
    { title: t('thoracic_pain_proc') || "Douleur Thoracique / Crise Cardiaque", steps: [t('call_samu_step') || "Appeler le SAMU 1021 immédiatement", t('keep_calm_step') || "Garder le patient calme et immobile", t('no_meds_step') || "Ne PAS donner de médicaments", t('share_gps_step') || "Partager la position GPS via l'app"], color: c.red },
    { title: t('hypoglycemia_proc') || "Hypoglycémie (Sucre Bas)", steps: [t('give_sugar_step') || "Donner du sucre ou un jus", t('reevaluate_step') || "Réévaluer après 15 min", t('unconscious_step') || "Si inconscient — appeler le SAMU 1021"], color: c.amber },
    { title: t('hypertension_proc') || "Crise d'Hypertension", steps: [t('sit_patient_step') || "Faire asseoir le patient", t('remeasure_step') || "Remesurer après 5 min", t('systolic_high_step') || "Systolique >180 → SAMU immédiat"], color: c.blue }
  ];

  const samuBg     = dk ? "rgba(252,235,235,0.06)" : "#FFF8F8";
  const samuBorder = dk ? "rgba(240,149,149,0.25)"  : "#F09595";
  const samuText   = "#A32D2D";
  const samuBtn    = "#E24B4A";

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: c.txt }}>Contacts d'Urgence</h1>
        <p className="text-sm font-medium tracking-tight" style={{ color: c.txt3 }}>Numéros de secours, contacts famille et protocoles d'intervention</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── Colonne gauche : contacts ── */}
        <div className="space-y-6">

          {/* SAMU */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.txt3 }}>SAMU — Secours Médicaux</p>
            <div className="rounded-2xl border overflow-hidden" style={{ background: samuBg, borderColor: samuBorder }}>
              {samuContacts.map(s => (
                <div key={s.tel} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0"
                  style={{ borderColor: dk ? "rgba(240,149,149,0.15)" : "rgba(240,149,149,0.2)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#FCEBEB", border: `1px solid ${samuBorder}` }}>
                    <Phone size={16} style={{ color: samuText }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: c.txt }}>{s.name}</p>
                    <p className="text-base font-bold tabular-nums" style={{ color: samuText }}>{s.number}</p>
                  </div>
                  <a href={`tel:${s.tel}`}
                    className="text-xs font-bold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-80 shrink-0"
                    style={{ background: samuBtn }}>
                    Appeler
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Famille patients */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.txt3 }}>Contacts Famille Patients</p>
            {familyContacts.length === 0 ? (
              <div className="rounded-2xl border px-5 py-8 text-center text-sm"
                style={{ background: c.card, borderColor: c.border, color: c.txt3 }}>
                Aucun contact d'urgence enregistré pour vos patients.
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden" style={{ background: c.card, borderColor: c.border }}>
                {familyContacts.map((ec, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0"
                    style={{ borderColor: c.border }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                      {ec.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: c.txt }}>{ec.contactName}</p>
                      <p className="text-xs" style={{ color: c.txt3 }}>
                        Contact de <span style={{ color: c.blue, fontWeight: 600 }}>{ec.patientName}</span>
                        {ec.phone ? ` · ${ec.phone}` : ""}
                      </p>
                    </div>
                    {ec.phone && (
                      <a href={`tel:${ec.phone}`}
                        className="text-xs font-bold px-4 py-2 rounded-xl border shrink-0 transition-opacity hover:opacity-80"
                        style={{ borderColor: c.border, color: c.txt2, background: "transparent" }}>
                        Appeler
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : protocoles ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.txt3 }}>Protocoles d'Urgence</p>
          <div className="space-y-4">
            {procedures.map((proc, i) => (
              <div key={i} className="p-5 rounded-2xl border"
                style={{ background: proc.color + "08", borderColor: proc.color + "22" }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: proc.color }}>{proc.title}</h3>
                <div className="space-y-2">
                  {proc.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-medium" style={{ color: c.txt2 }}>
                      <span className="font-bold shrink-0" style={{ color: proc.color }}>{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function JobRequestsView({ dk, c }) {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responding, setResponding] = useState({});

  useEffect(() => {
    api.getCareRequests()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        setRequests(list.filter(r => r.status === 'pending'));
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (id) => {
    setResponding(prev => ({ ...prev, [id]: true }));
    try {
      await api.respondToCareRequest(id, "accepted");
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch {
      // maintenu dans la liste si l'API échoue
    } finally {
      setResponding(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleDismiss = async (id) => {
    setResponding(prev => ({ ...prev, [id]: true }));
    try {
      await api.respondToCareRequest(id, "rejected");
    } catch { /* silent */ } finally {
      setRequests(prev => prev.filter(r => r.id !== id));
      setResponding(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  // ── helpers pour normaliser les champs selon la réponse du backend ──
  const getPatientName = (req) =>
    req.patient_name || req.patient?.full_name ||
    [req.patient?.first_name, req.patient?.last_name].filter(Boolean).join(" ") || "—";

  const getPatientAge = (req) =>
    req.patient_age ?? req.patient?.age ?? null;

  const getCondition = (req) =>
    req.condition || req.message || req.description || t('care_request_label') || "Demande de soins";

  const getLocation = (req) =>
    req.location || req.patient?.city || req.patient?.wilaya || "—";

  const getInitials = (name) =>
    name !== "—" ? name.split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() : "?";

  const getPostedAt = (req) =>
    req.created_at ? new Date(req.created_at).toLocaleDateString("fr-FR") : "—";

  const getConditions = (req) => {
    if (Array.isArray(req.conditions)) return req.conditions;
    if (Array.isArray(req.patient?.conditions)) return req.patient.conditions;
    const c = getCondition(req);
    return c && c !== (t('care_request_label') || "Demande de soins") ? [c] : [];
  };

  const getTreatments = (req) =>
    Array.isArray(req.treatments) ? req.treatments :
    Array.isArray(req.patient?.treatments) ? req.patient.treatments : [];

  const getNotes = (req) =>
    req.notes || req.doctor_notes || req.patient?.notes || null;

  return (
    <div className="animate-in fade-in duration-500 space-y-8">

      {/* ── Modal détail demande ── */}
      {selectedRequest && (() => {
        const req = selectedRequest;
        const name = getPatientName(req);
        const age = getPatientAge(req);
        const conditions = getConditions(req);
        const treatments = getTreatments(req);
        const notes = getNotes(req);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedRequest(null); }}
          >
            <div className="rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border"
              style={{ background: c.card, borderColor: c.border }}>
              {/* ── Header ── */}
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: c.border }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                    style={{ background: c.blue }}>
                    {getInitials(name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: c.txt }}>{name}</h2>
                    <p className="text-sm" style={{ color: c.txt3 }}>
                      {age ? `${age} ans` : ""}
                      {req.patient_sex ? ` · ${req.patient_sex === 'female' ? 'Femme' : 'Homme'}` : ""}
                      {getLocation(req) ? ` · ${getLocation(req)}` : ""}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: c.txt3 }}>Demande reçue le {getPostedAt(req)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRequest(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
                  style={{ background: c.blueLight }}>
                  <X size={15} style={{ color: c.txt3 }} />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[500px] overflow-y-auto">

                {/* Infos de contact — toujours visibles */}
                <div className="grid grid-cols-1 gap-2">
                  {req.patient_phone && (
                    <a href={`tel:${req.patient_phone}`}
                      className="flex items-center justify-between p-3 rounded-xl border transition-all hover:opacity-80"
                      style={{ background: c.green + "08", borderColor: c.green + "25" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: c.green + "20" }}>
                          <Phone size={13} style={{ color: c.green }} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: c.txt3 }}>Téléphone patient</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: c.green }}>{req.patient_phone}</span>
                    </a>
                  )}
                  {req.patient_address && (
                    <div className="flex items-center justify-between p-3 rounded-xl border"
                      style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: c.blue + "15" }}>
                          <MapPin size={13} style={{ color: c.blue }} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: c.txt3 }}>Adresse</span>
                      </div>
                      <span className="text-sm font-medium text-right max-w-[55%]" style={{ color: c.txt2 }}>{req.patient_address}</span>
                    </div>
                  )}
                </div>

                {/* Pathologies du patient */}
                {(() => {
                  const conditions = Array.isArray(req.patient_conditions) ? req.patient_conditions : [];
                  const dossier = req.patient_medical_dossier;
                  if (conditions.length === 0 && !dossier?.blood_type) return null;
                  return (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt3 }}>Pathologies connues</p>
                      <div className="flex flex-wrap gap-2">
                        {conditions.map((cond, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg border font-medium"
                            style={{ background: c.blueLight, color: c.blue, borderColor: c.blue + "30" }}>
                            {cond}
                          </span>
                        ))}
                        {dossier?.blood_type && (
                          <span className="text-xs px-2.5 py-1 rounded-lg border font-bold"
                            style={{ background: c.red + "10", color: c.red, borderColor: c.red + "25" }}>
                            Groupe {dossier.blood_type}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Message du patient */}
                {req.patient_message && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt3 }}>Message du patient</p>
                    <div className="p-3 rounded-xl text-sm leading-relaxed"
                      style={{ background: dk ? "#1A2333" : "#F8FAFC", color: c.txt2, borderLeft: `3px solid ${c.blue}` }}>
                      {req.patient_message}
                    </div>
                  </div>
                )}

                {/* Contact d'urgence — si mission acceptée */}
                {req.patient_medical_dossier?.access_granted && req.patient_medical_dossier?.emergency_contact && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt3 }}>Contact d'urgence</p>
                    <div className="flex items-center gap-2 p-3 rounded-xl border"
                      style={{ background: c.red + "08", borderColor: c.red + "25" }}>
                      <Phone size={13} style={{ color: c.red }} />
                      <span className="text-sm font-medium" style={{ color: c.txt2 }}>
                        {req.patient_medical_dossier.emergency_contact}
                      </span>
                    </div>
                  </div>
                )}

                {!req.patient_message && !req.patient_phone && (
                  <p className="text-sm text-center py-4" style={{ color: c.txt3 }}>Aucune information disponible.</p>
                )}
              </div>

              {/* Footer avec boutons Accept/Refuser directement dans le modal */}
              <div className="p-5 border-t flex gap-3" style={{ borderColor: c.border }}>
                <button
                  onClick={() => { handleAccept(req.id); setSelectedRequest(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: c.green }}>
                  <CheckCircle2 size={15} /> Accepter la mission
                </button>
                <button
                  onClick={() => { handleDismiss(req.id); setSelectedRequest(null); }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-all hover:bg-red-500 hover:text-white"
                  style={{ background: c.red + "10", borderColor: c.red + "30", color: c.red }}>
                  <X size={15} /> Refuser
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: c.txt }}>
            {t('mission_offers_title') || "Offres de Missions"}
          </h1>
          <p className="text-sm font-medium" style={{ color: c.txt3 }}>
            {t('new_opportunities_desc') || "Nouvelles opportunités dans votre zone"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm"
          style={{ background: c.blue + "10", borderColor: c.blue + "20", color: c.blue }}>
          <Users size={16} />
          {t('missions_available_count', { count: requests.length }) || `${requests.length} Mission(s) disponible(s)`}
        </div>
      </div>

      {/* ── Liste ── */}
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <span className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        {!loading && requests.length === 0 && (
          <Card dk={dk} className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 size={40} style={{ color: c.green }} className="mb-4" />
            <h2 className="text-lg font-bold mb-1" style={{ color: c.txt }}>
              {t('all_offers_processed') || "Aucune demande en attente"}
            </h2>
            <p className="text-sm" style={{ color: c.txt3 }}>
              {t('offers_responded_desc') || "Vous avez répondu à toutes les demandes disponibles."}
            </p>
          </Card>
        )}
        {requests.map((req) => {
          const name = getPatientName(req);
          const age = getPatientAge(req);
          const condition = getCondition(req);
          const location = getLocation(req);
          const isResponding = !!responding[req.id];

          return (
            <Card key={req.id} dk={dk} className="hover:shadow-md group transition-all">
              {/* Ligne 1 : avatar + infos + boutons */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border shrink-0"
                  style={{ background: c.blue + "10", color: c.blue, borderColor: c.blue + "20" }}>
                  {getInitials(name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <h3 className="text-base font-bold truncate" style={{ color: c.txt }}>{name}</h3>
                    {age && <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: c.blue + "15", color: c.blue }}>{age} ans</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={12} style={{ color: c.txt3 }} />
                    <span className="text-xs font-medium truncate" style={{ color: c.txt3 }}>{location}</span>
                    <span className="text-xs" style={{ color: c.txt3 }}>·</span>
                    <span className="text-xs" style={{ color: c.txt3 }}>{getPostedAt(req)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80"
                    style={{ background: "transparent", borderColor: c.border, color: c.txt2 }}>
                    <User size={13} /> {t('view_profile_btn') || "Détails"}
                  </button>
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={isResponding}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                    style={{ background: c.green }}>
                    {isResponding
                      ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <CheckCircle2 size={15} />}
                    {t('accept_btn') || "Accepter"}
                  </button>
                  <button
                    onClick={() => handleDismiss(req.id)}
                    disabled={isResponding}
                    className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all hover:bg-red-500 hover:text-white disabled:opacity-40"
                    style={{ background: c.red + "15", borderColor: c.red + "25", color: c.red }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Ligne 2 : message patient tronqué */}
              {condition && condition !== "Demande de soins" && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: c.border }}>
                  <p className="text-xs leading-relaxed"
                    style={{ color: c.txt3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {condition}
                  </p>
                  <button onClick={() => setSelectedRequest(req)}
                    className="text-xs font-semibold mt-1 hover:underline"
                    style={{ color: c.blue }}>
                    Voir plus
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI DIAGNOSIS PAGE (Garde-Malade) ────────────────────────────────────────

function highlightTerms(text) {
  if (!text) return "";
  let t = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  t = t.replace(/^(\d+[\.\)]\s*)([^\n—\-:]+)/gm, (match, num, title) =>
    `${num}<strong style="color:#0D1B2E;font-weight:500;">${title.trim()}</strong>`);
  t = t.replace(/^Urgence\s*:\s*([^\n]+)/gim, (match, level) => {
    const l = level.toLowerCase();
    let bg, color, label;
    if (l.includes("non urgent") || l.includes("généralement non")) { bg="#EEEDFE"; color="#534AB7"; label="Non urgent"; }
    else if (l.includes("relativ") || l.includes("évaluer") || l.includes("médecin traitant")) { bg="#E6F1FB"; color="#185FA5"; label="À évaluer"; }
    else if (l.includes("variable")) { bg="#E1F5EE"; color="#0F6E56"; label="Variable"; }
    else if (l.includes("urgent") || l.includes("immédiat") || l.includes("sévère")) { bg="#FCEBEB"; color="#A32D2D"; label="Urgence possible"; }
    else if (l.includes("bilan") || l.includes("diagnostic")) { bg="#FAEEDA"; color="#854F0B"; label="Bilan recommandé"; }
    else { bg="#F0F4F8"; color="#5A6E8A"; label="À confirmer"; }
    return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:500;margin-left:6px;white-space:nowrap;">${label}</span>`;
  });
  const maladies = ["pneumonie","pleurésie","embolie pulmonaire","infarctus","angine de poitrine","péricardite","costochondrite","hypertension","diabète","anémie","asthme","migraine","bronchite","gastrite","ulcère","hépatite","thrombose","arythmie","tachycardie","fibrillation","insuffisance cardiaque","insuffisance rénale","hypothyroïdie","hyperthyroïdie","épilepsie","méningite","sepsis","grippe","covid","tuberculose","sinusite","angine","otite","conjonctivite","appendicite","pancréatite","cholécystite","pyélonéphrite","cystite","infection","inflammation","ischémie","nécrose","fibrose","cancer","tumeur","leucémie","lymphome","sclérose","arthrite","arthrose","ostéoporose","goutte","lupus","polyarthrite","spondylarthrite","myopathie","neuropathie","dépression","anxiété","schizophrénie","alzheimer","parkinson","AVC","accident vasculaire","embolie","phlébite","varices","anévrisme","reflux","RGO","gastro-œsophagien","hernie","prolapsus","endométriose","SOPK","ménopause","ostéite","ostéomyélite","psoriasis","eczéma","dermatite","urticaire","allergie","choc anaphylactique","hypoglycémie","hyperglycémie","acidose","déshydratation","malnutrition","carence"];
  const maladiesPattern = new RegExp(`\\b(${maladies.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
  t = t.replace(maladiesPattern, match => `<span style="background:#FFF8E1;color:#795548;padding:0px 3px;border-radius:3px;font-weight:500;">${match}</span>`);
  const medicaments = ["Lisinopril","Paracétamol","Ibuprofène","Metformine","Aspirine","Amoxicilline","Doliprane","Voltarène","Cortisone","Ventoline","Metoprolol","Ramipril","Amlodipine","Atorvastatine","Oméprazole","Pantoprazole","Lorazépam","Diazépam","Sertraline","Fluoxétine","Insuline","Levothyrox","Warfarine","Héparine","Morphine","Tramadol","Codéine","Azithromycine","Ciprofloxacine","Doxycycline","Prednisolone","Prednisone","Budesonide","Salbutamol","Tiotropium","Fluticasone","Methotrexate","Hydroxychloroquine","Adalimumab","Infliximab","Rituximab","Bisoprolol","Carvedilol","Furosémide","Spironolactone","Digoxine","Amiodarone","Clopidogrel","Rivaroxaban","Apixaban","Dabigatran","Simvastatine","Rosuvastatine","Metoclopramide","Dompéridone","Ranitidine","Esoméprazole","Lansoprazole","Baclofen","Gabapentine","Prégabaline","Carbamazépine","Valproate","Lamotrigine","Lévétiracétam"];
  const medPattern = new RegExp(`\\b(${medicaments.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
  t = t.replace(medPattern, match => `<span style="background:#E6F1FB;color:#185FA5;padding:1px 5px;border-radius:4px;font-size:12px;font-weight:500;">${match}</span>`);
  return t;
}

function renderAIMessage(text, isStreaming, c) {
  if (!text) return null;
  const clean = text.replace(/={3,}/g, "").replace(/\\n/g, "\n").replace(/\*\*\*(.*?)\*\*\*/g, "$1").replace(/\*\*(.*?)\*\*/g, "$1").replace(/^\*\s*/gm, "").replace(/\*+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  const highlighted = isStreaming ? null : highlightTerms(clean);
  return (
    <div style={{ background: c.card, border: `0.5px solid ${c.border}`, borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ fontSize: 14, color: c.txt, lineHeight: 1.9, whiteSpace: "pre-wrap" }}
        dangerouslySetInnerHTML={{ __html: isStreaming ? clean : highlighted }} />
      {isStreaming && (
        <span style={{ display: "inline-block", width: 2, height: 15, background: c.txt2, marginLeft: 2, verticalAlign: "middle", animation: "blink 1s infinite" }} />
      )}
      {!isStreaming && (
        <div style={{ borderTop: `0.5px solid ${c.border}`, marginTop: 16, paddingTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10" stroke="#888780" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16v.5" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: 12, color: c.txt2, margin: 0, lineHeight: 1.6 }}>
            Ces informations sont indicatives et ne remplacent pas un avis médical. Consultez un professionnel de santé pour un diagnostic adapté.
          </p>
        </div>
      )}
    </div>
  );
}

const URGENCY_CONF = {
  low:  { label: "Conseil médical",  color: "#4ade80", bg: "rgba(74,222,128,.10)",  border: "rgba(74,222,128,.22)"  },
  med:  { label: "Urgence modérée", color: "#fbbf24", bg: "rgba(251,191,36,.10)",  border: "rgba(251,191,36,.22)"  },
  high: { label: "Urgence élevée",  color: "#f87171", bg: "rgba(248,113,113,.10)", border: "rgba(248,113,113,.22)" },
};

function ConfRing({ val, color }) {
  const R = 30, CV = 2 * Math.PI * R, offset = CV - (val / 100) * CV;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(99,142,203,0.2)" strokeWidth="6"/>
      <circle cx="40" cy="40" r={R} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={CV} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,0,0,1)" }}/>
      <text x="40" y="44" textAnchor="middle" fontSize="15" fontWeight="700" fill={color} fontFamily="DM Sans,sans-serif">{val}%</text>
    </svg>
  );
}

function DiagResultPanel({ result, c }) {
  if (!result) return null;
  const urg = URGENCY_CONF[result.urgency] || URGENCY_CONF.med;
  const DANGER_BADGE = {
    urgent:   { label:"Urgent",  bg:"rgba(248,113,113,.12)", color:"#f87171", border:"rgba(248,113,113,.3)" },
    high:     { label:"Urgent",  bg:"rgba(248,113,113,.12)", color:"#f87171", border:"rgba(248,113,113,.3)" },
    modéré:   { label:"Modéré",  bg:"rgba(251,191,36,.12)",  color:"#fbbf24", border:"rgba(251,191,36,.3)"  },
    moderate: { label:"Modéré",  bg:"rgba(251,191,36,.12)",  color:"#fbbf24", border:"rgba(251,191,36,.3)"  },
    faible:   { label:"Faible",  bg:"rgba(74,222,128,.12)",  color:"#4ade80", border:"rgba(74,222,128,.3)"  },
    low:      { label:"Faible",  bg:"rgba(74,222,128,.12)",  color:"#4ade80", border:"rgba(74,222,128,.3)"  },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Urgency Card */}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(57,88,134,.08)", animation: "diagSlideUp .4s ease" }}>
        <div style={{ background: "linear-gradient(135deg,#304B71,#4A6FA5)", padding: "14px 18px" }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,.45)", display: "block", marginBottom: 6 }}>Niveau d'urgence</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: urg.bg, color: urg.color, border: `1px solid ${urg.border}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: urg.color, display: "inline-block" }}/>
            {urg.label}
          </span>
        </div>
      </div>

      {/* Top 3 hypothèses diagnostiques */}
      {result.diseases?.length > 0 && (() => {
        const top3 = [...result.diseases]
          .sort((a, b) => (b.probability ?? b.confidence ?? 0) - (a.probability ?? a.confidence ?? 0))
          .slice(0, 3);
        return (
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 18, padding: "16px 18px", boxShadow: "0 2px 8px rgba(57,88,134,.05)", animation: "diagSlideUp .45s ease" }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: c.txt3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Hypothèses diagnostiques</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {top3.map((d, i) => {
                const name = d.name_fr || d.name_en || "—";
                const urg = (d.urgency || "").toLowerCase().trim() || "modéré";
                const badge = DANGER_BADGE[urg] ?? DANGER_BADGE["modéré"] ?? DANGER_BADGE["moderate"];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: i === 0 ? badge.bg : "transparent", border: `1px solid ${i === 0 ? badge.border : c.border}` }}>
                    <span style={{ fontSize: 12, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? c.txt : c.txt2, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                      {i + 1}. {name}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 999, padding: "2px 10px", flexShrink: 0 }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Médecin recommandé (fallback générique) */}
      {result.recommendations?.length > 0 && (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 18, padding: "18px 20px", boxShadow: "0 2px 8px rgba(57,88,134,.05)" }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: c.txt3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Médecin recommandé</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.recommendations.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: c.bg, border: `1px solid ${c.border}`, transition: "all 200ms", animation: `diagBubbleIn .35s ease ${i * 80}ms both` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.blue + "88"; e.currentTarget.style.background = c.blueLight; e.currentTarget.style.boxShadow = `0 4px 16px ${c.blue}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bg; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${r.color}22,${r.color}11)`, border: `1px solid ${r.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Stethoscope size={20} color={r.color}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: c.txt, marginBottom: 3 }}>{r.title}</p>
                  <p style={{ fontSize: 11, color: c.txt2, lineHeight: 1.4 }}>{r.desc}</p>
                </div>
                <ChevronRight size={16} color={c.txt3}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal warning */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: "rgba(99,142,203,.05)", border: "1px solid rgba(99,142,203,.14)", borderRadius: 14 }}>
        <Shield size={16} color="#638ECB"/>
        <p style={{ fontSize: 11, color: c.txt3, lineHeight: 1.6 }}>
          <strong style={{ color: c.txt2 }}>Avertissement :</strong> Ce diagnostic est fourni à titre indicatif uniquement. Il ne remplace en aucun cas la consultation d'un professionnel de santé qualifié.
        </p>
      </div>
    </div>
  );
}

function AIDiagnosisPage({ dk, setPage }) {
  const c = dk ? T.dark : T.light;
  const WELCOME_MSG = { role: "ai", text: "Nouvelle session. Décrivez les symptômes du patient en détail — localisation, intensité, durée — et je vous fournirai une analyse immédiate." };

  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gm_aiActiveSession") || "null"); } catch { return null; }
  });
  const [chatMessagesMap, setChatMessagesMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gm_chatMessagesMap") || "{}"); } catch { return {}; }
  });
  const [messages, setMessages] = useState(() => {
    try {
      const key = JSON.parse(localStorage.getItem("gm_aiActiveSession") || "null");
      const map = JSON.parse(localStorage.getItem("gm_chatMessagesMap") || "{}");
      const k = key ? String(key) : "_latest";
      return map[k]?.length ? map[k] : [WELCOME_MSG];
    } catch { return [WELCOME_MSG]; }
  });
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [diagResultsMap, setDiagResultsMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gm_diagResultsMap") || "{}"); } catch { return {}; }
  });
  const [currentAlert, setCurrentAlert] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const sessionKey = activeSession ? String(activeSession) : "_latest";
  const diagResult = diagResultsMap[sessionKey] || null;

  function saveDiagResult(val, key) {
    const k = key ?? sessionKey;
    setDiagResultsMap(prev => {
      const next = { ...prev, [k]: val };
      localStorage.setItem("gm_diagResultsMap", JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    const k = activeSession ? String(activeSession) : "_latest";
    setChatMessagesMap(prev => {
      const next = { ...prev, [k]: messages };
      localStorage.setItem("gm_chatMessagesMap", JSON.stringify(next));
      return next;
    });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("gm_aiActiveSession", JSON.stringify(activeSession));
  }, [activeSession]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  useEffect(() => {
    api.getAISessions()
      .then(data => { if (data?.sessions) setSessions(data.sessions); })
      .catch(() => {});
  }, []);

  const quickSymptoms = ["Glycémie élevée", "Douleur thoracique", "Hypertension", "Fièvre", "Chute", "Essoufflement", "Prise de médicaments"];

  function newSession() {
    setActiveSession(null);
    setMessages([WELCOME_MSG]);
    setInput("");
    setAttachedFiles([]);
    setDiagResultsMap(prev => {
      const next = { ...prev };
      delete next["_latest"];
      localStorage.setItem("gm_diagResultsMap", JSON.stringify(next));
      return next;
    });
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  async function deleteSession(e, sessionId) {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSession === sessionId) newSession();
    api.deleteAISession(sessionId).catch(() => {});
  }

  function pickSession(s) {
    setActiveSession(s.id);
    const cached = chatMessagesMap[String(s.id)];
    if (cached?.length) { setMessages(cached); return; }
    const fromList = s.history || s.messages || [];
    if (fromList.length) {
      setMessages(fromList.map(h => ({ role: h.role === "user" ? "user" : "ai", text: h.content || h.text || "", timestamp: h.timestamp })));
      return;
    }
    setMessages([{ role: "ai", text: "Session chargée. Vous pouvez continuer la conversation." }]);
  }

  const send = async (text) => {
    const msg = text || input.trim();
    const hasFiles = attachedFiles.length > 0;
    if (!msg && !hasFiles) return;

    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(m => [...m, { role: "user", text: msg || `${attachedFiles.length} fichier(s)`, timestamp: ts }]);
    setInput("");
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setLoading(true);
    setCurrentAlert(null);

    const history = messages
      .filter(m => m.role !== "ai" || !m.text.includes("Nouvelle session"))
      .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

    let currentSendKey = activeSession ? String(activeSession) : "_latest";
    setMessages(m => [...m, { role: "ai", text: "", isStreaming: true, timestamp: ts }]);

    try {
      let aiText = "";
      if (hasFiles && filesToSend.length > 0) {
        await api.analyzeMedicalFileStream(filesToSend[0].file, msg, "fr", history, (chunk) => {
          aiText += chunk;
          setMessages(prev => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, text: aiText }]; });
        });
        setMessages(prev => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, isStreaming: false }]; });
      } else {
        let metaData = null;
        await api.analyzeSymptomsStream(
          { symptoms: msg, lang: "fr", history, session_id: activeSession },
          (chunk) => {
            aiText += chunk;
            setMessages(prev => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, text: aiText }]; });
          },
          (meta) => {
            if (meta.type === "session_saved") {
              const newId = meta.session_id;
              currentSendKey = String(newId);
              setActiveSession(newId);
              setChatMessagesMap(prev => {
                const latest = prev["_latest"] || [];
                const next = { ...prev };
                delete next["_latest"];
                if (latest.length) next[String(newId)] = latest;
                localStorage.setItem("gm_chatMessagesMap", JSON.stringify(next));
                return next;
              });
              setDiagResultsMap(prev => {
                const latestResult = prev["_latest"];
                if (!latestResult) return prev;
                const next = { ...prev, [String(newId)]: latestResult };
                delete next["_latest"];
                localStorage.setItem("gm_diagResultsMap", JSON.stringify(next));
                return next;
              });
            } else {
              metaData = meta;
            }
          },
          (alert) => setCurrentAlert(alert),
        );
        setMessages(prev => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, isStreaming: false }]; });

        const rawUrgency = metaData?.urgency || "";
        const urgencyKey = /urgent|high|élevé/i.test(rawUrgency) ? "high" : /modéré|moderate|med|moyen/i.test(rawUrgency) ? "med" : "low";
        const specialtyName = metaData?.specialist?.specialty_fr || metaData?.specialist?.specialty || metaData?.recommended_specialist || null;
        const topDisease = metaData?.diseases?.[0] || null;
        saveDiagResult({
          urgency: urgencyKey,
          diagnosis: topDisease?.name_fr || topDisease?.name_en || metaData?.diagnosis || null,
          diseases: metaData?.diseases || [],
          summary: aiText,
          tags: topDisease?.key_symptoms?.split(",").map(s => s.trim()).filter(Boolean) || [],
          recommendations: specialtyName ? [{
            color: c.blue,
            title: specialtyName,
            desc: urgencyKey === "high" ? "Consultation urgente recommandée — sous 24h" : urgencyKey === "med" ? "Consultation recommandée cette semaine" : "Consultation de suivi conseillée",
          }] : [],
        }, currentSendKey);
      }
    } catch (err) {
      console.error("AI Error:", err);
      setMessages(m => { const last = m[m.length - 1]; const base = last?.isStreaming ? m.slice(0, -1) : m; return [...base, { role: "ai", text: "Désolé, une erreur est survenue lors de l'analyse. Vérifiez votre connexion et réessayez." }]; });
    } finally {
      setLoading(false);
      api.getAISessions().then(data => { if (data?.sessions) setSessions(data.sessions); }).catch(() => {});
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...files.map(f => ({ name: f.name, file: f }))]);
    e.target.value = "";
  };

  const toggleRecording = () => {
    setIsRecording(r => !r);
    if (!isRecording) {
      setTimeout(() => { setIsRecording(false); setInput("Le patient présente une glycémie à 9.8 et des tremblements depuis ce matin"); }, 2000);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", background: c.bg, overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes diagBubbleIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes diagSlideUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes diagWaveFlow  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes diagSpin      { to{transform:rotate(360deg)} }
        @keyframes diagPulse     { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes blink         { 0%,100%{opacity:1} 50%{opacity:0} }
        .diag-wave-text { background: linear-gradient(90deg,#304B71,#638ECB,#8AAEE0,#638ECB,#304B71); background-size: 300% 100%; animation: diagWaveFlow 2.5s ease infinite; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .diag-scroll::-webkit-scrollbar { width:4px; }
        .diag-scroll::-webkit-scrollbar-track { background:transparent; }
        .diag-scroll::-webkit-scrollbar-thumb { background:rgba(99,142,203,.22); border-radius:99px; }
        .diag-chip:hover { background: ${dk ? "rgba(99,142,203,.18)" : "#dbe9ff"} !important; }
        .diag-textarea::placeholder { color: ${dk ? "rgba(240,243,250,0.38)" : "rgba(13,27,46,0.38)"} !important; }
        .diag-textarea::-webkit-scrollbar { display: none; }
        .diag-textarea { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* LEFT SIDEBAR */}
      <div style={{ width: showSidebar ? 240 : 0, background: c.card, borderRight: `1px solid ${c.border}`, display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 250ms ease", flexShrink: 0 }}>
        {showSidebar && (
          <>
            <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${c.border}` }}>
              <button onClick={newSession}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.blueLight, color: c.blue, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={13} color={c.blue}/> Nouvelle session
              </button>
            </div>
            <div className="diag-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.txt3, padding: "6px 8px 4px" }}>Historique</p>
              {sessions.length === 0 && (
                <p style={{ fontSize: 11, color: c.txt3, textAlign: "center", padding: "20px 8px", opacity: .6 }}>Aucune session précédente</p>
              )}
              {sessions.map(s => {
                const isActive = activeSession === s.id;
                const d = new Date(s.updated_at);
                const dateStr = isNaN(d) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                return (
                  <div key={s.id} onClick={() => pickSession(s)}
                    style={{ padding: "10px", borderRadius: 10, marginBottom: 2, cursor: "pointer", transition: "all 150ms", background: isActive ? c.blueLight : "transparent", border: `1px solid ${isActive ? c.blue + "22" : "transparent"}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: isActive ? c.blue : c.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{s.title || "Session sans titre"}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, color: c.txt3, whiteSpace: "nowrap" }}>{dateStr}</span>
                        <button onClick={(e) => deleteSession(e, s.id)} title="Supprimer"
                          style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: c.txt3, opacity: .6, padding: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = c.red || "#E05555"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = ".6"; e.currentTarget.style.color = c.txt3; }}>
                          <Trash2 size={11}/>
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: 10, color: c.txt3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {s.message_count} échange{s.message_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${c.border}` }}>
              <p style={{ fontSize: 9, color: c.txt3, lineHeight: 1.5 }}>Non substitutif à un médecin. Usage informatif uniquement.</p>
            </div>
          </>
        )}
      </div>

      {/* CENTER CHAT */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: c.bg, borderRight: `1px solid ${c.border}` }}>
        <div style={{ height: 52, background: c.card, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 10, flexShrink: 0 }}>
          <button onClick={() => setShowSidebar(v => !v)}
            style={{ width: 30, height: 30, borderRadius: 8, background: "transparent", border: `1px solid ${c.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <History size={14} color={c.txt3}/>
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: c.txt, lineHeight: 1.2 }}>Diagnostic IA</p>
          </div>
        </div>

        <div className="diag-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: c.blueLight, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 16px rgba(57,88,134,.08)" }}>
                <Brain size={26} color={c.blue}/>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 6 }}>Assistant Diagnostic IA</p>
              <p style={{ fontSize: 12, color: c.txt3, lineHeight: 1.65, maxWidth: 280, margin: "0 auto" }}>Décrivez les symptômes du patient en langage naturel pour obtenir une analyse médicale immédiate.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ animation: "diagBubbleIn .3s ease both", display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "user" ? (
                <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", background: "linear-gradient(135deg,#395886,#4A6FA5)", color: "#fff", fontSize: 13, lineHeight: 1.65, boxShadow: "0 2px 10px rgba(57,88,134,.2)" }}>{msg.text}</div>
              ) : (
                <div style={{ maxWidth: "90%", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: c.blueLight, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Brain size={14} color={c.blue}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {i === messages.length - 1 && currentAlert && (
                      <div style={{ background: currentAlert.level === "critical" ? "#FCEBEB" : "#FAEEDA", border: `1.5px solid ${currentAlert.level === "critical" ? "#E24B4A" : "#EF9F27"}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: currentAlert.level === "critical" ? "#E24B4A" : "#EF9F27", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {currentAlert.level === "critical" ? <ShieldAlert size={18} color="#fff" /> : <AlertTriangle size={18} color="#fff" />}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px", color: currentAlert.level === "critical" ? "#7A0D0D" : "#854F0B" }}>
                            {currentAlert.level === "critical" ? "Urgence médicale détectée" : "Attention médicale requise"}
                          </p>
                          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6, color: currentAlert.level === "critical" ? "#A32D2D" : "#9e6400" }}>{currentAlert.message}</p>
                        </div>
                      </div>
                    )}
                    {renderAIMessage(msg.text, msg.isStreaming, c)}
                  </div>
                </div>
              )}
              {msg.timestamp && (
                <span style={{ fontSize: 10, opacity: .4, marginTop: 3, color: c.txt3, paddingLeft: msg.role === "ai" ? 38 : 0 }}>{msg.timestamp}</span>
              )}
            </div>
          ))}
          {loading && !messages[messages.length - 1]?.isStreaming && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", alignSelf: "flex-start", background: "linear-gradient(135deg,rgba(48,75,113,.08),rgba(99,142,203,.08))", border: "1px solid rgba(99,142,203,.15)", borderRadius: 14, animation: "diagBubbleIn .3s ease" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#638ECB", boxSizing: "border-box", animation: "diagSpin 1s linear infinite", borderTop: "2px solid transparent", boxShadow: "0 0 0 2px rgba(99,142,203,.3)" }}/>
              <span className="diag-wave-text" style={{ fontSize: 12, fontWeight: 600 }}>Healy IA analyse les symptômes…</span>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        <div className="diag-scroll" style={{ padding: "8px 14px 4px", display: "flex", gap: 6, overflowX: "auto", flexShrink: 0, borderTop: `1px solid ${c.border}` }}>
          {quickSymptoms.map(chip => (
            <button key={chip} onClick={() => send(chip)} className="diag-chip"
              style={{ padding: "5px 12px", borderRadius: 999, background: c.blueLight, border: `1px solid ${c.border}`, color: c.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 150ms", flexShrink: 0 }}>
              {chip}
            </button>
          ))}
        </div>

        <div style={{ padding: "10px 14px 14px", flexShrink: 0, background: c.card, borderTop: `1px solid ${c.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: c.bg, border: `2px solid ${c.border}`, borderRadius: 16, padding: "8px 14px", transition: "border-color 200ms" }}
            onFocusCapture={e => e.currentTarget.style.borderColor = c.blue}
            onBlurCapture={e => e.currentTarget.style.borderColor = c.border}>
            <label style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" multiple style={{ display: "none" }} onChange={handleFileChange}/>
              <Paperclip size={18} color={c.txt3}/>
            </label>
            <textarea ref={textareaRef} value={input} className="diag-textarea"
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Décrivez les symptômes du patient en détail…" rows={1}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", resize: "none", fontSize: 15, color: c.txt, lineHeight: 1.2, fontFamily: "'DM Sans', sans-serif", maxHeight: 100, overflowY: "hidden", padding: "9px 0", minHeight: 34 }}/>
            <button onClick={toggleRecording}
              style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, border: `1px solid ${isRecording ? "#ef4444" : c.border}`, background: isRecording ? "rgba(239,68,68,.1)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mic size={18} color={isRecording ? "#ef4444" : c.txt3}/>
            </button>
            <button onClick={() => send()} disabled={!input.trim() && attachedFiles.length === 0}
              style={{ width: 40, height: 40, borderRadius: 12, border: "none", flexShrink: 0, cursor: (input.trim() || attachedFiles.length > 0) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 200ms", background: (input.trim() || attachedFiles.length > 0) ? "#395886" : c.border, boxShadow: (input.trim() || attachedFiles.length > 0) ? "0 2px 8px rgba(57,88,134,.3)" : "none" }}>
              <Send size={20} color="#fff"/>
            </button>
          </div>
          {attachedFiles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {attachedFiles.map((f, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 10px", borderRadius: 999, border: `1px solid ${c.border}`, color: c.txt, background: c.bg }}>
                  {f.name}
                  <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ marginLeft: 4, opacity: .5, background: "none", border: "none", cursor: "pointer", color: c.txt, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: RESULTS PANEL */}
      <div className="diag-scroll" style={{ flex: "0 0 380px", overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2, flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: c.txt, marginBottom: 2 }}>Résultats & Recommandations</h2>
            <p style={{ fontSize: 11, color: c.txt3 }}>Basé sur la dernière interaction</p>
          </div>
        </div>
        {!diagResult && !loading && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: c.blueLight, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 4px 20px rgba(57,88,134,.08)" }}>
              <Activity size={28} color={c.blue}/>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 8 }}>Aucun résultat pour l'instant</p>
            <p style={{ fontSize: 12, color: c.txt3, lineHeight: 1.7, maxWidth: 280 }}>Décrivez les symptômes du patient dans le chat pour obtenir un diagnostic provisoire et des recommandations.</p>
          </div>
        )}
        {loading && !diagResult && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: "linear-gradient(135deg,#304B71,#638ECB)", boxShadow: "0 4px 20px rgba(57,88,134,.25)" }}>
              <div style={{ width: 20, height: 20, border: "2.5px solid rgba(255,255,255,.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "diagSpin 0.9s linear infinite" }}/>
            </div>
            <span className="diag-wave-text" style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Analyse en cours…</span>
            <p style={{ fontSize: 11, color: c.txt3 }}>Gemini RAG traite les données médicales</p>
          </div>
        )}
        <DiagResultPanel result={diagResult} c={c} />
      </div>
    </div>
  );
}

function MyPatientsView({ onChangePage, dk, c }) {
  const { t } = useLanguage();
  const { gmPatients: patients, refreshGmPatients } = useData();
  const [profilePatient, setProfilePatient] = useState(null);
  const [resignTarget, setResignTarget]     = useState(null); // patient à résilier
  const [resignReason, setResignReason]     = useState("");
  const [resigning, setResigning]           = useState(false);
  const [resignBanner, setResignBanner]     = useState(null);

  useEffect(() => { refreshGmPatients(); }, []);

  const handleResign = async () => {
    if (!resignTarget?.care_request_id) return;
    setResigning(true);
    try {
      await api.resignFromPatient(resignTarget.care_request_id, resignReason);
      setResignBanner({ type: "success", msg: `Résiliation effectuée pour ${resignTarget.name}.` });
      setResignTarget(null);
      setResignReason("");
      refreshGmPatients();
    } catch (err) {
      setResignBanner({ type: "error", msg: err?.message || "Échec de la résiliation." });
    } finally {
      setResigning(false);
      setTimeout(() => setResignBanner(null), 4000);
    }
  };

  return (
    <>
      {/* ── Modal Résiliation ── */}
      {resignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border"
            style={{ background: c.card, borderColor: c.border }}>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#E0555518" }}>
                <X size={18} style={{ color: "#E05555" }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: c.txt }}>Se résilier du patient</h3>
                <p className="text-xs" style={{ color: c.txt2 }}>{resignTarget.name}</p>
              </div>
              <button onClick={() => { setResignTarget(null); setResignReason(""); }}
                disabled={resigning}
                className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center border hover:opacity-70 disabled:opacity-40"
                style={{ borderColor: c.border, color: c.txt3 }}>
                <X size={14} />
              </button>
            </div>

            <div className="rounded-xl p-3 mb-4 text-xs font-semibold flex gap-2"
              style={{ background: "#E0555510", border: "1px solid #E0555530", color: "#C0392B" }}>
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                Le patient sera <strong>notifié immédiatement</strong>. Votre accès à son dossier médical sera révoqué et la prise en charge sera clôturée.
              </span>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.txt2 }}>
              Motif de la résiliation <span style={{ color: "#E05555" }}>*</span>
            </label>
            <textarea
              value={resignReason}
              onChange={e => setResignReason(e.target.value)}
              placeholder="Ex : fin de contrat, déménagement, raisons personnelles…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border resize-none"
              style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt }}
            />

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setResignTarget(null); setResignReason(""); }} disabled={resigning}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80 disabled:opacity-40"
                style={{ borderColor: c.border, color: c.txt2 }}>
                Annuler
              </button>
              <button
                onClick={handleResign}
                disabled={resigning || !resignReason.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#E05555" }}>
                {resigning
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><X size={14} strokeWidth={3} /> Confirmer la résiliation</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Profil Patient ── */}
      {profilePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setProfilePatient(null); }}>
          <div className="rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border"
            style={{ background: c.card, borderColor: c.border }}>

            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white"
                  style={{ background: profilePatient.color === 'blue' ? c.blue : profilePatient.color === 'amber' ? c.amber : c.green }}>
                  {profilePatient.initials}
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: c.txt }}>{profilePatient.name}</h2>
                  <p className="text-sm" style={{ color: c.txt3 }}>
                    {profilePatient.age} ans · {(profilePatient.gender === 'male' || profilePatient.gender === 'Male') ? 'Homme' : 'Femme'} · {profilePatient.city}
                  </p>
                </div>
              </div>
              <button onClick={() => setProfilePatient(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
                style={{ background: c.blueLight }}>
                <X size={15} style={{ color: c.txt3 }} />
              </button>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-5">
              {/* Pathologies */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt3 }}>{t('pathologies_label') || "Pathologies"}</p>
                <div className="flex flex-wrap gap-2">
                  {(profilePatient.conditions || []).map((cond, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full border font-medium"
                      style={{ background: c.blueLight, color: c.blue, borderColor: c.blue + "30" }}>{cond}</span>
                  ))}
                </div>
              </div>

              {/* Contacts */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt3 }}>{t('patient_contacts_label') || "Contacts du patient"}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl border"
                    style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border }}>
                    <span className="text-xs font-medium" style={{ color: c.txt2 }}>{t('direct_phone_label') || "Téléphone direct"}</span>
                    <a href={`tel:${profilePatient.phone || "+21300000000"}`}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg"
                      style={{ background: c.green + "15", color: c.green }}>
                      <Phone size={12} /> {profilePatient.phone || t('not_specified') || "Non renseigné"}
                    </a>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border"
                    style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border }}>
                    <span className="text-xs font-medium" style={{ color: c.txt2 }}>{t('emergency_contact_label') || "Contact d'urgence"}</span>
                    <a href={`tel:${profilePatient.emergencyPhone || "+21300000001"}`}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg"
                      style={{ background: c.red + "15", color: c.red }}>
                      <Phone size={12} /> {profilePatient.emergencyContact || t('family_label') || "Famille"}
                    </a>
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt3 }}>{t('address_label') || "Adresse"}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profilePatient.address || profilePatient.city || "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-2 p-3 rounded-xl border transition-opacity hover:opacity-80"
                  style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border }}>
                  <MapPin size={14} style={{ color: c.blue, flexShrink: 0, marginTop: 1 }} />
                  <span className="text-sm" style={{ color: c.txt2 }}>
                    {profilePatient.address || profilePatient.city || t('no_address_specified') || "Adresse non renseignée"}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-12 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold mb-2" style={{ color: c.txt }}>{t('my_patients_title') || "Mes Patients"}</h1>
        <p className="font-medium" style={{ color: c.txt3 }}>{t('patients_assigned_count', {count: patients.length}) || `${patients.length} patients assignés à votre charge`}</p>
      </header>

      {resignBanner && (
        <div className="px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2"
          style={{
            background: (resignBanner.type === "success" ? "#2D8C6F" : "#E05555") + "18",
            borderColor: (resignBanner.type === "success" ? "#2D8C6F" : "#E05555") + "44",
            color: resignBanner.type === "success" ? "#2D8C6F" : "#E05555",
          }}>
          {resignBanner.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {resignBanner.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {patients.length === 0 ? (
          <Card dk={dk} empty={true} className="col-span-full flex flex-col items-center justify-center min-h-[40vh] text-center p-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: c.blue + "15", color: c.blue }}><UserPlus size={32} /></div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: c.txt }}>{t('no_patient_assigned_title') || "Aucun Patient Assigné"}</h2>
            <p className="text-sm max-w-md mb-8" style={{ color: c.txt3 }}>Vous n'avez pas encore été assigné à des patients. Les patients apparaîtront ici lorsqu'une demande de soins sera acceptée.</p>
          </Card>
        ) : patients.map((p) => (
          <Card key={p.id} dk={dk} className="p-8 group relative overflow-hidden hover:shadow-xl hover:border-blue-500/20">
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[80px] opacity-10"
              style={{ background: p.color === 'blue' ? c.blue : p.color === 'amber' ? c.amber : c.green }}></div>
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-bold shadow-xl"
                style={{ background: dk ? "#1F2937" : "#F8FAFC", borderColor: c.border }}>
                <span style={{ color: dk ? "#fff" : c.blue }}>{p.initials}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold group-hover:text-blue-500 transition-colors" style={{ color: c.txt }}>{p.name}</h2>
                <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: c.txt3 }}>{p.age} ans · {(p.gender === 'male' || p.gender === 'Male') ? 'Homme' : 'Femme'} · {p.city}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(p.conditions || []).map((cond, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    style={{ background: dk ? "rgba(255,255,255,0.05)" : "#fff", borderColor: c.border, color: c.txt2 }}>
                    {cond}
                  </span>
                ))}
              </div>
              <div className="w-full grid grid-cols-1 gap-3 pt-4 border-t" style={{ borderColor: c.border }}>
                <button
                  onClick={() => setProfilePatient(p)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2"
                  style={{ background: dk ? "rgba(255,255,255,0.05)" : "#fff", borderColor: c.border, color: c.txt2 }}>
                  <User size={13} /> {t('view_profile_btn') || "Voir profil"}
                </button>
                <button
                  onClick={() => onChangePage("treatments")}
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2"
                  style={{ background: dk ? "rgba(255,255,255,0.05)" : "#fff", borderColor: c.border, color: c.txt2 }}>
                  <Pill size={13} /> Traitements
                </button>
                <a href={`tel:${p.emergencyPhone || p.emergency_contact_phone || ""}`}
                  className="w-full py-2.5 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <Phone size={13} /> {t('alert_patient_btn') || "Alerter"}
                </a>
                <button
                  onClick={() => { setResignTarget(p); setResignReason(""); }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border"
                  style={{ borderColor: "#E05555" + "44", color: "#E05555", background: "#E0555508" }}>
                  <X size={13} strokeWidth={2.5} /> Se résilier
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
    </>
  );
}

function TreatmentsView({ dk, c }) {
  const { t } = useLanguage();
  const {
    gmPatients: patients, gmTreatments: treatments,
    addMedicationToTreatment, removeMedicationFromTreatment,
    addPatientToTreatments, removePatientFromTreatments,
    refreshGmPatients, refreshGmTreatments,
  } = useData();

  const [editId, setEditId] = useState(null);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", slot: "morning", time: "" });
  const [showAddPatient, setShowAddPatient] = useState(null);
  const [removedHistory, setRemovedHistory] = useState([]);

  // ── Cases à cocher journalières (reset auto chaque jour) ────────────────────
  const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const [checkedMeds, setCheckedMeds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("gm_checkedMeds") || "{}");
      return stored.date === todayKey ? stored.keys : {};
    } catch { return {}; }
  });
  useEffect(() => {
    localStorage.setItem("gm_checkedMeds", JSON.stringify({ date: todayKey, keys: checkedMeds }));
  }, [checkedMeds]);

  function toggleMedCheck(key) {
    setCheckedMeds(prev => {
      const n = { ...prev };
      if (n[key]) delete n[key]; else n[key] = true;
      localStorage.setItem("gm_checkedMeds", JSON.stringify({ date: todayKey, keys: n }));
      return n;
    });
  }

  // ── Tâches ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState({});      // { [care_request_id]: [...tasks] }
  const [newTask, setNewTask] = useState({});  // { [care_request_id]: { title, due_date } }
  const [addingTask, setAddingTask] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    api.getCaretakerTasks()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        const grouped = {};
        list.forEach(task => {
          const cid = String(task.care_request);
          if (!grouped[cid]) grouped[cid] = [];
          grouped[cid].push(task);
        });
        setTasks(grouped);
      })
      .catch(() => {});
  }, []);

  async function handleAddTask(careRequestId) {
    const form = newTask[careRequestId] || {};
    if (!form.title?.trim()) return;
    setAddingTask(prev => ({ ...prev, [careRequestId]: true }));
    try {
      const created = await api.createCaretakerTask({
        care_request: careRequestId,
        title: form.title.trim(),
        due_date: form.due_date || undefined,
      });
      setTasks(prev => ({
        ...prev,
        [String(careRequestId)]: [created, ...(prev[String(careRequestId)] || [])],
      }));
      setNewTask(prev => ({ ...prev, [careRequestId]: { title: "", due_date: "" } }));
    } catch (e) {
      // silencieux — erreur déjà visible dans la console
    } finally {
      setAddingTask(prev => ({ ...prev, [careRequestId]: false }));
    }
  }

  async function handleToggleTask(task) {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    try {
      const updated = await api.updateCaretakerTask(task.id, { status: newStatus });
      setTasks(prev => {
        const cid = String(task.care_request);
        return {
          ...prev,
          [cid]: (prev[cid] || []).map(tk => tk.id === task.id ? updated : tk),
        };
      });
    } catch { /* silencieux */ }
  }

  async function handleDeleteTask(task) {
    try {
      await api.deleteCaretakerTask(task.id);
      setTasks(prev => {
        const cid = String(task.care_request);
        return { ...prev, [cid]: (prev[cid] || []).filter(tk => tk.id !== task.id) };
      });
    } catch { /* silencieux */ }
  }

  useEffect(() => {
    refreshGmPatients();
    refreshGmTreatments();
  }, []);

  const editTreatment = treatments.find(t => t.id === editId) || null;
  const slots = [
    { key: "morning", label: t('morning_label') || "Matin" },
    { key: "afternoon", label: t('afternoon_label') || "Après-midi" },
    { key: "evening", label: t('evening_label') || "Soir" },
  ];

  const handleAddMed = () => {
    if (!newMed.name.trim() || !editTreatment) return;
    addMedicationToTreatment(editId, newMed.slot, { name: newMed.name.trim(), dosage: newMed.dosage.trim(), time: newMed.time || undefined });
    setNewMed({ name: "", dosage: "", slot: newMed.slot, time: "" });
  };

  const patientsNotInPlan = patients.filter(p => !treatments.find(tr => tr.patient_id === p.user_id));

  const inputCls = "px-3 py-2 rounded-xl text-sm outline-none border";
  const inputStyle = { background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">

      {/* ── Modal Modifier Traitement ── */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setEditId(null); }}>
          <div className="rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border"
            style={{ background: c.card, borderColor: c.border }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: c.border }}>
              <h2 className="text-lg font-bold" style={{ color: c.txt }}>
                {t('modify_treatment_title', {name: editTreatment?.patientName}) || `Modifier — ${editTreatment?.patientName}`}
              </h2>
              <button onClick={() => setEditId(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
                style={{ background: c.blueLight }}>
                <X size={15} style={{ color: c.txt3 }} />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto">
              {slots.map(({ key, label }) => (
                <div key={key}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt3 }}>{label}</p>
                  <div className="space-y-2">
                    {(editTreatment?.[key] || []).length === 0 && (
                      <p className="text-xs italic" style={{ color: c.txt3 }}>{t('no_meds_text') || "Aucun médicament"}</p>
                    )}
                    {(editTreatment?.[key] || []).map((med, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-2.5 rounded-xl border"
                        style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border }}>
                        <div className="flex items-center gap-2">
                          <Pill size={14} style={{ color: c.blue }} />
                          <span className="text-sm font-semibold" style={{ color: c.txt }}>{med.name}</span>
                          {med.dosage && <span className="text-xs" style={{ color: c.txt3 }}>{med.dosage}</span>}
                          {med.time && <span className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md" style={{ background: c.blue + "15", color: c.blue }}>{med.time}</span>}
                        </div>
                        <button onClick={() => removeMedicationFromTreatment(editId, key, idx)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"
                          style={{ background: c.red + "15", color: c.red }}>
                          <Trash2 size={13} title={t('remove_btn') || "Supprimer"} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t space-y-3" style={{ borderColor: c.border }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: c.txt3 }}>{t('add_medication_title') || "Ajouter un médicament"}</p>
              <div className="flex gap-2 flex-wrap">
                <input type="text" placeholder={t('name_placeholder') || "Nom"} value={newMed.name}
                  onChange={e => setNewMed(m => ({ ...m, name: e.target.value }))}
                  className={`flex-1 min-w-[120px] ${inputCls}`} style={inputStyle} />
                <input type="text" placeholder={t('dosage_placeholder') || "Dosage"} value={newMed.dosage}
                  onChange={e => setNewMed(m => ({ ...m, dosage: e.target.value }))}
                  className={`w-24 ${inputCls}`} style={inputStyle} />
                <input type="time" value={newMed.time}
                  onChange={e => setNewMed(m => ({ ...m, time: e.target.value }))}
                  className={`w-28 ${inputCls}`} style={inputStyle} />
                <div className="w-32">
                  <DashSelect
                    value={newMed.slot}
                    options={[
                      { value: "morning", label: "Matin" },
                      { value: "afternoon", label: "Après-midi" },
                      { value: "evening", label: "Soir" },
                    ]}
                    onSelect={v => setNewMed(m => ({ ...m, slot: v }))}
                    dk={dk}
                    c={c}
                  />
                </div>
                <button onClick={handleAddMed} disabled={!newMed.name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                  style={{ background: newMed.name.trim() ? c.blue : c.border }}>
                  <Plus size={15} /> {t('add_btn') || "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── En-tête + boutons globaux ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: c.txt }}>{t('treatment_plans_title') || "Plans de Traitement"}</h1>
          <p className="text-sm font-medium" style={{ color: c.txt3 }}>{t('all_patients_at_planning', {count: treatments.length}) || `${treatments.length} patient(s) au planning`}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Ajouter un patient */}
          {patientsNotInPlan.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAddPatient(showAddPatient ? null : "open")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                style={{ background: c.blue }}>
                <UserPlus size={15} /> {t('add_patient_btn') || "Ajouter un patient"}
              </button>
              {showAddPatient === "open" && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAddPatient(null)} />
                  <div className="absolute right-0 top-12 z-50 rounded-2xl border shadow-xl py-2 min-w-[220px]"
                    style={{ background: c.card, borderColor: c.border }}>
                    {patientsNotInPlan.map(p => (
                      <button key={p.id}
                        onClick={() => { addPatientToTreatments(p); setShowAddPatient(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-all hover:opacity-80"
                        style={{ color: c.txt }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: p.color === 'blue' ? c.blue : p.color === 'amber' ? c.amber : c.green }}>
                          {p.initials}
                        </div>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {treatments.length === 0 && patients.length === 0 && null}
        </div>
      </div>

      {/* ── Liste des plans ── */}
      {treatments.length === 0 ? (
        <Card dk={dk} empty={true} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: c.blue + "15" }}>
            <Pill size={28} style={{ color: c.blue }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: c.txt }}>{t('no_treatment_plan_title') || "Aucun plan de traitement"}</h2>
          <p className="text-sm max-w-sm" style={{ color: c.txt3 }}>
            {patients.length === 0
              ? "Vos patients assignés apparaîtront ici après acceptation d'une demande de soins."
              : (t('add_patient_to_planning_desc') || "Utilisez le bouton ci-dessus pour ajouter un patient au planning.")}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {treatments.map(tr => (
            <Card key={tr.id} dk={dk} className="hover:shadow-md transition-all">
              {/* Header carte */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: c.blue }}>
                    {tr.initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: c.txt }}>{tr.patientName}</h3>
                    <p className="text-[11px] font-medium" style={{ color: c.txt3 }}>{tr.condition}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditId(tr.id); setNewMed({ name: "", dosage: "", slot: "morning", time: "" }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all hover:opacity-80"
                    style={{ borderColor: c.blue + "40", color: c.blue, background: c.blue + "10" }}>
                    <Plus size={12} /> Modifier
                  </button>
                  <button onClick={() => {
                    setRemovedHistory(h => [...h, { id: tr.id, initials: tr.initials, patientName: tr.patientName, condition: tr.condition, removedAt: new Date().toLocaleDateString("fr-FR") }]);
                    removePatientFromTreatments(tr.id);
                  }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all hover:bg-red-500 hover:text-white"
                    style={{ borderColor: c.red + "30", color: c.red, background: c.red + "10" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Créneaux médicaments */}
              <div className="space-y-3">
                {slots.map(({ key, label }) => {
                  const meds = tr[key] || [];
                  if (meds.length === 0) return null;
                  return (
                    <div key={key} className="rounded-xl p-3 border" style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: c.txt3 }}>{label}</p>
                      <div className="space-y-1.5">
                        {meds.map((med, idx) => {
                          const ck = `${tr.patientName}__${key}__${med.name}__${idx}`;
                          const isChecked = !!checkedMeds[ck];
                          return (
                            <div key={idx} className="flex items-center justify-between gap-2">
                              <button
                                onClick={() => toggleMedCheck(ck)}
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                                style={{
                                  borderColor: isChecked ? c.green : c.txt3,
                                  background: isChecked ? c.green : "transparent",
                                }}>
                                {isChecked && <Check size={10} color="#fff" />}
                              </button>
                              <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                                <Pill size={13} style={{ color: isChecked ? c.txt3 : c.blue, opacity: isChecked ? 0.5 : 1 }} />
                                <span style={{ color: c.txt, textDecoration: isChecked ? "line-through" : "none", opacity: isChecked ? 0.5 : 1 }}>{med.name}</span>
                                {med.dosage && <span className="text-xs font-medium" style={{ color: c.txt3, opacity: isChecked ? 0.5 : 1 }}>{med.dosage}</span>}
                                {med.time && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: c.blue + "15", color: c.blue, opacity: isChecked ? 0.5 : 1 }}>{med.time}</span>}
                              </div>
                              <button onClick={() => removeMedicationFromTreatment(tr.id, key, idx)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-red-500 hover:text-white shrink-0"
                                style={{ color: c.red, background: c.red + "12" }}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {slots.every(({ key }) => (tr[key] || []).length === 0) && (
                  <p className="text-xs text-center py-2 italic" style={{ color: c.txt3 }}>
                    {t('no_medications_added') || "Aucun médicament — cliquez sur Modifier pour en ajouter."}
                  </p>
                )}
              </div>

              {/* ── Tâches ── */}
              {(() => {
                const cid = String(tr.care_request);
                const cardTasks = tasks[cid] || [];
                const isExpanded = expandedTasks[cid];
                const form = newTask[cid] || { title: "", due_date: "" };
                return (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: c.border }}>
                    <button
                      onClick={() => setExpandedTasks(prev => ({ ...prev, [cid]: !prev[cid] }))}
                      className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: c.txt3 }}>
                      <span className="flex items-center gap-1.5">
                        <ClipboardList size={13} /> Tâches
                        {cardTasks.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: c.blue + "20", color: c.blue }}>
                            {cardTasks.filter(tk => tk.status !== 'done').length}/{cardTasks.length}
                          </span>
                        )}
                      </span>
                      <ChevronDown size={13} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
                    </button>

                    {isExpanded && (
                      <div className="space-y-2">
                        {cardTasks.length === 0 && (
                          <p className="text-xs italic py-1" style={{ color: c.txt3 }}>Aucune tâche planifiée.</p>
                        )}
                        {cardTasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2 p-2 rounded-xl border"
                            style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: task.status === 'done' ? c.green + "30" : c.border }}>
                            <button onClick={() => handleToggleTask(task)}
                              className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                              style={{
                                borderColor: task.status === 'done' ? c.green : c.txt3,
                                background: task.status === 'done' ? c.green : "transparent",
                              }}>
                              {task.status === 'done' && <Check size={10} color="#fff" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate"
                                style={{ color: c.txt, textDecoration: task.status === 'done' ? "line-through" : "none", opacity: task.status === 'done' ? 0.6 : 1 }}>
                                {task.title}
                              </p>
                              {task.due_date && (
                                <p className="text-[10px]" style={{ color: c.txt3 }}>
                                  <Clock size={9} style={{ display: "inline", marginRight: 2 }} />{task.due_date}
                                </p>
                              )}
                            </div>
                            <button onClick={() => handleDeleteTask(task)}
                              className="w-5 h-5 rounded-lg flex items-center justify-center transition-all hover:bg-red-500 hover:text-white shrink-0"
                              style={{ color: c.red, background: c.red + "12" }}>
                              <X size={10} />
                            </button>
                          </div>
                        ))}

                        {/* Ajouter une tâche */}
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Nouvelle tâche..."
                            value={form.title}
                            onChange={e => setNewTask(prev => ({ ...prev, [cid]: { ...form, title: e.target.value } }))}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask(cid)}
                            className="flex-1 px-2.5 py-1.5 rounded-xl text-xs outline-none border"
                            style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt }}
                          />
                          <input
                            type="date"
                            value={form.due_date}
                            onChange={e => setNewTask(prev => ({ ...prev, [cid]: { ...form, due_date: e.target.value } }))}
                            className="px-2 py-1.5 rounded-xl text-xs outline-none border"
                            style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt3, width: 120 }}
                          />
                          <button
                            onClick={() => handleAddTask(cid)}
                            disabled={!form.title?.trim() || addingTask[cid]}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40"
                            style={{ background: c.blue }}>
                            {addingTask[cid]
                              ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                              : <Plus size={13} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>
          ))}
        </div>
      )}

      {/* ── Historique ── */}
      {removedHistory.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: c.txt }}>Historique</h2>
          <div className="space-y-3">
            {removedHistory.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl border"
                style={{ background: c.red + "08", borderColor: c.red + "25" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border"
                    style={{ background: c.red + "15", color: c.red, borderColor: c.red + "25" }}>
                    {h.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: c.txt }}>{h.patientName}</p>
                    <p className="text-xs font-medium" style={{ color: c.txt3 }}>{h.condition}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: c.txt3 + "15", color: c.txt3 }}>
                    Retiré le {h.removedAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ onTarifSaved, dk, c, user }) {
  const { t, lang, setLang } = useLanguage();
  const [showPwd, setShowPwd] = useState(false);
  const [locSaved, setLocSaved] = useState(false);
  const [tarifSaved, setTarifSaved] = useState(false);

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwdStatus, setPwdStatus] = useState({ type: "", msg: "" });
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const [locForm, setLocForm] = useState({ address: "", commune: "", wilaya: "", mapsUrl: "" });
  const [tarifForm, setTarifForm] = useState({ tarifSoin: "", tarifNuit: "", tarifMensuel: "" });
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
      setTarifForm(f => ({
        ...f,
        tarifSoin: user.tarif_de_base != null ? String(user.tarif_de_base) : "",
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
          : "Profil mis à jour avec succès",
      });
      setIdentityReason("");
      setEmailReason("");
      setTimeout(() => setStatus({ type: "", msg: "" }), 4000);
    } catch {
      setStatus({ type: "error", msg: t('update_error') || "Erreur lors de la mise à jour" });
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
      setPwdStatus({ type: "success", msg: t('password_changed_success') || "Mot de passe modifié" });
      setPwdForm({ currentPassword: "", newPassword: "" });
      setTimeout(() => setPwdStatus({ type: "", msg: "" }), 4000);
    } catch {
      setPwdStatus({ type: "error", msg: t('password_change_error') || "Erreur lors du changement" });
      setTimeout(() => setPwdStatus({ type: "", msg: "" }), 4000);
    } finally {
      setIsSavingPwd(false);
    }
  };

  const [locSaving, setLocSaving] = useState(false);
  const [locError, setLocError] = useState("");

  const handleSaveLocation = async () => {
    setLocSaving(true);
    setLocError("");
    try {
      const area = [locForm.commune, locForm.wilaya].filter(Boolean).join(", ");
      await api.updateCaretakerProfile({
        availability_area: area,
        maps_url: locForm.mapsUrl || undefined,
      });
      setLocSaved(true);
      setTimeout(() => setLocSaved(false), 3000);
    } catch (err) {
      setLocError(err?.message || "Erreur lors de la mise à jour.");
      setTimeout(() => setLocError(""), 4000);
    } finally {
      setLocSaving(false);
    }
  };

  const [tarifSaving, setTarifSaving] = useState(false);
  const [tarifError, setTarifError] = useState("");

  const handleSaveTarifs = async () => {
    setTarifSaving(true);
    setTarifError("");
    try {
      await api.updateCaretakerProfile({
        tarif_de_base: tarifForm.tarifSoin || undefined,
      });
      setTarifSaved(true);
      if (onTarifSaved) onTarifSaved(tarifForm.tarifMensuel);
      setTimeout(() => setTarifSaved(false), 3000);
    } catch (err) {
      setTarifError(err?.message || "Erreur lors de l'enregistrement des tarifs.");
      setTimeout(() => setTarifError(""), 4000);
    } finally {
      setTarifSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all focus:ring-2";
  const inputStyle = { background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt };
  const labelCls = "block text-xs font-bold uppercase tracking-wide mb-1.5";

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* ── Profil + Sécurité ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

        {/* Profil */}
        <Card dk={dk}>
          <p className="font-semibold mb-5" style={{ color: c.txt }}>{t('profile_title') || "Profil"}</p>
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
            {isSaving ? (t('saving_btn') || "Enregistrement...") : (t('save_changes_btn') || "Sauvegarder")}
          </button>
        </Card>

        {/* Sécurité */}
        <Card dk={dk}>
          <p className="font-semibold mb-5" style={{ color: c.txt }}>{t('security_title') || "Sécurité"}</p>
          {pwdStatus.msg && (
            <div className="mb-4 p-3 rounded-xl text-xs font-semibold" style={{
              background: pwdStatus.type === "success" ? "#2D8C6F12" : "#E0555512",
              color: pwdStatus.type === "success" ? "#2D8C6F" : "#E05555",
              border: `1px solid ${pwdStatus.type === "success" ? "#2D8C6F44" : "#E0555544"}`,
            }}>{pwdStatus.msg}</div>
          )}
          {[
            { label: t('current_password_label') || "Mot de passe actuel", key: "currentPassword" },
            { label: t('new_password_label') || "Nouveau mot de passe", key: "newPassword" },
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
            {isSavingPwd ? (t('updating_btn') || "Mise à jour...") : (t('update_password_btn') || "Changer le mot de passe")}
          </button>
        </Card>
      </div>

      {/* ── Zone d'intervention & Maps ── */}
      <Card dk={dk}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.blue + "18" }}>
            <MapPin size={18} style={{ color: c.blue }} />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: c.txt }}>{t('intervention_zone_title') || "Zone d'intervention & Maps"}</p>
            <p className="text-xs" style={{ color: c.txt3 }}>{t('intervention_zone_desc') || "Gérez votre zone d'intervention à domicile"}</p>
          </div>
        </div>

        {locSaved && (
          <div className="mb-5 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{ background: "#2D8C6F12", color: "#2D8C6F", border: "1px solid #2D8C6F44" }}>
            <Check size={14} /> Localisation mise à jour avec succès
          </div>
        )}
        {locError && (
          <div className="mb-5 p-3 rounded-xl text-xs font-semibold"
            style={{ background: "#E0555512", color: "#E05555", border: "1px solid #E0555544" }}>
            {locError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Champs */}
          <div className="space-y-5">
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>Adresse d'intervention</label>
              <input
                type="text"
                placeholder="Ex: 12 Rue Didouche Mourad"
                value={locForm.address}
                onChange={(e) => setLocForm((f) => ({ ...f, address: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>Commune</label>
              <input
                type="text"
                placeholder="Ex: Alger-Centre"
                value={locForm.commune}
                onChange={(e) => setLocForm((f) => ({ ...f, commune: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <DashSelect
              label={t('wilaya_label') || "Wilaya"}
              value={locForm.wilaya}
              options={WILAYAS_LIST}
              onSelect={(w) => setLocForm((f) => ({ ...f, wilaya: w }))}
              dk={dk}
              c={c}
              placeholder={t('select_wilaya_placeholder') || "Sélectionner votre wilaya"}
            />
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>Lien Google Maps (Optionnel)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Collez l'URL Google Maps ici..."
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
            <button
              onClick={handleSaveLocation}
              disabled={locSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, #304B71, ${c.blue})` }}
            >
              {locSaving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <MapPin size={15} />}
              {t('update_map_btn') || "Mettre à jour la carte"}
            </button>
          </div>

          {/* Aperçu carte */}
          <div className="flex flex-col gap-3">
            <label className={labelCls} style={{ color: c.txt2 }}>Map Preview</label>
            {(() => {
              const addressQuery = [locForm.address, locForm.commune, locForm.wilaya].filter(Boolean).join(", ");
              let embedSrc = null;
              let openUrl = locForm.mapsUrl || null;

              if (locForm.mapsUrl) {
                if (locForm.mapsUrl.includes("output=embed") || locForm.mapsUrl.includes("/embed")) {
                  embedSrc = locForm.mapsUrl;
                } else {
                  const coordMatch = locForm.mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                  const placeMatch = locForm.mapsUrl.match(/\/place\/([^/]+)/);
                  const rawCoord = locForm.mapsUrl.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
                  if (rawCoord) {
                    embedSrc = `https://maps.google.com/maps?q=${rawCoord[1]},${rawCoord[2]}&hl=fr&z=15&output=embed`;
                  } else if (coordMatch) {
                    embedSrc = `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&hl=fr&z=15&output=embed`;
                  } else if (placeMatch) {
                    embedSrc = `https://maps.google.com/maps?q=${placeMatch[1]}&hl=fr&z=15&output=embed`;
                  } else {
                    embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(locForm.mapsUrl)}&hl=fr&z=15&output=embed`;
                  }
                }
              } else if (addressQuery) {
                embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}&hl=fr&z=15&output=embed`;
                openUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}`;
              }

              return embedSrc ? (
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
                  {openUrl && (
                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:opacity-90"
                      style={{ background: c.blue }}
                    >
                      <MapPin size={12} /> {t('open_in_maps_btn') || "Ouvrir dans Maps"}
                    </a>
                  )}
                </div>
              ) : (
                <div
                  className="flex-1 min-h-[280px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all"
                  style={{ background: dk ? "#0D1117" : "#F4F8FB", borderColor: c.border }}
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: c.blue + "18" }}>
                      <MapPin size={28} style={{ color: c.blue }} />
                    </div>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: c.blue }} />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-bold" style={{ color: c.txt }}>Map Preview</p>
                    <p className="text-xs mt-1" style={{ color: c.txt3 }}>Collez une URL Maps ou entrez votre adresse</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* ── Tarifs de garde ── */}
      <Card dk={dk}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.green + "18" }}>
            <Shield size={18} style={{ color: c.green }} />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: c.txt }}>{t('care_tariffs_title') || "Tarifs de garde"}</p>
            <p className="text-xs" style={{ color: c.txt3 }}>{t('care_tariffs_desc') || "Définissez vos tarifs affichés aux patients"}</p>
          </div>
        </div>

        {tarifSaved && (
          <div className="mb-5 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{ background: "#2D8C6F12", color: "#2D8C6F", border: "1px solid #2D8C6F44" }}>
            <Check size={14} /> {t('tariffs_saved_success') || "Tarifs mis à jour avec succès"}
          </div>
        )}
        {tarifError && (
          <div className="mb-5 p-3 rounded-xl text-xs font-semibold"
            style={{ background: "#E0555512", color: "#E05555", border: "1px solid #E0555544" }}>
            {tarifError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          {[
            { key: "tarifSoin", label: t('tarif_soin_label') || "Tarif Soin Ponctuel", placeholder: "Ex: 2000", suffix: "DZD" },
            { key: "tarifNuit", label: t('tarif_nuit_label') || "Tarif Garde de Nuit", placeholder: "Ex: 4000", suffix: "DZD" },
            { key: "tarifMensuel", label: t('tarif_mensuel_label') || "Tarif Mensuel (optionnel)", placeholder: "Ex: 45000", suffix: "DZD" },
          ].map(({ key, label, placeholder, suffix }) => (
            <div key={key}>
              <label className={labelCls} style={{ color: c.txt2 }}>{label}</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={placeholder}
                  value={tarifForm[key]}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setTarifForm((f) => ({ ...f, [key]: v }));
                  }}
                  className={inputCls}
                  style={inputStyle}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none" style={{ color: c.txt3 }}>
                  {suffix}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveTarifs}
          disabled={tarifSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, #1F6B50, ${c.green})` }}
        >
          {tarifSaving
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Shield size={15} />}
          {t('save_tariffs_btn') || "Enregistrer les tarifs"}
        </button>
      </Card>

      {/* ── Langue + À propos ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card dk={dk}>
          <p className="font-semibold mb-4" style={{ color: c.txt }}>Language</p>
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
          <p className="font-semibold mb-2" style={{ color: c.txt }}>About</p>
          <p className="text-sm" style={{ color: c.txt2 }}>Healy · Connected Healthcare Platform</p>
          <p className="text-xs mt-1" style={{ color: c.txt3 }}>CNAS Certified · RGPD Compliant · Hosted in Algeria</p>
        </Card>
      </div>

      <ContactAdminCard dk={dk} />
    </div>
  );
}

function NotificationsView({ dk, c }) {
  const { globalNotifications, markNotificationRead, markAllNotificationsRead } = useData();

  // Couleurs par type — gère à la fois les types backend (caretaker/appointment/...) et locaux (error/warning/...)
  const typeColor = {
    error: "#E05555", warning: "#E8A838", success: "#2D8C6F", info: "#4A6FA5",
    caretaker: "#7B5EA7", appointment: "#4A6FA5", pharmacy: "#E8A838", system: "#5A6E8A",
  };
  const typeLabel = {
    error: "Erreur", warning: "Attention", success: "Succès", info: "Info",
    caretaker: "Patient", appointment: "Rendez-vous", pharmacy: "Pharmacie", system: "Système",
  };

  const unreadCount = globalNotifications.filter(n => !n.is_read).length;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: c.txt }}>Notifications</h1>
          <p className="text-sm font-medium" style={{ color: c.txt3 }}>
            Historique de vos alertes et messages système
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-bold px-3 py-2 rounded-xl border hover:opacity-80"
            style={{ borderColor: c.border, color: c.blue }}>
            Tout marquer lu
          </button>
        )}
      </header>

      {globalNotifications.length === 0 ? (
        <Card dk={dk} empty className="flex flex-col items-center justify-center py-20 text-center">
          <Bell size={40} style={{ color: c.txt3, opacity: 0.3 }} className="mb-4" />
          <p className="text-base font-bold mb-1" style={{ color: c.txt }}>Aucune notification</p>
          <p className="text-sm" style={{ color: c.txt3 }}>Vous serez notifié ici lors d'événements importants.</p>
        </Card>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: c.card, borderColor: c.border }}>
          {globalNotifications.map((n) => {
            const color = typeColor[n.type] || typeColor.info;
            const label = typeLabel[n.type] || "Info";
            return (
              <div key={n.id}
                onClick={() => !n.is_read && markNotificationRead(n.id)}
                className="flex items-start gap-4 px-5 py-4 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-black/[.02]"
                style={{ borderColor: c.border, background: n.is_read ? "transparent" : (color + "08") }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: color + "15", border: `1px solid ${color}30` }}>
                  <Bell size={14} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold" style={{ color: c.txt }}>{n.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: color + "15", color }}>
                      {label}
                    </span>
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full ml-auto shrink-0" style={{ background: color }} />}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: c.txt2 }}>{n.message}</p>
                  {n.created_at && (
                    <p className="text-[10px] mt-1" style={{ color: c.txt3 }}>{formatNotifDate(n.created_at)}</p>
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

// ─── ReviewsView ─────────────────────────────────────────────────────────────
function ReviewsView({ dk, c }) {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [profile, setProfile]   = useState(null);

  useEffect(() => {
    Promise.all([
      api.getCaretakerReviews().catch(() => []),
      api.getCaretakerProfile().catch(() => null),
    ]).then(([revData, profileData]) => {
      setReviews(Array.isArray(revData) ? revData : (revData?.results || []));
      setProfile(profileData);
    }).finally(() => setLoading(false));
  }, []);

  const cardBg    = dk ? "#172133" : "#ffffff";
  const labelStyle = { color: dk ? "#A0B5CD" : "#5C738A", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" };
  const rating    = profile?.rating ? Number(profile.rating) : 0;
  const total     = profile?.total_reviews ?? reviews.length;

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

      {/* Summary card */}
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

      {/* Reviews list */}
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

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function GardeMaladeDashboard({ onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { userData: user } = useAuth();
  const { t } = useLanguage();
  const [page, setPage] = useState("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { globalNotifications, markAllNotificationsRead } = useData();
  const [tarifMensuel, setTarifMensuel] = useState("");
  const unreadCount = globalNotifications.filter(n => !n.is_read).length;

  const dk = theme === "dark";
  const c = dk ? T.dark : T.light;

  const userInitials =
    user && (user.first_name || user.last_name)
      ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
      : "GM";
  const fullName =
    user && (user.first_name || user.last_name)
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : "Mon Compte";

  // ── Chat state ──
  const [activeChatConv, setActiveChatConv] = useState(null);
  const { unreadChatCount, setUnreadChatCount } = useData();

  const NAV = [
    { id: "dashboard",    label: t('nav_home')       || "Accueil" },
    { id: "jobRequests",  label: "Offres & Missions" },
    { id: "myPatients",   label: t('nav_patients')   || "Mes Patients" },
    { id: "treatments",   label: t('nav_treatments') || "Traitements" },
    { id: "emergencies",  label: "Urgences" },
    { id: "ai-diagnosis", label: "IA Diagnostic" },
  ];

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <HomeView onChangePage={setPage} dk={dk} c={c} />;
      case "notifications": return <NotificationsView dk={dk} c={c} />;
      case "emergencies": return <EmergenciesView dk={dk} c={c} />;
      case "jobRequests": return <JobRequestsView dk={dk} c={c} />;
      case "myPatients": return <MyPatientsView onChangePage={setPage} dk={dk} c={c} />;
      case "treatments": return <TreatmentsView dk={dk} c={c} />;
      case "ai-diagnosis": return <AIDiagnosisPage dk={dk} setPage={setPage} />;
      case "reviews":  return <ReviewsView dk={dk} c={c} />;
      case "settings": return <SettingsView onTarifSaved={setTarifMensuel} dk={dk} c={c} user={user} />;
      case "messages":
        return (
          <div className="flex gap-5" style={{ height: "calc(100vh - 120px)", minHeight: 500 }}>
            {/* ConversationList — 30% */}
            <div
              className="rounded-2xl border overflow-hidden shrink-0 flex flex-col"
              style={{ width: "30%", minWidth: 260, background: c.card, borderColor: c.border }}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0" style={{ borderColor: c.border }}>
                <MessageSquare size={15} style={{ color: c.blue }} />
                <h2 className="font-bold text-sm" style={{ color: c.txt }}>{t('messages_title') || "Messages"}</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <ConversationList
                  open={true}
                  onClose={() => {}}
                  onSelectConv={(conv) => setActiveChatConv(conv)}
                  isPatient={false}
                  onUnreadChange={(n) => setUnreadChatCount(n)}
                  c={c}
                  dk={dk}
                  inline={true}
                />
              </div>
            </div>
            {/* ChatWindow — 70% */}
            <div className="flex-1 min-w-0">
              {activeChatConv ? (
                <ChatWindow
                  conv={activeChatConv}
                  onClose={() => setActiveChatConv(null)}
                  onBack={null}
                  c={c}
                  dk={dk}
                  embedded={true}
                />
              ) : (
                <div
                  className="h-full rounded-2xl border flex flex-col items-center justify-center gap-4"
                  style={{ background: c.card, borderColor: c.border }}
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.blueLight }}>
                    <MessageSquare size={28} style={{ color: c.blue }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: c.txt3 }}>
                    {t('select_conversation') || "Sélectionnez une conversation"}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default: return <HomeView onChangePage={setPage} dk={dk} c={c} />;
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: c.bg,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: c.txt,
        transition: "background 0.3s, color 0.2s",
      }}
    >
      <ParticlesHero darkMode={dk} />
      <div className="relative z-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { transition: background-color 0.2s, border-color 0.2s; }
        button { cursor: pointer !important; }
        label { cursor: pointer !important; }
        a { cursor: pointer !important; }
        .nav-link:not(.active-nav):hover { background: rgba(100,146,201,0.15) !important; color: #6492C9 !important; }
      `}</style>

      {/* ═══ NAVBAR (copie exacte du Patient Dashboard) ═══ */}
      <nav
        className="sticky top-0 z-30 border-b shadow-sm"
        style={{ background: c.nav, borderColor: c.border }}
      >
        <div className="w-full px-6 h-[60px] flex items-center gap-3">
          {/* Logo Healy */}
          <div className="flex items-center shrink-0 mr-2">
            <img src="/healy-logo.svg" alt="Healy" className="h-9 w-auto" />
          </div>

          {/* Liens Nav centrés */}
          <div
            className="hidden lg:flex items-center justify-center gap-1 flex-1 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`nav-link${page === item.id ? " active-nav" : ""} relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all`}
                style={{
                  color: page === item.id ? "#fff" : c.txt2,
                  background: page === item.id ? c.blue : "transparent",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Droite — profil + menu mobile */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            {/* Bouton Messages Icon */}
            <button
              onClick={() => setPage("messages")}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-blue-50 dark:hover:bg-white/5 border"
              style={{ 
                borderColor: page === "messages" ? c.blue + "44" : c.border, 
                background: page === "messages" ? c.blue + "11" : "transparent" 
              }}
              title={t('messages') || "Messages"}
            >
              <MessageSquare size={18} style={{ color: page === "messages" ? c.blue : c.txt2 }} />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: c.red, fontSize: 9 }}>
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </span>
              )}
            </button>
            <div className="relative">
              {/* Point rouge notifications */}
              {unreadCount > 0 && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 z-10 flex items-center justify-center"
                  style={{ background: c.red, borderColor: c.nav, fontSize: 7, color: "#fff", fontWeight: 800, pointerEvents: "none" }}
                >
                  {unreadCount}
                </div>
              )}
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:opacity-80"
                style={{ border: `1px solid ${c.border}`, background: "transparent" }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, #304B71, #6492C9)" }}
                >
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold leading-tight" style={{ color: c.txt }}>{fullName}</p>

                </div>
                <ChevronDown size={13} style={{ color: c.txt3 }} />
              </button>

              {/* Dropdown profil — animation slide-down */}
              {profileOpen && (
                <div
                  className="absolute right-0 top-12 w-60 rounded-[20px] overflow-hidden z-50"
                  style={{
                    background: dk ? c.card : "#ffffff",
                    border: `1px solid ${dk ? c.border : "#F1F5F9"}`,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                    animation: "dropdownIn 0.2s ease forwards",
                  }}
                >
                  <style>{`
                    @keyframes dropdownIn {
                      from { opacity:0; transform:translateY(-8px) scale(0.97); }
                      to   { opacity:1; transform:translateY(0) scale(1); }
                    }
                    .pd-item { color: #64748B; background: transparent; transition: background 0.15s, color 0.15s; }
                    .pd-item:hover { background: #F8FAFC; color: #1E293B; }
                    .pd-item-danger { color: #EF4444; background: transparent; transition: background 0.15s; }
                    .pd-item-danger:hover { background: rgba(239,68,68,0.08); }
                  `}</style>

                  {/* En-tête utilisateur */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: dk ? c.border : "#F1F5F9" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg, #304B71, #6492C9)" }}
                      >
                        {userInitials}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: c.txt }}>{fullName}</p>
                        <p className="text-xs" style={{ color: c.txt3 }}>Garde-Malade</p>
                        {tarifMensuel && (
                          <p className="text-xs font-bold mt-0.5" style={{ color: c.green }}>
                            Tarif mensuel : {Number(tarifMensuel).toLocaleString("fr-DZ")} DA
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-1 group">
                    {/* Notifications */}
                    <button
                      onClick={() => { setPage("notifications"); setProfileOpen(false); }}
                      className="pd-item w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl cursor-pointer"
                    >
                      <Bell size={16} className="hover:rotate-45 transition-transform" />
                      {t('notifications_label') || "Notifications"}
                      {unreadCount > 0 && (
                        <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: c.red, color: "#fff" }}>{unreadCount}</span>
                      )}
                    </button>

                    {/* Paramètres */}
                    <button
                      onClick={() => { setPage("settings"); setProfileOpen(false); }}
                      className="pd-item w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl cursor-pointer"
                    >
                      <Settings size={16} className="hover:rotate-45 transition-transform" />
                      Paramètres
                    </button>

                    {/* Toggle jour/nuit */}
                    <div className="pd-item w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl">
                      <Sun size={14} style={{ color: dk ? c.txt3 : "#E8A838" }} />
                      <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Basculer le thème"
                        className="relative rounded-full transition-all duration-300 cursor-pointer"
                        style={{
                          width: 42,
                          height: 24,
                          background: dk ? "linear-gradient(135deg, #304B71, #4A6FA5)" : "#D5DEEF",
                          border: `1.5px solid ${dk ? c.blue + "80" : "#BBC8DC"}`,
                          padding: 0,
                        }}
                      >
                        <div
                          className="absolute top-0.5 rounded-full bg-white shadow-md transition-all duration-300"
                          style={{ width: 18, height: 18, left: dk ? 20 : 2 }}
                        />
                      </button>
                      <Moon size={13} style={{ color: dk ? c.blue : c.txt3 }} />
                    </div>

                    {/* Séparateur */}
                    <div className="h-px my-1 mx-2" style={{ background: dk ? c.border : "#F1F5F9" }} />

                    {/* Déconnexion */}
                    <button
                      onClick={onLogout}
                      className="pd-item-danger w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl cursor-pointer"
                    >
                      <LogOut size={16} className="hover:translate-x-1 transition-transform" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Menu mobile */}
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: c.txt2 }}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu size={17} />
            </button>
          </div>
        </div>

        {/* Nav mobile */}
        {mobileMenu && (
          <div
            className="lg:hidden border-t px-4 py-3 flex flex-wrap gap-2"
            style={{ borderColor: c.border, background: c.nav }}
          >
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setMobileMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: page === item.id ? "#fff" : c.txt2,
                  background: page === item.id ? c.blue : "transparent",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Contenu */}
      <main className={`w-full ${page === "ai-diagnosis" ? "px-0 py-0" : "px-6 py-6"}`}><ErrorBoundary>{renderPage()}</ErrorBoundary></main>

      {profileOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
      )}
    </div>
    </div>
  );
}
