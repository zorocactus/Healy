import { createContext, useContext, useState, useEffect, useRef } from "react";
import { login as apiLogin, logout as apiLogout, getMe, isAuthenticated } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [accountType, setAccountType] = useState(null);
  const [userData, setUserData]       = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (isAuthenticated()) {
        try {
          const me = await getMe();
          if (me) {
            if (me.is_active === false) {
              apiLogout();
              window.location.href = "/?suspended=1";
              return;
            }
            setUserData(me);
            setAccountType(normalizeRole(me.role));
            setIsLoggedIn(true);
          }
        } catch {
          apiLogout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  // Poll every 30 s to detect real-time suspension while user is logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setInterval(async () => {
      try {
        const me = await getMe();
        if (me?.is_active === false) {
          apiLogout();
          window.location.href = "/?suspended=1";
        } else if (me) {
          setUserData(me);
        }
      } catch { /* token expired — apiFetch already redirects */ }
    }, 300000); // 5 min — réduit la charge serveur vs. polling 30 s
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  function normalizeRole(role) {
    const map = {
      patient:             "patient",
      doctor:              "personnel médical",
      pharmacist:          "personnel médical",
      caretaker:           "personnel médical",
      admin:               "admin",
      "personnel médical": "personnel médical",
    };
    return map[role?.toLowerCase()] || role?.toLowerCase() || "patient";
  }

  async function login(email, password) {
    const data = await apiLogin(email, password);
    if (!data?.access) throw new Error("Identifiants incorrects");

    // Après login on récupère le profil complet
    const me = await getMe();
    if (me?.is_active === false) {
      apiLogout();
      throw new Error("SUSPENDED");
    }
    setUserData({ ...data, ...me });
    setAccountType(normalizeRole(me?.role || data?.role));
    setIsLoggedIn(true);
    return me;
  }

  function loginWithData(type, data = {}) {
    setAccountType(normalizeRole(type));
    setUserData(data);
    setIsLoggedIn(true);
  }

  async function logout() {
    // apiLogout est désormais async (révoque le refresh token côté serveur).
    // On déclenche la révocation mais on n'attend pas plus de 2s pour ne pas
    // bloquer la déconnexion si le backend est lent.
    try {
      await Promise.race([
        apiLogout(),
        new Promise((res) => setTimeout(res, 2000)),
      ]);
    } catch { /* ignore */ }
    setIsLoggedIn(false);
    setAccountType(null);
    setUserData(null);
    window.location.replace("/");
  }

  async function refreshUserData() {
    try {
      const me = await getMe();
      if (me) setUserData(me);
    } catch { /* silencieux */ }
  }

  // Derived: medical professionals must be approved before accessing dashboard.
  // Backend sets verification_status = 'verified' (admin_panel/views.py line 33).
  const isApproved = (() => {
    if (!userData) return true;
    const vs = userData.verification_status;
    // 'unverified' or 'pending' → blocked; 'verified' → allowed; null/undefined → allowed (patient)
    if (vs === 'pending' || vs === 'unverified' || vs === 'rejected') return false;
    return true;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D1DFEC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #304B71, #6492C9)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="20" rx="2" fill="white" opacity="0.95"/>
              <rect x="2" y="9" width="20" height="6" rx="2" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#6492C9] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm font-semibold text-[#5A6E8A]">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: isLoggedIn, accountType, userData, login, loginWithData, logout, isApproved, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}