// src/pages/admin/views/users/PatientsView.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, User,
  Lock, Unlock, Edit3,
  Search, RefreshCw, Activity,
  Heart, Clock, CheckCircle2, MoreVertical, Download
} from "lucide-react";
import { getAdminTheme } from "../../adminTheme.js";
import { Card } from "../../AdminPrimitives.jsx";
import RegistrationDrawer from "./RegistrationDrawer";
import { useLanguage } from "../../../../context/LanguageContext";
import * as api from "../../../../services/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/api$/, "");

function docUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

function DocImage({ url, label, c }) {
  const src = docUrl(url);
  if (!src) return (
    <div className="w-full h-28 rounded-xl border flex items-center justify-center text-xs italic"
      style={{ borderColor: c.border, background: c.row, color: c.txt3 }}>
      Non fourni
    </div>
  );
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block group">
      <img
        src={src}
        alt={label}
        className="w-full h-28 object-cover rounded-xl border group-hover:opacity-80 transition-opacity"
        style={{ borderColor: c.border }}
        onError={e => {
          e.currentTarget.style.display = "none";
          e.currentTarget.nextSibling.style.display = "flex";
        }}
      />
      <div className="w-full h-28 rounded-xl border hidden items-center justify-center text-xs font-semibold"
        style={{ borderColor: c.blue, background: `${c.blue}10`, color: c.blue }}>
        Voir le document ↗
      </div>
    </a>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

export function EditPatientModal({ patient, dk, onSave, onClose }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk);
  const [activeTab, setActiveTab] = useState("account");
  const [form, setForm] = useState({
    first_name:     patient.first_name     || "",
    last_name:      patient.last_name      || "",
    email:          patient.email          || "",
    phone:          patient.phone          || "",
    wilaya:         patient.wilaya         || "",
    address:        patient.address        || "",
    city:           patient.city           || "",
    postal_code:    patient.postal_code    || "",
    date_of_birth:  patient.date_of_birth  || "",
    id_card_number: patient.id_card_number || "",
    blood_group:    patient.blood_group    || patient.blood_type || "",
    height:         patient.height         || "",
    weight:         patient.weight         || "",
  });

  const field = (label, key, type = "text", placeholder = "") => (
    <div key={key} className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: c.txt }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all focus:ring-2"
        style={{
          background: dk ? "rgba(255,255,255,0.03)" : "#F8FAFC",
          borderColor: c.border,
          color: c.txt,
          "--tw-ring-color": c.blue + "30"
        }}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card dk={dk} className="w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: c.border }}>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: c.txt }}>{t('patient_control')}</h3>
            <p className="text-[10px] font-bold opacity-40 uppercase">{patient.full_name} (#{patient.id})</p>
          </div>
          <button onClick={onClose} style={{ color: c.txt3 }} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
        </div>

        <div className="flex px-2 border-b" style={{ borderColor: c.border, background: dk ? "rgba(0,0,0,0.1)" : "#fcfcfc" }}>
          {[
            { id: "account", label: t('account_contact'), icon: User },
            { id: "medical", label: t('medical_profile_tab'), icon: Heart },
            { id: "history", label: t('appointment_history_tab'), icon: Clock },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 text-xs font-bold flex items-center gap-2 transition-all border-b-2"
              style={{ color: activeTab === tab.id ? c.blue : c.txt3, borderColor: activeTab === tab.id ? c.blue : "transparent" }}>
              <tab.icon size={14} />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "account" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {field(t('first_name_label'), "first_name")}
              {field(t('last_name_label'), "last_name")}
              {field(t('email_address'), "email", "email")}
              {field(t('phone_number'), "phone")}
              {field("Date de naissance", "date_of_birth", "text", "AAAA-MM-JJ")}
              {field("N° pièce d'identité", "id_card_number")}
              {field("Adresse", "address")}
              {field("Ville", "city")}
              {field("Code postal", "postal_code")}
              <div className="md:col-span-2">{field(t('wilaya_residence'), "wilaya")}</div>
            </div>
          )}
          {activeTab === "medical" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {field("Groupe sanguin", "blood_group", "text", "Ex: A+, O-")}
              {field("Taille (cm)", "height", "number")}
              {field("Poids (kg)", "weight", "number")}
              <div className="md:col-span-2 p-3 rounded-xl text-xs border" style={{ background: "#4A6FA510", borderColor: "#4A6FA530", color: "#4A6FA5" }}>
                Les allergies, maladies chroniques et médicaments sont gérés par les médecins lors des consultations.
              </div>
            </div>
          )}
          {activeTab === "history" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/10">
                <p className="text-xs font-bold text-blue-500 mb-2">Note de l'administrateur</p>
                <p className="text-xs opacity-70 leading-relaxed">Les informations ci-dessous proviennent des dossiers remplis par les praticiens lors des consultations.</p>
              </div>
              <div className="space-y-2 opacity-50 italic text-center py-10 text-xs">
                Aucun antécédent médical externe disponible pour le moment.
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex gap-3" style={{ borderColor: c.border }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-xs font-bold border transition-all hover:bg-black/5" style={{ borderColor: c.border, color: c.txt2 }}>{t('cancel_appointment')}</button>
          <button onClick={() => onSave(form)} className="flex-1 py-3 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]" style={{ background: c.blue }}>
             {t('save_changes_btn')}
          </button>
        </div>
      </Card>
    </div>
  );
}

