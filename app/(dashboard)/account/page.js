'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', prop_firm: '', base_capital: '' });

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoData, setPromoData] = useState(null);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const { data: a } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id).order('created_at');

    setProfile(p);
    setAccounts(a || []);
    setLoading(false);
  };

  const createAccount = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount),
    });
    const data = await res.json();
    if (res.ok) {
      setAccounts([...accounts, data]);
      setNewAccount({ name: '', prop_firm: '', base_capital: '' });
      setShowAddForm(false);
      router.refresh();
    } else {
      alert(data.error);
    }
  };

  const deleteAccount = async (id, name) => {
    if (!confirm(`Supprimer "${name}" et tous ses trades ?`)) return;
    const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
    if (res.ok) { setAccounts(accounts.filter(a => a.id !== id)); router.refresh(); }
  };

  const toggleBurn = async (account) => {
    const msg = account.is_burned ? `Réactiver "${account.name}" ?` : `Griller "${account.name}" ?`;
    if (!confirm(msg)) return;
    const res = await fetch('/api/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: account.id, name: account.name, prop_firm: account.prop_firm, is_burned: !account.is_burned }),
    });
    if (res.ok) { loadData(); router.refresh(); }
  };

  const cancelSubscription = async () => {
    if (!confirm('Annuler ton abonnement ? Tu perdras l\'accès à la fin de la période en cours.')) return;
    const res = await fetch('/api/paypal/cancel', { method: 'POST' });
    if (res.ok) { alert('Abonnement annulé'); loadData(); }
    else { const d = await res.json(); alert(d.error || 'Erreur'); }
  };

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', prop_firm: '', base_capital: '' });

  const startEdit = (a) => {
    setEditingId(a.id);
    setEditForm({ name: a.name, prop_firm: a.prop_firm, base_capital: a.base_capital });
  };

  const saveEdit = async (id) => {
    const res = await fetch('/api/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editForm.name, prop_firm: editForm.prop_firm, base_capital: parseFloat(editForm.base_capital) }),
    });
    if (res.ok) { setEditingId(null); loadData(); router.refresh(); }
    else { const d = await res.json(); alert(d.error || 'Erreur'); }
  };

  const cancelEdit = () => setEditingId(null);

  const [planLoading, setPlanLoading] = useState(null);
  const [paypalPlans, setPaypalPlans] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paypalReady, setPaypalReady] = useState(false);

  // Promo: prix de base et calcul réduction
  const basePrices = { starter: 4.99, pro: 9.99, unlimited: 19.99 };

  const getDiscountedPrice = (planKey) => {
    if (promoData && promoData.applicable_plans.includes(planKey)) {
      const base = basePrices[planKey];
      return Math.round(base * (1 - promoData.discount_percent / 100) * 100) / 100;
    }
    return basePrices[planKey];
  };

  const hasDiscount = (planKey) => {
    return promoData && promoData.applicable_plans.includes(planKey);
  };

  const formatPrice = (price) => price.toFixed(2).replace('.', ',') + '€';

  // Validate promo code
  const validatePromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoData(null);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput, plan: selectedPlan }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setPromoData(data);
      } else {
        setPromoError(data.error || 'Code invalide');
      }
    } catch (err) {
      setPromoError('Erreur de connexion');
    }
    setPromoLoading(false);
  };

  const removePromo = () => {
    setPromoData(null);
    setPromoInput('');
    setPromoError('');
  };

  // Load PayPal plans + SDK
  const loadPayPalPlans = async () => {
    if (paypalPlans) return;
    try {
      const res = await fetch('/api/paypal/plans');
      const data = await res.json();
      setPaypalPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  // Load PayPal SDK once
  useEffect(() => {
    if (!selectedPlan || !paypalPlans) return;

    if (window.paypal) {
      setPaypalReady(true);
      return;
    }

    const existing = document.getElementById('paypal-sdk');
    if (existing) {
      existing.addEventListener('load', () => setPaypalReady(true));
      return;
    }

    setPaypalReady(false);
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription&currency=EUR`;
    script.addEventListener('load', () => {
      setPaypalReady(true);
    });
    document.head.appendChild(script);
  }, [selectedPlan, paypalPlans]);

  // Render PayPal buttons when ready or plan changes
  useEffect(() => {
    if (!paypalReady || !selectedPlan || !paypalPlans || !window.paypal) return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    container.innerHTML = '';

    const planId = paypalPlans[selectedPlan];
    if (!planId) return;

    // Si promo active sur ce plan, override le prix
    const applyDiscount = hasDiscount(selectedPlan);
    const discountedPrice = applyDiscount ? getDiscountedPrice(selectedPlan).toFixed(2) : null;

    try {
      window.paypal.Buttons({
        style: { shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe' },
        createSubscription: function(data, actions) {
          const subConfig = { plan_id: planId };
          // Override prix via PayPal si promo
          if (applyDiscount && discountedPrice) {
            subConfig.plan = {
              billing_cycles: [{
                sequence: 2,
                pricing_scheme: {
                  fixed_price: { value: discountedPrice, currency_code: 'EUR' }
                }
              }]
            };
          }
          return actions.subscription.create(subConfig);
        },
        onApprove: async function(data) {
          setPlanLoading(selectedPlan);
          try {
            const res = await fetch('/api/paypal/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscriptionId: data.subscriptionID,
                plan: selectedPlan,
                promoCode: promoData?.code || null,
              }),
            });
            if (res.ok) {
              window.location.href = '/dashboard?checkout=success';
            } else {
              const d = await res.json();
              alert(d.error || 'Erreur lors de l\'activation');
              setPlanLoading(null);
            }
          } catch (err) {
            alert('Erreur de connexion');
            setPlanLoading(null);
          }
        },
        onError: function(err) {
          console.error('PayPal error:', err);
          alert('Erreur PayPal. Réessaie.');
          setPlanLoading(null);
        },
      }).render('#paypal-button-container');
    } catch (err) {
      console.error('PayPal render error:', err);
    }
  }, [paypalReady, selectedPlan, paypalPlans, promoData]);

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  const hasSubscription = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';

  const planCards = [
    { key: 'starter', name: 'Starter', price: '4,99€', desc: '1 compte' },
    { key: 'pro', name: 'Pro', price: '9,99€', desc: '3 comptes', popular: true },
    { key: 'unlimited', name: 'Unlimited', price: '19,99€', desc: 'Illimité' },
  ];

  const renderPlanCard = (p) => (
    <button key={p.key} onClick={() => { setSelectedPlan(p.key); loadPayPalPlans(); }} disabled={planLoading !== null}
      className={`p-4 rounded-xl border text-left transition-all active:scale-95 ${planLoading === p.key ? 'opacity-60' : 'hover:-translate-y-0.5'} ${selectedPlan === p.key ? 'border-accent bg-accent-dim ring-2 ring-accent/30' : p.popular ? 'border-accent/40 bg-accent-dim/50' : 'border-brd hover:border-brd-hover'}`}>
      <div className="font-display font-bold">{p.name}</div>
      <div className="text-xl font-bold font-display">
        {hasDiscount(p.key) ? (
          <>
            <span className="line-through text-txt-3 text-sm mr-1">{p.price}</span>
            <span className="text-profit">{formatPrice(getDiscountedPrice(p.key))}</span>
          </>
        ) : (
          p.price
        )}
        <span className="text-txt-2 text-xs">/mois</span>
      </div>
      <div className="text-txt-2 text-xs mt-1">{p.desc}{!hasSubscription && ' · 7j essai gratuit'}</div>
      {hasDiscount(p.key) && (
        <div className="text-profit text-xs font-bold mt-1">-{promoData.discount_percent}% appliqué</div>
      )}
      {selectedPlan === p.key && <div className="text-accent text-xs font-bold mt-2">✓ Sélectionné</div>}
    </button>
  );

  const renderPromoSection = () => (
    <div className="mb-4">
      {promoData ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-profit/10 border border-profit/30 rounded-lg">
          <span className="text-profit text-sm font-bold">✓ Code {promoData.code} appliqué (-{promoData.discount_percent}%)</span>
          <button onClick={removePromo} className="ml-auto text-txt-3 hover:text-txt-1 text-xs font-bold">✕ Retirer</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Code promo"
            value={promoInput}
            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && validatePromo()}
            className="flex-1 bg-bg-secondary border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent font-mono uppercase placeholder:normal-case placeholder:font-sans"
          />
          <button
            onClick={validatePromo}
            disabled={promoLoading || !promoInput.trim()}
            className="px-4 py-2 bg-bg-secondary border border-brd text-txt-1 text-sm font-semibold rounded-lg hover:border-accent transition-all disabled:opacity-50"
          >
            {promoLoading ? '...' : 'Appliquer'}
          </button>
        </div>
      )}
      {promoError && <p className="text-loss text-xs mt-1.5">{promoError}</p>}
    </div>
  );

  const renderPayPalSection = () => (
    selectedPlan && (
      <div className="border border-brd rounded-xl p-5 bg-bg-secondary">
        <p className="text-sm text-txt-2 mb-3 text-center">Finalise ton abonnement avec PayPal :</p>
        {hasDiscount(selectedPlan) && (
          <p className="text-center text-profit text-xs font-bold mb-3">
            Prix avec promo : {formatPrice(getDiscountedPrice(selectedPlan))}/mois au lieu de {formatPrice(basePrices[selectedPlan])}/mois
          </p>
        )}
        <div id="paypal-button-container" className="max-w-sm mx-auto min-h-[50px]">
          {!paypalReady && <div className="text-center text-txt-3 text-sm py-4">Chargement PayPal...</div>}
        </div>
      </div>
    )
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      {/* Subscription */}
      <div className="bg-bg-card border border-brd rounded-xl p-6 mb-6">
        <h2 className="font-display font-bold text-lg mb-4">Mon Abonnement</h2>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-brd">
          <div>
            <div className="text-sm text-txt-2">Plan actuel</div>
            <div className="font-display font-bold text-xl capitalize">{profile?.plan || 'Aucun'}</div>
            <div className="text-xs font-mono text-txt-3 mt-1">
              {profile?.subscription_status === 'trialing' && '⏳ Période d\'essai'}
              {profile?.subscription_status === 'active' && '✓ Actif'}
              {profile?.subscription_status === 'past_due' && '⚠️ Paiement en retard'}
              {profile?.subscription_status === 'canceled' && '✗ Annulé'}
              {profile?.subscription_status === 'inactive' && '✗ Inactif'}
            </div>
            {profile?.promo_code && hasSubscription && (
              <div className="text-xs text-profit font-mono mt-1">Promo : {profile.promo_code}</div>
            )}
          </div>
          {hasSubscription && (
            <button onClick={cancelSubscription} className="px-4 py-2 text-sm font-semibold border border-loss text-loss rounded-lg hover:bg-loss-dim transition-all">
              Annuler l'abonnement
            </button>
          )}
        </div>

        {profile?.subscription_status === 'trialing' && (
          <div>
            <p className="text-txt-2 text-sm mb-4">Choisis ton plan avant la fin de ton essai :</p>
            {renderPromoSection()}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {planCards.map(renderPlanCard)}
            </div>
            {renderPayPalSection()}
          </div>
        )}

        {!hasSubscription && (
          <div>
            <p className="text-txt-2 text-sm mb-4">Choisis un plan pour accéder à TradeScope :</p>
            {renderPromoSection()}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {planCards.map(renderPlanCard)}
            </div>
            {renderPayPalSection()}
          </div>
        )}
      </div>

      {/* Trading Accounts */}
      <div className="bg-bg-card border border-brd rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-bold text-lg">Comptes de Trading</h2>
          <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-accent text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-glow">
            + Nouveau
          </button>
        </div>

        <div className="space-y-3">
          {accounts.map(a => (
            <div key={a.id} className={`p-4 bg-bg-secondary border border-brd rounded-xl transition-all ${a.is_burned ? 'opacity-50' : 'hover:border-brd-hover'}`}>
              {editingId === a.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">Nom</label>
                      <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-bg-card border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">Prop Firm</label>
                      <input type="text" value={editForm.prop_firm} onChange={e => setEditForm({...editForm, prop_firm: e.target.value})}
                        className="w-full bg-bg-card border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">Capital</label>
                      <input type="number" value={editForm.base_capital} onChange={e => setEditForm({...editForm, base_capital: e.target.value})}
                        className="w-full bg-bg-card border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(a.id)} className="px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:opacity-90">Sauvegarder</button>
                    <button onClick={cancelEdit} className="px-4 py-1.5 border border-brd text-txt-2 text-xs rounded-lg hover:border-accent">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="min-w-0">
                    <div className="font-bold truncate">
                      {a.name}
                      {a.is_burned && <span className="ml-2 text-[0.6rem] bg-loss text-white px-1.5 py-0.5 rounded font-bold">GRILLE</span>}
                    </div>
                    <div className="text-txt-2 text-sm truncate">{a.prop_firm} · {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(a.base_capital)}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(a)} className="px-3 py-1.5 border border-brd text-txt-2 rounded-lg text-xs font-semibold hover:border-accent hover:text-accent transition-all">
                      Editer
                    </button>
                    <button onClick={() => toggleBurn(a)} className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${a.is_burned ? 'border-profit text-profit hover:bg-profit-dim' : 'border-loss text-loss hover:bg-loss-dim'}`}>
                      {a.is_burned ? 'Reactiver' : 'Griller'}
                    </button>
                    <button onClick={() => deleteAccount(a.id, a.name)} className="px-3 py-1.5 border border-loss text-loss rounded-lg text-xs font-bold hover:bg-loss-dim transition-all">
                      x
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="text-center py-8 text-txt-3">Aucun compte de trading</div>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={createAccount} className="mt-4 pt-4 border-t border-brd space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="Nom du compte" required value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                className="bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
              <input type="text" placeholder="Prop Firm" required value={newAccount.prop_firm} onChange={e => setNewAccount({...newAccount, prop_firm: e.target.value})}
                className="bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
              <input type="number" placeholder="Capital (€)" required value={newAccount.base_capital} onChange={e => setNewAccount({...newAccount, base_capital: parseFloat(e.target.value)})}
                className="bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-accent text-white text-sm font-bold rounded-lg hover:opacity-90">Créer</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-brd text-txt-2 text-sm rounded-lg hover:border-accent">Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
