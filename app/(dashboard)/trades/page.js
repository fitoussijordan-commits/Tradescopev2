'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAccount } from '@/components/AccountContext';

export default function TradesPage() {
  const { accounts, currentAccount, currentAccountId } = useAccount();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [editModal, setEditModal] = useState(null); // trade being edited
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], instrument: 'NQ', type: 'LONG', pnl: '', risk: '', size: '', trading_view_link: '', followed_strategy: false, notes: '', is_payout: false, session: '', balanceMode: false, balance: '', strategy_id: '' });
  const [strategies, setStrategies] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Calculate current capital for balance mode
  const currentCapital = (() => {
    if (!currentAccount) return 0;
    const accountTrades = trades.filter(t => t.account_id === currentAccountId);
    return parseFloat(currentAccount.base_capital) + accountTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
  })();

  const computedPnl = form.balanceMode && form.balance !== '' ? (parseFloat(form.balance) - currentCapital) : null;

  useEffect(() => { loadData(); }, [currentAccountId]);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from('trades').select('*, strategies(id, name, color)').eq('user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('strategies').select('*').eq('user_id', user.id).order('created_at'),
    ]);
    setTrades(t || []);
    setStrategies(s || []);
    setLoading(false);
  };

  const openEdit = (trade) => {
    setEditForm({
      date: trade.date,
      instrument: trade.instrument || 'NQ',
      type: trade.type || 'LONG',
      pnl: trade.pnl,
      risk: trade.risk || '',
      size: trade.size || '',
      trading_view_link: trade.trading_view_link || '',
      followed_strategy: trade.followed_strategy || false,
      notes: trade.notes || '',
      session: trade.session || '',
      strategy_id: trade.strategy_id || '',
    });
    setEditModal(trade);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/trades', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editModal.id, ...editForm, pnl: parseFloat(editForm.pnl), risk: parseFloat(editForm.risk) || null, size: parseFloat(editForm.size) || null }),
    });
    if (res.ok) { setEditModal(null); loadData(); }
    else { const err = await res.json(); alert(err.error); }
  };

  const addTrade = async (e) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const account = accounts.find(a => a.id === currentAccountId);
    if (!account || !user) return;
    const pnl = form.balanceMode ? computedPnl : parseFloat(form.pnl);
    if (pnl === null || isNaN(pnl)) { alert('Remplis le P&L ou le solde'); return; }
    const risk = parseFloat(form.risk) || null;
    const accountTrades = trades.filter(t => t.account_id === currentAccountId);
    const currentCapital = parseFloat(account.base_capital) + accountTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
    const pnlPercent = (pnl / currentCapital) * 100;
    const res = await fetch('/api/trades', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: currentAccountId, date: form.date, instrument: form.is_payout ? null : form.instrument, type: form.is_payout ? null : form.type, pnl: form.is_payout && pnl > 0 ? -pnl : pnl, risk, pnl_percent: pnlPercent, size: parseFloat(form.size) || null, trading_view_link: form.trading_view_link || null, followed_strategy: form.followed_strategy, notes: form.notes || null, is_payout: form.is_payout, session: form.session || null, strategy_id: form.strategy_id || null }),
    });
    if (res.ok) { setShowModal(false); setForm({ date: new Date().toISOString().split('T')[0], instrument: 'NQ', type: 'LONG', pnl: '', risk: '', size: '', trading_view_link: '', followed_strategy: false, notes: '', is_payout: false, session: '', balanceMode: false, balance: '', strategy_id: '' }); loadData(); }
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

  // ============================================================
  // TRADOVATE CSV IMPORT
  // ============================================================
  const parseSymbol = (sym) => {
    if (!sym) return 'MNQ';
    // MNQH6 -> MNQ, ESH6 -> ES, MESH6 -> MES, NQH6 -> NQ, etc.
    const match = sym.match(/^([A-Z]+?)((?:[FGHJKMNQUVXZ])\d{1,2})$/);
    if (match) return match[1];
    return sym.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, '') || sym;
  };

  const parseTradovatePnl = (pnlStr) => {
    if (!pnlStr) return 0;
    const cleaned = pnlStr.replace(/[$,\s]/g, '');
    // $(205.00) = loss -> -205, $205.00 = profit -> +205
    const matchLoss = cleaned.match(/^\((.+)\)$/);
    if (matchLoss) return -parseFloat(matchLoss[1]);
    return parseFloat(cleaned) || 0;
  };

  const parseTradovateDate = (timestamp) => {
    // "02/25/2026 15:32:27" -> "2026-02-25" (US format MM/DD/YYYY)
    if (!timestamp) return null;
    const parts = timestamp.trim().split(' ')[0].split('/');
    if (parts.length !== 3) return null;
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  };

  const detectTradeType = (boughtTs, soldTs) => {
    // If bought before sold -> LONG, if sold before bought -> SHORT
    if (!boughtTs || !soldTs) return 'LONG';
    const boughtTime = new Date(boughtTs.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'));
    const soldTime = new Date(soldTs.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'));
    return boughtTime <= soldTime ? 'LONG' : 'SHORT';
  };

  const detectSession = (timestamp) => {
    if (!timestamp) return null;
    const parts = timestamp.trim().split(' ');
    if (parts.length < 2) return null;
    const timeParts = parts[1].split(':');
    const hour = parseInt(timeParts[0]);
    // Tradovate timestamps are in CT (Central Time)
    // London session ~ 2:00-5:00 CT, US session ~ 8:30-15:00 CT
    if (hour >= 2 && hour < 6) return 'london';
    if (hour >= 8 && hour <= 16) return 'us';
    return null;
  };

  const handleCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { alert('Fichier vide ou invalide'); return; }

        const header = lines[0].split(',').map(h => h.trim());
        const symIdx = header.indexOf('symbol');
        const qtyIdx = header.indexOf('qty');
        const pnlIdx = header.indexOf('pnl');
        const boughtTsIdx = header.indexOf('boughtTimestamp');
        const soldTsIdx = header.indexOf('soldTimestamp');
        const durationIdx = header.indexOf('duration');
        const buyPriceIdx = header.indexOf('buyPrice');
        const sellPriceIdx = header.indexOf('sellPrice');

        if (pnlIdx === -1) { alert('Colonne "pnl" introuvable dans le CSV'); return; }

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length < 3) continue;

          const pnl = parseTradovatePnl(cols[pnlIdx]);
          const boughtTs = boughtTsIdx >= 0 ? cols[boughtTsIdx] : null;
          const soldTs = soldTsIdx >= 0 ? cols[soldTsIdx] : null;
          // Use the earlier timestamp as the trade date
          const entryTs = boughtTs && soldTs ?
            (new Date(boughtTs.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2')) <= new Date(soldTs.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2')) ? boughtTs : soldTs) : (boughtTs || soldTs);

          const date = parseTradovateDate(entryTs);
          if (!date) continue;

          const instrument = symIdx >= 0 ? parseSymbol(cols[symIdx]) : null;
          const type = detectTradeType(boughtTs, soldTs);
          const size = qtyIdx >= 0 ? parseFloat(cols[qtyIdx]) || null : null;
          const session = detectSession(entryTs);
          const duration = durationIdx >= 0 ? cols[durationIdx] : null;
          const buyPrice = buyPriceIdx >= 0 ? cols[buyPriceIdx] : null;
          const sellPrice = sellPriceIdx >= 0 ? cols[sellPriceIdx] : null;

          // Build notes with extra info
          const noteParts = [];
          if (duration) noteParts.push(`Durée: ${duration}`);
          if (buyPrice && sellPrice) noteParts.push(`Entry: ${type === 'LONG' ? buyPrice : sellPrice} → Exit: ${type === 'LONG' ? sellPrice : buyPrice}`);
          if (boughtTs) noteParts.push(`Import Tradovate`);

          parsed.push({
            date, instrument, type, pnl, size, session,
            notes: noteParts.length > 0 ? noteParts.join(' | ') : null,
            _raw: { duration, buyPrice, sellPrice, boughtTs, soldTs },
          });
        }

        if (parsed.length === 0) { alert('Aucun trade valide trouvé dans le CSV'); return; }

        setImportData(parsed);
        setImportResult(null);
      } catch (err) {
        alert('Erreur de parsing: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleImportDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleCSVFile(file);
    } else {
      alert('Fichier CSV requis');
    }
  };

  const submitImport = async () => {
    if (!importData || importData.length === 0 || importing) return;
    setImporting(true);
    try {
      const res = await fetch('/api/trades/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: currentAccountId,
          trades: importData.map(({ _raw, ...t }) => t),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportResult({ success: true, count: data.imported });
      setImportData(null);
      loadData();
    } catch (err) {
      setImportResult({ success: false, error: err.message });
    } finally {
      setImporting(false);
    }
  };

  const fmt = (v) => (parseFloat(v) >= 0 ? '+' : '') + parseFloat(v).toFixed(2) + '€';
  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto">
            {[['all','Tout'],['month','Mois'],['week','Semaine'],['wins','Wins'],['losses','Losses']].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)} className={'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ' + (filter === k ? 'bg-accent text-white' : 'bg-bg-card border border-brd text-txt-2')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)} className="px-4 py-2.5 bg-bg-card border border-brd text-txt-2 text-sm font-semibold rounded-lg hover:border-accent hover:text-accent transition-all active:scale-95">↑ Import</button>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-lg shadow-lg shadow-accent/25 active:scale-95 transition-all">+ Trade</button>
        </div>
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
                  {t.strategies && <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded font-mono" style={{backgroundColor: t.strategies.color + '25', color: t.strategies.color}}>▦ {t.strategies.name}</span>}
                  {t.session && <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded font-mono ${t.session === 'london' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>{t.session === 'london' ? '🇬🇧 AM' : '🇺🇸 PM'}</span>}
                </div>
                <div className="text-[0.78rem] text-txt-2 font-mono mt-0.5">{new Date(t.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              </div>
              <div className="text-right">
                <div className={'text-lg font-bold font-mono ' + (t.pnl >= 0 ? 'text-profit' : 'text-loss')}>{fmt(t.pnl)}</div>
                {t.pnl_percent && <div className={'text-[0.7rem] font-mono ' + (t.pnl >= 0 ? 'text-profit' : 'text-loss')}>{parseFloat(t.pnl_percent).toFixed(2)}%</div>}
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-3 text-xs flex-wrap">
                {t.risk && <span><span className="text-txt-3">Risque</span> <span className="text-amber-400 font-mono font-bold">{parseFloat(t.risk).toFixed(0)}€</span></span>}
                {t.rr != null && <span><span className="text-txt-3">R:R</span> <span className={'font-mono font-bold ' + (t.rr >= 0 ? 'text-profit' : 'text-loss')}>{parseFloat(t.rr).toFixed(2)}R</span></span>}
                {t.size && <span><span className="text-txt-3">Taille</span> <span className="font-mono">{t.size}</span></span>}
              </div>
              <div className="flex items-center gap-2">
                {t.trading_view_link && <a href={t.trading_view_link} target="_blank" rel="noopener" className="text-accent text-xs font-bold px-2 py-1 border border-accent/30 rounded">↗</a>}
                <button onClick={() => openEdit(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-brd text-txt-2 hover:border-accent hover:text-accent transition-all">✎</button>
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
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono">{form.balanceMode ? 'Solde compte (€)' : 'P&L (€)'}</label>
                    <button type="button" onClick={() => setForm({...form, balanceMode: !form.balanceMode, pnl: '', balance: ''})}
                      className="text-[0.55rem] font-bold text-accent hover:underline">{form.balanceMode ? '→ Mode P&L' : '→ Mode Solde'}</button>
                  </div>
                  {form.balanceMode ? (
                    <div>
                      <input type="number" step="0.01" value={form.balance} onChange={e => setForm({...form, balance: e.target.value})} required placeholder={currentCapital.toFixed(2)} className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" />
                      {form.balance !== '' && computedPnl !== null && (
                        <div className={`mt-1.5 text-xs font-mono font-bold ${computedPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                          P&L calculé : {computedPnl >= 0 ? '+' : ''}{computedPnl.toFixed(2)}€
                        </div>
                      )}
                    </div>
                  ) : (
                    <input type="number" step="0.01" value={form.pnl} onChange={e => setForm({...form, pnl: e.target.value})} required placeholder="-250" className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" />
                  )}
                </div>
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
                <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Session</label>
                  <div className="flex gap-2">
                    {[['','Aucune'],['london','🇬🇧 Londres AM'],['us','🇺🇸 US PM']].map(([v,l]) => (
                      <button key={v} type="button" onClick={() => setForm({...form, session: v})}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 ${form.session === v ? 'bg-accent text-white' : 'bg-bg-secondary border border-brd text-txt-2 hover:border-accent'}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </>)}
              {!form.is_payout && strategies.length > 0 && (
                <div>
                  <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Stratégie</label>
                  <select value={form.strategy_id} onChange={e => setForm({...form, strategy_id: e.target.value})}
                    className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent">
                    <option value="">Hors stratégie</option>
                    {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows="2" placeholder="Notes..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent text-white font-bold py-3 rounded-lg shadow-lg shadow-accent/25 text-sm active:scale-95 transition-all">Ajouter</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-brd text-txt-2 rounded-lg text-sm active:scale-95">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-bg-card border border-brd rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">Modifier le trade</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Date</label>
                  <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
                <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">P&L (€)</label>
                  <input type="number" step="0.01" value={editForm.pnl} onChange={e => setEditForm({...editForm, pnl: e.target.value})} required className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
              </div>
              {!editModal.is_payout && (<>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Instrument</label>
                    <select value={editForm.instrument} onChange={e => setEditForm({...editForm, instrument: e.target.value})} className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent">
                      {['NQ','ES','MNQ','MES','YM','RTY','CL','GC'].map(i => <option key={i}>{i}</option>)}
                    </select></div>
                  <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Type</label>
                    <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent">
                      <option value="LONG">LONG</option><option value="SHORT">SHORT</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Taille</label>
                    <input type="number" step="0.01" value={editForm.size} onChange={e => setEditForm({...editForm, size: e.target.value})} placeholder="1.00" className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
                  <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Risque (€)</label>
                    <input type="number" step="0.01" value={editForm.risk} onChange={e => setEditForm({...editForm, risk: e.target.value})} placeholder="250" className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
                </div>
                <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Stratégie</label>
                  <select value={editForm.strategy_id} onChange={e => setEditForm({...editForm, strategy_id: e.target.value})} className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent">
                    <option value="">Hors stratégie</option>
                    {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
                <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Session</label>
                  <div className="flex gap-2">
                    {[['','Aucune'],['london','🇬🇧 Londres AM'],['us','🇺🇸 US PM']].map(([v,l]) => (
                      <button key={v} type="button" onClick={() => setEditForm({...editForm, session: v})}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${editForm.session === v ? 'bg-accent text-white' : 'bg-bg-secondary border border-brd text-txt-2 hover:border-accent'}`}>{l}</button>
                    ))}
                  </div></div>
                <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Lien TradingView</label>
                  <input type="url" value={editForm.trading_view_link} onChange={e => setEditForm({...editForm, trading_view_link: e.target.value})} placeholder="https://..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
                <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg border border-brd">
                  <input type="checkbox" id="editStrat" checked={editForm.followed_strategy} onChange={e => setEditForm({...editForm, followed_strategy: e.target.checked})} className="accent-accent w-4 h-4" />
                  <label htmlFor="editStrat" className="text-sm">Stratégie respectée</label>
                </div>
              </>)}
              <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows="2" placeholder="Notes..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent text-white font-bold py-3 rounded-lg shadow-lg shadow-accent/25 text-sm active:scale-95 transition-all">Sauvegarder</button>
                <button type="button" onClick={() => setEditModal(null)} className="px-6 py-3 border border-brd text-txt-2 rounded-lg text-sm">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* IMPORT TRADOVATE MODAL */}
      {/* ============================================================ */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => { setShowImport(false); setImportData(null); setImportResult(null); }}>
          <div className="bg-bg-card border border-brd rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="font-display font-bold text-lg">Import Tradovate</h2>
                <p className="text-txt-3 text-xs mt-0.5">Importe tes trades depuis un export CSV Tradovate</p>
              </div>
              <button onClick={() => { setShowImport(false); setImportData(null); setImportResult(null); }} className="w-8 h-8 rounded-lg border border-brd text-txt-3 hover:text-txt-1 hover:border-accent transition-all text-sm flex items-center justify-center">✕</button>
            </div>

            {/* Success message */}
            {importResult?.success && (
              <div className="bg-profit-dim border border-profit/20 rounded-xl p-4 mb-4 text-center">
                <div className="text-2xl mb-2">✓</div>
                <div className="font-bold text-profit">{importResult.count} trade{importResult.count > 1 ? 's' : ''} importé{importResult.count > 1 ? 's' : ''} !</div>
                <button onClick={() => { setShowImport(false); setImportResult(null); }} className="mt-3 px-4 py-2 bg-profit text-white text-sm font-bold rounded-lg">Fermer</button>
              </div>
            )}

            {/* Error message */}
            {importResult?.success === false && (
              <div className="bg-loss-dim border border-loss/20 rounded-xl p-4 mb-4">
                <div className="text-loss font-bold text-sm">❌ Erreur: {importResult.error}</div>
              </div>
            )}

            {/* Drop zone */}
            {!importData && !importResult?.success && (
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleImportDrop}
                className="border-2 border-dashed border-brd hover:border-accent rounded-xl p-10 text-center transition-all cursor-pointer"
                onClick={() => document.getElementById('csv-input').click()}
              >
                <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={e => handleImportDrop(e)} />
                <div className="text-3xl mb-3 opacity-40">↑</div>
                <p className="font-semibold text-sm mb-1">Glisse ton fichier CSV ici</p>
                <p className="text-txt-3 text-xs">ou clique pour sélectionner</p>
                <div className="mt-4 pt-4 border-t border-brd">
                  <p className="text-txt-3 text-[0.6rem] font-mono">Format attendu: export Tradovate "Performance"</p>
                  <p className="text-txt-3 text-[0.6rem] font-mono">Colonnes: symbol, qty, pnl, boughtTimestamp, soldTimestamp, duration</p>
                </div>
              </div>
            )}

            {/* Preview */}
            {importData && !importResult?.success && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-bg-secondary border border-brd rounded-lg p-3 text-center">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">Trades</div>
                    <div className="text-xl font-bold font-display">{importData.length}</div>
                  </div>
                  <div className="bg-bg-secondary border border-brd rounded-lg p-3 text-center">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">P&L Total</div>
                    <div className={`text-xl font-bold font-display font-mono ${importData.reduce((s, t) => s + t.pnl, 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {fmt(importData.reduce((s, t) => s + t.pnl, 0))}
                    </div>
                  </div>
                  <div className="bg-bg-secondary border border-brd rounded-lg p-3 text-center">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">Win Rate</div>
                    <div className={`text-xl font-bold font-display ${importData.length > 0 && (importData.filter(t => t.pnl > 0).length / importData.length * 100) >= 50 ? 'text-profit' : 'text-loss'}`}>
                      {importData.length > 0 ? (importData.filter(t => t.pnl > 0).length / importData.length * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div className="bg-accent-dim border border-accent/20 rounded-lg px-4 py-3 flex items-center gap-2">
                  <span className="text-accent text-xs font-bold">→</span>
                  <span className="text-sm">Import vers <strong>{currentAccount?.name}</strong> ({currentAccount?.prop_firm})</span>
                </div>

                {/* Trade list preview */}
                <div className="border border-brd rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-bg-secondary border-b border-brd">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">Aperçu des trades</div>
                  </div>
                  <div className="divide-y divide-brd max-h-64 overflow-y-auto">
                    {importData.map((t, i) => (
                      <div key={i} className="px-4 py-2.5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{t.instrument || '?'}</span>
                          <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded font-mono ${t.type === 'LONG' ? 'bg-profit-dim text-profit' : 'bg-loss-dim text-loss'}`}>{t.type}</span>
                          <span className="text-txt-3 text-xs font-mono">{new Date(t.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                          {t.size && <span className="text-txt-3 text-[0.55rem] font-mono">{t.size} cts</span>}
                          {t.session && <span className={`text-[0.5rem] font-bold px-1 py-0.5 rounded font-mono ${t.session === 'london' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>{t.session === 'london' ? '🇬🇧' : '🇺🇸'}</span>}
                        </div>
                        <div className={`font-mono font-bold text-sm ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(t.pnl)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={submitImport} disabled={importing}
                    className="flex-1 bg-accent text-white font-bold py-3 rounded-lg shadow-lg shadow-accent/25 text-sm active:scale-95 transition-all disabled:opacity-50">
                    {importing ? 'Import en cours...' : `Importer ${importData.length} trade${importData.length > 1 ? 's' : ''}`}
                  </button>
                  <button onClick={() => { setImportData(null); }} className="px-6 py-3 border border-brd text-txt-2 rounded-lg text-sm">Annuler</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
