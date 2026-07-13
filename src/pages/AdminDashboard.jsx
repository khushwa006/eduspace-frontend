import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../pages/FacultyAdminDashboard.css';
import ThemeToggle from '../components/ThemeToggle';
import '../components/ThemeToggle.css';
import NotificationBell from '../components/NotificationBell';
import '../components/NotificationBell.css';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import '../components/AnalyticsDashboard.css';
import MyAccount from '../components/MyAccount';
import HolidayCalendar from '../components/HolidayCalendar';
import '../components/MyAccount.css';

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, calendar
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [allFeedback, setAllFeedback] = useState([]);
  const [geofenceLogs, setGeofenceLogs] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [roomForm, setRoomForm] = useState({name:'',room_type:'Classroom',building:'',floor:1,capacity:30});
  const [roomSaving, setRoomSaving] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [allNotifs, setAllNotifs] = useState([]);
  const [notifForm, setNotifForm] = useState({title:'',message:'',notif_type:'info',target_role:'all'});
  const [notifSending, setNotifSending] = useState(false);
  const [campusConfig, setCampusConfig] = useState({name:'',latitude:'',longitude:'',radius_m:''});
  const [configSaving, setConfigSaving] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null); // null, approve, reject

  // Grievances
  const [allGrievances, setAllGrievances] = useState([]);
  const [grievanceStats, setGrievanceStats] = useState({});
  const [grStatusFilter, setGrStatusFilter] = useState('');
  const [grCategoryFilter, setGrCategoryFilter] = useState('');
  const [grPriorityFilter, setGrPriorityFilter] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});

  // Timetable
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [ttFilterOptions, setTtFilterOptions] = useState({ programs: [], batch_years: [], sections: [] });
  const [ttFilters, setTtFilters] = useState({ program: '', batch_year: '', section: '' });

  // Facility Bookings
  const [facilityBookings, setFacilityBookings] = useState([]);
  const [fbTypeFilter, setFbTypeFilter] = useState('');
  const [fbDateFilter, setFbDateFilter] = useState('');

  // Locked Accounts / Reset Password
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [holidayMsg, setHolidayMsg] = useState('');
  const [showTtForm, setShowTtForm] = useState(false);
  const [editingTtId, setEditingTtId] = useState(null);
  const [ttForm, setTtForm] = useState({
    day_of_week: 'Monday', time_slot_id: '', subject_name: '',
    faculty_id: '', room_id: '', program: '', batch_year: '', section: ''
  });

  const [approvalData, setApprovalData] = useState({
    notes: '',
    reason: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
    // Reload every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'grievances') fetchFilteredGrievances();
  }, [grStatusFilter, grCategoryFilter, grPriorityFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'timetable') fetchFilteredTimetable();
  }, [ttFilters, activeTab]);

  useEffect(() => {
    if (activeTab === 'facilitybookings') fetchFilteredFacilityBookings();
  }, [fbTypeFilter, fbDateFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'holidays') fetchHolidays();
  }, [activeTab]);

  const fetchHolidays = async () => {
    try {
      const res = await api.get('/api/admin/holidays');
      setHolidays(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHolidayMsg('❌ Failed to load holidays');
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;
    try {
      const res = await api.post('/api/admin/holidays', { date: newHolidayDate, name: newHolidayName.trim() });
      setHolidayMsg(`✅ ${res.data.message}`);
      setNewHolidayDate('');
      setNewHolidayName('');
      fetchHolidays();
    } catch (err) {
      setHolidayMsg(`❌ ${err.response?.data?.error || 'Failed to add holiday'}`);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Remove this holiday?')) return;
    try {
      await api.delete(`/api/admin/holidays/${id}`);
      fetchHolidays();
    } catch {
      setHolidayMsg('❌ Failed to remove holiday');
    }
  };

  const safeGet = async (url, setter, transform) => {
    try {
      const res = await api.get(url);
      setter(transform ? transform(res.data) : res.data);
    } catch { /* individual failure — don't crash everything */ }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.allSettled([
      safeGet('/api/auth/profile',          setUser),
      safeGet('/api/admin/pending-requests',setPendingRequests),
      safeGet('/api/admin/all-bookings',    setAllBookings),
      safeGet('/api/admin/pending-faculty', setPendingFaculty, d => Array.isArray(d) ? d : []),
      safeGet('/api/admin/pending-students',setPendingStudents, d => Array.isArray(d) ? d : []),
      safeGet('/api/admin/all-feedback',    setAllFeedback,    d => Array.isArray(d) ? d : []),
      safeGet('/api/admin/notifications',   setAllNotifs,      d => Array.isArray(d) ? d : []),
      safeGet('/api/admin/geofence-logs',   setGeofenceLogs,   d => Array.isArray(d) ? d : []),
      safeGet('/api/campus-config',         d => { if (d) setCampusConfig(d); }),
      safeGet('/api/rooms',                 setAllRooms,       d => Array.isArray(d) ? d : []),
      safeGet('/api/admin/grievances',      setAllGrievances,  d => Array.isArray(d) ? d : []),
      safeGet('/api/admin/grievances/stats',setGrievanceStats, d => d || {}),
      safeGet('/api/admin/timetable',       setTimetableEntries, d => Array.isArray(d) ? d : []),
      safeGet('/api/admin/facility-bookings', setFacilityBookings, d => Array.isArray(d) ? d : []),
      safeGet('/api/admin/locked-accounts', setLockedAccounts, d => Array.isArray(d) ? d : []),
      safeGet('/api/time-slots',            setTimeSlots,      d => Array.isArray(d) ? d : []),
      safeGet('/api/admin/faculty-list',    setFacultyList,    d => Array.isArray(d) ? d : []),
      safeGet('/api/timetable/filters',     setTtFilterOptions, d => d || { programs: [], batch_years: [], sections: [] }),
    ]);
    setLoading(false);
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setLoading(true);
      await api.post(`/api/admin/booking-request/${requestId}/approve`, {
        notes: approvalData.notes
      });

      setMessage({ type: 'success', text: 'Booking request approved!' });
      setApprovalModal(null);
      setApprovalData({ notes: '', reason: '' });
      setSelectedRequest(null);

      // Reload data
      await loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to approve' });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setLoading(true);
      await api.post(`/api/admin/booking-request/${requestId}/reject`, {
        reason: approvalData.reason
      });

      setMessage({ type: 'success', text: 'Booking request rejected.' });
      setApprovalModal(null);
      setApprovalData({ notes: '', reason: '' });
      setSelectedRequest(null);

      // Reload data
      await loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to reject' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredGrievances = async () => {
    const params = new URLSearchParams();
    if (grStatusFilter)   params.append('status', grStatusFilter);
    if (grCategoryFilter) params.append('category', grCategoryFilter);
    if (grPriorityFilter) params.append('priority', grPriorityFilter);
    try {
      const res = await api.get(`/api/admin/grievances?${params.toString()}`);
      setAllGrievances(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
  };

  const handleUpdateGrievance = async (grievanceId, status) => {
    try {
      setLoading(true);
      await api.put(`/api/admin/grievances/${grievanceId}`, {
        status,
        admin_reply: replyDrafts[grievanceId] || ''
      });
      setMessage({ type: 'success', text: `Grievance marked as ${status.replace('_', ' ')}!` });
      setReplyDrafts(prev => ({ ...prev, [grievanceId]: '' }));
      await fetchFilteredGrievances();
      const statsRes = await api.get('/api/admin/grievances/stats');
      setGrievanceStats(statsRes.data || {});
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update grievance' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredTimetable = async () => {
    const params = new URLSearchParams();
    if (ttFilters.program)    params.append('program', ttFilters.program);
    if (ttFilters.batch_year) params.append('batch_year', ttFilters.batch_year);
    if (ttFilters.section)    params.append('section', ttFilters.section);
    try {
      const res = await api.get(`/api/admin/timetable?${params.toString()}`);
      setTimetableEntries(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
  };

  const fetchFilteredFacilityBookings = async () => {
    const params = new URLSearchParams();
    if (fbTypeFilter) params.append('room_type', fbTypeFilter);
    if (fbDateFilter) params.append('date', fbDateFilter);
    try {
      const res = await api.get(`/api/admin/facility-bookings?${params.toString()}`);
      setFacilityBookings(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    if (!resetEmail.trim() || !resetNewPassword) {
      setResetMessage('❌ Please enter the user\'s email and a new password');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetMessage('❌ Passwords do not match');
      return;
    }
    setResetLoading(true);
    try {
      const res = await api.post('/api/admin/reset-user-password', {
        email: resetEmail.trim(),
        new_password: resetNewPassword
      });
      setResetMessage(`✅ ${res.data.message}`);
      setResetEmail('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      const lockedRes = await api.get('/api/admin/locked-accounts');
      setLockedAccounts(Array.isArray(lockedRes.data) ? lockedRes.data : []);
    } catch (error) {
      setResetMessage(`❌ ${error.response?.data?.error || 'Failed to reset password'}`);
    } finally {
      setResetLoading(false);
    }
  };

  const resetTtForm = () => {
    setTtForm({ day_of_week: 'Monday', time_slot_id: '', subject_name: '', faculty_id: '', room_id: '', program: '', batch_year: '', section: '' });
    setEditingTtId(null);
  };

  const handleSaveTimetableEntry = async () => {
    if (!ttForm.time_slot_id || !ttForm.subject_name || !ttForm.program || !ttForm.batch_year || !ttForm.section) {
      setMessage({ type: 'error', text: 'Time slot, subject, program, batch year and section are required' });
      return;
    }
    try {
      setLoading(true);
      if (editingTtId) {
        await api.put(`/api/admin/timetable/${editingTtId}`, ttForm);
        setMessage({ type: 'success', text: 'Timetable entry updated!' });
      } else {
        await api.post('/api/admin/timetable', ttForm);
        setMessage({ type: 'success', text: 'Timetable entry created!' });
      }
      resetTtForm();
      setShowTtForm(false);
      await fetchFilteredTimetable();
      const filterRes = await api.get('/api/timetable/filters');
      setTtFilterOptions(filterRes.data || { programs: [], batch_years: [], sections: [] });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save timetable entry' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTimetableEntry = (entry) => {
    setTtForm({
      day_of_week: entry.day_of_week, time_slot_id: entry.time_slot_id, subject_name: entry.subject_name,
      faculty_id: entry.faculty_id || '', room_id: entry.room_id || '',
      program: entry.program, batch_year: entry.batch_year, section: entry.section
    });
    setEditingTtId(entry.id);
    setShowTtForm(true);
  };

  const handleDeleteTimetableEntry = async (entryId) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      setLoading(true);
      await api.delete(`/api/admin/timetable/${entryId}`);
      setMessage({ type: 'success', text: 'Timetable entry deleted!' });
      await fetchFilteredTimetable();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete entry' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFaculty = async (userId) => {
    try {
      await api.post(`/api/admin/approve-faculty/${userId}`, {});
      setMessage({ type: 'success', text: 'Faculty account approved! They can now log in.' });
      await loadData();
    } catch { setMessage({ type: 'error', text: 'Failed to approve faculty' }); }
  };

  const handleApproveStudent = async (userId) => {
    try {
      await api.post(`/api/admin/approve-student/${userId}`, {});
      setMessage({ type: 'success', text: 'Student account approved!' });
      await loadData();
    } catch { setMessage({ type: 'error', text: 'Failed to approve student' }); }
  };

  const handleRejectStudent = async (userId) => {
    if (!window.confirm('Reject and delete this student account?')) return;
    try {
      await api.delete(`/api/admin/reject-student/${userId}`);
      setMessage({ type: 'success', text: 'Student account rejected.' });
      await loadData();
    } catch { setMessage({ type: 'error', text: 'Failed to reject student' }); }
  };

  const handleRejectFaculty = async (userId) => {
    if (!window.confirm('Reject and delete this faculty account?')) return;
    try {
      await api.delete(`/api/admin/reject-faculty/${userId}`);
      setMessage({ type: 'success', text: 'Faculty account rejected and removed.' });
      await loadData();
    } catch { setMessage({ type: 'error', text: 'Failed to reject faculty' }); }
  };

  const getConflictWarning = (request) => {
    const conflicts = pendingRequests.filter(r =>
      r.room_id === request.room_id &&
      r.date === request.date &&
      r.time_slot_id === request.time_slot_id &&
      r.id !== request.id
    );
    return conflicts.length > 0;
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <div className="navbar">
        <div className="navbar-left">
          <div className="logo">⚙️</div>
          <h1>EduSpace - Admin</h1>
        </div>
        <div className="navbar-right">
          <ThemeToggle />
          <div className="user-info">
            <p className="user-name">{user?.first_name} {user?.last_name}</p>
            <p className="user-status">Admin</p>
          </div>
          <button className="btn-logout" onClick={() => {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            if (typeof onLogout === 'function') onLogout();
            else window.location.href = '/';
          }}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-section">
          <div className="tabs">
            {/* ── DAILY ── */}
            <span className="tab-group-label">Daily</span>
            <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}>
              ⏳ Pending Approvals {pendingRequests.length > 0 && <span className="badge-pending" style={{marginLeft:'4px',padding:'2px 7px',fontSize:'11px',animation:'none'}}>{pendingRequests.length}</span>}
            </button>
            <button className={`tab ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}>
              🎓 Students {pendingStudents.length > 0 && `(${pendingStudents.length})`}
            </button>
            <button className={`tab ${activeTab === 'faculty' ? 'active' : ''}`}
              onClick={() => setActiveTab('faculty')}>
              👨‍🏫 Faculty {pendingFaculty.length > 0 && `(${pendingFaculty.length})`}
            </button>
            <button className={`tab ${activeTab === 'grievances' ? 'active' : ''}`}
              onClick={() => setActiveTab('grievances')}>
              📋 Grievances {grievanceStats.pending > 0 && `(${grievanceStats.pending})`}
            </button>

            <div className="tab-group-sep" />

            {/* ── MANAGE ── */}
            <span className="tab-group-label">Manage</span>
            <button className={`tab ${activeTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('rooms')}>
              🏛️ Rooms
            </button>
            <button className={`tab ${activeTab === 'timetable' ? 'active' : ''}`}
              onClick={() => setActiveTab('timetable')}>
              🗓️ Timetable
            </button>
            <button className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}>
              ✅ Bookings ({allBookings.length})
            </button>
            <button className={`tab ${activeTab === 'facilitybookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('facilitybookings')}>
              🏋️ Facility
            </button>
            <button className={`tab ${activeTab === 'holidays' ? 'active' : ''}`}
              onClick={() => setActiveTab('holidays')}>
              📅 Holidays
            </button>
            <button className={`tab ${activeTab === 'lockedaccounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('lockedaccounts')}>
              🔒 Locked {lockedAccounts.length > 0 && `(${lockedAccounts.length})`}
            </button>

            <div className="tab-group-sep" />

            {/* ── INSIGHTS ── */}
            <span className="tab-group-label">Insights</span>
            <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}>
              📊 Analytics
            </button>
            <button className={`tab ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}>
              📝 Feedback ({allFeedback.length})
            </button>
            <button className={`tab ${activeTab === 'geofence' ? 'active' : ''}`}
              onClick={() => setActiveTab('geofence')}>
              📍 GPS Logs
            </button>
            <button className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}>
              📅 Calendar
            </button>
            <button className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}>
              🔔 Notifications
            </button>
            <button className={`tab ${activeTab === 'myaccount' ? 'active' : ''}`}
              onClick={() => setActiveTab('myaccount')}>
              👤 My Account
            </button>
          </div>
        </div>

        {/* ── ANALYTICS TAB ──────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="tab-content">
            <AnalyticsDashboard />
          </div>
        )}

        {/* ── GRIEVANCES TAB ─────────────────────────────────── */}
        {activeTab === 'grievances' && (
          <div className="tab-content">
            <h2>📋 Grievances & Complaints</h2>

            {/* Stat cards */}
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'20px'}}>
              {[
                {label:'Total',      value: grievanceStats.total || 0,       color:'#3b82f6'},
                {label:'Pending',    value: grievanceStats.pending || 0,     color:'#f59e0b'},
                {label:'In Progress',value: grievanceStats.in_progress || 0, color:'#3b82f6'},
                {label:'Resolved',   value: grievanceStats.resolved || 0,    color:'#10b981'},
                {label:'Rejected',   value: grievanceStats.rejected || 0,    color:'#ef4444'},
                {label:'Urgent Open',value: grievanceStats.urgent_open || 0, color:'#ef4444'},
              ].map(s => (
                <div key={s.label} style={{flex:'1',minWidth:'120px',background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'10px',padding:'14px',textAlign:'center',borderTop:`3px solid ${s.color}`}}>
                  <p style={{margin:0,fontSize:'22px',fontWeight:800,color:s.color}}>{s.value}</p>
                  <p style={{margin:'2px 0 0',fontSize:'11px',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:600}}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
              <select className="form-input" style={{maxWidth:'180px'}} value={grStatusFilter} onChange={e=>setGrStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="pending">⏳ Pending</option>
                <option value="in_progress">🔧 In Progress</option>
                <option value="resolved">✅ Resolved</option>
                <option value="rejected">❌ Rejected</option>
              </select>
              <select className="form-input" style={{maxWidth:'180px'}} value={grCategoryFilter} onChange={e=>setGrCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                <option value="hostel">🏠 Hostel</option>
                <option value="academic">📚 Academic</option>
                <option value="facility">🏛️ Facility</option>
                <option value="ragging">⚠️ Ragging</option>
                <option value="harassment">🚨 Harassment</option>
                <option value="other">📋 Other</option>
              </select>
              <select className="form-input" style={{maxWidth:'180px'}} value={grPriorityFilter} onChange={e=>setGrPriorityFilter(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* List */}
            {allGrievances.length === 0 ? (
              <p className="empty-state">No grievances match the current filters. ✨</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                {allGrievances.map(g => {
                  const STATUS_COLORS = {pending:'#f59e0b',in_progress:'#3b82f6',resolved:'#10b981',rejected:'#ef4444'};
                  const PRIORITY_COLORS = {low:'#3b82f6',medium:'#f59e0b',high:'#f97316',urgent:'#ef4444'};
                  const sc = STATUS_COLORS[g.status] || '#94a3b8';
                  const pc = PRIORITY_COLORS[g.priority] || '#94a3b8';
                  return (
                    <div key={g.id} style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'14px',padding:'18px 20px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'10px',marginBottom:'10px',flexWrap:'wrap'}}>
                        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                          <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:700,background:'var(--bg-tertiary)',border:'1px solid var(--border-color)',color:'var(--text-secondary)'}}>
                            {g.category}
                          </span>
                          <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:700,border:`1px solid ${pc}`,color:pc}}>
                            {g.priority} priority
                          </span>
                          {g.is_anonymous && (
                            <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:700,background:'var(--bg-tertiary)',border:'1px solid var(--border-color)',color:'var(--text-secondary)'}}>
                              🔒 Anonymous
                            </span>
                          )}
                        </div>
                        <span style={{padding:'5px 13px',borderRadius:'20px',fontSize:'12px',fontWeight:700,background:`${sc}22`,color:sc,border:`1px solid ${sc}`}}>
                          {g.status.replace('_',' ')}
                        </span>
                      </div>

                      <p style={{fontSize:'15px',fontWeight:700,color:'var(--text-primary)',margin:'0 0 4px'}}>{g.subject}</p>
                      <p style={{fontSize:'13px',color:'var(--text-secondary)',lineHeight:1.6,margin:'0 0 8px'}}>{g.description}</p>
                      <p style={{fontSize:'12px',color:'var(--text-tertiary)',margin:'0 0 14px'}}>
                        👤 {g.student_name} {g.student_email ? `(${g.student_email})` : ''} · 🕐 {g.created_at}
                      </p>

                      {g.admin_reply && (
                        <div style={{background:'var(--bg-secondary)',borderLeft:'3px solid var(--accent)',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px'}}>
                          <p style={{fontSize:'11px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',margin:'0 0 4px'}}>Previous Reply</p>
                          <p style={{fontSize:'13px',color:'var(--text-primary)',margin:0}}>{g.admin_reply}</p>
                        </div>
                      )}

                      {g.status !== 'resolved' && g.status !== 'rejected' && (
                        <div>
                          <textarea
                            className="form-input"
                            placeholder="Write a reply to the student (optional)..."
                            rows={2}
                            style={{width:'100%',marginBottom:'10px',resize:'vertical'}}
                            value={replyDrafts[g.id] || ''}
                            onChange={e => setReplyDrafts(prev => ({...prev, [g.id]: e.target.value}))}
                          />
                          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                            {g.status === 'pending' && (
                              <button className="btn-approve" style={{maxWidth:'160px'}} onClick={() => handleUpdateGrievance(g.id, 'in_progress')}>
                                🔧 Mark In Progress
                              </button>
                            )}
                            <button className="btn-approve" style={{maxWidth:'160px',background:'#10b981'}} onClick={() => handleUpdateGrievance(g.id, 'resolved')}>
                              ✅ Resolve
                            </button>
                            <button className="btn-reject" style={{maxWidth:'160px'}} onClick={() => handleUpdateGrievance(g.id, 'rejected')}>
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TIMETABLE TAB ──────────────────────────────────── */}
        {activeTab === 'timetable' && (
          <div className="tab-content">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <h2 style={{margin:0}}>🗓️ Timetable Manager</h2>
              <button className="btn-approve" style={{maxWidth:'200px'}}
                onClick={() => { resetTtForm(); setShowTtForm(f => !f); }}>
                {showTtForm ? '✕ Cancel' : '➕ Add Class'}
              </button>
            </div>

            {/* Create / Edit Form */}
            {showTtForm && (
              <div style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'14px',padding:'22px',marginBottom:'24px'}}>
                <h3 style={{margin:'0 0 16px',color:'var(--text-primary)'}}>{editingTtId ? '✏️ Edit Class' : '➕ New Class Entry'}</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                  <div className="form-group">
                    <label>Day of Week *</label>
                    <select className="form-input" value={ttForm.day_of_week} onChange={e=>setTtForm(f=>({...f,day_of_week:e.target.value}))}>
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Time Slot *</label>
                    <select className="form-input" value={ttForm.time_slot_id} onChange={e=>setTtForm(f=>({...f,time_slot_id:e.target.value}))}>
                      <option value="">Select time slot...</option>
                      {timeSlots.map(s => <option key={s.id} value={s.id}>{s.slot_name || `${s.start_time} - ${s.end_time}`}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{gridColumn:'span 2'}}>
                    <label>Subject Name *</label>
                    <input className="form-input" placeholder="e.g. Data Structures" value={ttForm.subject_name}
                      onChange={e=>setTtForm(f=>({...f,subject_name:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Faculty</label>
                    <select className="form-input" value={ttForm.faculty_id} onChange={e=>setTtForm(f=>({...f,faculty_id:e.target.value}))}>
                      <option value="">TBA / Unassigned</option>
                      {facultyList.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Room</label>
                    <select className="form-input" value={ttForm.room_id} onChange={e=>setTtForm(f=>({...f,room_id:e.target.value}))}>
                      <option value="">TBA</option>
                      {allRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Program *</label>
                    <input className="form-input" placeholder="e.g. B.Tech CSE" value={ttForm.program}
                      onChange={e=>setTtForm(f=>({...f,program:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Batch Year *</label>
                    <input className="form-input" placeholder="e.g. 2023-27" value={ttForm.batch_year}
                      onChange={e=>setTtForm(f=>({...f,batch_year:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Section *</label>
                    <input className="form-input" placeholder="e.g. A" value={ttForm.section}
                      onChange={e=>setTtForm(f=>({...f,section:e.target.value}))} />
                  </div>
                </div>
                <button className="btn-approve" style={{maxWidth:'220px'}} onClick={handleSaveTimetableEntry}>
                  {editingTtId ? '💾 Save Changes' : '🚀 Create Entry'}
                </button>
              </div>
            )}

            {/* Filters */}
            <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
              <select className="form-input" style={{maxWidth:'200px'}} value={ttFilters.program}
                onChange={e=>setTtFilters(f=>({...f,program:e.target.value}))}>
                <option value="">All Programs</option>
                {ttFilterOptions.programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className="form-input" style={{maxWidth:'200px'}} value={ttFilters.batch_year}
                onChange={e=>setTtFilters(f=>({...f,batch_year:e.target.value}))}>
                <option value="">All Batches</option>
                {ttFilterOptions.batch_years.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className="form-input" style={{maxWidth:'200px'}} value={ttFilters.section}
                onChange={e=>setTtFilters(f=>({...f,section:e.target.value}))}>
                <option value="">All Sections</option>
                {ttFilterOptions.sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Entries List grouped by day */}
            {timetableEntries.length === 0 ? (
              <p className="empty-state">No timetable entries yet. Click "➕ Add Class" to create one. ✨</p>
            ) : (
              ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => {
                const dayEntries = timetableEntries.filter(e => e.day_of_week === day);
                if (dayEntries.length === 0) return null;
                return (
                  <div key={day} style={{marginBottom:'22px'}}>
                    <h3 style={{fontSize:'14px',color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px'}}>{day}</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                      {dayEntries.map(e => (
                        <div key={e.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'12px',padding:'14px 18px',gap:'12px',flexWrap:'wrap'}}>
                          <div style={{flex:1,minWidth:'220px'}}>
                            <p style={{margin:'0 0 4px',fontWeight:700,color:'var(--text-primary)',fontSize:'14px'}}>{e.subject_name}</p>
                            <p style={{margin:0,fontSize:'12px',color:'var(--text-secondary)'}}>
                              ⏰ {e.time_slot} · 🏛️ {e.room_name} · 👨‍🏫 {e.faculty_name} · 🎓 {e.program} ({e.batch_year}, Sec {e.section})
                            </p>
                          </div>
                          <div style={{display:'flex',gap:'8px'}}>
                            <button className="btn-approve" style={{maxWidth:'90px',padding:'6px 12px',fontSize:'12px'}} onClick={() => handleEditTimetableEntry(e)}>✏️ Edit</button>
                            <button className="btn-reject" style={{maxWidth:'90px',padding:'6px 12px',fontSize:'12px'}} onClick={() => handleDeleteTimetableEntry(e.id)}>🗑️ Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── FACILITY BOOKINGS TAB ──────────────────────────── */}
        {activeTab === 'facilitybookings' && (
          <div className="tab-content">
            <h2>🏋️ Sports & Library Bookings</h2>
            <p style={{margin:'0 0 20px',fontSize:'14px',color:'var(--text-secondary)'}}>
              Live view of all student self-bookings for sports facilities and library seats.
            </p>

            {/* Stat summary */}
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'20px'}}>
              {[
                {label:'Total Bookings', value: facilityBookings.length, color:'#3b82f6'},
                {label:'Sports', value: facilityBookings.filter(b=>b.room_type==='Sports Facility').length, color:'#10b981'},
                {label:'Library', value: facilityBookings.filter(b=>b.room_type==='Library Seat').length, color:'#8b5cf6'},
              ].map(s => (
                <div key={s.label} style={{flex:'1',minWidth:'140px',background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'10px',padding:'14px',textAlign:'center',borderTop:`3px solid ${s.color}`}}>
                  <p style={{margin:0,fontSize:'22px',fontWeight:800,color:s.color}}>{s.value}</p>
                  <p style={{margin:'2px 0 0',fontSize:'11px',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:600}}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
              <select className="form-input" style={{maxWidth:'200px'}} value={fbTypeFilter} onChange={e=>setFbTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="Sports Facility">🏋️ Sports Facility</option>
                <option value="Library Seat">📚 Library Seat</option>
              </select>
              <input type="date" className="form-input" style={{maxWidth:'200px'}} value={fbDateFilter}
                onChange={e=>setFbDateFilter(e.target.value)} />
              {(fbTypeFilter || fbDateFilter) && (
                <button className="btn-reject" style={{maxWidth:'100px'}} onClick={() => { setFbTypeFilter(''); setFbDateFilter(''); }}>
                  ✕ Clear
                </button>
              )}
            </div>

            {/* List */}
            {facilityBookings.length === 0 ? (
              <p className="empty-state">No facility bookings match the current filters. ✨</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {facilityBookings.map(b => (
                  <div key={b.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'12px',padding:'14px 18px',gap:'12px',flexWrap:'wrap'}}>
                    <div style={{flex:1,minWidth:'220px'}}>
                      <p style={{margin:'0 0 4px',fontWeight:700,color:'var(--text-primary)',fontSize:'14px'}}>
                        {b.room_type === 'Sports Facility' ? '🏋️' : '📚'} {b.room_name}
                      </p>
                      <p style={{margin:0,fontSize:'12px',color:'var(--text-secondary)'}}>
                        👤 {b.student_name} ({b.student_email}) · 📅 {b.date} · ⏰ {b.slot_name}
                      </p>
                    </div>
                    <span style={{fontSize:'11px',color:'var(--text-tertiary)'}}>Booked {b.created_at}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LOCKED ACCOUNTS / RESET PASSWORD TAB ──────────────── */}
        {activeTab === 'lockedaccounts' && (
          <div className="tab-content">
            <h2>🔒 Locked Accounts & Password Reset</h2>
            <p style={{margin:'0 0 20px',fontSize:'14px',color:'var(--text-secondary)'}}>
              Accounts get locked after 10 failed security-question attempts during password recovery.
              Reset their password below to unlock them.
            </p>

            {/* Locked accounts list */}
            <h3 style={{fontSize:'14px',color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'12px'}}>
              Currently Locked ({lockedAccounts.length})
            </h3>
            {lockedAccounts.length === 0 ? (
              <p className="empty-state" style={{marginBottom:'24px'}}>No locked accounts right now. ✨</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'24px'}}>
                {lockedAccounts.map(u => (
                  <div key={u.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg-primary)',border:'1px solid #ef4444',borderRadius:'12px',padding:'14px 18px',gap:'12px',flexWrap:'wrap'}}>
                    <div>
                      <p style={{margin:'0 0 4px',fontWeight:700,color:'var(--text-primary)',fontSize:'14px'}}>🔒 {u.full_name} ({u.role})</p>
                      <p style={{margin:0,fontSize:'12px',color:'var(--text-secondary)'}}>{u.email} · {u.failed_attempts} failed attempts</p>
                    </div>
                    <button className="btn-approve" style={{maxWidth:'180px'}} onClick={() => setResetEmail(u.email)}>
                      🔑 Reset This User
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Reset password form */}
            <h3 style={{fontSize:'14px',color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'12px'}}>
              Reset Any User's Password
            </h3>
            <form onSubmit={handleAdminResetPassword} style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'14px',padding:'22px',maxWidth:'480px'}}>
              {resetMessage && (
                <p style={{margin:'0 0 14px',fontSize:'13px',fontWeight:600,color: resetMessage.startsWith('✅') ? '#10b981' : '#ef4444'}}>
                  {resetMessage}
                </p>
              )}
              <div className="form-group">
                <label>User's Email</label>
                <input className="form-input" type="email" placeholder="student@campus.edu"
                  value={resetEmail} onChange={e=>setResetEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input className="form-input" type="password" placeholder="Set a new password"
                  value={resetNewPassword} onChange={e=>setResetNewPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input className="form-input" type="password" placeholder="Confirm new password"
                  value={resetConfirmPassword} onChange={e=>setResetConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-approve" disabled={resetLoading}>
                {resetLoading ? 'Resetting...' : '🔑 Reset Password & Unlock'}
              </button>
            </form>
          </div>
        )}

        {/* ── HOLIDAYS ─────────────────────────────────────────── */}
        {activeTab === 'holidays' && (
          <div className="tab-content">
            <h2>📅 Holidays & Non-Working Days</h2>
            <p style={{margin:'0 0 20px',fontSize:'14px',color:'var(--text-secondary)'}}>
              Sundays are a fixed weekly off by default. Add festival/break dates here — they're
              used to correctly calculate when each class's attendance window closes
              (it always extends to the next actual <strong>working</strong> day, skipping these dates).
            </p>

            <form onSubmit={handleAddHoliday} style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'14px',padding:'22px',maxWidth:'480px',marginBottom:'24px'}}>
              {holidayMsg && (
                <p style={{margin:'0 0 14px',fontSize:'13px',fontWeight:600,color: holidayMsg.startsWith('✅') ? '#10b981' : '#ef4444'}}>
                  {holidayMsg}
                </p>
              )}
              <div className="form-group">
                <label>Date</label>
                <input className="form-input" type="date"
                  value={newHolidayDate} onChange={e=>setNewHolidayDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Holiday Name</label>
                <input className="form-input" type="text" placeholder="e.g. Diwali Break"
                  value={newHolidayName} onChange={e=>setNewHolidayName(e.target.value)} required />
              </div>
              <button type="submit" className="btn-approve">➕ Add Holiday</button>
            </form>

            {holidays.length === 0 ? (
              <p className="empty-state">No holidays added yet.</p>
            ) : (
              <HolidayCalendar holidays={holidays} />
            )}

            {holidays.length > 0 && (
              <div style={{marginTop:'24px'}}>
                <h3 style={{fontSize:'14px',color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'12px'}}>
                  All Holidays ({holidays.length}) — click to remove
                </h3>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {holidays.map(h => (
                    <div key={h.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'12px',padding:'14px 18px',gap:'12px',flexWrap:'wrap'}}>
                      <div>
                        <p style={{margin:'0 0 4px',fontWeight:700,color:'var(--text-primary)',fontSize:'14px'}}>📅 {h.name}</p>
                        <p style={{margin:0,fontSize:'12px',color:'var(--text-secondary)'}}>{h.date}</p>
                      </div>
                      <button className="lf-btn-delete" onClick={() => handleDeleteHoliday(h.id)}>🗑 Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MY ACCOUNT ───────────────────────────────────────── */}
        {activeTab === 'myaccount' && (
          <div className="tab-content">
            <MyAccount />
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && (
          <div className="tab-content">
            <div className="list-header">
              <div>
                <h2 className="tab-page-title">⏳ Pending Approvals</h2>
                <p className="tab-page-sub">Review and act on faculty room booking requests</p>
              </div>
              {pendingRequests.length > 0 && (
                <span className="badge-pending">{pendingRequests.length} awaiting action</span>
              )}
            </div>
            {pendingRequests.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">✨</div>
                <p className="empty-state-title">All caught up!</p>
                <p className="empty-state-sub">No pending booking requests right now.</p>
              </div>
            ) : (
              <div className="requests-list">
                {pendingRequests.map(req => (
                  <div key={req.id} className={`request-card ${getConflictWarning(req) ? 'warning' : ''}`}>
                    <div className="request-header">
                      <div>
                        <h3>{req.class_name}</h3>
                        <p className="faculty-name">👨‍🏫 {req.faculty_name} ({req.faculty_email})</p>
                      </div>
                      {getConflictWarning(req) && (
                        <span className="conflict-badge">⚠️ Potential Conflict</span>
                      )}
                    </div>

                    <div className="request-details">
                      <div className="detail">
                        <span className="label">🏢 Room:</span>
                        <span>{req.room_name} (Capacity: {req.room_capacity})</span>
                      </div>
                      <div className="detail">
                        <span className="label">📅 Date:</span>
                        <span>{req.date}</span>
                      </div>
                      <div className="detail">
                        <span className="label">⏰ Time:</span>
                        <span>{req.time_slot}</span>
                      </div>
                      <div className="detail">
                        <span className="label">👥 Students:</span>
                        <span>{req.number_of_students}</span>
                      </div>
                      <div className="detail">
                        <span className="label">📝 Requested:</span>
                        <span>{new Date(req.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="request-actions">
                      <button
                        className="btn-approve"
                        onClick={() => {
                          setSelectedRequest(req);
                          setApprovalModal('approve');
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => {
                          setSelectedRequest(req);
                          setApprovalModal('reject');
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approved Bookings Tab */}
        {activeTab === 'approved' && (
          <div className="tab-content">
            <h2 className="tab-page-title">✅ Approved Bookings</h2>
            <p className="tab-page-sub">All confirmed room bookings across faculty</p>
            {allBookings.length === 0 ? (
              <p className="empty-state">No approved bookings yet.</p>
            ) : (
              <div className="bookings-list">
                {allBookings.map(booking => (
                  <div key={booking.id} className="booking-card approved">
                    <div className="booking-header">
                      <div>
                        <h3>{booking.class_name}</h3>
                        <p className="faculty-info">👨‍🏫 {booking.faculty_name}</p>
                      </div>
                      <span className="status-badge status-active">Active</span>
                    </div>
                    <div className="booking-details">
                      <div className="detail">
                        <span className="label">🏢 Room:</span>
                        <span>{booking.room_name}</span>
                      </div>
                      <div className="detail">
                        <span className="label">📅 Date:</span>
                        <span>{booking.date}</span>
                      </div>
                      <div className="detail">
                        <span className="label">⏰ Time:</span>
                        <span>{booking.time_slot}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Status:</span>
                        <span>{booking.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="tab-content">
            <h2>Room Booking Calendar</h2>
            <div className="calendar-view">
              <p className="info">📊 All approved bookings:</p>
              {allBookings.length === 0 ? (
                <p className="empty-state">No bookings scheduled.</p>
              ) : (
                <div className="calendar-grid">
                  {allBookings.map(booking => (
                    <div key={booking.id} className="calendar-entry">
                      <strong>{booking.date}</strong>
                      <p>{booking.time_slot}</p>
                      <p className="room-name">{booking.room_name}</p>
                      <p className="class-name">{booking.class_name}</p>
                      <small>{booking.faculty_name}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'geofence' && (
        <div className="tab-content">
          <h2>📍 GPS Attendance & Campus Config</h2>

          {/* Campus Config */}
          <div className="request-card" style={{marginBottom:'24px'}}>
            <h3 style={{margin:'0 0 16px',color:'var(--text-primary)'}}>🏛️ Campus Location Settings</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
              {[['Campus Name','name','text'],['Latitude','latitude','number'],['Longitude','longitude','number'],['Radius (metres)','radius_m','number']].map(([label,key,type]) => (
                <div key={key} className="form-group">
                  <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>{label}</label>
                  <input type={type} className="form-input" value={campusConfig[key] || ''}
                    onChange={e => setCampusConfig(c => ({...c, [key]: e.target.value}))} />
                </div>
              ))}
            </div>
            <button className="btn-approve" style={{maxWidth:'200px'}}
              disabled={configSaving}
              onClick={async () => {
                setConfigSaving(true);
                try {
                  await api.post('/api/admin/campus-config', campusConfig);
                  setMessage({type:'success', text:'Campus location updated!'});
                } catch { setMessage({type:'error', text:'Failed to update'}); }
                setConfigSaving(false);
              }}>
              {configSaving ? 'Saving...' : '💾 Save Location'}
            </button>
          </div>

          {/* Geofence Logs */}
          <h3 style={{margin:'0 0 14px',color:'var(--text-primary)'}}>📋 Recent Check-In Logs</h3>
          {geofenceLogs.length === 0 ? (
            <p className="empty-state">No GPS check-ins yet.</p>
          ) : (
            <div className="requests-list">
              {geofenceLogs.map(log => (
                <div key={log.id} className="request-card" style={{borderLeft:`4px solid ${log.is_within ? '#10b981' : '#ef4444'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
                    <div>
                      <p style={{margin:'0 0 4px',fontWeight:700,color:'var(--text-primary)'}}>{log.student}</p>
                      <p style={{margin:0,fontSize:'13px',color:'var(--text-secondary)'}}>
                        {log.override ? `✋ Manual override by ${log.override}` : `📡 GPS: ${log.distance_m}m from campus`}
                      </p>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <span style={{padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:700,
                        background: log.is_within ? '#052e1a' : '#2d0a0a',
                        color: log.is_within ? '#6ee7b7' : '#fca5a5'}}>
                        {log.is_within ? '✅ On Campus' : '❌ Off Campus'}
                      </span>
                      <p style={{margin:'6px 0 0',fontSize:'11px',color:'var(--text-tertiary)'}}>{log.created_at}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE ROOMS TAB ─────────────────────────────── */}
      {activeTab === 'rooms' && (() => {
        const ACADEMIC_TYPES = ['Classroom','Lab','Seminar Hall','Study Room','Auditorium','Conference Room'];
        const FACILITY_TYPES_LIST = ['Sports Facility','Library Seat'];
        const ROOM_TYPES = [...ACADEMIC_TYPES, ...FACILITY_TYPES_LIST];
        const isFacility = FACILITY_TYPES_LIST.includes(roomForm.room_type);
        const handleSaveRoom = async () => {
          setRoomSaving(true);
          try {
            if (editingRoom) {
              await api.put(`/api/admin/rooms/${editingRoom}`, roomForm);
              setMessage({type:'success', text:'Room updated!'});
            } else {
              await api.post('/api/admin/rooms', roomForm);
              setMessage({type:'success', text:'Room created!'});
            }
            setRoomForm({name:'',room_type:'Classroom',building:'',floor:1,capacity:30});
            setEditingRoom(null);
            await loadData();
          } catch { setMessage({type:'error', text:'Failed to save room'}); }
          setRoomSaving(false);
        };
        const handleDeleteRoom = async (id) => {
          if (!window.confirm('Delete this room? This cannot be undone.')) return;
          try {
            await api.delete(`/api/admin/rooms/${id}`);
            setMessage({type:'success', text:'Room deleted'});
            await loadData();
          } catch { setMessage({type:'error', text:'Failed to delete room'}); }
        };
        const handleEditRoom = (room) => {
          setEditingRoom(room.id);
          setRoomForm({name:room.name, room_type:room.room_type, building:room.building, floor:room.floor, capacity:room.capacity});
        };
        return (
          <div className="tab-content">
            <h2 className="tab-page-title">🏛️ Manage Rooms</h2>
            <p className="tab-page-sub">Add facilities and academic spaces for booking</p>

            {/* Add / Edit form */}
            <div className="request-card" style={{marginBottom:'24px', borderLeft:`4px solid ${editingRoom ? '#f59e0b' : '#10b981'}`}}>
              <h3 style={{margin:'0 0 16px', color:'var(--text-primary)'}}>
                {editingRoom ? '✏️ Edit Room' : '➕ Add New Room'}
              </h3>

              {/* Category toggle: Classroom vs Facility */}
              <div style={{display:'flex', gap:'8px', marginBottom:'18px'}}>
                <button
                  type="button"
                  onClick={() => setRoomForm(f => ({...f, room_type:'Classroom'}))}
                  style={{
                    flex:1, padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'13px',
                    border: !isFacility ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                    background: !isFacility ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: !isFacility ? '#3b82f6' : 'var(--text-secondary)',
                  }}>
                  🏫 Classroom / Academic Space
                </button>
                <button
                  type="button"
                  onClick={() => setRoomForm(f => ({...f, room_type:'Sports Facility'}))}
                  style={{
                    flex:1, padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'13px',
                    border: isFacility ? '2px solid #10b981' : '1px solid var(--border-color)',
                    background: isFacility ? 'rgba(16,185,129,0.12)' : 'transparent',
                    color: isFacility ? '#10b981' : 'var(--text-secondary)',
                  }}>
                  🏆 Sports & Library Facility
                </button>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px'}}>
                <div className="form-group">
                  <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>
                    {isFacility ? 'Facility Name *' : 'Room Name *'}
                  </label>
                  <input type="text" className="form-input"
                    placeholder={isFacility ? 'e.g. Basketball Court 1' : 'e.g. Class A101'}
                    value={roomForm.name} onChange={e => setRoomForm(f=>({...f,name:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>
                    {isFacility ? 'Location *' : 'Building *'}
                  </label>
                  <input type="text" className="form-input"
                    placeholder={isFacility ? 'e.g. Sports Complex' : 'e.g. Building A'}
                    value={roomForm.building} onChange={e => setRoomForm(f=>({...f,building:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>
                    {isFacility ? 'Facility Type' : 'Room Type'}
                  </label>
                  <select className="form-input" value={roomForm.room_type} onChange={e => setRoomForm(f=>({...f,room_type:e.target.value}))}>
                    {(isFacility ? FACILITY_TYPES_LIST : ACADEMIC_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>
                    {isFacility ? 'Capacity (people)' : 'Capacity (seats)'}
                  </label>
                  <input type="number" className="form-input" min="1" max="500"
                    value={roomForm.capacity} onChange={e => setRoomForm(f=>({...f,capacity:parseInt(e.target.value)||1}))} />
                </div>
                {!isFacility && (
                  <div className="form-group">
                    <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>Floor</label>
                    <input type="number" className="form-input" min="0" max="20"
                      value={roomForm.floor} onChange={e => setRoomForm(f=>({...f,floor:parseInt(e.target.value)||0}))} />
                  </div>
                )}
              </div>
              <div style={{display:'flex', gap:'10px'}}>
                <button className="btn-approve" style={{maxWidth:'180px'}} disabled={roomSaving} onClick={handleSaveRoom}>
                  {roomSaving ? 'Saving...' : editingRoom ? '💾 Update Room' : '➕ Create Room'}
                </button>
                {editingRoom && (
                  <button className="btn-cancel" onClick={() => { setEditingRoom(null); setRoomForm({name:'',room_type:'Classroom',building:'',floor:1,capacity:30}); }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Rooms list */}
            <h3 className="section-divider">All Rooms ({allRooms.length})</h3>
            {allRooms.length === 0 ? (
              <p className="empty-state">No rooms yet. Add your first room above!</p>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'14px'}}>
                {allRooms.map(room => (
                  <div key={room.id} className="request-card" style={{margin:0}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                      <div>
                        <p style={{margin:'0 0 4px', fontWeight:700, fontSize:'16px', color:'var(--text-primary)'}}>{room.name}</p>
                        <p style={{margin:0, fontSize:'13px', color:'var(--text-secondary)'}}>{room.room_type} · {room.building}</p>
                      </div>
                      <span style={{padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700,
                        background: room.current_occupancy > 0 ? '#052e1a' : 'var(--bg-tertiary)',
                        color: room.current_occupancy > 0 ? '#6ee7b7' : 'var(--text-secondary)'}}>
                        {room.current_occupancy > 0 ? `${room.current_occupancy} occupied` : 'Available'}
                      </span>
                    </div>
                    <div style={{display:'flex', gap:'16px', fontSize:'13px', color:'var(--text-secondary)', marginBottom:'14px'}}>
                      <span>🏢 Floor {room.floor}</span>
                      <span>👥 {room.capacity} seats</span>
                    </div>
                    <div style={{display:'flex', gap:'8px', paddingTop:'12px', borderTop:'1px solid var(--border-color)'}}>
                      <button className="btn-approve" style={{flex:1, padding:'8px'}}
                        onClick={() => handleEditRoom(room)}>✏️ Edit</button>
                      <button className="btn-reject" style={{flex:1, padding:'8px'}}
                        onClick={() => handleDeleteRoom(room.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── NOTIFICATIONS TAB ────────────────────────────────── */}
      {activeTab === 'notifications' && (() => {
        const TYPE_OPTS = [{v:'info',l:'📢 Announcement'},{v:'event',l:'🎉 Event'},{v:'warning',l:'⚠️ Warning'},{v:'urgent',l:'🚨 Urgent'}];
        const ROLE_OPTS = [{v:'all',l:'Everyone'},{v:'student',l:'Students only'},{v:'faculty',l:'Faculty only'}];
        const TYPE_COLORS = {info:'#3b82f6',event:'#10b981',warning:'#f59e0b',urgent:'#ef4444'};
        return (
          <div className="tab-content">
            <h2>🔔 Send Notifications</h2>

            {/* Create form */}
            <div className="request-card" style={{marginBottom:'24px'}}>
              <h3 style={{margin:'0 0 16px',color:'var(--text-primary)'}}>📤 New Notification</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                <div className="form-group" style={{gridColumn:'span 2'}}>
                  <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>Title *</label>
                  <input className="form-input" placeholder="e.g. Campus Maintenance Alert"
                    value={notifForm.title} onChange={e => setNotifForm(f=>({...f,title:e.target.value}))} />
                </div>
                <div className="form-group" style={{gridColumn:'span 2'}}>
                  <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>Message *</label>
                  <textarea className="form-textarea" rows={3} placeholder="Notification details..."
                    value={notifForm.message} onChange={e => setNotifForm(f=>({...f,message:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>Type</label>
                  <select className="form-input" value={notifForm.notif_type} onChange={e => setNotifForm(f=>({...f,notif_type:e.target.value}))}>
                    {TYPE_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase'}}>Send To</label>
                  <select className="form-input" value={notifForm.target_role} onChange={e => setNotifForm(f=>({...f,target_role:e.target.value}))}>
                    {ROLE_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn-approve" style={{maxWidth:'200px'}} disabled={notifSending}
                onClick={async () => {
                  if (!notifForm.title.trim() || !notifForm.message.trim()) return setMessage({type:'error',text:'Title and message required'});
                  setNotifSending(true);
                  try {
                    await api.post('/api/admin/notifications', notifForm);
                    setMessage({type:'success',text:'Notification sent to all users!'});
                    setNotifForm({title:'',message:'',notif_type:'info',target_role:'all'});
                    await loadData();
                  } catch { setMessage({type:'error',text:'Failed to send'}); }
                  setNotifSending(false);
                }}>
                {notifSending ? 'Sending...' : '📤 Send Notification'}
              </button>
            </div>

            {/* Sent notifications list */}
            <h3 style={{margin:'0 0 14px',color:'var(--text-primary)'}}>📋 Sent Notifications</h3>
            {allNotifs.length === 0 ? <p className="empty-state">No notifications sent yet.</p> : (
              <div className="requests-list">
                {allNotifs.map(n => (
                  <div key={n.id} className="request-card" style={{borderLeft:`4px solid ${TYPE_COLORS[n.notif_type]||'#3b82f6'}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'8px'}}>
                      <div>
                        <p style={{margin:'0 0 4px',fontWeight:700,color:'var(--text-primary)',fontSize:'15px'}}>{n.title}</p>
                        <p style={{margin:'0 0 8px',fontSize:'13px',color:'var(--text-secondary)'}}>{n.message}</p>
                        <p style={{margin:0,fontSize:'12px',color:'var(--text-tertiary)'}}>
                          👥 {n.target_role === 'all' ? 'Everyone' : n.target_role} · 👁 {n.read_count} read · {n.created_at}
                        </p>
                      </div>
                      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                        <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:700,
                          color:TYPE_COLORS[n.notif_type],background:'var(--bg-tertiary)',border:`1px solid ${TYPE_COLORS[n.notif_type]}`}}>
                          {TYPE_OPTS.find(t=>t.v===n.notif_type)?.l || n.notif_type}
                        </span>
                        <button className="btn-reject" style={{padding:'6px 12px',fontSize:'12px'}}
                          onClick={async () => {
                            await api.delete(`/api/admin/notifications/${n.id}`);
                            await loadData();
                          }}>🗑 Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── ROOMS MANAGEMENT TAB ─────────────────────────────── */}
      {/* ── FEEDBACK TAB ──────────────────────────────────────── */}
      {activeTab === 'feedback' && (() => {
        const TYPE_LABELS = {
          room_condition:'🏛️ Room Condition', booking_process:'📅 Booking Process',
          faculty_experience:'👨‍🏫 Faculty Experience', technical_issue:'💻 Technical Issue',
          general_suggestion:'💡 General Suggestion'
        };
        const STAR_COLOR = { 1:'#ef4444',2:'#f97316',3:'#f59e0b',4:'#22c55e',5:'#10b981' };
        const avg = allFeedback.length ? (allFeedback.reduce((s,f)=>s+f.rating,0)/allFeedback.length).toFixed(1) : 0;
        const filtered = feedbackFilter === 'all' ? allFeedback : allFeedback.filter(f=>f.feedback_type===feedbackFilter);
        return (
          <div className="tab-content">
            <h2>📝 Student Feedback</h2>

            {/* Summary cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'12px',marginBottom:'24px'}}>
              {[
                {label:'Total', value:allFeedback.length, color:'#3b82f6'},
                {label:'Avg Rating', value:`⭐ ${avg}`, color:'#f59e0b'},
                {label:'Anonymous', value:allFeedback.filter(f=>f.is_anonymous).length, color:'#8b5cf6'},
              ].map(s => (
                <div key={s.label} style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'10px',padding:'16px',textAlign:'center'}}>
                  <p style={{fontSize:'1.6rem',fontWeight:700,color:s.color,margin:0}}>{s.value}</p>
                  <p style={{fontSize:'12px',color:'var(--text-secondary)',margin:'4px 0 0'}}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}>
              {['all','room_condition','booking_process','faculty_experience','technical_issue','general_suggestion'].map(f => (
                <button key={f} onClick={()=>setFeedbackFilter(f)}
                  style={{padding:'7px 14px',borderRadius:'20px',border:'1.5px solid',fontSize:'12px',fontWeight:600,cursor:'pointer',
                    background: feedbackFilter===f ? '#3b82f6' : 'var(--bg-tertiary)',
                    color: feedbackFilter===f ? '#fff' : 'var(--text-secondary)',
                    borderColor: feedbackFilter===f ? '#3b82f6' : 'var(--border-color)'}}>
                  {f === 'all' ? 'All Types' : TYPE_LABELS[f]}
                </button>
              ))}
            </div>

            {/* Feedback list */}
            {filtered.length === 0 ? (
              <p className="empty-state">No feedback yet. ✨</p>
            ) : (
              <div className="requests-list">
                {filtered.map(fb => (
                  <div key={fb.id} className="request-card">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'10px'}}>
                      <div>
                        <span style={{fontSize:'13px',fontWeight:700,color:'var(--text-secondary)',background:'var(--bg-tertiary)',padding:'4px 10px',borderRadius:'20px'}}>
                          {TYPE_LABELS[fb.feedback_type] || fb.feedback_type}
                        </span>
                        <p style={{margin:'10px 0 4px',fontWeight:600,color:'var(--text-primary)'}}>
                          {fb.is_anonymous ? '🕵️ Anonymous' : `👤 ${fb.student_name}`}
                          {!fb.is_anonymous && fb.student_email && <span style={{fontWeight:400,color:'var(--text-secondary)',fontSize:'13px'}}> · {fb.student_email}</span>}
                        </p>
                        <p style={{margin:0,fontSize:'14px',color:'var(--text-secondary)',lineHeight:1.5}}>"{fb.comment}"</p>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:'22px',letterSpacing:'-2px'}}>
                          {'★'.repeat(fb.rating)}{'☆'.repeat(5-fb.rating)}
                        </div>
                        <span style={{fontSize:'13px',fontWeight:700,color:STAR_COLOR[Math.round(fb.rating)]}}>{fb.rating}/5</span>
                        <p style={{margin:'6px 0 0',fontSize:'11px',color:'var(--text-tertiary)'}}>{fb.created_at}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── STUDENT APPROVALS TAB ────────────────────────────── */}
      {activeTab === 'students' && (
        <div className="tab-content">
          <h2>🎓 Student Account Approvals</h2>
          {pendingStudents.length === 0 ? (
            <p className="empty-state">No pending student accounts. ✨</p>
          ) : (
            <div className="requests-list">
              {pendingStudents.map(student => (
                <div key={student.id} className="request-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="request-header">
                    <div>
                      <h3>{student.full_name}</h3>
                      <p className="faculty-name">📧 {student.email}</p>
                      <p className="faculty-name">🏢 {student.department} &nbsp;|&nbsp; 🕐 Registered: {student.created_at}</p>
                    </div>
                    <span className="conflict-badge">⏳ Pending</span>
                  </div>
                  <div className="request-actions">
                    <button className="btn-approve" onClick={() => handleApproveStudent(student.id)}>
                      ✅ Approve — Allow Login
                    </button>
                    <button className="btn-reject" onClick={() => handleRejectStudent(student.id)}>
                      ❌ Reject — Delete Account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FACULTY APPROVALS TAB ─────────────────────────────── */}
      {activeTab === 'faculty' && (
        <div className="tab-content">
          <h2>👨‍🏫 Faculty Account Approvals</h2>
          {pendingFaculty.length === 0 ? (
            <p className="empty-state">No pending faculty accounts. ✨</p>
          ) : (
            <div className="requests-list">
              {pendingFaculty.map(faculty => (
                <div key={faculty.id} className="request-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="request-header">
                    <div>
                      <h3>{faculty.full_name}</h3>
                      <p className="faculty-name">📧 {faculty.email}</p>
                      <p className="faculty-name">🏢 {faculty.department} &nbsp;|&nbsp; 🕐 Registered: {faculty.created_at}</p>
                    </div>
                    <span className="conflict-badge">⏳ Pending</span>
                  </div>
                  <div className="request-actions">
                    <button className="btn-approve" onClick={() => handleApproveFaculty(faculty.id)}>
                      ✅ Approve — Allow Login
                    </button>
                    <button className="btn-reject" onClick={() => handleRejectFaculty(faculty.id)}>
                      ❌ Reject — Delete Account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setApprovalModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {approvalModal === 'approve' ? '✅ Approve Booking Request' : '❌ Reject Booking Request'}
            </h2>

            <div className="modal-info">
              <p><strong>Class:</strong> {selectedRequest.class_name}</p>
              <p><strong>Faculty:</strong> {selectedRequest.faculty_name}</p>
              <p><strong>Room:</strong> {selectedRequest.room_name}</p>
              <p><strong>Date & Time:</strong> {selectedRequest.date} at {selectedRequest.time_slot}</p>
            </div>

            <div className="modal-form">
              <label>
                {approvalModal === 'approve' ? 'Admin Notes (optional)' : 'Rejection Reason *'}
              </label>
              <textarea
                value={approvalModal === 'approve' ? approvalData.notes : approvalData.reason}
                onChange={(e) =>
                  setApprovalData(prev => ({
                    ...prev,
                    [approvalModal === 'approve' ? 'notes' : 'reason']: e.target.value
                  }))
                }
                placeholder={approvalModal === 'approve' ? 'Add any notes for the faculty...' : 'Explain why this request is being rejected...'}
                required={approvalModal === 'reject'}
                className="form-textarea"
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setApprovalModal(null);
                  setApprovalData({ notes: '', reason: '' });
                }}
              >
                Cancel
              </button>
              <button
                className={approvalModal === 'approve' ? 'btn-approve' : 'btn-reject'}
                onClick={() =>
                  approvalModal === 'approve'
                    ? handleApproveRequest(selectedRequest.id)
                    : handleRejectRequest(selectedRequest.id)
                }
                disabled={loading || (approvalModal === 'reject' && !approvalData.reason)}
              >
                {loading ? 'Processing...' : (approvalModal === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
