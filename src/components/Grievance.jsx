import { useState, useEffect } from 'react';
import './Grievance.css';

const API = 'https://eduspace-backend-bh29.onrender.com';
const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`, 'Content-Type': 'application/json' });
const get  = (url) => fetch(API+url, { headers: headers() }).then(r => r.json());
const post = (url, body) => fetch(API+url, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(r => r.json());

const CATEGORIES = [
  { value: 'hostel',     label: 'Hostel',      icon: '🏠' },
  { value: 'academic',   label: 'Academic',    icon: '📚' },
  { value: 'facility',   label: 'Facility',    icon: '🏛️' },
  { value: 'ragging',    label: 'Ragging',     icon: '⚠️' },
  { value: 'harassment', label: 'Harassment',  icon: '🚨' },
  { value: 'other',      label: 'Other',       icon: '📋' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#3b82f6' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high',   label: 'High',   color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     icon: '⏳', color: '#f59e0b', bg: '#2d1f00' },
  in_progress: { label: 'In Progress', icon: '🔧', color: '#3b82f6', bg: '#1e3a5f' },
  resolved:    { label: 'Resolved',    icon: '✅', color: '#10b981', bg: '#052e1a' },
  rejected:    { label: 'Rejected',    icon: '❌', color: '#ef4444', bg: '#2d0a0a' },
};

export default function Grievance() {
  const [tab, setTab]           = useState('submit');
  const [myGrievances, setMine] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState('');

  const [form, setForm] = useState({
    category: '', priority: 'medium', subject: '', description: '', is_anonymous: false
  });

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const loadMine = async () => {
    setLoading(true);
    const data = await get('/api/grievances/my');
    setMine(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { if (tab === 'mine') loadMine(); }, [tab]);

  const handleSubmit = async () => {
    if (!form.category) return flash('Please select a category');
    if (!form.subject.trim()) return flash('Please enter a subject');
    if (!form.description.trim()) return flash('Please describe your grievance');

    const res = await post('/api/grievances', form);
    if (res.error) return flash(res.error);

    flash('✅ Grievance submitted successfully! Admin has been notified.');
    setForm({ category: '', priority: 'medium', subject: '', description: '', is_anonymous: false });
    setTab('mine');
  };

  return (
    <div className="gr-page">
      <div className="gr-header">
        <h2 className="gr-title">📋 Grievance & Complaints</h2>
        <p className="gr-sub">Raise concerns and track their resolution</p>
      </div>

      {msg && <div className="gr-flash">{msg}</div>}

      <div className="gr-tabs">
        <button className={`gr-tab ${tab === 'submit' ? 'active' : ''}`} onClick={() => setTab('submit')}>
          ✍️ Submit New
        </button>
        <button className={`gr-tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
          📂 My Grievances ({myGrievances.length})
        </button>
      </div>

      {/* ── SUBMIT FORM ──────────────────────────────────── */}
      {tab === 'submit' && (
        <div className="gr-form-card">
          <div className="gr-form-group">
            <label>Category *</label>
            <div className="gr-cat-grid">
              {CATEGORIES.map(c => (
                <button key={c.value}
                  className={`gr-cat-btn ${form.category === c.value ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, category: c.value }))}>
                  <span className="gr-cat-icon">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="gr-form-group">
            <label>Priority</label>
            <div className="gr-priority-row">
              {PRIORITIES.map(p => (
                <button key={p.value}
                  className={`gr-priority-btn ${form.priority === p.value ? 'active' : ''}`}
                  style={form.priority === p.value ? { background: p.color, borderColor: p.color, color: '#fff' } : {}}
                  onClick={() => setForm(f => ({ ...f, priority: p.value }))}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="gr-form-group">
            <label>Subject *</label>
            <input className="gr-input" placeholder="Brief summary of your issue"
              value={form.subject} maxLength={150}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>

          <div className="gr-form-group">
            <label>Description *</label>
            <textarea className="gr-textarea" rows={6}
              placeholder="Describe the issue in detail — what happened, when, where, and who was involved (if relevant)..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <label className="gr-checkbox-row">
            <input type="checkbox" checked={form.is_anonymous}
              onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))} />
            <span>🔒 Submit anonymously (your name will be hidden from other students, but admin can still respond)</span>
          </label>

          <button className="gr-submit-btn" onClick={handleSubmit}>
            🚀 Submit Grievance
          </button>
        </div>
      )}

      {/* ── MY GRIEVANCES ────────────────────────────────── */}
      {tab === 'mine' && (
        <div className="gr-list">
          {loading ? (
            <p className="gr-empty">Loading...</p>
          ) : myGrievances.length === 0 ? (
            <div className="gr-empty-card">
              <p>📭 You haven't submitted any grievances yet.</p>
              <button className="gr-submit-btn" style={{ marginTop: '12px', maxWidth: '220px' }} onClick={() => setTab('submit')}>
                ✍️ Submit Your First
              </button>
            </div>
          ) : (
            myGrievances.map(g => {
              const cfg = STATUS_CONFIG[g.status] || STATUS_CONFIG.pending;
              const cat = CATEGORIES.find(c => c.value === g.category);
              const pri = PRIORITIES.find(p => p.value === g.priority);
              return (
                <div key={g.id} className="gr-card">
                  <div className="gr-card-top">
                    <div className="gr-card-tags">
                      <span className="gr-tag">{cat?.icon} {cat?.label}</span>
                      <span className="gr-tag" style={{ color: pri?.color, borderColor: pri?.color }}>
                        {pri?.label} priority
                      </span>
                      {g.is_anonymous && <span className="gr-tag">🔒 Anonymous</span>}
                    </div>
                    <span className="gr-status-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}` }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  <p className="gr-subject">{g.subject}</p>
                  <p className="gr-description">{g.description}</p>

                  {g.admin_reply && (
                    <div className="gr-reply-box">
                      <p className="gr-reply-label">💬 Admin Response</p>
                      <p className="gr-reply-text">{g.admin_reply}</p>
                    </div>
                  )}

                  <p className="gr-timestamp">Submitted {g.created_at} · Last updated {g.updated_at}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
