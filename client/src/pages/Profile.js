import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
// Avatar upload/crop removed — keep profile avatar display only

// ── tiny helpers ──────────────────────────────────────────────────────────────

const initials = (p) =>
  [(p?.firstName || '')[0], (p?.lastName || '')[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || (p?.email || 'U')[0].toUpperCase();

// ── sub-components ────────────────────────────────────────────────────────────
const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 999,
      padding: '14px 20px', borderRadius: 12, maxWidth: 340,
      background: isError
        ? 'linear-gradient(135deg,#3b0a0a,#5c1a1a)'
        : 'linear-gradient(135deg,#0a2a1a,#0f3d26)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideIn .25s ease',
    }}>
      <span style={{ fontSize: 20 }}>{isError ? '⚠️' : '✅'}</span>
      <span style={{ fontSize: 14, color: isError ? '#fca5a5' : '#86efac', flex: 1 }}>
        {toast.msg}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', fontSize: 16, padding: 0,
        }}
      >✕</button>
    </div>
  );
};

const EyeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const EyeOffIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94C16.24 19.07 14.19 19.75 12 19.75 6 19.75 2 12 2 12c1.24-2.02 2.93-3.78 5-4.99" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.53 9.53A3 3 0 0114.47 14.47" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 2l20 20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FieldInput = ({ label, type = 'text', value, onChange, icon, placeholder, disabled, toggle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      {icon && (
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
        }}>{icon}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%', padding: `${10}px ${toggle ? 38 : 12}px ${10}px ${icon ? 38 : 12}px`,
          borderRadius: 10, fontSize: 14, color: disabled ? 'rgba(255,255,255,0.35)' : 'white',
          background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          outline: 'none', transition: 'border .2s, background .2s', boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.border = '1px solid rgba(99,102,241,.6)'; e.target.style.background = 'rgba(99,102,241,.06)'; }}
        onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)'; }}
      />

      {toggle && (
        <button
          onClick={toggle.onToggle}
          type="button"
          aria-label={toggle.show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <span style={{ display: 'inline-flex', lineHeight: 0 }}>
            {toggle.show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </span>
        </button>
      )}
    </div>
  </div>
);

const PrimaryBtn = ({ onClick, loading, children, style = {} }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      padding: '10px 22px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
      background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      color: 'white', fontWeight: 600, fontSize: 14,
      boxShadow: loading ? 'none' : '0 4px 18px rgba(99,102,241,0.35)',
      transition: 'all .2s', display: 'inline-flex', alignItems: 'center', gap: 8,
      ...style,
    }}
    onMouseEnter={(e) => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; }}
  >
    {loading ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> : null}
    {children}
  </button>
);

const GhostBtn = ({ onClick, children, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 22px', borderRadius: 10, cursor: 'pointer',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 14, transition: 'all .2s',
      ...style,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
  >
    {children}
  </button>
);

const Badge = ({ label }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
    background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)',
    color: '#a5b4fc', fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
  }}>
    {label}
  </span>
);

