import { MessageSquare } from "lucide-react";

/**
 * ChatButton — icône MessageSquare avec badge non-lus.
 * Props :
 *   unreadCount  {number}  — total messages non lus
 *   onClick      {fn}      — ouvre ConversationList
 *   c            {object}  — tokens couleur du thème courant
 */
export default function ChatButton({ unreadCount = 0, onClick, c }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:opacity-80 active:scale-95"
      style={{ borderColor: c.border, background: "transparent" }}
      title="Messages"
    >
      <MessageSquare size={18} style={{ color: c.txt2 }} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: c.red, fontSize: 9, paddingInline: 3 }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
