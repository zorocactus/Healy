// ─── Shared React primitives for the Admin Dashboard ─────────────────────────
// Card, Badge — imported by all admin view files
import { getAdminTheme } from "./adminTheme.js";

/** Shared card component */
export function Card({ children, className = "", style = {}, dk, empty = false, ...rest }) {
  const c = getAdminTheme(dk);
  const hoverClasses = empty ? "" : "card-hover";
  return (
    <div
      className={`rounded-2xl border ${hoverClasses} ${className}`}
      style={{
        background: c.card,
        borderColor: c.border,
        boxShadow: dk
          ? "0 1px 3px rgba(0,0,0,0.4)"
          : "0 1px 4px rgba(74,111,165,0.06)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Shared badge */
export function Badge({ color, bg, children, className = "" }) {
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-full ${className}`}
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}
