'use client';
import { useState, useRef } from 'react';

export default function EquityCurve({ trades, baseCapital, height = 180 }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const svgRef = useRef(null);

  if (!trades || trades.length < 2) {
    return (
      <div className="flex items-center justify-center text-txt-3 text-sm" style={{ height }}>
        Pas assez de trades pour la courbe
      </div>
    );
  }

  // Sort and group by day
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const dayMap = {};
  sorted.forEach(t => {
    const d = t.date;
    if (!dayMap[d]) dayMap[d] = [];
    dayMap[d].push(t);
  });

  const days = Object.keys(dayMap).sort();
  let equity = baseCapital || 0;
  const points = [{ x: 0, y: equity, date: null, dayPnl: 0, trades: [] }];
  days.forEach((d, i) => {
    const dayTrades = dayMap[d];
    const dayPnl = dayTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
    equity += dayPnl;
    points.push({ x: i + 1, y: equity, date: d, dayPnl, trades: dayTrades });
  });

  const width = 500;
  const padding = { top: 20, right: 15, bottom: 30, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  const yRange = maxY - minY || 1;
  const maxX = points.length - 1 || 1;

  const toX = (x) => padding.left + (x / maxX) * chartW;
  const toY = (y) => padding.top + chartH - ((y - minY) / yRange) * chartH;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`).join(' ');
  const areaD = pathD + ` L ${toX(maxX).toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${toX(0).toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z`;

  const isPositive = points[points.length - 1].y >= points[0].y;
  const lineColor = isPositive ? 'var(--profit)' : 'var(--loss)';
  const fillId = isPositive ? 'fillGreen' : 'fillRed';

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const val = minY + (yRange * i) / 4;
    gridLines.push({ y: toY(val), label: val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0) });
  }

  const xLabels = [];
  const formatDate = (d) => { if (!d) return ''; const dt = new Date(d); return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
  if (points.length >= 2) {
    xLabels.push({ x: toX(0), label: '' });
    if (points.length > 3) {
      const midIdx = Math.floor(points.length / 2);
      xLabels.push({ x: toX(midIdx), label: formatDate(points[midIdx].date) });
    }
    xLabels.push({ x: toX(maxX), label: formatDate(points[points.length - 1].date) });
  }

  const currentEquity = points[points.length - 1].y;
  const change = currentEquity - (baseCapital || points[0].y);
  const changePct = baseCapital ? ((change / baseCapital) * 100).toFixed(2) : '0.00';
  const fmt = (v) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const handleClick = () => {};

  const hp = hoverIdx !== null ? points[hoverIdx] : null;

  const selectedTrades = selectedDay?.trades || [];
  const selectedDayPnl = selectedDay?.dayPnl || 0;

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-[0.5rem] text-txt-3 font-mono uppercase tracking-wider">Equity</span>
        <span className="text-sm font-bold font-mono">{fmt(currentEquity)}€</span>
        <span className={`text-xs font-mono font-bold ${change >= 0 ? 'text-profit' : 'text-loss'}`}>
          {change >= 0 ? '+' : ''}{fmt(change)}€ ({change >= 0 ? '+' : ''}{changePct}%)
        </span>
      </div>

      <div className="relative">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full"
          style={{ height }}
          onMouseLeave={() => setHoverIdx(null)}>
          <defs>
            <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--profit)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--profit)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="fillRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--loss)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--loss)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y} stroke="var(--brd)" strokeWidth="0.5" />
              <text x={padding.left - 8} y={g.y + 3} textAnchor="end" fill="var(--txt-3)" fontSize="9" fontFamily="monospace">{g.label}€</text>
            </g>
          ))}

          {xLabels.map((l, i) => (
            <text key={i} x={l.x} y={height - 5} textAnchor="middle" fill="var(--txt-3)" fontSize="8" fontFamily="monospace">{l.label}</text>
          ))}

          <path d={areaD} fill={`url(#${fillId})`} />
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {baseCapital > 0 && (
            <line x1={padding.left} y1={toY(baseCapital)} x2={width - padding.right} y2={toY(baseCapital)} stroke="var(--txt-3)" strokeWidth="0.5" strokeDasharray="4 3" />
          )}

          {/* Day dots with hit areas */}
          {points.map((p, i) => i > 0 && (
            <g key={i} style={{ cursor: 'pointer' }}
              onPointerEnter={() => setHoverIdx(i)}
              onPointerLeave={() => setHoverIdx(null)}
              onPointerDown={(e) => { e.stopPropagation(); if (p.date) setSelectedDay(p); }}>
              {/* Large invisible hit area */}
              <circle cx={toX(p.x)} cy={toY(p.y)} r="20" fill="transparent" stroke="none" />
              {/* Visible dot */}
              <circle cx={toX(p.x)} cy={toY(p.y)} r={hoverIdx === i ? 7 : 4.5}
                fill={p.dayPnl >= 0 ? 'var(--profit)' : 'var(--loss)'}
                stroke="var(--bg-card)" strokeWidth="2"
                style={{ transition: 'r 0.15s ease', pointerEvents: 'none' }} />
            </g>
          ))}

          {/* Hover vertical line */}
          {hp && (
            <line x1={toX(hp.x)} y1={padding.top} x2={toX(hp.x)} y2={padding.top + chartH}
              stroke="var(--txt-3)" strokeWidth="0.5" strokeDasharray="3 3" />
          )}
        </svg>

        {/* Tooltip */}
        {hp && hp.date && (
          <div className="absolute pointer-events-none z-10 bg-bg-card border border-brd rounded-lg shadow-xl px-3 py-2"
            style={{
              left: `${(toX(hp.x) / width) * 100}%`,
              top: '-8px',
              transform: `translateX(${toX(hp.x) > width * 0.7 ? '-100%' : toX(hp.x) < width * 0.3 ? '0%' : '-50%'})`,
            }}>
            <div className="text-[0.65rem] text-txt-3 font-mono">
              {new Date(hp.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div className={`text-sm font-bold font-mono ${hp.dayPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {hp.dayPnl >= 0 ? '+' : ''}{fmt(hp.dayPnl)}€
            </div>
            <div className="text-[0.6rem] text-txt-2 font-mono">
              Capital: {fmt(hp.y)}€ · {hp.trades.length} trade{hp.trades.length > 1 ? 's' : ''}
            </div>
            <div className="text-[0.5rem] text-accent mt-0.5">Cliquer pour details</div>
          </div>
        )}
      </div>

      {/* Day trades modal */}
      {selectedDay && selectedTrades.length > 0 && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={() => setSelectedDay(null)} />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={() => setSelectedDay(null)}>
            <div className="bg-bg-card border border-brd rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-brd flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-base">
                    Trades — {new Date(selectedDay.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <button onClick={() => setSelectedDay(null)} className="w-8 h-8 rounded-lg border border-brd text-txt-3 hover:text-txt-1 hover:border-accent transition-all text-sm flex items-center justify-center">✕</button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-bg-secondary border border-brd rounded-xl p-3">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">P&L</div>
                    <div className={`text-xl font-bold font-display ${selectedDayPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {selectedDayPnl >= 0 ? '+' : ''}{fmt(selectedDayPnl)} €
                    </div>
                  </div>
                  <div className="bg-bg-secondary border border-brd rounded-xl p-3">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">Trades</div>
                    <div className="text-xl font-bold font-display">{selectedTrades.length}</div>
                  </div>
                  <div className="bg-bg-secondary border border-brd rounded-xl p-3">
                    <div className="text-[0.55rem] text-txt-3 font-mono uppercase tracking-wider">W / L</div>
                    <div className="text-xl font-bold font-display">
                      <span className="text-profit">{selectedTrades.filter(t => parseFloat(t.pnl) > 0).length}</span>
                      <span className="text-txt-3">/</span>
                      <span className="text-loss">{selectedTrades.filter(t => parseFloat(t.pnl) < 0).length}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {selectedTrades.map(t => (
                    <div key={t.id} className="bg-bg-secondary border border-brd rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-bold text-sm">{t.instrument || '-'}</span>
                        <span className={`text-[0.55rem] font-bold font-mono px-1.5 py-0.5 rounded ${t.type === 'LONG' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'}`}>{t.type}</span>
                        {t.size && <span className="text-[0.6rem] text-txt-3 font-mono">{t.size} lots</span>}
                        {t.followed_strategy ? <span className="text-profit text-[0.6rem]">✓</span> : <span className="text-loss text-[0.6rem]">✗</span>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`font-bold font-mono text-sm ${parseFloat(t.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {parseFloat(t.pnl) >= 0 ? '+' : ''}{fmt(parseFloat(t.pnl))}€
                        </span>
                        {t.rr != null && <div className={`text-[0.55rem] font-mono ${parseFloat(t.rr) >= 0 ? 'text-profit' : 'text-loss'}`}>{parseFloat(t.rr).toFixed(2)}R</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
