import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './GeofenceCheckin.css';

const STATUS = { idle:'idle', loading:'loading', success:'success', error:'error', denied:'denied' };
const FACE_STATUS = {
  idle: 'idle',
  loadingModels: 'loading_models',
  noProfilePhoto: 'no_profile_photo',
  capturing: 'capturing',
  noFaceDetected: 'no_face_detected',
  matched: 'matched',
  noMatch: 'no_match',
  cameraDenied: 'camera_denied',
};

const MODEL_URL = '/models';
const MATCH_THRESHOLD = 0.6; // lower euclidean distance = more similar; 0.6 is face-api.js's standard cutoff

export default function GeofenceCheckin({ bookingId, onSuccess }) {
  const [status, setStatus]         = useState(STATUS.idle);
  const [result, setResult]         = useState(null);
  const [campus, setCampus]         = useState(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState(FACE_STATUS.idle);
  const [faceDistance, setFaceDistance] = useState(null);

  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const token = localStorage.getItem('jwt_token');

  useEffect(() => {
    fetch('https://eduspace-backend-bh29.onrender.com/api/campus-config', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(setCampus).catch(() => {});
  }, []);

  // Load face-api.js models once on mount
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (e) {
        console.error('Failed to load face-api models:', e);
      }
    })();
  }, []);

  // Get a face descriptor from the student's stored profile photo
  const getStoredProfileDescriptor = async () => {
    const res = await fetch('https://eduspace-backend-bh29.onrender.com/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profile = await res.json();
    if (!profile.profile_photo) {
      setFaceStatus(FACE_STATUS.noProfilePhoto);
      return null;
    }

    const img = await faceapi.fetchImage(profile.profile_photo);
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setFaceStatus(FACE_STATUS.noProfilePhoto); // profile photo has no detectable face
      return null;
    }
    return detection.descriptor;
  };

  // Capture a live frame from the webcam and get its face descriptor
  const captureLiveDescriptor = async () => {
    setFaceStatus(FACE_STATUS.capturing);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();

    // give the camera a moment to focus/expose before capturing
    await new Promise(r => setTimeout(r, 800));

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    stream.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    if (!detection) {
      setFaceStatus(FACE_STATUS.noFaceDetected);
      return null;
    }
    return detection.descriptor;
  };

  // Runs face verification; returns { verified, distance } or null if it couldn't be attempted
  const verifyFace = async () => {
    if (!modelsLoaded) {
      setFaceStatus(FACE_STATUS.loadingModels);
      return null;
    }
    try {
      const storedDescriptor = await getStoredProfileDescriptor();
      if (!storedDescriptor) return null;

      const liveDescriptor = await captureLiveDescriptor();
      if (!liveDescriptor) return null;

      const distance = faceapi.euclideanDistance(storedDescriptor, liveDescriptor);
      const verified = distance <= MATCH_THRESHOLD;
      setFaceDistance(distance);
      setFaceStatus(verified ? FACE_STATUS.matched : FACE_STATUS.noMatch);
      return { verified, distance };
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        setFaceStatus(FACE_STATUS.cameraDenied);
      } else {
        console.error('Face verification error:', e);
        setFaceStatus(FACE_STATUS.noFaceDetected);
      }
      return null;
    }
  };

  const handleCheckin = () => {
    if (!navigator.geolocation) {
      setStatus(STATUS.error);
      setResult({ message: 'Your browser does not support GPS. Please ask faculty for manual check-in.' });
      return;
    }
    setStatus(STATUS.loading);
    setResult(null);
    setFaceStatus(FACE_STATUS.idle);
    setFaceDistance(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        const faceResult = await verifyFace();
        // faceResult is null if face verification couldn't be attempted (no profile photo,
        // camera denied, no face detected) — we still proceed with GPS-only check-in,
        // it just won't count as fully verified.

        try {
          const res = await fetch('https://eduspace-backend-bh29.onrender.com/api/attendance/geofence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              latitude, longitude, booking_id: bookingId,
              face_verified: faceResult ? faceResult.verified : false,
              face_distance: faceResult ? faceResult.distance : null,
            })
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

  const faceStatusText = {
    [FACE_STATUS.idle]: null,
    [FACE_STATUS.loadingModels]: '⏳ Loading face verification...',
    [FACE_STATUS.noProfilePhoto]: '⚠️ No profile photo on file — add one in My Account to enable face verification.',
    [FACE_STATUS.capturing]: '📸 Verifying your identity...',
    [FACE_STATUS.noFaceDetected]: '⚠️ Could not detect a face — check-in proceeded on GPS only.',
    [FACE_STATUS.cameraDenied]: '🚫 Camera access denied — check-in proceeded on GPS only.',
    [FACE_STATUS.matched]: '✅ Identity verified',
    [FACE_STATUS.noMatch]: '⚠️ Face did not match your profile photo — flagged for faculty review.',
  }[faceStatus];

  return (
    <div className="gf-wrapper">
      {/* Hidden video element used only to grab a frame for face detection */}
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline />

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
          <p className="gf-idle-text">Ready to verify your location and identity</p>
        </div>
      )}

      {status === STATUS.loading && (
        <div className="gf-loading">
          <div className="gf-spinner" />
          <p>{faceStatusText || 'Getting your GPS location...'}</p>
        </div>
      )}

      {status === STATUS.success && result && (
        <div className="gf-result gf-result--success">
          <div className="gf-result-icon">✅</div>
          <p className="gf-result-title">
            {result.fully_verified ? 'Attendance Marked!' : 'Location Verified'}
          </p>
          <p className="gf-result-sub">You are {result.distance_m}m from campus centre</p>
          {faceStatusText && (
            <p className={`gf-face-note ${result.face_verified ? 'gf-face-note--ok' : 'gf-face-note--warn'}`}>
              {faceStatusText}
            </p>
          )}
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
        disabled={status === STATUS.loading || status === STATUS.success || !modelsLoaded}
      >
        {!modelsLoaded ? '⏳ Loading...'
          : status === STATUS.loading ? '📡 Verifying...'
          : status === STATUS.success ? '✅ Checked In'
          : status === STATUS.error || status === STATUS.denied ? '🔄 Try Again'
          : '📍 Check In with GPS + Face'}
      </button>

      <p className="gf-note">
        Your GPS coordinates and a live face capture are used only to verify campus presence and
        identity at check-in — neither is stored permanently beyond the match result.
      </p>
    </div>
  );
}
