import './PasswordStrength.css';

const RULES = [
  { id: 'length',   label: 'At least 8 characters',        test: p => p.length >= 8 },
  { id: 'upper',    label: 'One uppercase letter (A-Z)',    test: p => /[A-Z]/.test(p) },
  { id: 'lower',    label: 'One lowercase letter (a-z)',    test: p => /[a-z]/.test(p) },
  { id: 'number',   label: 'One number (0-9)',              test: p => /[0-9]/.test(p) },
  { id: 'special',  label: 'One special character (!@#$…)', test: p => /[^A-Za-z0-9]/.test(p) },
];

export function getPasswordStrength(password) {
  const passed = RULES.filter(r => r.test(password)).length;
  if (passed <= 1) return { score: passed, label: 'Very Weak', color: '#ef4444' };
  if (passed === 2) return { score: passed, label: 'Weak',      color: '#f97316' };
  if (passed === 3) return { score: passed, label: 'Fair',      color: '#f59e0b' };
  if (passed === 4) return { score: passed, label: 'Strong',    color: '#22c55e' };
  return              { score: passed, label: 'Very Strong', color: '#10b981' };
}

export function isPasswordValid(password) {
  return RULES.every(r => r.test(password));
}

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const { score, label, color } = getPasswordStrength(password);
  const pct = (score / RULES.length) * 100;

  return (
    <div className="ps-wrapper">
      {/* Strength bar */}
      <div className="ps-bar-track">
        <div className="ps-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>

      {/* Label */}
      <p className="ps-label" style={{ color }}>
        {label}
      </p>

      {/* Rules checklist */}
      <ul className="ps-rules">
        {RULES.map(rule => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className={`ps-rule ${ok ? 'ps-rule--ok' : 'ps-rule--fail'}`}>
              <span className="ps-rule-icon">{ok ? '✅' : '○'}</span>
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
