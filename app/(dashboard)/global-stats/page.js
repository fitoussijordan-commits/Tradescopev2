'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function GlobalStatsPage() {
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: a } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id).order('created_at');
    const { data: t } = await supabase.from('trades').select('*').eq('user_id', user.id);
    setAccounts(a || []);
    setTrades(t || []);
    setLoading(false);
  };

  const at = trades.filter(t => !t.is_payout);
  const fmt = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(v);

  const totalCapital = accounts.reduce((s, a) => {
    const ap = trades.filter(t => t.account_id === a.id).reduce((s2, t) => s2 + parseFloat(t.pnl), 0);
    return s + parseFloat(a.base_capital) + ap;
  }, 0);
  const totalPnl = at.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const wins = at.filter(t => t.pnl > 0).length;
  const losses = at.filter(t => t.pnl < 0).length;
  const winRate = at.length > 0 ? ((wins / at.length) * 100).toFixed(1) : 0;

  // R:R global
  const rrTrades = at.filter(t => t.rr != null);
  const avgRR = rrTrades.length > 0 ? (rrTrades.reduce((s, t) => s + parseFloat(t.rr), 0) / rrTrades.length).toFixed(2) : null;

  // Day performance
  const dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  const dayPnl = {};
  dayNames.forEach(d => dayPnl[d] = 0);
  at.forEach(t => { const di = new Date(t.date).getDay(); dayPnl[dayNames[di === 0 ? 6 : di - 1]] += parseFloat(t.pnl); });
  const maxDay = Math.max(...Object.values(dayPnl).map(Math.abs), 1);

  // Account comparison
  const accountStats = accounts.map(a => {
    const atr = trades.filter(t => t.account_id === a.id && !t.is_payout);
    const allT = trades.filter(t => t.account_id === a.id);
    const ap = atr.reduce((s, t) => s + parseFloat(t.pnl), 0);
    const aw = atr.filter(t => t.pnl > 0).length;
    const awr = atr.length > 0 ? ((aw / atr.length) * 100).toFixed(1) : 0;
    const cap = parseFloat(a.base_capital) + allT.reduce((s, t) => s + parseFloat(t.pnl), 0);
    return { ...a, pnl: ap, trades: atr.length, wr: awr, capital: cap };
  }).sort((a, b) => b.pnl - a.pnl);

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="animate-fade-up">
      {/* Global metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Capital Total', value: fmt(totalCapital), sub: `${accounts.length} compte${accounts.length > 1 ? 's' : ''}`, color: 'text-txt-1' },
          { label: 'P&L Total', value: fmt(totalPnl), sub: `${at.length} trades`, color: totalPnl >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'Win Rate', value: `${winRate}%`, sub: `${wins}W / ${losses}L`, color: winRate >= 50 ? 'text-profit' : 'text-loss' },
          { label: 'R:R Moyen', value: avgRR ? `${avgRR}R` : '—', sub: `${rrTrades.length} trades`, color: avgRR >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'Meilleur Compte', value: accountStats[0]?.name || '—', sub: accountStats[0] ? fmt(accountStats[0].pnl) : '', color: accountStats[0]?.pnl >= 0 ? 'text-profit' : 'text-loss' },
        ].map(m => (
          <div key={m.label} className="relative bg-bg-card border border-brd rounded-xl p-4 transition-all hover:border-brd-hover overflow-hidden metric-glow">
            <div className="text-[0.68rem] text-txt-3 uppercase tracking-[1.2px] font-semibold font-mono mb-3">{m.label}</div>
            <div className={`text-xl font-bold font-display tracking-tight mb-1 ${m.color}`}>{m.value}</div>
            <div className={`text-[0.78rem] font-medium ${m.label === 'Meilleur Compte' ? m.color : 'text-txt-2'}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Day performance */}
        <div className="bg-bg-card border border-brd rounded-xl p-5">
          <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-4">Performance par Jour (Global)</h3>
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

        {/* Account comparison */}
        <div className="bg-bg-card border border-brd rounded-xl p-5">
          <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-4">Comparaison Comptes</h3>
          <div className="space-y-3">
            {accountStats.map(a => (
              <div key={a.id} className="bg-bg-secondary border border-brd rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold font-display">{a.name} {a.is_burned && <span className="text-[0.6rem] bg-loss text-white px-1.5 py-0.5 rounded ml-1">GRILLÉ</span>}</div>
                    <div className="text-txt-2 text-xs">{a.prop_firm}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold font-display ${a.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{a.pnl >= 0 ? '+' : ''}{fmt(a.pnl)}</div>
                    <div className="text-xs text-txt-2">{fmt(a.capital)}</div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span><span className="text-txt-3">Trades:</span> <strong>{a.trades}</strong></span>
                  <span><span className="text-txt-3">WR:</span> <strong className={a.wr >= 50 ? 'text-profit' : 'text-loss'}>{a.wr}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
