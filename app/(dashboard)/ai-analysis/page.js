'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAccount } from '@/components/AccountContext';

// ============================================================
// HEALTH SCORE GAUGE (SVG)
// ============================================================
function HealthGauge({ score, size = 130 }) {
  const cx = size / 2, cy = size / 2;
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // half circle
  const filled = (score / 100) * circumference;
  const startAngle = Math.PI;

  const getColor = (s) => {
    if (s >= 75) return 'var(--profit)';
    if (s >= 50) return '#f59e0b';
    if (s >= 30) return '#f97316';
    return 'var(--loss)';
  };

  const getLabel = (s) => {
    if (s >= 80) return 'Excellent';
    if (s >= 65) return 'Bon';
    if (s >= 50) return 'Correct';
    if (s >= 35) return 'À améliorer';
    return 'Critique';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none" stroke="var(--brd)" strokeWidth="12" strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none" stroke={getColor(score)} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--txt-1)" fontSize="28" fontWeight="bold" fontFamily="monospace">
          {score}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="var(--txt-3)" fontSize="8" fontFamily="monospace" textTransform="uppercase">
          / 100
        </text>
      </svg>
      <div className="text-xs font-bold mt-1" style={{ color: getColor(score) }}>{getLabel(score)}</div>
    </div>
  );
}

// ============================================================
// MINI METRIC BAR
// ============================================================
function MetricBar({ label, value, max, unit = '', color, invert = false }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const displayPct = invert ? 100 - pct : pct;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.6rem] text-txt-3 font-mono w-20 truncate">{label}</span>
      <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${displayPct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[0.65rem] font-mono font-bold w-12 text-right" style={{ color }}>{value}{unit}</span>
    </div>
  );
}

