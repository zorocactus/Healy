import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getNotifications } from "../services/api";
import AuthTransition from "../components/Auth/AuthTransition";
import PatientDashboard from "../pages/patient/Dashboard";
import DoctorDashboard from "../pages/medical/DoctorDashboard";
import PharmacistDashboard from "../pages/pharmacist/PharmacistDashboard";
import AdminDashboard from "../pages/admin/Admindashboard";
import CaretakerDashboard from "../pages/caretaker/CaretakerDashboard";
import LandingPage from "../pages/LandingPage";
import BackgroundTest from "../pages/BackgroundTest";

// ─── Mapping rôles backend → dashboard ───────────────────────────────────────
//
//  accountType (normalisé dans AuthContext) :
//    "patient"           → PatientDashboard
//    "personnel médical" → selon userData.role :
//                           "pharmacist" / "Pharmacien"  → PharmacistDashboard
//                           "doctor"    / "Médecin"      → DoctorDashboard
//                           "caretaker" / "Garde-malade" → DoctorDashboard
//    "admin"             → AdminDashboard
//
// ─────────────────────────────────────────────────────────────────────────────

function PendingApprovalPage({ logout }) {
  const { t } = useLanguage();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F0F4F8",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "48px 40px",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 40px rgba(74,111,165,0.12)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, #E8A838, #c8891a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0D1B2E",
            marginBottom: 12,
          }}
        >
          {t('pending_approval_title') || "Compte en attente de validation"}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#5A6E8A",
            lineHeight: 1.7,
            marginBottom: 8,
          }}
        >
          {t('pending_approval_desc') || "Votre inscription a été reçue avec succès. Notre équipe administrative vérifie vos documents et informations professionnelles."}
        </p>
        <p style={{ fontSize: 13, color: "#9AACBE", marginBottom: 32 }}>
          {t('wait_time_desc') || "Vous recevrez une confirmation par e-mail sous 24–48 heures."}
        </p>
        <div
          style={{
            background: "#FFF8EC",
            border: "1px solid #E8A83840",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 28,
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#E8A838",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            {t('required_docs_verified') || "Documents requis vérifiés"}
          </p>
          {[
            t('doc_diploma') || "Diplôme ou titre professionnel",
            t('doc_id') || "Pièce d'identité nationale",
            t('doc_register') || "Registre professionnel / Numéro RPPS",
          ].map((d) => (
            <div
              key={d}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E8A838"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 13, color: "#5A6E8A" }}>{d}</span>
            </div>
          ))}
        </div>
        <button
          onClick={logout}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #304B71, #6492C9)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
          }}
        >
          {t('logout_btn') || "Se déconnecter"}
        </button>
      </div>
    </div>
  );
}

