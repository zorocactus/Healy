// src/pages/admin/views/ScheduleView.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Clock, User,
  Filter, Search, RefreshCw, MoreVertical, Plus, AlertTriangle, X
} from "lucide-react";
import { getAdminTheme } from "../adminTheme.js";
import { Card, Badge } from "../AdminPrimitives.jsx";
import { useLanguage } from "../../../context/LanguageContext";
import * as api from "../../../services/api";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

export default function ScheduleView({ dk }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docsData, apptsData] = await Promise.all([
        api.getAdminUsers({ role: 'doctor', verification_status: 'verified', is_active: true }),
        api.getAdminAppointments({ date })
      ]);

      const dList = Array.isArray(docsData) ? docsData : docsData.results || [];
      const aList = Array.isArray(apptsData) ? apptsData : apptsData.results || [];

      setDoctors(dList);
      setAppointments(aList);
    } catch (err) {
      setError(t('schedule_error'));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredDoctors = useMemo(() => 
    doctors.filter(d => 
      `${d.first_name} ${d.last_name}`.toLowerCase().includes(search.toLowerCase())
    ), [doctors, search]
  );

  // Helper to calculate position and width of appointment block
  const getApptStyle = (start, duration) => {
    const [h, m] = start.split(':').map(Number);
    const startInMinutes = (h * 60 + m) - (8 * 60); // Offset from 8:00
    const left = (startInMinutes / (13 * 60)) * 100; // 13 hours total (8 to 21)
    const width = (duration / (13 * 60)) * 100;
    return { 
      left: `${left}%`, 
      width: `${width}%`,
      minWidth: '40px'
    };
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: c.txt }}>
            {t('global_planning')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: c.txt2 }}>
            {t('flow_management_desc')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-1.5 rounded-xl border" style={{ borderColor: c.border, background: c.bg }}>
            <button onClick={() => {
              const d = new Date(date);
              d.setDate(d.getDate() - 1);
              setDate(d.toISOString().split('T')[0]);
            }} className="p-1.5 hover:bg-black/5 rounded-lg" style={{ color: c.txt2 }}>
              <ChevronLeft size={18} />
            </button>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold outline-none" style={{ color: c.txt }} />
            <button onClick={() => {
              const d = new Date(date);
              d.setDate(d.getDate() + 1);
              setDate(d.toISOString().split('T')[0]);
            }} className="p-1.5 hover:bg-black/5 rounded-lg" style={{ color: c.txt2 }}>
              <ChevronRight size={18} />
            </button>
          </div>
          <button onClick={fetchData} className="p-2.5 rounded-xl border hover:bg-black/5" style={{ borderColor: c.border, color: c.txt2 }}>
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

      <Card dk={dk} style={{ padding: 0, overflow: 'hidden' }}>
        {/* Search & Legend */}
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4" style={{ borderColor: c.border }}>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: c.txt3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_practitioner_placeholder')}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border outline-none" 
              style={{ background: dk ? '#0A1220' : '#F8FAFC', borderColor: c.border, color: c.txt }} />
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: c.txt3 }}>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: c.blue }} /> {t('confirmed')}</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: c.amber }} /> {t('pending')}</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: c.green }} /> {t('completed_tab')}</div>
          </div>
        </div>

        {/* Timeline Header */}
        <div className="flex border-b" style={{ borderColor: c.border, background: dk ? 'rgba(255,255,255,0.02)' : '#FAFBFD' }}>
          <div className="w-64 p-4 shrink-0 font-black text-[11px] uppercase" style={{ color: c.txt3 }}>{t('practitioners')}</div>
          <div className="flex-1 relative flex">
            {HOURS.map(h => (
              <div key={h} className="flex-1 border-l py-4 text-center text-[10px] font-bold" style={{ borderColor: c.border, color: c.txt3 }}>
                {h}:00
              </div>
            ))}
          </div>
        </div>

        {/* Grid Body */}
        <div className="max-h-[600px] overflow-y-auto overflow-x-hidden">
          {filteredDoctors.map(doctor => {
            const docAppts = appointments.filter(a =>
              a.doctor_id === doctor.id ||
              a.doctor === doctor.id ||
              (typeof a.doctor === "string" && `${doctor.first_name} ${doctor.last_name}`.toLowerCase() === a.doctor.toLowerCase())
            );
            return (
              <div key={doctor.id} className="flex border-b group hover:bg-black/[0.01] transition-colors" style={{ borderColor: c.border }}>
                <div className="w-64 p-4 shrink-0 flex items-center gap-3 border-r" style={{ borderColor: c.border }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                    style={{ background: `linear-gradient(135deg, ${c.blue}, ${c.blue}dd)` }}>
                    {doctor.first_name[0]}{doctor.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: c.txt }}>Dr. {doctor.last_name}</p>
                    <p className="text-[10px] opacity-60 truncate" style={{ color: c.txt2 }}>{doctor.specialty || t('generalist')}</p>
                  </div>
                </div>
                
                <div className="flex-1 relative h-16">
                  {/* Hour markers background */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {HOURS.map(h => <div key={h} className="flex-1 border-l opacity-20" style={{ borderColor: c.border }} />)}
                  </div>

                  {/* Appointment blocks */}
                  {docAppts.map(appt => {
                    const sTime = appt.startTime || appt.start_time || "08:00";
                    const duration = appt.durationMinutes || appt.duration_minutes || 30;
                    const style = getApptStyle(sTime, duration);
                    const color = appt.status === 'confirmed' ? c.blue : appt.status === 'completed' ? c.green : appt.status === 'in_progress' ? '#8B5CF6' : appt.status === 'cancelled' || appt.status === 'refused' ? '#6B7280' : c.amber;
                    const pName = appt.patient_name || (typeof appt.patient === "string" ? appt.patient : appt.patient?.full_name) || t('patient');

                    return (
                      <div key={appt.id}
                        onClick={() => setSelectedAppt({ ...appt, pName, sTime, duration, color, doctorName: `Dr. ${doctor.first_name} ${doctor.last_name}` })}
                        className="absolute top-2 bottom-2 p-1.5 rounded-lg shadow-sm border cursor-pointer hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                        style={{ ...style, background: `${color}15`, borderColor: color, borderLeftWidth: '4px' }}>
                        <p className="text-[9px] font-black truncate" style={{ color }}>{pName}</p>
                        <p className="text-[8px] opacity-80 truncate" style={{ color: c.txt2 }}>{sTime.slice(0,5)} • {duration}m</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      
      <div className="mt-4 p-4 rounded-xl border flex items-center gap-3" style={{ background: c.blue + '08', borderColor: c.blue + '20' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: c.blue + '20' }}>
          <Clock size={16} className="text-blue-500" />
        </div>
        <p className="text-xs font-medium" style={{ color: c.txt2 }}>
          {t('schedule_hint')}
        </p>
      </div>

      {/* ── Modal détail RDV ── */}
      {selectedAppt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedAppt(null)}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: c.card, border: `1px solid ${c.border}` }}
            onClick={e => e.stopPropagation()}>

            {/* Header coloré */}
            <div className="px-6 py-5 flex items-center justify-between"
              style={{ background: selectedAppt.color + '12', borderBottom: `1px solid ${selectedAppt.color}30` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: selectedAppt.color + '20' }}>
                  <Calendar size={18} style={{ color: selectedAppt.color }} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider" style={{ color: selectedAppt.color }}>
                    Rendez-vous #{selectedAppt.id}
                  </p>
                  <p className="text-[10px]" style={{ color: c.txt3 }}>{selectedAppt.date}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAppt(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center border hover:opacity-70 transition-opacity"
                style={{ borderColor: c.border, color: c.txt3 }}>
                <X size={14} />
              </button>
            </div>

            {/* Contenu */}
            <div className="px-6 py-5 space-y-4">
              {[
                { label: "Patient", value: selectedAppt.pName },
                { label: "Médecin", value: selectedAppt.doctorName },
                { label: "Spécialité", value: selectedAppt.specialty || "Généraliste" },
                { label: "Heure", value: `${selectedAppt.sTime.slice(0,5)} · ${selectedAppt.duration} min` },
                { label: "Motif", value: selectedAppt.motif || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest shrink-0 mt-0.5" style={{ color: c.txt3 }}>{label}</span>
                  <span className="text-sm font-semibold text-right" style={{ color: c.txt }}>{value}</span>
                </div>
              ))}

              {/* Badge statut */}
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: c.border }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.txt3 }}>Statut</span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: selectedAppt.color + '18', color: selectedAppt.color }}>
                  {{
                    pending: 'En attente', confirmed: 'Confirmé', in_progress: 'En cours',
                    completed: 'Terminé', cancelled: 'Annulé', refused: 'Refusé'
                  }[selectedAppt.status] || selectedAppt.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