export function PatientDrawer({ patient, dk, onClose, onEdit, onToggleStatus }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk);
  const [activeTab, setActiveTab] = useState("account");

  const field = (label, value) => (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: c.txt }}>{label}</label>
      <div
        className="w-full px-4 py-2.5 rounded-xl text-sm border"
        style={{
          background: dk ? "rgba(255,255,255,0.03)" : "#F8FAFC",
          borderColor: c.border,
          color: value ? c.txt : c.txt3,
        }}
      >
        {value || <span className="italic opacity-50">{t('not_specified')}</span>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <Card dk={dk} className="w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-black bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
              {patient.full_name?.split(" ").map(n => n[0]).slice(0,2).join("") || "?"}
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: c.txt }}>
                {patient.full_name}
              </h3>
              <p className="text-[10px] font-bold opacity-40 uppercase">Patient · #{patient.id}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: c.txt3 }} className="p-2 hover:bg-black/5 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex px-2 border-b" style={{ borderColor: c.border, background: dk ? "rgba(0,0,0,0.1)" : "#fcfcfc" }}>
          {[
            { id: "account",  label: t('account_contact'),       icon: User },
            { id: "medical",  label: t('medical_profile_tab'),    icon: Heart },
            { id: "documents",label: "Documents",                 icon: Activity },
            { id: "history",  label: t('appointment_history_tab'),icon: Clock },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 text-xs font-bold flex items-center gap-2 transition-all border-b-2"
              style={{ color: activeTab === tab.id ? c.blue : c.txt3, borderColor: activeTab === tab.id ? c.blue : "transparent" }}>
              <tab.icon size={14} />{tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "account" && (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-4">
                {field(t('first_name_label'), patient.first_name)}
                {field(t('last_name_label'),  patient.last_name)}
              </div>
              {field(t('email_address'), patient.email)}
              <div className="grid grid-cols-2 gap-4">
                {field(t('phone_number'), patient.phone)}
                {field("Date de naissance", patient.date_of_birth)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {field("Sexe", patient.sex === "male" ? "Masculin" : patient.sex === "female" ? "Féminin" : patient.sex)}
                {field("N° pièce d'identité", patient.id_card_number)}
              </div>
              {field("Adresse", patient.address)}
              <div className="grid grid-cols-3 gap-4">
                {field("Code postal", patient.postal_code)}
                {field("Ville", patient.city)}
                {field(t('wilaya_residence'), patient.wilaya)}
              </div>
              <div className="mt-2 pt-3 border-t" style={{ borderColor: c.border }}>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 block mb-2" style={{ color: c.txt }}>Statut du compte</label>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
                  style={{ background: dk ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderColor: c.border }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: patient.is_active ? c.green : c.red }} />
                  <span className="text-sm font-semibold" style={{ color: patient.is_active ? c.green : c.red }}>
                    {patient.is_active ? t('active_status') : t('suspended_status')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "medical" && (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-3 gap-4">
                {field("Groupe sanguin", patient.blood_group)}
                {field("Taille (cm)", patient.height ? `${patient.height} cm` : null)}
                {field("Poids (kg)", patient.weight ? `${patient.weight} kg` : null)}
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2" style={{ color: c.txt }}>Photo de profil</p>
                <div className="w-24 h-24">
                  {docUrl(patient.photo_url) ? (
                    <a href={docUrl(patient.photo_url)} target="_blank" rel="noreferrer">
                      <img src={docUrl(patient.photo_url)} alt="Photo"
                        className="w-24 h-24 rounded-2xl object-cover border hover:opacity-80 transition-opacity"
                        style={{ borderColor: c.border }}
                        onError={e => { e.currentTarget.parentElement.innerHTML = '<span style="font-size:11px;color:var(--c-txt3)">Non disponible</span>'; }}
                      />
                    </a>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl border flex items-center justify-center text-xs italic"
                      style={{ borderColor: c.border, background: c.row, color: c.txt3 }}>
                      Non fourni
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2" style={{ color: c.txt }}>CIN Recto</p>
                  <DocImage url={patient.id_card_recto_url} label="CIN Recto" c={c} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2" style={{ color: c.txt }}>CIN Verso</p>
                  <DocImage url={patient.id_card_verso_url} label="CIN Verso" c={c} />
                </div>
              </div>
              <p className="text-[11px] text-center italic" style={{ color: c.txt3 }}>
                Cliquez sur un document pour l'ouvrir en plein écran
              </p>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/10">
                <p className="text-xs font-bold text-blue-500 mb-2">Note de l'administrateur</p>
                <p className="text-xs opacity-70 leading-relaxed">
                  Les informations ci-dessous proviennent des dossiers remplis par les praticiens lors des consultations.
                </p>
              </div>
              <div className="py-10 text-center opacity-50 italic text-xs" style={{ color: c.txt3 }}>
                Aucun antécédent médical externe disponible pour le moment.
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-6 border-t flex gap-3" style={{ borderColor: c.border }}>
          {onEdit && (
            <button onClick={onEdit}
              className="flex-1 py-3 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{ background: c.blue }}>
              <Edit3 size={14} /> {t('modify')}
            </button>
          )}
          {onToggleStatus && (
            <button onClick={onToggleStatus}
              className="flex-1 py-3 rounded-xl text-xs font-bold border transition-all hover:opacity-80 flex items-center justify-center gap-2"
              style={{ borderColor: patient.is_active ? c.red : c.green, color: patient.is_active ? c.red : c.green }}>
              {patient.is_active
                ? <><Lock size={14} /> {t('suspend_btn')}</>
                : <><Unlock size={14} /> {t('reactivate_btn')}</>}
            </button>
          )}
          {!onToggleStatus && !onEdit && (
            <p className="flex-1 text-center text-xs py-2" style={{ color: c.txt3 }}>
              Inscription refusée — lecture seule
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Row menu ─────────────────────────────────────────────────────────────────
function RowMenu({ onView, onEdit, c }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: c.txt3 }}
        onMouseEnter={e => { e.currentTarget.style.background = c.row; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 rounded-lg border py-1 w-40 shadow-xl"
          style={{ background: c.card, borderColor: c.border }}>
          {[
            { label: "Voir le profil", action: () => { onView(); setOpen(false); } },
            { label: "Modifier",       action: () => { onEdit(); setOpen(false); } },
          ].map(a => (
            <button key={a.label} onClick={a.action}
              className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
              style={{ color: c.txt2 }}
              onMouseEnter={e => { e.currentTarget.style.background = c.row; e.currentTarget.style.color = c.txt; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.txt2; }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function avatarColor(name = "", c) {
  const palette = [c.blue, c.green, c.amber, c.purple, "#60A5FA", "#34D399"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PATIENTS = [];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PatientsView({ dk }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk ?? true);
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editPatient, setEditPatient] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers({ role: "patient" });
      const raw = Array.isArray(data) ? data : data?.results || [];
      setPatients(raw.map(u => ({
        ...u,
        full_name:          `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Patient",
        blood_group:        u.patient_detail?.medical_profile?.blood_group || u.blood_group || "",
        height:             u.patient_detail?.medical_profile?.height      || u.height      || "",
        weight:             u.patient_detail?.medical_profile?.weight      || u.weight      || "",
        date_of_birth:      u.date_of_birth     || u.patient_detail?.date_of_birth  || "",
        sex:                u.sex               || u.patient_detail?.sex            || "",
        address:            u.address           || u.patient_detail?.address        || "",
        postal_code:        u.postal_code       || u.patient_detail?.postal_code    || "",
        city:               u.city              || u.patient_detail?.city           || "",
        id_card_number:     u.id_card_number    || u.patient_detail?.id_card_number || "",
        photo_url:          u.photo             || u.patient_detail?.photo          || "",
        id_card_recto_url:  u.id_card_recto     || u.patient_detail?.id_card_recto  || "",
        id_card_verso_url:  u.id_card_verso     || u.patient_detail?.id_card_verso  || "",
      })));
    } catch (_err) {
      // keep mock
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleUpdate = async formData => {
    try {
      await api.updateAdminUser(editPatient.id, formData);
      setEditPatient(null);
      fetchPatients();
    } catch (err) {
      console.error("Erreur mise à jour patient:", err.message);
    }
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    let matchS = true;
    if (statusFilter === "active")    matchS = p.is_active;
    if (statusFilter === "suspended") matchS = !p.is_active;
    return matchQ && matchS;
  });

  const FILTERS = [
    { id: "all",       label: t('all_tab') },
    { id: "active",    label: t('active_tab') },
    { id: "suspended", label: t('suspended_tab') },
  ];

  const exportCSV = () => {
    const rows = [
      ["ID", "Nom", "Email", "Téléphone", "Wilaya", "Statut", "Groupe sanguin"],
      ...filtered.map(p => [
        p.id, p.full_name, p.email, p.phone || "—", p.wilaya || "—",
        p.is_active ? "Actif" : "Suspendu", p.blood_group || "—",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patients_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in duration-300" style={{ minHeight: "100%" }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold" style={{ color: c.txt }}>Patients</h2>
          <p className="text-xs mt-0.5" style={{ color: c.txt3 }}>
            {patients.length} patient{patients.length !== 1 ? "s" : ""} enregistré{patients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.txt3 }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, email..."
              className="pl-8 pr-4 py-2 rounded-lg text-xs outline-none border w-48"
              style={{ background: c.card, borderColor: c.border, color: c.txt }}
            />
          </div>
          <button onClick={fetchPatients} className="p-2 rounded-lg border"
            style={{ borderColor: c.border, color: c.txt3 }}
            onMouseEnter={e => e.currentTarget.style.background = c.row}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: c.border, color: c.txt2 }}
            onMouseEnter={e => { if (filtered.length > 0) e.currentTarget.style.background = c.row; }}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 border-b" style={{ borderColor: c.border }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setStatusFilter(f.id)}
            className="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
            style={{ borderColor: statusFilter === f.id ? c.blue : "transparent", color: statusFilter === f.id ? c.blue : c.txt3 }}>
            {f.label}
            {f.id !== "all" && (
              <span className="ml-1.5 text-[10px] opacity-60">
                ({patients.filter(p => f.id === "active" ? p.is_active : !p.is_active).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: c.border, background: c.card }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ background: c.header, borderBottom: `1px solid ${c.border}` }}>
                {[t('table_patient'), t('table_email'), t('location'), t('blood_group'), t('table_status'), ""].map(h => (
                  <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wider"
                    style={{ color: c.txt3, fontSize: "10px" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-16 text-center text-xs" style={{ color: c.txt3 }}>
                  <RefreshCw size={16} className="animate-spin mx-auto mb-2" style={{ color: c.txt3 }} />
                  {t('loading_data')}
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="py-16 text-center text-xs" style={{ color: c.txt3 }}>{t('no_results_found')}</td></tr>
              ) : filtered.map(p => {
                const initials = p.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("") || "?";
                const bg = avatarColor(p.full_name, c);
                return (
                  <tr key={p.id} onClick={() => setSelectedPatient(p)}
                    className="group cursor-pointer border-t transition-colors"
                    style={{ borderColor: c.border }}
                    onMouseEnter={e => e.currentTarget.style.background = c.row}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          style={{ background: p.is_active ? bg : c.txt3 }}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: c.txt }}>{p.full_name}</p>
                          <p className="text-[10px]" style={{ color: c.txt3 }}>#{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: c.txt2 }}>{p.email}</td>
                    <td className="px-4 py-3" style={{ color: c.txt2 }}>{p.wilaya || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: c.redBg, color: c.red }}>
                        {p.blood_group || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.is_active ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold w-fit"
                          style={{ background: c.greenBg, color: c.green }}>
                          <CheckCircle2 size={10} /> {t('active_status')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: c.redBg, color: c.red }}>
                          {t('suspended_status')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <RowMenu
                        c={c}
                        onView={() => setSelectedPatient(p)}
                        onEdit={() => setEditPatient(p)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPatient && (
        <RegistrationDrawer user={selectedPatient} dk={dk ?? true} onClose={() => setSelectedPatient(null)}
          onEdit={() => { setEditPatient(selectedPatient); setSelectedPatient(null); }}
          onToggleStatus={async () => { await api.toggleSuspendUser(selectedPatient.id); fetchPatients(); setSelectedPatient(null); }}
        />
      )}
      {editPatient && (
        <EditPatientModal patient={editPatient} dk={dk ?? true} onClose={() => setEditPatient(null)} onSave={handleUpdate} />
      )}
    </div>
  );
}
