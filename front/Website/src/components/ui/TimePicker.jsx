import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";

/**
 * Custom TimePicker — 24h format, locale-agnostic, rendered via Portal
 * so the dropdown is never clipped by parent overflow:hidden.
 */
export default function TimePicker({
  value = "",
  onChange,
  disabled = false,
  placeholder = "--:--",
  minuteStep = 15,
  minHour = 0,
  maxHour = 23,
  theme: c,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
  const [h, m] = value && value.includes(":") ? value.split(":").map(Number) : [null, null];

  // Compute popup position from trigger
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const popW = Math.max(r.width, 160);
    const popH = 240;
    let top = r.bottom + 4;
    let left = r.left;
    // Flip up if it would overflow bottom
    if (top + popH > window.innerHeight - 8) top = r.top - popH - 4;
    // Clamp horizontally
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (left < 8) left = 8;
    setPos({ top, left, width: popW });
  }, [open]);

  // Close on outside click / scroll / resize
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        popRef.current && !popRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onScroll = (e) => {
      // Ignore scrolls inside the popup itself (hour/minute columns)
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const select = (nh, nm) => {
    const pad = (n) => String(n).padStart(2, "0");
    onChange?.(`${pad(nh)}:${pad(nm)}`);
  };
  const pickHour = (nh) => select(nh, m ?? 0);
  const pickMinute = (nm) => select(h ?? minHour, nm);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold outline-none transition-all ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#638ECB] focus:ring-2 ring-[#638ECB33]"}`}
        style={{ background: c.bg, borderColor: open ? "#638ECB" : c.border, color: value ? c.txt : c.txt3 }}
      >
        <Clock size={14} style={{ color: c.txt3 }} />
        <span className="flex-1 text-left tabular-nums">
          {value ? value : placeholder}
        </span>
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          className="fixed z-[9999] rounded-xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ top: pos.top, left: pos.left, width: pos.width, background: c.card, borderColor: c.border }}
        >
          <div className="flex" style={{ height: 200 }}>
            {/* Hours */}
            <div className="flex-1 overflow-y-auto border-r" style={{ borderColor: c.border }}>
              <div className="sticky top-0 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-center z-10" style={{ background: c.bg, color: c.txt3 }}>
                H
              </div>
              {hours.map(hr => (
                <button
                  key={hr}
                  type="button"
                  onClick={() => pickHour(hr)}
                  className="w-full px-2 py-1.5 text-sm font-bold tabular-nums transition-colors hover:bg-[#638ECB18]"
                  style={{
                    background: h === hr ? "#638ECB" : "transparent",
                    color: h === hr ? "#fff" : c.txt,
                  }}
                >
                  {String(hr).padStart(2, "0")}
                </button>
              ))}
            </div>
            {/* Minutes */}
            <div className="flex-1 overflow-y-auto">
              <div className="sticky top-0 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-center z-10" style={{ background: c.bg, color: c.txt3 }}>
                M
              </div>
              {minutes.map(mn => (
                <button
                  key={mn}
                  type="button"
                  onClick={() => pickMinute(mn)}
                  className="w-full px-2 py-1.5 text-sm font-bold tabular-nums transition-colors hover:bg-[#638ECB18]"
                  style={{
                    background: m === mn ? "#638ECB" : "transparent",
                    color: m === mn ? "#fff" : c.txt,
                  }}
                >
                  {String(mn).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex border-t" style={{ borderColor: c.border, background: c.bg }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2 text-xs font-bold hover:opacity-70 transition-opacity"
              style={{ color: "#638ECB" }}
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
