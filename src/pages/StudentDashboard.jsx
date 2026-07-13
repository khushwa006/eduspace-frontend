import { useState, useEffect } from 'react';
import { roomsAPI } from '../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './StudentDashboard.css';
import FeedbackForm from '../components/FeedbackForm';
import LostFound from '../components/LostFound';
import GeofenceCheckin from '../components/GeofenceCheckin';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';
import MyAttendance from '../components/MyAttendance';
import MyAccount from '../components/MyAccount';
import HolidayCalendar from '../components/HolidayCalendar';
import SkillSharing from '../components/SkillSharing';
import Grievance from '../components/Grievance';
import Timetable from '../components/Timetable';
import '../components/Timetable.css';
import FacilityBooking from '../components/FacilityBooking';
import '../components/FacilityBooking.css';
import '../components/Grievance.css';
import '../components/SkillSharing.css';
import '../components/MyAttendance.css';
import '../components/NotificationBell.css';
import '../components/GeofenceCheckin.css';
import '../components/LostFound.css';
import '../components/FeedbackForm.css';

export default function StudentDashboard({ onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLostFound, setShowLostFound] = useState(false);
  const [showGeofence, setShowGeofence] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showGrievance, setShowGrievance] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [showFacilityBooking, setShowFacilityBooking] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [geoChecking, setGeoChecking] = useState(false);  // checking GPS before scan
  const [geoStatus, setGeoStatus] = useState(null);        // null | 'allowed' | 'blocked' | 'denied'
  const [geoDistance, setGeoDistance] = useState(null);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email:         localStorage.getItem('userName') || 'student@campus.edu',
    first_name:    '',
    last_name:     '',
    phone:         '',
    department:    '',
    enrollment_no: '',
    program:       '',
    batch_year:    '',
    section:       '',
    bio:           '',
    profile_photo: '',
    two_fa_enabled: false,
    role:          localStorage.getItem('userRole') || 'Student'
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [show2faConfirm, setShow2faConfirm] = useState(false);
  const [twoFaPassword, setTwoFaPassword] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const userName = localStorage.getItem('userName') || 'Student';

  useEffect(() => {
    fetchRooms();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!showHolidays) return;
    setHolidaysLoading(true);
    fetch('http://localhost:5000/api/admin/holidays', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
    })
      .then(r => r.json())
      .then(data => setHolidays(Array.isArray(data) ? data : []))
      .catch(() => setHolidays([]))
      .finally(() => setHolidaysLoading(false));
  }, [showHolidays]);

  useEffect(() => {
    let scanner = null;
    if (currentPage === 'room-details' && scanning && !loading) {
      scanner = new Html5QrcodeScanner('qr-scanner-region', {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      });

      scanner.render(
        async (decodedText) => {
          setScanning(false);
          if (scanner) {
            scanner.clear().catch(err => console.error("Scanner clear error", err));
          }
          await handleQRVerify(decodedText);
        },
        (error) => {
          // Continuous video scanning frame drops can be completely bypassed safely
        }
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Scanner exit cleanup failed", err));
      }
    };
  }, [currentPage, scanning]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (err) {
      console.log('Could not fetch profile');
    }
  };

  const validatePhone = (phone) => {
    if (!phone) return '';  // phone is optional
    const digits = phone.replace(/\D/g, '');  // strip non-digits
    if (digits.length !== 10) return 'Phone number must be exactly 10 digits';
    if (!digits.startsWith('6') && !digits.startsWith('7') && !digits.startsWith('8') && !digits.startsWith('9'))
      return 'Enter a valid Indian mobile number (starts with 6, 7, 8 or 9)';
    return '';
  };

  const handleProfileUpdate = async () => {
    // Validate phone number
    setProfileError('');
    const rawPhone = (userProfile.phone || '').trim().replace(/[\s\-\(\)]/g, '');
    const digits = rawPhone.replace(/^\+91/, '').replace(/^0/, '');
    if (digits && !/^[6-9]\d{9}$/.test(digits)) {
      setProfileError('Phone number must be a valid 10-digit Indian mobile number (starts with 6-9).');
      return;
    }
    // Normalise — store just the 10 digits
    if (digits) setUserProfile(prev => ({ ...prev, phone: digits }));
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name:    userProfile.first_name,
          last_name:     userProfile.last_name,
          phone:         userProfile.phone,
          department:    userProfile.department,
          enrollment_no: userProfile.enrollment_no,
          program:       userProfile.program,
          batch_year:    userProfile.batch_year,
          section:       userProfile.section,
          bio:           userProfile.bio
        })
      });

      if (response.ok) {
        alert('✅ Profile updated successfully!');
        setEditingProfile(false);
        fetchUserProfile();
      } else {
        alert('❌ Failed to update profile');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('❌ Passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password
        })
      });

      if (response.ok) {
        alert('✅ Password changed successfully!');
        setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      } else {
        const data = await response.json();
        alert('❌ ' + (data.error || 'Failed to change password'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleToggle2FA = async (enable) => {
    if (!twoFaPassword.trim()) {
      setTwoFaError('Please enter your password to confirm');
      return;
    }
    setTwoFaLoading(true);
    setTwoFaError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('http://localhost:5000/api/auth/2fa/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: twoFaPassword, enable })
      });
      const data = await res.json();
      if (res.ok) {
        setUserProfile(prev => ({ ...prev, two_fa_enabled: enable }));
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

  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await roomsAPI.getAllRooms();
      setRooms(Array.isArray(data) ? data : (data.rooms || []));
    } catch (err) {
      setError('Failed to load rooms: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomDetails = async (roomId) => {
    setLoading(true);
    try {
      const data = await roomsAPI.getRoom(roomId);
      setRoomDetails(data);
      setSelectedRoom(roomId);
      setCurrentPage('room-details');
    } catch (err) {
      setError('Failed to load room details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyLocationThenScan = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoChecking(true);
    setGeoStatus(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const token = localStorage.getItem('jwt_token');
          const res = await fetch('http://localhost:5000/api/attendance/geofence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          });
          const data = await res.json();
          setGeoDistance(data.distance_m);
          if (data.is_within) {
            setGeoStatus('allowed');
            setScanning(true);  // ✅ open scanner only if on campus
          } else {
            setGeoStatus('blocked');  // ❌ block scanner
          }
        } catch {
          setGeoStatus('denied');
        }
        setGeoChecking(false);
      },
      () => {
        setGeoStatus('denied');
        setGeoChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckIn = async () => {
    try {
      await roomsAPI.checkIn(selectedRoom);
      alert('✅ Checked in successfully!');
      fetchRoomDetails(selectedRoom);
    } catch (err) {
      setError('Check-in failed: ' + err.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      await roomsAPI.checkOut(selectedRoom);
      alert('✅ Checked out successfully!');
      fetchRoomDetails(selectedRoom);
    } catch (err) {
      setError('Check-out failed: ' + err.message);
    }
  };

  const handleQRVerify = async (scannedTokenData) => {
    setLoading(true);
    setError('');
    try {
      const res = await roomsAPI.verifyQRCheckin(scannedTokenData);
      alert(res.msg || '✅ Verification complete! Presence captured.');
      fetchRoomDetails(selectedRoom);
    } catch (err) {
      setError(err.message || 'Scanning processing error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (data) => {
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setFeedbackSuccess('Thank you! Your feedback has been submitted.');
      setShowFeedback(false);
      setTimeout(() => setFeedbackSuccess(''), 5000);
    } catch (err) { alert(err.message); }
    finally { setFeedbackLoading(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('http://localhost:5000/api/auth/profile/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ photo: base64 })
      });
      if (res.ok) {
        setUserProfile(prev => ({ ...prev, profile_photo: base64 }));
      } else {
        const d = await res.json();
        alert(d.error || 'Upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    const token = localStorage.getItem('jwt_token');
    await fetch('http://localhost:5000/api/auth/profile/photo', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setUserProfile(prev => ({ ...prev, profile_photo: '' }));
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('userName');
    setUserProfileOpen(false);
    onLogout();
  };

  const getOccupancyStatus = (current, capacity) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 80) return { status: 'Full', color: '#ef4444', bgColor: '#fee2e2' };
    if (percentage >= 50) return { status: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' };
    return { status: 'Available', color: '#10b981', bgColor: '#ecfdf5' };
  };

  const getOccupancyPercentage = (current, capacity) => {
    return Math.round((current / capacity) * 100);
  };

  // MY ACCOUNT PAGE
  if (currentPage === 'my-account') {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><div className="logo">🏫</div><h1>EduSpace</h1></div>
          <div className="navbar-right">
            <ThemeToggle />
            <NotificationBell />
            <button onClick={() => setCurrentPage('dashboard')} className="btn-back">← Dashboard</button>
          </div>
        </nav>
        <div className="dashboard-content">
          <MyAccount />
        </div>
      </div>
    );
  }


  // DASHBOARD PAGE
  if (showFacilityBooking) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><span className="logo">🏫</span><h1>EduSpace</h1></div>
          <div className="navbar-right">
            <ThemeToggle />
            <NotificationBell />
            <button className="btn-back" onClick={() => setShowFacilityBooking(false)}>← Back</button>
          </div>
        </nav>
        <div className="dashboard-content">
          <FacilityBooking />
        </div>
      </div>
    );
  }

  if (showTimetable) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><span className="logo">🏫</span><h1>EduSpace</h1></div>
          <div className="navbar-right">
            <ThemeToggle />
            <NotificationBell />
            <button className="btn-back" onClick={() => setShowTimetable(false)}>← Back</button>
          </div>
        </nav>
        <div className="dashboard-content">
          <Timetable />
        </div>
      </div>
    );
  }

  if (showHolidays) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><span className="logo">🏫</span><h1>EduSpace</h1></div>
          <div className="navbar-right">
            <ThemeToggle />
            <NotificationBell />
            <button className="btn-back" onClick={() => setShowHolidays(false)}>← Back</button>
          </div>
        </nav>
        <div className="dashboard-content">
          <h2 style={{marginBottom:'8px',color:'var(--text-primary)'}}>📅 Holidays</h2>
          <p style={{color:'var(--text-secondary)',marginBottom:'24px',fontSize:'14px'}}>
            Sundays are a fixed weekly off. These dates are also non-working — your faculty's
            attendance windows automatically skip them too.
          </p>

          {holidaysLoading ? (
            <p>Loading...</p>
          ) : holidays.length === 0 ? (
            <p style={{color:'var(--text-secondary)'}}>No holidays have been added yet.</p>
          ) : (
            <HolidayCalendar holidays={holidays} />
          )}
        </div>
      </div>
    );
  }

  if (showGrievance) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><span className="logo">🏫</span><h1>EduSpace</h1></div>
          <div className="navbar-right">
            <ThemeToggle />
            <NotificationBell />
            <button className="btn-back" onClick={() => setShowGrievance(false)}>← Back</button>
          </div>
        </nav>
        <div className="dashboard-content">
          <Grievance />
        </div>
      </div>
    );
  }

  if (showSkills) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><span className="logo">🏫</span><h1>EduSpace</h1></div>
          <div className="navbar-right">
            <ThemeToggle />
            <NotificationBell />
            <button className="btn-back" onClick={() => setShowSkills(false)}>← Back</button>
          </div>
        </nav>
        <div className="dashboard-content">
          <SkillSharing />
        </div>
      </div>
    );
  }

  if (showAttendance) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><span className="logo">🏫</span><h1>EduSpace</h1></div>
          <div className="navbar-right">
            <ThemeToggle />
            <NotificationBell />
            <button className="btn-back" onClick={() => setShowAttendance(false)}>← Back</button>
          </div>
        </nav>
        <div className="dashboard-content">
          <MyAttendance onBack={() => setShowAttendance(false)} />
        </div>
      </div>
    );
  }

  if (showGeofence) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><span className="logo">🏫</span><h1>EduSpace</h1></div>
          <button className="btn-back" onClick={() => setShowGeofence(false)}>Back</button>
        </nav>
        <div className="dashboard-content">
          <h2 style={{marginBottom:'8px',color:'var(--text-primary)'}}>📍 GPS Attendance Check-In</h2>
          <p style={{color:'var(--text-secondary)',marginBottom:'24px',fontSize:'14px'}}>
            Your location is verified against the campus boundary. Make sure you are on campus before checking in.
          </p>
          <GeofenceCheckin onSuccess={() => setTimeout(() => setShowGeofence(false), 2000)} />
        </div>
      </div>
    );
  }

  if (showLostFound) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><span className="logo">🏫</span><h1>EduSpace</h1></div>
          <button className="btn-back" onClick={() => setShowLostFound(false)}>Back</button>
        </nav>
        <div className="dashboard-content">
          <LostFound onBack={() => setShowLostFound(false)} />
        </div>
      </div>
    );
  }

  if (showFeedback) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left"><span className="logo">🏫</span><h1>EduSpace</h1></div>
          <button className="btn-back" onClick={() => setShowFeedback(false)}>Back</button>
        </nav>
        <div className="dashboard-content">
          <FeedbackForm onSubmit={handleFeedbackSubmit} onCancel={() => setShowFeedback(false)} loading={feedbackLoading} />
        </div>
      </div>
    );
  }

  if (currentPage === 'dashboard') {
    const totalRooms = rooms.length;
    const totalOccupancy = rooms.reduce((sum, room) => sum + room.current_occupancy, 0);
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const avgOccupancy = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;
    const availableRooms = rooms.filter(r => getOccupancyStatus(r.current_occupancy, r.capacity).status === 'Available').length;

    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left">
            <div className="logo">🏫</div>
            <h1>EduSpace</h1>
          </div>
          <div className="navbar-right">
            <ThemeToggle />
            <NotificationBell />
            <div className="user-profile-container">
              <button 
                className="user-profile-btn"
                onClick={() => setUserProfileOpen(!userProfileOpen)}
              >
                <div className="avatar">
                    {userProfile.profile_photo
                      ? <img src={userProfile.profile_photo} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
                      : userName.charAt(0).toUpperCase()
                    }
                  </div>
                <div className="user-info">
                  <p className="user-name">{userName.split('@')[0]}</p>
                  <p className="user-status">Online</p>
                </div>
              </button>

              {userProfileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <p>{userProfile.email}</p>
                  </div>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setCurrentPage('my-account');
                      setUserProfileOpen(false);
                    }}
                  >
                    👤 My Account
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setEditingProfile(true);
                      setCurrentPage('my-account');
                      setUserProfileOpen(false);
                    }}
                  >
                    ✏️ Edit Profile
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setCurrentPage('my-account');
                      setUserProfileOpen(false);
                    }}
                  >
                    🔒 Change Password
                  </button>
                  <hr />
                  <button 
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    ↪ Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="dashboard-content">
          <div className="hero-section">
            <div className="hero-text">
              <h2>Welcome back, {userProfile.first_name || userName.split('@')[0]} 👋</h2>
              <p>Manage your campus spaces efficiently</p>
              <div className="hero-stats">
                <span className="hero-stat-chip">
                  🟢 {rooms.filter(r => getOccupancyStatus(r.current_occupancy, r.capacity).status === 'Available').length} rooms available
                </span>
                <span className="hero-stat-chip">
                  🏫 {rooms.length} total spaces
                </span>
                {userProfile.program && (
                  <span className="hero-stat-chip">🎓 {userProfile.program}</span>
                )}
              </div>
            </div>
            <div className="hero-actions">
              <button onClick={() => setCurrentPage('rooms')} className="btn btn-hero-primary">
                Explore Rooms
              </button>
              <button onClick={fetchRooms} className="btn btn-hero-secondary">
                Refresh
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {feedbackSuccess && (
            <div style={{background:'#052e1a',color:'#6ee7b7',border:'1px solid #065f46',borderRadius:'8px',padding:'12px 16px',marginBottom:'16px',fontWeight:600}}>
              {feedbackSuccess}
            </div>
          )}

          <div className="student-quick-actions">
            {[
              { cls:'sqa-rooms',      icon:'🚪', label:'Explore Rooms',    desc:'Find available spaces',       onClick:() => setCurrentPage('rooms') },
              { cls:'sqa-timetable',  icon:'🗓️', label:'My Timetable',     desc:'View your class schedule',    onClick:() => setShowTimetable(true) },
              { cls:'sqa-attendance', icon:'✅', label:'My Attendance',    desc:'Track your attendance',       onClick:() => setShowAttendance(true) },
              { cls:'sqa-geo',        icon:'📍', label:'GPS Check-In',     desc:'Check in with your location', onClick:() => setShowGeofence(true) },
              { cls:'sqa-facility',   icon:'🏋️', label:'Sports & Library', desc:'Book courts & library seats', onClick:() => setShowFacilityBooking(true) },
              { cls:'sqa-feedback',   icon:'📝', label:'Give Feedback',    desc:'Rate your experience',        onClick:() => setShowFeedback(true) },
              { cls:'sqa-skills',     icon:'🤝', label:'Skill Sharing',    desc:'Connect with peers',          onClick:() => setShowSkills(true) },
              { cls:'sqa-lost',       icon:'🔍', label:'Lost & Found',     desc:'Report or find items',        onClick:() => setShowLostFound(true) },
              { cls:'sqa-grievance',  icon:'📋', label:'Grievance',        desc:'Raise a complaint',           onClick:() => setShowGrievance(true) },
              { cls:'sqa-holidays',   icon:'📅', label:'Holidays',         desc:'Non-working days',            onClick:() => setShowHolidays(true) },
            ].map(({ cls, icon, label, desc, onClick }) => (
              <button key={label} className={`sqa-card ${cls}`} onClick={onClick}>
                <span className="sqa-icon">{icon}</span>
                <span className="sqa-label">{label}</span>
                <span className="sqa-desc">{desc}</span>
              </button>
            ))}
          </div>

          <div className="student-section">
            <div className="student-section-header">
              <h3 className="section-heading">Available Rooms Right Now</h3>
              <button className="sqs-refresh" onClick={fetchRooms}>↻ Refresh</button>
            </div>
            {loading ? (
              <div className="student-rooms-grid">
                {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{borderRadius:'14px'}} />)}
              </div>
            ) : rooms.filter(r => getOccupancyStatus(r.current_occupancy, r.capacity).status === 'Available').length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">🏫</div>
                <p className="empty-state-title">No rooms available right now</p>
                <p className="empty-state-sub">Check back shortly or explore all rooms to see occupancy.</p>
                <button className="btn btn-hero-primary" style={{margin:'0 auto'}} onClick={() => setCurrentPage('rooms')}>Explore All Rooms</button>
              </div>
            ) : (
            <div className="student-rooms-grid">
              {rooms.filter(r => getOccupancyStatus(r.current_occupancy, r.capacity).status === 'Available').slice(0, 4).map(room => (
                <div key={room.id} className="student-room-card" onClick={() => fetchRoomDetails(room.id)}>
                  <div className="src-top">
                    <span className="src-type">{room.room_type}</span>
                    <span className="src-badge src-available">Available</span>
                  </div>
                  <p className="src-name">{room.name}</p>
                  <div className="src-meta">
                    <span>{room.building}</span>
                    <span>{room.capacity} seats</span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  if (currentPage === 'rooms') {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left">
            <div className="logo">🏫</div>
            <h1>EduSpace</h1>
          </div>
          <div className="navbar-right">
            <button onClick={() => setCurrentPage('dashboard')} className="btn-back">← Dashboard</button>
          </div>
        </nav>

        <div className="dashboard-content">
          <div className="page-header">
            <h2>Available Rooms</h2>
            <p>Select a room to view details and check in</p>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {loading && <div className="loading-state">Loading rooms...</div>}

          <div className="rooms-container">
            {rooms.map((room) => {
              const occupancyStatus = getOccupancyStatus(room.current_occupancy, room.capacity);
              const occupancyPercent = getOccupancyPercentage(room.current_occupancy, room.capacity);

              return (
                <div key={room.id} className="room-item">
                  <div className="room-header-row">
                    <div className="room-title-section">
                      <h3>{room.name}</h3>
                      <span className="room-type">{room.type}</span>
                    </div>
                    <div 
                      className="status-badge"
                      style={{ 
                        backgroundColor: occupancyStatus.bgColor,
                        color: occupancyStatus.color
                      }}
                    >
                      {occupancyStatus.status}
                    </div>
                  </div>

                  <div className="room-details-row">
                    <div className="detail">
                      <span className="detail-icon">🏢</span>
                      <span>{room.building}</span>
                    </div>
                    <div className="detail">
                      <span className="detail-icon">📍</span>
                      <span>Floor {room.floor}</span>
                    </div>
                    <div className="detail">
                      <span className="detail-icon">👥</span>
                      <span>{room.capacity} capacity</span>
                    </div>
                  </div>

                  <div className="occupancy-section">
                    <div className="occupancy-bar-container">
                      <div className="occupancy-bar">
                        <div 
                          className="occupancy-fill"
                          style={{
                            width: `${occupancyPercent}%`,
                            backgroundColor: occupancyStatus.color
                          }}
                        ></div>
                      </div>
                      <span className="occupancy-text">
                        {room.current_occupancy}/{room.capacity} ({occupancyPercent}%)
                      </span>
                    </div>
                    <button 
                      onClick={() => fetchRoomDetails(room.id)}
                      className="btn btn-view-details"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ROOM DETAILS PAGE
  if (currentPage === 'room-details' && roomDetails) {
    const occupancyStatus = getOccupancyStatus(roomDetails.current_occupancy, roomDetails.capacity);
    const occupancyPercent = getOccupancyPercentage(roomDetails.current_occupancy, roomDetails.capacity);

    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-left">
            <div className="logo">🏫</div>
            <h1>EduSpace</h1>
          </div>
          <div className="navbar-right">
            <button onClick={() => { setCurrentPage('rooms'); setScanning(false); }} className="btn-back">← Back</button>
          </div>
        </nav>

        <div className="dashboard-content">
          <div className="detail-header">
            <h2>{roomDetails.name}</h2>
            <div 
              className="status-badge large"
              style={{ 
                backgroundColor: occupancyStatus.bgColor,
                color: occupancyStatus.color
              }}
            >
              {occupancyStatus.status}
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="detail-grid">
            <div className="detail-panel">
              <h3>Room Information</h3>
              <div className="detail-fields">
                <div className="field">
                  <label>Type</label>
                  <p>{roomDetails.type}</p>
                </div>
                <div className="field">
                  <label>Building</label>
                  <p>{roomDetails.building}</p>
                </div>
                <div className="field">
                  <label>Floor</label>
                  <p>{roomDetails.floor}</p>
                </div>
                <div className="field">
                  <label>Capacity</label>
                  <p>{roomDetails.capacity} people</p>
                </div>
              </div>
            </div>

            <div className="detail-panel">
              <h3>Occupancy Status</h3>
              <div className="occupancy-display">
                <div className="occupancy-main">
                  <p className="occupancy-current">{roomDetails.current_occupancy}</p>
                  <p className="occupancy-label">Currently Occupied</p>
                </div>
                <div className="occupancy-divider"></div>
                <div className="occupancy-available">
                  <p className="occupancy-available-count">
                    {roomDetails.available_seats || roomDetails.capacity - roomDetails.current_occupancy}
                  </p>
                  <p className="occupancy-label">Available Seats</p>
                </div>
              </div>

              <div className="occupancy-bar-large">
                <div 
                  className="occupancy-fill"
                  style={{
                    width: `${occupancyPercent}%`,
                    backgroundColor: occupancyStatus.color
                  }}
                ></div>
              </div>
              <p className="occupancy-percentage">{occupancyPercent}% Occupied</p>
            </div>

            <div className="detail-panel action-panel">
              <h3>Secure Identity Check-In</h3>
              <p className="panel-description">Scan the dynamic display barcode physically tracking inside this asset layout context.</p>
              
              {scanning ? (
                <div style={{ marginTop: '4px', width: '100%' }}>
                  <div style={{background:'#052e1a',border:'1px solid #065f46',borderRadius:'8px',padding:'8px 12px',marginBottom:'10px',fontSize:'12px',color:'#6ee7b7',fontWeight:600}}>
                    ✅ Location verified — you are on campus
                  </div>
                  <div id="qr-scanner-region" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>
                  <button
                    onClick={() => { setScanning(false); setGeoStatus(null); }}
                    className="btn btn-checkout"
                    style={{ marginTop: '12px', width: '100%' }}
                  >
                    Close Scanner
                  </button>
                </div>
              ) : (
                <div className="action-buttons-group">
                  {/* ── GEOFENCE STATUS MESSAGES ── */}
                  {geoStatus === 'blocked' && (
                    <div style={{background:'#2d0a0a',border:'1px solid #7f1d1d',borderRadius:'8px',padding:'12px',marginBottom:'10px',textAlign:'center'}}>
                      <p style={{color:'#fca5a5',fontWeight:700,margin:'0 0 4px',fontSize:'14px'}}>❌ Outside Campus</p>
                      <p style={{color:'#fca5a5',fontSize:'12px',margin:'0 0 8px'}}>You are {geoDistance}m from campus. Move closer to scan.</p>
                      <button onClick={() => setGeoStatus(null)} style={{fontSize:'11px',padding:'4px 12px',borderRadius:'6px',border:'1px solid #7f1d1d',background:'transparent',color:'#fca5a5',cursor:'pointer'}}>
                        Try Again
                      </button>
                    </div>
                  )}
                  {geoStatus === 'denied' && (
                    <div style={{background:'#2d1f00',border:'1px solid #78350f',borderRadius:'8px',padding:'12px',marginBottom:'10px',textAlign:'center'}}>
                      <p style={{color:'#fcd34d',fontWeight:700,margin:'0 0 4px',fontSize:'14px'}}>⚠️ Location Access Needed</p>
                      <p style={{color:'#fcd34d',fontSize:'12px',margin:'0 0 8px'}}>Allow location access in your browser to scan attendance QR.</p>
                      <button onClick={() => setGeoStatus(null)} style={{fontSize:'11px',padding:'4px 12px',borderRadius:'6px',border:'1px solid #78350f',background:'transparent',color:'#fcd34d',cursor:'pointer'}}>
                        Retry
                      </button>
                    </div>
                  )}

                  <button
                    onClick={verifyLocationThenScan}
                    className="btn btn-checkin"
                    disabled={geoChecking || loading}
                    style={{width:'100%'}}
                  >
                    {geoChecking ? (
                      <><span className="btn-icon">📡</span> Verifying Location...</>
                    ) : (
                      <><span className="btn-icon">📷</span> Scan Room QR Code</>
                    )}
                  </button>
                  {!geoChecking && (
                    <p style={{fontSize:'11px',color:'var(--text-tertiary)',textAlign:'center',margin:'6px 0 0'}}>
                      📍 GPS verification required before scanning
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
}