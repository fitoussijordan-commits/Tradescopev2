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
  const [deleting, setDeleting] = useState(null);
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: currentAccountId, date: form.date, instrument: form.is_payout ? null : form.instrument, type: form.is_payout ? null : form.type, pnl: form.is_payout && pnl > 0 ? -pnl : pnl, risk, pnl_percent: pnlPercent, size: parseFloat(form.size) || null, trading_view_link: form.trading_view_link || null, followed_strategy: form.followed_strategy, notes: form.notes || null, is_payout: form.is_payout }),
    });
    if (res.ok) { setShowModal(false); setForm({ date: new Date().toISOString().split('T')[0], instrument: 'NQ', type: 'LONG', pnl: '', risk: '', size: '', trading_view_link: '', followed_strategy: false, notes: '', is_payout: false }); loadData(); }
    else { const err = await res.json(); alert(err.error); }
  };

  const deleteTrade = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (deleting === id) { await fetch('/api/trades?id=' + id, { method: 'DELETE' }); setDeleting(null); loadData(); }
    else { setDeleting(id); setTimeout(() => setDeleting(null), 3000); }
  };

  const accountTrades = trades.filter(t => t.account_id === currentAccountId && !t.is_payout);
  const filtered = accountTrades.filter(t => {
    if (filter === 'wins') return t.pnl > 0;
    if (filter === 'losses') return t.pnl < 0;
    if (filter === 'month') { const now = new Date(); const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }
    if (filter === 'week') { const now = new Date(); const weekAgo = new Date(now - 7 * 86400000); return new Date(t.date) >= weekAgo; }
    return true;
  });

  const fmt = (v) => (parseFloat(v) >= 0 ? '+' : '') + parseFloat(v).toFixed(2) + '€';
  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={currentAccountId || ''} onChange={e => setCurrentAccountId(e.target.value)} className="bg-bg-card border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="flex gap-1.5 overflow-x-auto">
            {[['all','Tout'],['month','Mois'],['week','Semaine'],['wins','Wins'],['losses','Losses']].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)} className={'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ' + (filter === k ? 'bg-accent text-white' : 'bg-bg-card border border-brd text-txt-2')}>{l}</button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-lg shadow-lg shadow-accent/25 active:scale-95 transition-all">+ Trade</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-bg-card border border-brd rounded-xl p-3 text-center">
          <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">Trades</div>
          <div className="text-lg font-bold font-display">{filtered.length}</div>
        </div>
        <div className="bg-bg-card border border-brd rounded-xl p-3 text-center">
          <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">P&L</div>
          <div className={'text-lg font-bold font-display font-mono ' + (filtered.reduce((s,t) => s + parseFloat(t.pnl), 0) >= 0 ? 'text-profit' : 'text-loss')}>{fmt(filtered.reduce((s,t) => s + parseFloat(t.pnl), 0))}</div>
        </div>
        <div className="bg-bg-card border border-brd rounded-xl p-3 text-center">
          <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">Win Rate</div>
          <div className={'text-lg font-bold font-display ' + (filtered.length > 0 && (filtered.filter(t=>t.pnl>0).length / filtered.length * 100) >= 50 ? 'text-profit' : 'text-loss')}>{filtered.length > 0 ? (filtered.filter(t=>t.pnl>0).length / filtered.length * 100).toFixed(0) : 0}%</div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.id} className="bg-bg-card border border-brd rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{t.instrument || '-'}</span>
                  <span className={'inline-block px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase font-mono ' + (t.type === 'LONG' ? 'bg-profit-dim text-profit' : 'bg-loss-dim text-loss')}>{t.type}</span>
                  {t.followed_strategy && <span className="text-profit text-xs">✓</span>}
                </div>
                <div className="text-[0.78rem] text-txt-2 font-mono mt-0.5">{new Date(t.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              </div>
              <div className="text-right">
                <div className={'text-lg font-bold font-mono ' + (t.pnl >= 0 ? 'text-profit' : 'text-loss')}>{fmt(t.pnl)}</div>
                {t.pnl_percent && <div className={'text-[0.7rem] font-mono ' + (t.pnl >= 0 ? 'text-profit' : 'text-loss')}>{parseFloat(t.pnl_percent).toFixed(2)}%</div>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs">
                {t.risk && <span><span className="text-txt-3">Risque</span> <span className="text-amber-400 font-mono font-bold">{parseFloat(t.risk).toFixed(0)}€</span></span>}
                {t.rr != null && <span><span className="text-txt-3">R:R</span> <span className={'font-mono font-bold ' + (t.rr >= 0 ? 'text-profit' : 'text-loss')}>{parseFloat(t.rr).toFixed(2)}R</span></span>}
                {t.size && <span><span className="text-txt-3">Taille</span> <span className="font-mono">{t.size}</span></span>}
              </div>
              <div className="flex items-center gap-2">
                {t.trading_view_link && <a href={t.trading_view_link} target="_blank" rel="noopener" className="text-accent text-xs font-bold px-2 py-1 border border-accent/30 rounded">↗</a>}
                <button onClick={(e) => deleteTrade(e, t.id)} className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ' + (deleting === t.id ? 'bg-loss text-white' : 'text-txt-3 border border-brd')}>{deleting === t.id ? 'Confirmer ?' : '×'}</button>
              </div>
            </div>
            {t.notes && <div className="mt-2 pt-2 border-t border-brd text-txt-2 text-xs">{t.notes}</div>}
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-16 text-txt-3"><div className="text-4xl mb-3 opacity-40">◈</div><p>Aucun trade</p></div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-bg-card border border-brd rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">Nouveau Trade</h2>
            <form onSubmit={addTrade} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg border border-brd">
                <input type="checkbox" id="isPayout" checked={form.is_payout} onChange={e => setForm({...form, is_payout: e.target.checked})} className="accent-accent w-4 h-4" />
                <label htmlFor="isPayout" className="text-sm font-semibold">Mode Payout</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
                <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">P&L (€)</label><input type="number" step="0.01" value={form.pnl} onChange={e => setForm({...form, pnl: e.target.value})} required placeholder="-250" className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
              </div>
              {!form.is_payout && (<>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Instrument</label><select value={form.instrument} onChange={e => setForm({...form, instrument: e.target.value})} className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent">{['NQ','ES','MNQ','MES','YM','RTY','CL','GC'].map(i => <option key={i}>{i}</option>)}</select></div>
                  <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent"><option value="LONG">LONG</option><option value="SHORT">SHORT</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Taille</label><input type="number" step="0.01" value={form.size} onChange={e => setForm({...form, size: e.target.value})} placeholder="1.00" className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
                  <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Risque (€)</label><input type="number" step="0.01" value={form.risk} onChange={e => setForm({...form, risk: e.target.value})} placeholder="250" className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
                </div>
                <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Lien TradingView</label><input type="url" value={form.trading_view_link} onChange={e => setForm({...form, trading_view_link: e.target.value})} placeholder="https://..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
                <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg border border-brd"><input type="checkbox" id="strategy" checked={form.followed_strategy} onChange={e => setForm({...form, followed_strategy: e.target.checked})} className="accent-accent w-4 h-4" /><label htmlFor="strategy" className="text-sm">Stratégie respectée</label></div>
              </>)}
              <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows="2" placeholder="Notes..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent text-white font-bold py-3 rounded-lg shadow-lg shadow-accent/25 text-sm active:scale-95 transition-all">Ajouter</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-brd text-txt-2 rounded-lg text-sm active:scale-95">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
