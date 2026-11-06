// src/pages/admin/views/users/CaretakersView.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, User,
  Edit3, AlertTriangle,
  Search, RefreshCw,
  Briefcase, HeartPulse, CheckCircle2, MoreVertical,
  Lock, Unlock
} from "lucide-react";
import { T, HMS, getAdminTheme } from "../../adminTheme.js";
import { Card } from "../../AdminPrimitives.jsx";
import { useLanguage } from "../../../../context/LanguageContext";
import * as api from "../../../../services/api";
import RegistrationDrawer from "./RegistrationDrawer";

// ─── SUB-COMPONENTS (kept exactly as original) ────────────────────────────────

export function EditCaretakerModal({ user, dk, onSave, onClose }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk ?? true);
  const [activeTab, setActiveTab] = useState("account");
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
    wilaya: user.wilaya || "",
    specialty: user.specialty || "",
    experience_years: user.experience_years || "",
    bio: user.bio || "",
    services: user.services || ""
  });

  const field = (label, key, type = "text") => (
    <div key={key} className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: c.txt }}>{label}</label>
      <input type={type} value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all focus:ring-2"
        style={{ background: dk ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderColor: c.border, color: c.txt, "--tw-ring-color": c.blue + "30" }}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card dk={dk} className="w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: c.border }}>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: c.txt }}>{t('caretaker_control')}</h3>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{user.full_name} (#{user.id})</p>
          </div>
          <button onClick={onClose} style={{ color: c.txt3 }}><X size={20} /></button>
        </div>

        <div className="flex px-2 border-b bg-black/[0.02]" style={{ borderColor: c.border }}>
          {[
            { id: "account",      label: t('identification_tab'),       icon: User },
            { id: "professional", label: t('service_experience_tab'), icon: Briefcase },
          ].map(tItem => (
            <button key={tItem.id} onClick={() => setActiveTab(tItem.id)} className="px-5 py-3 text-[10px] uppercase tracking-widest font-black flex items-center gap-2 transition-all border-b-2"
              style={{ color: activeTab === tItem.id ? c.blue : c.txt3, borderColor: activeTab === tItem.id ? c.blue : "transparent" }}>
              <tItem.icon size={14} /> {tItem.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "account" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 duration-300">
               {field(t('first_name_label'), "first_name")}{field(t('last_name_label'), "last_name")}
               {field(t('email'), "email", "email")}{field(t('phone_number'), "phone")}
               <div className="md:col-span-2">{field(t('all_wilayas'), "wilaya")}</div>
            </div>
          )}
          {activeTab === "professional" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 duration-300">
               {field(t('specialty_title_label'), "specialty")}
               {field(t('experience_years_label'), "experience_years", "number")}
               <div className="md:col-span-2">{field(t('services_offered_label'), "services")}</div>
               <div className="md:col-span-2">{field(t('bio_label'), "bio")}</div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex gap-3" style={{ borderColor: c.border }}>
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border" style={{ borderColor: c.border, color: c.txt2 }}>{t('cancel_btn') || "Annuler"}</button>
          <button onClick={() => onSave(form)} className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white" style={{ background: c.blue }}>{t('save_btn') || "Enregistrer"}</button>
        </div>
      </Card>
    </div>
  );
}

export function CaretakerDrawer({ user, dk, onClose, onEdit, onToggleStatus, onVerify }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk ?? true);
  const [activeTab, setActiveTab] = useState("account");

  const field = (label, value) => (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: c.txt }}>{label}</label>
      <div className="w-full px-4 py-2.5 rounded-xl text-sm border"
        style={{ background: dk ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderColor: c.border, color: value ? c.txt : c.txt3 }}>
        {value || <span className="italic opacity-50">{t('not_specified')}</span>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl border w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ background: c.card, borderColor: c.border }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-black bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/20">
              {user.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("") || "?"}
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: c.txt }}>{user.full_name}</h3>
              <p className="text-[10px] font-bold opacity-40 uppercase">{user.specialty || t('caretakers') || "Garde-malade"} · #{user.id}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: c.txt3 }} className="p-2 hover:bg-black/5 rounded-full transition-all"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-2 border-b" style={{ borderColor: c.border, background: dk ? "rgba(0,0,0,0.1)" : "#fcfcfc" }}>
          {[
            { id: "account",  label: t('account_contact') || "Compte",   icon: User },
            { id: "services", label: t('service_experience_tab') || "Services", icon: Briefcase },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 text-xs font-bold flex items-center gap-2 transition-all border-b-2"
              style={{ color: activeTab === tab.id ? c.blue : c.txt3, borderColor: activeTab === tab.id ? c.blue : "transparent" }}>
              <tab.icon size={14} />{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "account" && (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {user.verification_status === "pending" && (
                <div className="p-4 rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 flex flex-col items-center text-center gap-3">
                  <AlertTriangle className="text-amber-500" size={24} />
                  <p className="text-xs font-black uppercase tracking-widest text-amber-600">{t('verification_required') || "Vérification requise"}</p>
                  <button onClick={onVerify} className="px-6 py-2 rounded-xl bg-amber-500 text-white text-xs font-black uppercase tracking-wide active:scale-95 transition-all">
                    {t('approve_profile') || "Approuver"}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {field(t('first_name_label'), user.first_name)}
                {field(t('last_name_label'), user.last_name)}
              </div>
              {field(t('email_address'), user.email)}
              {field(t('phone_number'), user.phone)}
              {field(t('wilaya_residence'), user.wilaya)}
              <div className="pt-3 border-t" style={{ borderColor: c.border }}>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
                  style={{ background: dk ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderColor: c.border }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: user.is_active ? c.green : c.red }} />
                  <span className="text-sm font-semibold" style={{ color: user.is_active ? c.green : c.red }}>
                    {user.is_active ? (t('active_status') || "Actif") : (t('suspended_status') || "Suspendu")}
                  </span>
                </div>
              </div>
            </div>
          )}
          {activeTab === "services" && (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {field(t('specialty_title_label') || "Spécialité", user.specialty)}
              {field(t('experience_years_label') || "Expérience", user.experience_years ? `${user.experience_years} ans` : null)}
              {field(t('services_offered_label') || "Services proposés", user.services)}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: c.txt }}>{t('bio_label') || "Présentation"}</label>
                <div className="px-4 py-3 rounded-xl border text-sm italic leading-relaxed"
                  style={{ background: dk ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderColor: c.border, color: user.bio ? c.txt : c.txt3 }}>
                  {user.bio || <span className="opacity-50">{t('not_specified')}</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
              style={{ borderColor: user.is_active ? c.red : c.green, color: user.is_active ? c.red : c.green }}>
              {user.is_active
                ? <><Lock size={14} /> {t('suspend_btn') || "Suspendre"}</>
                : <><Unlock size={14} /> {t('reactivate_btn') || "Réactiver"}</>}
            </button>
          )}
          {!onEdit && !onToggleStatus && (
            <p className="flex-1 text-center text-xs py-2" style={{ color: c.txt3 }}>
              Inscription refusée — lecture seule
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Row menu ─────────────────────────────────────────────────────────────────
function RowMenu({ c, onView, onEdit }) {
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
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: c.txt3 }}
        onMouseEnter={e => e.currentTarget.style.background = c.row}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.txt2; }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function avatarColor(name = "", c) {
  const palette = [c.purple, c.blue, c.green, c.amber, "#818CF8"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_CARETAKERS = [];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CaretakersView({ dk }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk ?? true);
  const [users, setUsers] = useState(MOCK_CARETAKERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [vFilter, setVFilter] = useState("all");

  const [sel, setSel] = useState(null);
  const [edit, setEdit] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers({ role: "caretaker" });
      const raw = Array.isArray(data) ? data : data?.results || [];
      setUsers(raw.map(u => ({
         ...u,
         full_name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Caretaker",
         specialty: u.caretaker_detail?.specialty || "",
         experience_years: u.caretaker_detail?.experience_years || 0,
         bio: u.caretaker_detail?.bio || "",
         services: u.caretaker_detail?.services || "",
      })));
    } catch (_err) { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchV = vFilter === "all" || u.verification_status === vFilter;
    return matchQ && matchV;
  });

  const FILTERS = [
    { id: "all",      label: t('all_tab') },
    { id: "verified", label: t('verified_status') },
    { id: "pending",  label: t('pending_tab') },
  ];

  return (
    <div className="animate-in fade-in duration-300" style={{ minHeight: "100%" }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold" style={{ color: c.txt }}>{t('caretakers')}</h2>
          <p className="text-xs mt-0.5" style={{ color: c.txt3 }}>
            {users.length} {t('caretaker').toLowerCase()}{users.length !== 1 ? "s" : ""} {t('results_found').split(" ").slice(1).join(" ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.txt3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, email..."
              className="pl-8 pr-4 py-2 rounded-lg text-xs outline-none border w-48"
              style={{ background: c.card, borderColor: c.border, color: c.txt }} />
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg border"
            style={{ borderColor: c.border, color: c.txt3 }}
            onMouseEnter={e => e.currentTarget.style.background = c.row}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 border-b" style={{ borderColor: c.border }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setVFilter(f.id)}
            className="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
            style={{ borderColor: vFilter === f.id ? c.blue : "transparent", color: vFilter === f.id ? c.blue : c.txt3 }}>
            {f.label}
            {f.id !== "all" && (
              <span className="ml-1.5 text-[10px] opacity-60">
                ({users.filter(u => u.verification_status === f.id).length})
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
                {[t('table_caretaker'), t('table_email'), t('table_specialty'), t('location'), t('table_status'), ""].map(h => (
                  <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wider"
                    style={{ color: c.txt3, fontSize: "10px" }}>{h}</th>
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
              ) : filtered.map(u => {
                const initials = u.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("") || "?";
                const bg = avatarColor(u.full_name, c);
                return (
                  <tr key={u.id} onClick={() => setSel(u, c)}
                    className="group cursor-pointer border-t transition-colors"
                    style={{ borderColor: c.border }}
                    onMouseEnter={e => e.currentTarget.style.background = c.row}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: bg }}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: c.txt }}>{u.full_name}</p>
                          <p className="text-[10px]" style={{ color: c.txt3 }}>#{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: c.txt2 }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{ background: c.purpleBg, color: c.purple }}>
                        {u.specialty || "Soin"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: c.txt2 }}>{u.wilaya || "—"}</td>
                    <td className="px-4 py-3">
                      {u.verification_status === "verified" ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold w-fit"
                          style={{ background: c.greenBg, color: c.green }}>
                          <CheckCircle2 size={10} /> {t('verified_status')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: c.amberBg, color: c.amber }}>
                          {t('pending_status')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <RowMenu c={c} onView={() => setSel(u)} onEdit={() => setEdit(u)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sel && (
        <RegistrationDrawer user={sel} dk={dk ?? true} onClose={() => setSel(null)}
          onEdit={() => { setEdit(sel); setSel(null); }}
          onToggleStatus={async () => { await api.toggleSuspendUser(sel.id); fetchData(); setSel(null); }}
          onVerify={async () => { await api.verifyUser(sel.id); fetchData(); setSel(null); }}
        />
      )}
      {edit && (
        <EditCaretakerModal user={edit} dk={dk ?? true} onClose={() => setEdit(null)}
          onSave={async f => { await api.updateAdminUser(edit.id, f); setEdit(null); fetchData(); }}
        />
      )}
    </div>
  );
}



