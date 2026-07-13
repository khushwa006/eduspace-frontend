import { useState, useMemo } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07090F; }
  ::selection { background: rgba(79,195,247,0.3); }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; }
  .btn-primary { padding: 0.65rem 1.4rem; background: linear-gradient(135deg,#4FC3F7,#1976D2); color: #07090F; border: none; border-radius: 8px; font-family: 'DM Sans',sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  .btn-primary:hover { opacity: 0.88; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ghost { padding: 0.55rem 1.1rem; background: transparent; border: 0.5px solid rgba(255,255,255,0.12); color: rgba(232,244,253,0.6); border-radius: 8px; font-family: 'DM Sans',sans-serif; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.25); color: #E8F4FD; background: rgba(255,255,255,0.04); }
  .btn-time { padding: 0.6rem 1rem; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 10px; color: rgba(232,244,253,0.5); font-family: 'DM Sans',sans-serif; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
  .btn-time:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.2); }
  .btn-time.selected { background: rgba(79,195,247,0.2); border-color: #4FC3F7; color: #4FC3F7; }
  .btn-time.unavailable { opacity: 0.3; cursor: not-allowed; }
  .badge { display: inline-block; font-size: 0.65rem; font-weight: 500; padding: 3px 10px; border-radius: 20px; font-family: 'DM Mono',monospace; letter-spacing: 0.04em; }
  .badge-green { background: rgba(129,199,132,0.12); color: #81C784; border: 0.5px solid rgba(129,199,132,0.2); }
  .badge-orange { background: rgba(255,183,77,0.12); color: #FFB74D; border: 0.5px solid rgba(255,183,77,0.2); }
  .badge-red { background: rgba(229,115,115,0.12); color: #E57373; border: 0.5px solid rgba(229,115,115,0.2); }
  .badge-blue { background: rgba(79,195,247,0.12); color: #4FC3F7; border: 0.5px solid rgba(79,195,247,0.2); }
  .room-card { padding: 1.25rem; background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
  .room-card:hover { border-color: rgba(79,195,247,0.3); background: rgba(79,195,247,0.04); }
  .room-card.selected { border-color: #4FC3F7; background: rgba(79,195,247,0.08); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(8px); }
  .modal { background: #0A0E14; border: 0.5px solid rgba(79,195,247,0.2); border-radius: 20px; padding: 2.5rem; width: 95%; max-width: 500px; max-height: 90vh; overflow-y: auto; animation: fadeUp 0.3s ease; }
  .form-group { margin-bottom: 1.25rem; }
  .form-label { font-size: 0.7rem; color: rgba(232,244,253,0.4); font-family: 'DM Mono',monospace; letter-spacing: 0.06em; text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
  .form-input, .form-select { width: 100%; padding: 0.85rem 1rem; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: #E8F4FD; font-family: 'DM Sans',sans-serif; font-size: 0.9rem; outline: none; transition: border 0.2s; }
  .form-input:focus, .form-select:focus { border-color: rgba(79,195,247,0.5); background: rgba(79,195,247,0.04); }
  .form-input::placeholder { color: rgba(232,244,253,0.2); }
  .booking-history { max-height: 300px; overflow-y: auto; }
  .history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem; background: rgba(255,255,255,0.02); border-radius: 10px; margin-bottom: 0.6rem; border: 0.5px solid rgba(255,255,255,0.05); }
  .anim-in { animation: fadeUp 0.4s ease both; }
  .anim-slide { animation: slideIn 0.4s ease both; }
  .day-cell { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.08); transition: all 0.15s; font-size: 0.85rem; }
  .day-cell:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }
  .day-cell.selected { background: rgba(79,195,247,0.15); border-color: #4FC3F7; color: #4FC3F7; font-weight: 600; }
  .day-cell.other-month { opacity: 0.3; cursor: default; }
  .day-cell.other-month:hover { background: transparent; border-color: rgba(255,255,255,0.08); }
  .capacity-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-top: 0.5rem; }
  .capacity-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
  .success-icon { font-size: 3rem; margin-bottom: 1rem; animation: fadeUp 0.5s ease; }
  .tooltip { position: relative; display: inline-block; }
  .tooltip-text { visibility: hidden; background: rgba(0,0,0,0.9); color: #4FC3F7; text-align: center; padding: 0.5rem 0.75rem; border-radius: 6px; position: absolute; z-index: 100; bottom: 120%; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 0.75rem; border: 0.5px solid rgba(79,195,247,0.3); pointer-events: none; }
  .tooltip:hover .tooltip-text { visibility: visible; }
`;

const ROOMS = [
  { id: 1, name: "Lab B-204", type: "Lab", capacity: 40, floor: "B2", amenities: ["Projector", "WiFi", "Workstations"] },
  { id: 2, name: "Hall A-101", type: "Lecture Hall", capacity: 80, floor: "A1", amenities: ["Projector", "Microphone", "AV Setup"] },
  { id: 3, name: "Room C-302", type: "Classroom", capacity: 30, floor: "C3", amenities: ["Whiteboard", "Projector", "WiFi"] },
  { id: 4, name: "Library L1", type: "Study Area", capacity: 100, floor: "L1", amenities: ["Quiet", "WiFi", "Power Outlets"] },
  { id: 5, name: "Study Pod S-01", type: "Study Pod", capacity: 6, floor: "S0", amenities: ["Private", "Whiteboard", "WiFi"] },
  { id: 6, name: "Seminar S-201", type: "Seminar", capacity: 50, floor: "S2", amenities: ["Projector", "Whiteboard", "WiFi"] },
  { id: 7, name: "Lab D-101", type: "Lab", capacity: 35, floor: "D1", amenities: ["Workstations", "Projector", "AV Setup"] },
  { id: 8, name: "Hall A-102", type: "Lecture Hall", capacity: 80, floor: "A1", amenities: ["Projector", "Microphone", "WiFi"] },
];

const ROOM_TYPES = ["All", "Lab", "Lecture Hall", "Classroom", "Study Area", "Study Pod", "Seminar"];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

function getOccupancy(roomId, date, timeSlot) {
  const hash = (roomId + date.getTime() + timeSlot.charCodeAt(0)) % 100;
  return Math.floor(hash / 10);
}

function isRoomAvailable(roomId, date, timeSlot) {
  const occupancy = getOccupancy(roomId, date, timeSlot);
  return occupancy < 7;
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDayOfWeek(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

export default function RoomBookingPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [roomTypeFilter, setRoomTypeFilter] = useState("All");
  const [bookingHistory, setBookingHistory] = useState([
    { room: "Lab B-204", date: "12 May", time: "09:00 - 10:30", status: "confirmed" },
    { room: "Study Pod S-01", date: "10 May", time: "14:00 - 15:00", status: "confirmed" },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const filteredRooms = ROOMS.filter(r => roomTypeFilter === "All" || r.type === roomTypeFilter);
  
  const availableAtTime = selectedRoom && selectedTime 
    ? isRoomAvailable(selectedRoom.id, selectedDate, selectedTime)
    : false;

  const getRoomOccupancy = (roomId) => {
    return getOccupancy(roomId, selectedDate, selectedTime || "09:00");
  };

  const handleBooking = () => {
    if (!selectedRoom || !selectedTime || !endTime || !bookingPurpose) return;
    setShowModal(false);
    setShowSuccess(true);
    setTimeout(() => {
      setBookingHistory(h => [{
        room: selectedRoom.name,
        date: selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        time: `${selectedTime} - ${endTime}`,
        status: "confirmed"
      }, ...h]);
      setShowSuccess(false);
      setSelectedRoom(null);
      setSelectedTime(null);
      setEndTime(null);
      setBookingPurpose("");
    }, 2000);
  };

  const calendarDays = [];
  const firstDay = getDayOfWeek(currentMonth);
  const days = daysInMonth(currentMonth);
  const prevDays = daysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevDays - i, other: true });
  }
  for (let i = 1; i <= days; i++) {
    calendarDays.push({ day: i, other: false, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i) });
  }
  for (let i = 1; calendarDays.length % 7 !== 0; i++) {
    calendarDays.push({ day: i, other: true });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", fontFamily: "'DM Sans', sans-serif", color: "#E8F4FD", padding: "2rem" }}>
      <style>{STYLES}</style>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="modal" style={{ textAlign: "center" }}>
            <div className="success-icon">✅</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", fontWeight: 400, marginBottom: "0.5rem" }}>
              Booking Confirmed!
            </h2>
            <p style={{ fontSize: "0.9rem", color: "rgba(232,244,253,0.6)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Your room booking for <strong>{selectedRoom?.name}</strong> on {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} has been confirmed. A confirmation email has been sent.
            </p>
            <div style={{ background: "rgba(79,195,247,0.08)", border: "0.5px solid rgba(79,195,247,0.2)", borderRadius: 10, padding: "1rem", marginBottom: "1.5rem", textAlign: "left" }}>
              <div style={{ fontSize: "0.75rem", color: "rgba(232,244,253,0.4)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: "0.5rem" }}>Booking Details</div>
              {[["Room", selectedRoom?.name], ["Date", selectedDate.toLocaleDateString('en-GB')], ["Time", `${selectedTime} - ${endTime}`], ["Purpose", bookingPurpose]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.4rem 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "rgba(232,244,253,0.4)" }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setShowSuccess(false)} style={{ width: "100%" }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.5rem", fontWeight: 400, marginBottom: "1.5rem" }}>
              Complete Your Booking
            </h2>
            <div style={{ background: "rgba(79,195,247,0.08)", border: "0.5px solid rgba(79,195,247,0.2)", borderRadius: 10, padding: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.85rem" }}>
                <div>
                  <div style={{ color: "rgba(232,244,253,0.4)", fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem", textTransform: "uppercase" }}>Room</div>
                  <div style={{ fontWeight: 500, color: "#4FC3F7" }}>{selectedRoom?.name}</div>
                </div>
                <div>
                  <div style={{ color: "rgba(232,244,253,0.4)", fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem", textTransform: "uppercase" }}>Date</div>
                  <div style={{ fontWeight: 500 }}>{selectedDate.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                </div>
                <div>
                  <div style={{ color: "rgba(232,244,253,0.4)", fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem", textTransform: "uppercase" }}>Start Time</div>
                  <div style={{ fontWeight: 500 }}>{selectedTime}</div>
                </div>
                <div>
                  <div style={{ color: "rgba(232,244,253,0.4)", fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem", textTransform: "uppercase" }}>End Time</div>
                  <div style={{ fontWeight: 500 }}>{endTime}</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Booking Purpose</label>
              <textarea className="form-input" placeholder="e.g. Group project meeting, Study session, Class lecture" rows={3} value={bookingPurpose} onChange={e => setBookingPurpose(e.target.value)} style={{ resize: "none" }} />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleBooking} disabled={!bookingPurpose.trim()}>
                Confirm Booking
              </button>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div className="anim-in" style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Smart Scheduling
          </p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.2rem", fontWeight: 400, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            Book a Room
          </h1>
          <p style={{ fontSize: "0.95rem", color: "rgba(232,244,253,0.45)", maxWidth: "500px" }}>
            Find available classrooms, labs, and study spaces across campus. View real-time occupancy and instant confirmation.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "2rem" }}>
          {/* LEFT SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Calendar */}
            <div className="card anim-slide">
              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Select Date</span>
                <span style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.3)", fontFamily: "'DM Mono', monospace" }}>
                  {currentMonth.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </span>
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <button className="btn-ghost" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem" }}>
                  ← Prev
                </button>
                <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                  {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </span>
                <button className="btn-ghost" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem" }}>
                  Next →
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", color: "rgba(232,244,253,0.3)", fontFamily: "'DM Mono', monospace", fontWeight: 500, padding: "0.3rem" }}>
                    {d}
                  </div>
                ))}
                {calendarDays.map((cell, i) => {
                  const isSelected = !cell.other && cell.date && cell.date.toDateString() === selectedDate.toDateString();
                  return (
                    <div key={i} className={`day-cell${isSelected ? " selected" : ""}${cell.other ? " other-month" : ""}`}
                      onClick={() => !cell.other && setSelectedDate(cell.date)}
                      style={{ animation: `fadeUp 0.3s ${i * 0.02}s ease both` }}>
                      {cell.day}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: 8, textAlign: "center", fontSize: "0.78rem", color: "rgba(232,244,253,0.4)" }}>
                Selected: <strong style={{ color: "#4FC3F7" }}>{selectedDate.toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
              </div>
            </div>

            {/* Booking History */}
            <div className="card anim-slide" style={{ animationDelay: "0.1s" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Your Bookings</span>
                <span style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.3)", fontFamily: "'DM Mono', monospace" }}>{bookingHistory.length}</span>
              </h3>
              <div className="booking-history">
                {bookingHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.5rem 0", color: "rgba(232,244,253,0.3)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
                    <div style={{ fontSize: "0.8rem" }}>No bookings yet</div>
                  </div>
                ) : (
                  bookingHistory.map((b, i) => (
                    <div key={i} className="history-item" style={{ animation: `fadeUp 0.35s ${i * 0.08}s ease both` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.2rem" }}>{b.room}</div>
                        <div style={{ fontSize: "0.72rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace" }}>{b.date} · {b.time}</div>
                      </div>
                      <span className="badge badge-green">{b.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Time Slot Selection */}
            <div className="card anim-in" style={{ animationDelay: "0.05s" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem" }}>
                Select Time Range
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: "0.6rem", marginBottom: "1rem" }}>
                {TIME_SLOTS.map((slot, i) => (
                  <div key={slot} className="tooltip">
                    <button
                      className={`btn-time${selectedTime === slot ? " selected" : ""}${selectedRoom && !isRoomAvailable(selectedRoom.id, selectedDate, slot) ? " unavailable" : ""}`}
                      onClick={() => {
                        setSelectedTime(slot);
                        const nextIndex = (i + 1) % TIME_SLOTS.length;
                        setEndTime(TIME_SLOTS[nextIndex > i ? nextIndex : i]);
                      }}
                      style={{ animation: `fadeUp 0.25s ${i * 0.03}s ease both`, width: "100%" }}
                    >
                      {slot}
                    </button>
                    {selectedRoom && !isRoomAvailable(selectedRoom.id, selectedDate, slot) && (
                      <span className="tooltip-text">Full capacity</span>
                    )}
                  </div>
                ))}
              </div>
              {selectedTime && (
                <div style={{ background: "rgba(79,195,247,0.08)", border: "0.5px solid rgba(79,195,247,0.2)", borderRadius: 10, padding: "0.85rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.4)", fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>START</div>
                      <div style={{ fontSize: "1rem", fontWeight: 500, color: "#4FC3F7" }}>{selectedTime}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.4)", fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>END</div>
                      <select className="form-select" value={endTime || ""} onChange={e => setEndTime(e.target.value)} style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}>
                        {TIME_SLOTS.map((slot, i) => {
                          const startIdx = TIME_SLOTS.indexOf(selectedTime);
                          return i > startIdx ? <option key={slot} style={{ background: "#0A0E14" }}>{slot}</option> : null;
                        })}
                      </select>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(232,244,253,0.4)", fontFamily: "'DM Mono', monospace" }}>
                    Duration: {endTime ? (TIME_SLOTS.indexOf(endTime) - TIME_SLOTS.indexOf(selectedTime)) : 0} hour(s)
                  </div>
                </div>
              )}
            </div>

            {/* Room Type Filter */}
            <div className="card anim-in" style={{ animationDelay: "0.08s" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem" }}>
                Filter by Type
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {ROOM_TYPES.map((type, i) => (
                  <button key={type}
                    className={`btn-ghost`}
                    onClick={() => setRoomTypeFilter(type)}
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.5rem 1rem",
                      background: roomTypeFilter === type ? "rgba(79,195,247,0.15)" : "transparent",
                      borderColor: roomTypeFilter === type ? "#4FC3F7" : "rgba(255,255,255,0.12)",
                      color: roomTypeFilter === type ? "#4FC3F7" : "rgba(232,244,253,0.6)",
                      animation: `fadeUp 0.25s ${i * 0.04}s ease both`,
                    }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="anim-in" style={{ animationDelay: "0.1s" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>
                Available Rooms <span style={{ fontSize: "0.75rem", color: "rgba(232,244,253,0.4)", fontWeight: 400 }}>{filteredRooms.length} rooms</span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {filteredRooms.map((room, i) => {
                  const occupancy = getRoomOccupancy(room.id);
                  const occupancyPct = (occupancy / 10) * 100;
                  const available = isRoomAvailable(room.id, selectedDate, selectedTime || "09:00");
                  const isSelected = selectedRoom?.id === room.id;

                  return (
                    <div key={room.id} className={`room-card${isSelected ? " selected" : ""}`}
                      onClick={() => setSelectedRoom(room)}
                      style={{ animation: `fadeUp 0.35s ${i * 0.06}s ease both` }}>
                      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <div>
                          <h4 style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: "0.2rem" }}>
                            {room.name}
                          </h4>
                          <div style={{ fontSize: "0.72rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace" }}>
                            Floor {room.floor} · {room.type}
                          </div>
                        </div>
                        {selectedTime && (
                          <span className={`badge badge-${available ? "green" : "red"}`}>
                            {available ? "Available" : "Full"}
                          </span>
                        )}
                      </div>

                      <div style={{ marginBottom: "0.85rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(232,244,253,0.4)", marginBottom: "0.35rem" }}>
                          <span>Capacity</span>
                          <span>{occupancy}/10 units</span>
                        </div>
                        <div className="capacity-bar">
                          <div className="capacity-fill" style={{
                            width: `${occupancyPct}%`,
                            background: occupancyPct > 70 ? "#E57373" : occupancyPct > 40 ? "#FFB74D" : "#81C784",
                          }} />
                        </div>
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                          Amenities
                        </div>
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          {room.amenities.map(a => (
                            <span key={a} style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(79,195,247,0.1)", color: "rgba(232,244,253,0.5)", borderRadius: "4px" }}>
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        className="btn-primary"
                        style={{ width: "100%", fontSize: "0.8rem", opacity: selectedTime && available ? 1 : 0.5 }}
                        disabled={!selectedTime || !available}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedTime && available) setShowModal(true);
                        }}>
                        {isSelected ? "✓ Selected" : "Select Room"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="card" style={{ marginTop: "2rem", background: "rgba(79,195,247,0.05)", border: "0.5px solid rgba(79,195,247,0.15)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            {[
              { icon: "⚡", title: "Instant Confirmation", desc: "Get immediate booking confirmation via email" },
              { icon: "📊", title: "Live Occupancy", desc: "Real-time room status updated every 30 seconds" },
              { icon: "📞", title: "24/7 Support", desc: "Contact support if you need to modify bookings" },
              { icon: "🔐", title: "Secure Booking", desc: "Your bookings are protected and cancelable" },
            ].map((item, i) => (
              <div key={i} style={{ animation: `fadeUp 0.4s ${0.3 + i * 0.08}s ease both` }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{item.icon}</div>
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
