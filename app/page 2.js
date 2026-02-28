'use client';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerFast = {
  visible: { transition: { staggerChildren: 0.07 } },
};

function AnimatedSection({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerSection({ children, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerFastSection({ children, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerFast}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const plans = [
  {
    name: 'Starter', price: '4,99', period: '/mois', description: 'Tu commences. Un seul compte suffit.',
    features: ['1 compte de trading', 'Trades illimités', 'Statistiques du compte', 'Calendrier P&L', 'Calcul R:R automatique'],
    notIncluded: ['Stats globales', 'Playbook', 'Export données'],
    badge: null, accent: false, priceKey: 'starter',
  },
  {
    name: 'Pro', price: '9,99', period: '/mois', description: 'Tu trades sérieusement. Tes comptes restent séparés.',
    features: ['3 comptes de trading', 'Trades illimités', 'Statistiques du compte', 'Statistiques globales', 'Calendrier P&L', 'Calcul R:R automatique', 'Playbook & Checklist'],
    notIncluded: ['Export données'],
    badge: 'Populaire', accent: true, priceKey: 'pro',
  },
  {
    name: 'Unlimited', price: '19,99', period: '/mois', description: 'Comptes illimités. Pour les prop traders multi-comptes.',
    features: ['Comptes illimités', 'Trades illimités', 'Statistiques du compte', 'Statistiques globales', 'Calendrier P&L', 'Calcul R:R automatique', 'Playbook & Checklist', 'Export données'],
    notIncluded: [],
    badge: 'Best Value', accent: false, priceKey: 'unlimited',
  },
];

function MockDashboard() {
  return (
    <div className="bg-[#08090E] rounded-xl border border-white/[0.06] overflow-hidden text-white text-[0.65rem] shadow-2xl">
      <div className="bg-[#0E1018] border-b border-white/[0.06] px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-400 rounded text-[0.5rem] flex items-center justify-center font-bold">TS</div>
          <span className="font-bold text-[0.7rem]">Dashboard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span className="text-gray-400">FTMO 100K</span>
        </div>
      </div>
      <div className="p-3 space-y-2.5">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Capital', value: '104,250€', color: 'text-white' },
            { label: 'P&L Total', value: '+4,250€', color: 'text-green-400' },
            { label: 'Win Rate', value: '68%', color: 'text-green-400' },
            { label: 'R:R Moyen', value: '2.4R', color: 'text-green-400' },
          ].map(m => (
            <div key={m.label} className="bg-[#13151F] border border-white/[0.06] rounded-lg p-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60"></div>
              <div className="text-[0.5rem] text-gray-500 uppercase tracking-wider font-mono">{m.label}</div>
              <div className={`text-[0.75rem] font-bold mt-0.5 ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>
        <div className="bg-[#13151F] border border-white/[0.06] rounded-lg p-2.5">
          <div className="text-[0.5rem] text-gray-500 uppercase tracking-wider font-mono mb-2">Calendrier P&L - Février 2026</div>
          <div className="grid grid-cols-7 gap-1">
            {['L','M','M','J','V','S','D'].map((d,i) => (
              <div key={i} className="text-center text-[0.45rem] text-gray-600 font-mono">{d}</div>
            ))}
            {[null,null,null,null,null,1,2,3,4,5,6,7,8,9,10,11].map((d,i) => (
              <div key={i} className={`text-center py-0.5 rounded text-[0.5rem] ${
                d === null ? '' :
                [3,5,7,10].includes(d) ? 'bg-green-500/15 text-green-400 font-bold' :
                [4,8].includes(d) ? 'bg-red-500/15 text-red-400 font-bold' :
                [6,9,11].includes(d) ? 'bg-green-500/10 text-green-400' :
                'text-gray-600'
              }`}>{d || ''}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockTrades() {
  const trades = [
    { inst: 'NQ', type: 'LONG', pnl: '+850.00€', pct: '+0.82%', rr: '2.83R', date: 'Lun. 10 fév.', win: true },
    { inst: 'ES', type: 'SHORT', pnl: '-300.00€', pct: '-0.29%', rr: '-1.00R', date: 'Ven. 7 fév.', win: false },
    { inst: 'NQ', type: 'LONG', pnl: '+1,200.00€', pct: '+1.16%', rr: '4.00R', date: 'Jeu. 6 fév.', win: true },
  ];
  return (
    <div className="bg-[#08090E] rounded-xl border border-white/[0.06] overflow-hidden text-white text-[0.65rem] shadow-2xl">
      <div className="bg-[#0E1018] border-b border-white/[0.06] px-4 py-2 flex justify-between items-center">
        <span className="font-bold text-[0.7rem]">Trades</span>
        <div className="flex gap-1">
          <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-[0.5rem] font-bold">Tout</span>
          <span className="px-2 py-0.5 bg-[#13151F] text-gray-400 rounded text-[0.5rem]">Mois</span>
          <span className="px-2 py-0.5 bg-[#13151F] text-gray-400 rounded text-[0.5rem]">Wins</span>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#13151F] border border-white/[0.06] rounded-lg p-2 text-center">
            <div className="text-[0.45rem] text-gray-500 font-mono uppercase">Trades</div>
            <div className="font-bold text-[0.8rem]">47</div>
          </div>
          <div className="bg-[#13151F] border border-white/[0.06] rounded-lg p-2 text-center">
            <div className="text-[0.45rem] text-gray-500 font-mono uppercase">P&L</div>
            <div className="font-bold text-[0.8rem] text-green-400">+4,250€</div>
          </div>
          <div className="bg-[#13151F] border border-white/[0.06] rounded-lg p-2 text-center">
            <div className="text-[0.45rem] text-gray-500 font-mono uppercase">Win Rate</div>
            <div className="font-bold text-[0.8rem] text-green-400">68%</div>
          </div>
        </div>
        {trades.map((t, i) => (
          <div key={i} className="bg-[#13151F] border border-white/[0.06] rounded-lg p-2.5">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[0.7rem]">{t.inst}</span>
                <span className={`px-1 py-0.5 rounded text-[0.45rem] font-bold ${t.type === 'LONG' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>{t.type}</span>
              </div>
              <div className="text-right">
                <div className={`font-bold font-mono text-[0.7rem] ${t.win ? 'text-green-400' : 'text-red-400'}`}>{t.pnl}</div>
                <div className={`text-[0.5rem] font-mono ${t.win ? 'text-green-400' : 'text-red-400'}`}>{t.pct}</div>
              </div>
            </div>
            <div className="flex gap-3 text-[0.5rem] text-gray-500">
              <span>R:R <span className={`font-bold ${t.win ? 'text-green-400' : 'text-red-400'}`}>{t.rr}</span></span>
              <span>{t.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockStats() {
  const days = [
    { d: 'Lun', v: 75, win: true },
    { d: 'Mar', v: 40, win: true },
    { d: 'Mer', v: 60, win: false },
    { d: 'Jeu', v: 90, win: true },
    { d: 'Ven', v: 30, win: true },
  ];
  return (
    <div className="bg-[#08090E] rounded-xl border border-white/[0.06] overflow-hidden text-white text-[0.65rem] shadow-2xl">
      <div className="bg-[#0E1018] border-b border-white/[0.06] px-4 py-2">
        <span className="font-bold text-[0.7rem]">Statistiques</span>
      </div>
      <div className="p-3 space-y-2.5">
        <div className="bg-[#13151F] border border-white/[0.06] rounded-lg p-2.5">
          <div className="text-[0.5rem] text-gray-500 uppercase tracking-wider font-mono mb-2">Performance par Jour</div>
          <div className="space-y-1.5">
            {days.map(d => (
              <div key={d.d} className="flex items-center gap-2">
                <span className="text-[0.55rem] text-gray-400 w-6 font-mono">{d.d}</span>
                <div className="flex-1 h-3 bg-[#0E1018] rounded overflow-hidden">
                  <div className={`h-full rounded ${d.win ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${d.v}%` }}></div>
                </div>
                <span className={`text-[0.55rem] font-mono font-bold w-10 text-right ${d.win ? 'text-green-400' : 'text-red-400'}`}>
                  {d.win ? '+' : '-'}{Math.round(d.v * 12)}€
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 text-center">
            <div className="text-[0.5rem] font-mono text-green-400 font-bold mb-1">LONG</div>
            <div className="text-[0.85rem] font-bold text-green-400">+3,100€</div>
            <div className="text-[0.5rem] text-gray-400 mt-0.5">28 trades | 71% WR</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-center">
            <div className="text-[0.5rem] font-mono text-red-400 font-bold mb-1">SHORT</div>
            <div className="text-[0.85rem] font-bold text-green-400">+1,150€</div>
            <div className="text-[0.5rem] text-gray-400 mt-0.5">19 trades | 63% WR</div>
          </div>
        </div>
        <div className="bg-[#13151F] border border-white/[0.06] rounded-lg p-2.5 text-center">
          <div className="text-[0.5rem] text-gray-500 uppercase tracking-wider font-mono mb-1">Respect Stratégie</div>
          <div className="text-xl font-bold text-green-400">87%</div>
          <div className="text-[0.5rem] text-gray-400">41 / 47 trades</div>
        </div>
      </div>
    </div>
  );
}

function MockPlaybook() {
  const rules = [
    { text: 'Attendre confirmation du setup avant entrée', checked: true },
    { text: 'Stop loss placé AVANT le trade', checked: true },
    { text: 'Max 2 trades par jour', checked: true },
    { text: 'Pas de trade pendant les news', checked: false },
    { text: 'Respecter le R:R minimum de 2:1', checked: true },
  ];
  return (
    <div className="bg-[#08090E] rounded-xl border border-white/[0.06] overflow-hidden text-white text-[0.65rem] shadow-2xl">
      <div className="bg-[#0E1018] border-b border-white/[0.06] px-4 py-2 flex justify-between items-center">
        <span className="font-bold text-[0.7rem]">Playbook</span>
        <span className="text-green-400 font-bold text-[0.7rem]">80%</span>
      </div>
      <div className="p-3">
        <div className="w-full h-1.5 bg-[#13151F] rounded-full mb-3 overflow-hidden">
          <div className="h-full bg-green-500 rounded-full" style={{ width: '80%' }}></div>
        </div>
        <div className="space-y-1.5">
          {rules.map((r, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${r.checked ? 'bg-green-500/8 border-green-500/15' : 'bg-[#13151F] border-white/[0.06]'}`}>
              <div className={`w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center border ${r.checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-600'}`}>
                {r.checked && <span className="text-[0.4rem]">✓</span>}
              </div>
              <span className={`text-[0.6rem] ${r.checked ? 'line-through text-gray-500' : 'text-gray-300'}`}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const painPoints = [
  { emoji: '😩', text: '"J\'ai essayé Excel.\nJ\'ai abandonné après 2 semaines."' },
  { emoji: '😤', text: '"J\'ai 2 comptes FTMO et je mélange tout."' },
  { emoji: '📉', text: '"Je refais les mêmes erreurs sans m\'en rendre compte."' },
];

const faqs = [
  {
    q: 'Est-ce que je dois rentrer mes trades à la main ?',
    a: 'Oui — et c\'est volontaire. Saisir ton trade te force à le valider consciemment. TradeScope est conçu pour que ça prenne moins de 30 secondes.',
  },
  {
    q: 'Ça marche pour quels marchés ?',
    a: 'TradeScope est optimisé pour les Futures (NQ, ES, CL...) et les Indices. Forex et crypto sont aussi supportés.',
  },
  {
    q: 'Je peux gérer mon compte FTMO et mon compte perso séparément ?',
    a: 'C\'est exactement pour ça qu\'on a créé TradeScope. Chaque compte a ses propres stats, son propre P&L, son propre historique. Zéro mélange.',
  },
  {
    q: 'Je peux annuler quand je veux ?',
    a: 'Oui. Pas de contrat, pas d\'engagement. Tu annules en 1 clic depuis ton dashboard.',
  },
  {
    q: 'C\'est quoi la différence avec un Excel ?',
    a: 'Excel ne calcule pas ton R:R automatiquement, ne te montre pas tes patterns par jour de semaine, et ne te force pas à respecter ton playbook. Et surtout — tu abandonneras Excel dans 2 semaines. TradeScope, non.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-brd px-6 py-4 flex justify-between items-center max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-accent-glow">TS</div>
          <span className="font-display font-bold text-lg tracking-tight">TradeScope <span className="text-txt-2 font-medium text-xs ml-1">v2</span></span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-txt-2 border border-brd rounded-lg hover:border-accent hover:text-accent transition-all">Connexion</Link>
          <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold bg-accent text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-glow">Commencer gratuitement</Link>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center pt-20 pb-16 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-block px-4 py-1.5 bg-accent-dim border border-accent/20 rounded-full text-accent text-xs font-semibold font-mono tracking-wider mb-6"
        >
          🎯 CONÇU POUR LES PROP TRADERS & TRADERS SÉRIEUX — FUTURES & INDICES
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight"
        >
          Le journal de trading<br />
          <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">que tu vas enfin utiliser</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-txt-2 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          Tu sais que tu devrais tenir un journal. Tu ne le fais pas.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="text-txt-2 text-base max-w-xl mx-auto mb-10 leading-relaxed"
        >
          TradeScope règle ça — en 30 secondes par trade, sur Futures et Indices.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accent-glow text-lg">
            Essayer gratuitement 7 jours — sans carte bancaire
          </Link>
          <p className="text-txt-3 text-xs mt-3">Annulation en 1 clic. Aucun engagement.</p>
        </motion.div>
      </section>

      {/* App Preview */}
      <AnimatedSection className="max-w-5xl mx-auto px-6 pb-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent rounded-3xl -z-10 blur-3xl"></div>
          <div className="max-w-3xl mx-auto">
            <MockDashboard />
          </div>
        </div>
      </AnimatedSection>

      {/* Pain Points */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <AnimatedSection>
          <h2 className="font-display text-3xl font-bold text-center mb-3 tracking-tight">Tu ressembles à ça ?</h2>
          <p className="text-txt-2 text-center mb-12 max-w-xl mx-auto">La plupart des traders sérieux ont ce problème. TradeScope a été conçu exactement pour ça.</p>
        </AnimatedSection>
        <StaggerSection className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {painPoints.map((p, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-bg-card border border-brd rounded-xl p-6 text-center hover:border-brd-hover transition-all">
              <div className="text-4xl mb-4">{p.emoji}</div>
              <p className="text-txt-2 text-sm leading-relaxed whitespace-pre-line font-medium">{p.text}</p>
            </motion.div>
          ))}
        </StaggerSection>
        <AnimatedSection>
          <p className="text-center font-bold text-accent text-lg">TradeScope a été conçu exactement pour ça.</p>
        </AnimatedSection>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <AnimatedSection>
          <h2 className="font-display text-3xl font-bold text-center mb-3 tracking-tight">Tout ce qu'il te faut</h2>
          <p className="text-txt-2 text-center mb-16 max-w-xl mx-auto">Des outils concrets pour analyser, progresser et rester discipliné.</p>
        </AnimatedSection>

        {/* Playbook */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <AnimatedSection>
            <div className="inline-block px-3 py-1 bg-accent-dim text-accent text-xs font-bold rounded-full font-mono mb-4">PLAYBOOK</div>
            <h3 className="font-display font-bold text-2xl mb-3">Arrête de dévier de ton plan. Chaque jour.</h3>
            <p className="text-txt-2 leading-relaxed mb-4">
              Tes règles. Ta checklist. Ton score de discipline. TradeScope te montre si tu te respectes, trade après trade — pas juste en théorie.
            </p>
            <ul className="space-y-2 text-sm text-txt-2">
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Checklist quotidienne personnalisable</li>
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Score de discipline en temps réel</li>
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Tes règles, pas celles d'un autre</li>
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Suivi sur la durée</li>
            </ul>
          </AnimatedSection>
          <AnimatedSection delay={0.15} className="lg:pl-8">
            <MockPlaybook />
          </AnimatedSection>
        </div>

        {/* Journal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <AnimatedSection className="lg:order-2">
            <div className="inline-block px-3 py-1 bg-accent-dim text-accent text-xs font-bold rounded-full font-mono mb-4">JOURNAL</div>
            <h3 className="font-display font-bold text-2xl mb-3">30 secondes par trade. Pas plus.</h3>
            <p className="text-txt-2 leading-relaxed mb-4">
              P&L, R:R, instrument, direction — tout calculé automatiquement. Tu trades, tu cliques, tu passes à autre chose. Fini l'excuse du "c'est trop long à remplir".
            </p>
            <ul className="space-y-2 text-sm text-txt-2">
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Calcul R:R automatique</li>
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Filtres par période, wins/losses</li>
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Export CSV en un clic</li>
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Lien TradingView par trade</li>
            </ul>
          </AnimatedSection>
          <AnimatedSection delay={0.15} className="lg:order-1 lg:pr-8">
            <MockTrades />
          </AnimatedSection>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <AnimatedSection>
            <div className="inline-block px-3 py-1 bg-accent-dim text-accent text-xs font-bold rounded-full font-mono mb-4">STATISTIQUES</div>
            <h3 className="font-display font-bold text-2xl mb-3">Les stats te disent tout, sans mentir.</h3>
            <p className="text-txt-2 leading-relaxed mb-4">
              Quel jour tu trades le mieux ? Long ou short ? Est-ce que tu respectes ta stratégie ? Arrête de trader à l'instinct. Commence à trader avec des données.
            </p>
            <ul className="space-y-2 text-sm text-txt-2">
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Performance par jour de la semaine</li>
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Long vs Short avec win rate</li>
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Taux de respect de stratégie</li>
              <li className="flex items-center gap-2"><span className="text-profit">✓</span> Meilleurs instruments</li>
            </ul>
          </AnimatedSection>
          <AnimatedSection delay={0.15} className="lg:pl-8">
            <MockStats />
          </AnimatedSection>
        </div>

        {/* Multi-comptes */}
        <AnimatedSection>
          <div className="bg-bg-card border border-brd rounded-2xl p-10 text-center hover:border-brd-hover transition-all">
            <div className="inline-block px-3 py-1 bg-accent-dim text-accent text-xs font-bold rounded-full font-mono mb-4">MULTI-COMPTES</div>
            <h3 className="font-display font-bold text-2xl mb-3">FTMO, compte perso, challenge — enfin séparés.</h3>
            <p className="text-txt-2 leading-relaxed max-w-2xl mx-auto">
              Chaque compte a ses propres stats, son propre P&L, sa propre progression. Tu sais exactement où tu en es sur chacun — sans jamais mélanger.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 pb-24" id="pricing">
        <AnimatedSection>
          <h2 className="font-display text-3xl font-bold text-center mb-3 tracking-tight">Commence gratuitement. Paie si tu aimes.</h2>
          <p className="text-txt-2 text-center mb-12">7 jours sans carte bancaire. Annule en 1 clic.</p>
        </AnimatedSection>
        <StaggerSection className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`relative bg-bg-card border rounded-xl p-8 transition-colors ${plan.accent ? 'border-accent shadow-lg shadow-accent-glow' : 'border-brd hover:border-brd-hover'}`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${plan.accent ? 'bg-accent text-white' : 'bg-purple-500/20 text-purple-400'}`}>{plan.badge}</div>
              )}
              <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
              <p className="text-txt-2 text-sm mb-6">{plan.description}</p>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold">{plan.price}€</span>
                <span className="text-txt-2 text-sm">{plan.period}</span>
              </div>
              <Link href={`/auth/register?plan=${plan.priceKey}`} className={`block text-center py-3 rounded-lg font-semibold text-sm transition-all mb-8 ${plan.accent ? 'bg-accent text-white hover:opacity-90 shadow-lg shadow-accent-glow' : 'border border-brd text-txt-2 hover:border-accent hover:text-accent hover:bg-accent-dim'}`}>
                Essai gratuit 7 jours — sans carte
              </Link>
              <ul className="space-y-3">
                {plan.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm"><span className="text-profit text-xs">✓</span> {f}</li>))}
                {plan.notIncluded.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-txt-3"><span className="text-xs">✗</span> {f}</li>))}
              </ul>
            </motion.div>
          ))}
        </StaggerSection>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <AnimatedSection>
          <h2 className="font-display text-3xl font-bold text-center mb-3 tracking-tight">Questions fréquentes</h2>
          <p className="text-txt-2 text-center mb-12">Tout ce que tu te demandes avant de te lancer.</p>
        </AnimatedSection>
        <StaggerFastSection className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-bg-card border border-brd rounded-xl p-6 hover:border-brd-hover transition-all">
              <h3 className="font-semibold text-base mb-2">{faq.q}</h3>
              <p className="text-txt-2 text-sm leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </StaggerFastSection>
      </section>

      {/* CTA Final */}
      <AnimatedSection className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="bg-bg-card border border-accent/20 rounded-2xl p-12 shadow-lg shadow-accent-glow/10">
          <h2 className="font-display text-3xl font-bold mb-4 tracking-tight">
            Prêt à trader avec plus de clarté ?
          </h2>
          <p className="text-txt-2 text-lg mb-8 max-w-xl mx-auto">
            Rejoins les traders qui ont arrêté de se mentir sur leurs performances.
          </p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accent-glow text-lg">
            Essayer gratuitement 7 jours — sans carte bancaire
          </Link>
          <p className="text-txt-3 text-xs mt-3">Annulation en 1 clic. Aucun engagement.</p>
        </div>
      </AnimatedSection>

      {/* Contact */}
      <section id="contact" className="py-20 px-6">
        <AnimatedSection className="max-w-lg mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-center">Une question ?</h2>
          <p className="text-txt-2 mb-8 text-center">Envoie-nous un message, on répond rapidement.</p>
          <ContactForm />
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-brd py-8 px-6 text-center text-txt-3 text-sm">
        <p>&copy; {new Date().getFullYear()} TradeScope. Tous droits réservés.</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <a href="/cgv" className="text-txt-3 hover:text-accent transition-colors underline">CGV</a>
          <span className="text-brd">·</span>
          <a href="mailto:support@tradescopev2.fr" className="text-txt-3 hover:text-accent transition-colors underline">Contact</a>
        </div>
      </footer>

    </div>
  );
}
