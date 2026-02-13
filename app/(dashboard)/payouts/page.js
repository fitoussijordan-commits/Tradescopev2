'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAccount } from '@/components/AccountContext';

export default function PayoutsPage() {
  const { accounts, currentAccount, currentAccountId } = useAccount();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], pnl: '', notes: '' });

  useEffect(() => { loadData(); }, [currentAccountId]);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: t } = await supabase.from('trades').select('*').eq('user_id', user.id).order('date', { ascending: false });
    setTrades(t || []);
    setLoading(false);
  };

  const addPayout = async (e) => {
    e.preventDefault();
    const pnl = -Math.abs(parseFloat(form.pnl));
    const res = await fetch('/api/trades', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: currentAccountId, date: form.date, pnl, notes: form.notes, is_payout: true }),
    });
    if (res.ok) { setShowModal(false); setForm({ date: new Date().toISOString().split('T')[0], pnl: '', notes: '' }); loadData(); }
  };

  const deletePayout = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (deleting === id) { await fetch('/api/trades?id=' + id, { method: 'DELETE' }); setDeleting(null); loadData(); }
    else { setDeleting(id); setTimeout(() => setDeleting(null), 3000); }
  };

  const payouts = trades.filter(t => t.account_id === currentAccountId && t.is_payout);
  const totalPayouts = payouts.reduce((s, t) => s + Math.abs(parseFloat(t.pnl)), 0);
  const fmt = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(v);

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="animate-fade-up">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-bg-card border border-brd rounded-xl px-4 py-2">
            <span className="text-[0.65rem] text-txt-3 font-mono uppercase tracking-wider">Total retiré</span>
            <div className="text-lg font-bold font-display text-amber-400">{fmt(totalPayouts)}</div>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-lg active:scale-95 transition-all">+ Payout</button>
      </div>

      <div className="space-y-3">
        {payouts.map(t => (
          <div key={t.id} className="bg-bg-card border border-brd rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-amber-400 text-lg font-bold font-mono">{fmt(Math.abs(parseFloat(t.pnl)))}</div>
                <div className="text-[0.78rem] text-txt-2 font-mono mt-0.5">{new Date(t.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                {t.notes && <div className="text-txt-2 text-xs mt-2">{t.notes}</div>}
              </div>
              <button onClick={(e) => deletePayout(e, t.id)} className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ' + (deleting === t.id ? 'bg-loss text-white' : 'text-txt-3 border border-brd')}>{deleting === t.id ? 'Confirmer ?' : '×'}</button>
            </div>
          </div>
        ))}
        {payouts.length === 0 && <div className="text-center py-16 text-txt-3"><div className="text-4xl mb-3 opacity-40">◇</div><p>Aucun payout</p></div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-bg-card border border-brd rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">Nouveau Payout</h2>
            <form onSubmit={addPayout} className="space-y-4">
              <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
              <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Montant (€)</label><input type="number" step="0.01" value={form.pnl} onChange={e => setForm({...form, pnl: e.target.value})} required placeholder="500.00" className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
              <div><label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Notes</label><input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Raison du retrait..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-accent" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-lg text-sm active:scale-95 transition-all">Ajouter</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-brd text-txt-2 rounded-lg text-sm active:scale-95">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
