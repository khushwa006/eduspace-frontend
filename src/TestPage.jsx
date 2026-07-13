export default function TestPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#07090F",
      color: "#E8F4FD",
      fontFamily: "'DM Sans', sans-serif",
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.5rem", marginBottom: "1rem" }}>
        ✅ EduSpace is Running!
      </h1>
      <p style={{ fontSize: "1.1rem", marginBottom: "2rem", maxWidth: "600px", textAlign: "center" }}>
        The routing and basic React setup is working correctly. Click the button below to test navigation.
      </p>
      
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/auth" style={{
          padding: "1rem 2rem",
          background: "linear-gradient(135deg, #4FC3F7, #1976D2)",
          color: "#07090F",
          textDecoration: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: "pointer",
          transition: "opacity 0.2s"
        }} onMouseOver={(e) => e.target.style.opacity = "0.8"} onMouseOut={(e) => e.target.style.opacity = "1"}>
          Go to Login
        </a>
        
        <button onClick={() => {
          localStorage.setItem("userRole", "Student");
          window.location.href = "/dashboard/student";
        }} style={{
          padding: "1rem 2rem",
          background: "rgba(129,199,132,0.2)",
          color: "#81C784",
          border: "1px solid #81C784",
          borderRadius: 8,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "1rem",
        }}>
          Test Student Dashboard
        </button>
      </div>

      <div style={{ marginTop: "3rem", textAlign: "center", color: "rgba(232,244,253,0.5)", fontSize: "0.9rem" }}>
        <p>If you can see this page, the routing is working! ✓</p>
        <p>The issue is with the EduSpaceHomepage component - it's being fixed.</p>
      </div>
    </div>
  );
}
