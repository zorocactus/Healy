import { useState, useEffect, useRef } from "react";
import { Mail, Lock, EyeOff, Eye, ArrowLeft, ArrowRight, Activity } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
  requestPasswordReset,
  verifyResetCode,
  confirmPasswordReset,
} from "../../services/api";

function passwordStrength(pw) {
  if (!pw) return { label: "", color: "#E4EAF5", width: "0%" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Faible", color: "#E05555", width: "33%" };
  if (score <= 3) return { label: "Moyen", color: "#E8A838", width: "66%" };
  return { label: "Fort", color: "#2D8C6F", width: "100%" };
}

export default function ForgotPassword({ onBack }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const c = isDark
    ? {
        bg: "#0D1117",
        inputBg: "rgba(255,255,255,0.08)",
        inputBorder: "border-white/15 focus:border-[#638ECB]",
        inputTxt: "#FFFFFF",
        icon: "rgba(255,255,255,0.4)",
        placeholder: "placeholder-white/40",
        label: "rgba(255,255,255,0.7)",
        title: "#FFFFFF",
        subtitle: "rgba(255,255,255,0.6)",
        blue: "#638ECB",
        divLine: "rgba(255,255,255,0.12)",
      }
    : {
        bg: "#F0F4F8",
        inputBg: "#ffffff",
        inputBorder: "border-[#E4EAF5] focus:border-[#4A6FA5]",
        inputTxt: "#0D1B2E",
        icon: "#4A6FA5",
        placeholder: "placeholder-[#9AACBE]",
        label: "#5A6E8A",
        title: "#0D1B2E",
        subtitle: "#5A6E8A",
        blue: "#4A6FA5",
        divLine: "#E4EAF5",
      };

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const codeRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function sendCode() {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Veuillez saisir votre email.");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setInfo("Si cet email est enregistré, un code vous a été envoyé.");
      setStep(2);
      setCooldown(60);
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (cooldown > 0 || loading) return;
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setInfo("Nouveau code envoyé.");
      setCooldown(60);
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(idx, val) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
  }

  function handleCodePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    codeRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function handleCodeKey(idx, e) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  }

  async function verifyCode() {
    setError("");
    setInfo("");
    const joined = code.join("");
    if (joined.length !== 6) {
      setError("Veuillez saisir les 6 chiffres du code.");
      return;
    }
    setLoading(true);
    try {
      const data = await verifyResetCode(email.trim(), joined);
      setResetToken(data.reset_token);
      setStep(3);
    } catch (err) {
      setError(err.message || "Code invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    setError("");
    setInfo("");
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPwd) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(resetToken, newPassword, confirmPwd);
      setInfo("Mot de passe modifié avec succès. Redirection...");
      setTimeout(() => onBack && onBack(), 2000);
    } catch (err) {
      setError(err.message || "Impossible de modifier le mot de passe.");
    } finally {
      setLoading(false);
    }
  }

  const strength = passwordStrength(newPassword);

  const inputBase = `w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all outline-none border-2 ${c.placeholder} ${c.inputBorder}`;

  return (
    <div
      className="w-full h-full flex flex-col justify-center px-8 xl:px-14 py-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="max-w-sm w-full mx-auto">
        {/* Logo */}
        <div className="flex items-center mb-8">
          <img src="/healy-logo.svg" alt="Healy" className="h-10 w-auto" />
        </div>

        {/* Bouton retour */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs mb-5 hover:underline cursor-pointer"
          style={{ color: c.blue }}
        >
          <ArrowLeft size={14} />
          Retour à la connexion
        </button>

        {/* Titre */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-tight mb-1.5" style={{ color: c.title }}>
            Mot de passe oublié
          </h1>
          <p className="text-sm" style={{ color: c.subtitle }}>
            {step === 1 && "Entrez votre email pour recevoir un code."}
            {step === 2 && `Code envoyé à ${email}`}
            {step === 3 && "Choisissez un nouveau mot de passe."}
          </p>
        </div>

        {/* Bannières */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl text-sm font-medium border bg-red-500/10 text-red-400 border-red-500/20">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-5 p-3.5 rounded-xl text-sm font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            {info}
          </div>
        )}

        {/* ── Étape 1 : email ─────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium block" style={{ color: c.label }}>
                Email
              </label>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: c.icon }}
                >
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  placeholder="vous@example.com"
                  className={inputBase}
                  style={{ background: c.inputBg, color: c.inputTxt }}
                />
              </div>
            </div>
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white shadow-lg group cursor-pointer hover:brightness-110 disabled:opacity-70"
              style={{ background: c.blue }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin border-white/30 border-t-white" />
                  Envoi...
                </>
              ) : (
                <>
                  Envoyer le code
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Étape 2 : OTP ───────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex justify-between gap-2" onPaste={handleCodePaste}>
              {code.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (codeRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKey(i, e)}
                  className={`w-11 h-12 text-center text-lg font-semibold rounded-xl border-2 ${c.inputBorder} outline-none`}
                  style={{ background: c.inputBg, color: c.inputTxt }}
                />
              ))}
            </div>
            <button
              onClick={verifyCode}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white shadow-lg cursor-pointer hover:brightness-110 disabled:opacity-70"
              style={{ background: c.blue }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin border-white/30 border-t-white" />
                  Vérification...
                </>
              ) : (
                "Vérifier le code"
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={resendCode}
                disabled={cooldown > 0 || loading}
                className="text-xs hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: c.blue }}
              >
                {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : nouveau mot de passe ──────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium block" style={{ color: c.label }}>
                Nouveau mot de passe
              </label>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: c.icon }}
                >
                  <Lock size={16} />
                </span>
                <input
                  type={showPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all outline-none border-2 ${c.placeholder} ${c.inputBorder}`}
                  style={{ background: c.inputBg, color: c.inputTxt }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: c.icon }}
                >
                  {showPwd ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: c.divLine }}>
                    <div
                      className="h-full transition-all"
                      style={{ background: strength.color, width: strength.width }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: c.subtitle }}>
                    Force : {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium block" style={{ color: c.label }}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: c.icon }}
                >
                  <Lock size={16} />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && changePassword()}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all outline-none border-2 ${c.placeholder} ${c.inputBorder}`}
                  style={{ background: c.inputBg, color: c.inputTxt }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: c.icon }}
                >
                  {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={changePassword}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white shadow-lg cursor-pointer hover:brightness-110 disabled:opacity-70"
              style={{ background: c.blue }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin border-white/30 border-t-white" />
                  Modification...
                </>
              ) : (
                "Changer le mot de passe"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
