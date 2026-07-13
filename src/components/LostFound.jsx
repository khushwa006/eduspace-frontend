import { useState, useEffect } from 'react';
import './LostFound.css';

const CATEGORIES = [
  { id: 'all',         label: 'All',         icon: '🔎' },
  { id: 'electronics', label: 'Electronics',  icon: '💻' },
  { id: 'books',       label: 'Books',        icon: '📚' },
  { id: 'bags',        label: 'Bags',         icon: '🎒' },
  { id: 'documents',   label: 'Documents',    icon: '📄' },
  { id: 'clothing',    label: 'Clothing',     icon: '👕' },
  { id: 'keys',        label: 'Keys',         icon: '🔑' },
  { id: 'other',       label: 'Other',        icon: '🔮' },
];

const CAT_ICONS = { electronics:'💻', books:'📚', bags:'🎒', documents:'📄', clothing:'👕', keys:'🔑', other:'🔮' };

const EMPTY_FORM = { title:'', description:'', category:'other', item_type:'lost', location:'', contact_info:'' };

export default function LostFound({ onBack }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');       // all | lost | found
  const [catFilter, setCatFilter]   = useState('all');
  const [search, setSearch]         = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError]           = useState('');
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');

  const token = () => localStorage.getItem('jwt_token');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/lost-found', {
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setError('Failed to load items.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Please enter a title.');
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSuccessMsg(data.message);
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchItems();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const handleClaim = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/lost-found/${id}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      fetchItems();
    } catch { alert('Failed to mark as claimed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item?')) return;
    try {
      await fetch(`http://localhost:5000/api/lost-found/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      fetchItems();
    } catch { alert('Failed to delete.'); }
  };

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.item_type !== filter) return false;
    if (catFilter !== 'all' && item.category !== catFilter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) &&
        !item.description?.toLowerCase().includes(search.toLowerCase()) &&
        !item.location?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lostCount  = items.filter(i => i.item_type === 'lost'  && i.status === 'open').length;
  const foundCount = items.filter(i => i.item_type === 'found' && i.status === 'open').length;

  return (
    <div className="lf-page">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="lf-header">
        <div>
          <h2 className="lf-title">🔍 Lost &amp; Found</h2>
          <p className="lf-subtitle">Report missing items or help reunite people with their belongings</p>
        </div>
        <div className="lf-header-actions">
          <button className="lf-btn-lost"  onClick={() => { setForm({...EMPTY_FORM, item_type:'lost'});  setShowForm(true); }}>
            ➕ I Lost Something
          </button>
          <button className="lf-btn-found" onClick={() => { setForm({...EMPTY_FORM, item_type:'found'}); setShowForm(true); }}>
            🎉 I Found Something
          </button>
        </div>
      </div>

      {/* ── SUCCESS BANNER ─────────────────────────────────────── */}
      {successMsg && <div className="lf-success">{successMsg}</div>}

      {/* ── STATS BAR ──────────────────────────────────────────── */}
      <div className="lf-stats">
        <div className="lf-stat lf-stat--lost">
          <span className="lf-stat-val">{lostCount}</span>
          <span className="lf-stat-lbl">Items Lost</span>
        </div>
        <div className="lf-stat lf-stat--found">
          <span className="lf-stat-val">{foundCount}</span>
          <span className="lf-stat-lbl">Items Found</span>
        </div>
        <div className="lf-stat lf-stat--claimed">
          <span className="lf-stat-val">{items.filter(i => i.status === 'claimed').length}</span>
          <span className="lf-stat-lbl">Reunited</span>
        </div>
        <div className="lf-stat lf-stat--total">
          <span className="lf-stat-val">{items.length}</span>
          <span className="lf-stat-lbl">Total Reports</span>
        </div>
      </div>

      {/* ── FILTERS ────────────────────────────────────────────── */}
      <div className="lf-filters">
        <div className="lf-type-tabs">
          {['all','lost','found'].map(t => (
            <button key={t} className={`lf-type-tab ${filter === t ? 'active' : ''} ${t !== 'all' ? 'lf-type-tab--'+t : ''}`}
              onClick={() => setFilter(t)}>
              {t === 'all' ? '📋 All Items' : t === 'lost' ? '😟 Lost' : '😊 Found'}
            </button>
          ))}
        </div>
        <input className="lf-search" placeholder="🔎 Search by title, description, location..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* ── CATEGORY CHIPS ─────────────────────────────────────── */}
      <div className="lf-cats">
        {CATEGORIES.map(c => (
          <button key={c.id} className={`lf-cat ${catFilter === c.id ? 'lf-cat--active' : ''}`}
            onClick={() => setCatFilter(c.id)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* ── REPORT FORM ────────────────────────────────────────── */}
      {showForm && (
        <div className="lf-form-card">
          <h3 className="lf-form-title">
            {form.item_type === 'lost' ? '😟 Report Lost Item' : '😊 Report Found Item'}
          </h3>

          <div className="lf-form-type-toggle">
            <button className={`lf-toggle-btn ${form.item_type === 'lost'  ? 'active-lost'  : ''}`}
              onClick={() => setForm(f => ({...f, item_type:'lost'}))}>I Lost It</button>
            <button className={`lf-toggle-btn ${form.item_type === 'found' ? 'active-found' : ''}`}
              onClick={() => setForm(f => ({...f, item_type:'found'}))}>I Found It</button>
          </div>

          <div className="lf-form-grid">
            <div className="lf-form-group lf-span2">
              <label>Title *</label>
              <input placeholder="e.g. Black Casio Calculator" value={form.title}
                onChange={e => setForm(f => ({...f, title: e.target.value}))} />
            </div>
            <div className="lf-form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                {CATEGORIES.filter(c => c.id !== 'all').map(c =>
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                )}
              </select>
            </div>
            <div className="lf-form-group">
              <label>Location {form.item_type === 'lost' ? 'Lost' : 'Found'}</label>
              <input placeholder="e.g. Library 2nd Floor, Lab B201"
                value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
            </div>
            <div className="lf-form-group lf-span2">
              <label>Description</label>
              <textarea rows={3} placeholder="Colour, brand, any identifying marks..."
                value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div className="lf-form-group lf-span2">
              <label>Contact Info <span style={{fontWeight:400,color:'var(--text-tertiary)'}}>(email, phone, or note)</span></label>
              <input placeholder="e.g. yourname@student.edu or 'Check with Security Desk'"
                value={form.contact_info} onChange={e => setForm(f => ({...f, contact_info: e.target.value}))} />
            </div>
          </div>

          {error && <p className="lf-error">{error}</p>}

          <div className="lf-form-actions">
            <button className="lf-btn-cancel" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
            <button className="lf-btn-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}

      {/* ── ITEMS GRID ─────────────────────────────────────────── */}
      {loading ? (
        <div className="lf-loading">Loading items...</div>
      ) : filtered.length === 0 ? (
        <div className="lf-empty">
          <p>No items match your search.</p>
          <p>Be the first to report one!</p>
        </div>
      ) : (
        <div className="lf-grid">
          {filtered.map(item => (
            <div key={item.id} className={`lf-card lf-card--${item.item_type} ${item.status === 'claimed' ? 'lf-card--claimed' : ''}`}>
              <div className="lf-card-top">
                <span className="lf-cat-icon">{CAT_ICONS[item.category] || '🔮'}</span>
                <div className="lf-card-badges">
                  <span className={`lf-badge lf-badge--${item.item_type}`}>
                    {item.item_type === 'lost' ? '😟 Lost' : '😊 Found'}
                  </span>
                  {item.status === 'claimed' && <span className="lf-badge lf-badge--claimed">✅ Claimed</span>}
                </div>
              </div>

              <h4 className="lf-card-title">{item.title}</h4>
              {item.description && <p className="lf-card-desc">{item.description}</p>}

              <div className="lf-card-meta">
                {item.location    && <span>📍 {item.location}</span>}
                {item.contact_info && <span>📞 {item.contact_info}</span>}
                <span>👤 {item.reporter_name}</span>
                <span>🕐 {item.days_ago === 0 ? 'Today' : `${item.days_ago}d ago`}</span>
              </div>

              {item.status === 'open' && (
                <div className="lf-card-actions">
                  {item.item_type === 'found' && (
                    <button className="lf-btn-claim" onClick={() => handleClaim(item.id)}>
                      ✋ This is Mine
                    </button>
                  )}
                  {item.reported_by_id === currentUserId && (
                    <button className="lf-btn-delete" onClick={() => handleDelete(item.id)}>
                      🗑 Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
