import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

const ICONS = {
  error:   <AlertCircle  size={16} className="shrink-0 text-red-400" />,
  success: <CheckCircle  size={16} className="shrink-0 text-green-400" />,
  info:    <Info         size={16} className="shrink-0 text-blue-400" />,
};

const BG = {
  error:   "rgba(30,0,0,0.92)",
  success: "rgba(0,30,15,0.92)",
  info:    "rgba(0,15,35,0.92)",
};

const BORDER = {
  error:   "#E05555",
  success: "#2D8C6F",
  info:    "#4A6FA5",
};

const AUTO_DISMISS_MS = 5000;

export default function ErrorToast() {
  const { globalNotifications, markNotificationRead } = useData();
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    // ErrorToast n'affiche QUE les notifications locales (erreurs/warnings côté
    // client). Les notifications serveur (caretaker, appointment, pharmacy, …)
    // ne doivent PAS apparaître en toast : elles sont affichées dans la cloche
    // de notifications. Sinon chaque notif backend ferait popup un toast à
    // chaque polling — et avec l'ancien filtre `!n.read` (champ qui n'existe
    // plus), `markNotificationRead` était appelé en boucle infinie.
    const unread = globalNotifications.filter(
      n => n.local === true && !n.is_read && n.type !== "info_silent"
    );
    if (unread.length === 0) return;

    // Ajoute les nouvelles notifs à la liste visible
    setVisible(prev => {
      const prevIds = new Set(prev.map(n => n.id));
      const toAdd = unread.filter(n => !prevIds.has(n.id));
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });

    // Marquer comme lues — pas d'appel API car ce sont des notifs locales (id "local-…")
    unread.forEach(n => markNotificationRead(n.id));
  }, [globalNotifications]);

  function dismiss(id) {
    setVisible(prev => prev.filter(n => n.id !== id));
  }

  // Auto-dismiss
  useEffect(() => {
    if (visible.length === 0) return;
    const timer = setTimeout(() => {
      setVisible(prev => prev.slice(1));
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible.length]);

  if (visible.length === 0) return null;

  return (
    <div
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 380 }}
    >
      {visible.map(n => (
        <div
          key={n.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 14,
            border: `1px solid ${BORDER[n.type] || BORDER.info}`,
            background: BG[n.type] || BG.info,
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            animation: "slideInRight 0.25s ease",
          }}
        >
          {ICONS[n.type] || ICONS.info}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#F0F3FA", margin: 0 }}>{n.title}</p>
            <p style={{ fontSize: 12, color: "#8AAEE0", margin: "2px 0 0", wordBreak: "break-word" }}>{n.message}</p>
          </div>
          <button
            onClick={() => dismiss(n.id)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#4A6080", flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
