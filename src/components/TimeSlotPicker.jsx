import { useState, useRef, useEffect } from 'react';
import './TimeSlotPicker.css';

// Decide AM/PM group from slot label
function getGroup(label = '') {
  const l = label.toLowerCase();
  if (l.includes('12:00 pm') || l.includes('12:30 pm')) return 'Afternoon';
  if (l.includes('am')) return 'Morning';
  if (l.includes('pm')) {
    const hour = parseInt(l);
    return hour >= 5 ? 'Evening' : 'Afternoon';
  }
  return 'Other';
}

const GROUP_ORDER = ['Morning', 'Afternoon', 'Evening', 'Other'];
const GROUP_ICONS = { Morning: '🌅', Afternoon: '☀️', Evening: '🌆', Other: '🕐' };

export default function TimeSlotPicker({ slots = [], value, onChange, placeholder = 'Select time slot' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = slots.find(s => s.id === value || String(s.id) === String(value));

  // Group slots
  const groups = {};
  slots.forEach(slot => {
    const g = getGroup(slot.slot_name);
    if (!groups[g]) groups[g] = [];
    groups[g].push(slot);
  });

  const handleSelect = (slot) => {
    onChange(slot.id);
    setOpen(false);
  };

  return (
    <div className="tsp-wrapper" ref={ref}>
      {/* Trigger */}
      <div className={`tsp-input ${open ? 'tsp-input--open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="tsp-icon">⏰</span>
        <span className={`tsp-value ${!selected ? 'tsp-placeholder' : ''}`}>
          {selected ? selected.slot_name : placeholder}
        </span>
        <span className="tsp-chevron">{open ? '▲' : '▼'}</span>
      </div>

      {/* Popup */}
      {open && (
        <div className="tsp-popup">
          {slots.length === 0 ? (
            <p className="tsp-empty">No time slots available</p>
          ) : (
            GROUP_ORDER.filter(g => groups[g]).map(group => (
              <div key={group} className="tsp-group">
                <div className="tsp-group-label">
                  <span>{GROUP_ICONS[group]}</span>
                  <span>{group}</span>
                </div>
                <div className="tsp-slots">
                  {groups[group].map(slot => (
                    <button
                      key={slot.id}
                      className={`tsp-slot ${String(slot.id) === String(value) ? 'tsp-slot--selected' : ''}`}
                      onClick={() => handleSelect(slot)}
                      type="button"
                    >
                      <span className="tsp-slot-time">{slot.slot_name}</span>
                      {String(slot.id) === String(value) && <span className="tsp-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