function RejectedPage({ logout }) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");

  useEffect(() => {
    getNotifications()
      .then((list) => {
        const items = Array.isArray(list) ? list : list?.results || [];
        const rejection = items.find(
          (n) =>
            (n.notification_type === "system" || n.type === "system") &&
            typeof n.message === "string" &&
            /motif|refus|rejet/i.test(n.message)
        );
        if (rejection?.message) {
          const cleaned = rejection.message.replace(/^.*?motif\s*:\s*/i, "").trim();
          setReason(cleaned || rejection.message);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F0F4F8",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "48px 40px",
          maxWidth: 460,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 40px rgba(74,111,165,0.12)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, #E05555, #B33B3B)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0D1B2E", marginBottom: 12 }}>
          {t("rejected_title") || "Votre dossier a été rejeté"}
        </h1>

        <p style={{ fontSize: 14, color: "#5A6E8A", lineHeight: 1.7, marginBottom: 20 }}>
          {t("rejected_desc") ||
            "Notre équipe administrative a examiné votre dossier et n'a pas pu valider votre inscription en l'état."}
        </p>

        <div
          style={{
            background: "#FDECEC",
            border: "1px solid #E0555540",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 28,
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#B33B3B",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            {t("rejection_reason_label") || "Motif"}
          </p>
          <p style={{ fontSize: 13, color: "#5A6E8A", lineHeight: 1.6 }}>
            {reason ||
              t("rejection_reason_unknown") ||
              "Aucun motif détaillé n'a été communiqué. Contactez le support pour plus d'informations."}
          </p>
        </div>

        <a
          href="mailto:support@Healy.dz?subject=Demande%20d'information%20-%20Dossier%20rejeté"
          style={{
            display: "block",
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #304B71, #6492C9)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          {t("contact_support_btn") || "Contacter le support"}
        </a>

        <button
          onClick={logout}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            background: "transparent",
            color: "#5A6E8A",
            fontWeight: 700,
            fontSize: 15,
            border: "1px solid #E4EAF5",
            cursor: "pointer",
          }}
        >
          {t("logout_btn") || "Se déconnecter"}
        </button>
      </div>
    </div>
  );
}

function SuspendedPage({ logout }) {
  const { t } = useLanguage();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0F4F8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(74,111,165,0.12)" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #E05555, #B33B3B)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0D1B2E", marginBottom: 12 }}>
          {t("suspended_title") || "Compte suspendu"}
        </h1>
        <p style={{ fontSize: 14, color: "#5A6E8A", lineHeight: 1.7, marginBottom: 28 }}>
          {t("suspended_desc") || "Votre compte a été temporairement suspendu par l'administrateur. Contactez le support pour plus d'informations."}
        </p>
        <a href="mailto:support@Healy.dz?subject=Demande%20réactivation%20compte%20suspendu"
          style={{ display: "block", width: "100%", padding: "14px", borderRadius: 14, background: "linear-gradient(135deg, #304B71, #6492C9)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", marginBottom: 12 }}>
          {t("contact_support_btn") || "Contacter le support"}
        </a>
        <button onClick={logout}
          style={{ width: "100%", padding: "14px", borderRadius: 14, background: "transparent", color: "#5A6E8A", fontWeight: 700, fontSize: 15, border: "1px solid #E4EAF5", cursor: "pointer" }}>
          {t("logout_btn") || "Se déconnecter"}
        </button>
      </div>
    </div>
  );
}

function RoleRouter({ pendingToken }) {
  const { accountType, userData, logout, isApproved } = useAuth();
  const { t } = useLanguage();

  const type = accountType?.toLowerCase()?.trim();

  // userData.role peut venir du backend en anglais (doctor, pharmacist, caretaker)
  // ou en français depuis le Register flow (Médecin, Pharmacien, Garde-malade)
  const role = userData?.role?.toLowerCase();

  // Suspended account — takes priority over all routing
  if (userData?.is_active === false) {
    return <SuspendedPage logout={logout} />;
  }

  if (type === "patient") {
    if (userData?.verification_status === "rejected") {
      return <RejectedPage logout={logout} />;
    }
    if (userData?.verification_status === "pending") {
      return <PendingApprovalPage logout={logout} />;
    }
    return <PatientDashboard onLogout={logout} />;
  }

  if (type === "personnel médical") {
    // Rejected dossier takes priority over the generic "pending" screen.
    if (userData?.verification_status === "rejected") {
      return <RejectedPage logout={logout} />;
    }
    // Block unapproved medical staff with a friendly pending page
    if (!isApproved) return <PendingApprovalPage logout={logout} />;

    const isPharmacist = role === "pharmacist" || role === "pharmacien";
    const isDoctor = role === "doctor" || role === "médecin";
    const isCaretaker = role === "caretaker" || role === "garde-malade";

    if (isPharmacist) return <PharmacistDashboard onLogout={logout} initialScanToken={pendingToken} />;
    if (isDoctor)
      return <DoctorDashboard role={userData?.role} onLogout={logout} />;
    if (isCaretaker) return <CaretakerDashboard onLogout={logout} />;

    // Rôle médical non précisé → DoctorDashboard par défaut
    return <DoctorDashboard role="Médecin" onLogout={logout} />;
  }

  if (type === "admin") {
    return <AdminDashboard onLogout={logout} />;
  }

  // Fallback — rôle non reconnu
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#D1DFEC]">
      <div className="bg-white rounded-2xl shadow-xl px-10 py-8 text-center max-w-sm">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #304B71, #6492C9)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect
              x="9"
              y="2"
              width="6"
              height="20"
              rx="2"
              fill="white"
              opacity="0.95"
            />
            <rect
              x="2"
              y="9"
              width="20"
              height="6"
              rx="2"
              fill="white"
              opacity="0.95"
            />
          </svg>
        </div>
        <p className="text-xl font-bold text-[#0D2644] mb-2">
          {t('role_not_recognized_title') || "Rôle non reconnu"}
        </p>
        <p className="text-sm text-[#5C738A] mb-1">{t('type_received_label') || "Type reçu du backend :"}</p>
        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
          {accountType} / {userData?.role}
        </code>
        <p className="text-xs text-[#9AACBE] mt-3 mb-6">
          {t('role_not_recognized_desc') || "Contactez l'administrateur ou reconnectez-vous."}
        </p>
        <button
          onClick={logout}
          className="w-full px-6 py-3 bg-[#6492C9] hover:bg-[#304B71] text-white rounded-xl font-semibold transition-all cursor-pointer"
        >
          {t('logout_btn') || "Se déconnecter"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Router ──────────────────────────────────────────────────────────────
export default function AppRouter() {
  // Tous les hooks DOIVENT être appelés inconditionnellement, avant tout return.
  // (rules-of-hooks) — sinon l'ordre des hooks change selon le hash et React crashe.
  const { isAuthenticated, loginWithData } = useAuth();
  const [authMode, setAuthMode] = useState(null); // null = landing, "login" | "register"
  const [forcedRole, setForcedRole] = useState("patient"); // Choix: "patient", "doctor", "pharmacist", "admin", "caretaker"

  // Détecte ?token= dans l'URL (ouvert par l'appli caméra native après scan QR)
  // useState garantit une seule capture, même avec les re-renders React StrictMode
  const [pendingToken] = useState(() => {
    const tok = new URLSearchParams(window.location.search).get('token') || null;
    if (tok) window.history.replaceState({}, '', window.location.pathname);
    return tok;
  });

  // Early return après les hooks — page de test des backgrounds (dev only)
  if (window.location.hash === "#/test-bg") {
    return <BackgroundTest />;
  }

  // =========================================================================
  // BYPASS RAPIDE POUR TESTS (Décommenter pour utiliser)
  // =========================================================================

  // Bypass dev — ne JAMAIS s'activer en production (Vite strip ce bloc si DEV=false).
  const FORCE_TEST = false && import.meta.env.DEV;

  if (FORCE_TEST) {
    const ROLE_MAP = {
      landing: <LandingPage onLogin={() => {}} onRegister={() => {}} />,
      auth: (
        <AuthTransition
          initialActive={true}
          onLogin={(t) => {
            if (import.meta.env.DEV) console.log("Auth login:", t);
          }}
          onBack={() => {}}
        />
      ),
      patient: (
        <PatientDashboard
          onLogout={() => {
            if (import.meta.env.DEV) console.log("Logout!");
          }}
        />
      ),
      doctor: (
        <DoctorDashboard
          onLogout={() => {
            if (import.meta.env.DEV) console.log("Logout!");
          }}
        />
      ),
      pharmacist: (
        <PharmacistDashboard
          onLogout={() => {
            if (import.meta.env.DEV) console.log("Logout!");
          }}
        />
      ),
      admin: (
        <AdminDashboard
          onLogout={() => {
            if (import.meta.env.DEV) console.log("Logout!");
          }}
        />
      ),
      caretaker: (
        <CaretakerDashboard
          onLogout={() => {
            if (import.meta.env.DEV) console.log("Logout!");
          }}
        />
      ),
    };
    const devRoles = [
      "landing",
      "auth",
      "patient",
      "doctor",
      "pharmacist",
      "admin",
      "caretaker",
    ];
    return (
      <>
        {ROLE_MAP[forcedRole]}
        {/* Dev Menu Flottant */}
        <div className="fixed bottom-4 right-4 z-[9999] flex gap-2 p-2 bg-[#0D2644] rounded-2xl shadow-2xl border border-white/10">
          {devRoles.map((role) => (
            <button
              key={role}
              onClick={() => setForcedRole(role)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white capitalize transition-all hover:opacity-90"
              style={{
                background: forcedRole === role ? "#6492C9" : "transparent",
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </>
    );
  }

  // =========================================================================

  // Non connecté → Landing Page (par défaut) ou Auth flow
  if (!isAuthenticated) {
    if (authMode) {
      return (
        <AuthTransition
          initialActive={authMode === "register"}
          onLogin={(type, data) => {
            loginWithData(type, data || {});
          }}
          onBack={() => setAuthMode(null)}
        />
      );
    }
    return (
      <LandingPage
        onLogin={() => setAuthMode("login")}
        onRegister={() => setAuthMode("register")}
      />
    );
  }

  // Connecté → dashboard selon le rôle
  return <RoleRouter pendingToken={pendingToken} />;
}
