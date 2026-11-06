import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import ErrorBoundary from "../../components/ErrorBoundary";
import DashSelect from "../../components/ui/DashSelect";
import { ParticlesHero } from '../../components/backgrounds/MedParticles';
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../services/api";
import {
  Search, Bell, Settings, LogOut, Menu, ChevronDown, Sun, Moon,
  Package, Pill, ShoppingCart, FileText, AlertTriangle, Check,
  X, Plus, Minus, QrCode, TrendingUp, TrendingDown, AlertCircle,
  Clock, CheckCircle, Eye, Download, Filter, RefreshCw, Truck,
  BarChart2, Users, DollarSign, Archive, User, ChevronRight,
  Zap, Shield, Activity, Send, Phone, MapPin, Link2, MessageSquare, Languages, Edit2, Trash2
} from "lucide-react";
import ChatButton from "../../components/chat/ChatButton";
import ConversationList from "../../components/chat/ConversationList";
import ChatWindow from "../../components/chat/ChatWindow";
import { useLanguage } from "../../context/LanguageContext";
import { Html5Qrcode } from "html5-qrcode";
import { T } from "../_shared/theme";
import ContactAdminCard from "../../components/ContactAdminCard";

// ─── Données de démonstration ─────────────────────────────────────────────────
// Activées uniquement en développement — jamais visibles en production.
const STOCK = [];

const ORDERS = [];

const ALERTS = [];
const NOTIFICATIONS = [];

const AVATAR_COLORS = [
  ["#304B71", "#6492C9"],
  ["#0F6E56", "#4CAF82"],
  ["#7B3F00", "#C97B3F"],
  ["#6B2D8B", "#A46DB5"],
  ["#A32D2D", "#E24B4A"],
];

const STATUS_META = {
  new:        { label: "new_status",   color: "#4A6FA5", bg: "#4A6FA518" },
  processing: { label: "processing_status",  color: "#E8A838", bg: "#E8A83818" },
  ready:      { label: "ready_status",       color: "#2D8C6F", bg: "#2D8C6F18" },
  delivered:  { label: "delivered_status",   color: "#9AACBE", bg: "#9AACBE18" },
  cancelled:  { label: "cancelled_status",     color: "#E05555", bg: "#E0555518" },
};

const WILAYAS_LIST = [
  "Alger","Oran","Constantine","Annaba","Blida","Batna","Sétif","Tlemcen",
  "Tizi Ouzou","Béjaïa","Jijel","Médéa","Mostaganem","Bouira","Bordj Bou Arréridj",
  "Boumerdès","Tipaza","Aïn Defla","Tissemsilt","Relizane","Chlef","Skikda",
  "Guelma","Souk Ahras","El Tarf","Mila","Khenchela","Oum El Bouaghi","Tébessa",
  "Biskra","Djelfa","Laghouat","El Bayadh","Naâma","Saïda","Mascara","Tiaret",
  "Adrar","Béchar","Tamanrasset","Illizi","Tindouf","El Oued","Ouargla",
  "Ghardaïa","Aïn Témouchent","Sidi Bel Abbès","Autres",
];

const STOCK_CATEGORIES = [
  "cardiology_label", "diabetology_label", "antibiotics_label", "analgesics_label",
  "gastro_label", "vitamins_label", "neurology_label", "dermatology_label", "pediatrics_label", "others_label",
];

const CATEGORY_DISPLAY = {
  cardiology_label:  "Cardiologie",
  diabetology_label: "Diabétologie",
  antibiotics_label: "Antibiotiques",
  analgesics_label:  "Analgésiques",
  gastro_label:      "Gastro-entérologie",
  vitamins_label:    "Vitamines",
  neurology_label:   "Neurologie",
  dermatology_label: "Dermatologie",
  pediatrics_label:  "Pédiatrie",
  others_label:      "Autres",
};

// ─── Reusable components ──────────────────────────────────────────────────────
function Card({ children, className = "", style = {}, dk, empty = false }) {
  const c = dk ? T.dark : T.light;
  const hoverClasses = empty ? "" : "card-hover";
  return (
    <div className={`rounded-2xl p-5 shadow-sm border ${hoverClasses} ${className}`}
      style={{ background: c.card, borderColor: c.border, ...style }}>
      {children}
    </div>
  );
}

function Badge({ color, bg, children }) {
  return (
    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
      style={{ color, background: bg, borderColor: color + "44" }}>
      {children}
    </span>
  );
}


function StatCard({ label, value, sub, icon: Icon, color, trend, dk }) {
  const c = dk ? T.dark : T.light;
  return (
    <Card dk={dk} style={{ padding: 18 }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: color + "18" }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs font-bold"
            style={{ color: trend >= 0 ? "#2D8C6F" : "#E05555" }}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: c.txt }}>{value}</p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: c.txt2 }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: c.txt3 }}>{sub}</p>}
    </Card>
  );
}

function KpiCard({ label, value, sub, subColor, dk }) {
  const c = dk ? T.dark : T.light;
  return (
    <Card dk={dk} style={{ padding: 18 }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#A0B5CD" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: c.txt }}>{value}</p>
      {sub && <p className="text-xs font-semibold mt-1" style={{ color: subColor || c.txt2 }}>{sub}</p>}
    </Card>
  );
}

// ─── QR SCAN MODAL ────────────────────────────────────────────────────────────
const QR_SCANNER_ID = "healy-qr-scanner";

function QrModal({ onClose, dk, onScan, initialToken }) {
  const { t } = useLanguage();
  const c = dk ? T.dark : T.light;
  const [mode, setMode] = useState(initialToken ? "manual" : "camera");
  const [scanned, setScanned] = useState(false);
  const [token, setToken] = useState(initialToken || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [camError, setCamError] = useState("");
  const [camReady, setCamReady] = useState(false);
  const scannerRef = useRef(null);
  const processedRef = useRef(false);

  const processToken = async (rawToken) => {
    const key = `qr_processed_${rawToken}`;
    if (processedRef.current || sessionStorage.getItem(key)) return;
    processedRef.current = true;
    sessionStorage.setItem(key, '1');
    setError("");
    setLoading(true);
    try {
      const result = await api.scanPrescriptionQr(rawToken.trim());
      setScanned(true);
      setTimeout(() => { onScan?.(result); onClose(); }, 900);
    } catch (err) {
      setError(err?.message || "QR invalide ou expiré.");
      processedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Auto-process token from URL param (native camera opened the link)
  useEffect(() => {
    if (initialToken) {
      processToken(initialToken);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== "camera" || scanned) return;
    setCamReady(false);
    processedRef.current = false;

    let scanner = null;
    let active = true;

    const startScanner = async () => {
      try {
        // Nettoie le div avant d'initialiser
        const el = document.getElementById(QR_SCANNER_ID);
        if (el) el.innerHTML = "";

        scanner = new Html5Qrcode(QR_SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;

        const constraints = { facingMode: { ideal: "environment" } };
        await scanner.start(
          constraints,
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
          (decodedText) => {
            if (!active) return;
            active = false;
            try { scanner.stop(); } catch {}
            let tok = decodedText;
            try {
              const url = new URL(decodedText);
              tok = url.searchParams.get('token') || decodedText;
            } catch {}
            processToken(tok);
          },
          () => {}
        );
        if (active) setCamReady(true);
      } catch (err) {
        if (!active) return;
        const msg = String(err).toLowerCase();
        if (msg.includes("permission") || msg.includes("denied") || msg.includes("notallowed")) {
          setCamError("Accès caméra refusé. Autorisez la caméra dans votre navigateur ou utilisez la saisie manuelle.");
        } else if (msg.includes("https") || msg.includes("secure") || msg.includes("insecure")) {
          setCamError("La caméra nécessite HTTPS. Utilisez la saisie manuelle.");
        } else {
          setCamError("Caméra indisponible. Utilisez la saisie manuelle.");
        }
        console.warn("QR cam error:", err);
      }
    };

    // Délai court pour que le DOM soit prêt
    const timer = setTimeout(startScanner, 100);

    return () => {
      active = false;
      clearTimeout(timer);
      if (scanner) {
        try { scanner.stop(); } catch {}
        const el = document.getElementById(QR_SCANNER_ID);
        if (el) el.innerHTML = "";
      }
    };
  }, [mode, scanned]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="rounded-2xl w-full max-w-sm shadow-2xl border"
        style={{ background: c.card, borderColor: c.border }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-lg font-bold" style={{ color: c.txt }}>Scanner une ordonnance</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:opacity-70"
            style={{ borderColor: c.border, color: c.txt3 }}>
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mx-6 mb-4" style={{ borderColor: c.border }}>
          {[["camera", "Caméra"], ["manual", "Saisie manuelle"]].map(([id, label]) => (
            <button key={id} onClick={() => { setMode(id); setError(""); setCamError(""); setCamReady(false); }}
              className="flex-1 py-2 text-sm font-semibold transition-all"
              style={{ color: mode === id ? c.blue : c.txt3, borderBottom: mode === id ? `2px solid ${c.blue}` : "2px solid transparent", marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6">
          {/* Zone caméra */}
          {mode === "camera" && (
            <div className="mb-4">
              {camError ? (
                <div className="rounded-2xl flex flex-col items-center justify-center gap-3 py-8"
                  style={{ background: dk ? "#1A2333" : "#F8FAFC", border: `1px solid ${c.border}` }}>
                  <QrCode size={36} style={{ color: c.txt3 }} />
                  <p className="text-xs text-center font-medium px-4" style={{ color: c.txt3 }}>{camError}</p>
                  <button onClick={() => setMode("manual")}
                    className="text-xs font-semibold px-4 py-1.5 rounded-lg"
                    style={{ background: c.blue, color: "#fff" }}>
                    Saisir manuellement
                  </button>
                </div>
              ) : scanned ? (
                <div className="rounded-2xl flex items-center justify-center py-10"
                  style={{ background: "rgba(45,140,111,0.12)", border: "1px solid #2D8C6F44" }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#2D8C6F" }}>
                    <Check size={28} className="text-white" strokeWidth={3} />
                  </div>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  {/* Spinner pendant init caméra */}
                  {!camReady && (
                    <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#000", borderRadius: 16, minHeight: 280 }}>
                      <span style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#6492C9", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "block", marginBottom: 10 }} />
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Activation caméra…</span>
                    </div>
                  )}
                  {/* Le scanner injecte la vidéo ici — PAS de overflow:hidden, hauteur automatique */}
                  <div
                    id={QR_SCANNER_ID}
                    style={{ width: "100%", minHeight: 280, borderRadius: 16, overflow: "hidden", background: "#000" }}
                  />
                </div>
              )}
              {!camError && !scanned && (
                <p className="text-xs text-center mt-2" style={{ color: c.txt3 }}>
                  Pointez la caméra arrière vers le QR code de l'ordonnance
                </p>
              )}
            </div>
          )}

          {/* Saisie manuelle */}
          {mode === "manual" && (
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt2 }}>
                Token QR
              </label>
              {scanned ? (
                <div className="rounded-2xl flex items-center justify-center py-8"
                  style={{ background: "rgba(45,140,111,0.12)", border: "1px solid #2D8C6F44" }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "#2D8C6F" }}>
                    <Check size={28} className="text-white" strokeWidth={3} />
                  </div>
                </div>
              ) : (
                <textarea
                  rows={3}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), processToken(token))}
                  placeholder="Collez le contenu du QR code ici…"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border resize-none"
                  style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt }}
                />
              )}
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold mb-4 px-3 py-2 rounded-lg border"
              style={{ color: "#E05555", background: "#E0555518", borderColor: "#E0555544" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            {mode === "manual" && !scanned && (
              <button type="button" onClick={() => processToken(token)}
                disabled={loading || !token.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: c.blue }}>
                {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {loading ? "Validation…" : "Valider"}
              </button>
            )}
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: c.border, color: c.txt2 }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL: DÉTAILS COMMANDE ──────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, dk }) {
  const { t } = useLanguage();
  const c = dk ? T.dark : T.light;
  const st = STATUS_META[order.status] || STATUS_META.new;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border"
        style={{ background: c.card, borderColor: c.border }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: c.txt }}>{t('order_details_title') || "Détails de la commande"}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:opacity-70"
            style={{ borderColor: c.border, color: c.txt3 }}>
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          {/* ID + Statut */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: dk ? "#1A2333" : "#F8FAFC" }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: c.txt3 }}>{t('reference_label') || "Référence"}</p>
              <p className="font-bold text-sm" style={{ color: c.txt }}>{order.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {order.cnas && <Badge color={c.blue} bg={c.blueLight}>CNAS</Badge>}
              <Badge color={st.color} bg={st.bg}>{t(st.label) || st.label}</Badge>
            </div>
          </div>

          {/* Patient & Médecin */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: dk ? "#1A2333" : "#F8FAFC" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: c.txt3 }}>{t('patient_label') || "Patient"}</p>
              <p className="text-sm font-semibold" style={{ color: c.txt }}>{order.patient}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: dk ? "#1A2333" : "#F8FAFC" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: c.txt3 }}>{t('doctor_label') || "Médecin"}</p>
              <p className="text-sm font-semibold" style={{ color: c.txt }}>{order.doctor}</p>
            </div>
          </div>

          {/* Médicaments */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt3 }}>{t('prescribed_meds_label') || "Médicaments prescrits"}</p>
            <div className="space-y-2">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: dk ? "#1A2333" : "#F8FAFC" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: c.blueLight }}>
                    <Pill size={13} style={{ color: c.blue }} />
                  </div>
                  <p className="text-sm" style={{ color: c.txt }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-xl border-2"
            style={{ background: c.blueLight, borderColor: c.blue + "33" }}>
            <p className="font-bold" style={{ color: c.txt }}>{t('total_to_pay_label') || "Total à payer"}</p>
            <p className="text-xl font-bold" style={{ color: c.blue }}>
              {(order.total ?? 0).toLocaleString()} DZD
            </p>
          </div>
        </div>

        <button onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
          style={{ borderColor: c.border, color: c.txt2 }}>
          {t('close_btn') || "Fermer"}
        </button>
      </div>
    </div>
  );
}

