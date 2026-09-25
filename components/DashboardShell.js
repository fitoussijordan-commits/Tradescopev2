'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { AccountProvider, useAccount } from './AccountContext';
import { Logo, LogoMark, Icon } from './Brand';

const menuItems = [
  { label: 'Analytics', items: [
    { path: '/dashboard', icon: 'dashboard', name: 'Dashboard' },
    { path: '/trades', icon: 'trades', name: 'Trades' },
    { path: '/payouts', icon: 'payouts', name: 'Payouts' },
    { path: '/statistics', icon: 'stats', name: 'Stats Compte' },
    { path: '/global-stats', icon: 'globe', name: 'Stats Globales', requiredPlan: ['pro', 'unlimited'] },
    { path: '/strategies', icon: 'strategy', name: 'Stratégies' },
    { path: '/ai-analysis', icon: 'sparkles', name: 'Analyse IA' },
  ]},
  { label: 'Outils', items: [
    { path: '/playbook', icon: 'playbook', name: 'Playbook', requiredPlan: ['pro', 'unlimited'] },
    { path: '/export', icon: 'download', name: 'Export Excel', requiredPlan: ['unlimited'] },
    { path: '/account', icon: 'user', name: 'Mon Compte' },
  ]},
];

function getInitials(email, name) {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  return email ? email.substring(0, 2).toUpperCase() : '??';
}

function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const saved = localStorage.getItem('ts-theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('ts-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };
  return (
    <button onClick={toggle} className="icon-btn" title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'} aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}

function AccountSelector() {
  const { accounts, currentAccountId, selectAccount } = useAccount();
  const activeAccounts = (accounts || []).filter(a => !a.is_burned);
  if (activeAccounts.length === 0) return null;
  return (
    <select value={currentAccountId || ''} onChange={e => selectAccount(e.target.value)}
      className="hidden md:block bg-bg-card border border-brd hover:border-brd-hover !rounded-full pl-3.5 py-1.5 text-[0.8rem] font-medium text-txt-1 cursor-pointer transition-colors">
      {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name} — {a.prop_firm}</option>)}
    </select>
  );
}

function MobileAccountSelector() {
  const { accounts, currentAccountId, selectAccount } = useAccount();
  const activeAccounts = (accounts || []).filter(a => !a.is_burned);
  if (activeAccounts.length === 0) return null;
  return (
    <select value={currentAccountId || ''} onChange={e => selectAccount(e.target.value)}
      className="md:hidden bg-bg-card border border-brd pl-2.5 py-1.5 text-[0.75rem] font-medium text-txt-1 max-w-[150px] truncate">
      {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
  );
}

function IOSInstallBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    const dismissed = localStorage.getItem('ts-pwa-dismissed');
    if (isIOS && !isStandalone && !dismissed) setShow(true);
  }, []);
  const dismiss = () => { setShow(false); localStorage.setItem('ts-pwa-dismissed', '1'); };
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-bg-card border border-brd rounded-2xl p-4 z-[300] animate-fade-up" style={{ boxShadow: 'var(--shadow-pop)' }}>
      <button onClick={dismiss} className="absolute top-3 right-3 text-txt-3 hover:text-txt-1" aria-label="Fermer"><Icon name="close" size={16} /></button>
      <div className="flex items-start gap-3">
        <LogoMark size={40} className="flex-shrink-0" />
        <div>
          <div className="font-semibold text-sm mb-1">Installer TradeScope</div>
          <div className="text-txt-2 text-xs leading-relaxed">
            Tape <Icon name="share" size={13} className="inline -mt-0.5 mx-0.5" /> puis <strong className="text-txt-1">« Sur l'écran d'accueil »</strong> pour installer l'app
          </div>
        </div>
      </div>
    </div>
  );
}

