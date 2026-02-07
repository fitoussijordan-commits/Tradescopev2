import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '4,99',
    period: '/mois',
    description: 'Parfait pour débuter',
    features: ['1 compte de trading', 'Trades illimités', 'Statistiques du compte', 'Calendrier P&L', 'Calcul R:R automatique'],
    notIncluded: ['Stats globales', 'Playbook', 'Export données'],
    badge: null,
    accent: false,
    priceKey: 'starter',
  },
  {
    name: 'Pro',
    price: '9,99',
    period: '/mois',
    description: 'Pour les traders sérieux',
    features: ['3 comptes de trading', 'Trades illimités', 'Statistiques du compte', 'Statistiques globales', 'Calendrier P&L', 'Calcul R:R automatique', 'Playbook & Checklist'],
    notIncluded: ['Export données'],
    badge: 'Populaire',
    accent: true,
    priceKey: 'pro',
  },
  {
    name: 'Unlimited',
    price: '19,99',
    period: '/mois',
    description: 'Accès complet sans limites',
    features: ['Comptes illimités', 'Trades illimités', 'Statistiques du compte', 'Statistiques globales', 'Calendrier P&L', 'Calcul R:R automatique', 'Playbook & Checklist', 'Export données'],
    notIncluded: [],
    badge: 'Best Value',
    accent: false,
    priceKey: 'unlimited',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-brd px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-accent-glow">
            TS
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            TradeScope <span className="text-txt-2 font-medium text-xs ml-1">v2</span>
          </span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-txt-2 border border-brd rounded-lg hover:border-accent hover:text-accent transition-all">
            Connexion
          </Link>
          <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold bg-accent text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-glow">
            Commencer gratuitement
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center pt-20 pb-16 px-6">
        <div className="inline-block px-4 py-1.5 bg-accent-dim border border-accent/20 rounded-full text-accent text-xs font-semibold font-mono tracking-wider mb-6">
          7 JOURS D'ESSAI GRATUIT
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Le journal de trading<br />
          <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
            qui te rend meilleur
          </span>
        </h1>
        <p className="text-txt-2 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Track tes trades, analyse tes stats, identifie tes forces et faiblesses.
          TradeScope t'aide à devenir un trader consistant et rentable.
        </p>
        <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accent-glow text-lg">
          Commencer — C'est gratuit 7 jours
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '◈', title: 'Dashboard Complet', desc: 'Calendrier P&L, métriques clés, résumé hebdomadaire. Tout ce qu\'il faut en un coup d\'œil.' },
            { icon: '△', title: 'Stats Avancées', desc: 'Win rate, R:R moyen, performance par jour, long vs short, respect de stratégie.' },
            { icon: '▦', title: 'Playbook', desc: 'Ta checklist personnalisée pour ne jamais dévier de ton plan de trading.' },
          ].map((f) => (
            <div key={f.title} className="bg-bg-card border border-brd rounded-xl p-6 hover:border-brd-hover transition-all">
              <div className="text-2xl mb-4 opacity-60">{f.icon}</div>
              <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-txt-2 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 pb-24" id="pricing">
        <h2 className="font-display text-3xl font-bold text-center mb-3 tracking-tight">Tarifs simples et transparents</h2>
        <p className="text-txt-2 text-center mb-12">7 jours d'essai gratuit sur tous les plans. Annule quand tu veux.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-bg-card border rounded-xl p-8 transition-all hover:-translate-y-1 ${
                plan.accent ? 'border-accent shadow-lg shadow-accent-glow' : 'border-brd hover:border-brd-hover'
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                  plan.accent ? 'bg-accent text-white' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {plan.badge}
                </div>
              )}
              <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
              <p className="text-txt-2 text-sm mb-6">{plan.description}</p>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold">{plan.price}€</span>
                <span className="text-txt-2 text-sm">{plan.period}</span>
              </div>
              <Link
                href={`/auth/register?plan=${plan.priceKey}`}
                className={`block text-center py-3 rounded-lg font-semibold text-sm transition-all mb-8 ${
                  plan.accent
                    ? 'bg-accent text-white hover:opacity-90 shadow-lg shadow-accent-glow'
                    : 'border border-brd text-txt-2 hover:border-accent hover:text-accent hover:bg-accent-dim'
                }`}
              >
                Essai gratuit 7 jours
              </Link>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-profit text-xs">✓</span> {f}
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-txt-3">
                    <span className="text-xs">✗</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brd py-8 px-6 text-center text-txt-3 text-sm">
        <p>© {new Date().getFullYear()} TradeScope. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
