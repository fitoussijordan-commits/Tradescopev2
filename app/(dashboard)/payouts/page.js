'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function PayoutsPage() {
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], pnl: '', notes: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: a } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id).order('created_at');
    const { data: t } = await supabase.from('trades').select('*').eq('user_id', user.id).order('date', { ascending: false });
    setAccounts(a || []);
    setTrades(t || []);
    if (a?.length && !currentAccountId) setCurrentAccountId(a[0].id);
    setLoading(false);
  };

  const addPayout = async (e) => {
    e.preventDefault();
    const pnl = -Math.abs(parseFloat(form.pnl));
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: currentAccountId, date: form.date, pnl, notes: form.notes, is_payout: true }),
    });
    if (res.ok) { setShowModal(false); setForm({ date: new Date().toISOString().split('T')[0], pnl: '', notes: '' }); loadData(); }
  };

  const deletePayout = async (id) => {
    if (!confirm('Supprimer ce payout ?')) return;
    await fetch(`/api/trades?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  const payouts = trades.filter(t => t.account_id === currentAccountId && t.is_payout);
  const totalPayouts = payouts.reduce((s, t) => s + Math.abs(parseFloat(t.pnl)), 0);
  const fmt = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(v);

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="animate-fade-up">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <select value={currentAccountId || ''} onChange={e => setCurrentAccountId(e.target.value)}
            className="bg-bg-card border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="bg-bg-card border border-brd rounded-xl px-4 py-2">
            <span className="text-[0.65rem] text-txt-3 font-mono uppercase tracking-wider">Total retiré</span>
            <div className="text-lg font-bold font-display text-amber-400">{fmt(totalPayouts)}</div>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all">
          + Payout
        </button>
      </div>

      <div className="bg-bg-card border border-brd rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-secondary">
            <tr>
              {['Date','Montant','Notes',''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[0.62rem] uppercase tracking-[1.2px] text-txt-3 font-bold border-b border-brd font-mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payouts.map(t => (
              <tr key={t.id} className="hover:bg-bg-card-hover transition-colors">
                <td className="px-4 py-3 font-mono text-[0.82rem] text-txt-2">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 font-bold font-mono text-amber-400 text-[0.88rem]">{fmt(Math.abs(parseFloat(t.pnl)))}</td>
                <td className="px-4 py-3 text-txt-2 text-sm">{t.notes || '-'}</td>
                <td className="px-4 py-3"><button onClick={() => deletePayout(t.id)} className="text-txt-3 hover:text-loss text-lg">×</button></td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr><td colSpan="4" className="text-center py-12 text-txt-3"><div className="text-3xl mb-2 opacity-40">◇</div>Aucun payout</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-bg-card border border-brd rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">Nouveau Payout</h2>
            <form onSubmit={addPayout} className="space-y-4">
              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required
                  className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Montant (€)</label>
                <input type="number" step="0.01" value={form.pnl} onChange={e => setForm({...form, pnl: e.target.value})} required placeholder="500.00"
                  className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Raison du retrait..."
                  className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-lg hover:opacity-90 text-sm">Ajouter</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-brd text-txt-2 rounded-lg text-sm">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
