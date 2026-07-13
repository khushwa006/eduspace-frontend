import { useState, useMemo } from 'react';
import './HolidayCalendar.css';

const WEEKDAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_LABELS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const toISO = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export default function HolidayCalendar({ holidays = [] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [expandedDate, setExpandedDate] = useState(null);

  const holidayMap = useMemo(() => {
    const map = {};
    holidays.forEach(h => { map[h.date] = h; });
    return map;
  }, [holidays]);

  const { cells, monthHolidays } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < firstDay; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);

    const inThisMonth = holidays
      .filter(h => h.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { cells: list, monthHolidays: inThisMonth };
  }, [viewYear, viewMonth, holidays]);

  const goPrev = () => {
    setExpandedDate(null);
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    setExpandedDate(null);
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => {
    setExpandedDate(null);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleDayClick = (iso, isHoliday) => {
    if (!isHoliday) return;
    setExpandedDate(prev => (prev === iso ? null : iso));
  };

  const isTodayCell = (d) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <div className="hcal">
      <div className="hcal-header">
        <button className="hcal-nav" onClick={goPrev}>‹</button>
        <div className="hcal-title">
          <span>{MONTH_LABELS[viewMonth]} {viewYear}</span>
          <button className="hcal-today-btn" onClick={goToday}>Today</button>
        </div>
        <button className="hcal-nav" onClick={goNext}>›</button>
      </div>

      <div className="hcal-weekdays">
        {WEEKDAY_LABELS.map(w => <div key={w} className="hcal-weekday">{w}</div>)}
      </div>

      <div className="hcal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} className="hcal-cell hcal-cell-blank" />;
          const iso = toISO(viewYear, viewMonth, d);
          const holiday = holidayMap[iso];
          const isSunday = new Date(viewYear, viewMonth, d).getDay() === 0;
          const expanded = expandedDate === iso;
          return (
            <button
              key={iso}
              className={`hcal-cell ${holiday ? 'hcal-holiday' : ''} ${isSunday ? 'hcal-sunday' : ''} ${isTodayCell(d) ? 'hcal-today' : ''} ${expanded ? 'hcal-expanded' : ''}`}
              onClick={() => handleDayClick(iso, !!holiday)}
              disabled={!holiday}
            >
              <span className="hcal-daynum">{d}</span>
              {holiday && <span className="hcal-dot" />}
            </button>
          );
        })}
      </div>

      {expandedDate && holidayMap[expandedDate] && (
        <div className="hcal-expand-panel">
          <span className="hcal-expand-icon">📅</span>
          <div>
            <p className="hcal-expand-name">{holidayMap[expandedDate].name}</p>
            <p className="hcal-expand-date">
              {new Date(expandedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      <div className="hcal-legend">
        <span><i className="hcal-swatch hcal-swatch-holiday"></i> Holiday</span>
        <span><i className="hcal-swatch hcal-swatch-sunday"></i> Sunday (weekly off)</span>
        <span><i className="hcal-swatch hcal-swatch-today"></i> Today</span>
      </div>

      {monthHolidays.length > 0 && (
        <div className="hcal-month-list">
          <h4>Holidays this month</h4>
          {monthHolidays.map(h => (
            <button key={h.id} className={`hcal-list-item ${expandedDate === h.date ? 'active' : ''}`}
              onClick={() => setExpandedDate(prev => (prev === h.date ? null : h.date))}>
              <span>{h.name}</span>
              <span className="hcal-list-date">{h.date}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
