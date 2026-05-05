import React, { useEffect, useState } from "react";
import api from "../utils/api";
import Layout from "../components/Layout";
import { Users, Trash2, Lock, Activity } from "lucide-react";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const u = await api.get("/admin/users");
      const s = await api.get("/admin/scans");
      setUsers(u.data);
      setScans(s.data);
    } catch (err) {
      console.error(err);
      alert("❌ Admin API error");
    }
  };

  const deleteUser = async (id) => { await api.delete(`/admin/user/${id}`); loadData(); };
  const deleteScan = async (id) => { await api.delete(`/admin/scan/${id}`); loadData(); };

  return (
    <Layout>
      <div style={{ animation: 'fadeUp 0.5s ease both' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'rgba(255,51,102,0.7)', letterSpacing: '0.15em', marginBottom: '8px' }}>
              ⚠ RESTRICTED ACCESS
            </div>
            <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>
              Admin Control
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)' }}>
              All actions are logged and monitored
            </p>
          </div>

          {/* STATS */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Users', value: users.length, color: '#00f5ff' },
              { label: 'Scans', value: scans.length, color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '14px 20px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
          className="md:grid-cols-2 grid-cols-1">

          {/* USERS */}
          <div style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Users size={16} color="rgba(0,245,255,0.7)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>User Management</span>
              <div style={{
                marginLeft: 'auto', padding: '3px 10px', borderRadius: '999px',
                background: 'rgba(0,245,255,0.07)', border: '1px solid rgba(0,245,255,0.15)',
                fontSize: '0.65rem', color: 'rgba(0,245,255,0.7)', fontFamily: 'JetBrains Mono, monospace',
              }}>
                {users.length} TOTAL
              </div>
            </div>

            {users.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                No users found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {users.map((u) => (
                  <div key={u._id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                  >
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: 'rgba(0,128,255,0.12)', border: '1px solid rgba(0,128,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0080ff' }}>
                        {u.email ? u.email[0].toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                        {u.role}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteUser(u._id)}
                      style={{
                        width: '30px', height: '30px',
                        borderRadius: '8px',
                        background: 'rgba(255,51,102,0.1)',
                        border: '1px solid rgba(255,51,102,0.2)',
                        color: 'rgba(255,102,128,0.8)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.2)'; e.currentTarget.style.color = '#ff3366'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.1)'; e.currentTarget.style.color = 'rgba(255,102,128,0.8)'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SCANS */}
          <div style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Activity size={16} color="rgba(139,92,246,0.7)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Threat Logs</span>
              <div style={{
                marginLeft: 'auto', padding: '3px 10px', borderRadius: '999px',
                background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)',
                fontSize: '0.65rem', color: 'rgba(139,92,246,0.8)', fontFamily: 'JetBrains Mono, monospace',
              }}>
                {scans.length} LOGGED
              </div>
            </div>

            {scans.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                No scans found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {scans.map((s) => (
                  <div key={s._id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                  >
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: '7px',
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: '#a78bfa',
                      fontFamily: 'JetBrains Mono, monospace',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                      textTransform: 'uppercase',
                      minWidth: '52px',
                      textAlign: 'center',
                    }}>
                      {s.type}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        fontFamily: 'JetBrains Mono, monospace',
                        letterSpacing: '0.04em',
                        color: s.risk === 'High' ? '#ff6680' : s.risk === 'Medium' ? '#ffcc55' : '#00ff88',
                      }}>
                        {s.risk} RISK
                      </div>
                    </div>

                    <button
                      onClick={() => deleteScan(s._id)}
                      style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: 'rgba(255,51,102,0.1)',
                        border: '1px solid rgba(255,51,102,0.2)',
                        color: 'rgba(255,102,128,0.8)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.2)'; e.currentTarget.style.color = '#ff3366'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.1)'; e.currentTarget.style.color = 'rgba(255,102,128,0.8)'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* FOOTER WARNING */}
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(255,51,102,0.05)',
          border: '1px solid rgba(255,51,102,0.12)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Lock size={14} color="rgba(255,51,102,0.6)" />
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
            Admin area is restricted to authorized personnel only. All actions are logged for security auditing purposes.
          </span>
        </div>

      </div>
    </Layout>
  );
}

export default AdminDashboard;