// ============================================================
// COMPUTE ADVANCED ANALYTICS
// ============================================================
function computeAdvancedStats(trades, strategies) {
  if (!trades || trades.length === 0) return null;

  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const totalPnl = trades.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const winRate = (wins.length / trades.length) * 100;
  const grossWin = wins.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + parseFloat(t.pnl), 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

  const rrTrades = trades.filter(t => t.rr != null);
  const avgRR = rrTrades.length > 0 ? rrTrades.reduce((s, t) => s + parseFloat(t.rr), 0) / rrTrades.length : 0;

  // Streaks
  let maxWinStreak = 0, maxLoseStreak = 0, currentStreak = 0;
  sorted.forEach(t => {
    if (parseFloat(t.pnl) > 0) { currentStreak = currentStreak > 0 ? currentStreak + 1 : 1; }
    else if (parseFloat(t.pnl) < 0) { currentStreak = currentStreak < 0 ? currentStreak - 1 : -1; }
    else { currentStreak = 0; }
    if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
    if (currentStreak < maxLoseStreak) maxLoseStreak = currentStreak;
  });

  // Max drawdown
  let peak = 0, equity = 0, maxDD = 0;
  sorted.forEach(t => {
    equity += parseFloat(t.pnl);
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDD) maxDD = dd;
  });

  // Current drawdown
  let currentDD = peak - equity;

  // Day performance
  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const dayStats = {};
  dayNames.forEach(d => dayStats[d] = { pnl: 0, trades: 0, wins: 0 });
  trades.forEach(t => {
    const di = new Date(t.date).getDay();
    const name = dayNames[di === 0 ? 6 : di - 1];
    dayStats[name].pnl += parseFloat(t.pnl);
    dayStats[name].trades++;
    if (parseFloat(t.pnl) > 0) dayStats[name].wins++;
  });
  const worstDay = Object.entries(dayStats).filter(([, v]) => v.trades > 0).sort((a, b) => a[1].pnl - b[1].pnl)[0];
  const bestDay = Object.entries(dayStats).filter(([, v]) => v.trades > 0).sort((a, b) => b[1].pnl - a[1].pnl)[0];

  // Session performance
  const london = trades.filter(t => t.session === 'london');
  const us = trades.filter(t => t.session === 'us');
  const londonPnl = london.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const usPnl = us.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const londonWR = london.length > 0 ? (london.filter(t => t.pnl > 0).length / london.length) * 100 : null;
  const usWR = us.length > 0 ? (us.filter(t => t.pnl > 0).length / us.length) * 100 : null;

  // Monthly performance
  const monthlyPnl = {};
  trades.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyPnl[key] = (monthlyPnl[key] || 0) + parseFloat(t.pnl);
  });
  const months = Object.entries(monthlyPnl).sort((a, b) => a[0].localeCompare(b[0]));
  const greenMonths = months.filter(([, v]) => v > 0).length;
  const redMonths = months.filter(([, v]) => v < 0).length;

  // Strategy respect
  const withStrat = trades.filter(t => t.followed_strategy);
  const stratRespect = trades.length > 0 ? (withStrat.length / trades.length) * 100 : 0;
  const withStratPnl = withStrat.reduce((s, t) => s + parseFloat(t.pnl), 0);
  const withoutStratPnl = trades.filter(t => !t.followed_strategy).reduce((s, t) => s + parseFloat(t.pnl), 0);

  // Consecutive losses (current)
  let currentLoseStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (parseFloat(sorted[i].pnl) < 0) currentLoseStreak++;
    else break;
  }

  // Overtrading detection: days with 4+ trades
  const tradesPerDay = {};
  trades.forEach(t => {
    tradesPerDay[t.date] = (tradesPerDay[t.date] || 0) + 1;
  });
  const overtradeDays = Object.values(tradesPerDay).filter(v => v >= 4).length;
  const totalTradingDays = Object.keys(tradesPerDay).length;

  // Instruments
  const instPnl = {};
  trades.forEach(t => {
    if (t.instrument) {
      if (!instPnl[t.instrument]) instPnl[t.instrument] = { pnl: 0, trades: 0, wins: 0 };
      instPnl[t.instrument].pnl += parseFloat(t.pnl);
      instPnl[t.instrument].trades++;
      if (parseFloat(t.pnl) > 0) instPnl[t.instrument].wins++;
    }
  });

  // Strategy breakdown
  const stratBreakdown = strategies.map(s => {
    const st = trades.filter(t => t.strategy_id === s.id);
    if (st.length === 0) return null;
    const pnl = st.reduce((sum, t) => sum + parseFloat(t.pnl), 0);
    const wr = (st.filter(t => t.pnl > 0).length / st.length) * 100;
    return { name: s.name, trades: st.length, pnl, wr };
  }).filter(Boolean);

  // HEALTH SCORE calculation (0-100)
  let healthScore = 50; // base
  // Win rate component (0-20)
  healthScore += Math.min((winRate / 100) * 20, 20);
  // Profit Factor component (0-20)
  const pfScore = profitFactor === Infinity ? 20 : Math.min((profitFactor / 2.5) * 20, 20);
  healthScore += pfScore;
  // Strategy respect (0-10)
  healthScore += (stratRespect / 100) * 10;
  // Drawdown penalty (-15 max)
  if (maxDD > 0 && totalPnl !== 0) {
    const ddRatio = maxDD / Math.max(Math.abs(totalPnl), maxDD);
    healthScore -= ddRatio * 15;
  }
  // Consistency: green months vs red months (0-10)
  if (months.length > 0) healthScore += (greenMonths / months.length) * 10;
  // Overtrading penalty (-10 max)
  if (totalTradingDays > 0) {
    healthScore -= (overtradeDays / totalTradingDays) * 10;
  }
  // Lose streak penalty
  if (currentLoseStreak >= 3) healthScore -= Math.min(currentLoseStreak * 2, 10);
  // P&L positive bonus
  if (totalPnl > 0) healthScore += 5;

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  return {
    totalPnl, winRate, profitFactor, avgWin, avgLoss, avgRR,
    maxWinStreak, maxLoseStreak: Math.abs(maxLoseStreak),
    maxDD, currentDD, currentLoseStreak,
    worstDay, bestDay, dayStats,
    london: { count: london.length, pnl: londonPnl, wr: londonWR },
    us: { count: us.length, pnl: usPnl, wr: usWR },
    months, greenMonths, redMonths,
    stratRespect, withStratPnl, withoutStratPnl,
    overtradeDays, totalTradingDays,
    instPnl, stratBreakdown,
    nbTrades: trades.length, wins: wins.length, losses: losses.length,
    healthScore, currentStreak,
    rrTrades: rrTrades.length,
  };
}

