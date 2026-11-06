// src/pages/admin/views/AdminSidebar.jsx
import {
  LayoutDashboard, Users, Pill, Shield,
  UserCheck, Calendar, X,
  LogOut, User, Activity, ListFilter,
  Building2, ClipboardList, ShieldAlert, Mail
} from "lucide-react";
import { getAdminTheme } from "../adminTheme.js";
import { useLanguage } from "../../../context/LanguageContext";

// ─── Component ──────────────────────────────────────────────────────────────
export default function AdminSidebar({
  dk: _dk,
  activePage,
  onNav,
  onLogout,
  userData,
  badgeCounts = {},
  mobileOpen,
  onCloseMobile,
}) {
  const { t } = useLanguage();
  const c = getAdminTheme(_dk ?? true);

  const NAV_SECTIONS = [
    {
      title: t('menu_group'),
      items: [
        { id: "overview",     label: t('dashboard'),       icon: LayoutDashboard },
      ],
    },
    {
      title: t('people_group'),
      items: [
        { id: "utilisateurs", label: t('all_users'), icon: Users },
      ],
    },
    {
      title: t('operations_group'),
      items: [
        { id: "validation",   label: t('validation'),       icon: UserCheck, badge: true },
        { id: "profile_updates", label: t('profile_updates'), icon: User, badge: true },
        { id: "contact_requests", label: "Demandes utilisateurs", icon: Mail, badge: true },
        { id: "rendezvous",   label: t('rendezvous'),      icon: Calendar },
        { id: "planning",     label: t('planning'),         icon: ListFilter },
        { id: "queue",        label: t('queue'),   icon: Activity, pulse: true },
        { id: "pharmacies",   label: t('pharmacies'),       icon: Building2 },
        { id: "gardemalades", label: t('caretakers'),    icon: ClipboardList },
      ],
    },
    {
      title: t('management_group'),
      items: [
        { id: "medicaments",  label: t('medicines'),      icon: Pill },
      ],
    },
    {
      title: t('system_group'),
      items: [
        { id: "reports",      label: t('reports'),      icon: ShieldAlert, badge: true },
        { id: "audit",        label: t('audit'),        icon: Shield },
      ],
    },
  ];
  const userInitials = (() => {
    if (!userData) return "AD";
    const f = userData.first_name?.[0] ?? "";
    const l = userData.last_name?.[0] ?? "";
    return (f + l).toUpperCase() || "AD";
  })();

  const NavItem = ({ item }) => {
    const isActive = activePage === item.id;
    const badgeCount = item.badge ? (badgeCounts[item.id] ?? 0) : 0;

    return (
      <button
        onClick={() => { onNav(item.id); onCloseMobile?.(); }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group/item"
        style={{
          background: isActive ? c.blueFaint : "transparent",
          color: isActive ? c.blue : c.txt2,
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.background = c.row;
            e.currentTarget.style.color = c.txt;
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = c.txt2;
          }
        }}
      >
        {/* Active indicator bar */}
        <span
          className="absolute left-0 w-0.5 h-4 rounded-r"
          style={{
            background: isActive ? c.blue : "transparent",
            transition: "background 0.15s",
          }}
        />
        <item.icon
          size={15}
          className="shrink-0"
          style={{ color: isActive ? c.blue : "inherit" }}
        />
        <span className="flex-1 text-left truncate">{item.label}</span>

        {/* Pulse dot (queue) */}
        {item.pulse && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: c.green }} />
            <span className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: c.green }} />
          </span>
        )}

        {/* Badge count */}
        {badgeCount > 0 && (
          <span
            className="min-w-[18px] h-[18px] rounded-full text-white text-[9px] font-black flex items-center justify-center px-1 shrink-0"
            style={{ background: c.red }}
          >
            {badgeCount}
          </span>
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full relative"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: c.surface }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-5 py-4 shrink-0 border-b"
        style={{ borderColor: c.border }}
      >
        <div className="flex items-center gap-3">
          <img src="/healy-logo.svg" alt="Healy" className="h-8 w-auto shrink-0" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.txt3 }}>
              Admin Console
            </p>
          </div>
        </div>
        {mobileOpen !== undefined && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: c.txt3, background: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.background = c.row}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: "none" }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.title} className={si > 0 ? "mt-5" : ""}>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-1"
              style={{ color: c.txt3 }}
            >
              {section.title}
            </p>
            <div className="space-y-0.5 relative">
              {section.items.map(item => <NavItem key={item.id} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 h-px" style={{ background: c.border }} />

      {/* User footer */}
      <div className="px-2 py-3 shrink-0">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ background: c.header }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: c.blue }}
          >
            {userInitials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold truncate leading-none mb-1" style={{ color: c.txt }}>
              {userData?.full_name || "Admin"}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: c.txt }}>
              Administrateur
            </p>
          </div>
        </div>
        
        <div className="mt-3">
           <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
              style={{ background: "transparent", color: c.txt2 }}
              onMouseEnter={e => { e.currentTarget.style.background = c.row; e.currentTarget.style.color = c.txt; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.txt2; }}
           >
              <LogOut size={15} className="shrink-0" />
              <span className="flex-1 text-left truncate">{t('logout')}</span>
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 border-r z-20"
        style={{ background: c.surface, borderColor: c.border }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside
            className="lg:hidden fixed left-0 top-0 h-screen w-64 z-40 border-r"
            style={{
              background: c.surface,
              borderColor: c.border,
              boxShadow: _dk ? "8px 0 40px rgba(0,0,0,0.5)" : "8px 0 40px rgba(0,0,0,0.1)",
              animation: "slideInLeft 0.2s ease",
            }}
          >
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}

