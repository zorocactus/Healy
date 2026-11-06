import { useState, useEffect, useRef } from "react";
import { X, Plus, Search, MessageSquare, Loader, MessageSquareOff } from "lucide-react";
import * as api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function avatarColor(role) {
  if (role === "pharmacist") return "#2D8C6F";
  if (role === "doctor")     return "#4A6FA5";
  if (role === "patient")    return "#E8A838";
  return "#7B5EA7";
}
function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function roleLabel(role) {
  if (role === "pharmacist") return "Pharmacien";
  if (role === "doctor")     return "Médecin";
  if (role === "patient")    return "Patient";
  return "Garde-malade";
}
function fmtTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Normalise une conversation backend → format attendu par le composant
function normalizeConversation(conv) {
  // Déjà au format frontend
  if (conv.name) return conv;
  const other = conv.other_participant || {};
  return {
    id: conv.id,
    name: other.full_name || "Inconnu",
    role: other.role || "patient",
    lastMessage: conv.last_message?.content || "",
    unread: conv.unread_count || 0,
    timestamp: fmtTimestamp(conv.last_message?.created_at || conv.updated_at),
    isNew: (conv.unread_count || 0) > 0,
    _raw: conv,
  };
}

// ─── Modal "Nouvelle conversation" (PATIENT) ──────────────────────────────────
function PatientNewConvModal({ onClose, onSelect, c }) {
  const [search, setSearch]           = useState("");
  const [interlocutors, setInterlocutors] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [pharmacies, careRequests] = await Promise.all([
          api.getPharmacies().catch(() => []),
          api.getCareRequests().catch(() => []),
        ]);
        if (cancelled) return;

        const pharmArray = Array.isArray(pharmacies) ? pharmacies : (pharmacies?.results || []);
        const pharmList = pharmArray
          .filter(p => p.pharmacist_user_id)
          .map(p => ({
            id: p.pharmacist_user_id,
            name: p.pharmacist_name || p.name,
            subtitle: p.name + (p.pharm_city ? ` · ${p.pharm_city}` : ""),
            role: "pharmacist",
          }));

        const careArray = Array.isArray(careRequests) ? careRequests : (careRequests?.results || []);
        const careList = careArray
          .filter(r => r.status === "accepted" && r.caretaker_user_id)
          .map(r => ({
            id: r.caretaker_user_id,
            name: r.caretaker_name || "Garde-malade",
            subtitle: "Garde-malade assigné",
            role: "caretaker",
          }));

        setInterlocutors([...pharmList, ...careList]);
      } catch {
        // silencieux
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Recherche de médecins en temps réel
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const doctorTimerRef = useRef(null);

  useEffect(() => {
    clearTimeout(doctorTimerRef.current);
    if (doctorSearch.length < 2) { setDoctors([]); return; }
    setDoctorsLoading(true);
    doctorTimerRef.current = setTimeout(async () => {
      try {
        const data = await api.getDoctors({ nom: doctorSearch });
        const list = Array.isArray(data) ? data : (data?.results || []);
        setDoctors(list.filter(d => d.user_id).map(d => ({
          id: d.user_id,
          name: d.full_name || `${d.first_name || ""} ${d.last_name || ""}`.trim(),
          subtitle: d.specialty_display || d.specialty || "Médecin" + (d.est_city ? ` · ${d.est_city}` : ""),
          role: "doctor",
          messages_disabled: !!d.messages_disabled,
        })));
      } catch { setDoctors([]); }
      finally { setDoctorsLoading(false); }
    }, 350);
    return () => clearTimeout(doctorTimerRef.current);
  }, [doctorSearch]);

  const filtered = interlocutors.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.subtitle || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden"
        style={{ background: c.card, borderColor: c.border,
          animation: "modalIn 0.2s ease forwards" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: c.border }}>
          <h3 className="font-bold text-sm" style={{ color: c.txt }}>
            Nouvelle conversation
          </h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center border hover:opacity-70 transition-opacity"
            style={{ borderColor: c.border, color: c.txt3 }}>
            <X size={13} />
          </button>
        </div>

        {/* Section Médecins */}
        <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: c.border }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: c.txt3 }}>
            Rechercher un médecin
          </p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-2"
            style={{ borderColor: c.border, background: c.blueLight }}>
            <Search size={13} style={{ color: c.txt3 }} />
            <input
              autoFocus
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              placeholder="Nom du médecin..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: c.txt }}
            />
            {doctorsLoading && <Loader size={12} className="animate-spin shrink-0" style={{ color: c.txt3 }} />}
          </div>
          {doctors.length > 0 && (
            <div className="max-h-36 overflow-y-auto">
              {doctors.map((p) => (
                <button key={p.id}
                  onClick={() => !p.messages_disabled && onSelect(p)}
                  disabled={p.messages_disabled}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left"
                  style={{ opacity: p.messages_disabled ? 0.6 : 1, cursor: p.messages_disabled ? "not-allowed" : "pointer" }}
                  onMouseEnter={(e) => { if (!p.messages_disabled) e.currentTarget.style.background = c.blueLight; }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: avatarColor("doctor") }}>
                    {initials(p.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: c.txt }}>{p.name}</p>
                    {p.messages_disabled
                      ? <p className="text-[10px] font-bold" style={{ color: "#E05555" }}>Messages désactivés</p>
                      : <p className="text-xs truncate" style={{ color: c.txt3 }}>{p.subtitle}</p>
                    }
                  </div>
                </button>
              ))}
            </div>
          )}
          {doctorSearch.length >= 2 && !doctorsLoading && doctors.length === 0 && (
            <p className="text-xs py-1 px-3" style={{ color: c.txt3 }}>Aucun médecin trouvé</p>
          )}
        </div>

        {/* Section pharmaciens / gardes-malades */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: c.txt3 }}>
            Pharmacien · Garde-malade
          </p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-2"
            style={{ borderColor: c.border, background: c.blueLight }}>
            <Search size={13} style={{ color: c.txt3 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: c.txt }}
            />
          </div>
        </div>

        <div className="px-2 pb-3 max-h-48 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4 gap-2"
              style={{ color: c.txt3 }}>
              <Loader size={16} className="animate-spin" />
              <span className="text-xs">Chargement...</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs py-3" style={{ color: c.txt3 }}>
              Aucun résultat
            </p>
          ) : (
            filtered.map((p) => (
              <button key={p.id}
                onClick={() => !p.messages_disabled && onSelect(p)}
                disabled={p.messages_disabled}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                style={{ opacity: p.messages_disabled ? 0.6 : 1, cursor: p.messages_disabled ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!p.messages_disabled) e.currentTarget.style.background = c.blueLight; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor(p.role) }}>
                  {initials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: c.txt }}>
                    {p.name}
                  </p>
                  {p.messages_disabled
                    ? <p className="text-[10px] font-bold" style={{ color: "#E05555" }}>Messages désactivés</p>
                    : <p className="text-xs truncate" style={{ color: c.txt3 }}>{p.subtitle || roleLabel(p.role)}</p>
                  }
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal "Nouvelle conversation" (MÉDECIN) ──────────────────────────────────
function DoctorNewConvModal({ onClose, onSelect, c }) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getDoctorPatients();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data?.results || []);
        setPatients(list.filter(p => p.user_id).map(p => ({
          id: p.user_id,
          name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient",
          subtitle: p.city || p.wilaya || "Patient",
          role: "patient",
          messages_disabled: !!p.messages_disabled,
        })));
      } catch { /* silencieux */ }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden"
        style={{ background: c.card, borderColor: c.border,
          animation: "modalIn 0.2s ease forwards" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: c.border }}>
          <h3 className="font-bold text-sm" style={{ color: c.txt }}>
            Message à un patient
          </h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center border hover:opacity-70 transition-opacity"
            style={{ borderColor: c.border, color: c.txt3 }}>
            <X size={13} />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ borderColor: c.border, background: c.blueLight }}>
            <Search size={13} style={{ color: c.txt3 }} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un patient..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: c.txt }}
            />
          </div>
        </div>

        <div className="px-2 pb-3 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2"
              style={{ color: c.txt3 }}>
              <Loader size={16} className="animate-spin" />
              <span className="text-xs">Chargement...</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs py-4" style={{ color: c.txt3 }}>
              {patients.length === 0
                ? "Aucun patient lié à votre compte"
                : "Aucun résultat"}
            </p>
          ) : (
            filtered.map((p) => (
              <button key={p.id}
                onClick={() => !p.messages_disabled && onSelect(p)}
                disabled={p.messages_disabled}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                style={{ opacity: p.messages_disabled ? 0.6 : 1, cursor: p.messages_disabled ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!p.messages_disabled) e.currentTarget.style.background = c.blueLight; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor("patient") }}>
                  {initials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: c.txt }}>
                    {p.name}
                  </p>
                  {p.messages_disabled
                    ? <p className="text-[10px] font-bold" style={{ color: "#E05555" }}>Messages désactivés</p>
                    : <p className="text-xs truncate" style={{ color: c.txt3 }}>{p.subtitle}</p>
                  }
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ConvItem ─────────────────────────────────────────────────────────────────
function ConvItem({ conv, onSelect, c }) {
  return (
    <>
      <button
        onClick={() => onSelect(conv)}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all mb-0.5 relative group"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = c.blueLight)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {/* Avatar + indicateur isNew */}
        <div className="relative shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{
              background: avatarColor(conv.role),
              animation: conv.isNew ? "pulseRing 2s ease-in-out 3" : "none",
            }}>
            {initials(conv.name)}
          </div>
          {conv.isNew && (
            <div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2"
              style={{ background: c.green, borderColor: c.card }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <p className="text-sm truncate"
              style={{ color: c.txt, fontWeight: conv.unread ? 700 : 500 }}>
              {conv.name}
            </p>
            <span className="text-[10px] shrink-0" style={{ color: c.txt3 }}>
              {conv.timestamp}
            </span>
          </div>
          <p className="text-xs truncate"
            style={{ color: conv.unread ? c.txt2 : c.txt3, fontWeight: conv.unread ? 600 : 400 }}>
            {conv.lastMessage || "Démarrez la conversation…"}
          </p>
        </div>

        {conv.unread > 0 && (
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{ background: c.blue, fontSize: 9 }}>
            {conv.unread}
          </span>
        )}
      </button>

    </>
  );
}

// ─── ConversationList ─────────────────────────────────────────────────────────
export default function ConversationList({
  open,
  onClose,
  onSelectConv,
  isPatient = false,
  isDoctor = false,
  onUnreadChange,
  refreshTrigger,
  c,
  dk,
  inline = false,
  // Support pour ouvrir directement une conversation (ex: depuis un profil médecin)
  initialConv = null,
}) {
  const { userData } = useAuth();
  const selfDisabled = !!userData?.messages_disabled;

  const [conversations, setConversations] = useState([]);
  const [convsLoaded, setConvsLoaded]     = useState(false);
  const [showNewModal, setShowNewModal]   = useState(false);
  const [search, setSearch]               = useState("");
  const [convError, setConvError]         = useState(null);
  const intervalRef = useRef(null);
  const pendingInitialConv = useRef(null);

  // Ouvrir une conv directement si passée en prop (ex: depuis bouton "Envoyer un message")
  // initialConv doit inclure { ts, id, name, role } — ts change à chaque déclenchement
  // pour que l'effet se relance même si l'interlocuteur est le même.
  useEffect(() => {
    if (!initialConv) return;
    if (convsLoaded) {
      handleNewConv(initialConv);
    } else {
      pendingInitialConv.current = initialConv;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConv?.ts]);

  useEffect(() => {
    if (convsLoaded && pendingInitialConv.current) {
      handleNewConv(pendingInitialConv.current);
      pendingInitialConv.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convsLoaded]);

  // ── Polling 10s ──
  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setConversations(list.map(normalizeConversation));
    } catch { /* silencieux */ }
    finally { setConvsLoaded(true); }
  };

  useEffect(() => {
    if (!inline && !open) return;
    fetchConversations();
    intervalRef.current = setInterval(fetchConversations, 10_000);
    return () => clearInterval(intervalRef.current);
  }, [open, inline]);

  // Re-fetch immédiatement quand un nouveau message est reçu
  useEffect(() => {
    if (refreshTrigger) fetchConversations();
  }, [refreshTrigger]);

  // Remonte le total non-lus
  useEffect(() => {
    const total = conversations.reduce((acc, cv) => acc + (cv.unread || 0), 0);
    onUnreadChange?.(total);
  }, [conversations]);

  const filtered = conversations.filter((cv) =>
    cv.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Actions ──
  const handleSelect = async (conv) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0, isNew: false } : c))
    );
    onSelectConv(conv);
    try { await api.markConversationRead(conv.id); } catch { /* silencieux */ }
  };

  const handleNewConv = async (interlocutor) => {
    if (selfDisabled) return;
    setShowNewModal(false);
    setConvError(null);

    // Si une conv existe déjà avec cet utilisateur, on l'ouvre directement
    const existing = conversations.find(
      (cv) => cv._raw?.other_participant?.id === interlocutor.id
    );
    if (existing) {
      handleSelect(existing);
      return;
    }

    const fallback = {
      id: `tmp-${Date.now()}`,
      name: interlocutor.name,
      role: interlocutor.role,
      lastMessage: "",
      unread: 0,
      timestamp: "maintenant",
      isNew: true,
    };
    try {
      const raw = await api.createConversation(interlocutor.id);
      const newConv = raw ? normalizeConversation({ ...raw, other_participant: { id: interlocutor.id, full_name: interlocutor.name, role: interlocutor.role } }) : fallback;
      setConversations((prev) => {
        if (prev.find((c) => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
      onSelectConv(newConv);
    } catch (err) {
      if (err?.message === "MESSAGES_DISABLED") {
        setConvError(`${interlocutor.name} a désactivé les messages.`);
        return;
      }
      setConversations((prev) => [fallback, ...prev]);
      onSelectConv(fallback);
    }
  };

  // ── Empty state ──
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 py-8 px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: c.blueLight }}>
        <MessageSquare size={28} style={{ color: c.blue }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold mb-1" style={{ color: c.txt }}>
          Aucune conversation
        </p>
        <p className="text-xs" style={{ color: c.txt3 }}>
          {isPatient
            ? "Contactez votre médecin, pharmacien ou garde-malade"
            : isDoctor
            ? "Vos patients vous contacteront ici"
            : "Vos patients vous contacteront ici"}
        </p>
      </div>
      {(isPatient || isDoctor) && (
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: c.blue }}>
          <Plus size={14} />
          Démarrer une conversation
        </button>
      )}
    </div>
  );

  // ── Écran "messages désactivés par soi-même" ──
  const disabledScreen = (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 py-10 px-5 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#E0555512" }}>
        <MessageSquareOff size={28} style={{ color: "#E05555" }} />
      </div>
      <div>
        <p className="text-sm font-bold mb-1" style={{ color: c.txt }}>Messages désactivés</p>
        <p className="text-xs" style={{ color: c.txt3 }}>
          Vous avez désactivé les messages. Rendez-vous dans vos paramètres pour les réactiver.
        </p>
      </div>
    </div>
  );

  // ── Corps partagé (search + liste) ──
  const bodyContent = (
    <>
      <style>{`
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(74,111,165,0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(74,111,165,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,111,165,0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Erreur messages désactivés */}
      {convError && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
          style={{ background: "#E0555512", color: "#E05555", border: "1px solid #E0555544" }}>
          <span>⊘</span>
          <span className="flex-1">{convError}</span>
          <button onClick={() => setConvError(null)} className="hover:opacity-70 shrink-0">✕</button>
        </div>
      )}

      {/* Search + Nouvelle conv */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-2"
          style={{ borderColor: c.border, background: c.blueLight }}>
          <Search size={13} style={{ color: c.txt3 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: c.txt }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="hover:opacity-70 transition-opacity"
              style={{ color: c.txt3 }}>
              <X size={12} />
            </button>
          )}
        </div>
        {(isPatient || isDoctor) && (
          <button
            onClick={() => setShowNewModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: c.blue }}>
            <Plus size={14} />
            Nouvelle conversation
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 flex flex-col"
        style={{ scrollbarWidth: "thin" }}>
        {filtered.length === 0 && !search
          ? <EmptyState />
          : filtered.length === 0 && search
          ? (
            <div className="flex flex-col items-center justify-center h-24 gap-1">
              <p className="text-sm" style={{ color: c.txt3 }}>Aucun résultat</p>
            </div>
          )
          : filtered.map((conv) => (
            <ConvItem
              key={conv.id}
              conv={conv}
              onSelect={handleSelect}
              c={c}
            />
          ))
        }
      </div>

      {showNewModal && isPatient && (
        <PatientNewConvModal
          onClose={() => setShowNewModal(false)}
          onSelect={handleNewConv}
          c={c}
        />
      )}
      {showNewModal && isDoctor && (
        <DoctorNewConvModal
          onClose={() => setShowNewModal(false)}
          onSelect={handleNewConv}
          c={c}
        />
      )}
    </>
  );

  // ── Mode inline (page dédiée) ──
  if (inline) {
    return (
      <div className="flex flex-col h-full">
        {selfDisabled ? disabledScreen : bodyContent}
      </div>
    );
  }

  // ── Mode overlay (panel latéral) ──
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}
        style={{ background: "rgba(0,0,0,0.3)" }} />

      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col shadow-2xl border-l"
        style={{
          width: "min(360px, 92vw)",
          background: c.card, borderColor: c.border,
          animation: "slideInFromRight 0.25s ease forwards",
        }}
      >
        <style>{`
          @keyframes slideInFromRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header panel */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: c.border }}>
          <div className="flex items-center gap-2">
            <MessageSquare size={16} style={{ color: c.blue }} />
            <h2 className="font-bold text-sm" style={{ color: c.txt }}>Messages</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center border hover:opacity-70 transition-opacity"
            style={{ borderColor: c.border, color: c.txt3 }}>
            <X size={15} />
          </button>
        </div>

        {selfDisabled ? disabledScreen : bodyContent}
      </div>
    </>
  );
}
