// src/pages/admin/views/VisitQueueView.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, UserPlus, Play, CheckCircle2, Clock,
  Search, RefreshCw, MoreVertical, ArrowRight,
  AlertTriangle, LayoutGrid, List, X, User
} from "lucide-react";
import { getAdminTheme } from "../adminTheme.js";
import { Card, Badge } from "../AdminPrimitives.jsx";
import { useLanguage } from "../../../context/LanguageContext";
import * as api from "../../../services/api";

const getStatusConfig = (t) => ({
  pending:     { label: "En attente",    color: "#F59E0B", icon: Clock },
  confirmed:   { label: "Confirmé",      color: "#8B5CF6", icon: Clock },
  in_progress: { label: "En cours",      color: "#3B82F6", icon: Play },
  completed:   { label: "Terminé",       color: "#10B981", icon: CheckCircle2 },
  cancelled:   { label: "Annulé",        color: "#6B7280", icon: X },
  refused:     { label: "Refusé",        color: "#EF4444", icon: X },
});

function getPatientName(item) {
  return item.patient_name || (typeof item.patient === "string" ? item.patient : item.patient?.full_name) || "Patient";
}
function getDoctorName(item) {
  return item.doctor_name || (typeof item.doctor === "string" ? item.doctor : item.doctor?.last_name) || "—";
}
function getTime(item) {
  const t = item.start_time || item.consulted_at || "";
  return t.slice(0, 5) || "—";
}

