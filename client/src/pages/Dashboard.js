import React, { useEffect, useState } from "react";
// removed unused `useNavigate` import
import api from "../utils/api";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import Layout from "../components/Layout";
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Activity } from "lucide-react";

function Dashboard() {
  const [scans, setScans] = useState([]);
  const [user, setUser] = useState("");

  useEffect(() => {
    loadScans();
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload.id || payload.email || "User");
      } catch (e) {}
    }
  }, []);

  const loadScans = async () => {
    try {
      const res = await api.get("/scan");
      setScans(res.data || []);
    } catch (err) {
      console.log("Error loading scans", err);
    }
  };

  const total = scans.length;
  const high = scans.filter((s) => s.risk === "HIGH").length;
  const medium = scans.filter((s) => s.risk === "MEDIUM").length;
  const low = scans.filter((s) => s.risk === "LOW").length;

  const pieData = [
    { name: "High", value: high || 0 },
    { name: "Medium", value: medium || 0 },
    { name: "Low", value: low || 0 },
  ];
  const PIE_COLORS = ["#ff3366", "#ffb800", "#00ff88"];

  const barData = [
    { name: "Email", value: scans.filter(s => s.type === 'email').length },
    { name: "Link", value: scans.filter(s => s.type === 'link').length },
    { name: "Message", value: scans.filter(s => s.type === 'message').length },
  ];

  const stats = [
    { label: "Total Scans", value: total, icon: Shield, color: "#00f5ff", bg: "rgba(0,245,255,0.08)", border: "rgba(0,245,255,0.15)" },
    { label: "High Risk", value: high, icon: AlertTriangle, color: "#ff3366", bg: "rgba(255,51,102,0.08)", border: "rgba(255,51,102,0.15)" },
    { label: "Medium Risk", value: medium, icon: TrendingUp, color: "#ffb800", bg: "rgba(255,184,0,0.08)", border: "rgba(255,184,0,0.15)" },
    { label: "Low / Safe", value: low, icon: CheckCircle, color: "#00ff88", bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.15)" },
  ];

  return (
    <Layout>
      <div className="responsive-page" style={{ animation: 'fadeUp 0.5s ease both' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'rgba(0,245,255,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Security Dashboard
            </div>
            <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '6px' }}>
              Overview
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
              ID: {user}
            </p>
          </div>

          {/* LIVE STATUS removed per request */}
        </div>

        {/* STAT CARDS */}
        <div className="responsive-grid responsive-grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="responsive-card"
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  transition: 'all 0.25s ease',
                  animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.3)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    {s.label}
                  </div>
                  <Icon size={16} color={s.color} />
                </div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '2rem', fontWeight: 900, color: 'white' }}>
                  {s.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* CHARTS ROW */}
        <div
          className="responsive-grid responsive-grid-two"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}
        >

          {/* PIE */}
          <div className="responsive-card" style={{ padding: '24px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'rgba(255,255,255,0.8)' }}>Threat Distribution</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginBottom: '20px', fontFamily: 'JetBrains Mono, monospace' }}>
              Risk level breakdown
            </div>
            {total === 0 ? (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                No scan data yet
              </div>
            ) : (
              <div style={{ height: '200px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontFamily: 'Space Grotesk, sans-serif' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* LEGEND */}
            <div className="responsive-wrap-row" style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
              {[['High', '#ff3366'], ['Medium', '#ffb800'], ['Low', '#00ff88']].map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BAR */}
          <div className="responsive-card" style={{ padding: '24px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'rgba(255,255,255,0.8)' }}>Scan Types</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginBottom: '20px', fontFamily: 'JetBrains Mono, monospace' }}>
              By content category
            </div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer>
                <BarChart data={barData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontFamily: 'Space Grotesk, sans-serif' }} />
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0080ff" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RECENT SCANS TABLE */}
        <div className="responsive-card" style={{ padding: '24px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="responsive-wrap-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Activity size={16} color="rgba(0,245,255,0.7)" />
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Recent Activity</div>
            <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>
              Last {Math.min(scans.length, 10)} scans
            </div>
          </div>

          {scans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
              <Shield size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
              No scans recorded yet. Start by scanning an email, link, or message.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
              {scans.slice(0, 10).map((s, i) => (
                <div
                  key={s._id}
                  className="mobile-stack-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.2s',
                    animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                >
                  {/* TYPE BADGE */}
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '7px',
                    background: 'rgba(0,128,255,0.1)',
                    border: '1px solid rgba(0,128,255,0.2)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#0080ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                    minWidth: '60px',
                    textAlign: 'center',
                  }}>
                    {s.type}
                  </div>

                  {/* CONTENT */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.content || '—'}
                    </div>
                  </div>

                  {/* RISK */}
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '7px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    fontFamily: 'JetBrains Mono, monospace',
                    flexShrink: 0,
                    background: s.risk === 'HIGH' ? 'rgba(255,51,102,0.12)' : s.risk === 'MEDIUM' ? 'rgba(255,184,0,0.12)' : 'rgba(0,255,136,0.1)',
                    color: s.risk === 'HIGH' ? '#ff6680' : s.risk === 'MEDIUM' ? '#ffcc55' : '#00ff88',
                    border: `1px solid ${s.risk === 'HIGH' ? 'rgba(255,51,102,0.25)' : s.risk === 'MEDIUM' ? 'rgba(255,184,0,0.25)' : 'rgba(0,255,136,0.2)'}`,
                  }}>
                    {s.risk}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

export default Dashboard;
