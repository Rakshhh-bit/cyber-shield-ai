import React from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import {
  Mail, Link as LinkIcon, MessageSquare,
  Zap, Eye, Lock, Activity,
  Globe,
} from "lucide-react";


const FEATURES = [
  {
    icon: Mail,
    title: "Email Phishing",
    desc: "Advanced NLP detects social engineering patterns, sender spoofing, and malicious attachments before they reach victims.",
    color: "#00f5ff",
    glow: "rgba(0,245,255,0.1)",
  },
  {
    icon: LinkIcon,
    title: "URL Analysis",
    desc: "Multi-layer URL inspection checks domain reputation, SSL validity, redirect chains, and known malware signatures.",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.1)",
  },
  {
    icon: MessageSquare,
    title: "Message Scanner",
    desc: "Context-aware AI scans SMS, chat messages, and social content for scam patterns and manipulation tactics.",
    color: "#00ff88",
    glow: "rgba(0,255,136,0.1)",
  },
  {
    icon: Eye,
    title: "Behavioral Analysis",
    desc: "Identifies suspicious behavioral patterns unique to cyberattacks beyond simple keyword matching.",
    color: "#ffb800",
    glow: "rgba(255,184,0,0.1)",
  },
  {
    icon: Lock,
    title: "Zero-Day Defense",
    desc: "Proactively identifies novel threat vectors using heuristic modeling trained on millions of threat signatures.",
    color: "#ff3366",
    glow: "rgba(255,51,102,0.1)",
  },
  {
    icon: Activity,
    title: "Live Threat Intel",
    desc: "Connected to global threat intelligence networks for real-time updates on emerging attack campaigns.",
    color: "#0080ff",
    glow: "rgba(0,128,255,0.1)",
  },
];


function Home() {
  const navigate = useNavigate();
  

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', marginBottom: '80px', animation: 'fadeUp 0.6s ease forwards' }}>

          {/* TOP BADGE */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(0,245,255,0.07)',
            border: '1px solid rgba(0,245,255,0.2)',
            marginBottom: '28px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.72rem',
            color: 'rgba(0,245,255,0.8)',
            letterSpacing: '0.1em',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff', animation: 'pulseGlow 2s infinite' }} />
            AI-POWERED THREAT DETECTION
          </div>

          <h1 style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '20px',
            letterSpacing: '-0.02em',
          }}>
            <span style={{ color: 'white' }}>Defend Against</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #00f5ff 0%, #0080ff 50%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Digital Threats
            </span>
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'rgba(255,255,255,0.45)',
            maxWidth: '540px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            CybershieldAI scans emails, links, and messages to neutralize phishing,
            malware, and social engineering attacks in milliseconds.
          </p>

          {/* CTA BUTTONS */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[
              { label: '📧 Scan Email', path: '/email', primary: true },
              { label: '🔗 Scan Link', path: '/link', primary: true },
              { label: '💬 Scan Message', path: '/message', primary: true },
            ].map(({ label, path, primary }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  padding: '13px 26px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,245,255,0.25)',
                  background: 'linear-gradient(135deg, rgba(0,128,255,0.5), rgba(139,92,246,0.5))',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  fontFamily: 'Space Grotesk, sans-serif',
                  boxShadow: '0 0 20px rgba(0,128,255,0.15)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,128,255,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0,128,255,0.15)';
                }}
              >
                {label}
              </button>
            ))}
          </div>

        </section>

        {/* FEATURES GRID */}
        <section style={{ marginBottom: '72px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Capabilities
            </div>
            <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.6rem', fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>
              Full-Spectrum Defense
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  style={{
                    padding: '28px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.3s ease',
                    animation: `fadeUp 0.5s ease ${0.1 + i * 0.07}s both`,
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = f.glow;
                    e.currentTarget.style.borderColor = `${f.color}30`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: '12px',
                    background: `${f.color}15`,
                    border: `1px solid ${f.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <Icon size={20} color={f.color} />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', marginBottom: '10px' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ marginBottom: '72px' }}>
          <div style={{
            padding: '28px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Zap size={16} color="#00f5ff" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>How It Works</h3>
            </div>

            {[
              { step: '01', title: 'Submit Content', desc: 'Paste your email, URL, or message into our secure scanner.' },
              { step: '02', title: 'AI Analysis', desc: 'Multi-model AI inspects patterns, signatures, and behavioral markers.' },
              { step: '03', title: 'Threat Scoring', desc: 'Content receives a risk score with detailed threat breakdown.' },
              { step: '04', title: 'Instant Report', desc: 'Get actionable insights and recommendations within seconds.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: i < 3 ? '20px' : 0, position: 'relative' }}>
                {i < 3 && (
                  <div style={{
                    position: 'absolute',
                    left: '20px', top: '40px',
                    width: '1px', height: 'calc(100% + 4px)',
                    background: 'rgba(0,245,255,0.1)',
                  }} />
                )}
                <div style={{
                  width: '40px', height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(0,245,255,0.07)',
                  border: '1px solid rgba(0,245,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#00f5ff',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.55 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* CTA BOTTOM */}
        <section style={{
          textAlign: 'center',
          padding: '56px 40px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(0,128,255,0.07) 0%, rgba(139,92,246,0.07) 100%)',
          border: '1px solid rgba(0,245,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.06) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          <Globe size={32} color="rgba(0,245,255,0.4)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.9rem', fontWeight: 700, marginBottom: '33px' }}>
            Stay Protected. Stay Ahead.
          </h2>
        </section>

      </main>
    </div>
  );
}

export default Home;