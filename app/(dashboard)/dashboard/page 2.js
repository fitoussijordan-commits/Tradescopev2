'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAccount } from '@/components/AccountContext';

function PnLCalendar({ trades, month, year, onPrev, onNext }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const dayPnl = {};
  const dayTrades = {};
  trades.forEach(t => {
    const d = new Date(t.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      dayPnl[day] = (dayPnl[day] || 0) + parseFloat(t.pnl);
      if (!dayTrades[day]) dayTrades[day] = [];
      dayTrades[day].push(t);
    }
  });

  const monthNames = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthPnl = Object.values(dayPnl).reduce((s, v) => s + v, 0);
  const tradingDays = Object.keys(dayPnl).length;
  const greenDays = Object.values(dayPnl).filter(v => v > 0).length;
  const redDays = Object.values(dayPnl).filter(v => v < 0).length;

  const selectedTrades = selectedDay ? (dayTrades[selectedDay] || []) : [];

  return (
    <div>
      <div className="bg-bg-card border border-brd rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-lg">Calendrier P&L</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-txt-3 font-mono">
              <span>{tradingDays} jour{tradingDays > 1 ? 's' : ''}</span>
              <span className="text-profit">{greenDays} vert{greenDays > 1 ? 's' : ''}</span>
              <span className="text-loss">{redDays} rouge{redDays > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { onPrev(); setSelectedDay(null); }} className="w-8 h-8 rounded-lg border border-brd text-txt-2 hover:border-accent hover:text-accent transition-all text-sm flex items-center justify-center">◂</button>
            <span className="text-sm font-display font-bold min-w-[140px] text-center">{monthNames[month]} {year}</span>
            <button onClick={() => { onNext(); setSelectedDay(null); }} className="w-8 h-8 rounded-lg border border-brd text-txt-2 hover:border-accent hover:text-accent transition-all text-sm flex items-center justify-center">▸</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
            <div key={d} className="text-center text-[0.6rem] text-txt-3 font-mono font-bold py-1.5">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const pnl = dayPnl[day];
            const hasData = pnl !== undefined;
            const count = dayTrades[day]?.length || 0;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = day === selectedDay;

            const bgStyle = hasData && pnl > 0
              ? { backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }
              : hasData && pnl < 0
              ? { backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }
              : hasData
              ? { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--brd)' }
              : {};

            return (
              <button key={day} onClick={() => hasData ? setSelectedDay(isSelected ? null : day) : null}
                style={bgStyle}
                className={`relative rounded-xl p-1.5 min-h-[56px] md:min-h-[70px] flex flex-col items-center justify-center text-center transition-all
                ${hasData ? 'cursor-pointer hover:scale-[1.03] active:scale-95' : 'cursor-default'}
                ${!hasData ? 'bg-bg-secondary/30' : ''}
                ${isToday ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg-primary' : ''}
                ${isSelected ? 'ring-2 ring-accent scale-[1.03] shadow-lg' : ''}
              `}>
                <span className={`text-xs font-mono ${hasData ? 'font-bold' : 'text-txt-3'}`}>{day}</span>
                {hasData && (
                  <>
                    <span className={`text-[0.65rem] md:text-xs font-mono font-bold mt-0.5 ${pnl > 0 ? 'text-profit' : pnl < 0 ? 'text-loss' : 'text-txt-3'}`}>
                      {pnl > 0 ? '+' : ''}{Math.abs(pnl) >= 1000 ? `${(pnl/1000).toFixed(1)}k` : pnl.toFixed(0)}€
                    </span>
                    <span className="text-[0.45rem] text-txt-3 font-mono mt-0.5">{count} trade{count > 1 ? 's' : ''}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-brd">
          <span className="text-txt-3 text-xs font-mono">Total du mois</span>
          <span className={`font-mono font-bold text-lg ${monthPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {monthPnl >= 0 ? '+' : ''}{monthPnl.toFixed(2)}€
          </span>
        </div>
      </div>

      {/* Day detail MODAL */}
      {selectedDay && selectedTrades.length > 0 && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={() => setSelectedDay(null)} />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={() => setSelectedDay(null)}>
            <div className="bg-bg-card border border-brd rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-brd flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-base">
                    Trades — {new Date(year, month, selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <button onClick={() => setSelectedDay(null)} className="w-8 h-8 rounded-lg border border-brd text-txt-3 hover:text-txt-1 hover:border-accent transition-all text-sm flex items-center justify-center">✕</button>
              </div>

              <div className="p-5">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-bg-secondary border border-brd rounded-xl p-3">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">P&L</div>
                    <div className={`text-xl font-bold font-display ${dayPnl[selectedDay] >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {dayPnl[selectedDay] >= 0 ? '+' : ''}{dayPnl[selectedDay].toFixed(2)} €
                    </div>
                  </div>
                  <div className="bg-bg-secondary border border-brd rounded-xl p-3">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">Trades</div>
                    <div className="text-xl font-bold font-display">{selectedTrades.length}</div>
                  </div>
                  <div className="bg-bg-secondary border border-brd rounded-xl p-3">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">W / L</div>
                    <div className="text-xl font-bold font-display">
                      <span className="text-profit">{selectedTrades.filter(t => parseFloat(t.pnl) > 0).length}</span>
                      <span className="text-txt-3">/</span>
                      <span className="text-loss">{selectedTrades.filter(t => parseFloat(t.pnl) < 0).length}</span>
                    </div>
                  </div>
                </div>

                {/* Trade list */}
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {selectedTrades.map(t => (
                    <div key={t.id} className="bg-bg-secondary border border-brd rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-bold text-sm">{t.instrument || '-'}</span>
                        <span className={`text-[0.55rem] font-bold font-mono px-1.5 py-0.5 rounded ${t.type === 'LONG' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'}`}>{t.type}</span>
                        {t.size && <span className="text-[0.6rem] text-txt-3 font-mono">{t.size} lots</span>}
                      </div>
                      <span className={`font-bold font-mono text-sm flex-shrink-0 ${parseFloat(t.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {parseFloat(t.pnl) >= 0 ? '+' : ''}{parseFloat(t.pnl).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { currentAccount, currentAccountId } = useAccount();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  useEffect(() => { loadData(); }, [currentAccountId]);

  const loadData = async () => {
    if (!currentAccountId) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: t } = await supabase.from('trades').select('*').eq('user_id', user.id).eq('is_payout', false).order('date', { ascending: false });
    setTrades(t || []);
    setLoading(false);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  if (!currentAccount) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 opacity-40">◈</div>
        <h2 className="font-display text-xl font-bold mb-2">Bienvenue sur TradeScope !</h2>
        <p className="text-txt-2 mb-6">Cree ton premier compte de trading pour commencer.</p>
        <a href="/account" className="inline-flex px-6 py-3 bg-accent text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-glow">Creer un compte</a>
      </div>
    );
  }

  const at = trades.filter(t => t.account_id === currentAccountId);
  const totalPnl = at.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const capital = parseFloat(currentAccount.base_capital) + totalPnl;
  const wins = at.filter(t => t.pnl > 0).length;
  const losses = at.filter(t => t.pnl < 0).length;
  const winRate = at.length > 0 ? ((wins / at.length) * 100).toFixed(1) : 0;
  const capitalChange = ((capital - currentAccount.base_capital) / currentAccount.base_capital * 100).toFixed(2);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyTrades = at.filter(t => new Date(t.date) >= monthStart);
  const monthlyPnl = monthlyTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);

  const rrTrades = at.filter(t => t.rr != null);
  const avgRR = rrTrades.length > 0 ? (rrTrades.reduce((s, t) => s + parseFloat(t.rr), 0) / rrTrades.length).toFixed(2) : null;

  const fmt = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="animate-fade-up">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Capital Actuel', value: fmt(capital), sub: `${capitalChange >= 0 ? '▲' : '▼'} ${capitalChange >= 0 ? '+' : ''}${capitalChange}%`, color: capitalChange >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'P&L Total', value: fmt(totalPnl), sub: `${at.length} trades`, color: totalPnl >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'Win Rate', value: `${winRate}%`, sub: `${wins}W / ${losses}L`, color: winRate >= 50 ? 'text-profit' : 'text-loss' },
          { label: 'P&L Mensuel', value: fmt(monthlyPnl), sub: `${monthlyTrades.length} trades`, color: monthlyPnl >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'R:R Moyen', value: avgRR ? `${avgRR}R` : '—', sub: rrTrades.length > 0 ? `${rrTrades.length} trades` : 'Aucun risque', color: avgRR && avgRR >= 0 ? 'text-profit' : avgRR ? 'text-loss' : 'text-txt-3' },
        ].map((m) => (
          <div key={m.label} className="relative bg-bg-card border border-brd rounded-xl p-4 transition-all hover:border-brd-hover overflow-hidden metric-glow">
            <div className="text-[0.62rem] text-txt-3 uppercase tracking-[1.2px] font-semibold font-mono mb-2">{m.label}</div>
            <div className={`text-lg md:text-xl font-bold font-display tracking-tight leading-tight mb-0.5 ${m.color}`}>{m.value}</div>
            <div className="text-[0.72rem] text-txt-2 font-medium">{m.sub}</div>
          </div>
        ))}
      </div>

      <PnLCalendar trades={at} month={calMonth} year={calYear} onPrev={prevMonth} onNext={nextMonth} />
    </div>
  );
}
