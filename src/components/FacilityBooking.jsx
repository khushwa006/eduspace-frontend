import { useState, useEffect } from 'react';
import './FacilityBooking.css';

const API = 'http://localhost:5000';
const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`, 'Content-Type': 'application/json' });
const get  = (url) => fetch(API+url, { headers: headers() }).then(r => r.json());
const post = (url, body) => fetch(API+url, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(r => r.json());
const del  = (url) => fetch(API+url, { method: 'DELETE', headers: headers() }).then(r => r.json());

const TYPE_ICONS = { 'Sports Facility': '🏋️', 'Library Seat': '📚' };
const TYPE_COLORS = { 'Sports Facility': '#10b981', 'Library Seat': '#3b82f6' };

const todayStr = () => new Date().toISOString().split('T')[0];
const maxDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 13);
  return d.toISOString().split('T')[0];
};

export default function FacilityBooking() {
  const [tab, setTab]               = useState('browse');
  const [date, setDate]             = useState(todayStr());
  const [facilities, setFacilities] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');
  const [seatPicker, setSeatPicker] = useState(null);   // { facility, slot } or null
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [booking, setBooking]       = useState(false);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const loadFacilities = async () => {
    setLoading(true);
    const data = await get(`/api/facilities?date=${date}`);
    setFacilities(Array.isArray(data.facilities) ? data.facilities : []);
    setLoading(false);
  };

  const loadMyBookings = async () => {
    setLoading(true);
    const data = await get('/api/facilities/my-bookings');
    setMyBookings(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { if (tab === 'browse') loadFacilities(); }, [date, tab]);
  useEffect(() => { if (tab === 'mine') loadMyBookings(); }, [tab]);

  const handleBook = async (roomId, timeSlotId, roomName, slotName, seatNumbers) => {
    const body = { room_id: roomId, date, time_slot_id: timeSlotId };
    if (seatNumbers && seatNumbers.length) body.seat_numbers = seatNumbers;
    const res = await post('/api/facilities/book', body);
    if (res.error) return flash(`❌ ${res.error}`);
    flash(`✅ ${roomName} booked for ${slotName}!`);
    loadFacilities();
  };

  const openSeatPicker = (facility, slot) => {
    setSeatPicker({ facility, slot });
    setSelectedSeats([]);
  };

  const closeSeatPicker = () => {
    setSeatPicker(null);
    setSelectedSeats([]);
  };

  const toggleSeat = (seatNum, isTaken, maxSeats) => {
    if (isTaken) return;
    setSelectedSeats(prev => {
      if (prev.includes(seatNum)) return prev.filter(n => n !== seatNum);
      if (prev.length >= maxSeats) {
        flash(`❌ You can select up to ${maxSeats} seat${maxSeats > 1 ? 's' : ''} for group study`);
        return prev;
      }
      return [...prev, seatNum];
    });
  };

  const confirmSeatBooking = async () => {
    if (!seatPicker || selectedSeats.length === 0) return;
    setBooking(true);
    const { facility, slot } = seatPicker;
    await handleBook(facility.id, slot.time_slot_id, facility.name, slot.slot_name, selectedSeats);
    setBooking(false);
    closeSeatPicker();
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    const res = await del(`/api/facilities/bookings/${bookingId}`);
    flash(res.error ? `❌ ${res.error}` : '✅ Booking cancelled');
    loadMyBookings();
  };

  const filtered = facilities.filter(f => !typeFilter || f.room_type === typeFilter);
  const upcomingBookings = myBookings.filter(b => b.is_upcoming && b.status === 'confirmed');
  const pastBookings     = myBookings.filter(b => !b.is_upcoming || b.status !== 'confirmed');

  return (
    <div className="fb-page">
      <div className="fb-header">
        <h2 className="fb-title">🏋️ Sports & Library Booking</h2>
        <p className="fb-sub">Book courts, gym slots, and library seats instantly</p>
      </div>

      {msg && <div className="fb-flash">{msg}</div>}

      <div className="fb-tabs">
        <button className={`fb-tab ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')}>
          🔎 Browse & Book
        </button>
        <button className={`fb-tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
          📂 My Bookings ({upcomingBookings.length})
        </button>
      </div>

      {/* ── BROWSE ──────────────────────────────────────────── */}
      {tab === 'browse' && (
        <>
          <div className="fb-toolbar">
            <div className="fb-date-picker">
              <label>📅 Date</label>
              <input type="date" className="fb-date-input" value={date} min={todayStr()} max={maxDateStr()}
                onChange={e => setDate(e.target.value)} />
            </div>
            <div className="fb-type-chips">
              {['', 'Sports Facility', 'Library Seat'].map(t => (
                <button key={t} className={`fb-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                  {t === '' ? 'All' : `${TYPE_ICONS[t]} ${t}`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="fb-empty">Loading availability...</p>
          ) : filtered.length === 0 ? (
            <div className="fb-empty-card">
              <p>📭 No sports or library facilities have been added yet.</p>
              <p className="fb-empty-sub">Ask your admin to add some via Manage Rooms.</p>
            </div>
          ) : (
            <div className="fb-facility-list">
              {filtered.map(f => (
                <div key={f.id} className="fb-facility-card">
                  <div className="fb-facility-head">
                    <div className="fb-facility-icon" style={{ background: `${TYPE_COLORS[f.room_type]}22`, color: TYPE_COLORS[f.room_type] }}>
                      {TYPE_ICONS[f.room_type] || '🏛️'}
                    </div>
                    <div>
                      <p className="fb-facility-name">{f.name}</p>
                      <p className="fb-facility-meta">{f.room_type} · {f.building || 'Main Campus'} · 👥 Capacity {f.capacity}</p>
                    </div>
                  </div>
                  <div className="fb-slots-grid">
                    {f.slots.map(s => (
                      <button key={s.time_slot_id}
                        className={`fb-slot-btn ${s.is_full ? 'fb-slot-full' : 'fb-slot-open'}`}
                        disabled={s.is_full}
                        onClick={() => f.room_type === 'Library Seat'
                          ? openSeatPicker(f, s)
                          : handleBook(f.id, s.time_slot_id, f.name, s.slot_name)}
                      >
                        <span className="fb-slot-time">{s.slot_name || `${s.start_time}-${s.end_time}`}</span>
                        <span className="fb-slot-avail">
                          {s.is_full ? 'Full' : `${s.available} of ${s.capacity} open`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MY BOOKINGS ─────────────────────────────────────── */}
      {tab === 'mine' && (
        <div className="fb-bookings-list">
          {loading ? (
            <p className="fb-empty">Loading...</p>
          ) : myBookings.length === 0 ? (
            <div className="fb-empty-card">
              <p>📭 You haven't booked any facilities yet.</p>
              <button className="fb-cta-btn" onClick={() => setTab('browse')}>🔎 Browse Facilities</button>
            </div>
          ) : (
            <>
              {upcomingBookings.length > 0 && (
                <>
                  <h3 className="fb-list-heading">⏰ Upcoming</h3>
                  {upcomingBookings.map(b => (
                    <div key={b.id} className="fb-booking-card">
                      <div className="fb-booking-icon" style={{ background: `${TYPE_COLORS[b.room_type]}22`, color: TYPE_COLORS[b.room_type] }}>
                        {TYPE_ICONS[b.room_type] || '🏛️'}
                      </div>
                      <div className="fb-booking-info">
                        <p className="fb-booking-name">{b.room_name}</p>
                        <p className="fb-booking-meta">
                          📅 {b.date_display} · ⏰ {b.slot_name} · 🏢 {b.building || 'Main Campus'}
                          {b.seat_numbers && b.seat_numbers.length > 0 && (
                            <> · 💺 {b.seat_numbers.length > 1 ? 'Seats' : 'Seat'} {b.seat_numbers.join(', ')}</>
                          )}
                        </p>
                      </div>
                      <button className="fb-cancel-btn" onClick={() => handleCancel(b.id)}>✕ Cancel</button>
                    </div>
                  ))}
                </>
              )}
              {pastBookings.length > 0 && (
                <>
                  <h3 className="fb-list-heading">📜 Past / Cancelled</h3>
                  {pastBookings.map(b => (
                    <div key={b.id} className="fb-booking-card fb-booking-past">
                      <div className="fb-booking-icon" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                        {TYPE_ICONS[b.room_type] || '🏛️'}
                      </div>
                      <div className="fb-booking-info">
                        <p className="fb-booking-name">{b.room_name}</p>
                        <p className="fb-booking-meta">📅 {b.date_display} · ⏰ {b.slot_name}</p>
                      </div>
                      <span className={`fb-status-tag ${b.status === 'cancelled' ? 'fb-status-cancelled' : ''}`}>
                        {b.status === 'cancelled' ? '✕ Cancelled' : '✓ Completed'}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── SEAT PICKER MODAL (Library Seat only) ─────────────── */}
      {seatPicker && (() => {
        const { facility, slot } = seatPicker;
        const maxSeats = facility.max_group_seats || 4;
        const availableSet = new Set(slot.available_seat_numbers || []);
        return (
          <div className="fb-seat-overlay" onClick={closeSeatPicker}>
            <div className="fb-seat-modal" onClick={e => e.stopPropagation()}>
              <div className="fb-seat-modal-head">
                <div>
                  <p className="fb-seat-modal-title">📚 {facility.name}</p>
                  <p className="fb-seat-modal-sub">{slot.slot_name || `${slot.start_time}-${slot.end_time}`} · Select up to {maxSeats} seat{maxSeats > 1 ? 's' : ''} for group study</p>
                </div>
                <button className="fb-seat-close" onClick={closeSeatPicker}>✕</button>
              </div>

              <div className="fb-seat-legend">
                <span><i className="fb-seat-swatch fb-seat-swatch-open"></i> Available</span>
                <span><i className="fb-seat-swatch fb-seat-swatch-selected"></i> Selected</span>
                <span><i className="fb-seat-swatch fb-seat-swatch-taken"></i> Taken</span>
              </div>

              <div className="fb-seat-grid">
                {Array.from({ length: facility.capacity }, (_, i) => i + 1).map(n => {
                  const taken = !availableSet.has(n);
                  const selected = selectedSeats.includes(n);
                  return (
                    <button key={n}
                      className={`fb-seat-btn ${taken ? 'fb-seat-taken' : ''} ${selected ? 'fb-seat-selected' : ''}`}
                      disabled={taken}
                      onClick={() => toggleSeat(n, taken, maxSeats)}>
                      {n}
                    </button>
                  );
                })}
              </div>

              <div className="fb-seat-footer">
                <span className="fb-seat-count">
                  {selectedSeats.length === 0 ? 'No seats selected' : `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} selected: ${selectedSeats.join(', ')}`}
                </span>
                <div className="fb-seat-footer-actions">
                  <button className="fb-btn-cancel" onClick={closeSeatPicker}>Cancel</button>
                  <button className="fb-btn-confirm" disabled={selectedSeats.length === 0 || booking} onClick={confirmSeatBooking}>
                    {booking ? 'Booking...' : `✅ Confirm Booking`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
