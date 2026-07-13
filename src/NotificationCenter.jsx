import { useState } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07090F; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
  .card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; }
  .notif-item { padding: 1rem; background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s; display: flex; gap: 12px; }
  .notif-item:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12); }
  .notif-item.unread { background: rgba(79,195,247,0.08); border-color: rgba(79,195,247,0.2); }
  .notif-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
  .notif-content { flex: 1; }
  .notif-title { font-size: 0.9rem; font-weight: 500; margin-bottom: 0.3rem; color: #E8F4FD; }
  .notif-desc { font-size: 0.8rem; color: rgba(232,244,253,0.55); line-height: 1.5; }
  .notif-time { font-size: 0.7rem; color: rgba(232,244,253,0.35); margin-top: 0.4rem; font-family: 'DM Mono', monospace; }
  .notif-badge { font-size: 0.65rem; padding: 2px 8px; border-radius: 12px; white-space: nowrap; }
  .badge-academic { background: rgba(79,195,247,0.15); color: #4FC3F7; }
  .badge-system { background: rgba(129,199,132,0.15); color: #81C784; }
  .badge-event { background: rgba(255,183,77,0.15); color: #FFB74D; }
  .filter-tab { padding: 0.6rem 1.25rem; background: transparent; border: 0.5px solid rgba(255,255,255,0.12); color: rgba(232,244,253,0.5); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; margin-right: 0.5rem; margin-bottom: 0.5rem; }
  .filter-tab:hover { border-color: rgba(255,255,255,0.25); }
  .filter-tab.active { background: rgba(79,195,247,0.15); border-color: #4FC3F7; color: #4FC3F7; }
  .btn-primary { padding: 0.65rem 1.4rem; background: linear-gradient(135deg, #4FC3F7, #1976D2); color: #07090F; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  .btn-primary:hover { opacity: 0.88; }
  .btn-small { padding: 0.4rem 0.8rem; font-size: 0.75rem; border-radius: 6px; }
  .pref-group { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
  .pref-group:last-child { border-bottom: none; }
  .pref-title { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; }
  .pref-item { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0; }
  .pref-label { font-size: 0.85rem; }
  .toggle { width: 44px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 12px; position: relative; cursor: pointer; transition: background 0.3s; }
  .toggle.on { background: #4FC3F7; }
  .toggle-circle { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: left 0.3s; }
  .toggle.on .toggle-circle { left: 22px; }
  .sidebar { position: fixed; top: 0; right: -400px; width: 400px; height: 100vh; background: #0A0E14; border-left: 0.5px solid rgba(79,195,247,0.2); overflow-y: auto; transition: right 0.3s ease; z-index: 150; }
  .sidebar.open { right: 0; }
  .sidebar-header { padding: 1.5rem; border-bottom: 0.5px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: #0A0E14; }
  .sidebar-title { font-size: 1rem; font-weight: 600; }
  .sidebar-close { background: none; border: none; color: rgba(232,244,253,0.5); cursor: pointer; font-size: 1.5rem; }
  .sidebar-content { padding: 1.5rem; }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 140; display: none; }
  .overlay.open { display: block; }
  .empty-state { text-align: center; padding: 3rem 1rem; }
  .empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
  .anim-in { animation: fadeUp 0.4s ease both; }
`;

const NOTIFICATIONS = [
  { id: 1, icon: "📢", title: "New Announcement", desc: "Mid-term Schedule Released - Exam dates have been published", time: "2h ago", category: "Academic", read: false },
  { id: 2, icon: "✅", title: "Attendance Confirmed", desc: "Your presence for Data Structures class on 12 May has been recorded", time: "4h ago", category: "System", read: false },
  { id: 3, icon: "⚠️", title: "Low Attendance Alert", desc: "Computer Networks attendance at 63% - minimum 75% required", time: "1d ago", category: "Academic", read: true },
  { id: 4, icon: "🎓", title: "Exam Schedule", desc: "Mid-term timetable for CS semester 5 is now available", time: "2d ago", category: "Academic", read: true },
  { id: 5, icon: "🎉", title: "Event Reminder", desc: "Tech Fest 2026 starts tomorrow at 9:00 AM in Main Auditorium", time: "1d ago", category: "Event", read: true },
  { id: 6, icon: "📝", title: "Assignment Due", desc: "DBMS Assignment 3 due tomorrow at 11:59 PM", time: "3d ago", category: "Academic", read: true },
  { id: 7, icon: "📚", title: "Resource Available", desc: "Course materials for Software Engineering uploaded", time: "5d ago", category: "System", read: true },
  { id: 8, icon: "🏆", title: "Achievement Unlocked", desc: "You reached 100% attendance in Data Structures!", time: "1w ago", category: "System", read: true },
];

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState("All");
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    sms: false,
    academic: true,
    events: true,
    system: true,
    frequency: "instant",
  });

  const togglePref = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = filter === "All"
    ? notifications
    : filter === "Unread"
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.category === filter);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const categoryIcon = (cat) => {
    const map = {
      "Academic": "🎓",
      "System": "⚙️",
      "Event": "🎉",
    };
    return map[cat] || "📌";
  };

  const categoryBadge = (cat) => {
    const map = {
      "Academic": "badge-academic",
      "System": "badge-system",
      "Event": "badge-event",
    };
    return map[cat] || "badge-system";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", fontFamily: "'DM Sans', sans-serif", color: "#E8F4FD", padding: "2rem" }}>
      <style>{STYLES}</style>

      {/* PREFERENCES SIDEBAR */}
      <div className={`sidebar${showPreferences ? " open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">Notification Preferences</div>
          <button className="sidebar-close" onClick={() => setShowPreferences(false)}>✕</button>
        </div>
        <div className="sidebar-content">
          <div className="pref-group">
            <div className="pref-title">Notification Channels</div>
            {[
              { key: "email", label: "Email Notifications" },
              { key: "push", label: "Push Notifications" },
              { key: "sms", label: "SMS Alerts" },
            ].map(item => (
              <div key={item.key} className="pref-item">
                <span className="pref-label">{item.label}</span>
                <div className={`toggle${prefs[item.key] ? " on" : ""}`} onClick={() => togglePref(item.key)}>
                  <div className="toggle-circle" />
                </div>
              </div>
            ))}
          </div>

          <div className="pref-group">
            <div className="pref-title">Notification Types</div>
            {[
              { key: "academic", label: "Academic & Classes" },
              { key: "events", label: "Campus Events" },
              { key: "system", label: "System Updates" },
            ].map(item => (
              <div key={item.key} className="pref-item">
                <span className="pref-label">{item.label}</span>
                <div className={`toggle${prefs[item.key] ? " on" : ""}`} onClick={() => togglePref(item.key)}>
                  <div className="toggle-circle" />
                </div>
              </div>
            ))}
          </div>

          <div className="pref-group">
            <div className="pref-title">Notification Frequency</div>
            {["Instant", "Hourly", "Daily", "Weekly"].map(freq => (
              <label key={freq} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.6rem 0", cursor: "pointer" }}>
                <input type="radio" name="frequency" value={freq.toLowerCase()}
                  checked={prefs.frequency === freq.toLowerCase()}
                  onChange={() => setPrefs(prev => ({ ...prev, frequency: freq.toLowerCase() }))}
                  style={{ cursor: "pointer" }} />
                <span style={{ fontSize: "0.85rem" }}>{freq}</span>
              </label>
            ))}
          </div>

          <button className="btn-primary" style={{ width: "100%" }} onClick={() => setShowPreferences(false)}>
            Save Preferences
          </button>
        </div>
      </div>

      {/* OVERLAY */}
      <div className={`overlay${showPreferences ? " open" : ""}`} onClick={() => setShowPreferences(false)} />

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* HEADER */}
        <div className="anim-in" style={{ marginBottom: "2rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Stay Updated
            </p>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.2rem", fontWeight: 400, letterSpacing: "-0.02em" }}>
              Notifications
            </h1>
            <p style={{ fontSize: "0.9rem", color: "rgba(232,244,253,0.45)", marginTop: "0.35rem" }}>
              {unreadCount > 0 && <strong>{unreadCount}</strong>} {unreadCount > 0 ? "unread" : "All read"}
            </p>
          </div>
          <button className="btn-primary btn-small" onClick={() => setShowPreferences(true)}>
            ⚙️ Preferences
          </button>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {unreadCount > 0 && (
            <button style={{
              padding: "0.5rem 1rem",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              color: "rgba(232,244,253,0.6)",
              borderRadius: 8,
              fontSize: "0.8rem",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }} onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>

        {/* FILTERS */}
        <div className="anim-in" style={{ marginBottom: "1.5rem", animationDelay: "0.08s" }}>
          {["All", "Unread", "Academic", "System", "Event"].map((f, i) => (
            <button key={f} className={`filter-tab${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
              style={{ animation: `fadeUp 0.3s ${i * 0.04}s ease both` }}>
              {f}
            </button>
          ))}
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="anim-in" style={{ animationDelay: "0.12s" }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <div style={{ fontSize: "0.95rem", color: "rgba(232,244,253,0.5)" }}>
                {filter === "Unread" ? "No unread notifications" : "No notifications"}
              </div>
            </div>
          ) : (
            filtered.map((notif, i) => (
              <div key={notif.id} className={`notif-item${!notif.read ? " unread" : ""}`}
                onClick={() => markAsRead(notif.id)}
                style={{ animation: `fadeUp 0.35s ${i * 0.05}s ease both` }}>
                
                <div className="notif-icon" style={{ background: "rgba(79,195,247,0.1)" }}>
                  {notif.icon}
                </div>
                
                <div className="notif-content">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.3rem" }}>
                    <div className="notif-title">{notif.title}</div>
                    <span className={`notif-badge ${categoryBadge(notif.category)}`}>
                      {notif.category}
                    </span>
                    {!notif.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4FC3F7" }} />}
                  </div>
                  <div className="notif-desc">{notif.desc}</div>
                  <div className="notif-time">{notif.time}</div>
                </div>
                
                <button style={{
                  background: "none",
                  border: "none",
                  color: "rgba(232,244,253,0.3)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  padding: "0.5rem",
                  marginTop: "-0.5rem",
                }}
                  onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* INFO */}
        <div className="card" style={{ marginTop: "2rem", background: "rgba(79,195,247,0.05)", border: "0.5px solid rgba(79,195,247,0.15)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
            {[
              { emoji: "📧", title: "Email Digests", desc: "Get summarized notifications daily" },
              { emoji: "🔔", title: "Smart Alerts", desc: "Urgent notifications delivered instantly" },
              { emoji: "🎯", title: "Personalized", desc: "Choose topics you want to follow" },
              { emoji: "⏱", title: "Frequency Control", desc: "Set when you want to be notified" },
            ].map((item, i) => (
              <div key={i} style={{ animation: `fadeUp 0.4s ${2 + i * 0.08}s ease both` }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{item.emoji}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.3rem" }}>{item.title}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(232,244,253,0.45)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
