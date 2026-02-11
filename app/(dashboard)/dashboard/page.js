import { createClient } from '@/lib/supabase-server';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: accounts } = await supabase
    .from('trading_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_burned', false);

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_payout', false)
    .order('date', { ascending: false });

  const allTrades = trades || [];
  const currentAccount = accounts?.[0];
  
  if (!currentAccount) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 opacity-40">◈</div>
        <h2 className="font-display text-xl font-bold mb-2">Bienvenue sur TradeScope !</h2>
        <p className="text-txt-2 mb-6">Crée ton premier compte de trading pour commencer.</p>
        <a href="/account" className="inline-flex px-6 py-3 bg-accent text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-glow">
          Créer un compte
        </a>
      </div>
    );
  }

  const accountTrades = allTrades.filter(t => t.account_id === currentAccount.id);
  const totalPnl = accountTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const capital = parseFloat(currentAccount.base_capital) + totalPnl;
  const wins = accountTrades.filter(t => t.pnl > 0).length;
  const losses = accountTrades.filter(t => t.pnl < 0).length;
  const winRate = accountTrades.length > 0 ? ((wins / accountTrades.length) * 100).toFixed(1) : 0;
  const capitalChange = ((capital - currentAccount.base_capital) / currentAccount.base_capital * 100).toFixed(2);

  // Monthly P&L
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyTrades = accountTrades.filter(t => new Date(t.date) >= monthStart);
  const monthlyPnl = monthlyTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);

  // R:R moyen
  const rrTrades = accountTrades.filter(t => t.rr != null);
  const avgRR = rrTrades.length > 0 ? (rrTrades.reduce((s, t) => s + parseFloat(t.rr), 0) / rrTrades.length).toFixed(2) : null;

  const fmt = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  return (
    <div className="animate-fade-up">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Capital Actuel', value: fmt(capital), sub: `${capitalChange >= 0 ? '▲' : '▼'} ${capitalChange >= 0 ? '+' : ''}${capitalChange}%`, color: capitalChange >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'P&L Total', value: fmt(totalPnl), sub: `${accountTrades.length} trades`, color: totalPnl >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'Win Rate', value: `${winRate}%`, sub: `${wins}W / ${losses}L`, color: winRate >= 50 ? 'text-profit' : 'text-loss' },
          { label: 'P&L Mensuel', value: fmt(monthlyPnl), sub: `${monthlyTrades.length} trades ce mois`, color: monthlyPnl >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'R:R Moyen', value: avgRR ? `${avgRR}R` : '—', sub: rrTrades.length > 0 ? `${rrTrades.length} trades` : 'Aucun risque saisi', color: avgRR && avgRR >= 0 ? 'text-profit' : avgRR ? 'text-loss' : 'text-txt-3' },
        ].map((m) => (
          <div key={m.label} className="relative bg-bg-card border border-brd rounded-xl p-4 md:p-5 transition-all hover:border-brd-hover hover:-translate-y-0.5 overflow-hidden metric-glow">
            <div className="text-[0.68rem] text-txt-3 uppercase tracking-[1.2px] font-semibold font-mono mb-3">{m.label}</div>
            <div className={`text-xl md:text-2xl font-bold font-display tracking-tight leading-tight mb-1 ${m.color}`}>{m.value}</div>
            <div className="text-[0.78rem] text-txt-2 font-medium">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Derniers trades */}
      <div className="bg-bg-card border border-brd rounded-xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-brd flex justify-between items-center">
          <span className="font-display font-bold text-[0.92rem]">Derniers Trades</span>
          <a href="/trades" className="text-accent text-sm font-semibold hover:underline">Voir tout →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-secondary">
              <tr>
                {['Date', 'Instrument', 'Type', 'Risque', 'P&L', 'R:R', 'Stratégie'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.62rem] uppercase tracking-[1.2px] text-txt-3 font-bold border-b border-brd font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accountTrades.slice(0, 10).map((t) => (
                <tr key={t.id} className="hover:bg-bg-card-hover transition-colors">
                  <td className="px-4 py-3 text-[0.82rem] font-mono text-txt-2">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 font-bold text-[0.88rem]">{t.instrument || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase font-mono tracking-wider ${t.type === 'LONG' ? 'bg-profit-dim text-profit' : 'bg-loss-dim text-loss'}`}>{t.type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[0.85rem] text-amber-400">{t.risk ? `${parseFloat(t.risk).toFixed(0)}€` : '-'}</td>
                  <td className={`px-4 py-3 font-bold font-mono text-[0.88rem] ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{t.pnl >= 0 ? '+' : ''}{parseFloat(t.pnl).toFixed(2)}€</td>
                  <td className={`px-4 py-3 font-bold font-mono text-[0.85rem] ${t.rr != null ? (t.rr >= 0 ? 'text-profit' : 'text-loss') : 'text-txt-3'}`}>{t.rr != null ? `${parseFloat(t.rr).toFixed(2)}R` : '-'}</td>
                  <td className="px-4 py-3 text-center">{t.followed_strategy ? <span className="text-profit">✓</span> : <span className="text-loss">✗</span>}</td>
                </tr>
              ))}
              {accountTrades.length === 0 && (
                <tr><td colSpan="7" className="text-center py-12 text-txt-3">
                  <div className="text-3xl mb-2 opacity-40">◈</div>
                  Aucun trade enregistré
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
