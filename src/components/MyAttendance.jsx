import { useState, useEffect } from 'react';
import './MyAttendance.css';

const STATUS_CONFIG = {
  PRESENT: { label: 'Present', color: '#10b981', bg: '#052e1a', icon: '✅' },
  ABSENT:  { label: 'Absent',  color: '#ef4444', bg: '#2d0a0a', icon: '❌' },
  LATE:    { label: 'Late',    color: '#f59e0b', bg: '#2d1f00', icon: '🕐' },
};

export default function MyAttendance({ onBack }) {
  const [data, setData]         = useState(null);
  const [gpsLogs, setGpsLogs]   = useState([]);
  const [activeTab, setTab]     = useState('classes');
  const [filter, setFilter]     = useState('ALL');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const token = localStorage.getItem('jwt_token');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [attRes, gpsRes] = await Promise.all([
          fetch('https://eduspace-backend-bh29.onrender.com/api/student/my-attendance', { headers:{'Authorization':`Bearer ${token}`} }),
          fetch('https://eduspace-backend-bh29.onrender.com/api/student/my-geofence-logs', { headers:{'Authorization':`Bearer ${token}`} }),
        ]);
        const attData = await attRes.json();
        const gpsData = await gpsRes.json();
        setData(attData);
        setGpsLogs(Array.isArray(gpsData) ? gpsData : []);
      } catch { }
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="ma-loading">Loading your attendance...</div>;

  const stats   = data?.stats || { total:0, present:0, absent:0, late:0, percentage:0 };
  const records = (data?.records || []).filter(r => {
    if (filter !== 'ALL' && r.status !== filter) return false;
    if (search && !r.class_name.toLowerCase().includes(search.toLowerCase()) &&
        !r.room.toLowerCase().includes(search.toLowerCase()) &&
        !r.faculty.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pctColor = stats.percentage >= 75 ? '#10b981' : stats.percentage >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="ma-page">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="ma-header">
        <div>
          <h2 className="ma-title">📋 My Attendance</h2>
          <p className="ma-subtitle">Track your class attendance and GPS check-ins</p>
        </div>
      </div>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <div className="ma-stats">
        <div className="ma-stat-main">
          <div className="ma-pct-ring" style={{'--pct': stats.percentage, '--color': pctColor}}>
            <span className="ma-pct-val" style={{color: pctColor}}>{stats.percentage}%</span>
            <span className="ma-pct-lbl">Attendance</span>
          </div>
          <div className="ma-pct-bar-wrap">
            <div className="ma-pct-bar">
              <div className="ma-pct-fill" style={{width:`${stats.percentage}%`, background: pctColor}} />
            </div>
            <div className="ma-pct-markers">
              <span>0%</span>
              <span style={{color:'#f59e0b'}}>60% (min)</span>
              <span style={{color:'#10b981'}}>75% (good)</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="ma-stat-cards">
          {[
            { label:'Total Classes', value: stats.total,   color:'#3b82f6' },
            { label:'Present',       value: stats.present, color:'#10b981' },
            { label:'Absent',        value: stats.absent,  color:'#ef4444' },
            { label:'Late',          value: stats.late,    color:'#f59e0b' },
          ].map(s => (
            <div key={s.label} className="ma-stat-card">
              <span className="ma-stat-val" style={{color: s.color}}>{s.value}</span>
              <span className="ma-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────── */}
      <div className="ma-tabs">
        <button className={`ma-tab ${activeTab==='classes'?'active':''}`} onClick={()=>setTab('classes')}>
          📚 Class Attendance ({data?.records?.length || 0})
        </button>
        <button className={`ma-tab ${activeTab==='gps'?'active':''}`} onClick={()=>setTab('gps')}>
          📍 GPS Check-ins ({gpsLogs.length})
        </button>
      </div>

      {/* ── CLASS ATTENDANCE ───────────────────────────────── */}
      {activeTab === 'classes' && (
        <>
          <div className="ma-toolbar">
            <input className="ma-search" placeholder="🔎 Search by class, room or faculty..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="ma-filter-chips">
              {['ALL','PRESENT','ABSENT','LATE'].map(f => (
                <button key={f} className={`ma-chip ${filter===f?'ma-chip--active':''}`}
                  onClick={() => setFilter(f)}>
                  {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.icon + ' ' + STATUS_CONFIG[f]?.label}
                </button>
              ))}
            </div>
          </div>

          {records.length === 0 ? (
            <div className="ma-empty">
              <p>No attendance records found.</p>
              <p>Records appear after a faculty member marks your attendance.</p>
            </div>
          ) : (
            <div className="ma-list">
              {records.map(r => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.ABSENT;
                return (
                  <div key={r.id} className="ma-card">
                    <div className="ma-card-left">
                      <div className="ma-status-icon" style={{background:cfg.bg, color:cfg.color}}>
                        {cfg.icon}
                      </div>
                      <div>
                        <p className="ma-class-name">{r.class_name}</p>
                        <div className="ma-card-meta">
                          <span>🏛️ {r.room}</span>
                          <span>📅 {r.date}</span>
                          <span>⏰ {r.time_slot}</span>
                          <span>👨‍🏫 {r.faculty}</span>
                        </div>
                      </div>
                    </div>
                    <span className="ma-badge" style={{background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}`}}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── GPS CHECK-INS ───────────────────────────────────── */}
      {activeTab === 'gps' && (
        <div className="ma-list">
          {gpsLogs.length === 0 ? (
            <div className="ma-empty">
              <p>No GPS check-ins yet.</p>
              <p>Use the 📍 GPS Check-In card on your dashboard to check in.</p>
            </div>
          ) : gpsLogs.map(log => (
            <div key={log.id} className="ma-card">
              <div className="ma-card-left">
                <div className="ma-status-icon"
                  style={{background: log.is_within ? '#052e1a' : '#2d0a0a',
                          color:      log.is_within ? '#10b981' : '#ef4444'}}>
                  {log.override ? '✋' : log.is_within ? '✅' : '❌'}
                </div>
                <div>
                  <p className="ma-class-name">
                    {log.override ? 'Manual Override by Faculty' : log.is_within ? 'On Campus Check-in' : 'Off Campus Attempt'}
                  </p>
                  <div className="ma-card-meta">
                    <span>📡 {log.distance_m}m from campus centre</span>
                    <span>🕐 {log.created_at}</span>
                  </div>
                </div>
              </div>
              <span className="ma-badge"
                style={{background: log.is_within ? '#052e1a' : '#2d0a0a',
                        color:      log.is_within ? '#10b981' : '#ef4444',
                        border:     `1px solid ${log.is_within ? '#10b981' : '#ef4444'}`}}>
                {log.is_within ? '✅ Verified' : '❌ Outside'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
