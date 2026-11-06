import { useState, useEffect } from "react";
import { Mail, Lock, EyeOff, Eye, ArrowRight, Activity } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import ForgotPassword from "./ForgotPassword";

export default function LoginForm({ onLogin, onSwitchToRegister }) {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }
  return <LoginInner onLogin={onLogin} onSwitchToRegister={onSwitchToRegister} onForgotPassword={() => setShowForgotPassword(true)} />;
}

function LoginInner({ onLogin, onSwitchToRegister, onForgotPassword }) {
  const { login } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  // ── Tokens séparés dark / light pour un contraste optimal ─────────────────
  const c = isDark ? {
    bg:          "#0D1117",
    inputBg:     "rgba(255,255,255,0.08)",
    inputBorder: "border-white/15 focus:border-[#638ECB]",
    inputTxt:    "#FFFFFF",
    icon:        "rgba(255,255,255,0.4)",
    placeholder: "placeholder-white/40",
    label:       "rgba(255,255,255,0.7)",
    title:       "#FFFFFF",
    subtitle:    "rgba(255,255,255,0.6)",
    blue:        "#638ECB",
    blueHover:   "#7AABEE",
    divLine:     "rgba(255,255,255,0.12)",
    divTxt:      "rgba(255,255,255,0.4)",
    switchTxt:   "rgba(255,255,255,0.6)",
    msgBorder:   "rgba(255,255,255,0.15)",
    msgBg:       "rgba(59,130,246,0.08)",
  } : {
    bg:          "#F0F4F8",
    inputBg:     "#ffffff",
    inputBorder: "border-[#E4EAF5] focus:border-[#4A6FA5]",
    inputTxt:    "#0D1B2E",
    icon:        "#4A6FA5",
    placeholder: "placeholder-[#9AACBE]",
    label:       "#5A6E8A",
    title:       "#0D1B2E",
    subtitle:    "#5A6E8A",
    blue:        "#4A6FA5",
    blueHover:   "#3D5E8F",
    divLine:     "#E4EAF5",
    divTxt:      "#9AACBE",
    switchTxt:   "#5A6E8A",
    msgBorder:   "#D0DBF0",
    msgBg:       "#EEF3FB",
  };

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthMessage, setOauthMessage] = useState("");

  const [isSuspendedError, setIsSuspendedError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("suspended") === "1") {
      setIsSuspendedError(true);
      setApiError(t('auth.login.sessionSuspended'));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("expired") === "1") {
      setApiError(t('auth.login.sessionExpired'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  async function handleSubmit() {
    const newErrors = {};
    if (!email.trim()) newErrors.email = true;
    if (!password.trim()) newErrors.password = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setApiError("");
    setLoading(true);
    try {
      const me = await login(email, password);
      onLogin(me?.role || "patient", me);
    } catch (err) {
      const msg = err.message || "";
      const isSuspended = msg === "SUSPENDED" || /suspen|disabled|inactive|inactif/i.test(msg);
      setIsSuspendedError(isSuspended);
      setApiError(
        isSuspended
          ? t('auth.login.sessionSuspended')
          : t('auth.login.incorrectCredentials')
      );
    } finally {
      setLoading(false);
    }
  }



  // classe commune pour les inputs (sans fond ni border, ajoutés via style + c.inputBorder)
  const inputBase = (padRight, hasError) =>
    `w-full pl-10 ${padRight} py-3 rounded-xl text-sm transition-all outline-none border-2 ${c.placeholder} ${hasError ? "border-red-400" : c.inputBorder}`;

  return (
    <div
      className="w-full h-full flex flex-col justify-center px-8 xl:px-14 py-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="max-w-sm w-full mx-auto">

        {/* ── Logo ─────────────────────────────────────── */}
        <div className="flex items-center mb-9">
          <img src="/healy-logo.svg" alt="Healy" className="h-10 w-auto" />
        </div>

        {/* ── Titre ────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-tight mb-1.5" style={{ color: c.title }}>
            {t('auth.login.title')}
          </h1>
          <p className="text-sm" style={{ color: c.subtitle }}>{t('auth.login.subtitle')}</p>
        </div>

        {/* ── Messages d'erreur ────────────────────────── */}
        {apiError && (
          <div className={`mb-5 p-3.5 rounded-xl text-sm font-medium border ${
            isSuspendedError
              ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}>
            {apiError}
          </div>
        )}
        {oauthMessage && (
          <div className="mb-5 p-3.5 rounded-xl text-sm font-medium border"
            style={{ color: c.subtitle, borderColor: c.msgBorder, background: c.msgBg }}>
            {oauthMessage}
          </div>
        )}

        <div className="space-y-5">

          {/* ── Email ────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium block" style={{ color: c.label }}>{t('auth.login.email')}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.icon }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.login.emailPlaceholder')}
                className={inputBase("pr-4", errors.email)}
                style={{ background: c.inputBg, color: c.inputTxt }}
              />
            </div>
            {errors.email && <p className="text-xs text-red-400">{t('auth.login.required')}</p>}
          </div>

          {/* ── Mot de passe ─────────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: c.label }}>{t('auth.login.password')}</label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs transition-colors hover:underline cursor-pointer bg-transparent border-0 p-0"
                style={{ color: c.blue }}
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.icon }}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                className={inputBase("pr-12", errors.password)}
                style={{ background: c.inputBg, color: c.inputTxt }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                style={{ color: c.icon }}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{t('auth.login.required')}</p>}
          </div>

          {/* ── Bouton connexion ─────────────────────── */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white shadow-lg group cursor-pointer hover:brightness-110 disabled:opacity-70"
            style={{ background: c.blue }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 rounded-full animate-spin border-white/30 border-t-white" />
                {t('auth.login.signingIn')}
              </>
            ) : (
              <>
                {t('auth.login.signIn')}
                <ArrowRight size={18} className="transform transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>



          {/* ── Switch vers Register ─────────────────── */}
          {onSwitchToRegister && (
            <p className="text-center text-sm pt-1" style={{ color: c.switchTxt }}>
              {t('auth.login.noAccount')}{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold transition-colors hover:underline cursor-pointer"
                style={{ color: c.blue }}
              >
                {t('auth.login.signUp')}
              </button>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
