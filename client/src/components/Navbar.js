import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LayoutDashboard, LogOut } from "lucide-react";
import api from "../utils/api";
import socket, { connectSocket, disconnectSocket } from "../utils/socket";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const menuRef = useRef(null);
  const fetchedRef = useRef(false);

  // removed JWT parsing; will fetch profile from API

  const getInitials = (name, email) => {
    if (name && name.trim().length) {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    if (email && email.length) return email.charAt(0).toUpperCase();
    return 'U';
  };

  useEffect(() => {
    // Setup Socket.io client for real-time scan alerts
    const handleScanAlert = (data) => {
      setAlerts(prev => [data, ...prev].slice(0, 6));
      playBeep();
    };

    socket.on('scanAlert', handleScanAlert);

    if (localStorage.getItem('token')) {
      connectSocket();
    }

    // load persisted alerts
    try {
      const s = localStorage.getItem('alerts');
      if (s) setAlerts(JSON.parse(s));
    } catch (e) {}

    return () => {
      socket.off('scanAlert', handleScanAlert);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist alerts to localStorage
  useEffect(() => {
    try { localStorage.setItem('alerts', JSON.stringify(alerts)); } catch (e) {}
  }, [alerts]);

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 160);
    } catch (e) {
      // ignore
    }
  };
  useEffect(() => {
    // Prevent duplicate fetches (React StrictMode double-invokes in dev)
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const token = localStorage.getItem('token');
    if (!token) return setUser(null);

    // If token exists, attach it to socket auth for server-side validation
    try {
      connectSocket(token);
    } catch (e) {}

    // Use cached profile when available to avoid repeated network calls
    try {
      const cached = sessionStorage.getItem('profile');
      if (cached) {
        const d = JSON.parse(cached);
        const full = `${d.firstName || ''}${d.lastName ? ' ' + d.lastName : ''}`.trim();
        setUser({ name: full, email: d.email, role: d.role });
        setNameInput(full);
        return;
      }
    } catch (err) {
      // ignore parse errors and continue to fetch
    }

    api.get('/auth/me').then(res => {
      const d = res.data;
      const full = `${d.firstName || ''}${d.lastName ? ' ' + d.lastName : ''}`.trim();
      setUser({ name: full, email: d.email, role: d.role });
      setNameInput(full);
      try { sessionStorage.setItem('profile', JSON.stringify(d)); } catch (e) {}
    }).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div style={{ padding: '20px 24px 0', position: 'relative', zIndex: 10 }}>
      {/* Toast container */}
      <div style={{ position: 'fixed', right: 18, top: 18, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.map((a, idx) => (
          <div key={idx} style={{ minWidth: 260, maxWidth: 420, background: 'linear-gradient(180deg, rgba(20,20,22,0.98), rgba(10,10,12,0.98))', border: '1px solid rgba(255,255,255,0.06)', padding: 12, borderRadius: 10, color: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontWeight: 800 }}>{a.type?.toUpperCase() || 'SCAN'}</div>
              <div style={{ color: a.risk === 'HIGH' ? '#ff6b6b' : a.risk === 'MEDIUM' ? '#f59e0b' : '#34d399', fontWeight: 800 }}>{a.risk}</div>
            </div>
            <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.85)', wordBreak: 'break-all' }}>{(a.content && (a.content.length > 120 ? a.content.slice(0, 117) + '...' : a.content)) || (a.message || '')}</div>
          </div>
        ))}
      </div>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 24px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(32px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>

        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0,128,255,0.8), rgba(139,92,246,0.8))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,128,255,0.3)',
          }}>
            <Shield size={18} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', color: 'white' }}>
              CYBERSHIELD
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'rgba(0,245,255,0.6)', letterSpacing: '0.12em' }}>
              AI · SECURITY
            </div>
          </div>
        </div>

       

        {/* RIGHT: BUTTONS */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.75)',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </button>

