// Drawer de validation d'inscription — affiche toutes les données pour tous les rôles
import { useState } from "react";
import {
  X, User, Mail, Phone, MapPin, FileText, Image, ExternalLink,
  Stethoscope, Pill, Users, ShieldCheck, AlertCircle, CheckCircle2,
  CreditCard, Calendar, Flag, Home, Hash, Award, Building2, Clock,
  BadgeCheck, Lock, Unlock, Edit3,
} from "lucide-react";
import { getAdminTheme } from "../../adminTheme.js";

// ── helpers ────────────────────────────────────────────────────────────────────

function Field({ label, value, icon: Icon, c, wide = false }) {
  return (
    <div className={`space-y-1 ${wide ? "col-span-2" : ""}`}>
      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1" style={{ color: c.txt }}>
        {Icon && <Icon size={10} />} {label}
      </label>
      <div className="w-full px-3 py-2 rounded-xl text-sm border"
        style={{ background: c.card, borderColor: c.border, color: value ? c.txt : c.txt3 }}>
        {value || <span className="italic opacity-40 text-xs">—</span>}
      </div>
    </div>
  );
}

function DocCard({ doc, c }) {
  const isImage = doc.url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(doc.url);
  const hasPdf  = doc.url && /\.pdf(\?|$)/i.test(doc.url);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: c.border, background: c.card }}>
      {/* Preview zone */}
      <div className="relative h-36 flex items-center justify-center"
        style={{ background: c.header }}>
        {isImage ? (
          <img src={doc.url} alt={doc.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-40">
            <FileText size={36} style={{ color: c.txt3 }} />
            <span className="text-[10px] uppercase font-bold" style={{ color: c.txt3 }}>
              {hasPdf ? "PDF" : "Fichier"}
            </span>
          </div>
        )}
        {doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 p-1.5 rounded-lg text-white text-[10px] font-bold flex items-center gap-1 shadow"
            style={{ background: c.blue }}
          >
            <ExternalLink size={11} /> Ouvrir
          </a>
        )}
      </div>
      {/* Label */}
      <div className="px-3 py-2">
        <p className="text-xs font-bold truncate" style={{ color: c.txt }}>{doc.title}</p>
        {doc.subtitle && <p className="text-[10px] opacity-50 mt-0.5 truncate" style={{ color: c.txt3 }}>{doc.subtitle}</p>}
        {!doc.url && <p className="text-[10px] text-red-400 mt-0.5">Fichier non disponible</p>}
      </div>
    </div>
  );
}

// ── Sex / date formatting ──────────────────────────────────────────────────────

const SEX_LABEL = { male: "Masculin", female: "Féminin" };

function fmtDate(d) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString("fr-DZ"); } catch { return d; }
}

function fmtBool(v) {
  if (v === true || v === "true") return "Oui";
  if (v === false || v === "false") return "Non";
  return null;
}

// ── Role badge ─────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  doctor:     { label: "Médecin",      Icon: Stethoscope, color: "#638ECB" },
  pharmacist: { label: "Pharmacien",   Icon: Pill,        color: "#4CAF82" },
  caretaker:  { label: "Garde-malade", Icon: Users,       color: "#9B7FD4" },
  patient:    { label: "Patient",      Icon: User,        color: "#F59E0B" },
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────

