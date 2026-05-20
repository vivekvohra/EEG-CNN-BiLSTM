export function Footer() {
  return (
    <footer>
      <div className="muted small" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span>Built by Vivek Vohra | Software Developer</span>
        <span style={{ fontSize: "0.75rem", opacity: 0.8, display: "flex", alignItems: "center", gap: "0.4rem" }}>
          Powered by <i className="fab fa-react" style={{ color: "#61dafb" }} /> React &amp; <i className="fas fa-bolt" style={{ color: "#646cff" }} /> Vite
        </span>
      </div>
      <div className="social-links">
        <a href="https://github.com/vivekvohra" target="_blank" rel="noreferrer"><i className="fab fa-github" /></a>
        <a href="https://www.linkedin.com/in/vivek-vohra/" target="_blank" rel="noreferrer"><i className="fab fa-linkedin" /></a>
        <a href="mailto:vvkvohra1102@gmail.com"><i className="fas fa-envelope" /></a>
        <a href="https://iplusflow.com" target="_blank" rel="noreferrer" title="Portfolio Homepage"><i className="fas fa-globe" /></a>
      </div>
    </footer>
  );
}