import { useState, useEffect } from "react";
import {
  ShieldAlert, RefreshCw, CheckCircle, XCircle,
  Calendar, Shield, MoreHorizontal,
  Search, Clock, Eye, X, AlertTriangle, Ban
} from "lucide-react";
import { getAdminTheme } from "../adminTheme.js";
import { Card, Badge } from "../AdminPrimitives.jsx";
import DashSelect from "../../../components/ui/DashSelect.jsx";
import { useLanguage } from "../../../context/LanguageContext";
import * as api from "../../../services/api";

// Libellés et couleurs des catégories de signalement (alignés sur le backend)
const CATEGORY_META = {
  harassment:     { label: "Harcèlement",     color: "#E05555" },
  spam:           { label: "Spam",            color: "#E8A838" },
  fraud:          { label: "Fraude",          color: "#A33B3B" },
  inappropriate:  { label: "Inapproprié",     color: "#7B5EA7" },
  misinformation: { label: "Désinformation",  color: "#4A6FA5" },
  other:          { label: "Autre",           color: "#5A6E8A" },
};

const ACTION_META = {
  warn:      { label: "Avertissement",   color: "#E8A838" },
  suspend:   { label: "Suspension",      color: "#E05555" },
  dismissed: { label: "Classé sans suite", color: "#5A6E8A" },
  none:      { label: "Aucune action",   color: "#9AACBE" },
};