const SectionCard = ({ title, icon, children }) => (
  <div style={{
    borderRadius: 16, background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    overflow: 'hidden',
  }}>
    <div style={{
      padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.02)',
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>{title}</span>
    </div>
    <div style={{ padding: '22px' }}>{children}</div>
  </div>
);

const Divider = () => (
  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '18px 0' }} />
);

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#22c55e'];
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)',
            transition: 'background .3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: score > 0 ? colors[score - 1] : 'rgba(255,255,255,0.4)' }}>
          {score > 0 ? labels[score - 1] : ''}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.ok ? '#86efac' : 'rgba(255,255,255,0.35)' }}>
            <span>{c.ok ? '✓' : '○'}</span>{c.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────
function Profile() {
  const navigate = useNavigate();

  // profile state
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // avatar (display only)
  const [avatarPreview, setAvatarPreview] = useState(null);

  // password
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwds, setShowPwds] = useState({ cur: false, new: false, confirm: false });

  // toast
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'success') => setToast({ msg, type });

  // ── data load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    api.get('/auth/me')
      .then((r) => {
        if (!alive) return;
        setProfile(r.data);
        setFirstName(r.data.firstName || '');
        setLastName(r.data.lastName || '');
        if (r.data.avatarUrl) setAvatarPreview(r.data.avatarUrl);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  // avatar upload/crop handlers removed

  // ── profile save ───────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/auth/me', { firstName: firstName.trim(), lastName: lastName.trim() });
      setProfile(res.data);
      try { sessionStorage.setItem('profile', JSON.stringify(res.data)); } catch (_) {}
      setEditing(false);
      notify('Profile updated successfully');
    } catch {
      notify('Could not save changes — please try again', 'error');
    }
    setSaving(false);
  };

  // ── password change ────────────────────────────────────────────────────────
  const changePassword = async () => {
    if (!pwdCurrent) return notify('Enter your current password', 'error');
    if (!pwdNew) return notify('Enter a new password', 'error');
    if (pwdNew !== pwdConfirm) return notify('New passwords do not match', 'error');
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwdNew);
    if (!strong) return notify('Password does not meet the requirements below', 'error');
    if (pwdNew === pwdCurrent) return notify('New password must differ from current password', 'error');

    setPwdSaving(true);
    try {
      const res = await api.post('/auth/change-password', { currentPassword: pwdCurrent, newPassword: pwdNew });
      notify(res.data?.message || 'Password changed successfully');
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
    } catch (err) {
      const msg = err?.response?.data?.error;
      notify(msg === 'invalid_credentials' || msg === 'wrong_password'
        ? 'Current password is incorrect'
        : msg || 'Password change failed — please try again', 'error');
    }
    setPwdSaving(false);
  };

  // ── sign-out ───────────────────────────────────────────────────────────────
  const signOut = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = '/';
  };

  // ── guards ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'rgba(255,255,255,0.5)' }}>
      <span style={{ fontSize: 22, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
      Loading profile…
    </div>
  );

  if (!profile) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <span style={{ fontSize: 40 }}>🔒</span>
      <p style={{ color: 'rgba(255,255,255,0.6)' }}>You are not signed in.</p>
      <PrimaryBtn onClick={() => navigate('/login')}>Sign in</PrimaryBtn>
    </div>
  );

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* keyframes moved to global CSS (client/src/styles.css) */}

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* avatar upload/crop UI removed */}

      {/* ── page ── */}
      <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>My Profile</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Manage your account information and security</p>
          </div>
          <GhostBtn onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back
          </GhostBtn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── left: avatar card ── */}
          <div style={{ borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ height: 72, background: 'linear-gradient(135deg,#312e81,#4c1d95,#1e1b4b)' }} />
            <div style={{ padding: '0 22px 24px', textAlign: 'center' }}>

              {/* avatar ring */}
              <div style={{ position: 'relative', display: 'inline-block', marginTop: -44 }}>
                <div style={{
                  width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                  border: '3px solid #0d0f14', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 34 }}>
                      {initials(profile)}
                    </div>
                  )}
                </div>
                {/* online dot */}
                <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: '#22c55e', border: '2px solid #0d0f14' }} />
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{fullName || profile.email}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2, wordBreak: 'break-all' }}>{profile.email}</div>
                <div style={{ marginTop: 8 }}><Badge label={profile.role || 'User'} /></div>
              </div>

              <Divider />

              <button
                onClick={signOut}
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5', fontWeight: 600, fontSize: 14, transition: 'all .2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              >
                Sign out
              </button>
            </div>
          </div>

          {/* ── right: details + security ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* account details */}
            <SectionCard title="Account Details" icon="👤">
              {!editing ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                    {[
                      { label: 'First Name', value: profile.firstName || '—' },
                      { label: 'Last Name', value: profile.lastName || '—' },
                      { label: 'Email Address', value: profile.email },
                      { label: 'Account Role', value: profile.role || 'User' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', wordBreak: 'break-word' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <Divider />
                  <PrimaryBtn onClick={() => setEditing(true)}>✏️ Edit profile</PrimaryBtn>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FieldInput label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} icon="👤" placeholder="John" />
                    <FieldInput label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} icon="👤" placeholder="Doe" />
                  </div>
                  <FieldInput label="Email Address" value={profile.email} icon="✉️" disabled />
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Email address cannot be changed from this page.</p>
                  <Divider />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <PrimaryBtn onClick={saveProfile} loading={saving}>{saving ? 'Saving…' : 'Save changes'}</PrimaryBtn>
                    <GhostBtn onClick={() => { setEditing(false); setFirstName(profile.firstName || ''); setLastName(profile.lastName || ''); }}>Cancel</GhostBtn>
                  </div>
                </>
              )}
            </SectionCard>

            {/* security */}
            <SectionCard title="Security" icon="🔒">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <FieldInput
                  label="Current Password"
                  type={showPwds.cur ? 'text' : 'password'}
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                  icon="🔑"
                  toggle={{ show: showPwds.cur, onToggle: () => setShowPwds((s) => ({ ...s, cur: !s.cur })) }}
                />

                <FieldInput
                  label="New Password"
                  type={showPwds.new ? 'text' : 'password'}
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  icon="🔒"
                  toggle={{ show: showPwds.new, onToggle: () => setShowPwds((s) => ({ ...s, new: !s.new })) }}
                />

                <PasswordStrength password={pwdNew} />

                <FieldInput
                  label="Confirm New Password"
                  type={showPwds.confirm ? 'text' : 'password'}
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  icon="🔏"
                  toggle={{ show: showPwds.confirm, onToggle: () => setShowPwds((s) => ({ ...s, confirm: !s.confirm })) }}
                />

                {pwdNew && pwdConfirm && pwdNew !== pwdConfirm && (
                  <div style={{ fontSize: 12, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⚠️ Passwords do not match
                  </div>
                )}

                <div style={{ marginTop: 4 }}>
                  <PrimaryBtn onClick={changePassword} loading={pwdSaving}>
                    {pwdSaving ? 'Updating…' : '🔐 Update password'}
                  </PrimaryBtn>
                </div>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;