import React, { useState } from "react";
import api from "../utils/api";
import { Shield, Eye, EyeOff, Mail, Lock, User, ArrowRight, Zap } from "lucide-react";

const SECURITY_TIPS = [
  "Never click links in unsolicited emails",
  "Verify sender domains carefully — look for typos",
  "Hover over links before clicking to preview URLs",
  "Enable 2FA on all critical accounts",
  "Use unique passwords for each service",
];

function Auth() {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [tipIndex] = useState(Math.floor(Math.random() * SECURITY_TIPS.length));

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (mode === "login") {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", res.data.token);
        window.location.replace("/home");
      }
      if (mode === "register") {
        await api.post("/auth/register", { firstName, lastName, email, password });
        alert("OTP sent 📩");
        setStep("otp");
      }
    } catch {
      alert("❌ Error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      await api.post("/auth/verify", { email, otp });
      alert("Account created ✅");
      setMode("login");
      setStep("form");
    } catch {
      alert("Invalid OTP ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    try {
      setLoading(true);
      await api.post("/auth/forgot", { email });
      alert("Reset link sent 📩");
      setMode("login");
    } catch {
      alert("Error ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
    }}>

      {/* AMBIENT */}
      <div style={{
        position: 'fixed',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,128,255,0.08) 0%, transparent 70%)',
        top: '50%', left: '30%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '920px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
        animation: 'fadeUp 0.5s ease both',
      }}
        className="md:grid-cols-2 grid-cols-1">

        {/* LEFT PANEL */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(0,128,255,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
          className="hidden md:flex">

          {/* BG PATTERN */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* LOGO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #0080ff, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px rgba(0,128,255,0.4)',
              }}>
                <Shield size={20} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.06em' }}>CYBERSHIELD</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'rgba(0,245,255,0.6)', letterSpacing: '0.12em' }}>AI SECURITY</div>
              </div>
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '16px', fontFamily: 'Space Grotesk, sans-serif' }}>
              {mode === 'login' ? (
                <>Welcome<br />back.</>
              ) : (
                <>Join the<br />shield.</>
              )}
            </h2>

            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', lineHeight: 1.65, maxWidth: '280px' }}>
              {mode === 'login'
                ? 'Your cybersecurity dashboard awaits. Scan, detect, and protect.'
                : 'Start protecting yourself from phishing, malware, and digital scams today.'}
            </p>
          </div>

          {/* SECURITY TIP */}
          <div style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'rgba(0,245,255,0.05)',
            border: '1px solid rgba(0,245,255,0.12)',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={13} color="#00f5ff" />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'rgba(0,245,255,0.7)', letterSpacing: '0.12em' }}>
                SECURITY TIP
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
              {SECURITY_TIPS[tipIndex]}
            </p>
          </div>

        </div>

        {/* RIGHT PANEL - FORM */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>

          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>
            {mode === 'login' && 'Sign In'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' }}>
            {mode === 'login' && 'Enter your credentials to continue'}
            {mode === 'register' && 'Set up your CyberShield account'}
            {mode === 'forgot' && "We'll send you a reset link"}
          </p>

          {step === 'otp' ? (
            <>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', display: 'block', fontFamily: 'JetBrains Mono, monospace' }}>
                Verification Code
              </label>
              <input
                className="input"
                placeholder="Enter 6-digit OTP"
                onChange={(e) => setOtp(e.target.value)}
                style={{ marginBottom: '20px', letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.1rem' }}
              />
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: '20px' }}>
                Check your email inbox for the verification code
              </p>
              <AuthButton onClick={verifyOtp} loading={loading} label="Verify & Activate" />
            </>
          ) : (
            <>
              {mode === 'register' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <InputField icon={User} placeholder="First name" onChange={setFirstName} />
                  <InputField icon={User} placeholder="Last name" onChange={setLastName} />
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <InputField icon={Mail} placeholder="Email address" onChange={setEmail} type="email" />
              </div>

              {mode !== 'forgot' && (
                <div style={{ marginBottom: '28px', position: 'relative' }}>
                  <InputField
                    icon={Lock}
                    placeholder="Password"
                    onChange={setPassword}
                    type={showPass ? 'text' : 'password'}
                    rightEl={
                      <button
                        onClick={() => setShowPass(!showPass)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                </div>
              )}

              {mode === 'login' && (
                <button
                  onClick={() => setMode('forgot')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, marginBottom: '16px', textAlign: 'right', width: '100%', fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Forgot password?
                </button>
              )}

              <AuthButton
                onClick={mode === 'forgot' ? handleForgot : handleSubmit}
                loading={loading}
                label={mode === 'login' ? 'Sign In' : mode === 'register' ? 'Send OTP' : 'Send Reset Link'}
              />

              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)' }}>
                {mode === 'login' && (
                  <span>
                    Don't have an account?{' '}
                    <button onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: 'rgba(0,245,255,0.7)', cursor: 'pointer', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.82rem' }}>
                      Sign up
                    </button>
                  </span>
                )}
                {mode === 'register' && (
                  <span>
                    Already have an account?{' '}
                    <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'rgba(0,245,255,0.7)', cursor: 'pointer', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.82rem' }}>
                      Sign in
                    </button>
                  </span>
                )}
                {mode === 'forgot' && (
                  <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'rgba(0,245,255,0.7)', cursor: 'pointer', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.82rem' }}>
                    ← Back to login
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function InputField({ icon: Icon, placeholder, onChange, type = 'text', rightEl }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }}>
        <Icon size={15} />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '13px 16px 13px 42px',
          paddingRight: rightEl ? '44px' : '16px',
          borderRadius: '11px',
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'white',
          fontSize: '0.875rem',
          outline: 'none',
          transition: 'all 0.2s ease',
          fontFamily: 'Space Grotesk, sans-serif',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = 'rgba(0,245,255,0.35)'; e.target.style.background = 'rgba(0,245,255,0.03)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(0,0,0,0.25)'; }}
      />
      {rightEl && (
        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
          {rightEl}
        </div>
      )}
    </div>
  );
}

function AuthButton({ onClick, loading, label }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        background: loading ? 'rgba(0,128,255,0.3)' : 'linear-gradient(135deg, #0080ff, #8b5cf6)',
        border: '1px solid rgba(0,245,255,0.2)',
        color: 'white',
        fontSize: '0.9rem',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 0 24px rgba(0,128,255,0.2)',
        transition: 'all 0.2s ease',
        fontFamily: 'Space Grotesk, sans-serif',
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = '0 0 36px rgba(0,128,255,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0,128,255,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {loading ? 'Loading...' : (
        <>
          {label}
          <ArrowRight size={16} />
        </>
      )}
    </button>
  );
}

export default Auth;