// src/pages/admin/views/ProfileUpdateRequests.jsx
import { useState, useEffect } from "react";
import * as api from "../../../services/api";
import { getAdminTheme } from "../adminTheme.js";
import { useLanguage } from "../../../context/LanguageContext";
import { Card } from "../AdminPrimitives.jsx";
import {
  Check, X, Clock, AlertTriangle,
  RefreshCw, UserCheck, MessageSquare
} from "lucide-react";

export default function ProfileUpdateRequests({ dk }) {
  const { t } = useLanguage();
  const c = getAdminTheme(dk);
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [rejectModal, setRejectModal]   = useState(null); // { id } | null
  const [rejectNotes, setRejectNotes]   = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminProfileUpdates();
      setRequests(Array.isArray(data) ? data : (data?.results ?? []));
      setError(null);
    } catch (err) {
      setError(err.message || "Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await api.actionProfileUpdate(id, "approve", "");
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message || "Échec de l'approbation.");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (id) => {
    setRejectNotes("");
    setRejectModal({ id });
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    const { id } = rejectModal;
    try {
      setProcessingId(id);
      await api.actionProfileUpdate(id, "reject", rejectNotes.trim() || "Documents insuffisants");
      setRequests(prev => prev.filter(r => r.id !== id));
      setRejectModal(null);
    } catch (err) {
      setError(err.message || "Échec du rejet.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw size={40} className="animate-spin" style={{ color: c.blue }} />
        <p className="text-sm font-semibold" style={{ color: c.txt3 }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Reject modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border shadow-2xl p-8" style={{ background: c.card, borderColor: c.border }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: c.red + "18" }}>
              <X size={24} style={{ color: c.red }} />
            </div>
            <h2 className="text-lg font-bold text-center mb-1" style={{ color: c.txt }}>Rejeter la demande</h2>
            <p className="text-sm text-center mb-6" style={{ color: c.txt3 }}>Indiquez la raison du rejet (optionnel)</p>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Documents insuffisants, informations incorrectes…"
              rows={4}
              disabled={processingId === rejectModal.id}
              className="w-full rounded-xl border p-3 text-sm resize-none outline-none"
              style={{ background: dk ? "#1A2333" : "#F8FAFC", borderColor: c.border, color: c.txt, fontFamily: "inherit" }}
            />
            <p className="text-xs mt-1 mb-5" style={{ color: c.txt3 }}>Laissez vide pour utiliser le motif par défaut.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                disabled={processingId === rejectModal.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: c.border, color: c.txt2 }}
              >
                Annuler
              </button>
              <button
                onClick={confirmReject}
                disabled={processingId === rejectModal.id}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: c.red }}
              >
                {processingId === rejectModal.id ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black" style={{ color: c.txt }}>
          {t('profile_updates_title') || "Demandes de modification de profil"}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: c.txt2 }}>
          {t('profile_updates_desc') || "Examinez et validez les demandes de changement de nom soumises par les utilisateurs."}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border flex items-center gap-3"
          style={{ background: c.red + "12", borderColor: c.red + "40", color: c.red }}>
          <AlertTriangle size={18} />
          <p className="text-sm font-bold flex-1">{error}</p>
          <button onClick={fetchRequests} className="text-xs underline font-bold shrink-0">
            Réessayer
          </button>
        </div>
      )}

      {!loading && requests.length === 0 ? (
        <Card dk={dk} empty={true} style={{ padding: 64, textAlign: "center" }}>
          <UserCheck size={48} style={{ color: c.green, margin: "0 auto 16px", opacity: 0.5 }} />
          <p className="text-lg font-bold" style={{ color: c.txt }}>
            {t('no_pending_updates') || "Aucune demande en attente"}
          </p>
          <p className="text-sm mt-1" style={{ color: c.txt3 }}>
            Toutes les demandes de modification ont été traitées.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <Card key={req.id} dk={dk} style={{ padding: 24 }}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* User Info */}
                <div className="flex items-center gap-4 shrink-0 min-w-[240px]">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: c.blue }}>
                    {((req.user_full_name || req.user_name || "U")[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: c.txt }}>
                      {req.user_full_name || req.user_name || "—"}
                    </h3>
                    <p className="text-xs font-medium" style={{ color: c.txt3 }}>
                      {req.user_email || "—"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: c.txt3 }}>
                      <Clock size={12} />
                      {req.created_at ? new Date(req.created_at).toLocaleDateString("fr-FR") : "—"}
                    </div>
                  </div>
                </div>

                {/* Changes Comparison */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border" style={{ background: c.header, borderColor: c.border }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50" style={{ color: c.txt }}>
                      {t('current_value') || "Valeur actuelle"}
                    </p>
                    <p className="text-sm font-bold" style={{ color: c.txt }}>
                      {[req.old_first_name, req.old_last_name].filter(Boolean).join(" ") || "—"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border" style={{ background: c.blue + "08", borderColor: c.blue + "40" }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: c.blue }}>
                      {t('requested_value') || "Nouvelle valeur demandée"}
                    </p>
                    <p className="text-sm font-bold" style={{ color: c.blue }}>
                      {[req.new_first_name, req.new_last_name].filter(Boolean).join(" ") || "—"}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                {req.reason && (
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center gap-2 mb-1.5 text-[10px] font-black uppercase tracking-widest opacity-60"
                      style={{ color: c.txt }}>
                      <MessageSquare size={12} />
                      {t('change_reason') || "Motif"}
                    </div>
                    <p className="text-sm leading-relaxed italic" style={{ color: c.txt2 }}>
                      "{req.reason}"
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={processingId === req.id}
                    className="h-10 px-4 rounded-xl flex items-center gap-2 font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    style={{ background: c.green }}
                  >
                    {processingId === req.id
                      ? <RefreshCw size={16} className="animate-spin" />
                      : <Check size={16} />}
                    {t('approve_change') || "Approuver"}
                  </button>
                  <button
                    onClick={() => openRejectModal(req.id)}
                    disabled={!!processingId}
                    className="h-10 px-4 rounded-xl flex items-center gap-2 font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    style={{ background: c.red }}
                  >
                    <X size={16} />
                    {t('reject_change') || "Rejeter"}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
