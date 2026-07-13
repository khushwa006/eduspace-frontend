export default function EduSpaceHomepage({ onGetStarted }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '50px',
        background: 'linear-gradient(135deg, #2b1055 0%, #1a1a4e 50%, #0d1b4c 100%)',
        color: '#ffffff',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(3rem, 8vw, 6rem)',
          fontWeight: 800,
          marginBottom: '1.5rem',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        🏫 EduSpace Manager
      </h1>
      <p
        style={{
          fontSize: 'clamp(1.25rem, 3vw, 2rem)',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.85)',
          marginBottom: '2.5rem',
          maxWidth: '700px',
        }}
      >
        Smart Campus Monitoring & Engagement Platform
      </p>
      <button
        onClick={onGetStarted}
        style={{
          padding: '1rem 2.5rem',
          fontSize: '1.25rem',
          fontWeight: 600,
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(124,58,237,0.55)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.4)';
        }}
      >
        Get Started
      </button>
    </div>
  );
}
