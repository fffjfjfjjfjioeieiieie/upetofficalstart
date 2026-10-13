function PawLogo({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      role="img"
      aria-label="user.pet paw logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        <ellipse cx="27" cy="28" rx="10" ry="13" transform="rotate(-25 27 28)" />
        <ellipse cx="45" cy="17" rx="10" ry="13" transform="rotate(-8 45 17)" />
        <ellipse cx="64" cy="19" rx="10" ry="13" transform="rotate(8 64 19)" />
        <ellipse cx="81" cy="32" rx="10" ry="13" transform="rotate(25 81 32)" />
        <path d="M50 43c-10 0-14 10-22 18-8 8-7 20 1 27 6 6 14 5 21 1 7 4 15 5 21-1 8-7 9-19 1-27-8-8-12-18-22-18Z" />
      </g>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.7 5.2a18 18 0 0 0-4.4-1.4l-.6 1.2a16.5 16.5 0 0 0-5.4 0l-.6-1.2a18 18 0 0 0-4.4 1.4C1.5 9.3.7 13.3 1.1 17.2a18 18 0 0 0 5.4 2.7l1.2-2a11.5 11.5 0 0 1-1.9-.9l.5-.4a13 13 0 0 0 11.4 0l.5.4a11.5 11.5 0 0 1-1.9.9l1.2 2a18 18 0 0 0 5.4-2.7c.5-4.5-.8-8.5-3.2-12Zm-11 9.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"
      />
    </svg>
  );
}

export default function App() {
  return (
    <main className="page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="user.pet home">
          <PawLogo className="brand-paw" />
          <span>user.pet</span>
        </a>
      </header>

      <div className="paw-decoration paw-decoration-one" aria-hidden="true" />
      <div className="paw-decoration paw-decoration-two" aria-hidden="true" />

      <section className="hero" aria-labelledby="welcome-title">
        <PawLogo className="hero-paw" />
        <p className="eyebrow">WELCOME TO</p>
        <h1 id="welcome-title">user.pet</h1>
        <p className="message">This isn’t ready yet...</p>
        <p className="updates">
          Join <span>discord.gg/upet</span> for updates.
        </p>
        <a
          className="discord-button"
          href="https://discord.gg/upet"
          target="_blank"
          rel="noreferrer"
        >
          <DiscordIcon />
          <span>Join Discord</span>
          <span className="arrow" aria-hidden="true">→</span>
        </a>
      </section>

      <footer className="footer">
        <span>user.pet</span>
        <span className="footer-dot">•</span>
        <span>Coming Soon</span>
      </footer>
    </main>
  );
}
