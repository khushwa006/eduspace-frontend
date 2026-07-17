import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './AnalyticsDashboard.css';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="ac-stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="ac-stat-icon" style={{ color }}>{icon}</div>
    <div>
      <p className="ac-stat-value" style={{ color }}>{value}</p>
      <p className="ac-stat-label">{label}</p>
      {sub && <p className="ac-stat-sub">{sub}</p>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ac-tooltip">
      <p className="ac-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const token = localStorage.getItem('jwt_token');

  useEffect(() => {
    fetch('https://eduspace-backend-bh29.onrender.com/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => { if (!r.ok) throw new Error('API error ' + r.status); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError('Failed to load analytics: ' + e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="ac-loading">⏳ Loading analytics...</div>;
  if (error)   return <div className="ac-error">{error}</div>;
  if (!data)   return null;

  const { users, bookings, rooms, attendance, geofence, feedback, lost_found } = data;

  // Build chart-ready data
  const attPie = [
    { name: 'Present', value: attendance?.present || 0, color: '#10b981' },
    { name: 'Absent',  value: attendance?.absent  || 0, color: '#ef4444' },
    { name: 'Late',    value: attendance?.late    || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const bookingStatusData = [
    { name: 'Approved', value: bookings?.approved || 0, color: '#10b981' },
    { name: 'Rejected', value: bookings?.rejected || 0, color: '#ef4444' },
    { name: 'Pending',  value: bookings?.pending  || 0, color: '#f59e0b' },
  ];

  const dayData = Object.entries(bookings?.by_day || {}).map(([day, count]) => ({ day, bookings: count }));
  const monthData = Object.entries(users?.monthly || {}).map(([month, count]) => ({ month, users: count }));
  const fbTypes = Object.entries(feedback?.by_type || {}).map(([type, count]) => ({
    type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), count
  }));
  const geoTotal = (geofence?.total || 0) || 1;

  return (
    <div className="ac-page">
      <div className="ac-header">
        <h2 className="ac-title">📊 Analytics Dashboard</h2>
        <p className="ac-sub">Real-time insights into EduSpace platform usage</p>
      </div>

      {/* ── OVERVIEW STATS ─────────────────────────────── */}
      <div className="ac-stats-grid">
        <StatCard icon="🎓" label="Students"       value={users?.students || 0}      color="#3b82f6" sub="Approved accounts" />
        <StatCard icon="👨‍🏫" label="Faculty"        value={users?.faculty  || 0}      color="#10b981" sub="Approved accounts" />
        <StatCard icon="📅" label="Total Bookings"  value={bookings?.total || 0}      color="#f59e0b" sub="All time" />
        <StatCard icon="✅" label="Attendance Rate" value={`${attendance?.percentage || 0}%`} color={attendance?.percentage >= 75 ? '#10b981' : '#ef4444'} sub="Present + Late" />
        <StatCard icon="⭐" label="Avg Feedback"    value={feedback?.avg_rating || '—'} color="#f59e0b" sub={`${feedback?.total || 0} reviews`} />
        <StatCard icon="⏳" label="Pending Users"   value={users?.pending || 0}       color="#f59e0b" sub="Awaiting approval" />
        <StatCard icon="📍" label="GPS Check-ins"   value={geofence?.total || 0}      color="#06b6d4" sub={`${geofence?.on_campus || 0} on campus`} />
        <StatCard icon="🔍" label="Lost & Found"    value={lost_found?.total || 0}    color="#8b5cf6" sub={`${lost_found?.claimed || 0} claimed`} />
      </div>

      {/* ── ROW 1: Bookings by day + Attendance pie ─── */}
      <div className="ac-charts-row">
        <div className="ac-chart-card ac-wide">
          <h3 className="ac-chart-title">📈 Bookings by Day of Week</h3>
          {dayData.every(d => d.bookings === 0)
            ? <p className="ac-no-data">No booking data yet</p>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dayData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="day" tick={{fill:'var(--text-tertiary)',fontSize:12}} />
                  <YAxis tick={{fill:'var(--text-tertiary)',fontSize:12}} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bookings" name="Bookings" radius={[6,6,0,0]}>
                    {dayData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="ac-chart-card">
          <h3 className="ac-chart-title">✅ Attendance Breakdown</h3>
          {attPie.length === 0
            ? <p className="ac-no-data">No attendance records yet</p>
            : <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={attPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {attPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="ac-pie-legend">
                  {attPie.map(e => (
                    <div key={e.name} className="ac-legend-item">
                      <span style={{background:e.color}} className="ac-legend-dot" />
                      <span>{e.name}: <strong>{e.value}</strong></span>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      </div>

      {/* ── ROW 2: Room usage + Booking status ─────── */}
      <div className="ac-charts-row">
        <div className="ac-chart-card ac-wide">
          <h3 className="ac-chart-title">🏛️ Room Usage (Total Bookings)</h3>
          {!rooms?.length
            ? <p className="ac-no-data">No room data yet</p>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rooms} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="room" tick={{fill:'var(--text-tertiary)',fontSize:11}} />
                  <YAxis tick={{fill:'var(--text-tertiary)',fontSize:11}} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bookings" name="Bookings" radius={[6,6,0,0]}>
                    {rooms.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="ac-chart-card">
          <h3 className="ac-chart-title">📋 Booking Request Status</h3>
          <div className="ac-status-bars">
            {bookingStatusData.map(s => {
              const total = bookingStatusData.reduce((a,b)=>a+b.value,0) || 1;
              return (
                <div key={s.name} className="ac-status-row">
                  <span className="ac-status-name">{s.name}</span>
                  <div className="ac-status-track">
                    <div className="ac-status-fill" style={{width:`${(s.value/total)*100}%`,background:s.color}} />
                  </div>
                  <span className="ac-status-count" style={{color:s.color}}>{s.value}</span>
                </div>
              );
            })}
          </div>

          <h3 className="ac-chart-title" style={{marginTop:'20px'}}>📍 GPS Check-ins</h3>
          <div className="ac-status-bars">
            {[
              {name:'On Campus', value:geofence?.on_campus||0, color:'#10b981'},
              {name:'Outside',   value:geofence?.off_campus||0, color:'#ef4444'}
            ].map(s => (
              <div key={s.name} className="ac-status-row">
                <span className="ac-status-name">{s.name}</span>
                <div className="ac-status-track">
                  <div className="ac-status-fill" style={{width:`${(s.value/geoTotal)*100}%`,background:s.color}} />
                </div>
                <span className="ac-status-count" style={{color:s.color}}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: User growth + Feedback ──────────── */}
      <div className="ac-charts-row">
        <div className="ac-chart-card ac-wide">
          <h3 className="ac-chart-title">👥 User Registrations — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" tick={{fill:'var(--text-tertiary)',fontSize:11}} />
              <YAxis tick={{fill:'var(--text-tertiary)',fontSize:11}} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5}
                dot={{fill:'#3b82f6',r:4}} name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="ac-chart-card">
          <h3 className="ac-chart-title">⭐ Feedback by Category</h3>
          {fbTypes.length === 0
            ? <p className="ac-no-data">No feedback yet</p>
            : <div className="ac-feedback-list">
                {fbTypes.map((f,i) => {
                  const max = Math.max(...fbTypes.map(x=>x.count)) || 1;
                  return (
                    <div key={i} className="ac-fb-row">
                      <span className="ac-fb-cat">{f.type}</span>
                      <div className="ac-fb-bar-track">
                        <div className="ac-fb-bar-fill" style={{width:`${(f.count/max)*100}%`,background:COLORS[i%COLORS.length]}} />
                      </div>
                      <span className="ac-fb-score" style={{color:COLORS[i%COLORS.length]}}>{f.count}</span>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
