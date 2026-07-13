import { useState, useEffect } from 'react';
import './App.css';
import EduSpaceHomepage from './pages/EduSpaceHomepage';
import AuthPages from './pages/AuthPages';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InactivityGuard from './components/InactivityGuard';

// Marker key used to detect a real "new browser session" (tab/window closed & reopened)
// vs. a simple page refresh. sessionStorage survives refreshes but is wiped when the
// tab/window is closed — so its absence on load means the previous session truly ended.
const SESSION_MARKER = 'eduspace_session_active';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const hasLiveSession = sessionStorage.getItem(SESSION_MARKER);
    const storedRole = localStorage.getItem('userRole');

    if (storedRole && hasLiveSession) {
      // Same tab, just refreshed — keep the user logged in
      setUserRole(storedRole);
      setCurrentPage('dashboard');
    } else if (storedRole && !hasLiveSession) {
      // Tab/window was closed and reopened — force logout for security
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      setCurrentPage('home');
    }
  }, []);

  const handleGetStarted = () => setCurrentPage('auth');

  const handleLogin = (role) => {
    sessionStorage.setItem(SESSION_MARKER, '1');
    setUserRole(role);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    sessionStorage.removeItem(SESSION_MARKER);
    setUserRole('');
    setCurrentPage('home');
  };

  const isLoggedIn = currentPage === 'dashboard';

  return (
    <>
      <InactivityGuard active={isLoggedIn} onLogout={handleLogout} />

      {(() => {
        if (currentPage === 'home') return <EduSpaceHomepage onGetStarted={handleGetStarted} />;
        if (currentPage === 'auth') return <AuthPages onLogin={handleLogin} />;

        // ✅ Route to correct dashboard based on role
        if (currentPage === 'dashboard') {
          const role = userRole.toLowerCase();

          if (role === 'admin')   return <AdminDashboard   onLogout={handleLogout} />;
          if (role === 'faculty') return <FacultyDashboard onLogout={handleLogout} />;
          return                         <StudentDashboard  onLogout={handleLogout} />;
        }

        return <div>Loading...</div>;
      })()}
    </>
  );
}

export default App;
