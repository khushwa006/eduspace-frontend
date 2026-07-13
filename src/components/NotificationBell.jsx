import { useState, useEffect, useRef } from 'react';
import './NotificationBell.css';

const TYPE_CONFIG = {
  info:    { icon: '📢', color: '#3b82f6', bg: '#1e3a5f', label: 'Announcement' },
  event:   { icon: '🎉', color: '#10b981', bg: '#052e1a', label: 'Event'        },
  warning: { icon: '⚠️', color: '#f59e0b', bg: '#2d1f00', label: 'Warning'      },
  urgent:  { icon: '🚨', color: '#ef4444', bg: '#2d0a0a', label: 'Urgent'       },
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen]                   = useState(false);
  const [toast, setToast]                 = useState(null);
  const [loading, setLoading]             = useState(false);
  const panelRef = useRef();
  const token = () => localStorage.getItem('jwt_token');

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);

      // Show toast for latest unread urgent/event
      const unread = data.filter(n => !n.is_read);
      const priority = unread.find(n => n.notif_type === 'urgent') || unread.find(n => n.notif_type === 'event');
      if (priority) {
        const shown = sessionStorage.getItem(`toast_shown_${priority.id}`);
        if (!shown) {
          setToast(priority);
          sessionStorage.setItem(`toast_shown_${priority.id}`, '1');
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token()}` }
    });
    setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n));
  };

  const markAllRead = async () => {
    setLoading(true);
    await fetch('http://localhost:5000/api/notifications/read-all', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token()}` }
    });
    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    setLoading(false);
  };

  const dismissToast = () => {
    if (toast) markRead(toast.id);
    setToast(null);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* ── TOAST POPUP ──────────────────────────────────────── */}
      {toast && (
        <div className={`nb-toast nb-toast--${toast.notif_type}`}>
          <div className="nb-toast-header">
            <span>{TYPE_CONFIG[toast.notif_type]?.icon} {TYPE_CONFIG[toast.notif_type]?.label}</span>
            <button onClick={dismissToast} className="nb-toast-close">✕</button>
          </div>
          <p className="nb-toast-title">{toast.title}</p>
          <p className="nb-toast-msg">{toast.message}</p>
          <button className="nb-toast-action" onClick={() => { dismissToast(); setOpen(true); }}>
            View All Notifications
          </button>
        </div>
      )}

      {/* ── BELL BUTTON + PANEL ───────────────────────────────── */}
      <div className="nb-wrapper" ref={panelRef}>
        <button className="nb-bell" onClick={() => { setOpen(o => !o); if (!open) notifications.forEach(n => !n.is_read && markRead(n.id)); }}>
          🔔
          {unreadCount > 0 && (
            <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {open && (
          <div className="nb-panel">
            <div className="nb-panel-header">
              <h3>🔔 Notifications</h3>
              {unreadCount > 0 && (
                <button className="nb-mark-all" onClick={markAllRead} disabled={loading}>
                  {loading ? '...' : 'Mark all read'}
                </button>
              )}
            </div>

            <div className="nb-list">
              {notifications.length === 0 ? (
                <p className="nb-empty">No notifications yet.</p>
              ) : notifications.map(n => {
                const cfg = TYPE_CONFIG[n.notif_type] || TYPE_CONFIG.info;
                return (
                  <div key={n.id}
                    className={`nb-item ${!n.is_read ? 'nb-item--unread' : ''}`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className="nb-item-icon" style={{background: cfg.bg, color: cfg.color}}>
                      {cfg.icon}
                    </div>
                    <div className="nb-item-body">
                      <div className="nb-item-top">
                        <span className="nb-item-title">{n.title}</span>
                        {!n.is_read && <span className="nb-unread-dot" />}
                      </div>
                      <p className="nb-item-msg">{n.message}</p>
                      <div className="nb-item-meta">
                        <span className="nb-type-chip" style={{color: cfg.color}}>{cfg.label}</span>
                        <span>{n.days_ago === 0 ? 'Today' : `${n.days_ago}d ago`}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
