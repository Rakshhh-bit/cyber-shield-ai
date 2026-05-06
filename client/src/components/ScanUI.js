import React from "react";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";

function ScanUI({
  title,
  placeholder,
  value,
  setValue,
  onClick,
  risk,
  result,
  riskPercent,
  textarea,
  icon: PageIcon,
  tips = [],
  scanLabel = "Run Scan",
}) {

  const riskColor = risk === 'HIGH' || risk === 'High'
    ? '#ff3366'
    : risk === 'MEDIUM' || risk === 'Medium'
    ? '#ffb800'
    : '#00ff88';

  const riskBg = risk === 'HIGH' || risk === 'High'
    ? 'rgba(255,51,102,0.08)'
    : risk === 'MEDIUM' || risk === 'Medium'
    ? 'rgba(255,184,0,0.08)'
    : 'rgba(0,255,136,0.07)';

  const riskBorder = risk === 'HIGH' || risk === 'High'
    ? 'rgba(255,51,102,0.2)'
    : risk === 'MEDIUM' || risk === 'Medium'
    ? 'rgba(255,184,0,0.2)'
    : 'rgba(0,255,136,0.15)';

  const RiskIcon = risk === 'HIGH' || risk === 'High'
    ? AlertTriangle
    : risk === 'MEDIUM' || risk === 'Medium'
    ? Info
    : CheckCircle;

  return (
    <div className="responsive-page" style={{ animation: 'fadeUp 0.5s ease both' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'rgba(0,245,255,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Threat Analysis
        </div>
        <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>
          {title}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>
          Paste content below for instant AI-powered threat detection
        </p>
      </div>

      <div
        className="responsive-grid responsive-grid-scan"
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}
      >

        {/* LEFT: INPUT */}
        <div className="mobile-full-width">
          {/* INPUT CARD */}
          <div className="responsive-card" style={{
            padding: '28px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            marginBottom: '16px',
          }}>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '12px',
            }}>
              Input
            </label>

            {textarea ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                rows={7}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'Space Grotesk, sans-serif',
                  lineHeight: 1.6,
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,245,255,0.35)'; e.target.style.background = 'rgba(0,245,255,0.02)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(0,0,0,0.25)'; }}
              />
            ) : (
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none',
                  fontFamily: 'Space Grotesk, sans-serif',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,245,255,0.35)'; e.target.style.background = 'rgba(0,245,255,0.02)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(0,0,0,0.25)'; }}
              />
            )}

            <div className="responsive-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={onClick}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(0,128,255,0.7), rgba(139,92,246,0.7))',
                  border: '1px solid rgba(0,245,255,0.25)',
                  color: 'white',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                  boxShadow: '0 0 20px rgba(0,128,255,0.15)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(0,128,255,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(0,128,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Shield size={15} />
                {scanLabel}
              </button>

              {value && (
                <button
                  onClick={() => setValue('')}
                  style={{
                    padding: '13px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'Space Grotesk, sans-serif',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* RESULT */}
          {risk && (
            <div className="responsive-card" style={{
              padding: '24px',
              borderRadius: '18px',
              background: riskBg,
              border: `1px solid ${riskBorder}`,
              animation: 'fadeUp 0.4s ease both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <RiskIcon size={18} color={riskColor} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                  Analysis Result
                </span>
                <div style={{
                  marginLeft: 'auto',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: riskBg,
                  border: `1px solid ${riskBorder}`,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: riskColor,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.08em',
                }}>
                  {(risk || '').toUpperCase()} RISK
                </div>
              </div>

              {/* RISK BAR */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                    THREAT SCORE
                  </span>
                  <span style={{ fontSize: '0.72rem', color: riskColor, fontFamily: 'Orbitron, monospace', fontWeight: 700 }}>
                    {riskPercent || 0}%
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${riskPercent || 0}%`,
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #00ff88, #ffb800, #ff3366)',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
                {result}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: INFO PANEL */}
        <div className="mobile-full-width" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* HOW IT SCANS */}
          <div className="responsive-card" style={{
            padding: '22px',
            borderRadius: '16px',
            background: 'rgba(0,245,255,0.04)',
            border: '1px solid rgba(0,245,255,0.1)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(0,245,255,0.7)', marginBottom: '14px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              What We Check
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '18px', height: '18px',
                    borderRadius: '5px',
                    background: 'rgba(0,245,255,0.1)',
                    border: '1px solid rgba(0,245,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: '1px',
                  }}>
                    <CheckCircle size={10} color="#00f5ff" />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RISK GUIDE */}
          <div className="responsive-card" style={{
            padding: '22px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: '14px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Risk Guide
            </div>
            {[
              { level: 'LOW', desc: 'Content appears safe. No threats detected.', color: '#00ff88', bg: 'rgba(0,255,136,0.07)' },
              { level: 'MEDIUM', desc: 'Some suspicious patterns. Proceed carefully.', color: '#ffb800', bg: 'rgba(255,184,0,0.07)' },
              { level: 'HIGH', desc: 'Dangerous content detected. Do not engage.', color: '#ff3366', bg: 'rgba(255,51,102,0.07)' },
            ].map(({ level, desc, color, bg }) => (
              <div key={level} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '10px', borderRadius: '10px',
                background: bg, marginBottom: '8px',
              }}>
                <div style={{
                  padding: '2px 8px', borderRadius: '5px',
                  fontSize: '0.6rem', fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  color, background: `${color}20`,
                  border: `1px solid ${color}30`,
                  flexShrink: 0, letterSpacing: '0.05em',
                }}>
                  {level}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ScanUI;