// ============================================================
// GENERATE INSIGHTS
// ============================================================
function generateInsights(stats) {
  if (!stats) return [];
  const insights = [];
  const fmt = (v) => (v >= 0 ? '+' : '') + v.toFixed(0) + '€';

  // Drawdown alert
  if (stats.currentDD > 0 && stats.maxDD > 0) {
    const ddPct = stats.totalPnl !== 0 ? ((stats.currentDD / Math.max(Math.abs(stats.totalPnl), stats.maxDD)) * 100).toFixed(0) : 0;
    if (stats.currentDD > stats.maxDD * 0.5) {
      insights.push({ type: 'danger', icon: '📉', text: `Drawdown actuel de ${stats.currentDD.toFixed(0)}€ — proche de ton max (${stats.maxDD.toFixed(0)}€)` });
    }
  }

  // Current lose streak
  if (stats.currentLoseStreak >= 3) {
    insights.push({ type: 'danger', icon: '🔴', text: `${stats.currentLoseStreak} trades perdants consécutifs — envisage de faire une pause` });
  }

  // Best/worst day
  if (stats.worstDay && stats.worstDay[1].pnl < -50) {
    insights.push({ type: 'warning', icon: '⚠️', text: `Le ${stats.worstDay[0]} te coûte ${fmt(stats.worstDay[1].pnl)} au total (${stats.worstDay[1].trades} trades)` });
  }
  if (stats.bestDay && stats.bestDay[1].pnl > 50) {
    insights.push({ type: 'success', icon: '🏆', text: `Ton meilleur jour est le ${stats.bestDay[0]} avec ${fmt(stats.bestDay[1].pnl)}` });
  }

  // Strategy respect
  if (stats.stratRespect < 50 && stats.nbTrades >= 5) {
    insights.push({ type: 'warning', icon: '🎯', text: `Seulement ${stats.stratRespect.toFixed(0)}% de tes trades respectent ta stratégie` });
  }
  if (stats.withStratPnl > 0 && stats.withoutStratPnl < 0) {
    insights.push({ type: 'info', icon: '💡', text: `Avec stratégie: ${fmt(stats.withStratPnl)} vs sans: ${fmt(stats.withoutStratPnl)} — reste discipliné !` });
  }

  // Session comparison
  if (stats.london.count >= 3 && stats.us.count >= 3) {
    if (stats.london.pnl > stats.us.pnl * 2) {
      insights.push({ type: 'success', icon: '🇬🇧', text: `Session Londres largement meilleure (${fmt(stats.london.pnl)}) que US (${fmt(stats.us.pnl)})` });
    } else if (stats.us.pnl > stats.london.pnl * 2) {
      insights.push({ type: 'success', icon: '🇺🇸', text: `Session US largement meilleure (${fmt(stats.us.pnl)}) que Londres (${fmt(stats.london.pnl)})` });
    }
  }

  // Win streak
  if (stats.maxWinStreak >= 5) {
    insights.push({ type: 'success', icon: '🔥', text: `Série record de ${stats.maxWinStreak} wins consécutifs !` });
  }

  // Overtrading
  if (stats.overtradeDays > 0) {
    const pct = ((stats.overtradeDays / stats.totalTradingDays) * 100).toFixed(0);
    if (stats.overtradeDays >= 3 || parseInt(pct) >= 20) {
      insights.push({ type: 'warning', icon: '⏰', text: `Overtrading détecté: ${stats.overtradeDays} jours avec 4+ trades (${pct}% des jours)` });
    }
  }

  // Profit factor
  if (stats.profitFactor >= 2 && stats.profitFactor !== Infinity) {
    insights.push({ type: 'success', icon: '📊', text: `Profit Factor excellent à ${stats.profitFactor.toFixed(2)} — continue comme ça` });
  } else if (stats.profitFactor < 1 && stats.nbTrades >= 5) {
    insights.push({ type: 'danger', icon: '📊', text: `Profit Factor sous 1 (${stats.profitFactor.toFixed(2)}) — tes pertes dépassent tes gains` });
  }

  // Green/red months
  if (stats.months.length >= 2) {
    if (stats.redMonths > stats.greenMonths) {
      insights.push({ type: 'warning', icon: '📅', text: `${stats.redMonths} mois rouges vs ${stats.greenMonths} verts — la régularité est clé` });
    } else if (stats.greenMonths > 0 && stats.redMonths === 0) {
      insights.push({ type: 'success', icon: '✅', text: `${stats.greenMonths} mois consécutifs en vert !` });
    }
  }

  return insights;
}

