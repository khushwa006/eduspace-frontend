import { useState, useEffect, useRef } from 'react';
import './DatePicker.css';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function DatePicker({ value, onChange, placeholder = 'Select date', minDate }) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const parseValue = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d) ? null : d;
  };

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear]   = useState((parseValue(value) || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((parseValue(value) || today).getMonth());
  const [yearInput, setYearInput] = useState(false);
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = parseValue(value);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const toISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };

  const selectDay = (day) => {
    const picked = new Date(viewYear, viewMonth, day);
    onChange(toISO(picked));
    setOpen(false);
  };

  const isDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    const min = minDate ? new Date(minDate) : today;
    min.setHours(0,0,0,0);
    return d < min;
  };

  const isToday = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    return d.toDateString() === today.toDateString();
  };

  const isSelected = (day) => {
    if (!selected) return false;
    return new Date(viewYear, viewMonth, day).toDateString() === selected.toDateString();
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); }
    else setViewMonth(m => m-1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); }
    else setViewMonth(m => m+1);
  };

  const displayValue = selected
    ? selected.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : '';

  // Build grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="dp-wrapper" ref={ref}>
      {/* Input trigger */}
      <div className={`dp-input ${open ? 'dp-input--open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="dp-icon">📅</span>
        <span className={`dp-value ${!displayValue ? 'dp-placeholder' : ''}`}>
          {displayValue || placeholder}
        </span>
        <span className="dp-chevron">{open ? '▲' : '▼'}</span>
      </div>

      {/* Calendar popup */}
      {open && (
        <div className="dp-popup">
          {/* Header */}
          <div className="dp-header">
            <button className="dp-nav" onClick={prevMonth}>‹</button>

            <div className="dp-month-year">
              <span className="dp-month-label">{MONTHS[viewMonth]}</span>
              {yearInput ? (
                <input
                  className="dp-year-input"
                  type="number"
                  value={viewYear}
                  onChange={e => setViewYear(parseInt(e.target.value)||viewYear)}
                  onBlur={() => setYearInput(false)}
                  autoFocus
                />
              ) : (
                <span className="dp-year-label" onClick={() => setYearInput(true)}>{viewYear}</span>
              )}
            </div>

            <button className="dp-nav" onClick={nextMonth}>›</button>
          </div>

          {/* Day names */}
          <div className="dp-day-names">
            {DAYS.map(d => <span key={d} className={d==='Sun'||d==='Sat' ? 'dp-weekend' : ''}>{d}</span>)}
          </div>

          {/* Date grid */}
          <div className="dp-grid">
            {cells.map((day, i) => (
              <button key={i}
                className={[
                  'dp-cell',
                  !day              ? 'dp-cell--empty'    : '',
                  day && isToday(day)    ? 'dp-cell--today'    : '',
                  day && isSelected(day) ? 'dp-cell--selected' : '',
                  day && isDisabled(day) ? 'dp-cell--disabled' : '',
                  day && (new Date(viewYear,viewMonth,day).getDay()===0 ||
                          new Date(viewYear,viewMonth,day).getDay()===6)
                    ? 'dp-cell--weekend' : '',
                ].join(' ')}
                disabled={!day || isDisabled(day)}
                onClick={() => day && !isDisabled(day) && selectDay(day)}
              >
                {day || ''}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="dp-footer">
            <button className="dp-today-btn" onClick={() => {
              setViewMonth(today.getMonth());
              setViewYear(today.getFullYear());
              selectDay(today.getDate());
            }}>Today</button>
            <button className="dp-clear-btn" onClick={() => { onChange(''); setOpen(false); }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
