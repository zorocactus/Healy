import { useState, useEffect } from "react";
import {
  Users, Stethoscope, Pill, Calendar, TrendingUp, TrendingDown,
  RefreshCw, Download, Activity, CheckCircle, AlertTriangle,
} from "lucide-react";
import { getAdminTheme } from "../adminTheme.js";
import { Card, Badge } from "../AdminPrimitives.jsx";
import * as api from "../../../services/api";
import { useLanguage } from "../../../context/LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, trend, dk }) {
  const c = getAdminTheme(dk);
  const up = trend >= 0;
  return (
    <Card dk={dk} style={{ padding: 20 }}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: color + "18" }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
            style={{
              background: up ? "#2D8C6F18" : "#E0555518",
              color: up ? "#2D8C6F" : "#E05555",
            }}
          >
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black tracking-tight" style={{ color: c.txt }}>
        {typeof value === "number" ? value.toLocaleString() : value ?? "—"}
      </p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: c.txt2 }}>
        {label}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: c.txt3 }}>
          {sub}
        </p>
      )}
    </Card>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

// ─── OVERVIEW PAGE ─────────────────────────────────────────────────────────────
export default function OverviewPage({ dk, onNav }) {
  const { t, lang } = useLanguage();
  const c = getAdminTheme(dk);

  const [kpis, setKpis] = useState(null);
  const [recentRegs, setRecentRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [sysStatus, setSysStatus] = useState(null);

  const exportPDF = () => {
    const rows = [
      [t('utilisateurs_totaux'), kpis?.total_users ?? "—"],
      [t('medecins_verifies'), kpis?.verified_doctors ?? "—"],
      [t('pharmacies_actives'), kpis?.active_pharmacies ?? "—"],
      [t('total_rdv'), kpis?.total_appointments ?? "—"],
    ];

    const doc = new jsPDF();
    const title = t('export_report') || "Rapport";
    const dateLabel = new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.text(`${t('updated_at', { time: dateLabel })}`, 14, 26);

    autoTable(doc, {
      startY: 32,
      head: [[t('indicator_label'), t('value_label')]],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: '#304B71', textColor: '#ffffff' },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 70 },
      },
    });

    doc.save(`Healy_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const data = await api.getAdminDashboard();
      setUsingFallback(false);
      if (data?.kpis) setKpis(data.kpis);
      if (Array.isArray(data?.recent_registrations)) {
        setRecentRegs(data.recent_registrations);
      }
    } catch {
      // Backend unreachable — keep fallbacks, signal banner
      setUsingFallback(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    }
    // État système (non bloquant — failure silencieuse autorisée)
    try {
      const s = await api.getSystemStatus();
      setSysStatus(s);
    } catch {
      setSysStatus(null);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Build KPI array from real data or fallback
  const kpiCards = [
    {
      label: t('utilisateurs_totaux'),
      value: kpis?.total_users ?? "—",
      icon: Users,
      color: c.blue,
      sub: t('tous_roles_confondus'),
    },
    {
      label: t('medecins_verifies'),
      value: kpis?.verified_doctors ?? "—",
      icon: Stethoscope,
      color: c.green,
      sub: t('profils_valides_admin'),
    },
    {
      label: t('pharmacies_actives'),
      value: kpis?.active_pharmacies ?? "—",
      icon: Pill,
      color: c.amber,
      sub: t('officines_partenaires'),
    },
    {
      label: t('total_rdv'),
      value: kpis?.total_appointments ?? "—",
      icon: Calendar,
      color: c.purple,
      sub: t('depuis_debut'),
    },
  ];

  const totalUsers = kpis?.total_users ?? 0;
  const timeStr = lastRefresh.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: c.green }}
            >
              {t('system_operational')}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: c.txt }}>
            {t('control_center')}{" "}
            <span style={{ color: c.blue }}>Healy</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: c.txt2 }}>
            {new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {t('updated_at', { time: timeStr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            disabled={usingFallback}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: c.border, color: c.txt2 }}
            title={usingFallback ? t('simulated_data') : t('export_report')}
          >
            <Download size={14} /> {t('export_report')}
          </button>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #304B71, #6492C9)",
              boxShadow: "0 4px 16px rgba(74,111,165,0.35)",
            }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* ── Fallback banner ── */}
      {usingFallback && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 text-sm font-semibold"
          style={{ background: c.amber + "18", borderColor: c.amber + "40", color: c.amber }}
        >
          <AlertTriangle size={16} />
          {t('server_unreachable')}. {t('simulated_data')}.
          <button
            onClick={fetchData}
            className="ml-auto text-xs underline hover:no-underline"
            style={{ color: c.amber }}
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((k, i) => (
          <KpiCard key={i} {...k} dk={dk} />
        ))}
      </div>

      {/* ── Bottom Row : Recent registrations + Audit mini ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent registrations */}
        <Card dk={dk} style={{ padding: 20 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: c.txt }}>
              {t('recent_registrations')}
            </h3>
            <button
              onClick={() => onNav("utilisateurs")}
              className="text-xs font-semibold hover:underline"
              style={{ color: c.blue }}
            >
              {t('see_all')} →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div
                    className="w-9 h-9 rounded-xl shrink-0"
                    style={{ background: c.blueLight }}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-3 rounded-full w-2/3"
                      style={{ background: c.blueLight }}
                    />
                    <div
                      className="h-2 rounded-full w-1/2"
                      style={{ background: c.blueLight }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : recentRegs.length > 0 ? (
            <div className="space-y-3">
              {recentRegs.slice(0, 6).map((u, i) => {
                const name = u.name ?? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ?? "—";
                const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                const roleColor =
                  u.role === "doctor" ? "#2D8C6F"
                  : u.role === "pharmacist" ? "#E8A838"
                  : u.role === "caretaker" ? "#7B5EA7"
                  : "#4A6FA5";
                 const roleLabel =
                   u.role === "doctor" ? t('doctor')
                   : u.role === "pharmacist" ? t('pharmacist')
                   : u.role === "caretaker" ? t('caretaker')
                   : t('patient');
                 return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: roleColor }}
                    >
                      {initials || "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: c.txt }}
                      >
                        {name}
                      </p>
                      <p className="text-xs" style={{ color: c.txt3 }}>
                        {roleLabel} ·{" "}
                        {u.date
                          ? new Date(u.date).toLocaleDateString("fr-FR")
                          : "—"}
                      </p>
                    </div>
                    <Badge color={roleColor} bg={roleColor + "18"}>
                      {roleLabel}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: c.txt3 }}>
              {t('no_results_found')}
            </p>
          )}
        </Card>

        {/* Système status */}
        <Card dk={dk} style={{ padding: 20 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: c.txt }}>
              {t('system_status')}
            </h3>
            <button
              onClick={() => onNav("audit")}
              className="text-xs font-semibold hover:underline"
              style={{ color: c.blue }}
            >
              {t('view_full_log')} →
            </button>
          </div>
          <div className="space-y-3">
            {(() => {
              // Statuts réels depuis /api/admin/system-status/ ; fallback prudent si l'API ne répond pas.
              const backendOk  = !!sysStatus?.backend?.status && sysStatus.backend.status === 'ok';
              const dbOk       = sysStatus?.database?.status === 'ok';
              const emailState = sysStatus?.email?.status;
              const djangoV    = sysStatus?.backend?.django;
              const dbV        = sysStatus?.database?.version;
              return [
                {
                  label: "API Backend",
                  status: (kpis && backendOk) ? "ok" : (sysStatus ? "warn" : (kpis ? "ok" : "warn")),
                  msg: djangoV ? `Django ${djangoV}` : (kpis ? t('system_operational') : t('server_unreachable')),
                },
                {
                  label: t('database') || "Database",
                  status: dbOk ? "ok" : (sysStatus ? "err" : "ok"),
                  msg: dbV || "PostgreSQL",
                },
                { label: "Auth JWT", status: "ok", msg: t('active_status') || "Active" },
                {
                  label: "Email",
                  status: emailState === 'ok' ? "ok" : (emailState === 'unconfigured' ? "warn" : "ok"),
                  msg: emailState === 'unconfigured' ? (t('unconfigured') || "Non configuré") : (sysStatus?.email?.host || "SMTP"),
                },
                {
                  label: t('reports') || "Reports",
                  status: "ok",
                  msg: t('system_operational') || "Ready",
                },
              ];
            })().map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: c.border }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        s.status === "ok"
                          ? "#2D8C6F"
                          : s.status === "warn"
                          ? "#E8A838"
                          : "#E05555",
                    }}
                  />
                  <span className="text-sm font-semibold" style={{ color: c.txt }}>
                    {s.label}
                  </span>
                </div>
                <span className="text-xs" style={{ color: c.txt3 }}>
                  {s.msg}
                </span>
              </div>
            ))}
          </div>

          {/* Validation pending alert */}
          <div
            className="mt-4 flex items-center gap-3 p-3 rounded-xl border"
            style={{
              background: c.amberLight,
              borderColor: c.amber + "40",
            }}
          >
            <AlertTriangle size={16} style={{ color: c.amber }} />
            <div>
              <p className="text-xs font-bold" style={{ color: c.amber }}>
                {t('pending_registrations')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: c.txt2 }}>
                {t('validation_section_desc')}
              </p>
            </div>
            <button
              onClick={() => onNav("validation")}
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg text-white shrink-0"
              style={{ background: c.amber }}
            >
              {t('view_doc')}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