function TrialBanner({ profile }) {
  if (!profile?.trial_ends_at || profile?.subscription_status !== 'trialing') return null;

  const trialEnd = new Date(profile.trial_ends_at);
  const now = new Date();
  const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
  const totalDays = 7;
  const daysPassed = Math.max(totalDays - daysLeft, 0);
  const progress = Math.min((daysPassed / totalDays) * 100, 100);

  if (daysLeft <= 0) return null;
  const isUrgent = daysLeft <= 2;

  return (
    <div className={`px-4 md:px-8 py-2 border-b flex items-center justify-between gap-3 text-xs ${
      isUrgent ? 'bg-loss-dim border-loss/20 text-loss' : 'bg-accent-dim border-accent/15 text-accent'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex-shrink-0 font-medium flex items-center gap-1.5">
          <Icon name={isUrgent ? 'alert' : 'clock'} size={14} />
          Essai gratuit · jour {daysPassed}/{totalDays} · {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
        </span>
        <div className="hidden sm:block w-32 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'color-mix(in srgb, currentColor 18%, transparent)' }}>
          <div className={`h-full rounded-full ${isUrgent ? 'bg-loss' : 'bg-accent'}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
      <Link href="/account" className={`flex-shrink-0 font-semibold px-3 py-1 rounded-lg text-white text-xs transition-all inline-flex items-center gap-1 ${isUrgent ? 'bg-loss hover:bg-loss/90' : 'bg-accent-strong hover:bg-accent'}`}>
        Choisir un plan <Icon name="arrowRight" size={12} strokeWidth={2.25} />
      </Link>
    </div>
  );
}

function ShellInner({ user, profile, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const { currentAccount } = useAccount();

  const initials = getInitials(user.email, profile?.full_name || user.user_metadata?.full_name);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`w-64 bg-sidebar border-r border-brd flex flex-col fixed left-0 top-0 h-screen z-[100] transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        <div className="h-16 px-5 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size={28} showVersion />
          </Link>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-txt-3 hover:text-txt-1" aria-label="Fermer le menu">
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 pt-2 pb-3 overflow-y-auto">
          {menuItems.map((section) => (
            <div key={section.label} className="mb-6">
              <div className="eyebrow px-3 mb-2">{section.label}</div>
              {section.items.map((item) => {
                const isTrialing = profile?.subscription_status === 'trialing' &&
                                   profile?.trial_ends_at &&
                                   new Date(profile.trial_ends_at) > new Date();
                const effectivePlan = (isTrialing || profile?.subscription_status === 'active') ? profile?.plan : 'none';
                const locked = item.requiredPlan && !item.requiredPlan.includes(effectivePlan);
                const active = pathname === item.path;
                return (
                  <Link key={item.path} href={locked ? '/account' : item.path} onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2 mb-0.5 rounded-xl text-[0.875rem] relative transition-all
                      ${active ? 'bg-bg-card text-txt-1 font-medium border border-brd' : 'text-txt-2 hover:bg-bg-card-hover hover:text-txt-1 border border-transparent'}
                      ${locked ? 'opacity-50' : ''}`}
                    style={active ? { boxShadow: 'var(--shadow-card)' } : undefined}>
                    <Icon name={item.icon} size={17} className={active ? 'text-accent' : 'text-txt-3 group-hover:text-txt-2 transition-colors'} />
                    <span>{item.name}</span>
                    {locked && <span className="ml-auto inline-flex items-center gap-1 text-[0.62rem] font-medium text-txt-3 border border-brd px-1.5 py-0.5 rounded-md"><Icon name="lock" size={10} strokeWidth={2} />PRO</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-brd">
          <Link href="/account" onClick={() => setMobileOpen(false)} className="block rounded-xl border border-brd bg-bg-card p-3 mb-2 hover:border-brd-hover transition-colors">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Plan</span>
              <span className="text-[0.7rem] font-medium text-accent capitalize">{profile?.plan || 'Aucun'}</span>
            </div>
            {profile?.plan !== 'unlimited' && (
              <div className="text-[0.72rem] text-txt-2 mt-1.5 flex items-center gap-1">Débloquer plus d'outils <Icon name="arrowRight" size={11} /></div>
            )}
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 text-txt-2 hover:text-loss text-[0.85rem] rounded-xl hover:bg-loss-dim transition-all">
            <Icon name="logout" size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="md:ml-64 flex-1 flex flex-col h-screen overflow-hidden w-full min-w-0">
        <div className="bg-bg-primary/80 backdrop-blur-xl border-b border-brd px-3 md:px-8 flex justify-between items-center h-16 gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-shrink">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden icon-btn flex-shrink-0" aria-label="Ouvrir le menu">
              <Icon name="menu" size={18} />
            </button>
            <h1 className="text-base md:text-[1.15rem] font-semibold font-display tracking-tight truncate">
              {menuItems.flatMap(s => s.items).find(i => i.path === pathname)?.name || 'Dashboard'}
            </h1>
            <AccountSelector />
            <MobileAccountSelector />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-bg-card border border-transparent hover:border-brd transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-[#9C8CFF] to-[#5B3FF0] rounded-full flex items-center justify-center text-white text-xs font-semibold ring-2 ring-bg-primary flex-shrink-0">
                  {initials}
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-[0.82rem] font-medium leading-tight truncate max-w-[140px]">{profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0]}</div>
                  <div className="text-[0.68rem] text-txt-3">
                    {profile?.subscription_status === 'trialing' ? 'Essai gratuit' : profile?.plan?.toUpperCase() || 'GRATUIT'}
                  </div>
                </div>
                <Icon name="chevronDown" size={14} className={`text-txt-3 transition-transform hidden md:block ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-bg-card rounded-2xl overflow-hidden z-50 animate-fade-up" style={{ boxShadow: 'var(--shadow-pop)' }}>
                  <div className="p-3 border-b border-brd">
                    <div className="text-sm font-medium truncate">{user.email}</div>
                    <div className="text-[0.72rem] text-txt-3 mt-0.5">Plan <span className="capitalize">{profile?.plan || 'aucun'}</span></div>
                  </div>
                  <div className="p-1.5">
                    <Link href="/account" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-txt-2 hover:bg-bg-card-hover hover:text-txt-1 transition-all">
                      <Icon name="user" size={16} /> Mon compte
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-loss hover:bg-loss-dim transition-all text-left">
                      <Icon name="logout" size={16} /> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <TrialBanner profile={profile} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 md:px-8 md:py-7">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
      <IOSInstallBanner />
    </div>
  );
}

export default function DashboardShell({ user, profile, accounts, children }) {
  return (
    <AccountProvider accounts={accounts}>
      <ShellInner user={user} profile={profile}>
        {children}
      </ShellInner>
    </AccountProvider>
  );
}
