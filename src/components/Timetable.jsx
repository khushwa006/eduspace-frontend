import { useState, useEffect } from 'react';
import './Timetable.css';

const API = 'http://localhost:5000';
const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` });

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

const SUBJECT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];
const colorFor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
};

const todayName = () => {
  const idx = new Date().getDay(); // 0=Sun
  const map = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return map[idx];
};

export default function Timetable() {
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [incomplete, setIncomplete] = useState(false);
  const [message, setMessage]     = useState('');
  const [view, setView]           = useState('week'); // 'week' | 'today'
  const today = todayName();

  useEffect(() => {
    fetch(`${API}/api/timetable/my`, { headers: headers() })
      .then(r => r.json())
      .then(d => {
        setEntries(Array.isArray(d.entries) ? d.entries : []);
        setIncomplete(!!d.profile_incomplete);
        setMessage(d.message || '');
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, []);

  if (loading) return <div className="tt-loading">⏳ Loading your timetable...</div>;

  if (incomplete) {
    return (
      <div className="tt-page">
        <div className="tt-header">
          <h2 className="tt-title">🗓️ My Timetable</h2>
        </div>
        <div className="tt-incomplete-card">
          <span className="tt-incomplete-icon">📝</span>
          <p className="tt-incomplete-title">Complete Your Profile</p>
          <p className="tt-incomplete-msg">{message}</p>
        </div>
      </div>
    );
  }

  // Collect all unique time slots in order, sorted by start_time
  const slotMap = new Map();
  entries.forEach(e => {
    if (!slotMap.has(e.time_slot_id)) {
      slotMap.set(e.time_slot_id, { id: e.time_slot_id, label: e.time_slot, start: e.start_time });
    }
  });
  const slots = Array.from(slotMap.values()).sort((a, b) => (a.start || '').localeCompare(b.start || ''));

  const grid = {}; // day -> slot_id -> entry
  entries.forEach(e => {
    if (!grid[e.day_of_week]) grid[e.day_of_week] = {};
    grid[e.day_of_week][e.time_slot_id] = e;
  });

  const todayEntries = (grid[today] || {});
  const todayList = slots.map(s => todayEntries[s.id]).filter(Boolean);

  return (
    <div className="tt-page">
      <div className="tt-header">
        <div>
          <h2 className="tt-title">🗓️ My Timetable</h2>
          <p className="tt-sub">Your weekly class schedule</p>
        </div>
        <div className="tt-view-toggle">
          <button className={`tt-toggle-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>📅 Week</button>
          <button className={`tt-toggle-btn ${view === 'today' ? 'active' : ''}`} onClick={() => setView('today')}>☀️ Today</button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="tt-empty-card">
          <p>📭 No classes have been scheduled for you yet.</p>
          <p className="tt-empty-sub">Check back later or contact your admin.</p>
        </div>
      ) : view === 'today' ? (
        <div className="tt-today-view">
          <p className="tt-today-label">{today === 'Sunday' ? "It's Sunday — no classes! 🎉" : `Today is ${today}`}</p>
          {todayList.length === 0 ? (
            <div className="tt-empty-card"><p>🎉 No classes scheduled for today!</p></div>
          ) : (
            <div className="tt-today-list">
              {todayList.map(e => (
                <div key={e.id} className="tt-today-card" style={{ borderLeftColor: colorFor(e.subject_name) }}>
                  <div className="tt-today-time">{e.start_time} – {e.end_time}</div>
                  <div className="tt-today-info">
                    <p className="tt-today-subject">{e.subject_name}</p>
                    <p className="tt-today-meta">🏛️ {e.room_name} · 👨‍🏫 {e.faculty_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="tt-grid-wrap">
          <table className="tt-grid">
            <thead>
              <tr>
                <th className="tt-corner">Time</th>
                {DAYS.map(d => (
                  <th key={d} className={d === today ? 'tt-today-col' : ''}>{DAY_SHORT[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => (
                <tr key={slot.id}>
                  <td className="tt-time-cell">{slot.label || `${slot.start}`}</td>
                  {DAYS.map(d => {
                    const e = grid[d]?.[slot.id];
                    return (
                      <td key={d} className={d === today ? 'tt-today-col' : ''}>
                        {e ? (
                          <div className="tt-class-block" style={{ background: `${colorFor(e.subject_name)}22`, borderLeft: `3px solid ${colorFor(e.subject_name)}` }}>
                            <p className="tt-class-subject" style={{ color: colorFor(e.subject_name) }}>{e.subject_name}</p>
                            <p className="tt-class-room">🏛️ {e.room_name}</p>
                            <p className="tt-class-faculty">👨‍🏫 {e.faculty_name}</p>
                          </div>
                        ) : <span className="tt-empty-slot">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