// ============================================================
// GENERATE SMART PROMPTS (contextual)
// ============================================================
function generateSmartPrompts(stats) {
  if (!stats) return [];
  const prompts = [];

  // Always available
  prompts.push({ label: '📋 Analyse globale', text: 'Analyse mes performances de trading en détail. Identifie mes forces, mes faiblesses, et donne-moi 3 actions concrètes pour m\'améliorer.', priority: 0 });

  // Contextual based on data
  if (stats.currentLoseStreak >= 2) {
    prompts.push({ label: '🔴 Série perdante', text: `Je suis actuellement sur une série de ${stats.currentLoseStreak} trades perdants. Analyse ma situation et dis-moi comment gérer cette période. Dois-je faire une pause ? Qu'est-ce qui explique cette série ?`, priority: 10 });
  }

  if (stats.currentDD > stats.maxDD * 0.3) {
    prompts.push({ label: '📉 Mon drawdown', text: 'Analyse mon drawdown actuel et historique. Est-il normal ? Comment puis-je le limiter ? Quelles règles de risk management me recommandes-tu ?', priority: 9 });
  }

  if (stats.stratRespect < 60 && stats.nbTrades >= 5) {
    prompts.push({ label: '🎯 Discipline', text: `Je ne respecte ma stratégie que ${stats.stratRespect.toFixed(0)}% du temps. Analyse l'impact sur mes résultats et propose-moi un plan pour améliorer ma discipline.`, priority: 8 });
  }

  if (stats.overtradeDays >= 2) {
    prompts.push({ label: '⏰ Overtrading', text: `J'ai des jours d'overtrading (${stats.overtradeDays} jours avec 4+ trades). Analyse si ça impacte mes résultats et comment je peux contrôler ça.`, priority: 7 });
  }

  if (stats.worstDay && stats.worstDay[1].pnl < -100) {
    prompts.push({ label: `⚠️ Problème ${stats.worstDay[0].substring(0, 3)}`, text: `Le ${stats.worstDay[0]} est mon pire jour avec ${stats.worstDay[1].pnl.toFixed(0)}€ de perte sur ${stats.worstDay[1].trades} trades. Pourquoi je perds ce jour-là ? Devrais-je arrêter de trader le ${stats.worstDay[0]} ?`, priority: 6 });
  }

  if (stats.london.count >= 3 && stats.us.count >= 3) {
    prompts.push({ label: '🕐 Meilleures sessions', text: 'Compare mes performances entre les sessions Londres AM et US PM. Sur laquelle je suis le meilleur ? Devrais-je me concentrer sur une seule session ?', priority: 4 });
  }

  if (stats.stratBreakdown.length >= 2) {
    prompts.push({ label: '◬ Meilleure stratégie', text: 'Quelle est ma stratégie la plus performante ? Analyse chaque stratégie en détail et dis-moi laquelle je devrais privilégier.', priority: 5 });
  }

  prompts.push({ label: '🗓 Plan 30 jours', text: 'Basé sur toutes mes stats, crée-moi un plan d\'action détaillé pour les 30 prochains jours. Inclus des objectifs mesurables et des règles quotidiennes.', priority: 1 });
  prompts.push({ label: '🧠 Patterns négatifs', text: 'Identifie tous mes patterns négatifs : jours, sessions, comportements, instruments. Quels schémas me font perdre de l\'argent ?', priority: 2 });

  return prompts.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function AIAnalysisPage() {
  const { currentAccountId, currentAccount } = useAccount();
  const [trades, setTrades] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showInsights, setShowInsights] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadData(); }, [currentAccountId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: t }, sRes] = await Promise.all([
      supabase.from('trades').select('*').eq('user_id', user.id).eq('is_payout', false),
      fetch('/api/strategies'),
    ]);
    const s = await sRes.json();
    setTrades(t || []);
    setStrategies(Array.isArray(s) ? s : []);
    setLoading(false);
  };

  const at = useMemo(() => trades.filter(t => t.account_id === currentAccountId), [trades, currentAccountId]);
  const stats = useMemo(() => computeAdvancedStats(at, strategies), [at, strategies]);
  const insights = useMemo(() => generateInsights(stats), [stats]);
  const smartPrompts = useMemo(() => generateSmartPrompts(stats), [stats]);

  const buildContext = () => {
    if (at.length === 0) return 'Aucun trade enregistré.';
    const s = stats;
    if (!s) return 'Pas assez de données.';

    const sorted = [...at].sort((a, b) => new Date(b.date) - new Date(a.date));
    const fmt = (v) => (v >= 0 ? '+' : '') + v.toFixed(2);

    const dayEntries = Object.entries(s.dayStats)
      .filter(([, v]) => v.trades > 0)
      .map(([d, v]) => `  - ${d}: ${v.trades} trades, ${v.wins}W, P&L ${fmt(v.pnl)}€, WR ${v.trades > 0 ? ((v.wins / v.trades) * 100).toFixed(0) : 0}%`)
      .join('\n');

    const instEntries = Object.entries(s.instPnl)
      .sort((a, b) => b[1].pnl - a[1].pnl)
      .map(([inst, d]) => `  - ${inst}: ${d.trades} trades, WR ${d.trades > 0 ? ((d.wins / d.trades) * 100).toFixed(0) : 0}%, P&L ${fmt(d.pnl)}€`)
      .join('\n');

    const stratEntries = s.stratBreakdown
      .map(st => `  - ${st.name}: ${st.trades} trades, WR ${st.wr.toFixed(0)}%, P&L ${fmt(st.pnl)}€`)
      .join('\n');

    const monthEntries = s.months
      .map(([m, v]) => `  - ${m}: ${fmt(v)}€`)
      .join('\n');

    return `
DONNÉES DE TRADING — ${currentAccount?.name || 'Compte'} (${currentAccount?.prop_firm || ''})
Capital de base: ${currentAccount?.base_capital || 'N/A'}€
Health Score: ${s.healthScore}/100

RÉSUMÉ GLOBAL:
- Total trades: ${s.nbTrades} (${s.wins}W / ${s.losses}L)
- P&L Total: ${fmt(s.totalPnl)}€
- Win Rate: ${s.winRate.toFixed(1)}%
- R:R Moyen: ${s.avgRR.toFixed(2)}R (sur ${s.rrTrades} trades avec risque)
- Profit Factor: ${s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}
- Gain moyen: ${fmt(s.avgWin)}€ | Perte moyenne: -${s.avgLoss.toFixed(2)}€
- Max Drawdown: ${s.maxDD.toFixed(2)}€ | Drawdown actuel: ${s.currentDD.toFixed(2)}€
- Meilleure série: ${s.maxWinStreak} wins | Pire série: ${s.maxLoseStreak} losses
- Série actuelle: ${s.currentLoseStreak > 0 ? s.currentLoseStreak + ' losses d\'affilée' : 'OK'}
- Respect stratégie: ${s.stratRespect.toFixed(0)}% (${at.filter(t => t.followed_strategy).length}/${s.nbTrades})
  → Avec stratégie: ${fmt(s.withStratPnl)}€ vs Sans: ${fmt(s.withoutStratPnl)}€

PAR STRATÉGIE:
${stratEntries || '  Aucune stratégie'}
  - Hors stratégie: ${at.filter(t => !t.strategy_id).length} trades, P&L ${fmt(at.filter(t => !t.strategy_id).reduce((sum, t) => sum + parseFloat(t.pnl), 0))}€

PAR JOUR:
${dayEntries || '  Pas de données'}
  → Meilleur jour: ${s.bestDay ? s.bestDay[0] + ' (' + fmt(s.bestDay[1].pnl) + '€)' : 'N/A'}
  → Pire jour: ${s.worstDay ? s.worstDay[0] + ' (' + fmt(s.worstDay[1].pnl) + '€)' : 'N/A'}

PAR SESSION:
- Londres AM: ${s.london.count} trades, WR ${s.london.wr !== null ? s.london.wr.toFixed(0) + '%' : 'N/A'}, P&L ${fmt(s.london.pnl)}€
- US PM: ${s.us.count} trades, WR ${s.us.wr !== null ? s.us.wr.toFixed(0) + '%' : 'N/A'}, P&L ${fmt(s.us.pnl)}€

INSTRUMENTS:
${instEntries || '  Pas de données'}

ÉVOLUTION MENSUELLE:
${monthEntries || '  Pas de données'}
  → Mois verts: ${s.greenMonths} | Mois rouges: ${s.redMonths}

OVERTRADING:
- Jours avec 4+ trades: ${s.overtradeDays}/${s.totalTradingDays} jours de trading

10 DERNIERS TRADES:
${sorted.slice(0, 10).map(t => `  - ${t.date} | ${t.instrument || '?'} ${t.type || '?'} | P&L: ${fmt(parseFloat(t.pnl))}€ | RR: ${t.rr ? parseFloat(t.rr).toFixed(2) + 'R' : 'N/A'} | Strat: ${t.followed_strategy ? 'Oui' : 'Non'} | Session: ${t.session || 'N/A'}`).join('\n')}
`.trim();
  };

  const sendMessage = async (text) => {
    if (!text.trim() || thinking) return;
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setThinking(true);
    setShowInsights(false);

    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context: buildContext() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      setMessages([...newMessages, { role: 'model', content: data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'model', content: `❌ Erreur: ${err.message}` }]);
    } finally {
      setThinking(false);
    }
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text.replace(/<[^>]*>/g, ''));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^#{1,3} (.+)$/gm, '<div class="font-bold text-sm mt-3 mb-1 text-accent">$1</div>')
      .replace(/^- (.+)$/gm, '<div class="flex gap-2 text-sm"><span class="text-accent flex-shrink-0">▸</span><span>$1</span></div>')
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '<br/>');
  };

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  const insightColors = { danger: 'bg-loss-dim border-loss/20 text-loss', warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400', success: 'bg-profit-dim border-profit/20 text-profit', info: 'bg-accent-dim border-accent/20 text-accent' };

  return (
    <div className="animate-fade-up max-w-5xl flex flex-col h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h2 className="font-display font-bold text-xl flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">✦</span> Analyse IA
          </h2>
          <p className="text-txt-3 text-sm mt-0.5">L'IA analyse tes {at.length} trades et te coache</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setShowInsights(true); }} className="px-3 py-1.5 border border-brd text-txt-3 text-xs rounded-lg hover:border-loss hover:text-loss transition-all">
            Nouveau chat
          </button>
        )}
      </div>

      {/* ===== TOP PANEL: Health Score + Insights (before chat) ===== */}
      {showInsights && stats && at.length >= 3 && (
        <div className="flex-shrink-0 mb-4 space-y-4">
          {/* Health Score + Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Health Gauge */}
            <div className="bg-bg-card border border-brd rounded-xl p-4 flex flex-col items-center justify-center">
              <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider mb-2">Score de Santé</div>
              <HealthGauge score={stats.healthScore} size={120} />
            </div>

            {/* Key metrics */}
            <div className="md:col-span-3 bg-bg-card border border-brd rounded-xl p-4">
              <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider mb-3">Indicateurs clés</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <MetricBar label="Win Rate" value={parseFloat(stats.winRate.toFixed(0))} max={100} unit="%" color={stats.winRate >= 50 ? 'var(--profit)' : 'var(--loss)'} />
                <MetricBar label="P. Factor" value={parseFloat((stats.profitFactor === Infinity ? 3 : Math.min(stats.profitFactor, 3)).toFixed(1))} max={3} unit="" color={stats.profitFactor >= 1.5 ? 'var(--profit)' : stats.profitFactor >= 1 ? '#f59e0b' : 'var(--loss)'} />
                <MetricBar label="Discipline" value={parseFloat(stats.stratRespect.toFixed(0))} max={100} unit="%" color={stats.stratRespect >= 70 ? 'var(--profit)' : stats.stratRespect >= 40 ? '#f59e0b' : 'var(--loss)'} />
                <MetricBar label="Drawdown" value={parseFloat(stats.currentDD.toFixed(0))} max={Math.max(stats.maxDD, 1)} unit="€" color={stats.currentDD > stats.maxDD * 0.5 ? 'var(--loss)' : '#f59e0b'} invert />
                <MetricBar label="R:R Moy" value={parseFloat(Math.max(stats.avgRR, 0).toFixed(1))} max={3} unit="R" color={stats.avgRR >= 1.5 ? 'var(--profit)' : stats.avgRR >= 1 ? '#f59e0b' : 'var(--loss)'} />
                <MetricBar label="Régularité" value={stats.greenMonths} max={Math.max(stats.months.length, 1)} unit={`/${stats.months.length}`} color={stats.greenMonths >= stats.redMonths ? 'var(--profit)' : 'var(--loss)'} />
              </div>
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-bg-card border border-brd rounded-xl p-4">
              <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider mb-3">Insights automatiques</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {insights.map((ins, i) => (
                  <div key={i} className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs leading-relaxed ${insightColors[ins.type]}`}>
                    <span className="flex-shrink-0 text-sm">{ins.icon}</span>
                    <span>{ins.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Prompts */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex flex-wrap gap-2">
          {smartPrompts.map((p, i) => (
            <button key={i} onClick={() => sendMessage(p.text)} disabled={thinking}
              className="px-3 py-1.5 bg-bg-card border border-brd rounded-lg text-xs font-semibold text-txt-2 hover:border-accent hover:text-accent transition-all disabled:opacity-40">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12 text-txt-3">
            <div className="text-4xl mb-3 opacity-30">✦</div>
            <p className="font-semibold">Pose une question ou clique sur un insight</p>
            <p className="text-xs mt-1">L'IA analysera tes {at.length} trades avec {stats ? `un score de santé de ${stats.healthScore}/100` : 'tes données'}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
            {m.role === 'model' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">✦</div>
            )}
            <div className="relative">
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-accent text-white rounded-br-sm'
                  : 'bg-bg-card border border-brd rounded-bl-sm'
              }`}>
                {m.role === 'model'
                  ? <div dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }} />
                  : m.content
                }
              </div>
              {/* Copy button for AI responses */}
              {m.role === 'model' && (
                <button
                  onClick={() => copyMessage(m.content, i)}
                  className="absolute -bottom-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-bg-secondary border border-brd rounded text-[0.6rem] text-txt-3 hover:text-accent hover:border-accent"
                >
                  {copiedIdx === i ? '✓ Copié' : '◇ Copier'}
                </button>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">✦</div>
            <div className="bg-bg-card border border-brd rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Pose une question sur tes performances..."
            disabled={thinking}
            className="flex-1 bg-bg-card border border-brd rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || thinking}
            className="px-4 py-3 bg-accent text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all active:scale-95">
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
