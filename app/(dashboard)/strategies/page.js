'use client';
import { useState, useEffect, useMemo } from 'react';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];

// ============================================================
// SVG CHART COMPONENTS
// ============================================================

function DonutChart({ winRate, size = 100, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (winRate / 100) * circumference;
  const empty = circumference - filled;
  const cx = size / 2, cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--brd)" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cy} r={radius} fill="none"
        stroke={winRate >= 50 ? 'var(--profit)' : 'var(--loss)'}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={`${filled} ${empty}`}
        strokeDashoffset={circumference / 4}
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--txt-1)" fontSize="18" fontWeight="bold" fontFamily="monospace">{winRate.toFixed(0)}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--txt-3)" fontSize="8" fontFamily="monospace">WIN RATE</text>
    </svg>
  );
}

function MiniEquityCurve({ trades, color, height = 60, width = 220 }) {
  if (!trades || trades.length < 2) {
    return <div className="flex items-center justify-center text-txt-3 text-[0.6rem]" style={{ height }}>Pas assez de données</div>;
  }

  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumulative = 0;
  const points = [{ x: 0, y: 0 }];
  sorted.forEach((t, i) => {
    cumulative += parseFloat(t.pnl);
    points.push({ x: i + 1, y: cumulative });
  });

  const pad = { top: 5, right: 5, bottom: 5, left: 5 };
  const cW = width - pad.left - pad.right;
  const cH = height - pad.top - pad.bottom;
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  const yRange = maxY - minY || 1;
  const maxX = points.length - 1 || 1;

  const toX = (x) => pad.left + (x / maxX) * cW;
  const toY = (y) => pad.top + cH - ((y - minY) / yRange) * cH;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`).join(' ');
  const areaD = pathD + ` L ${toX(maxX).toFixed(1)} ${(pad.top + cH).toFixed(1)} L ${toX(0).toFixed(1)} ${(pad.top + cH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`miniGrad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <line x1={pad.left} y1={toY(0)} x2={width - pad.right} y2={toY(0)} stroke="var(--brd)" strokeWidth="0.5" strokeDasharray="3 3" />
      <path d={areaD} fill={`url(#miniGrad-${color.replace('#','')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={toX(maxX)} cy={toY(cumulative)} r="3" fill={color} stroke="var(--bg-card)" strokeWidth="1.5" />
    </svg>
  );
}

function StrategyComparisonChart({ strategiesData, height = 260 }) {
  if (!strategiesData || strategiesData.length === 0) return null;

  const width = 500;
  const pad = { top: 20, right: 20, bottom: 40, left: 60 };
  const cW = width - pad.left - pad.right;
  const cH = height - pad.top - pad.bottom;

  const maxAbs = Math.max(...strategiesData.map(s => Math.abs(s.pnl)), 1);
  const barWidth = Math.min(40, (cW / strategiesData.length) * 0.6);
  const gap = (cW - barWidth * strategiesData.length) / (strategiesData.length + 1);

  const zeroY = pad.top + (maxAbs / (2 * maxAbs)) * cH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <line x1={pad.left} y1={zeroY} x2={width - pad.right} y2={zeroY} stroke="var(--txt-3)" strokeWidth="0.5" strokeDasharray="4 3" />
      <text x={pad.left - 8} y={zeroY + 3} textAnchor="end" fill="var(--txt-3)" fontSize="8" fontFamily="monospace">0€</text>

      {[-1, -0.5, 0.5, 1].map(frac => {
        const val = frac * maxAbs;
        const y = pad.top + cH - ((val + maxAbs) / (2 * maxAbs)) * cH;
        return (
          <g key={frac}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--brd)" strokeWidth="0.5" />
            <text x={pad.left - 8} y={y + 3} textAnchor="end" fill="var(--txt-3)" fontSize="7" fontFamily="monospace">
              {val >= 0 ? '+' : ''}{Math.abs(val) >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0)}€
            </text>
          </g>
        );
      })}

      {strategiesData.map((s, i) => {
        const x = pad.left + gap + i * (barWidth + gap);
        const barH = (Math.abs(s.pnl) / maxAbs) * (cH / 2);
        const y = s.pnl >= 0 ? zeroY - barH : zeroY;
        const color = s.color || 'var(--accent)';

        return (
          <g key={s.id || i}>
            <defs>
              <linearGradient id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={s.pnl >= 0 ? "0.9" : "0.6"} />
                <stop offset="100%" stopColor={color} stopOpacity={s.pnl >= 0 ? "0.5" : "0.9"} />
              </linearGradient>
            </defs>
            <rect x={x} y={y} width={barWidth} height={Math.max(barH, 2)} rx="4" fill={`url(#barGrad-${i})`} />
            <text x={x + barWidth / 2} y={s.pnl >= 0 ? y - 6 : y + barH + 12} textAnchor="middle"
              fill={s.pnl >= 0 ? 'var(--profit)' : 'var(--loss)'} fontSize="9" fontWeight="bold" fontFamily="monospace">
              {s.pnl >= 0 ? '+' : ''}{Math.abs(s.pnl) >= 1000 ? `${(s.pnl/1000).toFixed(1)}k` : s.pnl.toFixed(0)}€
            </text>
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fill="var(--txt-2)" fontSize="8" fontFamily="monospace">
              {s.name.length > 8 ? s.name.substring(0, 7) + '…' : s.name}
            </text>
            <circle cx={x + barWidth / 2} cy={height - 22} r="3" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

function WinLossBar({ wins, losses }) {
  const total = wins + losses;
  if (total === 0) return null;
  const winPct = (wins / total) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden flex">
        <div className="h-full rounded-l-full transition-all duration-500" style={{ width: `${winPct}%`, backgroundColor: 'var(--profit)' }} />
        <div className="h-full rounded-r-full transition-all duration-500" style={{ width: `${100 - winPct}%`, backgroundColor: 'var(--loss)' }} />
      </div>
      <span className="text-[0.6rem] font-mono text-txt-3 w-14 text-right">{wins}W/{losses}L</span>
    </div>
  );
}

function PerformanceRadar({ stats, size = 160 }) {
  if (!stats) return null;

  const cx = size / 2, cy = size / 2;
  const radius = (size - 30) / 2;
  const metrics = [
    { label: 'Win Rate', value: Math.min(stats.winRate / 100, 1), raw: `${stats.winRate.toFixed(0)}%` },
    { label: 'P. Factor', value: Math.min(stats.profitFactor === Infinity ? 1 : stats.profitFactor / 3, 1), raw: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(1) },
    { label: 'R:R', value: Math.min(Math.max(stats.avgRR, 0) / 3, 1), raw: `${stats.avgRR.toFixed(1)}R` },
    { label: 'Constance', value: stats.nbTrades > 0 ? Math.min(stats.wins / stats.nbTrades, 1) : 0, raw: `${stats.wins}/${stats.nbTrades}` },
    { label: 'Volume', value: Math.min(stats.nbTrades / 50, 1), raw: `${stats.nbTrades}` },
  ];

  const angleStep = (2 * Math.PI) / metrics.length;
  const startAngle = -Math.PI / 2;

  const getPoint = (i, val) => {
    const angle = startAngle + i * angleStep;
    return { x: cx + Math.cos(angle) * radius * val, y: cy + Math.sin(angle) * radius * val };
  };

  const polygonPoints = metrics.map((m, i) => getPoint(i, m.value)).map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ maxWidth: size, margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map(r => (
        <circle key={r} cx={cx} cy={cy} r={radius * r} fill="none" stroke="var(--brd)" strokeWidth="0.5" />
      ))}
      {metrics.map((_, i) => {
        const p = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--brd)" strokeWidth="0.5" />;
      })}
      <polygon points={polygonPoints} fill="var(--accent)" fillOpacity="0.15" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
      {metrics.map((m, i) => {
        const p = getPoint(i, m.value);
        return <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent)" stroke="var(--bg-card)" strokeWidth="1.5" />;
      })}
      {metrics.map((m, i) => {
        const p = getPoint(i, 1.22);
        return (
          <g key={`label-${i}`}>
            <text x={p.x} y={p.y - 4} textAnchor="middle" fill="var(--txt-2)" fontSize="7" fontFamily="monospace">{m.label}</text>
            <text x={p.x} y={p.y + 6} textAnchor="middle" fill="var(--txt-1)" fontSize="8" fontWeight="bold" fontFamily="monospace">{m.raw}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// COMPUTE STATS
// ============================================================

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

  let maxWinStreak = 0, maxLoseStreak = 0, tempStreak = 0;
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(t => {
    if (parseFloat(t.pnl) > 0) { tempStreak = tempStreak > 0 ? tempStreak + 1 : 1; }
    else if (parseFloat(t.pnl) < 0) { tempStreak = tempStreak < 0 ? tempStreak - 1 : -1; }
    if (tempStreak > maxWinStreak) maxWinStreak = tempStreak;
    if (tempStreak < maxLoseStreak) maxLoseStreak = tempStreak;
  });

  return { totalPnl, winRate, avgRR, profitFactor, avgWin, avgLoss, best, worst, nbTrades: trades.length, wins: wins.length, losses: losses.length, maxWinStreak, maxLoseStreak: Math.abs(maxLoseStreak) };
}

// ============================================================
// MAIN PAGE
// ============================================================

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
  const [view, setView] = useState('detail');

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

  const getStratTrades = (stratId) => {
    if (stratId === 'hors') return trades.filter(t => !t.strategy_id);
    return trades.filter(t => t.strategy_id === stratId);
  };

  const allStrategiesData = useMemo(() => {
    const data = strategies.map(s => {
      const st = getStratTrades(s.id);
      const stats = computeStats(st);
      return { id: s.id, name: s.name, color: s.color || '#6366f1', pnl: stats?.totalPnl || 0, trades: st, stats, nbTrades: st.length };
    });
    const horsTrades = getStratTrades('hors');
    const horsStats = computeStats(horsTrades);
    if (horsTrades.length > 0) {
      data.push({ id: 'hors', name: 'Hors strat.', color: '#6B7280', pnl: horsStats?.totalPnl || 0, trades: horsTrades, stats: horsStats, nbTrades: horsTrades.length });
    }
    return data;
  }, [strategies, trades]);

  const selectedStrat = strategies.find(s => s.id === selectedId);
  const selectedTrades = selectedId ? getStratTrades(selectedId) : getStratTrades('hors');
  const selectedStats = computeStats(selectedId === 'hors' ? getStratTrades('hors') : selectedId ? getStratTrades(selectedId) : []);

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="animate-fade-up max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display font-bold text-xl">Stratégies</h2>
          <p className="text-txt-3 text-sm mt-0.5">Analyse tes performances par setup</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-bg-secondary border border-brd rounded-lg overflow-hidden">
            <button onClick={() => setView('detail')}
              className={`px-3 py-2 text-xs font-semibold transition-all ${view === 'detail' ? 'bg-accent text-white' : 'text-txt-2 hover:text-txt-1'}`}>
              Détail
            </button>
            <button onClick={() => setView('compare')}
              className={`px-3 py-2 text-xs font-semibold transition-all ${view === 'compare' ? 'bg-accent text-white' : 'text-txt-2 hover:text-txt-1'}`}>
              Comparer
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-accent text-white text-sm font-bold rounded-lg shadow-lg shadow-accent/25 active:scale-95 transition-all">
            + Stratégie
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* COMPARE VIEW */}
      {/* ============================================================ */}
      {view === 'compare' && (
        <div className="space-y-5">
          {allStrategiesData.length > 0 && (
            <div className="bg-bg-card border border-brd rounded-xl p-5">
              <h3 className="text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-4">Comparaison P&L par Stratégie</h3>
              <StrategyComparisonChart strategiesData={allStrategiesData} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allStrategiesData.map(s => (
              <div key={s.id} className="bg-bg-card border border-brd rounded-xl p-5 hover:border-brd-hover transition-all">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                    <div className="text-txt-3 text-xs">{s.nbTrades} trades</div>
                  </div>
                  <div className={`text-base font-mono font-bold ${s.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {s.nbTrades > 0 ? fmt(s.pnl) : '—'}
                  </div>
                </div>

                {s.stats ? (
                  <>
                    <div className="mb-3 bg-bg-secondary rounded-lg p-2">
                      <MiniEquityCurve trades={s.trades} color={s.color} height={50} />
                    </div>
                    <div className="mb-3">
                      <WinLossBar wins={s.stats.wins} losses={s.stats.losses} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-bg-secondary rounded-lg">
                        <div className="text-[0.5rem] text-txt-3 font-mono uppercase">Win Rate</div>
                        <div className={`text-sm font-bold font-mono ${s.stats.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>{s.stats.winRate.toFixed(0)}%</div>
                      </div>
                      <div className="text-center p-2 bg-bg-secondary rounded-lg">
                        <div className="text-[0.5rem] text-txt-3 font-mono uppercase">P. Factor</div>
                        <div className={`text-sm font-bold font-mono ${s.stats.profitFactor >= 1.5 ? 'text-profit' : s.stats.profitFactor >= 1 ? 'text-amber-400' : 'text-loss'}`}>
                          {s.stats.profitFactor === Infinity ? '∞' : s.stats.profitFactor.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-bg-secondary rounded-lg">
                        <div className="text-[0.5rem] text-txt-3 font-mono uppercase">R:R Moy</div>
                        <div className={`text-sm font-bold font-mono ${s.stats.avgRR >= 1 ? 'text-profit' : 'text-loss'}`}>
                          {s.stats.avgRR !== 0 ? `${s.stats.avgRR.toFixed(1)}R` : '—'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-txt-3 text-xs">Aucune donnée</div>
                )}
              </div>
            ))}
          </div>

          {allStrategiesData.length === 0 && (
            <div className="bg-bg-card border border-brd rounded-xl p-12 text-center text-txt-3">
              <div className="text-3xl mb-3 opacity-30">◬</div>
              <p>Crée des stratégies et associe-les à tes trades pour comparer</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* DETAIL VIEW */}
      {/* ============================================================ */}
      {view === 'detail' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategy list */}
          <div className="space-y-3">
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
                <button key={s.id} onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedId === s.id ? 'border-accent bg-accent-dim' : 'bg-bg-card border-brd hover:border-brd-hover'}`}>
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

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selectedId !== null && (
              <div className="space-y-4">
                {/* Header */}
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

                {/* GRAPHICAL STATS */}
                {selectedStats ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Donut */}
                      <div className="bg-bg-card border border-brd rounded-xl p-4 flex flex-col items-center justify-center">
                        <DonutChart winRate={selectedStats.winRate} size={110} strokeWidth={10} />
                        <div className="flex items-center gap-3 mt-3 text-[0.6rem] font-mono text-txt-3">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-profit" />{selectedStats.wins}W</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-loss" />{selectedStats.losses}L</span>
                        </div>
                      </div>

                      {/* Radar */}
                      <div className="bg-bg-card border border-brd rounded-xl p-4 flex items-center justify-center">
                        <PerformanceRadar stats={selectedStats} size={170} />
                      </div>

                      {/* Key Numbers */}
                      <div className="bg-bg-card border border-brd rounded-xl p-4 space-y-3">
                        <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider">Métriques clés</div>
                        {[
                          { label: 'P&L Total', value: fmt(selectedStats.totalPnl), color: selectedStats.totalPnl >= 0 ? 'text-profit' : 'text-loss' },
                          { label: 'Profit Factor', value: selectedStats.profitFactor === Infinity ? '∞' : selectedStats.profitFactor.toFixed(2), color: selectedStats.profitFactor >= 1.5 ? 'text-profit' : selectedStats.profitFactor >= 1 ? 'text-amber-400' : 'text-loss' },
                          { label: 'Gain Moyen', value: selectedStats.avgWin > 0 ? fmt(selectedStats.avgWin) : '—', color: 'text-profit' },
                          { label: 'Perte Moyenne', value: selectedStats.avgLoss > 0 ? `-${selectedStats.avgLoss.toFixed(2)}€` : '—', color: 'text-loss' },
                          { label: 'R:R Moyen', value: selectedStats.avgRR !== 0 ? `${selectedStats.avgRR.toFixed(2)}R` : '—', color: selectedStats.avgRR >= 1 ? 'text-profit' : 'text-loss' },
                          { label: 'Série gagnante', value: `${selectedStats.maxWinStreak} trades`, color: 'text-profit' },
                          { label: 'Série perdante', value: `${selectedStats.maxLoseStreak} trades`, color: 'text-loss' },
                        ].map(m => (
                          <div key={m.label} className="flex justify-between items-center">
                            <span className="text-xs text-txt-3">{m.label}</span>
                            <span className={`font-mono font-bold text-sm ${m.color}`}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equity Curve */}
                    <div className="bg-bg-card border border-brd rounded-xl p-4">
                      <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-2">Courbe de Progression</div>
                      <MiniEquityCurve
                        trades={selectedTrades}
                        color={selectedId === 'hors' ? '#6B7280' : selectedStrat?.color || '#6366f1'}
                        height={100}
                        width={600}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[0.55rem] text-txt-3 font-mono">{selectedTrades.length} trades</span>
                        <span className={`text-xs font-mono font-bold ${selectedStats.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(selectedStats.totalPnl)}</span>
                      </div>
                    </div>

                    {/* Trade list */}
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
      )}

      {/* Modal création/édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-bg-card border border-brd rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">{editingId ? 'Modifier la stratégie' : 'Nouvelle stratégie'}</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Nom de la stratégie</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ex: London Breakout, ICT OTE..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Description (optionnel)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2" placeholder="Décris ton setup en quelques mots..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent resize-none" />
              </div>
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
