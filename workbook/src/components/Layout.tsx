import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useApp, useData } from '../app/AppContext';
import { useUi } from '../app/UiContext';
import { SyncIndicator } from './SyncIndicator';
import { UseCaseDrawer } from './UseCases';

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#ffffff" fillOpacity="0.14" />
      <path d="M16 46V18h6l10 14 10-14h6v28h-7V30l-9 12-9-12v16z" fill="var(--accent)" />
    </svg>
  );
}

export function LiveNowBanner() {
  const { live, content } = useApp();
  const loc = useLocation();
  const s = content.sections.find((x) => x.key === live.current_section_key);
  if (!s) return null;
  const here = loc.pathname === `/s/${s.key}`;
  return (
    <div className="live-banner" role="region" aria-label="Live now">
      <span className="live-dot" aria-hidden="true" />
      <span>
        Live now: {s.number}. {s.title}
      </span>
      {here ? <span className="pill live">You are here</span> : <Link to={`/s/${s.key}`}>Jump there</Link>}
    </div>
  );
}

export function Layout() {
  const { roles, signOut, backend } = useApp();
  const data = useData();
  const { openDrawer } = useUi();
  const n = Object.keys(data.useCases).length;
  const isStaff = roles.includes('facilitator') || roles.includes('admin');

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <div className="bar">
          <Link to="/" className="brand">
            <BrandMark />
            <span className="brand-text">
              Summit Workbook
              <small>Main Street Event AI Summit</small>
            </span>
          </Link>
          <div className="header-actions">
            <SyncIndicator />
            <button type="button" className="header-btn" onClick={openDrawer} aria-haspopup="dialog">
              My use cases <span className="pill" aria-label={`${n} use cases`}>{n}</span>
            </button>
          </div>
        </div>
      </header>
      <nav className="app-nav" aria-label="Main">
        <ul>
          <li>
            <NavLink to="/" end>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/plan">My plan</NavLink>
          </li>
          <li>
            <NavLink to="/library">Library</NavLink>
          </li>
          <li>
            <NavLink to="/day-90">Day 90</NavLink>
          </li>
          {isStaff && (
            <li>
              <NavLink to="/dashboard">Dashboard</NavLink>
            </li>
          )}
          {roles.includes('admin') && (
            <li>
              <NavLink to="/admin">Admin</NavLink>
            </li>
          )}
          <li>
            <NavLink to="/my-data">My data</NavLink>
          </li>
          <li>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                signOut();
              }}
            >
              Sign out
            </a>
          </li>
        </ul>
      </nav>
      <LiveNowBanner />
      <Outlet />
      <UseCaseDrawer />
      <footer className="footer">
        Main Street Event AI Summit, November 13, 2026
        {backend.mode === 'demo' && <div>Demo mode: your entries are stored in this browser only.</div>}
      </footer>
    </>
  );
}
