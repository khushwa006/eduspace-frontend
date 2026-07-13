import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('eduspace-theme');
    return saved ? saved === 'dark' : true; // default dark
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('eduspace-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Apply theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('eduspace-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <button
      className="theme-toggle"
      onClick={() => setIsDark(d => !d)}
      title={isDark
        ? 'Switch to Light Mode — better visibility in bright environments'
        : 'Switch to Dark Mode — reduces eye strain in low light'}
    >
      <span className="theme-toggle-icon">{isDark ? '☀️' : '🌙'}</span>
      <span className="theme-toggle-label">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
