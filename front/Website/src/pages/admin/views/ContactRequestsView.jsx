// src/pages/admin/views/ContactRequestsView.jsx
// Liste et traitement des demandes envoyées à l'admin depuis l'écran
// Paramètres des dashboards patient/médecin/pharmacien/garde-malade.
import { useState, useEffect, useMemo } from "react";
import * as api from "../../../services/api";
import { getAdminTheme } from "../adminTheme.js";
import { Card } from "../AdminPrimitives.jsx";
import {
  Check, X, Clock, Loader2, RefreshCw, Mail, Send,
  CheckCircle2, XCircle, Search, Filter
} from "lucide-react";

const STATUS_META = {
  pending:     { label: "En attente", color: "#E8A838", icon: Clock },
  in_progress: { label: "En cours",   color: "#4A6FA5", icon: Loader2 },
  resolved:    { label: "Traitée",    color: "#2D8C6F", icon: CheckCircle2 },
  rejected:    { label: "Refusée",    color: "#E05555", icon: XCircle },
};

const STATUS_TABS = [
  { id: "",            label: "Toutes" },
  { id: "pending",     label: "En attente" },
  { id: "in_progress", label: "En cours" },
  { id: "resolved",    label: "Traitées" },
  { id: "rejected",    label: "Refusées" },
];