// ─── MODAL: REFUS D'ORDONNANCE ───────────────────────────────────────────────
function RefuseOrderModal({ order, onClose, onConfirm, loading, dk }) {
  const c = dk ? T.dark : T.light;
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border"
        style={{ background: c.card, borderColor: c.border }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#E0555518" }}>
            <X size={18} style={{ color: "#E05555" }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: c.txt }}>Refuser l'ordonnance</h3>
            <p className="text-xs" style={{ color: c.txt2 }}>{order.id} · {order.patient}</p>
          </div>
          <button onClick={onClose} disabled={loading}
            className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:opacity-70 disabled:opacity-40"
            style={{ borderColor: c.border, color: c.txt3 }}>
            <X size={14} />
          </button>
        </div>

        {/* Avertissement */}
        <div className="rounded-xl p-3 mb-4 text-xs font-semibold flex gap-2"
          style={{ background: "#E0555510", border: "1px solid #E0555530", color: "#C0392B" }}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            Le patient sera <strong>notifié immédiatement</strong>. Son ordonnance sera annulée
            et les médicaments réservés retourneront automatiquement en stock.
          </span>
        </div>

        {/* Motif */}
        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: c.txt2 }}>
          Motif du refus <span style={{ color: "#E05555" }}>*</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Ex : médicament en rupture, ordonnance illisible, doublon de prescription…"
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border resize-none"
          style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt }}
        />

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80 disabled:opacity-40"
            style={{ borderColor: c.border, color: c.txt2 }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#E05555" }}>
            {loading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <><X size={14} strokeWidth={3} /> Refuser l'ordonnance</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL: AJOUTER UN ARTICLE (STOCK) ───────────────────────────────────────
function AddItemModal({ onClose, onAdd, dk, existingMedicationIds = new Set(), existingStockItems = [] }) {
  const { t } = useLanguage();
  const c = dk ? T.dark : T.light;
  const [form, setForm] = useState({
    medication_id: null, expiry: "", qty: "", price: "", min_threshold: "10",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [alreadyInStock, setAlreadyInStock] = useState(null);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.searchMedications(searchQuery).catch(() => []);
        setSearchResults(Array.isArray(results) ? results.slice(0, 8) : (Array.isArray(results?.results) ? results.results.slice(0, 8) : []));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectMed = (med) => {
    setSelectedMed(med);
    setSearchQuery(med.name || med.commercial_name || "");
    setForm(f => ({ ...f, medication_id: med.id }));
    setSearchResults([]);
    if (med.category) setSelectedCategory(med.category);
    const medId = String(med.id);
    if (existingMedicationIds.has(medId)) {
      const existing = existingStockItems.find(s => s.medicationId === medId);
      setAlreadyInStock(existing || true);
    } else {
      setAlreadyInStock(null);
    }
  };

  const inputStyle = { background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt };
  const labelCls = "block text-xs font-bold uppercase tracking-wide mb-1.5";

  const handleAdd = () => {
    if (!form.medication_id) return;
    onAdd({
      medication_id: form.medication_id,
      expiry:        form.expiry || "2027-01-01",
      qty:           parseInt(form.qty)           || 0,
      price:         parseFloat(form.price)       || 0,
      min_threshold: parseInt(form.min_threshold) || 10,
    });
    onClose();
  };

  const moleculeValue = selectedMed?.molecule || selectedMed?.dci || "";
  const catLabel = CATEGORY_DISPLAY[selectedCategory] || selectedCategory || "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border"
        style={{ background: c.card, borderColor: c.border }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: c.txt }}>{t('add_item_title') || "Ajouter un article"}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:opacity-70"
            style={{ borderColor: c.border, color: c.txt3 }}>
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Recherche médicament */}
          <div className="relative">
            <label className={labelCls} style={{ color: c.txt2 }}>{t('med_name_label') || "Nom du médicament"}</label>
            <div className="relative">
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedMed(null); setForm(f => ({ ...f, medication_id: null })); setSelectedCategory(""); setAlreadyInStock(null); }}
                placeholder="Rechercher un médicament…"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border"
                style={inputStyle}
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: c.blue, borderTopColor: "transparent" }} />
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 rounded-xl border shadow-lg overflow-hidden"
                style={{ background: c.card, borderColor: c.border }}>
                {searchResults.map(med => (
                  <button key={med.id} onClick={() => selectMed(med)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                    style={{ background: "transparent", color: c.txt, borderBottom: `1px solid ${c.border}` }}>
                    <span className="font-semibold">{med.name || med.commercial_name}</span>
                    {med.molecule && <span className="ml-2 text-xs" style={{ color: c.txt3 }}>{med.molecule}</span>}
                  </button>
                ))}
              </div>
            )}
            {selectedMed && !alreadyInStock && (
              <p className="mt-1 text-xs font-semibold" style={{ color: "#0F6E56" }}>
                ✓ {selectedMed.name || selectedMed.commercial_name} sélectionné
              </p>
            )}
            {alreadyInStock && (
              <div className="mt-2 rounded-xl px-4 py-3 border"
                style={{ background: "#E8A83818", borderColor: "#E8A83855" }}>
                <p className="text-xs font-bold" style={{ color: "#E8A838" }}>
                  Ce médicament est déjà dans votre stock.
                </p>
                {alreadyInStock !== true && (
                  <p className="text-xs mt-1" style={{ color: "#E8A838" }}>
                    Stock actuel : <strong>{alreadyInStock.qty}</strong> unités · Prix : <strong>{alreadyInStock.price} DZD</strong>
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "#9AACBE" }}>
                  Fermez ce modal et utilisez le bouton Modifier pour le mettre à jour.
                </p>
              </div>
            )}
          </div>

          {/* Molécule + Catégorie */}
          <div className="grid grid-cols-2 gap-3">
            {/* Molécule */}
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>Molécule</label>
              <div className="w-full px-4 py-2.5 rounded-xl text-sm border"
                style={{ ...inputStyle, color: moleculeValue ? c.txt : c.txt3, minHeight: 40 }}>
                {moleculeValue || <span style={{ color: c.txt3 }}>Auto-rempli</span>}
              </div>
            </div>
            {/* Catégorie */}
            <div className="relative">
              <label className={labelCls} style={{ color: c.txt2 }}>Catégorie</label>
              <button
                type="button"
                onClick={() => setShowCatDropdown(v => !v)}
                className="w-full px-4 py-2.5 rounded-xl text-sm border text-left flex items-center justify-between"
                style={{ ...inputStyle, color: selectedCategory ? c.txt : c.txt3 }}>
                <span>{selectedCategory ? catLabel : "Choisir…"}</span>
                <ChevronDown size={13} style={{ color: c.txt3, flexShrink: 0 }} />
              </button>
              {showCatDropdown && (
                <div className="absolute z-20 w-full mt-1 rounded-xl border shadow-lg overflow-auto max-h-48"
                  style={{ background: c.card, borderColor: c.border }}>
                  {STOCK_CATEGORIES.map(key => (
                    <button key={key} type="button"
                      onClick={() => { setSelectedCategory(key); setShowCatDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-80"
                      style={{
                        background: selectedCategory === key ? c.blueLight : "transparent",
                        color: selectedCategory === key ? c.blue : c.txt,
                        borderBottom: `1px solid ${c.border}`,
                      }}>
                      {CATEGORY_DISPLAY[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date d'expiration */}
          <div>
            <label className={labelCls} style={{ color: c.txt2 }}>{t('expiry_date_label') || "Date d'expiration"}</label>
            <input type="date" value={form.expiry}
              onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border"
              style={inputStyle} />
          </div>

          {/* Quantité + Prix */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t('qty_in_stock_label') || "Qté en stock", key: "qty",   placeholder: "0" },
              { label: t('price_label') || "Prix (DZD)",          key: "price", placeholder: "0" },
            ].map(f => (
              <div key={f.key}>
                <label className={labelCls} style={{ color: c.txt2 }}>{f.label}</label>
                <input
                  value={form[f.key]}
                  onChange={e => { const val = e.target.value.replace(/\D/g, ""); setForm(p => ({ ...p, [f.key]: val })); }}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border"
                  style={inputStyle} />
              </div>
            ))}
          </div>

          {/* Seuil d'alerte minimum */}
          <div>
            <label className={labelCls} style={{ color: c.txt2 }}>
              {t('min_threshold_label') || "Seuil d'alerte (qté min)"}
            </label>
            <input
              value={form.min_threshold}
              onChange={e => { const val = e.target.value.replace(/\D/g, ""); setForm(p => ({ ...p, min_threshold: val })); }}
              placeholder="10"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border"
              style={inputStyle}
            />
            <p className="mt-1 text-xs" style={{ color: c.txt3 }}>
              {t('min_threshold_hint') || "Alerte automatique quand le stock descend sous ce seuil"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
            style={{ borderColor: c.border, color: c.txt2 }}>
            {t('cancel_btn') || "Annuler"}
          </button>
          <button onClick={handleAdd} disabled={!form.medication_id || !!alreadyInStock}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: c.blue }}>
            {t('save_btn') || "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL: MODIFIER UN ARTICLE (STOCK) ──────────────────────────────────────
function EditItemModal({ item, onClose, onSave, dk }) {
  const c = dk ? T.dark : T.light;
  const [form, setForm] = useState({
    qty:           String(item.qty),
    price:         String(item.price),
    min_threshold: String(item.min),
    expiry:        item.expiry !== "—" ? item.expiry : "",
  });
  const [saving, setSaving] = useState(false);

  const inputStyle = { background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt };
  const labelCls = "block text-xs font-bold uppercase tracking-wide mb-1.5";

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.id, {
        quantity:      parseInt(form.qty)           || 0,
        selling_price: parseFloat(form.price)       || 0,
        min_threshold: parseInt(form.min_threshold) || 10,
        expiry_date:   form.expiry || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border"
        style={{ background: c.card, borderColor: c.border }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: c.txt }}>Modifier l'article</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:opacity-70"
            style={{ borderColor: c.border, color: c.txt3 }}>
            <X size={15} />
          </button>
        </div>

        {/* Infos lecture seule */}
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: c.blueLight }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: c.blue + "22" }}>
            <Pill size={15} style={{ color: c.blue }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: c.txt }}>{item.name}</p>
            <p className="text-xs" style={{ color: c.txt3 }}>
              {item.molecule && <span>{item.molecule} · </span>}
              {item.category}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Quantité + Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>Quantité en stock</label>
              <input type="number" min={0} value={form.qty}
                onChange={e => setForm(f => ({ ...f, qty: e.target.value.replace(/\D/g, "") }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border"
                style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>Prix (DZD)</label>
              <input type="number" min={0} value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border"
                style={inputStyle} />
            </div>
          </div>

          {/* Seuil + Expiration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>Seuil min.</label>
              <input type="number" min={0} value={form.min_threshold}
                onChange={e => setForm(f => ({ ...f, min_threshold: e.target.value.replace(/\D/g, "") }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border"
                style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>Date d'expiration</label>
              <input type="date" value={form.expiry}
                onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border"
                style={inputStyle} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
            style={{ borderColor: c.border, color: c.txt2 }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: c.blue }}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: ACCUEIL ────────────────────────────────────────────────────────────
function HomePage({ dk, onNav }) {
  const { userData } = useAuth();
  const c = dk ? T.dark : T.light;
  const [showQrModal, setShowQrModal] = useState(false);
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPharmacyStats().catch(() => null),
      api.getPharmacyOrders().catch(() => []),
      api.getPharmacyStock().catch(() => []),
      api.getNotifications().catch(() => []),
    ]).then(([statsData, ordersData, stockData]) => {
      setStats(statsData || {});
      const rawOrders = Array.isArray(ordersData) ? ordersData : (ordersData?.results || []);
      setOrders(rawOrders.slice(0, 5));
      const rawStock = Array.isArray(stockData) ? stockData : (stockData?.results || []);
      setStock(
        rawStock
          .filter(s => Number(s.quantity) <= (Number(s.medication_details?.min_threshold) || 10))
          .slice(0, 5)
      );
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{
            display: "inline-block", width: 32, height: 32,
            border: "2px solid #6492C9", borderTopColor: "transparent",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ fontSize: "13px", color: c.txt2 }}>Chargement…</p>
        </div>
      </div>
    );
  }

  const pending = orders.filter(o => o.status === "pending" || o.display_status === "pending").length;
  const ruptures = stock.filter(s => Number(s.quantity) === 0).length;
  const total = stats?.kpis?.today_revenue || 0;
  const cnas = stats?.kpis?.cnas_amount || 0;
  const pct = total > 0 ? Math.round((cnas / total) * 100) : 0;

  const STATUS_BADGE = {
    pending:   { label: "En attente",     bg: "#FAEEDA", color: "#854F0B" },
    preparing: { label: "En préparation", bg: "#E6F1FB", color: "#185FA5" },
    ready:     { label: "Prête",          bg: "#E1F5EE", color: "#0F6E56" },
    delivered: { label: "Livrée",         bg: dk ? "#1E2D4A" : "#F0F4F8", color: c.txt2 },
  };

  const getAvatarColor = (name = "") => {
    const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  };

  const getInitials = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

  const itemBg = dk ? "rgba(30,45,74,0.3)" : "#F8FAFC";

  return (
    <>
      {showQrModal && <QrModal dk={dk} onClose={() => setShowQrModal(false)} />}

      {/* Section 1 — Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "500", color: c.txt, margin: "0 0 4px" }}>
            Bonjour, {userData?.first_name || "—"}
          </h1>
          <p style={{ fontSize: "13px", color: c.txt2, margin: 0 }}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => setShowQrModal(true)}
          style={{
            background: "#304B71", color: "#fff", border: "none", borderRadius: "12px",
            padding: "10px 20px", fontSize: "13px", fontWeight: "500", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          <QrCode size={15} /> Scanner ordonnance
        </button>
      </div>

      {/* Section 2 — 4 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <KpiCard
          label="Commandes aujourd'hui"
          value={stats?.kpis?.today_orders ?? "—"}
          sub={`${pending} en attente`}
          subColor="#854F0B"
          dk={dk}
        />
        <KpiCard
          label="Revenu du jour"
          value={stats?.kpis?.today_revenue ? stats.kpis.today_revenue.toLocaleString("fr-FR") : "—"}
          sub="DZD"
          dk={dk}
        />
        <KpiCard
          label="Articles en stock"
          value={stats?.kpis?.stock_items ?? "—"}
          sub={ruptures > 0 ? `${ruptures} en rupture` : "Stock normal"}
          subColor={ruptures > 0 ? "#A32D2D" : "#0F6E56"}
          dk={dk}
        />
        <KpiCard
          label="Remboursement CNAS"
          value={stats?.kpis?.cnas_amount ? stats.kpis.cnas_amount.toLocaleString("fr-FR") : "—"}
          sub="DZD ce mois"
          subColor="#6492C9"
          dk={dk}
        />
      </div>

      {/* Section 3 — Grille 2 colonnes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "14px" }}>

        {/* Colonne gauche */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Card Dernières commandes */}
          <Card dk={dk} empty>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#A0B5CD" }}>
                Dernières commandes
              </p>
              <button
                onClick={() => onNav("commandes")}
                className="text-xs font-semibold hover:underline"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6492C9" }}
              >
                Voir tout →
              </button>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: c.txt2 }}>
                Aucune commande aujourd'hui
              </p>
            ) : orders.map(order => {
              const statusKey = order.status || "pending";
              const badge = STATUS_BADGE[statusKey] || STATUS_BADGE.pending;
              const [avatarBg1, avatarBg2] = getAvatarColor(order.patient_name || "");
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 rounded-xl mb-2 cursor-pointer transition-colors"
                  style={{ padding: "10px 12px", background: itemBg }}
                  onMouseEnter={e => { e.currentTarget.style.background = dk ? "rgba(100,146,201,0.12)" : "#EEF3FB"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = itemBg; }}
                >
                  <div className="shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${avatarBg1}, ${avatarBg2})` }}>
                    {getInitials(order.patient_name || "Patient")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: c.txt }}>
                      {order.patient_name || "Patient"}
                    </p>
                    <p className="text-xs truncate" style={{ color: c.txt2 }}>
                      {order.items?.[0]?.drug_name || order.items?.[0]?.medication_name || "Ordonnance"}
                      {order.items?.length > 1 ? ` + ${order.items.length - 1} autre(s)` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold shrink-0"
                    style={{ padding: "3px 10px", borderRadius: "20px", background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </Card>

          {/* Card Alertes stock */}
          <Card dk={dk} empty>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#A0B5CD" }}>
                Alertes stock
              </p>
              <button
                onClick={() => onNav("stock")}
                className="text-xs font-semibold hover:underline"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6492C9" }}
              >
                Gérer →
              </button>
            </div>
            {stock.length === 0 ? (
              <p className="text-sm" style={{ color: "#0F6E56", padding: "8px 0" }}>Aucune alerte de stock</p>
            ) : stock.map(item => {
              const isRupture = Number(item.quantity) === 0;
              return (
                <div key={item.id} className="flex items-center justify-between rounded-xl mb-2"
                  style={{ padding: "9px 12px", background: isRupture ? "#FCEBEB" : "#FAEEDA" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: c.txt }}>
                      {item.medication_details?.name || "Médicament"}
                    </p>
                    <p className="text-xs" style={{ color: isRupture ? "#A32D2D" : "#854F0B" }}>
                      {isRupture ? "Rupture · 0 unité" : `Stock faible · ${item.quantity} unité(s)`}
                    </p>
                  </div>
                  <span className="text-xs font-bold"
                    style={{ padding: "3px 10px", borderRadius: "20px", background: isRupture ? "#E24B4A" : "#EF9F27", color: "#fff" }}>
                    {isRupture ? "Rupture" : "Faible"}
                  </span>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Colonne droite — Bilan CNAS */}
        <Card dk={dk} empty>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#A0B5CD" }}>
            Bilan CNAS ce mois
          </p>
          <p className="text-2xl font-bold mb-1" style={{ color: c.txt }}>
            {cnas > 0 ? cnas.toLocaleString("fr-FR") : "—"}
            <span className="text-sm font-normal ml-1" style={{ color: c.txt2 }}>DZD</span>
          </p>
          <p className="text-xs mb-1" style={{ color: c.txt2 }}>
            sur {total > 0 ? `${total.toLocaleString("fr-FR")} DZD` : "—"} de revenu total
          </p>
          <div className="rounded-full overflow-hidden my-3" style={{ height: 6, background: dk ? "#1E2D4A" : "#F0F4F8" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "#6492C9", borderRadius: "20px", transition: "width 0.5s ease" }} />
          </div>
          <p className="text-xs" style={{ color: c.txt2 }}>{pct}% couvert par la CNAS</p>
        </Card>
      </div>
    </>
  );
}

// ─── PAGE: STOCK ──────────────────────────────────────────────────────────────
function StockPage({ dk }) {
  const { t } = useLanguage();
  const c = dk ? T.dark : T.light;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | critical | ok
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);

  const mapStockRow = (row) => {
    const m = row.medication_details || {};
    return {
      id:           row.id,
      medicationId: String(row.medication || ""),
      name:         m.name || `Médicament #${row.medication}`,
      molecule:     m.molecule || "",
      qty:          Number(row.quantity) || 0,
      min:          Number(row.min_threshold) || 10,
      price:        Number(row.selling_price) || Number(m.price_dzd) || 0,
      cnas:         !!m.cnas_covered,
      category:     m.category || "—",
      expiry:       row.expiry_date || "—",
    };
  };

  const reload = async () => {
    setLoading(true);
    try {
      const data = await api.getPharmacyStock();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setStockItems(list.map(mapStockRow));
    } catch (err) {
      console.error("Erreur chargement stock:", err);
      setStockItems([]);
      setBanner({ type: "error", msg: err?.message || "Erreur lors du chargement du stock." });
      setTimeout(() => setBanner(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleSaveEdit = async (id, data) => {
    try {
      await api.updatePharmacyStock(id, data);
      await reload();
      setBanner({ type: "success", msg: "Article mis à jour." });
    } catch (err) {
      setBanner({ type: "error", msg: err?.message || "Échec de la mise à jour." });
    } finally {
      setTimeout(() => setBanner(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.deletePharmacyStock(id);
      setStockItems(prev => prev.filter(s => s.id !== id));
      setConfirmDeleteId(null);
      setBanner({ type: "success", msg: "Article retiré du stock." });
    } catch (err) {
      setBanner({ type: "error", msg: err?.message || "Échec de la suppression." });
    } finally {
      setDeletingId(null);
      setTimeout(() => setBanner(null), 3000);
    }
  };

  const handleExportPDF = () => {
    const now = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const rows = stockItems.map(s => {
      const pct = s.qty / (s.min || 1);
      const statut = pct < 0.4 ? "Critique" : pct < 1.0 ? "Bas" : "Normal";
      const statutColor = pct < 0.4 ? "#E05555" : pct < 1.0 ? "#E8A838" : "#2D8C6F";
      return `
        <tr>
          <td>${s.name || "—"}</td>
          <td>${s.molecule || "—"}</td>
          <td>${s.category || "—"}</td>
          <td style="font-weight:700;color:${statutColor}">${s.qty}</td>
          <td>${s.min}</td>
          <td style="color:${statutColor};font-weight:600">${statut}</td>
          <td>${s.expiry && s.expiry !== "—" ? new Date(s.expiry).toLocaleDateString("fr-FR") : "—"}</td>
          <td>${s.price ? s.price + " DZD" : "—"}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Stock Pharmacie</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0D1B2E; padding: 32px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 18px; border-bottom: 2px solid #4A6FA5; }
    .header-left h1 { font-size: 22px; font-weight: 800; color: #4A6FA5; }
    .header-left p { color: #5A6E8A; margin-top: 4px; font-size: 12px; }
    .header-right { text-align: right; color: #5A6E8A; font-size: 11px; }
    .header-right strong { display: block; font-size: 13px; color: #0D1B2E; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-box { flex: 1; border: 1px solid #E4EAF5; border-radius: 8px; padding: 12px 16px; }
    .stat-box .val { font-size: 20px; font-weight: 800; color: #4A6FA5; }
    .stat-box .lbl { font-size: 10px; color: #9AACBE; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead tr { background: #4A6FA5; color: #fff; }
    thead th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    tbody tr:nth-child(even) { background: #F0F4F8; }
    tbody td { padding: 8px 12px; border-bottom: 1px solid #E4EAF5; vertical-align: middle; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #E4EAF5; text-align: center; color: #9AACBE; font-size: 10px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Gestion du Stock — Pharmacie</h1>
      <p>État du stock au ${now}</p>
    </div>
    <div class="header-right">
      <strong>Healy Medical Platform</strong>
      Exporté le ${now}
    </div>
  </div>
  <div class="stats">
    <div class="stat-box"><div class="val">${stockItems.length}</div><div class="lbl">Références totales</div></div>
    <div class="stat-box"><div class="val" style="color:#E05555">${stockItems.filter(s => s.qty / (s.min || 1) < 0.4).length}</div><div class="lbl">Stocks critiques</div></div>
    <div class="stat-box"><div class="val" style="color:#E8A838">${stockItems.filter(s => { const p = s.qty / (s.min || 1); return p >= 0.4 && p < 1; }).length}</div><div class="lbl">Stocks bas</div></div>
    <div class="stat-box"><div class="val" style="color:#2D8C6F">${stockItems.filter(s => s.qty / (s.min || 1) >= 1).length}</div><div class="lbl">Stocks normaux</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Médicament</th>
        <th>Molécule</th>
        <th>Catégorie</th>
        <th>Quantité</th>
        <th>Seuil min.</th>
        <th>Statut</th>
        <th>Expiration</th>
        <th>Prix</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Healy — Document généré automatiquement · ${now}</div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const allStock = stockItems;

  const norm = str => (str || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const filtered = allStock.filter(s => {
    const q = norm(search);
    if (!q) return filter === "all" || (filter === "critical" ? s.qty < s.min : s.qty >= s.min);
    const matchSearch = norm(s.name).includes(q) ||
                        norm(s.molecule).includes(q) ||
                        norm(s.category).includes(q);
    if (filter === "critical") return matchSearch && s.qty < s.min;
    if (filter === "ok")       return matchSearch && s.qty >= s.min;
    return matchSearch;
  });

  const getStockStatus = (item) => {
    const pct = item.qty / item.min;
    if (pct < 0.4) return { label: t('critical_status') || "Critique",   color: c.red,   bg: c.red + "18" };
    if (pct < 1.0) return { label: t('low_status') || "Bas",        color: c.amber, bg: c.amber + "18" };
    return          { label: t('normal_status') || "Normal",    color: c.green, bg: c.green + "18" };
  };

  return (
    <>
      {showAddModal && (
        <AddItemModal
          dk={dk}
          existingMedicationIds={new Set(stockItems.map(s => s.medicationId))}
          existingStockItems={stockItems}
          onClose={() => setShowAddModal(false)}
          onAdd={async (item) => {
            try {
              await api.createPharmacyStock({
                medication:    item.medication_id,
                quantity:      item.qty,
                min_threshold: item.min_threshold,
                selling_price: item.price,
                expiry_date:   item.expiry,
              });
              await reload();
              setBanner({ type: "success", msg: "Article ajouté avec succès." });
            } catch (err) {
              const msg = err?.message || "";
              const isDuplicate = msg.toLowerCase().includes("existe déjà") || msg.includes("uniq") || msg.includes("unique");
              setBanner({
                type: "error",
                msg: isDuplicate
                  ? "Ce médicament est déjà dans votre stock. Utilisez le bouton Modifier pour changer la quantité ou le prix."
                  : msg || "Échec de l'ajout.",
              });
            } finally {
              setTimeout(() => setBanner(null), 5000);
            }
          }}
        />
      )}

      {editItem && (
        <EditItemModal
          dk={dk}
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdit}
        />
      )}

      {banner && (
        <div
          className="mb-4 px-4 py-2.5 rounded-xl border text-sm font-semibold"
          style={{
            background: (banner.type === "success" ? c.green : c.red) + "18",
            borderColor: (banner.type === "success" ? c.green : c.red) + "44",
            color: banner.type === "success" ? c.green : c.red,
          }}
        >
          {banner.msg}
        </div>
      )}

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: c.txt }}>{t('stock_management_title') || "Gestion du Stock"}</h1>
          <p className="text-sm mt-0.5" style={{ color: c.txt2 }}>{t('references_count', {count: allStock.length}) || `${allStock.length} références`} · {t('out_of_stock_count', {count: allStock.filter(s => s.qty < s.min).length}) || `${allStock.filter(s => s.qty < s.min).length} en rupture`}</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: c.blue }}>
          <Plus size={15} /> {t('add_item_btn') || "Ajouter un article"}
        </button>
      </div>

      {/* Filters */}
      <Card dk={dk} className="mb-5" style={{ padding: "12px 16px" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 rounded-xl px-3 py-2"
            style={{ background: c.blueLight }}>
            <Search size={14} style={{ color: c.txt3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('search_med_placeholder') || "Rechercher médicament…"} className="outline-none text-sm bg-transparent flex-1"
              style={{ color: c.txt }} />
          </div>
          <div className="flex gap-2">
            {[[ "all", t('all_orders_tab') || "Tout" ], [ "critical", t('critical_status') || "Critique" ], [ "ok", t('normal_status') || "Normal" ]].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{ background: filter === val ? c.blue : "transparent", color: filter === val ? "#fff" : c.txt2, borderColor: filter === val ? c.blue : c.border }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
            style={{ borderColor: c.border, color: c.txt2 }}>
            <Download size={13} /> {t('export_btn') || "Exporter PDF"}
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card dk={dk} empty={true} style={{ padding: 0, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.border}`, background: dk ? "rgba(255,255,255,0.02)" : "#FAFBFD" }}>
                {[
                  t('medication_table_header') || "Médicament",
                  t('molecule_table_header') || "Molécule",
                  t('category_table_header') || "Catégorie",
                  t('stock_table_header') || "Stock",
                  t('min_table_header') || "Min.",
                  t('status_table_header') || "Statut",
                  t('expiration_table_header') || "Expiration",
                  t('price_table_header') || "Prix",
                  t('actions_table_header') || "Actions"
                ].map(h => (
                  <th key={h} className="text-left text-xs font-bold uppercase tracking-wide px-4 py-3"
                    style={{ color: c.txt3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px 0" }}>
                    <p style={{ color: c.txt3, fontSize: "13px" }}>Aucun article trouvé pour cette recherche.</p>
                  </td>
                </tr>
              )}
              {filtered.map(item => {
                const st = getStockStatus(item);
                return (
                  <tr key={item.id} className="transition-colors"
                    style={{ borderBottom: `1px solid ${c.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = dk ? "rgba(255,255,255,0.02)" : "#FAFBFD"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: c.blueLight }}>
                          <Pill size={13} style={{ color: c.blue }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: c.txt }}>{item.name}</p>
                          {item.cnas && <Badge color={c.blue} bg={c.blueLight}>CNAS</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: c.txt2 }}>{item.molecule}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: c.txt2 }}>{item.category}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold" style={{ color: st.color }}>{item.qty}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: c.txt3 }}>{item.min}</td>
                    <td className="px-4 py-3"><Badge color={st.color} bg={st.bg}>{t(st.label) || st.label}</Badge></td>
                    <td className="px-4 py-3 text-xs" style={{ color: new Date(item.expiry) < new Date() ? c.red : c.txt3 }}>
                      {new Date(item.expiry).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: c.blue }}>{item.price} DZD</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditItem(item)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors hover:opacity-70"
                          style={{ borderColor: c.blue + "55", color: c.blue }}
                          title="Modifier l'article"
                        >
                          <Edit2 size={12} />
                        </button>
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="px-2 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                              style={{ background: c.red }}
                            >
                              {deletingId === item.id ? "…" : "Oui"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg text-xs font-bold border"
                              style={{ borderColor: c.border, color: c.txt2 }}
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors hover:opacity-70"
                            style={{ borderColor: c.red + "55", color: c.red }}
                            title="Retirer du stock"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ─── PAGE: COMMANDES ──────────────────────────────────────────────────────────
function CommandesPage({ dk, initialScanToken }) {
  const { t } = useLanguage();
  const c = dk ? T.dark : T.light;
  const [tab, setTab]                   = useState("all");
  const [showQr, setShowQr]             = useState(!!initialScanToken);
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId]     = useState(null);
  const [refuseModal, setRefuseModal]   = useState(null);
  const [refusingId, setRefusingId]     = useState(null);
  const [successBanner, setSuccessBanner] = useState("");
  const [searchOrders, setSearchOrders]   = useState("");
  const [sourceFilter, setSourceFilter]   = useState("all"); // all | scan | click_collect

  const mapOrder = (o) => {
    const status = (o.status || "new").toLowerCase();
    // Backend statuses (typiques) : pending|preparing|ready|delivered|cancelled
    const statusMap = { pending: "new", preparing: "processing", ready: "ready", delivered: "delivered", cancelled: "cancelled" };
    const displayStatus = statusMap[status] || status;
    const itemsArr = Array.isArray(o.items)
      ? o.items.map(it => {
          const name = it.drug_name || it.medication_name || it.name || "";
          const qty  = it.quantity || it.duration || "";
          return qty ? `${name} ×${qty}` : name;
        })
      : [];
    const dateStr = o.created_at ? new Date(o.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
    return {
      id: o.id,
      ref: o.prescription_ref || `ORD-${String(o.id).slice(0, 8).toUpperCase()}`,
      _rawId: o.id,
      _rawItems: Array.isArray(o.items) ? o.items : [],
      patient: o.patient_name || "Patient",
      doctor: o.doctor_name || "",
      date: dateStr,
      status: displayStatus,
      items: itemsArr,
      total: o.total || 0,
      cnas: !!o.cnas_covered,
      source: o.order_type === "direct" ? "scan" : "click_collect",
    };
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getPharmacyOrders();
      const results = Array.isArray(data) ? data : (data?.results || []);
      setOrders(results.map(mapOrder));
      setLoadError("");
    } catch (err) {
      console.error("Erreur chargement commandes:", err);
      setLoadError(err?.message || "Erreur lors du chargement des commandes.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const newCount = orders.filter(o => o.status === "new").length;

  const cancelledCount = orders.filter(o => o.status === "cancelled").length;

  const tabs = [
    { id: "all",        label: "Toutes",      count: orders.length },
    { id: "new",        label: "Nouvelles",   count: newCount, accent: true },
    { id: "processing", label: "En prépa.",   count: orders.filter(o => o.status === "processing").length },
    { id: "ready",      label: "Prêtes",      count: orders.filter(o => o.status === "ready").length },
    { id: "delivered",  label: "Récupérées",  count: orders.filter(o => o.status === "delivered").length },
    { id: "cancelled",  label: "Refusées",    count: cancelledCount, danger: cancelledCount > 0 },
  ];

  const displayed = (tab === "all" ? orders : orders.filter(o => o.status === tab))
    .filter(o => {
      const q = searchOrders.toLowerCase();
      const matchSearch = !q ||
        (o.patient || "").toLowerCase().includes(q) ||
        (o.doctor || "").toLowerCase().includes(q) ||
        (o.ref || "").toLowerCase().includes(q) ||
        (o.items || []).some(i => i.toLowerCase().includes(q));
      const matchSource = sourceFilter === "all" || o.source === sourceFilter;
      return matchSearch && matchSource;
    });

  // Mapping display status → backend status pour PATCH
  const BACK_STATUS = { processing: "preparing", ready: "ready", delivered: "delivered" };

  const updateOrderStatus = async (o, nextDisplayStatus) => {
    const backendStatus = BACK_STATUS[nextDisplayStatus] || nextDisplayStatus;
    const rawId = o._rawId;
    // Optimistic update
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: nextDisplayStatus } : x));
    // Si c'est un mock (pas de _rawId), ne fait que local
    if (!rawId) return;
    setUpdatingId(o.id);
    try {
      await api.apiFetch(`/pharmacy/orders/${rawId}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: backendStatus }),
      });
    } catch (err) {
      console.error("Erreur update statut commande:", err);
      // Revert optimistic update
      setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: o.status } : x));
      setLoadError(err?.message || "Impossible de mettre à jour le statut.");
      setTimeout(() => setLoadError(""), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const acceptOrder   = (order) => updateOrderStatus(order, "processing");
  const markReady     = (order) => updateOrderStatus(order, "ready");
  const markDelivered = (order) => updateOrderStatus(order, "delivered");

  const refuseOrder = async (order, reason) => {
    const rawId = order._rawId;
    setRefusingId(order.id);
    try {
      // 1. Annuler la commande côté backend
      try {
        await api.apiFetch(`/pharmacy/orders/${rawId}/refuse/`, {
          method: "POST",
          body: JSON.stringify({ reason }),
        });
      } catch {
        await api.apiFetch(`/pharmacy/orders/${rawId}/status/`, {
          method: "PATCH",
          body: JSON.stringify({ status: "cancelled", reason }),
        });
      }

      // 2. Réapprovisionner le stock pour chaque médicament de la commande
      if (order._rawItems?.length > 0) {
        const stockData = await api.getPharmacyStock().catch(() => []);
        const stockList = Array.isArray(stockData) ? stockData : (stockData?.results || []);

        await Promise.allSettled(
          order._rawItems.map(async (item) => {
            const medId = item.medication_id ?? item.medication ?? item.drug_id ?? null;
            const qtyOrdered = Number(item.quantity) || 0;
            if (!medId || qtyOrdered <= 0) return;

            const stockEntry = stockList.find(
              s => String(s.medication) === String(medId) ||
                   String(s.medication_details?.id) === String(medId)
            );
            if (!stockEntry) return;

            const newQty = Number(stockEntry.quantity) + qtyOrdered;
            await api.updatePharmacyStock(stockEntry.id, { quantity: newQty });
          })
        );
      }

      // 3. Mettre à jour l'UI
      setOrders(prev => prev.map(x =>
        x.id === order.id ? { ...x, status: "cancelled", cancelReason: reason } : x
      ));
      setRefuseModal(null);
      setSuccessBanner("Ordonnance refusée · Patient notifié · Stock réapprovisionné");
      setTimeout(() => setSuccessBanner(""), 5000);
    } catch (err) {
      setLoadError(err?.message || "Impossible de refuser cette commande.");
      setTimeout(() => setLoadError(""), 4000);
    } finally {
      setRefusingId(null);
    }
  };

  return (
    <>
      {showQr && (
        <QrModal
          dk={dk}
          initialToken={initialScanToken}
          onClose={() => setShowQr(false)}
          onScan={async (scanResult) => {
            // scanResult contient { prescription: { id, ... } } si le backend est branché
            const prescriptionId = scanResult?.prescription?.id ?? scanResult?.id ?? null;
            if (prescriptionId) {
              try {
                await api.createPharmacyOrder({ prescription: prescriptionId, order_type: "prescription" });
              } catch (err) {
                // Commande déjà existante ou endpoint pas encore prêt — on continue
                console.warn("createPharmacyOrder:", err?.message);
              }
            }
            await loadOrders();
          }}
        />
      )}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} dk={dk} onClose={() => setSelectedOrder(null)} />
      )}
      {refuseModal && (
        <RefuseOrderModal
          order={refuseModal}
          dk={dk}
          loading={refusingId === refuseModal.id}
          onClose={() => setRefuseModal(null)}
          onConfirm={(reason) => refuseOrder(refuseModal, reason)}
        />
      )}

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: c.txt }}>{t('orders_today_label') || "Commandes"}</h1>
          <p className="text-sm mt-0.5" style={{ color: c.txt2 }}>
            {t('processing_orders_desc') || "Gérez les ordonnances et dispensations"}
            {newCount > 0 && (
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: c.blue }}>{newCount} {t('new_orders_count', {count: newCount}) || `nouvelle${newCount > 1 ? "s" : ""}`}</span>
            )}
          </p>
        </div>
        <button onClick={() => setShowQr(true)}
          style={{
            background: "#304B71", color: "#fff", border: "none", borderRadius: "12px",
            padding: "10px 20px", fontSize: "13px", fontWeight: "500", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
          <QrCode size={15} /> Scanner ordonnance
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-5 overflow-x-auto" style={{ borderColor: c.border, scrollbarWidth: "none" }}>
        {tabs.map(tb => {
          const activeColor = tb.danger ? c.red : c.blue;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap shrink-0"
              style={{
                color: tab === tb.id ? activeColor : c.txt2,
                borderBottom: tab === tb.id ? `2px solid ${activeColor}` : "2px solid transparent",
                marginBottom: -1,
              }}>
              {tb.label}
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab === tb.id ? activeColor
                    : tb.accent && tb.count > 0 ? c.blue + "22"
                    : tb.danger && tb.count > 0 ? c.red + "18"
                    : c.blueLight,
                  color: tab === tb.id ? "#fff"
                    : tb.accent && tb.count > 0 ? c.blue
                    : tb.danger && tb.count > 0 ? c.red
                    : c.txt3,
                }}>
                {tb.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[180px]"
          style={{ background: c.card, borderColor: c.border }}>
          <Search size={14} style={{ color: c.txt3, flexShrink: 0 }} />
          <input
            value={searchOrders}
            onChange={e => setSearchOrders(e.target.value)}
            placeholder="Rechercher patient, médecin, médicament…"
            className="outline-none text-sm bg-transparent flex-1"
            style={{ color: c.txt }}
          />
          {searchOrders && (
            <button onClick={() => setSearchOrders("")} style={{ color: c.txt3, background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
          )}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ borderColor: c.border, background: c.card }}>
          {[
            { id: "all",          label: "Toutes sources" },
            { id: "click_collect", label: "Click & Collect" },
            { id: "scan",         label: "Scan" },
          ].map(opt => (
            <button key={opt.id} onClick={() => setSourceFilter(opt.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: sourceFilter === opt.id ? c.blue : "transparent",
                color: sourceFilter === opt.id ? "#fff" : c.txt2,
                border: "none", cursor: "pointer",
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {successBanner && (
        <div className="mb-4 px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2"
          style={{ background: "#2D8C6F12", borderColor: "#2D8C6F44", color: "#2D8C6F" }}>
          <CheckCircle size={15} /> {successBanner}
        </div>
      )}
      {loadError && (
        <div
          className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold border"
          style={{ background: c.red + "18", borderColor: c.red + "44", color: c.red }}
        >
          {loadError}
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-12" style={{ color: c.txt3 }}>
            <span className="inline-block w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: c.blue, borderTopColor: "transparent" }} />
            <p className="text-sm font-semibold mt-2">Chargement…</p>
          </div>
        )}
        {!loading && displayed.length === 0 && (
          <div className="text-center py-12" style={{ color: c.txt3 }}>
            <ShoppingCart size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">
              {searchOrders || sourceFilter !== "all"
                ? "Aucune commande ne correspond à votre recherche."
                : t('no_orders_found') || "Aucune commande dans cet onglet"}
            </p>
          </div>
        )}
        {displayed.map(o => {
          const st = STATUS_META[o.status] || STATUS_META.new;
          const isNew        = o.status === "new";
          const isProcessing = o.status === "processing";
          const isReady      = o.status === "ready";
          const isCancelled  = o.status === "cancelled";
          const canRefuse    = isNew || isProcessing;

          return (
            <Card key={o.id} dk={dk} style={{
              padding: "16px 20px",
              borderColor: isNew ? c.blue + "44" : isCancelled ? c.red + "33" : undefined,
              boxShadow:   isNew ? `0 0 0 1px ${c.blue}22, 0 2px 12px ${c.blue}12`
                         : isCancelled ? `0 0 0 1px ${c.red}18` : undefined,
            }}>
              <div className="flex items-start gap-4 flex-wrap">

                {/* Icône source */}
                <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 gap-1"
                  style={{ background: isNew ? c.blue + "15" : "#000", border: isNew ? `1.5px solid ${c.blue}44` : "none" }}>
                  {o.source === "click_collect"
                    ? <Send size={22} style={{ color: isNew ? c.blue : "#fff" }} />
                    : <QrCode size={28} className="text-white" />
                  }
                  {o.source === "click_collect" && (
                    <span className="text-[8px] font-bold" style={{ color: isNew ? c.blue : "#fff9" }}>C&amp;C</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-48">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold" style={{ color: c.txt }}>{o.ref}</p>
                    <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
                    {o.cnas && <Badge color={c.blue} bg={c.blueLight}>CNAS</Badge>}
                    {o.source === "click_collect" && (
                      <Badge color="#7B5EA7" bg="#7B5EA718">Click &amp; Collect</Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: c.txt }}>
                    {o.patient}
                    <span className="font-normal ml-2" style={{ color: c.txt2 }}>— {t('doctor_role_prefix') || "Dr."} {o.doctor}</span>
                  </p>
                  <div className="space-y-0.5 mt-2">
                    {(o.items || []).map(item => (
                      <p key={item} className="text-sm" style={{ color: c.txt2 }}>• {item}</p>
                    ))}
                  </div>
                </div>

                {/* Right — total + actions */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold mb-0.5" style={{ color: c.blue }}>
                    {o.total.toLocaleString()} DZD
                  </p>
                  <p className="text-xs mb-3" style={{ color: c.txt3 }}>{o.date}</p>

                  <div className="flex flex-col gap-2">
                    {/* Nouvelle → Accepter & Préparer */}
                    {isNew && (
                      <button onClick={() => acceptOrder(o)} disabled={updatingId === o.id}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #304B71, #6492C9)" }}>
                        {updatingId === o.id
                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <><Check size={13} strokeWidth={3} /> Accepter &amp; Préparer</>}
                      </button>
                    )}

                    {/* En préparation → Marquer Prêt */}
                    {isProcessing && (
                      <button onClick={() => markReady(o)} disabled={updatingId === o.id}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                        style={{ background: c.green }}>
                        {updatingId === o.id
                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <><CheckCircle size={13} /> Marquer Prêt</>}
                      </button>
                    )}

                    {/* Refuser — visible sur new et processing */}
                    {canRefuse && (
                      <button
                        onClick={() => setRefuseModal(o)}
                        disabled={updatingId === o.id || refusingId === o.id}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                        style={{ background: "#E0555518", color: "#C0392B", border: "1px solid #E0555530" }}>
                        {refusingId === o.id
                          ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: "#C0392B", borderTopColor: "transparent" }} />
                          : <><X size={13} strokeWidth={3} /> Refuser</>}
                      </button>
                    )}

                    {/* Prêt → Récupéré */}
                    {isReady && (
                      <button onClick={() => markDelivered(o)} disabled={updatingId === o.id}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-60"
                        style={{ background: c.blueLight, color: c.txt2, border: `1px solid ${c.border}` }}>
                        {updatingId === o.id
                          ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: c.txt2, borderTopColor: "transparent" }} />
                          : <><Truck size={13} /> Récupéré</>}
                      </button>
                    )}

                    {/* Détails — toujours visible sauf si refusée */}
                    {!isCancelled && (
                      <button onClick={() => setSelectedOrder(o)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80 flex items-center justify-center gap-1.5"
                        style={{ borderColor: c.border, color: c.txt2 }}>
                        <Eye size={13} /> Détails
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bandeau "en attente" pour les nouvelles commandes */}
              {isNew && (
                <div className="mt-3 flex items-center gap-2 pt-3 border-t" style={{ borderColor: c.blue + "22" }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.blue }} />
                  <p className="text-xs font-semibold" style={{ color: c.blue }}>
                    Ordonnance reçue — en attente d'acceptation
                  </p>
                </div>
              )}
              {/* Bandeau motif de refus */}
              {isCancelled && (
                <div className="mt-3 flex items-start gap-2 pt-3 border-t" style={{ borderColor: c.red + "22" }}>
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: c.red }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: c.red }}>Ordonnance refusée</p>
                    {o.cancelReason && (
                      <p className="text-xs mt-0.5" style={{ color: c.txt2 }}>Motif : {o.cancelReason}</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

// ─── PAGE: STATISTIQUES ───────────────────────────────────────────────────────
function StatistiquesPage({ dk }) {
  const c = dk ? T.dark : T.light;
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await api.getPharmacyStats();
        if (!cancel) setStats(data || null);
      } catch (err) {
        if (!cancel) setLoadError(err?.message || "Erreur lors du chargement des statistiques.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const fmtDzd = (n) => `${Number(n || 0).toLocaleString("fr-FR")} DZD`;

  const kpisFromBackend = stats?.kpis ? [
    { label: t('orders_today_label') || "Commandes aujourd'hui", value: String(stats.kpis.today_orders ?? 0),         icon: ShoppingCart,  color: c.blue   },
    { label: t('daily_revenue_label') || "Revenu du jour",        value: fmtDzd(stats.kpis.today_revenue),             icon: DollarSign,    color: c.green  },
    { label: t('reimbursed_cnas_label') || "Remboursé CNAS",      value: fmtDzd(stats.kpis.cnas_amount),               icon: Shield,        color: "#7B5EA7" },
    { label: t('stock_alerts_count_label') || "Alertes stock",    value: String(stats.kpis.stock_alerts_count ?? 0),   icon: AlertTriangle, color: c.amber  },
  ] : null;

  const monthlyData = stats?.monthly_data || [];
  const maxVal = monthlyData.length
    ? Math.max(...monthlyData.map(m => Math.max(m.ventes, m.cnas)), 1)
    : 1;

  const topMeds = stats?.top_meds || [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: c.txt }}>{t('stats_title') || "Statistiques"}</h1>
        <p className="text-sm mt-0.5" style={{ color: c.txt2 }}>{t('stats_desc_pharmacist') || "Analyse des ventes et remboursements CNAS"}</p>
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-2.5 rounded-xl border text-sm font-semibold"
             style={{ background: c.red + "18", borderColor: c.red + "44", color: c.red }}>
          {loadError}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(kpisFromBackend || [
          { label: t('monthly_sales_label') || "Ventes ce mois",    value: loading ? "…" : "—", icon: DollarSign,    color: c.blue   },
          { label: t('reimbursed_cnas_label') || "Remboursé CNAS",  value: loading ? "…" : "—", icon: Shield,        color: c.green  },
          { label: t('prescriptions_processed_label') || "Ordonnances traitées", value: loading ? "…" : "—", icon: FileText, color: "#7B5EA7" },
          { label: t('unique_customers_label') || "Clients uniques",value: loading ? "…" : "—", icon: Users,         color: c.amber  },
        ]).map(s => <StatCard key={s.label} {...s} dk={dk} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Bar chart ventes vs CNAS */}
        <Card dk={dk}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold" style={{ color: c.txt }}>{t('sales_vs_cnas_title') || "Ventes vs Remboursements CNAS"}</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1" style={{ color: c.blue }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: c.blue }}></span> {t('sales_label') || "Ventes"}
              </span>
              <span className="flex items-center gap-1" style={{ color: c.green }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: c.green }}></span> CNAS
              </span>
            </div>
          </div>
          {monthlyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 gap-2">
              <BarChart2 size={32} style={{ color: c.txt3, opacity: 0.4 }} />
              <p className="text-sm font-medium" style={{ color: c.txt3 }}>Aucune vente sur les 6 derniers mois</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-44">
              {monthlyData.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5" style={{ height: 160 }}>
                    <div className="flex-1 rounded-t transition-all"
                      style={{ height: `${m.ventes / maxVal * 100}%`, background: c.blue, opacity: 0.85 }} />
                    <div className="flex-1 rounded-t transition-all"
                      style={{ height: `${m.cnas / maxVal * 100}%`, background: c.green, opacity: 0.85 }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: c.txt3 }}>{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top médicaments */}
        <Card dk={dk}>
          <h3 className="font-bold mb-5" style={{ color: c.txt }}>{t('top_meds_sold_title') || "Top médicaments vendus"}</h3>
          {topMeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Package size={32} style={{ color: c.txt3, opacity: 0.4 }} />
              <p className="text-sm font-medium" style={{ color: c.txt3 }}>Aucune commande livrée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topMeds.map(med => (
                <div key={med.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold" style={{ color: c.txt }}>{med.name}</p>
                    <span className="text-xs font-bold" style={{ color: med.color }}>{med.qty} unités</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: c.blueLight }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${med.pct}%`, background: med.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Catégories */}
        <Card dk={dk}>
          <h3 className="font-bold mb-4" style={{ color: c.txt }}>{t('category_distribution_title') || "Répartition par catégorie"}</h3>
          {(stats?.categories || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <BarChart2 size={32} style={{ color: c.txt3, opacity: 0.4 }} />
              <p className="text-sm font-medium" style={{ color: c.txt3 }}>Aucune donnée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(stats.categories).map((cat, i) => {
                const maxCount = Math.max(...stats.categories.map(c2 => c2.count), 1);
                const pct = Math.round((cat.count / maxCount) * 100);
                const COLORS = [c.blue, c.green, '#7B5EA7', c.amber, c.red];
                return (
                  <div key={cat.medication__category || i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold capitalize" style={{ color: c.txt }}>
                        {cat.medication__category || "Autre"}
                      </span>
                      <span className="text-xs font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                        {cat.count} réf. · {cat.total_qty} unités
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: c.blueLight }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

// ─── PAGE: PARAMÈTRES ─────────────────────────────────────────────────────────
function ParametresPage({ dk, onToggleDark }) {
  const c = dk ? T.dark : T.light;
  const { lang, setLang, t } = useLanguage();
  const { userData: user } = useAuth();

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
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

  const [locForm, setLocForm] = useState({
    address: "",
    commune: "",
    wilaya:  "",
    mapsUrl: "",
  });
  const [locSaved, setLocSaved] = useState(false);
  const [locError, setLocError] = useState("");

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
      setStatus({ type: "error", msg: "Erreur lors de la mise à jour" });
      setTimeout(() => setStatus({ type: "", msg: "" }), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls   = "w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all focus:ring-2";
  const inputStyle = { background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt };
  const labelCls   = "block text-xs font-bold uppercase tracking-wide mb-1.5";

  const handleSaveLocation = async () => {
    setLocError("");
    try {
      await api.updateMe({
        address: locForm.address || undefined,
        city:    locForm.commune || undefined,
        wilaya:  locForm.wilaya || undefined,
        maps_url: locForm.mapsUrl || undefined,
      });
      setLocSaved(true);
    } catch (err) {
      setLocError(err?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setTimeout(() => setLocSaved(false), 3000);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: c.txt }}>{t('pharmacist_settings_title')}</h1>
        <p className="text-sm mt-0.5" style={{ color: c.txt2 }}>{t('pharmacist_settings_desc')}</p>
      </div>

      {/* ── Top 2-col grid: Profil + Langue ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 items-start">
        <Card dk={dk}>
          <p className="font-semibold mb-5" style={{ color: c.txt }}>Profil</p>
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
            {isSaving ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </Card>

        <div className="flex flex-col gap-5">
          <Card dk={dk}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.blue + "18" }}>
                <Languages size={18} style={{ color: c.blue }} />
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: c.txt }}>{t('language')}</p>
                <p className="text-xs" style={{ color: c.txt3 }}>{t('choose_pref_lang') || "Choisissez votre langue de préférence"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {[
                { id: 'fr', label: 'Français' },
                { id: 'en', label: 'English' }
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className="flex-1 py-3 rounded-xl border font-semibold text-sm transition-all"
                  style={{
                    background: lang === l.id ? c.blue : 'transparent',
                    color: lang === l.id ? '#fff' : c.txt,
                    borderColor: lang === l.id ? c.blue : c.border
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </Card>

          <Card dk={dk}>
            <p className="font-semibold mb-3" style={{ color: c.txt }}>{t('cnas_conn_label') || "Connexion CNAS"}</p>
            <div className="flex items-center gap-3 p-3 rounded-xl mb-3"
              style={{ background: "#2D8C6F12", border: "1px solid #2D8C6F30" }}>
              <CheckCircle size={18} style={{ color: c.green }} />
              <p className="text-sm font-semibold" style={{ color: c.green }}>{t('connected_status') || "Connecté"} — {t('cnas_connected_desc') || "Conventionné"}</p>
            </div>
            <p className="text-xs" style={{ color: c.txt3 }}>{t('last_sync_prefix') || "Dernière sync :"} Aujourd'hui 08:32</p>
          </Card>
        </div>
      </div>

      {/* ── Clinic Location & Maps ── */}
      <Card dk={dk} className="mb-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.blue + "18" }}>
            <MapPin size={18} style={{ color: c.blue }} />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: c.txt }}>{t('clinic_location_title')}</p>
            <p className="text-xs" style={{ color: c.txt3 }}>{t('clinic_location_desc')}</p>
          </div>
        </div>

        {locSaved && (
          <div className="mb-5 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{ background: "#2D8C6F12", color: "#2D8C6F", border: "1px solid #2D8C6F44" }}>
            <Check size={14} /> {t('location_updated_success') || "Localisation mise à jour avec succès"}
          </div>
        )}
        {locError && (
          <div className="mb-5 p-3 rounded-xl text-xs font-semibold"
            style={{ background: "#E0555518", color: "#E05555", border: "1px solid #E0555544" }}>
            {locError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left : formulaire */}
          <div className="space-y-5">
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>{t('address_label')}</label>
              <input type="text" placeholder="Ex: 12 Rue Didouche Mourad"
                value={locForm.address}
                onChange={e => setLocForm(f => ({ ...f, address: e.target.value }))}
                className={inputCls} style={inputStyle} />
            </div>

            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>{t('commune_label')}</label>
              <input type="text" placeholder="Ex: Alger-Centre"
                value={locForm.commune}
                onChange={e => setLocForm(f => ({ ...f, commune: e.target.value }))}
                className={inputCls} style={inputStyle} />
            </div>

            {/* Wilaya — DashSelect */}
            <DashSelect
              label={t('wilaya_label')} value={locForm.wilaya} options={WILAYAS_LIST}
              onSelect={v => setLocForm(f => ({ ...f, wilaya: v }))}
              dk={dk} c={c} />

            {/* Lien Google Maps */}
            <div>
              <label className={labelCls} style={{ color: c.txt2 }}>{t('maps_link_label')}</label>
              <div className="relative">
                <input type="text" placeholder={t('maps_link_placeholder')}
                  value={locForm.mapsUrl}
                  onChange={e => setLocForm(f => ({ ...f, mapsUrl: e.target.value }))}
                  className={`${inputCls} pl-10`} style={inputStyle} />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.txt3 }}>
                  <Link2 size={15} />
                </div>
              </div>
            </div>

            <button onClick={handleSaveLocation}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, #304B71, ${c.blue})` }}>
              <MapPin size={15} /> {t('update_map_btn')}
            </button>
          </div>

          {/* Right : Map Preview avec Smart Parser */}
          <div className="flex flex-col gap-3">
            <label className={labelCls} style={{ color: c.txt2 }}>{t('map_preview_label') || "Map Preview"}</label>
            {(() => {
              const addressQuery = [locForm.address, locForm.commune, locForm.wilaya]
                .filter(Boolean).join(", ");
              let embedSrc = null;
              let openUrl  = locForm.mapsUrl || null;

              if (locForm.mapsUrl) {
                if (locForm.mapsUrl.includes("output=embed") || locForm.mapsUrl.includes("/embed")) {
                  embedSrc = locForm.mapsUrl;
                } else {
                  const rawCoord  = locForm.mapsUrl.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
                  const coordMatch = locForm.mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                  const placeMatch = locForm.mapsUrl.match(/\/place\/([^\/]+)/);
                  if (rawCoord)
                    embedSrc = `https://maps.google.com/maps?q=${rawCoord[1]},${rawCoord[2]}&hl=fr&z=15&output=embed`;
                  else if (coordMatch)
                    embedSrc = `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&hl=fr&z=15&output=embed`;
                  else if (placeMatch)
                    embedSrc = `https://maps.google.com/maps?q=${placeMatch[1]}&hl=fr&z=15&output=embed`;
                  else
                    embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(locForm.mapsUrl)}&hl=fr&z=15&output=embed`;
                }
              } else if (addressQuery) {
                embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}&hl=fr&z=15&output=embed`;
                openUrl  = `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}`;
              }

              return embedSrc ? (
                <div className="relative flex-1 min-h-[280px] rounded-2xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: c.blue + "55", background: c.card }}>
                  <iframe
                    key={embedSrc} title="Map Preview" src={embedSrc}
                    width="100%" height="100%"
                    style={{ border: 0, minHeight: 280, display: "block" }}
                    allowFullScreen="" loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade" />
                  {openUrl && (
                    <a href={openUrl} target="_blank" rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:opacity-90"
                      style={{ background: c.blue }}>
                      <MapPin size={12} /> {t('open_in_maps_btn') || "Ouvrir dans Maps"}
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex-1 min-h-[280px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
                  style={{ background: dk ? "#0D1117" : "#F4F8FB", borderColor: c.border }}>
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: c.blue + "18" }}>
                      <MapPin size={28} style={{ color: c.blue }} />
                    </div>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{ background: c.blue }} />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-bold" style={{ color: c.txt }}>{t('map_preview_label') || "Map Preview"}</p>
                    <p className="text-xs mt-1" style={{ color: c.txt3 }}>
                      {t('map_preview_desc') || "Collez une URL Maps ou entrez votre adresse"}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* ── À propos ── */}
      <Card dk={dk}>
        <p className="font-semibold mb-2" style={{ color: c.txt }}>{t('about_label') || "À propos"}</p>
        <p className="text-sm" style={{ color: c.txt2 }}>Healy {t('pharmacy_view_label', {context: 'dash'}) || "Pharmacie"} v2.1.0</p>
        <p className="text-xs mt-1" style={{ color: c.txt3 }}>{t('hosted_in_algeria') || "CNAS Certifié · Hébergé en Algérie"}</p>
      </Card>

      <div className="mt-5">
        <ContactAdminCard dk={dk} />
      </div>
    </>
  );
}

// ─── PAGE: NOTIFICATIONS ─────────────────────────────────────────────────────
function NotificationsPage({ dk, notifications, onMarkRead, onMarkAllRead }) {
  const c = dk ? T.dark : T.light;

  const TYPE_META = {
    appointment: { label: "Rendez-vous", color: "#6492C9", bg: "#6492C918" },
    pharmacy:    { label: "Pharmacie",   color: "#2D8C6F", bg: "#2D8C6F18" },
    caretaker:   { label: "Aidant",      color: "#7B5EA7", bg: "#7B5EA718" },
    system:      { label: "Système",     color: "#E8A838", bg: "#E8A83818" },
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: c.txt }}>Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: c.txt2 }}>
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Toutes lues"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
            style={{ borderColor: c.border, color: c.txt2 }}
          >
            <Check size={14} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card dk={dk} empty>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.blueLight }}>
              <Bell size={28} style={{ color: c.blue }} />
            </div>
            <p className="text-sm font-medium" style={{ color: c.txt3 }}>Aucune notification</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const type = notif.notification_type || notif.type || "system";
            const meta = TYPE_META[type] || TYPE_META.system;
            return (
              <Card key={notif.id} dk={dk} style={{
                padding: "14px 18px",
                opacity: notif.is_read ? 0.7 : 1,
                borderColor: notif.is_read ? c.border : meta.color + "44",
              }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: meta.bg }}>
                    <Bell size={15} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge color={meta.color} bg={meta.bg}>{meta.label}</Badge>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                      )}
                      <span className="text-xs ml-auto" style={{ color: c.txt3 }}>{fmtDate(notif.created_at)}</span>
                    </div>
                    {notif.title && (
                      <p className="text-sm font-semibold mb-0.5" style={{ color: c.txt }}>{notif.title}</p>
                    )}
                    {notif.message && (
                      <p className="text-sm" style={{ color: c.txt2 }}>{notif.message}</p>
                    )}
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={() => onMarkRead(notif.id)}
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-colors hover:opacity-70"
                      style={{ borderColor: meta.color + "55", color: meta.color }}
                      title="Marquer comme lu"
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── MESSAGES PAGE (layout 30/70) ────────────────────────────────────────────
function MessagesPage({ dk, c, chatConvOpen, setChatConvOpen, activeChatConv, setActiveChatConv, setUnreadChatCount }) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-5 h-[calc(100vh-120px)] min-h-[500px]">
      {/* ConversationList — 30% */}
      <div
        className="rounded-2xl border overflow-hidden shrink-0 flex flex-col"
        style={{ width: "30%", minWidth: 260, background: c.card, borderColor: c.border }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0" style={{ borderColor: c.border }}>
          <MessageSquare size={15} style={{ color: c.blue }} />
          <h2 className="font-bold text-sm" style={{ color: c.txt }}>{t('nav_messages') || "Messages"}</h2>
        </div>
        {/* Liste inline (toujours visible, pas de toggle) */}
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
              {t('select_conversation_desc') || "Sélectionnez une conversation"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN SHELL ───────────────────────────────────────────────────────────────
export default function PharmacistDashboard({ onLogout, initialScanToken }) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { userData } = useAuth();
  const dk = theme === "dark";
  const [page, setPage] = useState(initialScanToken ? "commandes" : "accueil");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifCount = notifications.filter(n => !n.is_read).length;

  const loadNotifications = () => {
    api.getNotifications().then(data => {
      const list = Array.isArray(data) ? data : (data?.results || []);
      setNotifications(list);
    }).catch(() => {});
  };

  useEffect(() => { loadNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };
  const c = dk ? T.dark : T.light;

  const pharmacyName =
    userData?.pharmacy_name ||
    userData?.pharmacy?.name ||
    (userData?.first_name || userData?.last_name
      ? `${userData?.first_name || ""} ${userData?.last_name || ""}`.trim()
      : "El Shifa Pharmacy");
  const pharmacyCity = userData?.wilaya || userData?.city || "Alger";
  const pharmacyInitials =
    (pharmacyName.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "ES").slice(0, 2);

  // ── Chat state ──
  const [chatConvOpen, setChatConvOpen] = useState(false);
  const [activeChatConv, setActiveChatConv] = useState(null);
  const { unreadChatCount, setUnreadChatCount } = useData();

  // Badge commandes dynamique
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  useEffect(() => {
    api.getPharmacyOrders().catch(() => []).then(data => {
      const list = Array.isArray(data) ? data : (data?.results || []);
      setPendingOrdersCount(list.filter(o => o.status === "pending").length);
    });
  }, []);

  const NAV = [
    { id: "accueil",      label: t('nav_home')  || "Accueil"      },
    { id: "commandes",    label: t('nav_orders') || "Commandes",   badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    { id: "stock",        label: t('nav_stock')  || "Stock"        },
    { id: "statistiques", label: t('nav_stats')  || "Statistiques" },
  ];

  const renderPage = () => {
    switch (page) {
      case "accueil":      return <HomePage dk={dk} onNav={setPage} />;
      case "commandes":    return <CommandesPage dk={dk} initialScanToken={initialScanToken} />;
      case "stock":        return <StockPage dk={dk} />;
      case "statistiques": return <StatistiquesPage dk={dk} />;
      case "parametres":   return <ParametresPage dk={dk} onToggleDark={toggleTheme} />;
      case "messages":       return <MessagesPage dk={dk} c={c}
                                    chatConvOpen={chatConvOpen}
                                    setChatConvOpen={setChatConvOpen}
                                    activeChatConv={activeChatConv}
                                    setActiveChatConv={setActiveChatConv}
                                    setUnreadChatCount={setUnreadChatCount} />;
      case "notifications":  return <NotificationsPage dk={dk} notifications={notifications} onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} />;
      default:               return <HomePage dk={dk} onNav={setPage} />;
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: c.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", color: c.txt, transition: "background 0.3s, color 0.2s" }}>
      <ParticlesHero darkMode={dk} />
      <div className="relative z-10">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { transition: background-color 0.2s, border-color 0.2s; }
        button { cursor: pointer !important; }
        select { cursor: pointer !important; }
        label  { cursor: pointer !important; }
        .nav-link:not(.active-nav):hover { background: rgba(100,146,201,0.15) !important; color: #6492C9 !important; }
        @keyframes dropdownIn { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .pd-item { color:#64748B; background:transparent; transition:background 0.15s,color 0.15s; }
        .pd-item:hover { background:#F8FAFC; color:#1E293B; }
        .pd-item-danger { color:#EF4444; background:transparent; transition:background 0.15s; }
        .pd-item-danger:hover { background:rgba(239,68,68,0.08); }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav className="sticky top-0 z-30 border-b shadow-sm" style={{ background: c.nav, borderColor: c.border }}>
        <div className="w-full px-6 h-[60px] flex items-center gap-3">

          {/* Logo */}
          <div className="flex items-center shrink-0 mr-2">
            <img src="/healy-logo.svg" alt="Healy" className="h-9 w-auto" />
          </div>

          {/* Nav links */}
          <div className="hidden lg:flex items-center justify-center gap-2 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => setPage(item.id)}
                className={`nav-link${page === item.id ? " active-nav" : ""} relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all`}
                style={{ color: page === item.id ? "#fff" : c.txt2, background: page === item.id ? c.blue : "transparent" }}>
                {item.label}
                {item.badge && (
                  <span className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ background: c.red }}>{item.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 ml-auto shrink-0">

            {/* Messages Icon Button */}
            <button
              onClick={() => setPage("messages")}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-blue-50 dark:hover:bg-white/5 border"
              style={{ 
                borderColor: page === "messages" ? c.blue + "44" : c.border, 
                background: page === "messages" ? c.blue + "11" : "transparent" 
              }}
              title={t('nav_messages') || "Messages"}
            >
              <MessageSquare size={18} style={{ color: page === "messages" ? c.blue : c.txt2 }} />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: c.red, fontSize: 9 }}>
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </span>
              )}
            </button>
            {/* Profile */}
            <div className="relative">
              {notifCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 z-10 flex items-center justify-center"
                  style={{ borderColor: c.nav, fontSize: 7, color: "#fff", fontWeight: 800, pointerEvents: "none" }}>
                  {notifCount}
                </div>
              )}
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:opacity-80"
                style={{ border: `1px solid ${c.border}`, background: "transparent" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, #2D8C6F, #3aaa88)" }}>
                  {pharmacyInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold leading-tight" style={{ color: c.txt }}>{pharmacyName}</p>
                  <p className="text-xs" style={{ color: c.txt3 }}>{t('pharmacist_role_label') || "Pharmacien"} · {pharmacyCity}</p>
                </div>
                <ChevronDown size={13} style={{ color: c.txt3 }} />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-12 w-60 rounded-[20px] overflow-hidden z-50"
                  style={{ background: dk ? c.card : "#ffffff", border: `1px solid ${dk ? c.border : "#F1F5F9"}`,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.12)", animation: "dropdownIn 0.2s ease forwards" }}>

                  <div className="px-4 py-3 border-b" style={{ borderColor: dk ? c.border : "#F1F5F9" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg, #2D8C6F, #3aaa88)" }}>{pharmacyInitials}</div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: c.txt }}>{pharmacyName}</p>
                        <p className="text-xs" style={{ color: c.txt3 }}>{t('pharmacist_role_label') || "Pharmacien"} · {t('cnas_connected_desc') || "CNAS Conventionné"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-1">
                    <button onClick={() => { setProfileOpen(false); setPage("notifications"); }}
                      className="pd-item w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl cursor-pointer">
                      <Bell size={16} />
                      Notifications
                      {notifCount > 0 && (
                        <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "#E05555", color: "#fff" }}>{notifCount}</span>
                      )}
                    </button>
                    <button onClick={() => { setPage("parametres"); setProfileOpen(false); }}
                      className="pd-item w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl cursor-pointer">
                      <Settings size={16} /> {t('nav_settings') || "Paramètres"}
                    </button>

                    {/* Dark mode */}
                    <div className="pd-item w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl cursor-pointer" onClick={toggleTheme}>
                      <Sun size={14} style={{ color: dk ? c.txt3 : "#E8A838" }} />
                      <div
                        className="relative rounded-full transition-all duration-300"
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
                      </div>
                      <Moon size={13} style={{ color: dk ? c.blue : c.txt3 }} />
                    </div>

                    <div className="h-px my-1 mx-2" style={{ background: dk ? c.border : "#F1F5F9" }} />
                    <button onClick={onLogout}
                      className="pd-item-danger w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl cursor-pointer">
                      <LogOut size={16} /> {t('logout_btn')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu */}
            <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: c.txt2 }} onClick={() => setMobileMenu(!mobileMenu)}>
              <Menu size={17} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenu && (
          <div className="lg:hidden border-t px-4 py-3 flex flex-wrap gap-2"
            style={{ borderColor: c.border, background: c.nav }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => { setPage(item.id); setMobileMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ color: page === item.id ? "#fff" : c.txt2, background: page === item.id ? c.blue : "transparent" }}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Page */}
      <main className="w-full px-6 py-6"><ErrorBoundary>{renderPage()}</ErrorBoundary></main>

      {profileOpen && <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />}
    </div>
    </div>
  );
}
