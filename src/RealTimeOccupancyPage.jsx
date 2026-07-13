import { useState, useEffect, useMemo } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07090F; }
  ::selection { background: rgba(79,195,247,0.3); }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes shimmer { 0%{opacity:0.6} 50%{opacity:1} 100%{opacity:0.6} }
  .card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; transition: all 0.3s; }
  .card:hover { border-color: rgba(79,195,247,0.2); background: rgba(255,255,255,0.05); }
  .btn-ghost { padding: 0.5rem 1rem; background: transparent; border: 0.5px solid rgba(255,255,255,0.12); color: rgba(232,244,253,0.6); border-radius: 8px; font-family: 'DM Sans',sans-serif; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.25); color: #E8F4FD; }
  .btn-ghost.active { background: rgba(79,195,247,0.15); border-color: #4FC3F7; color: #4FC3F7; }
  .badge { display: inline-block; font-size: 0.65rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; font-family: 'DM Mono',monospace; letter-spacing: 0.05em; text-transform: uppercase; }
  .badge-available { background: rgba(129,199,132,0.15); color: #81C784; border: 0.5px solid rgba(129,199,132,0.3); }
  .badge-partial { background: rgba(255,183,77,0.15); color: #FFB74D; border: 0.5px solid rgba(255,183,77,0.3); }
  .badge-occupied { background: rgba(79,195,247,0.15); color: #4FC3F7; border: 0.5px solid rgba(79,195,247,0.3); }
  .badge-full { background: rgba(229,115,115,0.15); color: #E57373; border: 0.5px solid rgba(229,115,115,0.3); animation: shimmer 2s ease-in-out infinite; }
  .live-indicator { width: 8px; height: 8px; border-radius: 50%; background: #81C784; display: inline-block; animation: pulse 1.5s ease-in-out infinite; margin-right: 6px; }
  .room-cell { padding: 1rem; border-radius: 12px; border: 0.5px solid; cursor: pointer; transition: all 0.25s; }
  .room-cell:hover { transform: translateY(-2px); }
  .room-cell.available { background: rgba(129,199,132,0.08); border-color: rgba(129,199,132,0.2); }
  .room-cell.partial { background: rgba(255,183,77,0.08); border-color: rgba(255,183,77,0.2); }
  .room-cell.occupied { background: rgba(79,195,247,0.08); border-color: rgba(79,195,247,0.2); }
  .room-cell.full { background: rgba(229,115,115,0.12); border-color: rgba(229,115,115,0.25); }
  .occupancy-bar { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
  .occupancy-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .sparkline { width: 100%; height: 30px; display: inline-block; }
  .alert-box { padding: 0.85rem 1rem; background: rgba(229,115,115,0.1); border-left: 3px solid #E57373; border-radius: 0; margin-bottom: 0.75rem; display: flex; align-items: flex-start; gap: 10px; }
  .alert-icon { font-size: 1.1rem; flex-shrink: 0; }
  .alert-content { flex: 1; }
  .alert-title { font-size: 0.85rem; font-weight: 500; color: #E57373; }
  .alert-desc { font-size: 0.75rem; color: rgba(232,244,253,0.45); margin-top: 2px; }
  .filter-tag { display: inline-block; padding: 0.35rem 0.75rem; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 6px; font-size: 0.72rem; color: rgba(232,244,253,0.5); cursor: pointer; transition: all 0.15s; margin-right: 0.5rem; margin-bottom: 0.5rem; }
  .filter-tag:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.06); }
  .filter-tag.active { background: rgba(79,195,247,0.15); border-color: #4FC3F7; color: #4FC3F7; }
  .stat-box { padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.06); text-align: center; }
  .stat-value { font-family: 'DM Serif Display', serif; font-size: 1.6rem; color: #4FC3F7; line-height: 1; margin-bottom: 0.35rem; }
  .stat-label { font-size: 0.7rem; color: rgba(232,244,253,0.4); font-family: 'DM Mono', monospace; letter-spacing: 0.05em; text-transform: uppercase; }
  .anim-in { animation: fadeUp 0.4s ease both; }
  .anim-slide { animation: slideInRight 0.4s ease both; }
`;

const ROOMS = [
  { id: 1, name: "Lab B-204", floor: "B", building: "B Block", capacity: 40, type: "Lab" },
  { id: 2, name: "Hall A-101", floor: "A", building: "A Block", capacity: 80, type: "Lecture Hall" },
  { id: 3, name: "Room C-302", floor: "C", building: "C Block", capacity: 30, type: "Classroom" },
  { id: 4, name: "Library L1", floor: "L", building: "Library", capacity: 100, type: "Study Area" },
  { id: 5, name: "Study Pod S-01", floor: "S", building: "S Wing", capacity: 6, type: "Study Pod" },
  { id: 6, name: "Seminar S-201", floor: "S", building: "S Wing", capacity: 50, type: "Seminar" },
  { id: 7, name: "Lab D-101", floor: "D", building: "D Block", capacity: 35, type: "Lab" },
  { id: 8, name: "Hall A-102", floor: "A", building: "A Block", capacity: 80, type: "Lecture Hall" },
  { id: 9, name: "Room B-110", floor: "B", building: "B Block", capacity: 30, type: "Classroom" },
  { id: 10, name: "Lab E-201", floor: "E", building: "E Block", capacity: 40, type: "Lab" },
];

const BUILDINGS = ["All", "A Block", "B Block", "C Block", "D Block", "E Block", "Library", "S Wing"];

function getOccupancy(roomId, time) {
  const hour = Math.floor(time / 60);
  const minute = time % 60;
  const hash = (roomId * 7 + hour * 13 + minute) % 100;
  return Math.floor(hash / 10);
}

function getOccupancyStatus(occupied, capacity) {
  const pct = (occupied / capacity) * 100;
  if (pct >= 80) return "full";
  if (pct >= 50) return "occupied";
  if (pct > 0) return "partial";
  return "available";
}

function SparklineChart({ values }) {
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 30 - (v / max) * 25;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 30" className="sparkline" style={{ opacity: 0.7 }}>
      <polyline points={points} fill="none" stroke="#4FC3F7" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <circle cx={100 * (values.length - 1) / (values.length - 1 || 1)} cy={30 - (values[values.length - 1] / Math.max(...values, 1)) * 25} r="1.5" fill="#4FC3F7" />
    </svg>
  );
}

export default function RealTimeOccupancyPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedBuilding, setSelectedBuilding] = useState("All");
  const [liveMode, setLiveMode] = useState(true);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [occupancyHistory, setOccupancyHistory] = useState(() => {
    const history = {};
    ROOMS.forEach(r => {
      history[r.id] = Array.from({ length: 12 }, (_, i) => getOccupancy(r.id, (i - 11) * 30));
    });
    return history;
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setOccupancyHistory(prev => {
        const updated = { ...prev };
        ROOMS.forEach(r => {
          const minutes = new Date().getHours() * 60 + new Date().getMinutes();
          const newVal = getOccupancy(r.id, minutes);
          updated[r.id] = [...prev[r.id].slice(1), newVal];
        });
        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [liveMode]);

  const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const filteredRooms = ROOMS.filter(r => selectedBuilding === "All" || r.building === selectedBuilding);

  const occupancyData = filteredRooms.map(r => {
    const occupied = getOccupancy(r.id, minutes);
    const status = getOccupancyStatus(occupied, r.capacity);
    return { room: r, occupied, status };
  });

  const stats = {
    total: filteredRooms.length,
    available: occupancyData.filter(d => d.status === "available").length,
    highCapacity: occupancyData.filter(d => d.status === "full" || d.status === "occupied").length,
    alerts: occupancyData.filter(d => d.status === "full").length,
  };

  const sortedByOccupancy = [...occupancyData].sort((a, b) => b.occupied - a.occupied);
  const mostOccupied = sortedByOccupancy.slice(0, 3);
  const leastOccupied = sortedByOccupancy.slice(-3).reverse();

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", fontFamily: "'DM Sans', sans-serif", color: "#E8F4FD", padding: "2rem" }}>
      <style>{STYLES}</style>

      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* HEADER */}
        <div className="anim-in" style={{ marginBottom: "2rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              <span className="live-indicator" />Campus-Wide Monitoring
            </p>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.2rem", fontWeight: 400, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
              Live Occupancy Dashboard
            </h1>
            <p style={{ fontSize: "0.95rem", color: "rgba(232,244,253,0.45)" }}>
              Real-time room availability across campus • Updated every 30 seconds
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ textAlign: "right", marginRight: "1rem" }}>
              <div style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace" }}>Current Time</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#4FC3F7", marginTop: "0.2rem" }}>
                {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
            </div>
            <button className="btn-ghost" onClick={() => setLiveMode(!liveMode)} style={{
              borderColor: liveMode ? "#4FC3F7" : "rgba(255,255,255,0.12)",
              background: liveMode ? "rgba(79,195,247,0.1)" : "transparent",
              color: liveMode ? "#4FC3F7" : "rgba(232,244,253,0.6)",
              padding: "0.65rem 1.2rem",
            }}>
              {liveMode ? "🔴 LIVE" : "⏸ Paused"}
            </button>
          </div>
        </div>

        {/* STATS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Rooms", value: stats.total, color: "#4FC3F7", icon: "⬡" },
            { label: "Available", value: stats.available, color: "#81C784", icon: "✓" },
            { label: "High Capacity", value: stats.highCapacity, color: "#FFB74D", icon: "📊" },
            { label: "At Full", value: stats.alerts, color: "#E57373", icon: "🔴" },
          ].map((s, i) => (
            <div key={i} className="stat-box anim-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CRITICAL ALERTS */}
        {stats.alerts > 0 && (
          <div className="anim-in" style={{ marginBottom: "1.5rem" }}>
            {occupancyData.filter(d => d.status === "full").map((d, i) => (
              <div key={d.room.id} className="alert-box" style={{ animation: `fadeUp 0.4s ${i * 0.1}s ease both` }}>
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <div className="alert-title">{d.room.name} at full capacity</div>
                  <div className="alert-desc">
                    {d.room.capacity} occupants · {d.room.building} · Please use an alternative room or wait
                  </div>
                </div>
                <span className="badge badge-full">CRITICAL</span>
              </div>
            ))}
          </div>
        )}

        {/* FILTERS */}
        <div className="card anim-in" style={{ marginBottom: "1.5rem", animationDelay: "0.1s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(232,244,253,0.5)" }}>Filter by building:</span>
            {BUILDINGS.map((b, i) => (
              <button key={b} className={`filter-tag${selectedBuilding === b ? " active" : ""}`}
                onClick={() => setSelectedBuilding(b)}
                style={{ animation: `fadeUp 0.25s ${i * 0.04}s ease both` }}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "2rem", marginBottom: "2rem" }}>
          {/* MAIN GRID */}
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Room Status</span>
              <span style={{ fontSize: "0.75rem", color: "rgba(232,244,253,0.3)", fontWeight: 400 }}>{filteredRooms.length} rooms</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {occupancyData.map((d, i) => {
                const occupancyPct = (d.occupied / d.room.capacity) * 100;
                const isExpanded = expandedRoom === d.room.id;

                return (
                  <div key={d.room.id} className={`room-cell ${d.status}`}
                    onClick={() => setExpandedRoom(isExpanded ? null : d.room.id)}
                    style={{ animation: `fadeUp 0.35s ${i * 0.05}s ease both` }}>

                    <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <div>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: "0.15rem" }}>{d.room.name}</h3>
                        <div style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace" }}>
                          {d.room.building} · {d.room.type}
                        </div>
                      </div>
                      <span className={`badge badge-${d.status}`}>
                        {d.status === "available" ? "Free" : d.status === "partial" ? "Partial" : d.status === "occupied" ? "Busy" : "Full"}
                      </span>
                    </div>

                    <div style={{ marginBottom: "0.85rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(232,244,253,0.4)", marginBottom: "0.4rem" }}>
                        <span>Occupancy</span>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "0.95rem", color: d.status === "available" ? "#81C784" : d.status === "partial" ? "#FFB74D" : d.status === "occupied" ? "#4FC3F7" : "#E57373" }}>
                          {d.occupied}/{d.room.capacity}
                        </span>
                      </div>
                      <div className="occupancy-bar">
                        <div className="occupancy-fill" style={{
                          width: `${occupancyPct}%`,
                          background: d.status === "available" ? "#81C784" : d.status === "partial" ? "#FFB74D" : d.status === "occupied" ? "#4FC3F7" : "#E57373",
                        }} />
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(232,244,253,0.3)", marginTop: "0.35rem", fontFamily: "'DM Mono', monospace" }}>
                        {Math.round(occupancyPct)}% capacity
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.07)", animation: "fadeUp 0.3s ease" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "rgba(232,244,253,0.4)", fontFamily: "'DM Mono', monospace", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                          Occupancy Trend (Last 2 Hours)
                        </div>
                        <SparklineChart values={occupancyHistory[d.room.id]} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                          <div>
                            <div style={{ fontSize: "0.65rem", color: "rgba(232,244,253,0.35)" }}>Peak</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                              {Math.max(...occupancyHistory[d.room.id])}/{d.room.capacity}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.65rem", color: "rgba(232,244,253,0.35)" }}>Average</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                              {Math.round(occupancyHistory[d.room.id].reduce((a, b) => a + b, 0) / occupancyHistory[d.room.id].length)}/{d.room.capacity}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Most Occupied */}
            <div className="card anim-slide">
              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🔥 Peak Usage</span>
              </h3>
              {mostOccupied.map((d, i) => (
                <div key={d.room.id} style={{ padding: "0.75rem 0", borderBottom: i < mostOccupied.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none", animation: `fadeUp 0.3s ${i * 0.08}s ease both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.2rem" }}>{d.room.name}</div>
                      <div style={{ fontSize: "0.65rem", color: "rgba(232,244,253,0.35)" }}>{d.room.floor} floor</div>
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#FFB74D" }}>
                      {d.occupied}/{d.room.capacity}
                    </div>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(d.occupied / d.room.capacity) * 100}%`, background: "#FFB74D", borderRadius: "2px" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Least Occupied */}
            <div className="card anim-slide" style={{ animationDelay: "0.05s" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>✓ Available Now</span>
              </h3>
              {leastOccupied.map((d, i) => (
                <div key={d.room.id} style={{ padding: "0.75rem 0", borderBottom: i < leastOccupied.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none", animation: `fadeUp 0.35s ${i * 0.08}s ease both`, animationDelay: "0.05s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.2rem" }}>{d.room.name}</div>
                      <div style={{ fontSize: "0.65rem", color: "rgba(232,244,253,0.35)" }}>{d.room.type}</div>
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#81C784" }}>
                      {d.occupied}/{d.room.capacity}
                    </div>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(d.occupied / d.room.capacity) * 100}%`, background: "#81C784", borderRadius: "2px" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="card" style={{ background: "rgba(79,195,247,0.05)", border: "0.5px solid rgba(79,195,247,0.15)" }}>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(232,244,253,0.4)", fontFamily: "'DM Mono', monospace" }}>
                Status Legend
              </h3>
              {[
                { color: "#81C784", label: "Available", desc: "0–50%" },
                { color: "#FFB74D", label: "Partial", desc: "50–80%" },
                { color: "#4FC3F7", label: "Occupied", desc: "80–90%" },
                { color: "#E57373", label: "Full", desc: "90%+" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.6rem 0", borderBottom: i < 3 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: item.color }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: "0.65rem", color: "rgba(232,244,253,0.35)", fontFamily: "'DM Mono', monospace" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INFO FOOTER */}
        <div className="card" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)", marginTop: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
            {[
              { emoji: "🔄", title: "Auto-Refresh", desc: "Live data updates every 30 seconds" },
              { emoji: "📊", title: "Trend Analysis", desc: "Click any room to view occupancy history" },
              { emoji: "⚡", title: "Smart Alerts", desc: "Notifications when rooms reach 80%+ capacity" },
              { emoji: "🌍", title: "Campus-Wide", desc: "Monitor all 10 buildings in real time" },
            ].map((item, i) => (
              <div key={i} style={{ animation: `fadeUp 0.4s ${0.6 + i * 0.08}s ease both` }}>
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
