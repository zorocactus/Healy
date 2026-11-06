import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

/**
 * DashSelect — dropdown thémé cohérent avec le système T de l'app.
 * Utilise un portal + position fixed pour éviter le clipping par overflow:hidden.
 *
 * @param {string}        label       — label en caps au-dessus du bouton (optionnel)
 * @param {string}        value       — valeur actuellement sélectionnée
 * @param {Array}         options     — tableau de strings OU de { value, label }
 * @param {function}      onSelect    — callback(value) à l'item sélectionné
 * @param {boolean}       dk          — dark mode
 * @param {object}        c           — objet couleurs T.dark | T.light
 * @param {string}        placeholder — texte si aucune valeur (défaut: "Sélectionner...")
 */
export default function DashSelect({
  label,
  value,
  options = [],
  onSelect,
  dk,
  c,
  placeholder = "Sélectionner...",
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const btnRef = useRef(null);

  const getValue = (opt) => (typeof opt === "string" ? opt : opt.value);
  const getLabel = (opt) => (typeof opt === "string" ? opt : opt.label);

  const selectedOpt = options.find((opt) => getValue(opt) === value);
  const displayLabel = selectedOpt ? getLabel(selectedOpt) : null;

  // Recalculate position whenever the dropdown opens or the window scrolls/resizes
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const handleOpen = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  };

  return (
    <div>
      {label && (
        <label
          className="block text-xs font-bold uppercase tracking-wide mb-1.5"
          style={{ color: c.txt2 }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          onClick={handleOpen}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm outline-none transition-all filter-hover"
          style={{
            background: dk ? "#1A2333" : "#F8FAFC",
            borderColor: open ? c.blue : c.border,
            color: displayLabel ? c.txt : c.txt3,
          }}
        >
          <span>{displayLabel || placeholder}</span>
          <ChevronDown
            size={16}
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            style={{ color: c.txt3 }}
          />
        </button>

        {open && rect && createPortal(
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            {/* Dropdown panel — fixed so it's never clipped */}
            <div
              style={{
                position: "fixed",
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
                background: dk ? "#141B27" : "#fff",
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                padding: "8px 0",
                maxHeight: 224,
                overflowY: "auto",
              }}
            >
              {options.map((opt) => {
                const v = getValue(opt);
                const l = getLabel(opt);
                const isSelected = value === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { onSelect(v); setOpen(false); }}
                    className="w-full flex items-center px-5 py-2.5 text-sm font-medium transition-all text-left"
                    style={{
                      color: isSelected ? c.blue : c.txt,
                      background: isSelected ? c.blue + "15" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = c.blue + "10"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span className="flex-1">{l}</span>
                    {isSelected && (
                      <Check size={14} style={{ color: c.blue }} />
                    )}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
}
