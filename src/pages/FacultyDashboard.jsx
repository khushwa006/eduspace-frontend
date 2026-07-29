import { useState, useEffect, useRef } from "react";
import {
  CheckSquare,
  Calendar,
  DoorOpen,
  User,
  CalendarDays,
  Bell,
  Clock,
  BookOpen,
  AlertCircle,
} from "lucide-react";

/**
 * FacultyDashboard
 * -----------------
 * Drop-in replacement for the existing Faculty dashboard.
 * Keeps the current header/card structure and adds:
 *   1. A notification bell (with unread badge + dropdown) in the header
 *   2. A "Today's Overview" section below the quick-action cards
 *
 * Wire-up notes (replace the mock fetches with your real endpoints):
 *   - GET /api/faculty/notifications        -> notifications list
 *   - PATCH /api/faculty/notifications/read  -> mark as read
 *   - GET /api/faculty/today-overview        -> next class, attendance status, pending bookings
 *
 * Styling follows the existing look: dark indigo/violet background,
 * frosted-glass cards, cyan/violet accents. Corners are kept squared-off
 * (rounded-md, not rounded-2xl) per the boxy style used elsewhere.
 */

const CARD_ICON_BG = {
  green: "bg-emerald-500",
  blue: "bg-blue-600",
  navy: "bg-blue-900",
  purple: "bg-violet-800",
  pink: "bg-pink-800",
};

function QuickActionCard({ icon: Icon, iconBg, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white/5 border border-white/10 rounded-md p-5 hover:bg-white/10
                 hover:border-white/20 transition-colors backdrop-blur-md w-full"
    >
      <div
        className={`w-11 h-11 rounded-md flex items-center justify-center mb-4 ${CARD_ICON_BG[iconBg]}`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-white font-semibold text-base">{title}</h3>
      <p className="text-indigo-300/80 text-sm mt-1">{subtitle}</p>
    </button>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    // Replace with: fetch("/api/faculty/notifications").then(...)
    setNotifications([
      {
        id: 1,
        title: "Room booking approved",
        detail: "Lab 204, tomorrow 10:00–11:00",
        read: false,
        time: "10m ago",
      },
      {
        id: 2,
        title: "Attendance reminder",
        detail: "CS301 attendance not marked yet",
        read: false,
        time: "1h ago",
      },
      {
        id: 3,
        title: "Timetable updated",
        detail: "Friday's schedule was changed by admin",
        read: true,
        time: "Yesterday",
      },
    ]);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    // Replace with: fetch("/api/faculty/notifications/read", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative w-10 h-10 flex items-center justify-center rounded-md
                   bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-indigo-100" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
                       bg-pink-600 text-white text-[11px] leading-[18px] text-center font-semibold"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-[#161233] border border-white/10 rounded-md
                     shadow-xl shadow-black/40 backdrop-blur-xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-cyan-300 hover:text-cyan-200"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <p className="text-indigo-300/70 text-sm px-4 py-6 text-center">
                You're all caught up.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 ${!n.read ? "bg-white/5" : ""}`}
                >
                  <span
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      n.read ? "bg-transparent" : "bg-cyan-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{n.title}</p>
                    <p className="text-indigo-300/80 text-xs mt-0.5">{n.detail}</p>
                    <p className="text-indigo-400/60 text-[11px] mt-1">{n.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TodayOverview() {
  // Replace with: fetch("/api/faculty/today-overview").then(...)
  const [data] = useState({
    nextClass: { subject: "CS301 - Data Structures", room: "Room 204", time: "11:00 AM" },
    attendanceMarked: false,
    pendingBookings: 2,
  });

  return (
    <div className="mt-8">
      <h2 className="text-white font-semibold text-lg mb-4">Today's Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-md p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-indigo-300/80 text-xs uppercase tracking-wide mb-3">
            <Clock className="w-4 h-4" /> Next Class
          </div>
          <p className="text-white font-semibold">{data.nextClass.subject}</p>
          <p className="text-indigo-300/80 text-sm mt-1">
            {data.nextClass.room} · {data.nextClass.time}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-md p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-indigo-300/80 text-xs uppercase tracking-wide mb-3">
            <BookOpen className="w-4 h-4" /> Attendance
          </div>
          <p className={`font-semibold ${data.attendanceMarked ? "text-emerald-400" : "text-pink-400"}`}>
            {data.attendanceMarked ? "Marked for today" : "Not marked yet"}
          </p>
          <p className="text-indigo-300/80 text-sm mt-1">
            {data.attendanceMarked ? "You're all set." : "Mark it before your next class."}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-md p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-indigo-300/80 text-xs uppercase tracking-wide mb-3">
            <AlertCircle className="w-4 h-4" /> Pending Bookings
          </div>
          <p className="text-white font-semibold">{data.pendingBookings} awaiting approval</p>
          <p className="text-indigo-300/80 text-sm mt-1">Track status in Room Bookings.</p>
        </div>
      </div>
    </div>
  );
}

export default function FacultyDashboard() {
  const facultyName = "Sunidhi Chauhan";

  const quickActions = [
    { icon: CheckSquare, iconBg: "green", title: "Attendance", subtitle: "Mark today's class attendance", path: "/attendance" },
    { icon: Calendar, iconBg: "blue", title: "My Timetable", subtitle: "View your class schedule", path: "/timetable" },
    { icon: DoorOpen, iconBg: "navy", title: "Room Bookings", subtitle: "Request & track room bookings", path: "/bookings" },
    { icon: User, iconBg: "purple", title: "My Account", subtitle: "Profile & security settings", path: "/account" },
    { icon: CalendarDays, iconBg: "pink", title: "Holidays", subtitle: "Non-working days", path: "/holidays" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0b28] via-[#1a1440] to-[#0c1730] px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏫</span>
          <h1 className="text-white text-xl font-bold">
            EduSpace <span className="font-semibold text-indigo-200">– Faculty</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-indigo-100 hover:bg-white/10">
            ☀️ Light
          </button>

          <NotificationBell />

          <div className="text-right leading-tight">
            <p className="text-white font-semibold text-sm">{facultyName}</p>
            <p className="text-emerald-400 text-xs">Faculty</p>
          </div>

          <button className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm px-4 py-2 rounded-md">
            Logout
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        {quickActions.map((c) => (
          <QuickActionCard key={c.title} {...c} onClick={() => console.log(`navigate: ${c.path}`)} />
        ))}
      </div>

      {/* New: Today's Overview */}
      <TodayOverview />
    </div>
  );
}