export default function RegistrationDrawer({
  user,
  dk,
  onClose,
  onEdit,
  onVerify,
  onToggleStatus,
}) {
  const c = getAdminTheme(dk ?? true);
  const [tab, setTab] = useState("identity");

  const role   = user.role || "patient";
  const rc     = ROLE_CONFIG[role] || ROLE_CONFIG.patient;
  const detail = user.doctor_detail || user.pharmacist_detail || user.caretaker_detail || null;
  const docs   = user.submitted_documents || [];

  const TABS = [
    { id: "identity",     label: "Identité",      icon: User },
    { id: "registration", label: "Inscription",    icon: BadgeCheck },
    { id: "documents",    label: `Documents (${docs.length})`, icon: FileText },
  ];

  // ── Identity tab ─────────────────────────────────────────────────────────────
  function renderIdentity() {
    return (
      <div className="space-y-4">
        {/* Pending banner */}
        {user.verification_status === "pending" && (
          <div className="p-4 rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 flex flex-col items-center gap-2 text-center">
            <AlertCircle className="text-amber-500" size={22} />
            <p className="text-xs font-black uppercase tracking-widest text-amber-500">En attente de validation</p>
            {onVerify && (
              <button
                onClick={onVerify}
                className="px-6 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide active:scale-95 transition-all"
                style={{ background: "#F59E0B" }}
              >
                Approuver le compte
              </button>
            )}
          </div>
        )}
        {user.verification_status === "verified" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-xs font-bold text-emerald-500">Compte vérifié</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom"  value={user.first_name}  icon={User}     c={c} />
          <Field label="Nom"     value={user.last_name}   icon={User}     c={c} />
          <Field label="Email"   value={user.email}       icon={Mail}     c={c} wide />
          <Field label="Téléphone" value={user.phone}     icon={Phone}    c={c} />
          <Field label="Sexe"    value={SEX_LABEL[user.sex] || user.sex}  icon={User} c={c} />
          <Field label="Date de naissance" value={fmtDate(user.date_of_birth)} icon={Calendar} c={c} />
          <Field label="N° pièce d'identité" value={user.id_card_number}  icon={CreditCard} c={c} wide />
          <Field label="Adresse" value={user.address}     icon={Home}     c={c} wide />
          <Field label="Ville"   value={user.city}        icon={MapPin}   c={c} />
          <Field label="Wilaya"  value={user.wilaya}      icon={Flag}     c={c} />
          <Field label="Code postal" value={user.postal_code} icon={Hash} c={c} />
          <Field label="Rôle"    value={rc.label}         icon={rc.Icon}  c={c} />
        </div>
        {/* Status */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border mt-1"
          style={{ background: c.header, borderColor: c.border }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: user.is_active ? c.green : c.red }} />
          <span className="text-sm font-semibold" style={{ color: user.is_active ? c.green : c.red }}>
            {user.is_active ? "Compte actif" : "Compte suspendu"}
          </span>
        </div>
      </div>
    );
  }

  // ── Registration tab (role-specific) ─────────────────────────────────────────
  function renderRegistration() {
    if (!detail && role === "patient") {
      const pd = user.patient_detail || {};
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Groupe sanguin" value={pd.blood_group} icon={ShieldCheck} c={c} />
          <Field label="Taille (cm)"   value={pd.height}       icon={User}         c={c} />
          <Field label="Poids (kg)"    value={pd.weight}       icon={User}         c={c} />
        </div>
      );
    }

    if (role === "doctor" && user.doctor_detail) {
      const d = user.doctor_detail;
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Spécialité"      value={d.specialty}         icon={Stethoscope} c={c} wide />
          <Field label="N° Ordre"        value={d.order_number}      icon={Hash}        c={c} />
          <Field label="Expérience"      value={d.experience_years ? `${d.experience_years} ans` : null} icon={Clock} c={c} />
          <Field label="Établissement"   value={d.clinic_name}       icon={Building2}   c={c} wide />
          <Field label="Tarif consultation" value={d.consultation_fee ? `${d.consultation_fee} DZD` : null} icon={CreditCard} c={c} />
          <Field label="Convention CNAS" value={fmtBool(d.cnas_coverage)} icon={ShieldCheck} c={c} />
          {d.bio && <Field label="Bio" value={d.bio} icon={FileText} c={c} wide />}
        </div>
      );
    }

    if (role === "pharmacist" && user.pharmacist_detail) {
      const d = user.pharmacist_detail;
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="N° Ordre inscription"  value={d.order_registration_number} icon={Hash}       c={c} wide />
          <Field label="Nom de la pharmacie"   value={d.pharmacy_name}             icon={Building2}  c={c} wide />
          <Field label="N° Agrément"           value={d.agreement_number}          icon={BadgeCheck} c={c} />
          <Field label="Convention CNAS"       value={fmtBool(d.cnas_coverage)}    icon={ShieldCheck} c={c} />
        </div>
      );
    }

    if (role === "caretaker" && user.caretaker_detail) {
      const d = user.caretaker_detail;
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expérience"       value={d.experience_years ? `${d.experience_years} ans` : null} icon={Clock}    c={c} />
          <Field label="Zone d'activité"  value={d.availability_area}  icon={MapPin}     c={c} />
          <Field label="Tarif de base"    value={d.tarif_de_base ? `${d.tarif_de_base} DZD/h` : null} icon={CreditCard} c={c} />
          <Field label="Certification"    value={d.certification}      icon={Award}      c={c} wide />
        </div>
      );
    }

    return (
      <p className="text-xs italic opacity-40 text-center py-10" style={{ color: c.txt3 }}>
        Aucune information professionnelle disponible.
      </p>
    );
  }

  // ── Documents tab ─────────────────────────────────────────────────────────────
  function renderDocuments() {
    if (docs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
          <FileText size={36} style={{ color: c.txt3 }} />
          <p className="text-xs italic" style={{ color: c.txt3 }}>Aucun document soumis</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3">
        {docs.map((doc, i) => <DocCard key={i} doc={doc} c={c} />)}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ background: c.card, borderColor: c.border }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center shrink-0" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-lg"
              style={{ background: rc.color }}>
              {user.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("") || "?"}
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: c.txt }}>
                {user.full_name}
              </h3>
              <p className="text-[10px] font-bold opacity-40 uppercase">
                {rc.label} · #{user.id}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: c.txt3 }} className="p-2 hover:bg-black/5 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-2 border-b shrink-0" style={{ borderColor: c.border, background: dk ? "rgba(0,0,0,0.1)" : "#fcfcfc" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-3 text-xs font-bold flex items-center gap-2 transition-all border-b-2"
              style={{ color: tab === t.id ? c.blue : c.txt3, borderColor: tab === t.id ? c.blue : "transparent" }}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "identity"     && renderIdentity()}
          {tab === "registration" && renderRegistration()}
          {tab === "documents"    && renderDocuments()}
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex gap-3 shrink-0" style={{ borderColor: c.border }}>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{ background: c.blue }}
            >
              <Edit3 size={14} /> Modifier
            </button>
          )}
          {onToggleStatus && (
            <button
              onClick={onToggleStatus}
              className="flex-1 py-3 rounded-xl text-xs font-bold border transition-all hover:opacity-80 flex items-center justify-center gap-2"
              style={{ borderColor: user.is_active ? c.red : c.green, color: user.is_active ? c.red : c.green }}
            >
              {user.is_active
                ? <><Lock size={14} /> Suspendre</>
                : <><Unlock size={14} /> Réactiver</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
