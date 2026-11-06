// ContactAdminCard — disponible depuis Paramètres dans tous les dashboards
// (patient, médecin, pharmacien, garde-malade). Permet d'envoyer une demande
// à l'administrateur et de consulter l'historique de ses propres demandes.
import { useEffect, useState } from "react";
import { Mail, Send, Clock, CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";
import * as api from "../services/api";

const CATEGORIES = [
  { id: "technical", label: "Problème technique" },
  { id: "account",   label: "Compte / Accès" },
  { id: "billing",   label: "Facturation" },
  { id: "feature",   label: "Suggestion" },
  { id: "other",     label: "Autre" },
];

const STATUS_META = {
  pending:     { label: "En attente", color: "#E8A838", icon: Clock },
  in_progress: { label: "En cours",   color: "#4A6FA5", icon: Loader2 },
  resolved:    { label: "Traitée",    color: "#2D8C6F", icon: CheckCircle2 },
  rejected:    { label: "Refusée",    color: "#E05555", icon: XCircle },
};

export default function ContactAdminCard({ dk = false }) {
  const c = dk
    ? { card: "#141B27", border: "rgba(99,142,203,0.15)", txt: "#F0F3FA", txt2: "#8AAEE0", txt3: "#4A6080", blue: "#638ECB", input: "#1A2333" }
    : { card: "#ffffff", border: "#E4EAF5",               txt: "#0D1B2E", txt2: "#5A6E8A", txt3: "#9AACBE", blue: "#4A6FA5", input: "#F8FAFC" };

  const [form, setForm] = useState({ category: "other", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await api.getMyAdminContactRequests();
      setHistory(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      setStatus({ type: "info", msg: "Veuillez renseigner un sujet et un message." });
      setTimeout(() => setStatus({ type: "", msg: "" }), 4000);
      return;
    }
    try {
      setSending(true);
      setStatus({ type: "", msg: "" });
      await api.createAdminContactRequest({
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setStatus({ type: "success", msg: "Demande envoyée à l'administrateur." });
      setForm({ category: "other", subject: "", message: "" });
      loadHistory();
      setTimeout(() => setStatus({ type: "", msg: "" }), 4000);
    } catch (err) {
      setStatus({ type: "error", msg: err?.message || "Erreur lors de l'envoi." });
      setTimeout(() => setStatus({ type: "", msg: "" }), 4000);
    } finally {
      setSending(false);
    }
  };

  const fmt = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div
      className="rounded-2xl border p-5 shadow-sm"
      style={{ background: c.card, borderColor: c.border }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: c.blue + "18" }}
        >
          <Mail size={18} style={{ color: c.blue }} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base" style={{ color: c.txt }}>Contacter l'administrateur</p>
          <p className="text-xs" style={{ color: c.txt3 }}>
            Envoyez une demande, un signalement ou une suggestion à l'équipe Healy.
          </p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(s => !s)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
            style={{ borderColor: c.border, color: c.txt2 }}
          >
            {showHistory ? "Masquer" : `Historique (${history.length})`}
          </button>
        )}
      </div>

      {status.msg && (
        <div
          className="mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
          style={{
            background: status.type === "success" ? "#2D8C6F12" : status.type === "info" ? "#E8A83812" : "#E0555512",
            color:      status.type === "success" ? "#2D8C6F"   : status.type === "info" ? "#E8A838"   : "#E05555",
            border: `1px solid ${status.type === "success" ? "#2D8C6F44" : status.type === "info" ? "#E8A83844" : "#E0555544"}`,
          }}
        >
          {status.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: c.txt3 }}>Catégorie</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  background: form.category === cat.id ? c.blue : "transparent",
                  color: form.category === cat.id ? "#fff" : c.txt2,
                  borderColor: form.category === cat.id ? c.blue : c.border,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: c.txt3 }}>Sujet</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Résumé court de votre demande"
            maxLength={200}
            className="px-3 py-2 border rounded-xl text-sm w-full outline-none"
            style={{ background: c.input, borderColor: c.border, color: c.txt }}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: c.txt3 }}>Message</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Décrivez votre problème ou votre demande en détail…"
          rows={4}
          className="px-3 py-2 border rounded-xl text-sm w-full outline-none resize-y min-h-[100px]"
          style={{ background: c.input, borderColor: c.border, color: c.txt }}
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={sending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: c.blue, opacity: sending ? 0.7 : 1 }}
      >
        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {sending ? "Envoi…" : "Envoyer la demande"}
      </button>

      {showHistory && (
        <div className="mt-5 pt-5 border-t space-y-2" style={{ borderColor: c.border }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: c.txt3 }}>
            Mes demandes
          </p>
          {loadingHistory ? (
            <p className="text-xs" style={{ color: c.txt3 }}>Chargement…</p>
          ) : history.length === 0 ? (
            <p className="text-xs" style={{ color: c.txt3 }}>Aucune demande envoyée.</p>
          ) : (
            history.map(req => {
              const meta = STATUS_META[req.status] || STATUS_META.pending;
              const Icon = meta.icon;
              return (
                <div
                  key={req.id}
                  className="p-3 rounded-xl border"
                  style={{ background: c.input, borderColor: c.border }}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{ background: meta.color + "22", color: meta.color }}
                    >
                      <Icon size={10} /> {meta.label}
                    </span>
                    <span className="text-[10px]" style={{ color: c.txt3 }}>
                      {req.category_display || req.category}
                    </span>
                    <span className="text-[10px] ml-auto" style={{ color: c.txt3 }}>
                      {fmt(req.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: c.txt }}>{req.subject}</p>
                  <p className="text-xs mt-0.5 whitespace-pre-wrap" style={{ color: c.txt2 }}>{req.message}</p>
                  {req.admin_response && (
                    <div
                      className="mt-2 p-2 rounded-lg text-xs"
                      style={{ background: c.blue + "11", borderLeft: `3px solid ${c.blue}`, color: c.txt2 }}
                    >
                      <span className="font-bold" style={{ color: c.blue }}>Réponse admin : </span>
                      {req.admin_response}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
