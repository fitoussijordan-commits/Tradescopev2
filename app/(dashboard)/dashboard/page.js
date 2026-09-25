'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAccount } from '@/components/AccountContext';
import { Icon, LogoMark } from '@/components/Brand';

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
  const maxAbsDay = Math.max(1, ...Object.values(dayPnl).map(Math.abs));

  const selectedTrades = selectedDay ? (dayTrades[selectedDay] || []) : [];

  return (
    <div>
      <div className="card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display font-semibold text-lg flex items-center gap-2"><Icon name="calendar" size={18} className="text-txt-3" />Calendrier P&L</h3>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="chip !py-0.5">{tradingDays} jour{tradingDays > 1 ? 's' : ''} tradé{tradingDays > 1 ? 's' : ''}</span>
              <span className="chip !py-0.5 !text-profit !border-profit/20 !bg-profit-dim"><span className="w-1.5 h-1.5 rounded-full bg-profit" />{greenDays} vert{greenDays > 1 ? 's' : ''}</span>
              <span className="chip !py-0.5 !text-loss !border-loss/20 !bg-loss-dim"><span className="w-1.5 h-1.5 rounded-full bg-loss" />{redDays} rouge{redDays > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 self-start sm:self-auto rounded-xl border border-brd bg-bg-secondary p-1">
            <button onClick={() => { onPrev(); setSelectedDay(null); }} className="w-8 h-8 rounded-lg text-txt-2 hover:text-txt-1 hover:bg-bg-card-hover transition-all flex items-center justify-center" aria-label="Mois précédent"><Icon name="chevronLeft" size={16} /></button>
            <span className="text-sm font-medium min-w-[130px] text-center">{monthNames[month]} {year}</span>
            <button onClick={() => { onNext(); setSelectedDay(null); }} className="w-8 h-8 rounded-lg text-txt-2 hover:text-txt-1 hover:bg-bg-card-hover transition-all flex items-center justify-center" aria-label="Mois suivant"><Icon name="chevronRight" size={16} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2">
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
            <div key={d} className="text-center text-[0.68rem] text-txt-3 font-medium py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const pnl = dayPnl[day];
            const hasData = pnl !== undefined;
            const count = dayTrades[day]?.length || 0;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = day === selectedDay;

            // Intensité proportionnelle au P&L du jour (par rapport au plus gros jour du mois)
            const intensity = hasData ? 0.08 + 0.22 * Math.min(1, Math.abs(pnl) / maxAbsDay) : 0;
            const bgStyle = hasData && pnl > 0
              ? { backgroundColor: `rgb(var(--profit-rgb) / ${intensity})`, border: '1px solid rgb(var(--profit-rgb) / 0.28)' }
              : hasData && pnl < 0
              ? { backgroundColor: `rgb(var(--loss-rgb) / ${intensity})`, border: '1px solid rgb(var(--loss-rgb) / 0.28)' }
              : hasData
              ? { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--brd)' }
              : { border: '1px solid transparent' };

            return (
              <button key={day} onClick={() => hasData ? setSelectedDay(isSelected ? null : day) : null}
                style={bgStyle}
                className={`relative rounded-xl p-1.5 md:p-2.5 min-h-[56px] md:min-h-[84px] flex flex-col items-center md:items-start justify-center md:justify-between text-center md:text-left transition-all
                ${hasData ? 'cursor-pointer hover:-translate-y-0.5 active:scale-95' : 'cursor-default bg-bg-secondary/60'}
                ${isToday ? 'ring-1 ring-accent' : ''}
                ${isSelected ? 'ring-2 ring-accent -translate-y-0.5' : ''}
              `}>
                <span className={`text-[0.7rem] font-mono ${isToday ? 'text-accent font-semibold' : hasData ? 'text-txt-2' : 'text-txt-3'}`}>{day}</span>
                {hasData && (
                  <span className="flex flex-col items-center md:items-start">
                    <span className={`text-[0.65rem] md:text-[0.82rem] font-mono font-semibold mt-0.5 ${pnl > 0 ? 'text-profit' : pnl < 0 ? 'text-loss' : 'text-txt-3'}`}>
                      {pnl > 0 ? '+' : ''}{Math.abs(pnl) >= 1000 ? `${(pnl/1000).toFixed(1)}k` : pnl.toFixed(0)}€
                    </span>
                    <span className="hidden md:block text-[0.62rem] text-txt-3 mt-0.5">{count} trade{count > 1 ? 's' : ''}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-5 pt-5 border-t border-brd">
          <span className="text-txt-2 text-sm">Total du mois</span>
          <span className={`font-mono font-semibold text-xl ${monthPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {monthPnl >= 0 ? '+' : ''}{monthPnl.toFixed(2)}€
          </span>
        </div>
      </div>

      {/* Day detail MODAL */}
      {selectedDay && selectedTrades.length > 0 && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={() => setSelectedDay(null)} />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={() => setSelectedDay(null)}>
            <div className="bg-bg-card rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-fade-up" style={{ boxShadow: 'var(--shadow-pop)' }} onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-brd flex justify-between items-center">
                <div>
                  <div className="eyebrow mb-1">Détail du jour</div>
                  <h3 className="font-display font-semibold text-base first-letter:uppercase">
                    {new Date(year, month, selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <button onClick={() => setSelectedDay(null)} className="icon-btn" aria-label="Fermer"><Icon name="close" size={16} /></button>
              </div>

              <div className="p-5">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-bg-secondary border border-brd rounded-xl p-3">
                    <div className="eyebrow">P&L</div>
                    <div className={`text-xl font-semibold font-mono mt-1 ${dayPnl[selectedDay] >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {dayPnl[selectedDay] >= 0 ? '+' : ''}{dayPnl[selectedDay].toFixed(2)} €
                    </div>
                  </div>
                  <div className="bg-bg-secondary border border-brd rounded-xl p-3">
                    <div className="eyebrow">Trades</div>
                    <div className="text-xl font-semibold font-mono mt-1">{selectedTrades.length}</div>
                  </div>
                  <div className="bg-bg-secondary border border-brd rounded-xl p-3">
                    <div className="eyebrow">W / L</div>
                    <div className="text-xl font-semibold font-mono mt-1">
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
                        <span className="font-semibold text-sm">{t.instrument || '-'}</span>
                        <span className={`text-[0.62rem] font-semibold font-mono px-1.5 py-0.5 rounded-md ${t.type === 'LONG' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'}`}>{t.type}</span>
                        {t.size && <span className="text-[0.7rem] text-txt-3 font-mono">{t.size} lots</span>}
                      </div>
                      <span className={`font-semibold font-mono text-sm flex-shrink-0 ${parseFloat(t.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
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

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-14 w-64 rounded-xl bg-bg-card mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[...Array(5)].map((_, i) => <div key={i} className="card h-[112px]" />)}
      </div>
      <div className="card h-[520px]" />
    </div>
  );

  if (!currentAccount) {
    return (
      <div className="card max-w-lg mx-auto text-center px-6 py-14 mt-6">
        <LogoMark size={52} className="mx-auto mb-6" />
        <h2 className="font-display text-2xl font-semibold mb-2">Bienvenue sur TradeScope</h2>
        <p className="text-txt-2 mb-8">Crée ton premier compte de trading pour commencer à journaliser.</p>
        <a href="/account" className="btn-primary !px-6 !py-3">Créer un compte <Icon name="arrowRight" size={16} /></a>
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
        <div>
          <div className="eyebrow mb-1.5">{currentAccount.prop_firm || 'Compte'}</div>
          <h2 className="font-display text-2xl md:text-[1.75rem] font-semibold tracking-tight">{currentAccount.name}</h2>
        </div>
        <div className="text-sm text-txt-2 first-letter:uppercase">
          {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Capital Actuel', value: fmt(capital), sub: `${capitalChange >= 0 ? '▲' : '▼'} ${capitalChange >= 0 ? '+' : ''}${capitalChange}%`, color: capitalChange >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'P&L Total', value: fmt(totalPnl), sub: `${at.length} trades`, color: totalPnl >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'Win Rate', value: `${winRate}%`, sub: `${wins}W / ${losses}L`, color: winRate >= 50 ? 'text-profit' : 'text-loss' },
          { label: 'P&L Mensuel', value: fmt(monthlyPnl), sub: `${monthlyTrades.length} trades`, color: monthlyPnl >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'R:R Moyen', value: avgRR ? `${avgRR}R` : '—', sub: rrTrades.length > 0 ? `${rrTrades.length} trades` : 'Aucun risque', color: avgRR && avgRR >= 0 ? 'text-profit' : avgRR ? 'text-loss' : 'text-txt-3' },
        ].map((m, i) => (
          <div key={m.label} className={`relative card card-hover p-4 md:p-5 overflow-hidden metric-glow ${i === 0 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <div className="eyebrow mb-3">{m.label}</div>
            <div className={`text-xl md:text-[1.4rem] font-semibold font-mono tracking-tight leading-none mb-2 ${i === 0 ? 'text-txt-1' : m.color}`}>{m.value}</div>
            <div className={`text-[0.75rem] ${i === 0 ? m.color : 'text-txt-3'}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      <PnLCalendar trades={at} month={calMonth} year={calYear} onPrev={prevMonth} onNext={nextMonth} />
    </div>
  );
}
