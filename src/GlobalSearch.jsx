import { useState, useRef, useEffect } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  .search-container { position: relative; width: 100%; max-width: 400px; }
  .search-input { width: 100%; padding: 0.65rem 1rem 0.65rem 2.5rem; background: rgba(255,255,255,0.06); border: 0.5px solid rgba(255,255,255,0.15); border-radius: 10px; color: #E8F4FD; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; outline: none; transition: all 0.2s; }
  .search-input:focus { border-color: rgba(79,195,247,0.5); background: rgba(79,195,247,0.08); }
  .search-input::placeholder { color: rgba(232,244,253,0.3); }
  .search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); font-size: 1rem; color: rgba(232,244,253,0.3); }
  .search-clear { position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(232,244,253,0.3); cursor: pointer; font-size: 1rem; padding: 0; }
  .search-clear:hover { color: rgba(232,244,253,0.6); }
  .dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #0D1117; border: 0.5px solid rgba(79,195,247,0.2); border-radius: 12px; margin-top: 0.5rem; max-height: 500px; overflow-y: auto; z-index: 1000; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
  .result-group { padding: 0.75rem 0; }
  .result-group-label { padding: 0.5rem 1rem; font-size: 0.65rem; color: rgba(232,244,253,0.35); font-family: 'DM Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase; }
  .result-item { padding: 0.75rem 1rem; border-bottom: 0.5px solid rgba(255,255,255,0.04); cursor: pointer; transition: all 0.15s; }
  .result-item:hover { background: rgba(79,195,247,0.1); }
  .result-item:last-child { border-bottom: none; }
  .result-title { font-size: 0.85rem; color: #E8F4FD; font-weight: 500; margin-bottom: 0.2rem; }
  .result-meta { font-size: 0.7rem; color: rgba(232,244,253,0.4); }
  .result-icon { display: inline-block; width: 28px; height: 28px; border-radius: 6px; background: rgba(79,195,247,0.12); color: #4FC3F7; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; margin-right: 0.75rem; }
  .no-results { padding: 2rem 1rem; text-align: center; }
  .no-results-icon { font-size: 2rem; margin-bottom: 0.5rem; }
  .no-results-text { font-size: 0.85rem; color: rgba(232,244,253,0.5); }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  .dropdown { animation: fadeUp 0.2s ease; }
`;

const MOCK_DATA = {
  students: [
    { id: "STU001", name: "Arjun Sharma", role: "Student", dept: "CSE" },
    { id: "STU002", name: "Priya Nair", role: "Student", dept: "ECE" },
    { id: "STU003", name: "Rahul Verma", role: "Student", dept: "CSE" },
  ],
  faculty: [
    { id: "FAC001", name: "Dr. Ankit Mehta", role: "Faculty", subject: "Data Structures" },
    { id: "FAC002", name: "Prof. Sharma", role: "Faculty", subject: "Electronics" },
  ],
  rooms: [
    { id: 1, name: "Lab B-204", type: "Lab", floor: "B2" },
    { id: 2, name: "Hall A-101", type: "Lecture Hall", floor: "A1" },
    { id: 3, name: "Study Pod S-01", type: "Study Pod", floor: "S0" },
  ],
  events: [
    { id: "EV001", name: "Tech Fest 2026", date: "20 May", type: "Cultural" },
    { id: "EV002", name: "Hackathon Qualifier", date: "25 May", type: "Technical" },
  ],
  announcements: [
    { id: "ANN001", title: "Mid-term Schedule Released", date: "12 May" },
    { id: "ANN002", title: "Assignment 3 Extended", date: "10 May" },
  ],
};

export default function GlobalSearch({ onResultClick }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState({});
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length === 0) {
        setResults({});
        return;
      }

      const q = query.toLowerCase();
      const newResults = {};

      // Search students
      const matchedStudents = MOCK_DATA.students.filter(s =>
        s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
      );
      if (matchedStudents.length > 0) newResults.students = matchedStudents;

      // Search faculty
      const matchedFaculty = MOCK_DATA.faculty.filter(f =>
        f.name.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q)
      );
      if (matchedFaculty.length > 0) newResults.faculty = matchedFaculty;

      // Search rooms
      const matchedRooms = MOCK_DATA.rooms.filter(r =>
        r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)
      );
      if (matchedRooms.length > 0) newResults.rooms = matchedRooms;

      // Search events
      const matchedEvents = MOCK_DATA.events.filter(e =>
        e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)
      );
      if (matchedEvents.length > 0) newResults.events = matchedEvents;

      // Search announcements
      const matchedAnnouncements = MOCK_DATA.announcements.filter(a =>
        a.title.toLowerCase().includes(q)
      );
      if (matchedAnnouncements.length > 0) newResults.announcements = matchedAnnouncements;

      setResults(newResults);
      setIsOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (item, type) => {
    if (onResultClick) onResultClick(item, type);
    setQuery("");
    setIsOpen(false);
  };

  const hasResults = Object.keys(results).length > 0;
  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <>
      <style>{STYLES}</style>
      <div className="search-container" ref={containerRef}>
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder="Search rooms, events, people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(""); setIsOpen(false); }}>
            ✕
          </button>
        )}

        {isOpen && query && (
          <div className="dropdown">
            {hasResults ? (
              <>
                {results.students && (
                  <div className="result-group">
                    <div className="result-group-label">👤 Students ({results.students.length})</div>
                    {results.students.map(s => (
                      <div key={s.id} className="result-item" onClick={() => handleResultClick(s, "student")}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className="result-icon">👤</div>
                          <div>
                            <div className="result-title">{s.name}</div>
                            <div className="result-meta">{s.id} · {s.dept}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.faculty && (
                  <div className="result-group">
                    <div className="result-group-label">👨‍🏫 Faculty ({results.faculty.length})</div>
                    {results.faculty.map(f => (
                      <div key={f.id} className="result-item" onClick={() => handleResultClick(f, "faculty")}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className="result-icon">👨‍🏫</div>
                          <div>
                            <div className="result-title">{f.name}</div>
                            <div className="result-meta">{f.id} · {f.subject}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.rooms && (
                  <div className="result-group">
                    <div className="result-group-label">🏛️ Rooms ({results.rooms.length})</div>
                    {results.rooms.map(r => (
                      <div key={r.id} className="result-item" onClick={() => handleResultClick(r, "room")}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className="result-icon">🏛️</div>
                          <div>
                            <div className="result-title">{r.name}</div>
                            <div className="result-meta">{r.type} · Floor {r.floor}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.events && (
                  <div className="result-group">
                    <div className="result-group-label">📅 Events ({results.events.length})</div>
                    {results.events.map(e => (
                      <div key={e.id} className="result-item" onClick={() => handleResultClick(e, "event")}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className="result-icon">📅</div>
                          <div>
                            <div className="result-title">{e.name}</div>
                            <div className="result-meta">{e.date} · {e.type}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.announcements && (
                  <div className="result-group">
                    <div className="result-group-label">📢 Announcements ({results.announcements.length})</div>
                    {results.announcements.map(a => (
                      <div key={a.id} className="result-item" onClick={() => handleResultClick(a, "announcement")}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className="result-icon">📢</div>
                          <div>
                            <div className="result-title">{a.title}</div>
                            <div className="result-meta">{a.date}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <div className="no-results-text">No results found for "{query}"</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
