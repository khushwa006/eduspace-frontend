import { useState, useEffect } from 'react';
import './GeofenceCheckin.css';

const STATUS = { idle:'idle', loading:'loading', success:'success', error:'error', denied:'denied' };

export default function GeofenceCheckin({ bookingId, onSuccess }) {
  const [status, setStatus]       = useState(STATUS.idle);
  const [result, setResult]       = useState(null);
  const [campus, setCampus]       = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  const token = localStorage.getItem('jwt_token');

  useEffect(() => {
    fetch('https://eduspace-backend-bh29.onrender.com/api/campus-config', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(setCampus).catch(() => {});
  }, []);

  const handleCheckin = () => {
    if (!navigator.geolocation) {
      setStatus(STATUS.error);
      setResult({ message: 'Your browser does not support GPS. Please ask faculty for manual check-in.' });
      return;
    }
    setStatus(STATUS.loading);
    setResult(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ latitude, longitude });
        try {
          const res = await fetch('https://eduspace-backend-bh29.onrender.com/api/attendance/geofence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ latitude, longitude, booking_id: bookingId })
          });
          const data = await res.json();
          setResult(data);
          setStatus(data.is_within ? STATUS.success : STATUS.error);
          if (data.is_within && onSuccess) onSuccess(data);
        } catch {
          setStatus(STATUS.error);
          setResult({ message: 'Could not reach server. Check your connection.' });
        }
      },
      (err) => {
        setStatus(STATUS.denied);
        setResult({ message: err.code === 1
          ? 'Location permission denied. Please allow location access in your browser.'
          : 'Could not get your GPS location. Try again in the open.'
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getDistanceBar = () => {
    if (!result || !campus) return null;
    const pct = Math.min(100, (result.distance_m / (campus.radius_m * 2)) * 100);
    return pct;
  };

  return (
    <div className="gf-wrapper">
      {/* Campus info */}
      {campus && (
        <div className="gf-campus-info">
          <span className="gf-campus-icon">🏛️</span>
          <div>
            <p className="gf-campus-name">{campus.name}</p>
            <p className="gf-campus-meta">Check-in radius: {campus.radius_m}m</p>
          </div>
        </div>
      )}

      {/* Status display */}
      {status === STATUS.idle && (
        <div className="gf-idle">
          <div className="gf-pulse-ring">
            <span className="gf-pulse-dot">📍</span>
          </div>
          <p className="gf-idle-text">Ready to verify your location</p>
        </div>
      )}

      {status === STATUS.loading && (
        <div className="gf-loading">
          <div className="gf-spinner" />
          <p>Getting your GPS location...</p>
        </div>
      )}

      {status === STATUS.success && result && (
        <div className="gf-result gf-result--success">
          <div className="gf-result-icon">✅</div>
          <p className="gf-result-title">Attendance Marked!</p>
          <p className="gf-result-sub">You are {result.distance_m}m from campus centre</p>
          <div className="gf-dist-bar-wrap">
            <div className="gf-dist-bar">
              <div className="gf-dist-fill gf-dist-fill--ok" style={{width: `${getDistanceBar()}%`}} />
            </div>
            <span className="gf-dist-labels"><span>0m</span><span>{campus?.radius_m}m</span></span>
          </div>
        </div>
      )}

      {(status === STATUS.error || status === STATUS.denied) && result && (
        <div className="gf-result gf-result--error">
          <div className="gf-result-icon">{status === STATUS.denied ? '🚫' : '📍❌'}</div>
          <p className="gf-result-title">
            {status === STATUS.denied ? 'Location Denied' : 'Outside Campus'}
          </p>
          <p className="gf-result-sub">{result.message}</p>
          {result.distance_m > 0 && (
            <div className="gf-dist-bar-wrap">
              <div className="gf-dist-bar">
                <div className="gf-dist-fill gf-dist-fill--err" style={{width: `${getDistanceBar()}%`}} />
              </div>
              <span className="gf-dist-labels"><span>0m</span><span>{result.distance_m}m away</span></span>
            </div>
          )}
        </div>
      )}

      {/* Action button */}
      <button
        className={`gf-btn ${status === STATUS.loading ? 'gf-btn--loading' : ''} ${status === STATUS.success ? 'gf-btn--done' : ''}`}
        onClick={handleCheckin}
        disabled={status === STATUS.loading || status === STATUS.success}
      >
        {status === STATUS.loading ? '📡 Locating...'
          : status === STATUS.success ? '✅ Checked In'
          : status === STATUS.error || status === STATUS.denied ? '🔄 Try Again'
          : '📍 Check In with GPS'}
      </button>

      <p className="gf-note">
        Your GPS coordinates are only used to verify campus presence and are not stored permanently.
      </p>
    </div>
  );
}