{/* Profile dropdown */}
<div ref={menuRef} style={{ position: 'relative' }}>

  {/* ── trigger button ── */}
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    style={{
      width: 40, height: 40, borderRadius: '50%', padding: 0,
      border: menuOpen
        ? '2px solid rgba(99,102,241,0.7)'
        : '2px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', cursor: 'pointer',
      boxShadow: menuOpen
        ? '0 0 0 4px rgba(99,102,241,0.18)'
        : '0 4px 14px rgba(0,0,0,0.4)',
      transition: 'all .2s',
    }}
  >
    <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em' }}>
      {getInitials(user?.name, user?.email)}
    </span>
  </button>

  {/* ── dropdown panel ── */}
  {menuOpen && (
    <div
      style={{
        position: 'absolute', right: 0, top: 'calc(100% + 10px)',
        width: 300, maxWidth: 'calc(100vw - 24px)',
        background: 'rgba(10,11,16,0.97)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)',
        zIndex: 60, boxSizing: 'border-box',
        animation: 'dropIn .18s ease',
      }}
    >
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .dd-row:hover { background: rgba(255,255,255,0.05) !important; }
        .dd-signout:hover { background: rgba(239,68,68,0.14) !important; }
        .dd-admin:hover { background: rgba(234,179,8,0.12) !important; }
      `}</style>

      {/* ── header banner ── */}
      <div style={{
        height: 52,
        background: 'linear-gradient(135deg,#312e81 0%,#4c1d95 60%,#1e1b4b 100%)',
      }} />

      {/* ── avatar + identity ── */}
      <div style={{ padding: '0 18px 16px', marginTop: -28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          border: '3px solid rgba(10,11,16,0.97)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: 22,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {getInitials(user?.name, user?.email)}
        </div>

        {/* name row */}
        {!isEditing ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>
                {user?.name || user?.email || 'User'}
              </span>
              {/* role badge */}
              {user?.role && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: user.role === 'admin'
                    ? 'rgba(234,179,8,0.15)'
                    : 'rgba(99,102,241,0.18)',
                  border: user.role === 'admin'
                    ? '1px solid rgba(234,179,8,0.35)'
                    : '1px solid rgba(99,102,241,0.35)',
                  color: user.role === 'admin' ? '#fde047' : '#a5b4fc',
                  letterSpacing: '.04em', textTransform: 'capitalize',
                }}>
                  {user.role}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', marginTop: 2, wordBreak: 'break-all' }}>
              {user?.email}
            </div>
          </div>
        ) : (
          /* edit name inline */
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Full name"
              autoFocus
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 14,
                border: '1px solid rgba(99,102,241,0.5)',
                background: 'rgba(99,102,241,0.06)', color: 'white', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={async () => {
                  const parts = (nameInput || '').trim().split(/\s+/);
                  const firstName = parts[0] || '';
                  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
                  try {
                    const res = await api.patch('/auth/me', { firstName, lastName });
                    const d = res.data;
                    const full = `${d.firstName || ''}${d.lastName ? ' ' + d.lastName : ''}`.trim();
                    setUser({ name: full, email: d.email, role: d.role });
                    try { sessionStorage.setItem('profile', JSON.stringify(d)); } catch (_) {}
                    setIsEditing(false);
                  } catch (err) {
                    console.error('Update name failed', err);
                  }
                }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  border: 'none', color: 'white', fontWeight: 700, fontSize: 13,
                }}
              >
                Save
              </button>
              <button
                onClick={() => { setNameInput(user?.name || ''); setIsEditing(false); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 13,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── divider ── */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0 6px' }} />

      {/* ── menu items ── */}
      <div style={{ padding: '6px 8px' }}>

        {/* Profile */}
        <button
          className="dd-row"
          onClick={() => { setMenuOpen(false); navigate('/profile'); }}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', gap: 12,
            color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500,
            transition: 'background .15s', textAlign: 'left',
          }}
        >
          <span style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
          }}>👤</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>My Profile</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>
              Edit info &amp; change password
            </div>
          </div>
        </button>

        {/* Edit display name removed per request */}

        {/* Admin Panel — only for admins */}
        {user?.role === 'admin' && (
          <button
            className="dd-admin"
            onClick={() => { setMenuOpen(false); navigate('/admin'); }}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(234,179,8,0.07)',
              border: '1px solid rgba(234,179,8,0.15)',
              display: 'flex', alignItems: 'center', gap: 12,
              color: '#fde047', fontSize: 14, fontWeight: 500,
              transition: 'background .15s', textAlign: 'left', marginTop: 4,
            }}
          >
            <span style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>⚙️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Admin Panel</div>
              <div style={{ fontSize: 11, color: 'rgba(253,224,71,0.5)', marginTop: 1 }}>
                Manage users &amp; settings
              </div>
            </div>
          </button>
        )}
      </div>

      {/* ── divider ── */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />

      {/* ── sign out ── */}
      <div style={{ padding: '6px 8px 10px' }}>
        <button
          className="dd-signout"
          onClick={logout}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', gap: 12,
            color: '#fca5a5', fontSize: 14, fontWeight: 500,
            transition: 'background .15s', textAlign: 'left',
          }}
        >
          <span style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LogOut size={15} color="#fca5a5" />
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Sign out</div>
            <div style={{ fontSize: 11, color: 'rgba(252,165,165,0.5)', marginTop: 1 }}>
              End your current session
            </div>
          </div>
        </button>
      </div>
    </div>
  )}
  </div>
  </div>
    </nav>
  </div>
  );
}

export default Navbar;
