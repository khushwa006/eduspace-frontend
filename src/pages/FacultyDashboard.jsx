import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import HolidayCalendar from '../components/HolidayCalendar';
import '../pages/FacultyAdminDashboard.css';
import ThemeToggle from '../components/ThemeToggle';
import '../components/ThemeToggle.css';
import NotificationBell from '../components/NotificationBell';
import '../components/NotificationBell.css';
import DatePicker from '../components/DatePicker';
import '../components/DatePicker.css';
import TimeSlotPicker from '../components/TimeSlotPicker';
import '../components/TimeSlotPicker.css';
import Timetable from '../components/Timetable';
import '../components/Timetable.css';
import MyAccount from '../components/MyAccount';
import '../components/MyAccount.css';

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState('menu');
  const [myRequests, setMyRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  // Attendance state (timetable-based)
  const [markableClasses, setMarkableClasses] = useState([]);
  const [loadingMarkable, setLoadingMarkable] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);   // entry from markableClasses
  const [roster, setRoster] = useState([]);
  const [rosterClassDate, setRosterClassDate] = useState('');
  const [windowClosesAt, setWindowClosesAt] = useState(null);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  const [formData, setFormData] = useState({
    class_name: '', room_id: '', date: '', time_slot_id: '', number_of_students: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, roomRes, slotsRes, requestsRes, bookingsRes] = await Promise.all([
        api.get('/api/auth/profile'),
        api.get('/api/rooms'),
        api.get('/api/time-slots'),
        api.get('/api/my-booking-requests'),
        api.get('/api/my-bookings'),
      ]);
      setUser(userRes.data);
      setRooms(Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data?.rooms || []));
      setTimeSlots(Array.isArray(slotsRes.data) ? slotsRes.data : []);
      setMyRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      setMyBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  // ── ATTENDANCE (timetable-based) ────────────────────────────────

  const loadMarkableClasses = async () => {
    setLoadingMarkable(true);
    try {
      const res = await api.get('/api/faculty/attendance/markable');
      setMarkableClasses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load classes open for attendance' });
    } finally {
      setLoadingMarkable(false);
    }
  };

  useEffect(() => { if (activeTab === 'attendance' && !selectedClass) loadMarkableClasses(); }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'holidays') return;
    setLoadingHolidays(true);
    api.get('/api/admin/holidays')
      .then(res => setHolidays(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHolidays([]))
      .finally(() => setLoadingHolidays(false));
  }, [activeTab]);

  const openClassAttendance = async (cls) => {
    setSelectedClass(cls);
    setSearchStudent('');
    setLoadingRoster(true);
    try {
      const res = await api.get(`/api/faculty/attendance/${cls.timetable_entry_id}/roster?date=${cls.class_date}`);
      setRoster(Array.isArray(res.data.roster) ? res.data.roster : []);
      setRosterClassDate(res.data.class_date);
      setWindowClosesAt(res.data.window_closes_at);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'This class is not open for attendance right now.' });
      setSelectedClass(null);
    } finally {
      setLoadingRoster(false);
    }
  };

  const markStudent = (studentId, status) =>
    setRoster(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r));

  const markAll = (status) =>
    setRoster(prev => prev.map(r => ({ ...r, status })));

  const saveAttendance = async () => {
    if (!selectedClass || roster.length === 0) return;
    setSavingAttendance(true);
    try {
      await api.post('/api/faculty/attendance/save', {
        timetable_entry_id: selectedClass.timetable_entry_id,
        records: roster.map(r => ({
          student_id: r.student_id, status: r.status, auto_status: r.auto_status
        }))
      });
      setMessage({ type: 'success', text: `✅ Attendance saved for ${roster.length} student(s)!` });
      setSelectedClass(null);
      loadMarkableClasses();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to save attendance' });
    } finally {
      setSavingAttendance(false);
    }
  };

  // ── FORM ──────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['number_of_students','room_id','time_slot_id'].includes(name) ? parseInt(value)||'' : value
    }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/booking-requests', {
        ...formData,
        room_id: parseInt(formData.room_id),
        time_slot_id: parseInt(formData.time_slot_id),
        number_of_students: parseInt(formData.number_of_students)
      });
      setMessage({ type: 'success', text: 'Booking request submitted! Waiting for admin approval.' });
      setFormData({ class_name: '', room_id: '', date: '', time_slot_id: '', number_of_students: '' });
      const r = await api.get('/api/my-booking-requests');
      setMyRequests(Array.isArray(r.data) ? r.data : []);
      setActiveTab('requests');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit request' });
    } finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
    const colors = { PENDING:'#f59e0b', APPROVED:'#10b981', REJECTED:'#ef4444' };
    return (
      <span className="status-badge"
        style={{ background: (colors[status]||'#888')+'20', color: colors[status]||'#888' }}>
        {status}
      </span>
    );
  };

  const filteredRoster = roster.filter(r =>
    r.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    r.email.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const presentCount     = roster.filter(r => r.status === 'present').length;
  const absentCount      = roster.filter(r => r.status === 'absent').length;
  const outOfCampusCount = roster.filter(r => r.status === 'out_of_campus').length;

  return (
    <div className="dashboard">
      {/* Navbar */}
      <div className="navbar">
        <div className="navbar-left">
          <div className="logo">🏫</div>
          <h1>EduSpace – Faculty</h1>
        </div>
        <div className="navbar-right">
          <ThemeToggle />
          <div className="user-info">
            <p className="user-name">{user?.first_name} {user?.last_name}</p>
            <p className="user-status">Faculty</p>
          </div>
          <button className="btn-logout" onClick={() => {
            localStorage.removeItem('jwt_token');
            window.location.href = '/';
          }}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
            <button onClick={() => setMessage({ type:'', text:'' })}
              style={{ float:'right', background:'none', border:'none', cursor:'pointer', fontWeight:'bold' }}>✕</button>
          </div>
        )}

        {/* ── DASHBOARD LANDING MENU ───────────────────────────── */}
        {activeTab === 'menu' && (
          <div className="dash-menu-grid">
            {[
              { key: 'attendance', icon: '✅', label: selectedClass ? `Attendance — ${selectedClass.subject_name}` : 'Attendance', desc: 'Mark today\'s class attendance' },
              { key: 'timetable',  icon: '🗓️', label: 'My Timetable', desc: 'View your class schedule' },
              { key: 'bookings',   icon: '📅', label: 'Room Bookings', desc: 'Request & track room bookings', badge: myRequests.length },
              { key: 'myaccount',  icon: '👤', label: 'My Account',    desc: 'Profile & security settings' },
              { key: 'holidays',   icon: '📅', label: 'Holidays',      desc: 'Non-working days' },
            ].map(({ key, icon, label, desc, badge }) => (
              <button key={key} className="dash-menu-card" onClick={() => setActiveTab(key)}>
                {badge > 0 && <span className="dmc-badge">{badge}</span>}
                <span className="dmc-icon">{icon}</span>
                <span className="dmc-label">{label}</span>
                <span className="dmc-desc">{desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── BACK BUTTON (shown inside any section) ───────────── */}
        {activeTab !== 'menu' && (
          <button className="btn-back-menu" onClick={() => setActiveTab('menu')}>← Back to Dashboard</button>
        )}

        {/* ── MY TIMETABLE ─────────────────────────────────────── */}
        {activeTab === 'timetable' && (
          <div className="tab-content">
            <Timetable />
          </div>
        )}

        {/* ── MY ACCOUNT ───────────────────────────────────────── */}
        {activeTab === 'myaccount' && (
          <div className="tab-content">
            <MyAccount />
          </div>
        )}

        {/* ── HOLIDAYS ─────────────────────────────────────────── */}
        {activeTab === 'holidays' && (() => {
          const today = new Date().toISOString().split('T')[0];
          const upcoming = holidays.filter(h => h.date >= today);
          const past = holidays.filter(h => h.date < today);
          return (
            <div className="tab-content">
              <h2>📅 Holidays</h2>
              <p style={{color:'var(--text-secondary)', marginBottom:'24px', fontSize:'14px'}}>
                Sundays are a fixed weekly off. These dates are also non-working — attendance windows
                for your classes automatically skip them too (extending to the next actual working day).
              </p>
              {loadingHolidays ? (
                <p className="empty-state">Loading…</p>
              ) : (
                <HolidayCalendar holidays={holidays} />
              )}
            </div>
          );
        })()}

        {/* ── MY BOOKINGS ──────────────────────────────────────── */}
        {activeTab === 'bookings' && (
          <div className="tab-content">
            {/* ── CONFIRMED BOOKINGS ── */}
            <div className="list-header">
              <div>
                <h2 className="tab-page-title">📅 Room Bookings</h2>
                <p className="tab-page-sub">Your confirmed bookings and pending requests</p>
              </div>
              <button className="btn-inline-action" onClick={() => setShowBookingForm(f => !f)}>
                {showBookingForm ? '✕ Cancel' : '➕ New Request'}
              </button>
            </div>

            {/* ── INLINE FORM ── */}
            {showBookingForm && (
              <div className="booking-card" style={{marginBottom:'24px'}}>
                <h3 style={{marginBottom:'16px',fontWeight:700}}>New Booking Request</h3>
                <form onSubmit={async (e) => { e.preventDefault(); await handleSubmitRequest(e); setShowBookingForm(false); }} className="booking-form">
                  <div className="form-group">
                    <label>Class Name *</label>
                    <input type="text" name="class_name" placeholder="e.g., Data Structures – CS101"
                      value={formData.class_name} onChange={handleInputChange} required className="form-input" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Room *</label>
                      <select name="room_id" value={formData.room_id} onChange={handleInputChange} required className="form-input">
                        <option value="">Select Room</option>
                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date *</label>
                      <DatePicker value={formData.date}
                        onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                        placeholder="Select booking date"
                        minDate={new Date().toISOString().split('T')[0]} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Time Slot *</label>
                      <TimeSlotPicker slots={timeSlots} value={formData.time_slot_id}
                        onChange={(id) => setFormData(prev => ({ ...prev, time_slot_id: id }))}
                        placeholder="Select time slot" />
                    </div>
                    <div className="form-group">
                      <label>Number of Students *</label>
                      <input type="number" name="number_of_students" min="1"
                        value={formData.number_of_students} onChange={handleInputChange} required className="form-input" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-submit">
                    {loading ? 'Submitting…' : '🚀 Submit for Approval'}
                  </button>
                </form>
              </div>
            )}

            {/* ── PENDING REQUESTS ── */}
            {myRequests.length > 0 && (
              <>
                <div className="section-divider">Pending Requests</div>
                <div className="requests-list">
                  {myRequests.map(req => (
                    <div key={req.id} className="request-card">
                      <div className="request-header">
                        <h3>{req.class_name}</h3>
                        <span className={`status-badge ${req.status==='APPROVED'?'badge-approved':req.status==='REJECTED'?'badge-rejected':'badge-pending'}`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="request-details">
                        <div className="detail"><span className="label">🏢 Room</span><span>{req.room_name}</span></div>
                        <div className="detail"><span className="label">📅 Date</span><span>{req.date}</span></div>
                        <div className="detail"><span className="label">⏰ Time</span><span>{req.time_slot}</span></div>
                        <div className="detail"><span className="label">👥 Students</span><span>{req.number_of_students}</span></div>
                      </div>
                      {req.status==='REJECTED' && req.rejection_reason && (
                        <div className="rejection-reason"><strong>Rejection:</strong> {req.rejection_reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── CONFIRMED BOOKINGS ── */}
            <div className="section-divider">Confirmed Bookings</div>
            {myBookings.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">📭</div>
                <p className="empty-state-title">No confirmed bookings yet</p>
                <p className="empty-state-sub">Submit a request above — admin will approve it and it'll appear here.</p>
              </div>
            ) : (
              <div className="bookings-list">
                {myBookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <h3>{booking.class_name}</h3>
                      <span className="status-badge badge-approved">CONFIRMED</span>
                    </div>
                    <div className="booking-details">
                      <div className="detail"><span className="label">📍 Room</span><span>{booking.room_name}</span></div>
                      <div className="detail"><span className="label">📅 Date</span><span>{booking.date}</span></div>
                      <div className="detail"><span className="label">⏰ Time</span><span>{booking.time_slot}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ATTENDANCE (timetable-based) ─────────────────────── */}
        {activeTab === 'attendance' && (
          <div className="tab-content">
            {!selectedClass ? (
              <>
                <h2>✅ Mark Attendance</h2>
                <p style={{ color:'var(--text-secondary)', marginTop:'4px', marginBottom:'1.25rem' }}>
                  Only classes that have started — and are still within their attendance window
                  (open until the same time the next day) — appear here.
                </p>
                {loadingMarkable ? (
                  <p className="empty-state">Loading…</p>
                ) : markableClasses.length === 0 ? (
                  <div className="empty-state">
                    <p>📭 No classes are currently open for attendance.</p>
                    <small>A class becomes markable once it starts, and stays open until the same time the next day.</small>
                  </div>
                ) : (
                  <div className="bookings-list">
                    {markableClasses.map(cls => (
                      <div key={cls.timetable_entry_id} className="booking-card">
                        <div className="booking-header">
                          <h3>{cls.subject_name}</h3>
                          <span className={`status-badge ${cls.already_marked ? 'status-active' : ''}`}>
                            {cls.already_marked ? 'MARKED' : 'OPEN'}
                          </span>
                        </div>
                        <div className="booking-details">
                          <div className="detail"><span className="label">🎓 Class</span><span>{cls.program} · {cls.batch_year} · Sec {cls.section}</span></div>
                          <div className="detail"><span className="label">📅 Day</span><span>{cls.day_of_week} ({cls.class_date})</span></div>
                          <div className="detail"><span className="label">⏰ Slot</span><span>{cls.slot_name}</span></div>
                        </div>
                        <button className="btn-mark-attendance" onClick={() => openClassAttendance(cls)}>
                          {cls.already_marked ? '✏️ Edit Attendance' : '✅ Mark Attendance'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="att-override-notice">
                  ✏️ <strong>Out of Campus is auto-detected</strong> from GPS check-ins. You can override any
                  student's status below — e.g. mark a genuine Out of Campus case as Present. Saving will overwrite previous records.
                  {windowClosesAt && <> Window closes at <strong>{new Date(windowClosesAt).toLocaleString()}</strong>.</>}
                </div>

                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
                  <div>
                    <h2>✅ {selectedClass.subject_name}</h2>
                    <p style={{ color:'var(--text-secondary)', marginTop:'4px' }}>
                      🎓 {selectedClass.program} · {selectedClass.batch_year} · Sec {selectedClass.section}
                      &nbsp;|&nbsp; 📅 {rosterClassDate} &nbsp;|&nbsp; ⏰ {selectedClass.slot_name}
                    </p>
                  </div>
                  <button className="btn-cancel" onClick={() => setSelectedClass(null)}>← Back</button>
                </div>

                {/* Summary cards */}
                <div className="attendance-summary-bar">
                  {[
                    { label:'Total',         value: roster.length,    bg:'#eff6ff', color:'#3b82f6' },
                    { label:'Present',       value: presentCount,     bg:'#ecfdf5', color:'#10b981' },
                    { label:'Absent',        value: absentCount,      bg:'#fef2f2', color:'#ef4444' },
                    { label:'Out of Campus', value: outOfCampusCount, bg:'#fffbeb', color:'#f59e0b' },
                  ].map(c => (
                    <div key={c.label} className="att-stat-card" style={{ background: c.bg }}>
                      <p className="att-stat-value" style={{ color: c.color }}>{c.value}</p>
                      <p className="att-stat-label">{c.label}</p>
                    </div>
                  ))}
                </div>

                {/* Toolbar */}
                <div className="attendance-toolbar">
                  <input className="att-search" type="text" placeholder="🔍 Search by name or email…"
                    value={searchStudent} onChange={e => setSearchStudent(e.target.value)} />
                  <button className="btn-bulk-present" onClick={() => markAll('present')}>✅ All Present</button>
                  <button className="btn-bulk-absent"  onClick={() => markAll('absent')}>❌ All Absent</button>
                </div>

                {/* Student list */}
                {loadingRoster ? (
                  <p className="empty-state">Loading roster…</p>
                ) : roster.length === 0 ? (
                  <div className="no-students-placeholder">
                    <p>⚠️ No approved students found for this Program / Batch / Section.</p>
                    <small>Students must be registered, with role "Student" and approved by admin, to appear here.</small>
                  </div>
                ) : (
                  <div className="student-list">
                    {filteredRoster.map(student => (
                      <div key={student.student_id} className={`student-row ${student.status}`}>
                        <div className="student-identity">
                          <div className="student-avatar">
                            {student.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <p className="student-name">{student.name}</p>
                            <p className="student-email">
                              {student.email}
                              {student.auto_status === 'out_of_campus' && student.status !== 'out_of_campus' && (
                                <span style={{ color:'#f59e0b', fontWeight:600 }}> · overridden from auto Out of Campus</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="att-status-btns">
                          {[
                            { s:'present', icon:'✅', label:'Present' },
                            { s:'absent', icon:'❌', label:'Absent' },
                            { s:'out_of_campus', icon:'📍', label:'Out of Campus' },
                          ].map(({ s, icon, label }) => (
                            <button key={s}
                              className={`att-btn ${student.status===s ? `active-${s}` : ''}`}
                              onClick={() => markStudent(student.student_id, s)}>
                              {icon} {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="attendance-footer">
                  <span className="att-progress-text">{roster.length} student(s) in this class</span>
                  <button className="btn-save-attendance"
                    disabled={savingAttendance || roster.length === 0}
                    onClick={saveAttendance}>
                    {savingAttendance ? '⏳ Saving…' : '💾 Save Attendance'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
