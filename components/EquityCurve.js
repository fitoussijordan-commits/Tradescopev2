'use client';

export default function EquityCurve({ trades, baseCapital, height = 180 }) {
  if (!trades || trades.length < 2) {
    return (
      <div className="flex items-center justify-center text-txt-3 text-sm" style={{ height }}>
        Pas assez de trades pour la courbe
      </div>
    );
  }

  // Sort trades by date
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Build equity curve points
  let equity = baseCapital || 0;
  const points = [{ x: 0, y: equity, date: 'Debut' }];
  sorted.forEach((t, i) => {
    equity += parseFloat(t.pnl);
    points.push({ x: i + 1, y: equity, date: t.date });
  });

  // Also build win rate rolling curve (last 10 trades)
  const wrPoints = [];
  for (let i = 0; i < sorted.length; i++) {
    const window = sorted.slice(Math.max(0, i - 9), i + 1);
    const wr = (window.filter(t => parseFloat(t.pnl) > 0).length / window.length) * 100;
    wrPoints.push({ x: i + 1, y: wr });
  }

  const width = 500;
  const padding = { top: 20, right: 15, bottom: 30, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Equity scales
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  const yRange = maxY - minY || 1;
  const maxX = points.length - 1 || 1;

  const toX = (x) => padding.left + (x / maxX) * chartW;
  const toY = (y) => padding.top + chartH - ((y - minY) / yRange) * chartH;

  // Build path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`).join(' ');

  // Fill area
  const areaD = pathD + ` L ${toX(maxX).toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${toX(0).toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z`;

  // Determine if overall positive
  const isPositive = points[points.length - 1].y >= points[0].y;
  const lineColor = isPositive ? 'var(--profit)' : 'var(--loss)';
  const fillId = isPositive ? 'fillGreen' : 'fillRed';

  // Y grid lines (5 lines)
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const val = minY + (yRange * i) / 4;
    gridLines.push({ y: toY(val), label: val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0) });
  }

  // X labels (first, middle, last dates)
  const xLabels = [];
  if (points.length >= 2) {
    const formatDate = (d) => { if (d === 'Debut') return ''; const dt = new Date(d); return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
    xLabels.push({ x: toX(0), label: formatDate(points[0].date) });
    if (points.length > 2) {
      const midIdx = Math.floor(points.length / 2);
      xLabels.push({ x: toX(midIdx), label: formatDate(points[midIdx].date) });
    }
    xLabels.push({ x: toX(maxX), label: formatDate(points[points.length - 1].date) });
  }

  // Current equity and change
  const currentEquity = points[points.length - 1].y;
  const change = currentEquity - (baseCapital || points[0].y);
  const changePct = baseCapital ? ((change / baseCapital) * 100).toFixed(2) : '0.00';

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-[0.5rem] text-txt-3 font-mono uppercase tracking-wider">Equity</span>
        <span className="text-sm font-bold font-mono">{currentEquity >= 1000 ? `${(currentEquity / 1000).toFixed(1)}k€` : `${currentEquity.toFixed(0)}€`}</span>
        <span className={`text-xs font-mono font-bold ${change >= 0 ? 'text-profit' : 'text-loss'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(0)}€ ({change >= 0 ? '+' : ''}{changePct}%)
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
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

        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y} stroke="var(--brd)" strokeWidth="0.5" />
            <text x={padding.left - 8} y={g.y + 3} textAnchor="end" fill="var(--txt-3)" fontSize="9" fontFamily="monospace">{g.label}€</text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={height - 5} textAnchor="middle" fill="var(--txt-3)" fontSize="8" fontFamily="monospace">{l.label}</text>
        ))}

        {/* Fill area */}
        <path d={areaD} fill={`url(#${fillId})`} />

        {/* Main line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Start dot */}
        <circle cx={toX(0)} cy={toY(points[0].y)} r="3" fill="var(--bg-card)" stroke={lineColor} strokeWidth="1.5" />

        {/* End dot */}
        <circle cx={toX(maxX)} cy={toY(points[points.length - 1].y)} r="4" fill={lineColor} stroke="var(--bg-card)" strokeWidth="2" />

        {/* Base capital line */}
        {baseCapital > 0 && (
          <line x1={padding.left} y1={toY(baseCapital)} x2={width - padding.right} y2={toY(baseCapital)} stroke="var(--txt-3)" strokeWidth="0.5" strokeDasharray="4 3" />
        )}
      </svg>
    </div>
  );
}
