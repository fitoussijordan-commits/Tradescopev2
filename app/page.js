'use client';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import { Logo, Icon } from '@/components/Brand';
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

// ---------- Aperçus produit (utilisent les tokens du thème) ----------

function Window({ title, right, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-brd bg-bg-secondary overflow-hidden text-txt-1 text-[0.7rem] ${className}`} style={{ boxShadow: 'var(--shadow-pop)' }}>
      <div className="border-b border-brd px-4 h-10 flex justify-between items-center bg-bg-primary/60">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--brd-hover)' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--brd-hover)' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--brd-hover)' }} />
          </div>
          <span className="font-medium text-[0.72rem] text-txt-2">{title}</span>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

const MiniLabel = ({ children }) => <div className="text-[0.55rem] text-txt-3 uppercase tracking-[0.12em] font-mono">{children}</div>;

function MockDashboard() {
  const curve = [0, 8, 5, 14, 12, 22, 19, 30, 27, 38, 44, 40, 52, 58, 55, 66, 72, 70, 81, 88];
  const w = 520, h = 120;
  const pts = curve.map((v, i) => [(i / (curve.length - 1)) * w, h - (v / 90) * h]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <Window
      title="Dashboard"
      right={<div className="flex items-center gap-1.5 text-txt-2"><span className="w-1.5 h-1.5 bg-profit rounded-full" /><span className="font-mono text-[0.62rem]">FTMO 100K</span></div>}
    >
      <div className="flex">
        <div className="hidden sm:flex w-36 border-r border-brd p-3 flex-col gap-1">
          {['Dashboard', 'Trades', 'Payouts', 'Statistiques', 'Stratégies', 'Playbook'].map((n, i) => (
            <div key={n} className={`px-2 py-1.5 rounded-lg text-[0.62rem] ${i === 0 ? 'bg-bg-card border border-brd text-txt-1' : 'text-txt-3'}`}>{n}</div>
          ))}
        </div>
        <div className="flex-1 p-3 md:p-4 space-y-3 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Capital', value: '104 250 €', color: 'text-txt-1' },
              { label: 'P&L total', value: '+4 250 €', color: 'text-profit' },
              { label: 'Win rate', value: '68 %', color: 'text-profit' },
              { label: 'R:R moyen', value: '2.4R', color: 'text-profit' },
            ].map(m => (
              <div key={m.label} className="bg-bg-card border border-brd rounded-xl p-2.5">
                <MiniLabel>{m.label}</MiniLabel>
                <div className={`text-[0.85rem] font-semibold font-mono mt-1 ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-bg-card border border-brd rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <MiniLabel>Courbe d'equity</MiniLabel>
              <span className="text-profit font-mono text-[0.6rem]">+4.25 %</span>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mock-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--profit)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--profit)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="url(#mock-fill)" />
              <path d={line} fill="none" stroke="var(--profit)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="bg-bg-card border border-brd rounded-xl p-3">
            <MiniLabel>Calendrier P&L — février</MiniLabel>
            <div className="grid grid-cols-7 gap-1 mt-2">
              {[null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((d, i) => {
                const g = [3, 5, 7, 10, 12].includes(d), r = [4, 8, 13].includes(d), lg = [6, 9, 11].includes(d);
                return (
                  <div key={i} className={`text-center py-1 rounded-md text-[0.55rem] font-mono ${
                    d === null ? '' : g ? 'bg-profit/20 text-profit font-semibold' : r ? 'bg-loss/15 text-loss font-semibold' : lg ? 'bg-profit/10 text-profit' : 'text-txt-3'
                  }`}>{d || ''}</div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
}

function MockTrades() {
  const trades = [
    { inst: 'NQ', type: 'LONG', pnl: '+850,00 €', rr: '2.83R', date: 'Lun. 10 fév.', win: true },
    { inst: 'ES', type: 'SHORT', pnl: '−300,00 €', rr: '−1.00R', date: 'Ven. 7 fév.', win: false },
    { inst: 'NQ', type: 'LONG', pnl: '+1 200,00 €', rr: '4.00R', date: 'Jeu. 6 fév.', win: true },
  ];
  return (
    <Window
      title="Trades"
      right={
        <div className="flex gap-1 p-0.5 rounded-lg border border-brd bg-bg-card">
          {['Tout', 'Mois', 'Wins'].map((f, i) => (
            <span key={f} className={`px-2 py-0.5 rounded-md text-[0.58rem] ${i === 0 ? 'bg-accent-strong text-white font-medium' : 'text-txt-3'}`}>{f}</span>
          ))}
        </div>
      }
    >
      <div className="p-3 md:p-4 space-y-2">
        {trades.map((t, i) => (
          <div key={i} className="bg-bg-card border border-brd rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-1 self-stretch rounded-full ${t.win ? 'bg-profit' : 'bg-loss'}`} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[0.78rem]">{t.inst}</span>
                  <span className={`px-1.5 py-px rounded-md text-[0.52rem] font-mono font-semibold ${t.type === 'LONG' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'}`}>{t.type}</span>
                </div>
                <div className="text-[0.58rem] text-txt-3 mt-0.5">{t.date}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-semibold font-mono text-[0.78rem] ${t.win ? 'text-profit' : 'text-loss'}`}>{t.pnl}</div>
              <div className="text-[0.58rem] font-mono text-txt-3">{t.rr}</div>
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-dashed border-brd-hover px-3 py-2.5 text-center text-txt-3 text-[0.62rem]">+ Nouveau trade · 30 secondes</div>
      </div>
    </Window>
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
    <Window title="Statistiques">
      <div className="p-3 md:p-4 space-y-2.5">
        <div className="bg-bg-card border border-brd rounded-xl p-3">
          <MiniLabel>Performance par jour</MiniLabel>
          <div className="space-y-2 mt-2.5">
            {days.map(d => (
              <div key={d.d} className="flex items-center gap-2">
                <span className="text-[0.6rem] text-txt-2 w-7 font-mono">{d.d}</span>
                <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.win ? 'bg-profit' : 'bg-loss'}`} style={{ width: `${d.v}%` }} />
                </div>
                <span className={`text-[0.6rem] font-mono font-semibold w-12 text-right ${d.win ? 'text-profit' : 'text-loss'}`}>
                  {d.win ? '+' : '−'}{Math.round(d.v * 12)} €
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-bg-card border border-brd rounded-xl p-3">
            <MiniLabel>Long</MiniLabel>
            <div className="text-[0.95rem] font-semibold font-mono text-profit mt-1">+3 100 €</div>
            <div className="text-[0.56rem] text-txt-3 mt-0.5">28 trades · 71 % WR</div>
          </div>
          <div className="bg-bg-card border border-brd rounded-xl p-3">
            <MiniLabel>Short</MiniLabel>
            <div className="text-[0.95rem] font-semibold font-mono text-profit mt-1">+1 150 €</div>
            <div className="text-[0.56rem] text-txt-3 mt-0.5">19 trades · 63 % WR</div>
          </div>
        </div>
        <div className="bg-bg-card border border-brd rounded-xl p-3 flex items-center justify-between">
          <div>
            <MiniLabel>Respect stratégie</MiniLabel>
            <div className="text-[0.56rem] text-txt-3 mt-1">41 / 47 trades</div>
          </div>
          <div className="relative w-12 h-12">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--brd-hover)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeDasharray={`${0.87 * 94.2} 94.2`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-[0.62rem]">87%</span>
          </div>
        </div>
      </div>
    </Window>
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
    <Window title="Playbook" right={<span className="text-accent font-mono font-semibold text-[0.7rem]">80 %</span>}>
      <div className="p-3 md:p-4">
        <div className="w-full h-1.5 bg-bg-card rounded-full mb-3 overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: '80%' }} />
        </div>
        <div className="space-y-1.5">
          {rules.map((r, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-brd bg-bg-card">
              <div className={`w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center border ${r.checked ? 'bg-accent-strong border-accent-strong text-white' : 'border-brd-hover'}`}>
                {r.checked && <Icon name="check" size={11} strokeWidth={3} />}
              </div>
              <span className={`text-[0.66rem] ${r.checked ? 'text-txt-3 line-through' : 'text-txt-1'}`}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

const painPoints = [
  { icon: 'layers', title: 'Excel abandonné', text: '« J\'ai essayé Excel. J\'ai abandonné après 2 semaines. »' },
  { icon: 'wallet', title: 'Comptes mélangés', text: '« J\'ai 2 comptes FTMO et je mélange tout. »' },
  { icon: 'target', title: 'Mêmes erreurs', text: '« Je refais les mêmes erreurs sans m\'en rendre compte. »' },
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

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
      {eyebrow && <div className="eyebrow !text-accent mb-4">{eyebrow}</div>}
      <h2 className="font-display text-3xl md:text-[2.6rem] leading-[1.1] font-semibold tracking-tight mb-4 text-gradient">{title}</h2>
      {subtitle && <p className="text-txt-2 text-base md:text-lg leading-relaxed">{subtitle}</p>}
    </AnimatedSection>
  );
}

function Feature({ tag, title, text, bullets, mock, reverse }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <AnimatedSection className={reverse ? 'lg:order-2' : ''}>
        <div className="eyebrow !text-accent mb-4">{tag}</div>
        <h3 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight mb-4">{title}</h3>
        <p className="text-txt-2 leading-relaxed mb-6">{text}</p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-txt-1">
          {bullets.map(b => (
            <li key={b} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-accent-dim text-accent flex items-center justify-center flex-shrink-0"><Icon name="check" size={10} strokeWidth={3} /></span>
              {b}
            </li>
          ))}
        </ul>
      </AnimatedSection>
      <AnimatedSection delay={0.15} className={reverse ? 'lg:order-1' : ''}>
        {mock}
      </AnimatedSection>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-hidden">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-brd bg-bg-primary/70 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center gap-3">
          <Link href="/" aria-label="TradeScope — accueil"><Logo size={30} /></Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-txt-2">
            <a href="#features" className="hover:text-txt-1 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-txt-1 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-txt-1 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-txt-1 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="btn-ghost">Connexion</Link>
            <Link href="/auth/register" className="btn-primary !py-2 hidden sm:inline-flex">Essai gratuit</Link>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-halo pointer-events-none opacity-70" />
        <div className="relative max-w-4xl mx-auto text-center pt-20 md:pt-28 pb-14 px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="chip mb-8 !pl-1.5"
          >
            <span className="rounded-full bg-accent-dim text-accent px-2 py-0.5 text-[0.68rem] font-semibold">Nouveau</span>
            Conçu pour les prop traders · Futures & Indices
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[2.6rem] sm:text-6xl md:text-7xl font-semibold tracking-[-0.035em] mb-6 leading-[1.02]"
          >
            <span className="text-gradient">Le journal de trading</span><br />
            <span className="text-gradient-accent">que tu vas enfin utiliser.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-txt-2 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Tu sais que tu devrais tenir un journal. Tu ne le fais pas. TradeScope règle ça — en 30 secondes par trade.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/auth/register" className="btn-primary !px-6 !py-3.5 !text-base w-full sm:w-auto">
              Essayer 7 jours gratuitement <Icon name="arrowRight" size={16} />
            </Link>
            <a href="#features" className="btn-secondary !px-6 !py-3.5 !text-base w-full sm:w-auto">Voir les fonctionnalités</a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="text-txt-3 text-sm mt-5 flex items-center justify-center gap-4 flex-wrap"
          >
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-profit" />Sans carte bancaire</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-profit" />Annulation en 1 clic</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-profit" />Aucun engagement</span>
          </motion.p>
        </div>

        {/* App Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-24"
        >
          <div className="absolute inset-x-10 top-10 bottom-24 bg-accent/20 blur-[100px] rounded-full -z-0" />
          <div className="relative">
            <MockDashboard />
          </div>
        </motion.div>
      </section>

      {/* Pain Points */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-brd">
        <SectionHeading
          eyebrow="Le problème"
          title="Tu ressembles à ça ?"
          subtitle="La plupart des traders sérieux ont ce problème. TradeScope a été conçu exactement pour ça."
        />
        <StaggerSection className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {painPoints.map((p, i) => (
            <motion.div key={i} variants={fadeUp} className="card card-hover p-6">
              <div className="w-10 h-10 rounded-xl bg-bg-secondary border border-brd flex items-center justify-center text-txt-2 mb-5">
                <Icon name={p.icon} size={18} />
              </div>
              <div className="font-semibold mb-2">{p.title}</div>
              <p className="text-txt-2 text-sm leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </StaggerSection>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24 border-t border-brd scroll-mt-16">
        <SectionHeading
          eyebrow="Fonctionnalités"
          title="Tout ce qu'il te faut. Rien de plus."
          subtitle="Des outils concrets pour analyser, progresser et rester discipliné."
        />

        <div className="space-y-28">
          <Feature
            tag="Playbook"
            title="Arrête de dévier de ton plan. Chaque jour."
            text="Tes règles. Ta checklist. Ton score de discipline. TradeScope te montre si tu te respectes, trade après trade — pas juste en théorie."
            bullets={['Checklist quotidienne personnalisable', 'Score de discipline en temps réel', "Tes règles, pas celles d'un autre", 'Suivi sur la durée']}
            mock={<MockPlaybook />}
          />
          <Feature
            reverse
            tag="Journal"
            title="30 secondes par trade. Pas plus."
            text="P&L, R:R, instrument, direction — tout calculé automatiquement. Tu trades, tu cliques, tu passes à autre chose. Fini l'excuse du « c'est trop long à remplir »."
            bullets={['Calcul R:R automatique', 'Filtres par période, wins/losses', 'Export CSV en un clic', 'Lien TradingView par trade']}
            mock={<MockTrades />}
          />
          <Feature
            tag="Statistiques"
            title="Les stats te disent tout, sans mentir."
            text="Quel jour tu trades le mieux ? Long ou short ? Est-ce que tu respectes ta stratégie ? Arrête de trader à l'instinct. Commence à trader avec des données."
            bullets={['Performance par jour de la semaine', 'Long vs Short avec win rate', 'Taux de respect de stratégie', 'Meilleurs instruments']}
            mock={<MockStats />}
          />
        </div>

        {/* Multi-comptes */}
        <AnimatedSection className="mt-28">
          <div className="relative card overflow-hidden p-8 md:p-12">
            <div className="absolute inset-0 bg-halo opacity-60 pointer-events-none" />
            <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
              <div>
                <div className="eyebrow !text-accent mb-4">Multi-comptes</div>
                <h3 className="font-display font-semibold text-2xl md:text-3xl tracking-tight mb-4">FTMO, compte perso, challenge — enfin séparés.</h3>
                <p className="text-txt-2 leading-relaxed">
                  Chaque compte a ses propres stats, son propre P&L, sa propre progression. Tu sais exactement où tu en es sur chacun — sans jamais mélanger.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { n: 'FTMO 100K', f: 'Challenge · Phase 2', v: '+4 250 €', up: true },
                  { n: 'Apex 50K', f: 'Funded', v: '+1 380 €', up: true },
                  { n: 'Compte perso', f: 'IBKR', v: '−210 €', up: false },
                ].map(a => (
                  <div key={a.n} className="flex items-center justify-between rounded-xl border border-brd bg-bg-secondary px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{a.n}</div>
                      <div className="text-xs text-txt-3">{a.f}</div>
                    </div>
                    <span className={`font-mono text-sm font-semibold ${a.up ? 'text-profit' : 'text-loss'}`}>{a.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-brd scroll-mt-16" id="pricing">
        <SectionHeading
          eyebrow="Tarifs"
          title="Commence gratuitement. Paie si tu aimes."
          subtitle="7 jours sans carte bancaire. Annule en 1 clic."
        />
        <StaggerSection className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className={`relative rounded-2xl p-7 flex flex-col ${plan.accent
                ? 'bg-bg-card border border-accent/50'
                : 'card'}`}
              style={plan.accent ? { boxShadow: '0 0 0 1px rgb(var(--accent-rgb) / 0.25), 0 30px 60px -20px var(--accent-glow)' } : undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
                {plan.badge && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold ${plan.accent ? 'bg-accent-strong text-white' : 'bg-accent-dim text-accent'}`}>{plan.badge}</span>
                )}
              </div>
              <p className="text-txt-2 text-sm mb-6 min-h-[40px]">{plan.description}</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-semibold tracking-tight">{plan.price}€</span>
                <span className="text-txt-3 text-sm">{plan.period}</span>
              </div>
              <Link href={`/auth/register?plan=${plan.priceKey}`} className={`${plan.accent ? 'btn-primary' : 'btn-secondary'} w-full !py-3 mb-7`}>
                Essai gratuit 7 jours
              </Link>
              <ul className="space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5"><Icon name="check" size={15} className="text-accent flex-shrink-0" strokeWidth={2.25} /> {f}</li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-txt-3"><Icon name="close" size={14} className="flex-shrink-0" /> {f}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </StaggerSection>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24 border-t border-brd scroll-mt-16">
        <SectionHeading eyebrow="FAQ" title="Questions fréquentes" subtitle="Tout ce que tu te demandes avant de te lancer." />
        <StaggerFastSection className="divide-y divide-brd border-y border-brd">
          {faqs.map((faq, i) => (
            <motion.details key={i} variants={fadeUp} className="group py-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-medium text-base [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="w-7 h-7 rounded-full border border-brd flex items-center justify-center text-txt-3 flex-shrink-0 transition-transform group-open:rotate-45">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="text-txt-2 text-sm leading-relaxed mt-3 pr-10">{faq.a}</p>
            </motion.details>
          ))}
        </StaggerFastSection>
      </section>

      {/* CTA Final */}
      <AnimatedSection className="max-w-5xl mx-auto px-6 pb-24">
        <div className="relative card overflow-hidden text-center px-6 py-16 md:py-20">
          <div className="absolute inset-0 bg-grid opacity-70 pointer-events-none" />
          <div className="absolute inset-0 bg-halo pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-4 text-gradient">
              Prêt à trader avec plus de clarté ?
            </h2>
            <p className="text-txt-2 text-lg mb-9 max-w-xl mx-auto">
              Rejoins les traders qui ont arrêté de se mentir sur leurs performances.
            </p>
            <Link href="/auth/register" className="btn-primary !px-7 !py-3.5 !text-base">
              Essayer 7 jours gratuitement <Icon name="arrowRight" size={16} />
            </Link>
            <p className="text-txt-3 text-sm mt-4">Sans carte bancaire · Annulation en 1 clic</p>
          </div>
        </div>
      </AnimatedSection>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 border-t border-brd scroll-mt-16">
        <AnimatedSection className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <div className="eyebrow !text-accent mb-4">Contact</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-3">Une question ?</h2>
            <p className="text-txt-2">Envoie-nous un message, on répond rapidement.</p>
          </div>
          <ContactForm />
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-brd">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-txt-3">
          <div className="flex items-center gap-3">
            <Logo size={24} />
          </div>
          <p>&copy; {new Date().getFullYear()} TradeScope. Tous droits réservés.</p>
          <div className="flex items-center gap-5">
            <a href="/cgv" className="hover:text-txt-1 transition-colors">CGV</a>
            <a href="mailto:support@tradescopev2.fr" className="hover:text-txt-1 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
