import Link from 'next/link';
import { Logo, Icon } from './Brand';

const points = [
  'Journal de trades en 30 secondes',
  'R:R et P&L calculés automatiquement',
  'Stats par compte, sans jamais mélanger',
  'Playbook & score de discipline',
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-bg-primary grid lg:grid-cols-[1fr_1.1fr]">
      {/* Panneau marque (desktop) */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 border-r border-brd overflow-hidden bg-sidebar">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute inset-0 bg-halo opacity-80 pointer-events-none" />
        <Link href="/" className="relative"><Logo size={32} /></Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-semibold tracking-tight leading-[1.1] mb-8 text-gradient">
            Le journal de trading que tu vas enfin utiliser.
          </h2>
          <ul className="space-y-3.5">
            {points.map(p => (
              <li key={p} className="flex items-center gap-3 text-txt-2">
                <span className="w-5 h-5 rounded-full bg-accent-dim text-accent flex items-center justify-center flex-shrink-0"><Icon name="check" size={12} strokeWidth={3} /></span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-txt-3">&copy; {new Date().getFullYear()} TradeScope</p>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex justify-center mb-10"><Logo size={32} /></Link>
          <div className="mb-8">
            <h1 className="font-display text-[1.75rem] font-semibold tracking-tight mb-2">{title}</h1>
            <p className="text-txt-2 text-sm">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
