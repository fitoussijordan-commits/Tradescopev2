'use client';
import { useState, useEffect } from 'react';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-bg-secondary border border-brd rounded-lg p-3 text-center">
      <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-base font-bold font-mono ${color || ''}`}>{value}</div>
      {sub && <div className="text-[0.6rem] text-txt-3 mt-0.5">{sub}</div>}
    </div>
  );
}

function computeStats(trades) {
  if (!trades || trades.length === 0) return null;
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const totalPnl = trades.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const winRate = (wins.length / trades.length) * 100;
  const avgRR = trades.filter(t => t.rr != null).reduce((s, t) => s + parseFloat(t.rr), 0) / (trades.filter(t => t.rr != null).length || 1);
  const grossWin = wins.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + parseFloat(t.pnl), 0));
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss) : grossWin > 0 ? Infinity : 0;
  const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const best = trades.reduce((b, t) => parseFloat(t.pnl) > parseFloat(b.pnl) ? t : b, trades[0]);
  const worst = trades.reduce((w, t) => parseFloat(t.pnl) < parseFloat(w.pnl) ? t : w, trades[0]);
  return { totalPnl, winRate, avgRR, profitFactor, avgWin, avgLoss, best, worst, nbTrades: trades.length, wins: wins.length, losses: losses.length };
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', conditions: [], color: '#6366f1' });
  const [newCondition, setNewCondition] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [sRes, tRes] = await Promise.all([
      fetch('/api/strategies'),
      fetch('/api/trades'),
    ]);
    const [s, t] = await Promise.all([sRes.json(), tRes.json()]);
    setStrategies(Array.isArray(s) ? s : []);
    setTrades(Array.isArray(t) ? t.filter(tr => !tr.is_payout) : []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ name: '', description: '', conditions: [], color: '#6366f1' });
    setNewCondition('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (s) => {
    setForm({ name: s.name, description: s.description || '', conditions: s.conditions || [], color: s.color || '#6366f1' });
    setEditingId(s.id);
    setShowForm(true);
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    setForm({ ...form, conditions: [...form.conditions, newCondition.trim()] });
    setNewCondition('');
  };

  const removeCondition = (i) => {
    setForm({ ...form, conditions: form.conditions.filter((_, idx) => idx !== i) });
  };

  const submit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PATCH' : 'POST';
    const body = editingId ? { id: editingId, ...form } : form;
    const res = await fetch('/api/strategies', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { loadData(); resetForm(); }
  };

  const deleteStrategy = async (id) => {
    if (deleting === id) {
      await fetch(`/api/strategies?id=${id}`, { method: 'DELETE' });
      setDeleting(null);
      if (selectedId === id) setSelectedId(null);
      loadData();
    } else {
      setDeleting(id);
      setTimeout(() => setDeleting(null), 3000);
    }
  };

  const fmt = (v) => (parseFloat(v) >= 0 ? '+' : '') + parseFloat(v).toFixed(2) + '€';

  // Stats par stratégie
  const getStratTrades = (stratId) => {
    if (stratId === 'hors') return trades.filter(t => !t.strategy_id);
    return trades.filter(t => t.strategy_id === stratId);
  };

  const selectedStrat = strategies.find(s => s.id === selectedId);
  const selectedTrades = selectedId ? getStratTrades(selectedId) : getStratTrades('hors');
  const selectedStats = computeStats(selectedId === 'hors' ? getStratTrades('hors') : selectedId ? getStratTrades(selectedId) : []);

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="animate-fade-up max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display font-bold text-xl">Stratégies</h2>
          <p className="text-txt-3 text-sm mt-0.5">Analyse tes performances par setup</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-accent text-white text-sm font-bold rounded-lg shadow-lg shadow-accent/25 active:scale-95 transition-all">
          + Stratégie
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des stratégies */}
        <div className="space-y-3">
          {/* Hors stratégie */}
          <button
            onClick={() => setSelectedId('hors')}
            className={`w-full text-left p-4 rounded-xl border transition-all ${selectedId === 'hors' ? 'border-accent bg-accent-dim' : 'bg-bg-card border-brd hover:border-brd-hover'}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-txt-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">Hors stratégie</div>
                <div className="text-txt-3 text-xs">{getStratTrades('hors').length} trades</div>
              </div>
              <div className={`text-xs font-mono font-bold ${getStratTrades('hors').reduce((s,t) => s+parseFloat(t.pnl),0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                {getStratTrades('hors').length > 0 ? fmt(getStratTrades('hors').reduce((s,t) => s+parseFloat(t.pnl),0)) : '—'}
              </div>
            </div>
          </button>

          {strategies.map(s => {
            const sTrades = getStratTrades(s.id);
            const pnl = sTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0);
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedId === s.id ? 'border-accent bg-accent-dim' : 'bg-bg-card border-brd hover:border-brd-hover'}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                    <div className="text-txt-3 text-xs">{sTrades.length} trades</div>
                  </div>
                  <div className={`text-xs font-mono font-bold ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {sTrades.length > 0 ? fmt(pnl) : '—'}
                  </div>
                </div>
              </button>
            );
          })}

          {strategies.length === 0 && (
            <div className="text-center py-8 text-txt-3 text-sm bg-bg-card border border-brd rounded-xl">
              <div className="text-2xl mb-2">▦</div>
              Crée ta première stratégie
            </div>
          )}
        </div>

        {/* Détail stratégie sélectionnée */}
        <div className="lg:col-span-2">
          {selectedId !== null && (
            <div className="space-y-4">
              {/* Header stratégie */}
              <div className="bg-bg-card border border-brd rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {selectedId !== 'hors' && selectedStrat && (
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedStrat.color }} />
                    )}
                    <div>
                      <h3 className="font-display font-bold text-lg">
                        {selectedId === 'hors' ? 'Hors stratégie' : selectedStrat?.name}
                      </h3>
                      {selectedStrat?.description && (
                        <p className="text-txt-2 text-sm mt-0.5">{selectedStrat.description}</p>
                      )}
                    </div>
                  </div>
                  {selectedId !== 'hors' && selectedStrat && (
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(selectedStrat)} className="px-3 py-1.5 border border-brd text-txt-2 rounded-lg text-xs hover:border-accent hover:text-accent transition-all">Éditer</button>
                      <button onClick={() => deleteStrategy(selectedStrat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${deleting === selectedStrat.id ? 'bg-loss text-white' : 'border border-brd text-loss'}`}>
                        {deleting === selectedStrat.id ? 'Confirmer ?' : '×'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Conditions */}
                {selectedId !== 'hors' && selectedStrat?.conditions?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brd">
                    <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-2">Conditions</div>
                    <div className="space-y-1.5">
                      {selectedStrat.conditions.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-accent font-bold mt-0.5 flex-shrink-0">▸</span>
                          <span className="text-txt-2">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              {selectedStats ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Trades" value={selectedStats.nbTrades} sub={`${selectedStats.wins}W · ${selectedStats.losses}L`} />
                    <StatCard label="P&L Total" value={fmt(selectedStats.totalPnl)} color={selectedStats.totalPnl >= 0 ? 'text-profit' : 'text-loss'} />
                    <StatCard label="Win Rate" value={`${selectedStats.winRate.toFixed(0)}%`} color={selectedStats.winRate >= 50 ? 'text-profit' : 'text-loss'} />
                    <StatCard label="R:R Moyen" value={selectedStats.avgRR !== 0 ? `${selectedStats.avgRR.toFixed(2)}R` : '—'} color={selectedStats.avgRR >= 1 ? 'text-profit' : 'text-loss'} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Profit Factor" value={selectedStats.profitFactor === Infinity ? '∞' : selectedStats.profitFactor.toFixed(2)} color={selectedStats.profitFactor >= 1.5 ? 'text-profit' : selectedStats.profitFactor >= 1 ? 'text-amber-400' : 'text-loss'} sub="≥1.5 = bon" />
                    <StatCard label="Gain Moyen" value={selectedStats.avgWin > 0 ? fmt(selectedStats.avgWin) : '—'} color="text-profit" />
                    <StatCard label="Perte Moyenne" value={selectedStats.avgLoss > 0 ? `-${selectedStats.avgLoss.toFixed(2)}€` : '—'} color="text-loss" />
                    <StatCard label="Meilleur Trade" value={fmt(selectedStats.best.pnl)} color="text-profit" />
                  </div>

                  {/* Liste des trades */}
                  <div className="bg-bg-card border border-brd rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-brd">
                      <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider">Trades récents</div>
                    </div>
                    <div className="divide-y divide-brd max-h-72 overflow-y-auto">
                      {selectedTrades.slice(0, 20).map(t => (
                        <div key={t.id} className="px-4 py-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{t.instrument || '-'}</span>
                            <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded font-mono ${t.type === 'LONG' ? 'bg-profit-dim text-profit' : 'bg-loss-dim text-loss'}`}>{t.type}</span>
                            <span className="text-txt-3 text-xs font-mono">{new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <div className={`font-mono font-bold text-sm ${parseFloat(t.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(t.pnl)}</div>
                        </div>
                      ))}
                      {selectedTrades.length === 0 && (
                        <div className="text-center py-8 text-txt-3 text-sm">Aucun trade pour cette stratégie</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-bg-card border border-brd rounded-xl p-12 text-center text-txt-3">
                  <div className="text-3xl mb-3 opacity-30">◈</div>
                  <p>Aucun trade associé à cette stratégie</p>
                  <p className="text-xs mt-1">Sélectionne cette stratégie lors de la saisie de tes trades</p>
                </div>
              )}
            </div>
          )}

          {selectedId === null && (
            <div className="bg-bg-card border border-brd rounded-xl p-12 text-center text-txt-3">
              <div className="text-3xl mb-3 opacity-30">▦</div>
              <p>Sélectionne une stratégie pour voir ses stats</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal création/édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-bg-card border border-brd rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">{editingId ? 'Modifier la stratégie' : 'Nouvelle stratégie'}</h2>
            <form onSubmit={submit} className="space-y-4">

              {/* Nom */}
              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Nom de la stratégie</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ex: London Breakout, ICT OTE..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Description (optionnel)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2" placeholder="Décris ton setup en quelques mots..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent resize-none" />
              </div>

              {/* Couleur */}
              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-2">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-card scale-110' : 'opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Conditions / Règles</label>
                <div className="space-y-2 mb-2">
                  {form.conditions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-bg-secondary border border-brd rounded-lg px-3 py-2">
                      <span className="text-accent text-xs">▸</span>
                      <span className="text-sm flex-1">{c}</span>
                      <button type="button" onClick={() => removeCondition(i)} className="text-txt-3 hover:text-loss text-xs">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newCondition} onChange={e => setNewCondition(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                    placeholder="Ex: Structure cassée en H1" className="flex-1 bg-bg-secondary border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  <button type="button" onClick={addCondition} className="px-3 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg text-sm font-bold hover:bg-accent/30 transition-all">+</button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent text-white font-bold py-3 rounded-lg text-sm active:scale-95 transition-all shadow-lg shadow-accent/25">
                  {editingId ? 'Sauvegarder' : 'Créer'}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-3 border border-brd text-txt-2 rounded-lg text-sm">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
