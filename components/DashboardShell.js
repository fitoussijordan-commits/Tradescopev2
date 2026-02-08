'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

const menuItems = [
  { label: 'Analytics', items: [
    { path: '/dashboard', icon: '◈', name: 'Dashboard' },
    { path: '/trades', icon: '⬡', name: 'Trades' },
    { path: '/payouts', icon: '◇', name: 'Payouts' },
    { path: '/statistics', icon: '△', name: 'Stats Compte' },
    { path: '/global-stats', icon: '◎', name: 'Stats Globales', requiredPlan: ['pro', 'unlimited'] },
  ]},
  { label: 'Outils', items: [
    { path: '/playbook', icon: '▦', name: 'Playbook', requiredPlan: ['pro', 'unlimited'] },
    { path: '/account', icon: '◉', name: 'Mon Compte' },
  ]},
];

export default function DashboardShell({ user, profile, accounts, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const currentAccount = accounts[0]; // TODO: gestion multi-comptes avec state

  return (
    <div className="flex h-screen">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-60 bg-sidebar border-r border-brd flex flex-col fixed left-0 top-0 h-screen z-[100] transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        <div className="p-5 border-b border-brd flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-400 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-accent-glow">TS</div>
          <div className="font-display font-bold text-lg tracking-tight">TradeScope <span className="text-txt-2 font-medium text-[0.7rem] ml-1">v2</span></div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {menuItems.map((section) => (
            <div key={section.label} className="mb-5">
              <div className="text-[0.62rem] text-txt-3 uppercase tracking-[1.5px] font-semibold font-mono px-3 mb-1.5">{section.label}</div>
              {section.items.map((item) => {
                const locked = item.requiredPlan && !item.requiredPlan.includes(profile?.plan);
                const active = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={locked ? '/account' : item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[0.88rem] font-medium relative transition-all
                      ${active ? 'bg-accent-dim text-accent font-semibold' : 'text-txt-2 hover:bg-accent-dim hover:text-txt-1'}
                      ${locked ? 'opacity-40' : ''}`}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-accent rounded-r" />}
                    <span className="text-[1.05rem] w-[22px] text-center">{item.icon}</span>
                    <span>{item.name}</span>
                    {locked && <span className="ml-auto text-[0.6rem] bg-brd px-1.5 py-0.5 rounded text-txt-3">PRO</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-brd">
          <div className="text-[0.62rem] text-txt-3 uppercase tracking-wider font-mono px-3 mb-1.5">
            Plan: <span className="text-accent capitalize">{profile?.plan || 'Aucun'}</span>
          </div>
          <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-txt-2 hover:text-loss text-[0.85rem] rounded-lg hover:bg-loss-dim transition-all">
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="md:ml-60 flex-1 flex flex-col h-screen overflow-hidden">
        <div className="bg-bg-secondary border-b border-brd px-4 md:px-7 py-3 flex justify-between items-center min-h-[58px]">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-9 h-9 bg-bg-card border border-brd rounded-lg flex items-center justify-center text-txt-1">
              ☰
            </button>
            <h1 className="text-lg font-bold font-display tracking-tight">
              {menuItems.flatMap(s => s.items).find(i => i.path === pathname)?.name || 'Dashboard'}
            </h1>
            {currentAccount && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent-dim border border-accent/15 rounded-full text-[0.82rem]">
                <div className="w-1.5 h-1.5 bg-profit rounded-full" />
                <span className="font-bold">{currentAccount.name}</span>
                <span className="text-txt-2 text-[0.75rem]">{currentAccount.prop_firm}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-[0.82rem] font-semibold">{user.email}</div>
              <div className="text-[0.65rem] text-txt-3 font-mono uppercase tracking-wider">
                {profile?.subscription_status === 'trialing' ? '⏳ Essai gratuit' : profile?.plan?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
