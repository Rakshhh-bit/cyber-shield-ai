import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Mail,
  Link as LinkIcon,
  MessageSquare,
  Home,
  Menu,
  X,
  Shield,
  LogOut,
  
} from "lucide-react";

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/home", icon: Home, desc: "Overview" },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, desc: "Analytics" },
    { name: "Email Scan", path: "/email", icon: Mail, desc: "Phishing detect" },
    { name: "Link Scan", path: "/link", icon: LinkIcon, desc: "URL analysis" },
    { name: "Message Scan", path: "/message", icon: MessageSquare, desc: "Content check" },
  ];

  return (
    <div className="app-shell flex min-h-screen text-white relative">

      {/* SCAN LINE EFFECT */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.15), transparent)',
            animation: 'scanLine 8s linear infinite',
          }}
        />
        {/* Ambient orb bottom right */}
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)',
          bottom: '-200px',
          right: '-200px',
        }} />
      </div>

      {/* MOBILE TOGGLE */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* SIDEBAR */}
      <aside
        style={{
          width: '240px',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(2, 4, 8, 0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          position: 'fixed',
          height: '100vh',
          zIndex: 40,
          left: 0,
          top: 0,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="app-sidebar"
      >

        {/* LOGO AREA */}
        <div style={{
          padding: '0 16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0080ff, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0, 128, 255, 0.3)',
                flexShrink: 0,
              }}>
                <Shield size={16} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: 'white' }}>
                  CYBERSHIELD
                </div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(0,245,255,0.7)', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
                  AI SECURITY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAV SECTION LABEL */}
        <div style={{ padding: '0 20px 8px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
          Navigation
        </div>

        {/* NAV ITEMS */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <div
                key={item.name}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  justifyContent: 'flex-start',
                  background: active ? 'rgba(0,128,255,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(0,128,255,0.25)' : '1px solid transparent',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {active && (
                  <div style={{
                    position: 'absolute',
                    left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: '3px', height: '60%',
                    borderRadius: '0 4px 4px 0',
                    background: 'linear-gradient(180deg, #00f5ff, #0080ff)',
                    boxShadow: '0 0 10px #00f5ff',
                  }} />
                )}
                <Icon
                  size={17}
                  color={active ? '#00f5ff' : 'rgba(255,255,255,0.45)'}
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'white' : 'rgba(255,255,255,0.6)',
                  }}>{item.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* BOTTOM: LOGOUT */}
        <div style={{ padding: '16px 12px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(255,51,102,0.08)',
              border: '1px solid rgba(255,51,102,0.15)',
              color: 'rgba(255,102,128,0.9)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              justifyContent: 'flex-start',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,51,102,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,51,102,0.15)'; }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            Sign Out
          </button>
        </div>

      </aside>

      {/* OVERLAY */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 39 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* CONTENT */}
      <div
        style={{
          flex: 1,
          marginLeft: '240px',
          transition: 'margin 0.3s cubic-bezier(0.4,0,0.2,1), padding 0.3s ease',
          padding: 'clamp(20px, 4vw, 32px)',
          position: 'relative',
          zIndex: 1,
        }}
        className="app-content md:block"
      >
        {children}
      </div>

    </div>
  );
}

export default Layout;
