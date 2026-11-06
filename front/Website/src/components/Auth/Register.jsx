import { useState, useEffect, useRef } from "react";
import { User, EyeOff, Eye, Mail, Lock, ArrowRight, UserCircle, ShieldCheck } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { sendRegisterOTP, verifyRegisterOTP } from "../../services/api";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(pw) {
  if (!pw || pw.length < 8) return "Minimum 8 caractères";
  if (!/\d/.test(pw) && !/[^A-Za-z0-9]/.test(pw)) return "Ajoutez des chiffres ou des caractères spéciaux";
  return null;
}

export default function RegisterForm({ onLogin, onNextStep, isVisible, onSwitchToLogin, initialData, serverErrors = {} }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

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
    divLine:     "rgba(255,255,255,0.12)",
    divTxt:      "rgba(255,255,255,0.4)",
    switchTxt:   "rgba(255,255,255,0.6)",
    msgBorder:   "rgba(255,255,255,0.15)",
    msgBg:       "rgba(59,130,246,0.08)",
    typeIdleBg:  "rgba(255,255,255,0.06)",
    typeIdleBorder: "border-white/15",
    typeIdleTxt: "rgba(255,255,255,0.55)",
    otpBg:       "rgba(255,255,255,0.08)",
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
    divLine:     "#E4EAF5",
    divTxt:      "#9AACBE",
    switchTxt:   "#5A6E8A",
    msgBorder:   "#D0DBF0",
    msgBg:       "#EEF3FB",
    typeIdleBg:  "#ffffff",
    typeIdleBorder: "border-[#E4EAF5]",
    typeIdleTxt: "#5A6E8A",
    otpBg:       "#ffffff",
  };

  const [firstName, setFirstName]               = useState(initialData?.firstName || "");
  const [lastName, setLastName]                 = useState(initialData?.lastName || "");
  const [email, setEmail]                       = useState(initialData?.email || "");
  const [password, setPassword]                 = useState(initialData?.password || "");
  const [confirmPassword, setConfirmPassword]   = useState(initialData?.password || "");
  const [errors, setErrors]                     = useState({});
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType]           = useState(initialData?.accountType || "patient");
  const [oauthMessage, setOauthMessage]         = useState("");

  const accountTypeOptions = [
    { value: "patient", label: t('auth.register.patient') },
    { value: "personnel médical", label: t('auth.register.medicalStaff') },
  ];

  // OTP step 1.5
  const [otpStep, setOtpStep]         = useState(false);
  const [otpCode, setOtpCode]         = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading]   = useState(false);
  const [otpError, setOtpError]       = useState("");
  const [otpInfo, setOtpInfo]         = useState("");
  const [cooldown, setCooldown]       = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (!isVisible) {
      setFirstName(""); setLastName(""); setEmail(""); setPassword("");
      setConfirmPassword(""); setErrors({}); setShowPassword(false);
      setShowConfirmPassword(false); setAccountType("patient");
      setOtpStep(false); setOtpCode(["", "", "", "", "", ""]); setOtpError(""); setOtpInfo("");
    }
  }, [isVisible]);

  // ── Validation per-field ──────────────────────────────────────────────────

  function validateField(name, value) {
    if (name === "firstName" || name === "lastName") {
      return !value.trim() ? "Ce champ est requis" : null;
    }
    if (name === "email") {
      if (!value.trim()) return "Ce champ est requis";
      if (!validateEmail(value)) return "Format email invalide";
      return null;
    }
    if (name === "password") {
      return validatePassword(value);
    }
    if (name === "confirmPassword") {
      if (!value.trim()) return "Ce champ est requis";
      if (value !== password) return "Les mots de passe ne correspondent pas";
      return null;
    }
    return null;
  }

  function handleBlur(name, value) {
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  }

  function handleSubmit() {
    const fields = { firstName, lastName, email, password, confirmPassword };
    const newErrors = {};
    Object.entries(fields).forEach(([k, v]) => {
      const err = validateField(k, String(v));
      if (err) newErrors[k] = err;
    });
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    // Send OTP then show OTP step
    setOtpLoading(true);
    setOtpError("");
    setOtpInfo("");
    sendRegisterOTP(email.trim())
      .then(() => {
        setOtpStep(true);
        setCooldown(60);
        setOtpInfo("Un code à 6 chiffres a été envoyé à " + email.trim());
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      })
      .catch((err) => {
        const msg = err?.message || "";
        if (msg.includes("existe déjà")) {
          setErrors({ email: "Un compte existe déjà avec cet email" });
        } else {
          setOtpError(msg || "Erreur lors de l'envoi du code.");
          // En mode console backend, on passe quand même (affichage terminal)
          setOtpStep(true);
          setCooldown(60);
          setOtpInfo("Code affiché dans le terminal Django (mode dev).");
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
      })
      .finally(() => setOtpLoading(false));
  }

  // ── OTP handlers ─────────────────────────────────────────────────────────

  function handleOtpChange(idx, val) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpCode];
    next[idx] = digit;
    setOtpCode(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKey(idx, e) {
    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpCode(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerifyOTP() {
    const joined = otpCode.join("");
    if (joined.length !== 6) { setOtpError("Veuillez saisir les 6 chiffres."); return; }
    setOtpLoading(true);
    setOtpError("");
    try {
      await verifyRegisterOTP(email.trim(), joined);
      if (onNextStep) {
        onNextStep({ firstName, lastName, email, accountType, password, confirmPassword });
      } else {
        onLogin(accountType);
      }
    } catch (err) {
      setOtpError(err?.message || "Code incorrect ou expiré.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function resendOTP() {
    if (cooldown > 0 || otpLoading) return;
    setOtpLoading(true);
    setOtpError("");
    setOtpInfo("");
    try {
      await sendRegisterOTP(email.trim());
      setOtpInfo("Nouveau code envoyé.");
      setCooldown(60);
    } catch {
      setOtpInfo("Code affiché dans le terminal Django (mode dev).");
      setCooldown(60);
    } finally {
      setOtpLoading(false);
    }
  }





  const inputCls = (err, extraPad = "pr-4") =>
    `w-full pl-9 ${extraPad} py-[10px] rounded-xl text-sm transition-all outline-none border-2 ${c.placeholder} ${err ? "border-red-400" : c.inputBorder}`;

  // ── OTP Step 1.5 ─────────────────────────────────────────────────────────

  if (otpStep) {
    return (
      <div
        className="w-full h-full flex flex-col justify-center px-8 xl:px-14 py-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ background: c.bg }}
      >
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center mb-6">
            <img src="/healy-logo.svg" alt="Healy" className="h-10 w-auto" />
          </div>

          <div className="mb-5">
            <h1 className="text-[22px] font-bold leading-tight mb-1" style={{ color: c.title }}>Vérification de l'email</h1>
            <p className="text-[12px]" style={{ color: c.subtitle }}>
              Code envoyé à <span className="font-semibold">{email}</span>
            </p>
          </div>

          {otpError && (
            <div className="mb-4 p-3 rounded-xl text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">
              {otpError}
            </div>
          )}
          {otpInfo && (
            <div className="mb-4 p-3 rounded-xl text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {otpInfo}
            </div>
          )}

          <div className="flex justify-between gap-2 mb-4" onPaste={handleOtpPaste}>
            {otpCode.map((d, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKey(i, e)}
                className={`w-11 h-12 text-center text-lg font-semibold rounded-xl border-2 ${c.inputBorder} outline-none`}
                style={{ background: c.otpBg, color: c.inputTxt }}
              />
            ))}
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={otpLoading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white shadow-lg cursor-pointer hover:brightness-110 disabled:opacity-70 mb-3"
            style={{ background: c.blue }}
          >
            {otpLoading ? (
              <><div className="w-4 h-4 border-2 rounded-full animate-spin border-white/30 border-t-white" /> Vérification...</>
            ) : (
              <>Vérifier le code <ArrowRight size={17} /></>
            )}
          </button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setOtpStep(false); setOtpCode(["", "", "", "", "", ""]); setOtpError(""); }}
              className="text-xs hover:underline cursor-pointer"
              style={{ color: c.subtitle }}
            >
              ← Modifier l'email
            </button>
            <button
              type="button"
              onClick={resendOTP}
              disabled={cooldown > 0 || otpLoading}
              className="text-xs hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: c.blue }}
            >
              {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1 — Formulaire principal ─────────────────────────────────────────

  return (
    <div
      className="w-full h-full flex flex-col justify-center px-8 xl:px-14 py-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ background: c.bg }}
    >
      <div className="max-w-md w-full mx-auto">

        <div className="flex items-center mb-4">
          <img src="/healy-logo.svg" alt="Healy" className="h-10 w-auto" />
        </div>

        <div className="mb-3">
          <h1 className="text-[22px] font-bold leading-tight mb-1" style={{ color: c.title }}>{t('auth.register.title')}</h1>
          <p className="text-[12px]" style={{ color: c.subtitle }}>{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-3">

            {/* Prénom / Nom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[12px] font-medium block" style={{ color: c.label }}>{t('auth.register.firstName')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.icon }}>
                    <User size={14} />
                  </span>
                  <input
                    type="text" value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); if (errors.firstName) setErrors(p => ({ ...p, firstName: null })); }}
                    onBlur={(e) => handleBlur("firstName", e.target.value)}
                    className={inputCls(errors.firstName)} placeholder={t('auth.register.firstNameHint')}
                    style={{ background: c.inputBg, color: c.inputTxt }}
                  />
                </div>
                {errors.firstName && <p className="text-[11px] text-red-400">{errors.firstName}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium block" style={{ color: c.label }}>{t('auth.register.lastName')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.icon }}>
                    <User size={14} />
                  </span>
                  <input
                    type="text" value={lastName}
                    onChange={(e) => { setLastName(e.target.value); if (errors.lastName) setErrors(p => ({ ...p, lastName: null })); }}
                    onBlur={(e) => handleBlur("lastName", e.target.value)}
                    className={inputCls(errors.lastName)} placeholder={t('auth.register.lastNameHint')}
                    style={{ background: c.inputBg, color: c.inputTxt }}
                  />
                </div>
                {errors.lastName && <p className="text-[11px] text-red-400">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium block" style={{ color: c.label }}>{t('auth.register.email')}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.icon }}>
                  <Mail size={14} />
                </span>
                <input
                  type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: null })); }}
                  onBlur={(e) => handleBlur("email", e.target.value)}
                  className={inputCls(errors.email)} placeholder={t('auth.register.emailHint')}
                  style={{ background: c.inputBg, color: c.inputTxt }}
                />
              </div>
              {(errors.email || serverErrors.email) && <p className="text-[11px] text-red-400">{errors.email || serverErrors.email}</p>}
            </div>

            {/* Mot de passe */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium block" style={{ color: c.label }}>{t('auth.register.password')}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.icon }}>
                  <Lock size={14} />
                </span>
                <input
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: null })); }}
                  onBlur={(e) => handleBlur("password", e.target.value)}
                  className={inputCls(errors.password, "pr-12")} placeholder="••••••••"
                  style={{ background: c.inputBg, color: c.inputTxt }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                  style={{ color: c.icon }}>
                  {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
              {(errors.password || serverErrors.password) && <p className="text-[11px] text-red-400">{errors.password || serverErrors.password}</p>}
            </div>

            {/* Confirmer mot de passe */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium block" style={{ color: c.label }}>{t('auth.register.confirmPassword')}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.icon }}>
                  <Lock size={14} />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: null })); }}
                  onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                  className={inputCls(errors.confirmPassword, "pr-12")} placeholder="••••••••"
                  style={{ background: c.inputBg, color: c.inputTxt }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                  style={{ color: c.icon }}>
                  {showConfirmPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-red-400">{errors.confirmPassword}</p>}
            </div>

            {/* Type de compte */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium block" style={{ color: c.label }}>{t('auth.register.accountType')}</label>
              <div className="grid grid-cols-2 gap-3">
                {accountTypeOptions.map(({ value, label }) => {
                  const isSelected = accountType === value;
                  return (
                    <button
                      key={value} type="button" onClick={() => setAccountType(value)}
                      className={`w-full py-2 rounded-xl border-2 transition-all text-[12px] font-medium cursor-pointer flex items-center justify-center ${
                        isSelected ? "border-transparent" : c.typeIdleBorder
                      }`}
                      style={isSelected
                        ? { background: c.blue, color: "#ffffff" }
                        : { background: c.typeIdleBg, color: c.typeIdleTxt }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Continuer */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white shadow-lg group cursor-pointer hover:brightness-110 disabled:opacity-70"
                style={{ background: c.blue }}
              >
                {otpLoading ? (
                  <><div className="w-4 h-4 border-2 rounded-full animate-spin border-white/30 border-t-white" /> Envoi du code...</>
                ) : (
                  <>{t('auth.register.continue')} <ArrowRight size={17} className="transform transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
            </div>

          </div>
        </form>

          {onSwitchToLogin && (
            <p className="text-center text-[12px] pt-5" style={{ color: c.switchTxt }}>
              {t('auth.register.alreadyAccount')}{" "}
              <button type="button" onClick={onSwitchToLogin}
                className="font-semibold transition-colors hover:underline cursor-pointer" style={{ color: c.blue }}>
                {t('auth.register.login')}
              </button>
            </p>
          )}

      </div>


    </div>
  );
}
