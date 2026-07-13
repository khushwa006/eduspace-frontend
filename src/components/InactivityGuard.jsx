import { useState, useEffect, useRef, useCallback } from 'react';
import './InactivityGuard.css';

const IDLE_LIMIT_MS    = 10 * 60 * 1000; // 10 minutes total
const WARNING_BEFORE_MS = 30 * 1000;     // show warning 30s before logout
const WARNING_AT_MS    = IDLE_LIMIT_MS - WARNING_BEFORE_MS;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export default function InactivityGuard({ active, onLogout }) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  const warningTimerRef  = useRef(null);
  const logoutTimerRef   = useRef(null);
  const countdownRef     = useRef(null);

  const clearAllTimers = useCallback(() => {
    clearTimeout(warningTimerRef.current);
    clearTimeout(logoutTimerRef.current);
    clearInterval(countdownRef.current);
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setSecondsLeft(30);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(30);
      countdownRef.current = setInterval(() => {
        setSecondsLeft(s => (s <= 1 ? 0 : s - 1));
      }, 1000);
    }, WARNING_AT_MS);

    logoutTimerRef.current = setTimeout(() => {
      clearAllTimers();
      onLogout();
    }, IDLE_LIMIT_MS);
  }, [clearAllTimers, onLogout]);

  const handleActivity = useCallback(() => {
    // Don't reset while the warning is showing — user must explicitly choose to stay
    if (showWarning) return;
    startTimers();
  }, [showWarning, startTimers]);

  useEffect(() => {
    if (!active) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    startTimers();
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, handleActivity));

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, handleActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const handleStayLoggedIn = () => {
    startTimers();
  };

  if (!active || !showWarning) return null;

  return (
    <div className="ig-overlay">
      <div className="ig-modal">
        <span className="ig-icon">⏳</span>
        <h3 className="ig-title">Still there?</h3>
        <p className="ig-message">
          You've been inactive for a while. For your security, you'll be
          logged out in <strong>{secondsLeft}s</strong>.
        </p>
        <div className="ig-progress-track">
          <div className="ig-progress-fill" style={{ width: `${(secondsLeft / 30) * 100}%` }} />
        </div>
        <div className="ig-actions">
          <button className="ig-btn-stay" onClick={handleStayLoggedIn}>
            ✅ Stay Logged In
          </button>
          <button className="ig-btn-logout" onClick={onLogout}>
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
