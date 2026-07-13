import { useState } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07090F; }
  ::selection { background: rgba(129,199,132,0.3); }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
  .card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; }
  .event-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
  .event-card { cursor: pointer; transition: all 0.3s; }
  .event-card:hover { transform: translateY(-8px); }
  .event-header { aspect-ratio: 4/3; border-radius: 12px; background: linear-gradient(135deg, rgba(129,199,132,0.15), rgba(79,195,247,0.15)); display: flex; align-items: center; justify-content: center; font-size: 3rem; margin-bottom: 1rem; border: 0.5px solid rgba(255,255,255,0.08); }
  .event-title { font-size: 1rem; font-weight: 500; margin-bottom: 0.35rem; }
  .event-meta { display: flex; gap: 0.75rem; font-size: 0.75rem; color: rgba(232,244,253,0.4); margin-bottom: 0.75rem; flex-wrap: wrap; }
  .event-desc { font-size: 0.85rem; color: rgba(232,244,253,0.55); line-height: 1.6; margin-bottom: 1rem; }
  .badge { display: inline-block; font-size: 0.65rem; padding: 3px 10px; border-radius: 20px; font-family: 'DM Mono', monospace; margin-bottom: 0.75rem; }
  .badge-cultural { background: rgba(129,199,132,0.12); color: #81C784; border: 0.5px solid rgba(129,199,132,0.2); }
  .badge-technical { background: rgba(79,195,247,0.12); color: #4FC3F7; border: 0.5px solid rgba(79,195,247,0.2); }
  .badge-career { background: rgba(255,183,77,0.12); color: #FFB74D; border: 0.5px solid rgba(255,183,77,0.2); }
  .badge-academic { background: rgba(206,147,216,0.12); color: #CE93D8; border: 0.5px solid rgba(206,147,216,0.2); }
  .rsvp-btn { width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #81C784, #2E7D32); color: #080C0A; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  .rsvp-btn:hover { opacity: 0.88; }
  .rsvp-btn.rsvped { background: rgba(129,199,132,0.2); color: #81C784; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(8px); }
  .modal { background: #0A0E14; border: 0.5px solid rgba(129,199,132,0.2); border-radius: 20px; padding: 2.5rem; max-width: 600px; width: 95%; max-height: 90vh; overflow-y: auto; animation: modalIn 0.3s ease; }
  .modal-close { position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; color: rgba(232,244,253,0.4); cursor: pointer; font-size: 1.5rem; }
  .filter-btn { padding: 0.5rem 1rem; background: transparent; border: 0.5px solid rgba(255,255,255,0.12); color: rgba(232,244,253,0.6); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; margin-right: 0.75rem; margin-bottom: 0.75rem; }
  .filter-btn:hover { border-color: rgba(255,255,255,0.25); }
  .filter-btn.active { background: rgba(129,199,132,0.15); border-color: #81C784; color: #81C784; }
  .anim-in { animation: fadeUp 0.4s ease both; }
`;

const EVENTS = [
  { id: 1, name: "Tech Fest 2026", date: "20 May", time: "09:00 AM", venue: "Main Auditorium", category: "Cultural", emoji: "🎭", attendees: 450, desc: "Annual cultural festival celebrating technology and creativity with performances, exhibitions, and competitions.", details: "Join us for a spectacular showcase of talent and innovation. This year's Tech Fest features live performances, stalls from tech companies, and exciting competitions with prizes worth 50,000 Rs." },
  { id: 2, name: "Hackathon Qualifier", date: "25 May", time: "10:00 AM", venue: "Lab Block A", category: "Technical", emoji: "⚡", attendees: 280, desc: "24-hour coding marathon to build innovative solutions. Teams compete for selection to national round.", details: "Showcase your coding skills and innovate under pressure. This hackathon focuses on solving real-world problems using cutting-edge technology. Team size: 2-4 members." },
  { id: 3, name: "Career Fair", date: "1 Jun", time: "11:00 AM", venue: "Hall A-101", category: "Career", emoji: "💼", attendees: 600, desc: "Meet 30+ recruiting companies including top tech firms and startups. Direct placement opportunities.", details: "Connect with industry leaders and explore career opportunities. 30+ companies including Google, Amazon, and emerging startups will be participating. Dress code: Formal." },
  { id: 4, name: "Alumni Talk Series", date: "5 Jun", time: "03:00 PM", venue: "Seminar Hall", category: "Academic", emoji: "🎓", attendees: 200, desc: "Insights from successful alumni working at FAANG companies and startups.", details: "Learn from pioneers in the industry. Our alumni will share their journey, challenges overcome, and lessons learned. Q&A session included." },
  { id: 5, name: "Sports Day", date: "12 Jun", time: "08:00 AM", venue: "Sports Ground", category: "Cultural", emoji: "🏆", attendees: 800, desc: "Inter-departmental sports competition featuring cricket, badminton, football, and track events.", details: "Celebrate athletic excellence! Events include: Cricket (Men & Women), Badminton Doubles, Football, 100m & 4x100m relay, Volleyball." },
  { id: 6, name: "AI/ML Workshop", date: "8 Jun", time: "02:00 PM", venue: "Lab B-204", category: "Technical", emoji: "🤖", attendees: 120, desc: "Hands-on workshop on building ML models using Python. Expert trainers from industry.", details: "Learn practical AI/ML applications. Topics: Data preprocessing, feature engineering, model training, and deployment. Limited to 100 participants. Bring laptop." },
];

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rsvped, setRsvped] = useState({});
  const [showModal, setShowModal] = useState(false);

  const categories = ["All", "Cultural", "Technical", "Career", "Academic"];
  const filteredEvents = selectedCategory === "All"
    ? EVENTS
    : EVENTS.filter(e => e.category === selectedCategory);

  const toggleRsvp = (eventId) => {
    setRsvped(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const openEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const getBadgeClass = (category) => {
    const map = {
      "Cultural": "badge-cultural",
      "Technical": "badge-technical",
      "Career": "badge-career",
      "Academic": "badge-academic",
    };
    return map[category] || "badge-cultural";
  };

  const getCategoryEmoji = (category) => {
    const map = {
      "Cultural": "🎭",
      "Technical": "⚡",
      "Career": "💼",
      "Academic": "🎓",
    };
    return map[category] || "📅";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", fontFamily: "'DM Sans', sans-serif", color: "#E8F4FD", padding: "2rem" }}>
      <style>{STYLES}</style>

      {/* EVENT DETAIL MODAL */}
      {showModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{selectedEvent.emoji}</div>
            
            <span className={`badge ${getBadgeClass(selectedEvent.category)}`}>{selectedEvent.category}</span>
            
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2rem", fontWeight: 400, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
              {selectedEvent.name}
            </h1>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { icon: "📅", label: "Date", value: selectedEvent.date },
                { icon: "⏰", label: "Time", value: selectedEvent.time },
                { icon: "📍", label: "Venue", value: selectedEvent.venue },
                { icon: "👥", label: "Attending", value: `${selectedEvent.attendees} people` },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.4)", fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>About This Event</h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(232,244,253,0.6)", lineHeight: 1.8 }}>
                {selectedEvent.details}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                className={`rsvp-btn${rsvped[selectedEvent.id] ? " rsvped" : ""}`}
                onClick={() => toggleRsvp(selectedEvent.id)}>
                {rsvped[selectedEvent.id] ? "✓ Going" : "RSVP Now"}
              </button>
              <button style={{ padding: "0.75rem", background: "transparent", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(232,244,253,0.6)", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                onClick={() => alert("Share link copied!")}>
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="anim-in" style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
          Campus Calendar
        </p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.2rem", fontWeight: 400, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Upcoming Events
        </h1>
        <p style={{ fontSize: "0.95rem", color: "rgba(232,244,253,0.45)", maxWidth: "600px" }}>
          Explore cultural, technical, career, and academic events happening across campus this month.
        </p>
      </div>

      {/* CATEGORY FILTERS */}
      <div className="anim-in" style={{ marginBottom: "2rem", animationDelay: "0.08s" }}>
        {categories.map((cat, i) => (
          <button key={cat}
            className={`filter-btn${selectedCategory === cat ? " active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
            style={{ animation: `fadeUp 0.3s ${i * 0.05}s ease both` }}>
            {cat === "All" ? "📅 All Events" : `${getCategoryEmoji(cat)} ${cat}`}
          </button>
        ))}
      </div>

      {/* EVENTS GRID */}
      <div className="event-grid" style={{ marginBottom: "2rem" }}>
        {filteredEvents.map((event, i) => (
          <div key={event.id} className="card event-card anim-in" 
            onClick={() => openEvent(event)}
            style={{ cursor: "pointer", animation: `fadeUp 0.4s ${i * 0.08}s ease both` }}>
            
            <div className="event-header">{event.emoji}</div>
            
            <span className={`badge ${getBadgeClass(event.category)}`}>{event.category}</span>
            
            <div className="event-title">{event.name}</div>
            
            <div className="event-meta">
              <span>📅 {event.date}</span>
              <span>⏰ {event.time}</span>
            </div>
            
            <div className="event-desc">{event.desc}</div>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "0.5px solid rgba(255,255,255,0.05)", marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", color: "rgba(232,244,253,0.4)" }}>
                👥 {event.attendees} attending
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(232,244,253,0.4)" }}>
                📍 {event.venue}
              </div>
            </div>
            
            <button
              className={`rsvp-btn${rsvped[event.id] ? " rsvped" : ""}`}
              onClick={(e) => { e.stopPropagation(); toggleRsvp(event.id); }}>
              {rsvped[event.id] ? "✓ Going" : "RSVP"}
            </button>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎭</div>
          <div style={{ fontSize: "1rem", color: "rgba(232,244,253,0.5)" }}>
            No events in this category yet
          </div>
          <button className="filter-btn" onClick={() => setSelectedCategory("All")} style={{ marginTop: "1rem" }}>
            View All Events
          </button>
        </div>
      )}

      {/* INFO SECTION */}
      <div className="card" style={{ background: "rgba(129,199,132,0.05)", border: "0.5px solid rgba(129,199,132,0.15)", marginTop: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {[
            { emoji: "📧", title: "Get Reminders", desc: "Receive notifications before events start" },
            { emoji: "👫", title: "Invite Friends", desc: "Share events and RSVP together" },
            { emoji: "🏆", title: "Win Prizes", desc: "Participate and earn points" },
            { emoji: "📸", title: "Share Photos", desc: "Post your event photos to campus feed" },
          ].map((item, i) => (
            <div key={i} style={{ animation: `fadeUp 0.4s ${1 + i * 0.08}s ease both` }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{item.emoji}</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.3rem" }}>{item.title}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(232,244,253,0.45)" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