export default function ContactRequestsView({ dk, onCountChange }) {
  const c = getAdminTheme(dk);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Modale de réponse
  const [respondTo, setRespondTo] = useState(null); // request
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("resolved");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminContactRequests({ status: statusFilter || undefined, search: search || undefined });
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setRequests(list);
      setError(null);
      onCountChange?.(list.filter(r => r.status === "pending").length);
    } catch (err) {
      setError(err.message || "Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!search) return requests;
    const q = search.toLowerCase();
    return requests.filter(r =>
      (r.subject || "").toLowerCase().includes(q) ||
      (r.message || "").toLowerCase().includes(q) ||
      (r.user_email || "").toLowerCase().includes(q) ||
      (r.user_full_name || "").toLowerCase().includes(q)
    );
  }, [requests, search]);

  const openRespond = (req, status = "resolved") => {
    setRespondTo(req);
    setResponseText(req.admin_response || "");
    setResponseStatus(status);
  };

  const submitResponse = async () => {
    if (!respondTo) return;
    try {
      setProcessingId(respondTo.id);
      const updated = await api.respondAdminContactRequest(respondTo.id, {
        status: responseStatus,
        admin_response: responseText.trim(),
      });
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      setRespondTo(null);
      setResponseText("");
    } catch (err) {
      setError(err.message || "Échec de la réponse.");
    } finally {
      setProcessingId(null);
    }
  };

  const quickAction = async (req, newStatus) => {
    try {
      setProcessingId(req.id);
      const updated = await api.respondAdminContactRequest(req.id, { status: newStatus });
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch (err) {
      setError(err.message || "Action impossible.");
    } finally {
      setProcessingId(null);
    }
  };

  const fmt = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.blue + "18" }}>
            <Mail size={20} style={{ color: c.blue }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: c.txt }}>Demandes utilisateurs</h1>
            <p className="text-xs" style={{ color: c.txt3 }}>
              {pendingCount > 0
                ? `${pendingCount} demande${pendingCount > 1 ? "s" : ""} en attente`
                : "Aucune demande en attente"}
            </p>
          </div>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80"
          style={{ borderColor: c.border, color: c.txt2 }}
        >
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Search + filter tabs */}
      <Card dk={dk} className="p-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.txt3 }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher (sujet, message, utilisateur, email)…"
              className="pl-9 pr-3 py-2 border rounded-xl text-sm w-full outline-none"
              style={{ background: c.row || c.card, borderColor: c.border, color: c.txt }}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} style={{ color: c.txt3 }} />
            {STATUS_TABS.map(tab => (
              <button
                key={tab.id || "all"}
                onClick={() => setStatusFilter(tab.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  background: statusFilter === tab.id ? c.blue : "transparent",
                  color: statusFilter === tab.id ? "#fff" : c.txt2,
                  borderColor: statusFilter === tab.id ? c.blue : c.border,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-3 rounded-xl text-xs font-semibold" style={{ background: "#E0555512", color: "#E05555", border: "1px solid #E0555544" }}>
          {error}
        </div>
      )}

      {/* List */}
      {loading && requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw size={32} className="animate-spin" style={{ color: c.blue }} />
          <p className="text-sm" style={{ color: c.txt3 }}>Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card dk={dk}>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Mail size={36} style={{ color: c.txt3 }} />
            <p className="text-sm font-semibold" style={{ color: c.txt2 }}>Aucune demande à afficher</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const meta = STATUS_META[req.status] || STATUS_META.pending;
            const Icon = meta.icon;
            const isProcessing = processingId === req.id;
            return (
              <Card key={req.id} dk={dk} className="p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.color + "22" }}>
                    <Icon size={18} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{ background: meta.color + "22", color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: c.txt3 }}>
                        {req.category_display || req.category}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: c.txt3 }}>
                        {fmt(req.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-bold mb-0.5" style={{ color: c.txt }}>{req.subject}</p>
                    <p className="text-xs mb-2" style={{ color: c.txt3 }}>
                      De&nbsp;: <span className="font-semibold" style={{ color: c.txt2 }}>{req.user_full_name || req.user_email}</span>
                      {" · "}<span className="opacity-80">{req.user_email}</span>
                      {req.user_role && <> · <span className="uppercase">{req.user_role}</span></>}
                    </p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: c.txt2 }}>{req.message}</p>

                    {req.admin_response && (
                      <div
                        className="mt-3 p-2.5 rounded-lg text-xs"
                        style={{ background: c.blue + "11", borderLeft: `3px solid ${c.blue}`, color: c.txt2 }}
                      >
                        <span className="font-bold" style={{ color: c.blue }}>Votre réponse : </span>
                        {req.admin_response}
                        {req.handled_by_name && (
                          <div className="mt-1 text-[10px]" style={{ color: c.txt3 }}>
                            par {req.handled_by_name} · {fmt(req.handled_at)}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => openRespond(req, "resolved")}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "#2D8C6F", opacity: isProcessing ? 0.6 : 1 }}
                      >
                        <Send size={12} /> Répondre & marquer traitée
                      </button>
                      {req.status === "pending" && (
                        <button
                          onClick={() => quickAction(req, "in_progress")}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                          style={{ borderColor: "#4A6FA555", color: "#4A6FA5" }}
                        >
                          <Loader2 size={12} /> Prendre en charge
                        </button>
                      )}
                      <button
                        onClick={() => openRespond(req, "rejected")}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                        style={{ borderColor: "#E0555555", color: "#E05555" }}
                      >
                        <X size={12} /> Refuser
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Respond modal */}
      {respondTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRespondTo(null)}>
          <div
            className="w-full max-w-xl rounded-2xl border p-5 shadow-2xl"
            style={{ background: c.card, borderColor: c.border }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Send size={16} style={{ color: c.blue }} />
              <p className="font-bold" style={{ color: c.txt }}>Répondre à la demande</p>
              <button onClick={() => setRespondTo(null)} className="ml-auto" style={{ color: c.txt3 }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: c.txt3 }}>
              À&nbsp;: <span className="font-semibold" style={{ color: c.txt2 }}>{respondTo.user_full_name || respondTo.user_email}</span>
              {" · "}{respondTo.subject}
            </p>

            <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: c.txt3 }}>Statut final</label>
            <div className="flex gap-2 mb-3 flex-wrap">
              {["in_progress", "resolved", "rejected"].map(s => {
                const meta = STATUS_META[s];
                return (
                  <button
                    key={s}
                    onClick={() => setResponseStatus(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                    style={{
                      background: responseStatus === s ? meta.color : "transparent",
                      color: responseStatus === s ? "#fff" : c.txt2,
                      borderColor: responseStatus === s ? meta.color : c.border,
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: c.txt3 }}>Message de réponse</label>
            <textarea
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="Expliquez la solution, l'action prise ou la raison du refus…"
              rows={5}
              className="px-3 py-2 border rounded-xl text-sm w-full outline-none resize-y min-h-[120px]"
              style={{ background: c.row || c.card, borderColor: c.border, color: c.txt }}
            />

            <div className="flex items-center gap-2 mt-4 justify-end">
              <button
                onClick={() => setRespondTo(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border"
                style={{ borderColor: c.border, color: c.txt2 }}
              >
                Annuler
              </button>
              <button
                onClick={submitResponse}
                disabled={processingId === respondTo.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: c.blue, opacity: processingId === respondTo.id ? 0.6 : 1 }}
              >
                {processingId === respondTo.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Envoyer la réponse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