export default function ReportsView({ dk, onCountChange }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, resolved, dismissed
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  // Modal d'action : { id, action: 'warn'|'suspend'|'dismiss', notes }
  const [actionModal, setActionModal] = useState(null);
  const [actionBusy, setActionBusy]   = useState(false);

  // Synchronise le badge du sidebar avec le nombre réel de signalements pending.
  const syncPendingCount = (list) => {
    if (typeof onCountChange === "function") {
      onCountChange(list.filter(r => r.status === "pending").length);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await api.getReports();
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setReports(list);
      syncPendingCount(list);
    } catch (err) {
      console.error("Erreur lors de la récupération des signalements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const openAction = (report, actionType) => {
    setActionModal({ report, action: actionType, notes: "" });
  };

  const submitAction = async () => {
    if (!actionModal) return;
    setActionBusy(true);
    try {
      const updated = await api.handleReportAction(
        actionModal.report.id, actionModal.action, actionModal.notes.trim()
      );
      // Remplace en place avec la version serveur (contient resolved_by, etc.)
      const newList = reports.map(r =>
        r.id === actionModal.report.id ? { ...r, ...updated } : r
      );
      setReports(newList);
      syncPendingCount(newList);  // ← badge sidebar mis à jour
      setActionModal(null);
      setSelectedReport(null);
    } catch (err) {
      alert("Échec : " + (err?.message || "action refusée"));
    } finally {
      setActionBusy(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesFilter = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (r.reporter_name || "").toLowerCase().includes(q) ||
      (r.reported_name || "").toLowerCase().includes(q) ||
      (r.reason || "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const getRoleBadge = (role) => {
    const roles = {
      patient: { color: "#4A6FA5", bg: dk ? "#4A6FA522" : "#EEF3FB", label: t('patient') },
      médecin: { color: "#2D8C6F", bg: dk ? "#2D8C6F22" : "#EEF8F4", label: t('doctor') },
      doctor: { color: "#2D8C6F", bg: dk ? "#2D8C6F22" : "#EEF8F4", label: t('doctor') },
      pharmacien: { color: "#E8A838", bg: dk ? "#E8A83822" : "#FFF8EC", label: t('pharmacist') },
      pharmacist: { color: "#E8A838", bg: dk ? "#E8A83822" : "#FFF8EC", label: t('pharmacist') },
      "garde-malade": { color: "#7B5EA7", bg: dk ? "#7B5EA722" : "#F3EEFF", label: t('caretaker') },
      caretaker: { color: "#7B5EA7", bg: dk ? "#7B5EA722" : "#F3EEFF", label: t('caretaker') },
    };
    const meta = roles[role?.toLowerCase()] || { color: c.txt3, bg: c.blueLight, label: role };
    return <Badge color={meta.color} bg={meta.bg}>{meta.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "pending": return <Badge color="#E8A838" bg={dk ? "#E8A83822" : "#FFF8EC"}>{t('pending_status')}</Badge>;
      case "resolved": return <Badge color="#2D8C6F" bg={dk ? "#2D8C6F22" : "#EEF8F4"}>{t('treated_status')}</Badge>;
      case "dismissed": return <Badge color={c.txt3} bg={c.blueLight}>{t('ignored_status')}</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw size={32} className="animate-spin" style={{ color: c.blue }} />
        <p className="text-sm font-semibold" style={{ color: c.txt3 }}>Chargement des signalements…</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3" style={{ color: c.txt }}>
            <ShieldAlert size={28} className="text-red-500" />
            {t('reports_alerts')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: c.txt2 }}>
            {t('moderation_desc')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color={c.red} bg={dk ? c.red + "22" : c.redLight}>
            {reports.filter(r => r.status === "pending").length} {t('non_processed')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <Card dk={dk} className="lg:col-span-3 p-3 flex items-center gap-3">
          <Search size={16} style={{ color: c.txt3 }} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_report_placeholder')}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: c.txt }}
          />
        </Card>
        <div className="lg:col-span-1">
          <DashSelect 
            value={filter}
            options={[
              { value: "all", label: t('all_tab') },
              { value: "pending", label: t('pending_tab') },
              { value: "resolved", label: t('processed_tab') },
              { value: "dismissed", label: t('ignored_tab') },
            ]}
            onSelect={v => setFilter(v)}
            dk={dk}
            c={c}
          />
        </div>
      </div>

      <Card dk={dk} style={{ overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: dk ? "rgba(255,255,255,0.02)" : "#FAFBFD", borderBottom: `1px solid ${c.border}` }}>
                {[t('date'), t('reporter_col'), t('reported_col'), "Catégorie", t('reason_col'), t('status_label'), "Actions"].map(h => (
                  <th key={h} className="text-left py-4 px-5 text-[11px] font-black uppercase tracking-wider" style={{ color: c.txt3 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: c.border }}>
              {filteredReports.map(report => (
                <tr key={report.id} className="group transition-colors" onMouseEnter={e => e.currentTarget.style.background = dk ? "rgba(255,255,255,0.01)" : "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: c.txt }}>
                      <Calendar size={14} style={{ color: c.txt3 }} />
                      {new Date(report.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-[10px] flex items-center gap-1 mt-1" style={{ color: c.txt3 }}>
                      <Clock size={10} />
                      {new Date(report.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold" style={{ color: c.txt }}>{report.reporter_name}</span>
                      {getRoleBadge(report.reporter_role)}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold" style={{ color: c.txt }}>{report.reported_name}</span>
                      {getRoleBadge(report.reported_role)}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {(() => {
                      const meta = CATEGORY_META[report.category] || CATEGORY_META.other;
                      return <Badge color={meta.color} bg={meta.color + "1A"}>{meta.label}</Badge>;
                    })()}
                  </td>
                  <td className="py-4 px-5 max-w-[260px]">
                    <p className="text-sm line-clamp-2 italic" style={{ color: c.txt2 }}>
                      "{report.reason}"
                    </p>
                  </td>
                  <td className="py-4 px-5">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedReport(report)}
                        title="Voir les détails"
                        className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:opacity-80 active:scale-95"
                        style={{ borderColor: c.border, color: c.blue, background: c.card }}
                      >
                        <Eye size={16} />
                      </button>
                      {report.status === "pending" ? (
                        <>
                          <button
                            onClick={() => openAction(report, "warn")}
                            title="Avertir l'utilisateur signalé"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
                            style={{ background: "#E8A838" }}
                          >
                            <AlertTriangle size={16} />
                          </button>
                          <button
                            onClick={() => openAction(report, "suspend")}
                            title="Suspendre le compte signalé"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
                            style={{ background: "#E05555" }}
                          >
                            <Ban size={16} />
                          </button>
                          <button
                            onClick={() => openAction(report, "dismiss")}
                            title="Classer sans suite"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border transition-transform hover:scale-110 active:scale-95"
                            style={{ borderColor: c.border, color: c.txt3, background: c.card }}
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      ) : (
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center opacity-30" style={{ color: c.txt3 }}>
                          <MoreHorizontal size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40" style={{ color: c.txt3 }}>
                      <Shield size={48} strokeWidth={1} />
                      <p className="text-sm font-medium">{t('no_reports_found')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── MODAL DÉTAIL SIGNALEMENT ─────────────────────────────────────── */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: c.card, border: `1px solid ${c.border}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="px-6 pt-6 pb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "#E0555512" }}>
                  <ShieldAlert size={22} color="#E05555" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight" style={{ color: c.txt }}>
                    {t('report_details_title')}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block"
                    style={{ background: c.blueLight, color: c.txt3 }}>
                    #{selectedReport.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 hover:opacity-70 transition-opacity"
                style={{ borderColor: c.border, color: c.txt3 }}
              >
                <X size={14} />
              </button>
            </div>

            {/* ── Parties impliquées ── */}
            <div className="px-6 pb-4 grid grid-cols-2 gap-3">
              {[
                { label: t('reporter_col'), name: selectedReport.reporter_name, role: selectedReport.reporter_role, suspended: false },
                { label: t('reported_col'), name: selectedReport.reported_name, role: selectedReport.reported_role, suspended: selectedReport.reported_is_active === false },
              ].map(({ label, name, role, suspended }) => {
                const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={label} className="rounded-2xl p-4 border flex flex-col gap-2"
                    style={{ background: c.blueLight, borderColor: c.border }}>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.txt3 }}>
                      {label}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: c.blue }}>
                        {initials}
                      </div>
                      <p className="text-sm font-bold truncate" style={{ color: c.txt }}>{name || "—"}</p>
                    </div>
                    {getRoleBadge(role)}
                    {suspended && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#E0555520", color: "#E05555" }}>
                        Compte suspendu
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Catégorie + récidive ── */}
            <div className="px-6 pb-4 flex flex-wrap items-center gap-2">
              {(() => {
                const meta = CATEGORY_META[selectedReport.category] || CATEGORY_META.other;
                return <Badge color={meta.color} bg={meta.color + "1A"}>{meta.label}</Badge>;
              })()}
              {selectedReport.reported_user_report_count > 1 && (
                <span className="text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "#E0555520", color: "#E05555" }}>
                  <ShieldAlert size={11} />
                  {selectedReport.reported_user_report_count} signalements au total
                </span>
              )}
            </div>

            {/* ── Motif ── */}
            <div className="px-6 pb-4">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: c.txt3 }}>
                {t('reason_col')}
              </p>
              <div className="rounded-2xl p-4 border"
                style={{ background: c.blueLight, borderColor: c.border }}>
                <p className="text-sm leading-relaxed italic" style={{ color: c.txt }}>
                  "{selectedReport.reason}"
                </p>
              </div>
            </div>

            {/* ── Si traité : action prise + notes admin + qui ── */}
            {selectedReport.status !== "pending" && (
              <div className="px-6 pb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.txt3 }}>
                    Décision
                  </p>
                  {(() => {
                    const meta = ACTION_META[selectedReport.action_taken] || ACTION_META.none;
                    return <Badge color={meta.color} bg={meta.color + "1A"}>{meta.label}</Badge>;
                  })()}
                </div>
                {selectedReport.admin_notes && (
                  <div className="rounded-xl p-3 border text-xs leading-relaxed"
                    style={{ background: c.blueLight, borderColor: c.border, color: c.txt2 }}>
                    {selectedReport.admin_notes}
                  </div>
                )}
                {selectedReport.resolved_by_name && (
                  <p className="text-[11px]" style={{ color: c.txt3 }}>
                    Traité par <strong>{selectedReport.resolved_by_name}</strong>
                    {selectedReport.resolved_at && (
                      <> · {new Date(selectedReport.resolved_at).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* ── Meta : date + statut ── */}
            <div className="px-6 pb-5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} style={{ color: c.txt3 }} />
                <span className="text-xs font-medium" style={{ color: c.txt3 }}>
                  {new Date(selectedReport.created_at).toLocaleString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              {getStatusBadge(selectedReport.status)}
            </div>

            {/* ── Actions de modération (3 niveaux) ── */}
            {selectedReport.status === "pending" && (
              <div className="px-6 pb-6 grid grid-cols-3 gap-2 border-t pt-5" style={{ borderColor: c.border }}>
                <button
                  onClick={() => openAction(selectedReport, "warn")}
                  className="py-2.5 rounded-2xl text-white text-xs font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-1.5"
                  style={{ background: "#E8A838" }}
                  title="Notifier l'utilisateur signalé"
                >
                  <AlertTriangle size={14} /> Avertir
                </button>
                <button
                  onClick={() => openAction(selectedReport, "suspend")}
                  className="py-2.5 rounded-2xl text-white text-xs font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-1.5"
                  style={{ background: "#E05555" }}
                  title="Désactiver le compte signalé"
                >
                  <Ban size={14} /> Suspendre
                </button>
                <button
                  onClick={() => openAction(selectedReport, "dismiss")}
                  className="py-2.5 rounded-2xl text-xs font-bold border transition-all active:scale-95 hover:opacity-80 flex items-center justify-center gap-1.5"
                  style={{ borderColor: c.border, color: c.txt2, background: "transparent" }}
                  title="Classer sans suite"
                >
                  <XCircle size={14} /> Ignorer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMATION ACTION (avec saisie notes admin) ──────────── */}
      {actionModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => !actionBusy && setActionModal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: c.card, border: `1px solid ${c.border}` }}
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const meta = {
                warn:    { label: "Avertir l'utilisateur",    icon: AlertTriangle, color: "#E8A838",
                           desc: "Une notification d'avertissement sera envoyée à l'utilisateur signalé." },
                suspend: { label: "Suspendre le compte",      icon: Ban,           color: "#E05555",
                           desc: "Le compte sera désactivé. L'utilisateur ne pourra plus se connecter." },
                dismiss: { label: "Classer sans suite",       icon: XCircle,       color: "#5A6E8A",
                           desc: "Le signalement sera marqué comme ignoré, sans action sur le compte." },
              }[actionModal.action];
              const Icon = meta.icon;
              return (
                <>
                  <div className="px-6 pt-6 pb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ background: meta.color + "18" }}>
                        <Icon size={22} style={{ color: meta.color }} />
                      </div>
                      <div>
                        <h3 className="text-base font-black" style={{ color: c.txt }}>{meta.label}</h3>
                        <p className="text-xs mt-0.5" style={{ color: c.txt3 }}>
                          Signalement #{actionModal.report.id}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => !actionBusy && setActionModal(null)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center border hover:opacity-70"
                      style={{ borderColor: c.border, color: c.txt3 }}>
                      <X size={14} />
                    </button>
                  </div>

                  <div className="px-6 pb-4">
                    <p className="text-sm leading-relaxed" style={{ color: c.txt2 }}>{meta.desc}</p>
                  </div>

                  <div className="px-6 pb-5">
                    <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.txt3 }}>
                      Notes internes {actionModal.action !== 'dismiss' && '(visible par le user)'}
                    </label>
                    <textarea
                      value={actionModal.notes}
                      onChange={e => setActionModal(m => ({ ...m, notes: e.target.value }))}
                      placeholder={
                        actionModal.action === 'warn'
                          ? "Ex : Veuillez modérer vos propos dans la messagerie."
                          : actionModal.action === 'suspend'
                          ? "Ex : Comportement répété malgré avertissements."
                          : "Ex : Signalement non fondé après vérification."
                      }
                      rows={4}
                      className="mt-2 w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none"
                      style={{ background: c.blueLight, borderColor: c.border, color: c.txt }}
                    />
                  </div>

                  <div className="px-6 pb-6 flex gap-3 border-t pt-5" style={{ borderColor: c.border }}>
                    <button
                      onClick={() => !actionBusy && setActionModal(null)}
                      disabled={actionBusy}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold border transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ borderColor: c.border, color: c.txt2, background: "transparent" }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={submitAction}
                      disabled={actionBusy}
                      className="flex-1 py-3 rounded-2xl text-white text-sm font-bold transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
                      style={{ background: meta.color }}
                    >
                      {actionBusy ? "Traitement…" : "Confirmer"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
