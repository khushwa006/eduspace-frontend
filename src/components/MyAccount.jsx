import { useState, useEffect } from 'react';
import './MyAccount.css';

const API = 'https://eduspace-backend-bh29.onrender.com';
const authHeaders = (json = true) => {
  const h = { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

export default function MyAccount() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [profileError, setProfileError] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });

  const [show2faConfirm, setShow2faConfirm] = useState(false);
  const [twoFaPassword, setTwoFaPassword] = useState('');
  const [twoFaError, setTwoFaError] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const [activityData, setActivityData] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityTab, setActivityTab] = useState('recent');   // 'recent' | 'logins'
  const [expandedActivity, setExpandedActivity] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, { headers: authHeaders(false) });
      const data = await res.json();
      setProfile(data);
      setEditForm(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadProfile(); loadActivity(); }, []);

  const loadActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await fetch(`${API}/api/account/activity`, { headers: authHeaders(false) });
      const data = await res.json();
      setActivityData(data);
    } catch { /* ignore */ }
    setActivityLoading(false);
  };

  const ACTION_ICONS = {
    profile_update: '✏️', password_change: '🔑', booking_request: '🏫',
    facility_booking: '🏋️', attendance_marked: '✅', grievance: '📣', lost_found: '🔍',
  };

  if (loading) return <div className="ma-loading">⏳ Loading account...</div>;
  if (!profile) return <div className="ma-loading">Failed to load account.</div>;

  const initials = `${(profile.first_name||'?').charAt(0)}${(profile.last_name||'').charAt(0)}`.toUpperCase();
  const roleLabel = profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '';

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      const res = await fetch(`${API}/api/auth/profile/photo`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ photo: base64 })
      });
      if (res.ok) setProfile(p => ({ ...p, profile_photo: base64 }));
      else { const d = await res.json(); alert(d.error || 'Upload failed'); }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    await fetch(`${API}/api/auth/profile/photo`, { method: 'DELETE', headers: authHeaders(false) });
    setProfile(p => ({ ...p, profile_photo: '' }));
  };

  const handleSaveProfile = async () => {
    setProfileError('');
    const rawPhone = (editForm.phone || '').trim().replace(/[\s\-\(\)]/g, '');
    const digits = rawPhone.replace(/^\+91/, '').replace(/^0/, '');
    if (digits && !/^[6-9]\d{9}$/.test(digits)) {
      setProfileError('Phone number must be a valid 10-digit Indian mobile number (starts with 6-9).');
      return;
    }
    const payload = { ...editForm, phone: digits || editForm.phone };
    const res = await fetch(`${API}/api/auth/profile`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(p => ({ ...p, ...payload }));
      setEditing(false);
    } else {
      setProfileError(data.error || 'Failed to save changes');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('❌ Passwords do not match'); return;
    }
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ old_password: passwordForm.old_password, new_password: passwordForm.new_password })
      });
      if (res.ok) {
        alert('✅ Password changed successfully!');
        setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
        setShowPasswordForm(false);
      } else {
        const data = await res.json();
        alert('❌ ' + (data.error || 'Failed to change password'));
      }
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleToggle2FA = async (enable) => {
    if (!twoFaPassword.trim()) { setTwoFaError('Please enter your password to confirm'); return; }
    setTwoFaLoading(true);
    setTwoFaError('');
    try {
      const res = await fetch(`${API}/api/auth/2fa/toggle`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ password: twoFaPassword, enable })
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(p => ({ ...p, two_fa_enabled: enable }));
        setShow2faConfirm(false);
        setTwoFaPassword('');
        alert(`✅ ${data.message}`);
      } else {
        setTwoFaError(data.error || 'Failed to update 2FA setting');
      }
    } catch (err) {
      setTwoFaError('Error: ' + err.message);
    } finally {
      setTwoFaLoading(false);
    }
  };

  return (
    <div className="ma-page">
      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="ma-hero">
        <div className="ma-avatar-wrapper">
          {profile.profile_photo
            ? <img src={profile.profile_photo} alt="Profile" className="ma-avatar-img" />
            : <div className="ma-avatar-lg">{initials}</div>
          }
          <label className="ma-photo-overlay" title="Change photo">
            📷
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </label>
          {profile.profile_photo && (
            <button className="ma-photo-remove" onClick={handleRemovePhoto} title="Remove photo">✕</button>
          )}
        </div>
        <div className="ma-hero-info">
          <h2 className="ma-hero-name">{profile.first_name} {profile.last_name}</h2>
          <p className="ma-hero-email">{profile.email}</p>
          <div className="ma-hero-tags">
            <span className="ma-tag ma-tag-role">{roleLabel}</span>
            {profile.department && <span className="ma-tag">{profile.department}</span>}
            {profile.program && <span className="ma-tag ma-tag-muted">{profile.program}</span>}
            <span className="ma-tag ma-tag-muted">Member since {profile.member_since}</span>
            {activityData?.last_login && (
              <span className="ma-tag ma-tag-login">🕐 Last login: {activityData.last_login}</span>
            )}
          </div>
          {profile.bio && <p className="ma-hero-bio">"{profile.bio}"</p>}
        </div>
        {!editing && (
          <button className="ma-edit-btn" onClick={() => { setEditing(true); setEditForm(profile); setProfileError(''); }}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      <div className="ma-grid">
        {/* ── LEFT: PERSONAL INFO / EDIT FORM ───────────────── */}
        <div>
          {editing ? (
            <div className="ma-card">
              <h3 className="ma-section-title">✏️ Edit Profile</h3>
              <div className="ma-edit-form">
                <div className="ma-form-row">
                  <div className="ma-form-group">
                    <label>First Name</label>
                    <input className="ma-input" value={editForm.first_name || ''}
                      onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div className="ma-form-group">
                    <label>Last Name</label>
                    <input className="ma-input" value={editForm.last_name || ''}
                      onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                </div>
                <div className="ma-form-group">
                  <label>Email (cannot change)</label>
                  <input className="ma-input ma-input-disabled" value={editForm.email || ''} disabled />
                </div>
                <div className="ma-form-row">
                  <div className="ma-form-group">
                    <label>Phone</label>
                    <input className={`ma-input ${profileError ? 'ma-input-error' : ''}`} type="tel" maxLength={13}
                      placeholder="10-digit mobile number" value={editForm.phone || ''}
                      onChange={e => { setEditForm(f => ({ ...f, phone: e.target.value })); setProfileError(''); }} />
                    {profileError && <p className="ma-field-error">{profileError}</p>}
                  </div>
                  <div className="ma-form-group">
                    <label>Department</label>
                    <input className="ma-input" placeholder="e.g. Computer Science" value={editForm.department || ''}
                      onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} />
                  </div>
                </div>
                {profile.role && profile.role.toLowerCase() === 'student' && (
                  <div className="ma-form-row">
                    <div className="ma-form-group">
                      <label>Program</label>
                      <input className="ma-input" placeholder="e.g. B.Tech CSE" value={editForm.program || ''}
                        onChange={e => setEditForm(f => ({ ...f, program: e.target.value }))} />
                    </div>
                    <div className="ma-form-group">
                      <label>Batch Year</label>
                      <input className="ma-input" placeholder="e.g. 2023-27" value={editForm.batch_year || ''}
                        onChange={e => setEditForm(f => ({ ...f, batch_year: e.target.value }))} />
                    </div>
                  </div>
                )}
                {profile.role && profile.role.toLowerCase() === 'student' && (
                  <div className="ma-form-row">
                    <div className="ma-form-group">
                      <label>Enrollment No.</label>
                      <input className="ma-input" placeholder="e.g. A2305223456" value={editForm.enrollment_no || ''}
                        onChange={e => setEditForm(f => ({ ...f, enrollment_no: e.target.value }))} />
                    </div>
                    <div className="ma-form-group">
                      <label>Section</label>
                      <input className="ma-input" placeholder="e.g. A" value={editForm.section || ''}
                        onChange={e => setEditForm(f => ({ ...f, section: e.target.value }))} />
                    </div>
                  </div>
                )}
                <div className="ma-form-group">
                  <label>Bio / About Me</label>
                  <textarea className="ma-textarea" rows={3} placeholder="Tell others a little about yourself..."
                    value={editForm.bio || ''} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
                <div className="ma-form-buttons">
                  <button className="ma-btn-save" onClick={handleSaveProfile}>💾 Save Changes</button>
                  <button className="ma-btn-cancel" onClick={() => { setEditing(false); setProfileError(''); }}>Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ma-card">
              <h3 className="ma-section-title">👤 Personal Information</h3>
              <div className="ma-info-grid">
                {[
                  { icon: '📧', label: 'Email', value: profile.email },
                  { icon: '📱', label: 'Phone', value: profile.phone },
                  { icon: '🏢', label: 'Department', value: profile.department },
                  ...(profile.role && profile.role.toLowerCase() === 'student' ? [
                    { icon: '🎓', label: 'Enrollment No.', value: profile.enrollment_no },
                    { icon: '📚', label: 'Program', value: profile.program },
                    { icon: '📅', label: 'Batch Year', value: profile.batch_year },
                    { icon: '🔤', label: 'Section', value: profile.section },
                  ] : []),
                  { icon: '🛡️', label: 'Role', value: roleLabel },
                ].map(f => (
                  <div key={f.label} className="ma-info-row">
                    <div className="ma-info-left">
                      <span className="ma-info-icon">{f.icon}</span>
                      <span className="ma-info-label">{f.label}</span>
                    </div>
                    <span className={`ma-info-value ${!f.value ? 'ma-info-empty' : ''}`}>{f.value || '— Not set'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: SECURITY ─────────────────────────────────── */}
        <div className="ma-card">
          <h3 className="ma-section-title">🔒 Account Security</h3>

          <div className="ma-security-item">
            <div className="ma-security-info">
              <p className="ma-security-title">Password</p>
              <p className="ma-security-sub">
                Last changed: {(() => {
                  const last = activityData?.recent_activity?.find(a => a.action === 'password_change');
                  return last ? last.created_at : 'Unknown';
                })()}
              </p>
            </div>
            <button className="ma-security-btn" onClick={() => setShowPasswordForm(p => !p)}>
              {showPasswordForm ? 'Cancel' : '🔑 Change'}
            </button>
          </div>

          {showPasswordForm && (
            <div className="ma-password-form">
              <div className="ma-form-group">
                <label>Current Password</label>
                <input type="password" className="ma-input" value={passwordForm.old_password}
                  onChange={e => setPasswordForm(f => ({ ...f, old_password: e.target.value }))} />
              </div>
              <div className="ma-form-group">
                <label>New Password</label>
                <input type="password" className="ma-input" value={passwordForm.new_password}
                  onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} />
              </div>
              <div className="ma-form-group">
                <label>Confirm New Password</label>
                <input type="password" className="ma-input" value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))} />
              </div>
              <button className="ma-btn-save" style={{ width: '100%' }} onClick={handlePasswordChange}>
                🔒 Update Password
              </button>
            </div>
          )}

          <div className="ma-divider" />

          <div className="ma-security-item">
            <div className="ma-security-info">
              <p className="ma-security-title">Two-Factor Authentication (2FA)</p>
              <p className="ma-security-sub">
                {profile.two_fa_enabled
                  ? '✅ Enabled — a code is emailed to you on every login'
                  : 'Add an extra layer of security with email OTP'}
              </p>
            </div>
            <button className="ma-security-btn" onClick={() => { setShow2faConfirm(c => !c); setTwoFaPassword(''); setTwoFaError(''); }}>
              {show2faConfirm ? 'Cancel' : (profile.two_fa_enabled ? 'Disable' : 'Enable')}
            </button>
          </div>

          {show2faConfirm && (
            <div className="ma-password-form">
              {twoFaError && <p className="ma-field-error">{twoFaError}</p>}
              <div className="ma-form-group">
                <label>Confirm with your password</label>
                <input type="password" className="ma-input" placeholder="Enter your current password"
                  value={twoFaPassword} onChange={e => { setTwoFaPassword(e.target.value); setTwoFaError(''); }} />
              </div>
              <button className="ma-btn-save" style={{ width: '100%' }} disabled={twoFaLoading}
                onClick={() => handleToggle2FA(!profile.two_fa_enabled)}>
                {twoFaLoading ? 'Please wait...' : (profile.two_fa_enabled ? '🔓 Disable 2FA' : '🔐 Enable 2FA')}
              </button>
            </div>
          )}

          <div className="ma-divider" />

          <div className="ma-security-item">
            <div className="ma-security-info">
              <p className="ma-security-title">Account Status</p>
              <p className="ma-security-sub">Your account is active and approved</p>
            </div>
            <span className="ma-badge ma-badge-ok">✅ Active</span>
          </div>

          <div className="ma-security-item">
            <div className="ma-security-info">
              <p className="ma-security-title">Role</p>
              <p className="ma-security-sub">Access level on EduSpace platform</p>
            </div>
            <span className="ma-badge">{roleLabel}</span>
          </div>
        </div>

        {/* ── ACTIVITY TRAIL ─────────────────────────────────── */}
        <div className="ma-card ma-card-span2">
          <h3 className="ma-section-title">🕓 Activity Trail</h3>

          <div className="ma-activity-tabs">
            <button
              className={`ma-activity-tab ${activityTab === 'recent' ? 'active' : ''}`}
              onClick={() => { setActivityTab('recent'); setExpandedActivity(null); }}>
              ⚡ Recent Activity
            </button>
            <button
              className={`ma-activity-tab ${activityTab === 'logins' ? 'active' : ''}`}
              onClick={() => { setActivityTab('logins'); setExpandedActivity(null); }}>
              🔐 Login History
            </button>
          </div>

          {activityLoading ? (
            <p className="ma-activity-empty">Loading activity…</p>
          ) : activityTab === 'recent' ? (
            !activityData?.recent_activity?.length ? (
              <p className="ma-activity-empty">No activity recorded yet.</p>
            ) : (
              <div className="ma-activity-list">
                {activityData.recent_activity.map(a => {
                  const expanded = expandedActivity === a.id;
                  return (
                    <button key={a.id}
                      className={`ma-activity-row ${expanded ? 'expanded' : ''}`}
                      onClick={() => setExpandedActivity(prev => prev === a.id ? null : a.id)}>
                      <span className="ma-activity-icon">{ACTION_ICONS[a.action] || '📌'}</span>
                      <div className="ma-activity-main">
                        <p className="ma-activity-desc">{a.description}</p>
                        {expanded && <p className="ma-activity-meta">Action type: {a.action}</p>}
                      </div>
                      <span className="ma-activity-time">{a.created_at}</span>
                      <span className="ma-activity-chevron">{expanded ? '▲' : '▼'}</span>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            !activityData?.login_history?.length ? (
              <p className="ma-activity-empty">No login history recorded yet.</p>
            ) : (
              <div className="ma-activity-list">
                {activityData.login_history.map(l => {
                  const expanded = expandedActivity === `l${l.id}`;
                  return (
                    <button key={l.id}
                      className={`ma-activity-row ${expanded ? 'expanded' : ''}`}
                      onClick={() => setExpandedActivity(prev => prev === `l${l.id}` ? null : `l${l.id}`)}>
                      <span className="ma-activity-icon">🔐</span>
                      <div className="ma-activity-main">
                        <p className="ma-activity-desc">Signed in</p>
                        {expanded && (
                          <p className="ma-activity-meta">
                            IP: {l.ip_address || 'Unknown'} · Device: {l.user_agent || 'Unknown'}
                          </p>
                        )}
                      </div>
                      <span className="ma-activity-time">{l.logged_in_at}</span>
                      <span className="ma-activity-chevron">{expanded ? '▲' : '▼'}</span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
