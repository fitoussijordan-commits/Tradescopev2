'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import EquityCurve from '@/components/EquityCurve';

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

  // Active accounts (non-burned) for capital + curves
  const activeAccounts = accounts.filter(a => !a.is_burned);

  const totalCapital = activeAccounts.reduce((s, a) => {
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

  // Day performance - detailed
  const dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  const dayStats = {};
  dayNames.forEach(d => dayStats[d] = { pnl: 0, trades: 0, wins: 0, losses: 0 });
  at.forEach(t => {
    const di = new Date(t.date).getDay();
    const name = dayNames[di === 0 ? 6 : di - 1];
    const pnl = parseFloat(t.pnl);
    dayStats[name].pnl += pnl;
    dayStats[name].trades++;
    if (pnl > 0) dayStats[name].wins++;
    else if (pnl < 0) dayStats[name].losses++;
  });
  const activeDays = dayNames.filter(d => dayStats[d].trades > 0);
  const dayRanking = [...activeDays].sort((a, b) => dayStats[b].pnl - dayStats[a].pnl);
  const maxDayPnl = Math.max(...activeDays.map(d => Math.abs(dayStats[d].pnl)), 1);

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
          { label: 'Capital Total', value: fmt(totalCapital), sub: `${activeAccounts.length} compte${activeAccounts.length > 1 ? 's' : ''} actif${activeAccounts.length > 1 ? 's' : ''}`, color: 'text-txt-1' },
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
        {/* Global Equity Curve - active accounts only */}
        <div className="bg-bg-card border border-brd rounded-xl p-5 lg:col-span-2">
          <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-3">Courbe de Progression Globale</h3>
          <EquityCurve trades={at.filter(t => activeAccounts.some(a => a.id === t.account_id))} baseCapital={activeAccounts.reduce((s, a) => s + parseFloat(a.base_capital), 0)} height={220} />
        </div>

        {/* Per-account equity curves - active only */}
        {activeAccounts.length > 1 && activeAccounts.map(a => {
          const accTrades = at.filter(t => t.account_id === a.id);
          if (accTrades.length < 2) return null;
          return (
            <div key={a.id} className="bg-bg-card border border-brd rounded-xl p-5">
              <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1">{a.name}</h3>
              <div className="text-[0.55rem] text-txt-3 font-mono mb-3">{a.prop_firm}</div>
              <EquityCurve trades={accTrades} baseCapital={parseFloat(a.base_capital)} height={160} />
            </div>
          );
        })}

        {/* Day performance - detailed */}
        <div className="bg-bg-card border border-brd rounded-xl p-5 lg:col-span-2">
          <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-4">Performance par Jour (Global)</h3>
          
          {activeDays.length > 0 ? (
            <>
              {/* Best / Worst summary */}
              {dayRanking.length >= 2 && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-profit/10 border border-profit/20 rounded-lg p-3 text-center">
                    <div className="text-[0.55rem] text-profit font-mono font-bold uppercase tracking-wider mb-1">🏆 Meilleur jour</div>
                    <div className="font-display font-bold text-lg">{dayRanking[0]}</div>
                    <div className="text-profit font-mono font-bold text-sm">{fmt(dayStats[dayRanking[0]].pnl)}</div>
                    <div className="text-txt-2 text-[0.65rem] mt-0.5">{dayStats[dayRanking[0]].trades} trades · {dayStats[dayRanking[0]].trades > 0 ? ((dayStats[dayRanking[0]].wins / dayStats[dayRanking[0]].trades) * 100).toFixed(0) : 0}% WR</div>
                  </div>
                  <div className="bg-loss/10 border border-loss/20 rounded-lg p-3 text-center">
                    <div className="text-[0.55rem] text-loss font-mono font-bold uppercase tracking-wider mb-1">⚠️ Pire jour</div>
                    <div className="font-display font-bold text-lg">{dayRanking[dayRanking.length - 1]}</div>
                    <div className="text-loss font-mono font-bold text-sm">{fmt(dayStats[dayRanking[dayRanking.length - 1]].pnl)}</div>
                    <div className="text-txt-2 text-[0.65rem] mt-0.5">{dayStats[dayRanking[dayRanking.length - 1]].trades} trades · {dayStats[dayRanking[dayRanking.length - 1]].trades > 0 ? ((dayStats[dayRanking[dayRanking.length - 1]].wins / dayStats[dayRanking[dayRanking.length - 1]].trades) * 100).toFixed(0) : 0}% WR</div>
                  </div>
                </div>
              )}

              {/* Bar chart + detail table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bars */}
                <div className="space-y-2.5">
                  {dayNames.filter(d => dayStats[d].trades > 0).map(d => (
                    <div key={d} className="flex items-center gap-3">
                      <span className="text-xs text-txt-2 w-10 font-mono font-semibold">{d.substring(0, 3)}</span>
                      <div className="flex-1 h-6 bg-bg-secondary rounded overflow-hidden">
                        <div className="h-full rounded transition-all" style={{ width: `${(Math.abs(dayStats[d].pnl) / maxDayPnl) * 100}%`, background: dayStats[d].pnl >= 0 ? 'var(--profit)' : 'var(--loss, #EF4444)' }} />
                      </div>
                      <span className={`text-xs font-mono font-bold w-16 text-right ${dayStats[d].pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {dayStats[d].pnl >= 0 ? '+' : ''}{dayStats[d].pnl.toFixed(0)}€
                      </span>
                    </div>
                  ))}
                </div>

                {/* Detail table */}
                <div>
                  <div className="grid grid-cols-5 gap-1 text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider mb-2 px-2">
                    <span>Jour</span><span className="text-center">Trades</span><span className="text-center">WR</span><span className="text-center">Moy/trade</span><span className="text-right">P&L</span>
                  </div>
                  <div className="space-y-1">
                    {dayRanking.map((d, i) => {
                      const s = dayStats[d];
                      const wr = s.trades > 0 ? ((s.wins / s.trades) * 100).toFixed(0) : 0;
                      const avg = s.trades > 0 ? s.pnl / s.trades : 0;
                      return (
                        <div key={d} className={`grid grid-cols-5 gap-1 items-center px-2 py-2 rounded-lg text-sm ${i === 0 ? 'bg-profit/10 border border-profit/15' : i === dayRanking.length - 1 ? 'bg-loss/10 border border-loss/15' : 'bg-bg-secondary'}`}>
                          <span className="font-bold text-xs">{d.substring(0, 3)}</span>
                          <span className="text-center font-mono text-xs">{s.trades}</span>
                          <span className={`text-center font-mono font-bold text-xs ${wr >= 50 ? 'text-profit' : 'text-loss'}`}>{wr}%</span>
                          <span className={`text-center font-mono text-xs ${avg >= 0 ? 'text-profit' : 'text-loss'}`}>{avg >= 0 ? '+' : ''}{avg.toFixed(0)}€</span>
                          <span className={`text-right font-mono font-bold text-xs ${s.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{s.pnl >= 0 ? '+' : ''}{s.pnl.toFixed(0)}€</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-txt-3 text-center text-sm py-8">Pas assez de données</div>
          )}
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
