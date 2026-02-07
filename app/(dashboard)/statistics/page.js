'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function StatisticsPage() {
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: a } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id).eq('is_burned', false).order('created_at');
    const { data: t } = await supabase.from('trades').select('*').eq('user_id', user.id).eq('is_payout', false);
    setAccounts(a || []);
    setTrades(t || []);
    if (a?.length && !currentAccountId) setCurrentAccountId(a[0].id);
    setLoading(false);
  };

  const at = trades.filter(t => t.account_id === currentAccountId);
  const account = accounts.find(a => a.id === currentAccountId);
  const fmt = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(v);

  // Day performance
  const dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  const dayPnl = {};
  dayNames.forEach(d => dayPnl[d] = 0);
  at.forEach(t => { const di = new Date(t.date).getDay(); dayPnl[dayNames[di === 0 ? 6 : di - 1]] += parseFloat(t.pnl); });
  const maxDay = Math.max(...Object.values(dayPnl).map(Math.abs), 1);

  // Long vs Short
  const longs = at.filter(t => t.type === 'LONG');
  const shorts = at.filter(t => t.type === 'SHORT');
  const longPnl = longs.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const shortPnl = shorts.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const longWR = longs.length > 0 ? ((longs.filter(t => t.pnl > 0).length / longs.length) * 100).toFixed(0) : 0;
  const shortWR = shorts.length > 0 ? ((shorts.filter(t => t.pnl > 0).length / shorts.length) * 100).toFixed(0) : 0;

  // Strategy
  const withStrat = at.filter(t => t.followed_strategy);
  const stratPct = at.length > 0 ? ((withStrat.length / at.length) * 100).toFixed(1) : 0;
  const withStratPnl = withStrat.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const withoutStrat = at.filter(t => !t.followed_strategy);
  const withoutStratPnl = withoutStrat.reduce((s, t) => s + parseFloat(t.pnl), 0);

  // R:R
  const rrTrades = at.filter(t => t.rr != null);
  const avgRR = rrTrades.length > 0 ? (rrTrades.reduce((s, t) => s + parseFloat(t.rr), 0) / rrTrades.length).toFixed(2) : null;
  const bestRR = rrTrades.length > 0 ? Math.max(...rrTrades.map(t => parseFloat(t.rr))).toFixed(2) : null;
  const worstRR = rrTrades.length > 0 ? Math.min(...rrTrades.map(t => parseFloat(t.rr))).toFixed(2) : null;

  // Best instruments
  const instPnl = {};
  at.forEach(t => { if (t.instrument) { instPnl[t.instrument] = (instPnl[t.instrument] || 0) + parseFloat(t.pnl); } });
  const topInstruments = Object.entries(instPnl).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3 mb-5">
        <select value={currentAccountId || ''} onChange={e => setCurrentAccountId(e.target.value)}
          className="bg-bg-card border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <span className="text-txt-3 text-sm">{at.length} trades</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Day Performance */}
        <div className="bg-bg-card border border-brd rounded-xl p-5">
          <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-4">Performance par Jour</h3>
          <div className="space-y-2.5">
            {dayNames.map(d => (
              <div key={d} className="flex items-center gap-3">
                <span className="text-xs text-txt-2 w-8 font-mono">{d.substring(0, 3)}</span>
                <div className="flex-1 h-5 bg-bg-secondary rounded overflow-hidden">
                  <div className="h-full rounded transition-all" style={{ width: `${(Math.abs(dayPnl[d]) / maxDay) * 100}%`, background: dayPnl[d] >= 0 ? 'var(--profit)' : 'var(--loss, #EF4444)' }} />
                </div>
                <span className={`text-xs font-mono font-bold w-16 text-right ${dayPnl[d] >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {dayPnl[d] >= 0 ? '+' : ''}{dayPnl[d].toFixed(0)}€
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Long vs Short */}
        <div className="bg-bg-card border border-brd rounded-xl p-5">
          <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-4">Long vs Short</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-profit-dim border border-profit/20 rounded-lg p-4 text-center">
              <div className="text-[0.65rem] font-mono text-profit font-bold mb-2">LONG</div>
              <div className={`text-xl font-bold font-display ${longPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(longPnl)}</div>
              <div className="text-xs text-txt-2 mt-1">{longs.length} trades | {longWR}% WR</div>
            </div>
            <div className="bg-loss-dim border border-loss/20 rounded-lg p-4 text-center">
              <div className="text-[0.65rem] font-mono text-loss font-bold mb-2">SHORT</div>
              <div className={`text-xl font-bold font-display ${shortPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(shortPnl)}</div>
              <div className="text-xs text-txt-2 mt-1">{shorts.length} trades | {shortWR}% WR</div>
            </div>
          </div>
        </div>

        {/* Strategy */}
        <div className="bg-bg-card border border-brd rounded-xl p-5">
          <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-4">Respect Stratégie</h3>
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold font-display ${stratPct >= 70 ? 'text-profit' : 'text-loss'}`}>{stratPct}%</div>
            <div className="text-xs text-txt-2">{withStrat.length} / {at.length} trades</div>
          </div>
          <div className="border-t border-brd pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-txt-3">Avec stratégie</span>
              <span className={`font-bold font-mono text-sm ${withStratPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(withStratPnl)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-txt-3">Sans stratégie</span>
              <span className={`font-bold font-mono text-sm ${withoutStratPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(withoutStratPnl)}</span>
            </div>
          </div>
        </div>

        {/* R:R */}
        <div className="bg-bg-card border border-brd rounded-xl p-5">
          <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-4">Risk:Reward</h3>
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold font-display ${avgRR && avgRR >= 0 ? 'text-profit' : avgRR ? 'text-loss' : 'text-txt-3'}`}>{avgRR ? `${avgRR}R` : '—'}</div>
            <div className="text-xs text-txt-2">{rrTrades.length > 0 ? `${rrTrades.length} / ${at.length} trades avec risque` : 'Aucun trade avec risque'}</div>
          </div>
          <div className="border-t border-brd pt-3 grid grid-cols-2 gap-3 text-center">
            <div><div className="text-[0.65rem] text-txt-3 font-mono mb-1">Meilleur</div><div className="font-bold font-mono text-profit">{bestRR ? `+${bestRR}R` : '—'}</div></div>
            <div><div className="text-[0.65rem] text-txt-3 font-mono mb-1">Pire</div><div className="font-bold font-mono text-loss">{worstRR ? `${worstRR}R` : '—'}</div></div>
          </div>
        </div>

        {/* Best Instruments */}
        <div className="bg-bg-card border border-brd rounded-xl p-5">
          <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-4">Meilleurs Instruments</h3>
          <div className="space-y-2">
            {topInstruments.length > 0 ? topInstruments.map(([inst, pnl]) => (
              <div key={inst} className="flex justify-between items-center p-2.5 bg-bg-secondary rounded-lg">
                <span className="font-semibold text-sm">{inst}</span>
                <span className={`font-mono font-bold text-sm ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}€</span>
              </div>
            )) : <div className="text-txt-3 text-center text-sm py-4">Pas de données</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
