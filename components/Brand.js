// Identité TradeScope : un viseur (scope) posé sur une courbe qui monte.

export function LogoMark({ size = 32, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ts-mark-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9C8CFF" />
          <stop offset="1" stopColor="#5B3FF0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#ts-mark-bg)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" stroke="white" strokeOpacity="0.22" />
      <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="1.75" />
      <path d="M16 5.5v4M16 22.5v4M5.5 16h4M22.5 16h4" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M11.5 18.5l3-3 2 2 4-4.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ size = 32, showVersion = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display font-semibold text-[1.05rem] tracking-[-0.02em] text-txt-1">
        TradeScope
        {showVersion && <span className="ml-1.5 align-middle text-[0.62rem] font-mono font-medium text-txt-3 border border-brd rounded px-1 py-px">v2</span>}
      </span>
    </span>
  );
}

// Icônes au trait (24px, stroke 1.75) — jeu minimal pour l'app.
const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  trades: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  payouts: <><rect x="2.5" y="6" width="19" height="13" rx="2" /><circle cx="12" cy="12.5" r="2.5" /><path d="M6 10v.01M18 15v.01" /></>,
  stats: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  strategy: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  sparkles: <><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  playbook: <><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z" /><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3" /><path d="M9 8l1.5 1.5L13 7" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  logout: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  chevronDown: <><path d="M6 9l6 6 6-6" /></>,
  chevronLeft: <><path d="M15 6l-6 6 6 6" /></>,
  chevronRight: <><path d="M9 6l6 6-6 6" /></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7.5" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 17.5v.01" /></>,
  share: <><path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></>,
  wallet: <><path d="M3 7a2 2 0 0 1 2-2h13v4" /><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z" /><path d="M16 14.5h.01" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></>,
  target: <><circle cx="12" cy="12" r="9" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>,
};

export function Icon({ name, size = 18, className = '', strokeWidth = 1.75 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

// Squelette de chargement commun aux pages de l'app
export function PageLoader() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[0, 1, 2, 3].map(i => <div key={i} className="card h-[104px]" />)}
      </div>
      <div className="card h-[380px]" />
    </div>
  );
}