export default function VisitQueueView({ dk }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' or 'list'
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminAppointments();
      setQueue(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setError(t('loading_queue_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Vue supervision uniquement — les statuts sont mis à jour par les médecins/patients
  const handleStatusUpdate = () => {};

  const columns = {
    waiting: queue.filter(q => q.status === "pending" || q.status === "confirmed"),
    active:  queue.filter(q => q.status === "in_progress"),
    done:    queue.filter(q => q.status === "completed" || q.status === "cancelled" || q.status === "refused"),
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: c.txt }}>
            {t('visit_queue_title')} <span style={{ color: c.amber }}>{t('real_time_tag')}</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: c.txt2 }}>
            {t('queue_supervision_desc')}
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex p-1 rounded-xl bg-black/5" style={{ background: dk ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
            <button onClick={() => setViewMode("kanban")} 
              className={`p-2 rounded-lg transition-all ${viewMode === "kanban" ? 'bg-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}
              style={viewMode === "kanban" ? { color: c.txt, background: dk ? '#1E293B' : '#fff' } : { color: c.txt }}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? 'bg-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}
              style={viewMode === "list" ? { color: c.txt, background: dk ? '#1E293B' : '#fff' } : { color: c.txt }}>
              <List size={18} />
            </button>
          </div>
          <button onClick={fetchQueue} className="p-2.5 rounded-xl border hover:bg-black/5" style={{ borderColor: c.border, color: c.txt2 }}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 text-sm font-semibold"
          style={{ background: c.red + "18", borderColor: c.red + "40", color: c.red }}>
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto" style={{ color: c.red }}>
            <X size={16} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 text-sm font-semibold"
          style={{ background: c.amber + "18", borderColor: c.amber + "40", color: c.amber }}>
          <AlertTriangle size={16} />
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-auto" style={{ color: c.amber }}>
            <X size={16} />
          </button>
        </div>
      )}

      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QueueColumn title={t('waiting_room')} items={columns.waiting} c={c} dk={dk}
            icon={Users} borderColor={c.amber}
            nextAction={{ label: t('start_btn'), status: "in_progress" }}
            onAction={handleStatusUpdate} t={t} />
          <QueueColumn title={t('consultations_tab')} items={columns.active} c={c} dk={dk}
            icon={Play} borderColor={c.blue}
            nextAction={{ label: t('finish_btn'), status: "completed" }}
            onAction={handleStatusUpdate} t={t} />
          <QueueColumn title={t('finished_visits')} items={columns.done} c={c} dk={dk}
            icon={CheckCircle2} borderColor={c.green}
            onAction={handleStatusUpdate} t={t} />
        </div>
      ) : (
        <QueueListView queue={queue} c={c} dk={dk} onAction={handleStatusUpdate} t={t} />
      )}
    </div>
  );
}

function QueueListView({ queue, c, dk, onAction, t }) {
  const STATUS_CFG = getStatusConfig(t);
  if (queue.length === 0) {
    return (
      <div className="py-20 text-center" style={{ color: c.txt3 }}>
        <Users size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-semibold opacity-50">{t('empty_column') || "Aucune consultation en cours"}</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: c.border, background: c.card }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: dk ? "rgba(255,255,255,0.02)" : "#FAFBFD", borderBottom: `1px solid ${c.border}` }}>
            {["Patient", "Médecin", "Heure", "Statut", "Action"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-wider" style={{ color: c.txt3 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: c.border }}>
          {queue.map(item => {
            const cfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
            const StatusIcon = cfg.icon;
            const nextStatus = (item.status === "pending" || item.status === "confirmed") ? "in_progress" : item.status === "in_progress" ? "completed" : null;
            const nextLabel  = (item.status === "pending" || item.status === "confirmed") ? t('start_btn') : item.status === "in_progress" ? t('finish_btn') : null;
            return (
              <tr key={item.id}
                onMouseEnter={e => e.currentTarget.style.background = dk ? "rgba(255,255,255,0.02)" : "#FAFBFD"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td className="px-4 py-3 font-semibold" style={{ color: c.txt }}>
                  {getPatientName(item)}
                </td>
                <td className="px-4 py-3" style={{ color: c.txt2 }}>
                  Dr. {getDoctorName(item)}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: c.txt3 }}>
                    <Clock size={12} />{getTime(item)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit" style={{ background: cfg.color + "18", color: cfg.color }}>
                    <StatusIcon size={11} />{cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {nextStatus ? (
                    <button onClick={() => onAction(item.id, nextStatus)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight text-white transition-all active:scale-95 hover:brightness-110"
                      style={{ background: nextStatus === "in_progress" ? c.amber : c.green }}>
                      {nextLabel}
                    </button>
                  ) : (
                    <span className="text-xs opacity-40" style={{ color: c.txt3 }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function QueueCard({ item, c, dk, borderColor, nextAction, onAction }) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const menuActions = [
    { label: t('put_on_wait'),   status: "scheduled",   show: item.status !== "scheduled" },
    { label: t('start_consultation'), status: "in_progress", show: item.status !== "in_progress" },
    { label: t('mark_as_completed'),     status: "completed",   show: item.status !== "completed" },
  ].filter(a => a.show);

  return (
    <Card dk={dk} className="group animate-in slide-in-from-bottom-2 duration-300"
      style={{ padding: 16, borderLeft: `4px solid ${borderColor}` }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: c.txt }}>
            {item.patient_name || item.patient?.full_name || item.patient?.name || 'Patient'}
          </p>
          <div className="flex items-center gap-2 mt-1 opacity-60">
            <User size={10} style={{ color: c.txt3 }} />
            <p className="text-[10px] font-medium truncate" style={{ color: c.txt3 }}>
              Dr. {getDoctorName(item)}
            </p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-black/5"
            style={{ color: c.txt3 }}>
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 rounded-xl border shadow-lg py-1 min-w-[180px]"
              style={{ background: c.card, borderColor: c.border }}>
              {menuActions.map(a => (
                <button key={a.status}
                  onClick={() => { onAction(item.id, a.status); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-black/5 transition-colors"
                  style={{ color: c.txt2 }}>
                  {a.label}
                </button>
              ))}
              {menuActions.length === 0 && (
                <p className="px-4 py-2 text-xs" style={{ color: c.txt3 }}>{t('no_action_avail')}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: dk ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }}>
          <Clock size={12} style={{ color: c.txt3 }} />
          <span className="text-[10px] font-bold" style={{ color: c.txt2 }}>{getTime(item)}</span>
        </div>

        {nextAction && (
          <button onClick={() => onAction(item.id, nextAction.status)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight text-white transition-all active:scale-95 hover:brightness-110"
            style={{ background: borderColor }}>
            {nextAction.label} <ArrowRight size={12} />
          </button>
        )}
      </div>
    </Card>
  );
}

function QueueColumn({ title, items, c, dk, icon: Icon, borderColor, nextAction, onAction }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: borderColor + '15', color: borderColor }}>
            <Icon size={18} />
          </div>
          <h3 className="font-black text-sm uppercase tracking-wider" style={{ color: c.txt }}>{title}</h3>
        </div>
        <Badge bg={dk ? 'rgba(255,255,255,0.05)' : '#F1F5F9'} color={c.txt3}>{items.length}</Badge>
      </div>

      <div className="flex-1 space-y-3 min-h-[400px] p-2 rounded-2xl" style={{ background: dk ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
        {items.map(item => (
          <QueueCard key={item.id} item={item} c={c} dk={dk}
            borderColor={borderColor} nextAction={nextAction} onAction={onAction} />
        ))}
        {items.length === 0 && (
          <div className="py-20 text-center opacity-20" style={{ color: c.txt3 }}>
            <Icon size={32} className="mx-auto mb-2" />
            <p className="text-xs font-bold uppercase">{t('empty_column')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
