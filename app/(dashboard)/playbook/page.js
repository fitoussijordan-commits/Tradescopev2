'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function PlaybookPage() {
  const [rules, setRules] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState('');
  const [userId, setUserId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: r } = await supabase.from('playbook_rules').select('*').eq('user_id', user.id).order('sort_order');
    const { data: c } = await supabase.from('daily_checklist').select('*').eq('user_id', user.id).eq('date', today);
    setRules(r || []);
    setChecklist(c || []);
    setLoading(false);
  };

  const addRule = async (e) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    const res = await fetch('/api/playbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newRule.trim() }),
    });
    if (res.ok) { setNewRule(''); loadData(); }
  };

  const deleteRule = async (id) => {
    if (!confirm('Supprimer cette règle ?')) return;
    await fetch(`/api/playbook?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  const toggleCheck = async (ruleId) => {
    const supabase = createClient();
    const existing = checklist.find(c => c.rule_id === ruleId);
    if (existing) {
      await supabase.from('daily_checklist').update({ checked: !existing.checked }).eq('id', existing.id);
    } else {
      await supabase.from('daily_checklist').insert({ user_id: userId, rule_id: ruleId, date: today, checked: true });
    }
    loadData();
  };

  const isChecked = (ruleId) => {
    const item = checklist.find(c => c.rule_id === ruleId);
    return item?.checked || false;
  };

  const checkedCount = rules.filter(r => isChecked(r.id)).length;
  const completionPct = rules.length > 0 ? ((checkedCount / rules.length) * 100).toFixed(0) : 0;

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      {/* Daily progress */}
      <div className="bg-bg-card border border-brd rounded-xl p-6 mb-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-display font-bold text-lg">Checklist du jour</h2>
            <p className="text-txt-2 text-sm">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className={`text-3xl font-bold font-display ${completionPct == 100 ? 'text-profit' : completionPct >= 50 ? 'text-amber-400' : 'text-loss'}`}>
            {completionPct}%
          </div>
        </div>

        <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden mb-5">
          <div className={`h-full rounded-full transition-all duration-500 ${completionPct == 100 ? 'bg-profit' : completionPct >= 50 ? 'bg-amber-400' : 'bg-loss'}`}
            style={{ width: `${completionPct}%` }} />
        </div>

        {rules.length > 0 ? (
          <div className="space-y-2">
            {rules.map(r => (
              <div key={r.id} onClick={() => toggleCheck(r.id)}
                className={`flex items-center gap-3 p-3.5 rounded-lg cursor-pointer transition-all border ${isChecked(r.id) ? 'bg-profit-dim border-profit/20' : 'bg-bg-secondary border-brd hover:border-brd-hover'}`}>
                <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${isChecked(r.id) ? 'bg-profit border-profit text-white' : 'border-txt-3'}`}>
                  {isChecked(r.id) && <span className="text-xs">✓</span>}
                </div>
                <span className={`text-sm flex-1 ${isChecked(r.id) ? 'line-through text-txt-3' : 'text-txt-1'}`}>{r.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-txt-3">
            <div className="text-3xl mb-2 opacity-40">▦</div>
            <p className="text-sm">Ajoute des règles à ton playbook ci-dessous</p>
          </div>
        )}
      </div>

      {/* Rules management */}
      <div className="bg-bg-card border border-brd rounded-xl p-6">
        <h2 className="font-display font-bold text-lg mb-4">Mes Règles de Trading</h2>

        <form onSubmit={addRule} className="flex gap-2 mb-5">
          <input type="text" value={newRule} onChange={e => setNewRule(e.target.value)} placeholder="Nouvelle règle..."
            className="flex-1 bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
          <button type="submit" className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-lg hover:opacity-90 shadow-lg shadow-accent/25">+</button>
        </form>

        <div className="space-y-2">
          {rules.map((r, i) => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-bg-secondary border border-brd rounded-lg group">
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] text-txt-3 font-mono font-bold w-5">{i + 1}.</span>
                <span className="text-sm">{r.text}</span>
              </div>
              <button onClick={() => deleteRule(r.id)} className="text-txt-3 hover:text-loss opacity-0 group-hover:opacity-100 transition-all text-lg px-2">×</button>
            </div>
          ))}
          {rules.length === 0 && <div className="text-center py-4 text-txt-3 text-sm">Aucune règle définie</div>}
        </div>
      </div>
    </div>
  );
}
