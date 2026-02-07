'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], instrument: 'NQ', type: 'LONG', pnl: '', risk: '', size: '', trading_view_link: '', followed_strategy: false, notes: '', is_payout: false });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: a } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id).eq('is_burned', false).order('created_at');
    const { data: t } = await supabase.from('trades').select('*').eq('user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false });
    setAccounts(a || []);
    setTrades(t || []);
    if (a?.length && !currentAccountId) setCurrentAccountId(a[0].id);
    setLoading(false);
  };

  const addTrade = async (e) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const account = accounts.find(a => a.id === currentAccountId);
    if (!account || !user) return;

    const pnl = parseFloat(form.pnl);
    const risk = parseFloat(form.risk) || null;
    const accountTrades = trades.filter(t => t.account_id === currentAccountId);
    const currentCapital = parseFloat(account.base_capital) + accountTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
    const pnlPercent = (pnl / currentCapital) * 100;

    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: currentAccountId,
        date: form.date,
        instrument: form.is_payout ? null : form.instrument,
        type: form.is_payout ? null : form.type,
        pnl: form.is_payout && pnl > 0 ? -pnl : pnl,
        risk,
        pnl_percent: pnlPercent,
        size: parseFloat(form.size) || null,
        trading_view_link: form.trading_view_link || null,
        followed_strategy: form.followed_strategy,
        notes: form.notes || null,
        is_payout: form.is_payout,
      }),
    });

    if (res.ok) {
      setShowModal(false);
      setForm({ date: new Date().toISOString().split('T')[0], instrument: 'NQ', type: 'LONG', pnl: '', risk: '', size: '', trading_view_link: '', followed_strategy: false, notes: '', is_payout: false });
      loadData();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const deleteTrade = async (id) => {
    if (!confirm('Supprimer ce trade ?')) return;
    await fetch(`/api/trades?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  const accountTrades = trades.filter(t => t.account_id === currentAccountId && !t.is_payout);
  const filtered = accountTrades.filter(t => {
    if (filter === 'wins') return t.pnl > 0;
    if (filter === 'losses') return t.pnl < 0;
    if (filter === 'month') { const now = new Date(); const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }
    if (filter === 'week') { const now = new Date(); const weekAgo = new Date(now - 7 * 86400000); return new Date(t.date) >= weekAgo; }
    return true;
  });

  const fmt = (v) => `${parseFloat(v) >= 0 ? '+' : ''}${parseFloat(v).toFixed(2)}€`;

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={currentAccountId || ''} onChange={e => setCurrentAccountId(e.target.value)}
            className="bg-bg-card border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="flex gap-1.5 overflow-x-auto">
            {[['all','Tout'],['month','Mois'],['week','Semaine'],['wins','Wins'],['losses','Losses']].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === k ? 'bg-accent text-white' : 'bg-bg-card border border-brd text-txt-2 hover:border-accent'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-lg hover:opacity-90 shadow-lg shadow-accent/25 transition-all">
          + Trade
        </button>
      </div>

      {/* Table */}
      <div className="bg-bg-card border border-brd rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-secondary">
              <tr>
                {['Date','Instrument','Type','Taille','Risque','P&L','R:R','% Capital','Strat.','Chart',''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.62rem] uppercase tracking-[1.2px] text-txt-3 font-bold border-b border-brd font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-bg-card-hover transition-colors">
                  <td className="px-4 py-3 text-[0.82rem] font-mono text-txt-2">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 font-bold text-[0.88rem]">{t.instrument || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase font-mono tracking-wider ${t.type === 'LONG' ? 'bg-profit-dim text-profit' : 'bg-loss-dim text-loss'}`}>{t.type || '-'}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[0.85rem]">{t.size || '-'}</td>
                  <td className="px-4 py-3 font-mono text-[0.85rem] text-amber-400">{t.risk ? `${parseFloat(t.risk).toFixed(0)}€` : '-'}</td>
                  <td className={`px-4 py-3 font-bold font-mono text-[0.88rem] ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(t.pnl)}</td>
                  <td className={`px-4 py-3 font-bold font-mono text-[0.85rem] ${t.rr != null ? (t.rr >= 0 ? 'text-profit' : 'text-loss') : 'text-txt-3'}`}>{t.rr != null ? `${parseFloat(t.rr).toFixed(2)}R` : '-'}</td>
                  <td className={`px-4 py-3 font-mono text-[0.85rem] ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{t.pnl_percent ? `${parseFloat(t.pnl_percent).toFixed(2)}%` : '-'}</td>
                  <td className="px-4 py-3 text-center">{t.followed_strategy ? <span className="text-profit">✓</span> : <span className="text-loss">✗</span>}</td>
                  <td className="px-4 py-3">{t.trading_view_link ? <a href={t.trading_view_link} target="_blank" className="text-accent hover:underline">↗</a> : '-'}</td>
                  <td className="px-4 py-3"><button onClick={() => deleteTrade(t.id)} className="text-txt-3 hover:text-loss transition-colors text-lg">×</button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="11" className="text-center py-12 text-txt-3"><div className="text-3xl mb-2 opacity-40">◈</div>Aucun trade</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 mt-4">
        {filtered.map(t => (
          <div key={t.id} className="bg-bg-card border border-brd rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold">{t.instrument || '-'}</div>
                <div className="text-[0.78rem] text-txt-2 font-mono">{new Date(t.date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div className={`text-lg font-bold font-mono ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(t.pnl)}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div><span className="text-txt-3">Type</span><div><span className={`inline-block px-1.5 py-0.5 rounded text-[0.6rem] font-bold ${t.type === 'LONG' ? 'bg-profit-dim text-profit' : 'bg-loss-dim text-loss'}`}>{t.type}</span></div></div>
              <div><span className="text-txt-3">Risque</span><div className="text-amber-400 font-mono">{t.risk ? `${parseFloat(t.risk).toFixed(0)}€` : '-'}</div></div>
              <div><span className="text-txt-3">R:R</span><div className={`font-mono font-bold ${t.rr != null ? (t.rr >= 0 ? 'text-profit' : 'text-loss') : 'text-txt-3'}`}>{t.rr != null ? `${parseFloat(t.rr).toFixed(2)}R` : '-'}</div></div>
            </div>
            <button onClick={() => deleteTrade(t.id)} className="text-xs text-loss border border-loss rounded px-3 py-1 hover:bg-loss-dim">Suppr.</button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-bg-card border border-brd rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">Nouveau Trade</h2>
            <form onSubmit={addTrade} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg border border-brd">
                <input type="checkbox" id="isPayout" checked={form.is_payout} onChange={e => setForm({...form, is_payout: e.target.checked})} className="accent-accent" />
                <label htmlFor="isPayout" className="text-sm font-semibold">Mode Payout (retrait)</label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required
                    className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">P&L (€)</label>
                  <input type="number" step="0.01" value={form.pnl} onChange={e => setForm({...form, pnl: e.target.value})} required placeholder="-250.00"
                    className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
                </div>
              </div>

              {!form.is_payout && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Instrument</label>
                      <select value={form.instrument} onChange={e => setForm({...form, instrument: e.target.value})}
                        className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                        {['NQ','ES','MNQ','MES','YM','RTY','CL','GC','EURUSD','GBPUSD'].map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Type</label>
                      <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                        className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                        <option value="LONG">LONG</option>
                        <option value="SHORT">SHORT</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Taille (lots)</label>
                      <input type="number" step="0.01" value={form.size} onChange={e => setForm({...form, size: e.target.value})} placeholder="1.00"
                        className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Risque (€)</label>
                      <input type="number" step="0.01" value={form.risk} onChange={e => setForm({...form, risk: e.target.value})} placeholder="250.00"
                        className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Lien TradingView</label>
                    <input type="url" value={form.trading_view_link} onChange={e => setForm({...form, trading_view_link: e.target.value})} placeholder="https://..."
                      className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="strategy" checked={form.followed_strategy} onChange={e => setForm({...form, followed_strategy: e.target.checked})} className="accent-accent" />
                    <label htmlFor="strategy" className="text-sm">Stratégie respectée</label>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows="2" placeholder="Notes..."
                  className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent text-white font-bold py-3 rounded-lg hover:opacity-90 shadow-lg shadow-accent/25 text-sm">Ajouter</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-brd text-txt-2 rounded-lg hover:border-accent text-sm">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
