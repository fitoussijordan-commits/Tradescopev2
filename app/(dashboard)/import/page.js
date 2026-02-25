'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAccount } from '@/components/AccountContext';

// ─── CSV PARSER ───────────────────────────────────────────────
function parseTradovateCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const fills = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Smart CSV split (handle commas inside quoted values)
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

    // Parse PnL: "$36.00" or "$(124.50)"
    let pnl = 0;
    const pnlStr = row.pnl || '';
    const pnlMatch = pnlStr.match(/\$\(?([\d,.]+)\)?/);
    if (pnlMatch) {
      pnl = parseFloat(pnlMatch[1].replace(',', ''));
      if (pnlStr.includes('(')) pnl = -pnl;
    }

    // Parse timestamps
    const buyTs = parseTimestamp(row.boughtTimestamp);
    const sellTs = parseTimestamp(row.soldTimestamp);

    // Parse duration string to seconds
    const durationSec = parseDuration(row.duration);

    // Extract clean instrument name (MNQH6 -> MNQ, MESH6 -> MES, MYMH6 -> MYM)
    const rawSymbol = row.symbol || '';
    const cleanInstrument = rawSymbol.replace(/[A-Z]\d$/, '');

    fills.push({
      symbol: rawSymbol,
      instrument: cleanInstrument,
      qty: parseInt(row.qty) || 0,
      buyPrice: parseFloat(row.buyPrice) || 0,
      sellPrice: parseFloat(row.sellPrice) || 0,
      pnl,
      buyTimestamp: buyTs,
      sellTimestamp: sellTs,
      duration: row.duration || '',
      durationSec,
      date: buyTs ? buyTs.toISOString().split('T')[0] : null,
    });
  }

  return fills;
}

function parseTimestamp(str) {
  if (!str) return null;
  // Format: "02/16/2026 09:46:04"
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  return new Date(
    parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]),
    parseInt(match[4]), parseInt(match[5]), parseInt(match[6])
  );
}

function parseDuration(str) {
  if (!str) return 0;
  let totalSec = 0;
  const minMatch = str.match(/(\d+)\s*min/);
  const secMatch = str.match(/(\d+)\s*sec/);
  if (minMatch) totalSec += parseInt(minMatch[1]) * 60;
  if (secMatch) totalSec += parseInt(secMatch[1]);
  return totalSec;
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min >= 60) {
    const hr = Math.floor(min / 60);
    const remMin = min % 60;
    return `${hr}h ${remMin}m`;
  }
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

// ─── GROUP FILLS BY DAY ───────────────────────────────────────
function groupFillsByDay(fills) {
  const groups = {};
  fills.forEach(f => {
    if (!f.date) return;
    if (!groups[f.date]) groups[f.date] = [];
    groups[f.date].push(f);
  });

  return Object.entries(groups)
    .map(([date, dayFills]) => {
      const totalPnl = dayFills.reduce((s, f) => s + f.pnl, 0);
      const totalQty = dayFills.reduce((s, f) => s + f.qty, 0);
      const totalDuration = dayFills.reduce((s, f) => s + f.durationSec, 0);
      const avgDuration = dayFills.length > 0 ? totalDuration / dayFills.length : 0;
      const wins = dayFills.filter(f => f.pnl > 0).length;
      const losses = dayFills.filter(f => f.pnl < 0).length;
      const be = dayFills.filter(f => f.pnl === 0).length;

      // Instruments traded
      const instruments = [...new Set(dayFills.map(f => f.instrument))];

      // Session times
      const allTimestamps = dayFills
        .flatMap(f => [f.buyTimestamp, f.sellTimestamp])
        .filter(Boolean)
        .sort((a, b) => a - b);
      const firstEntry = allTimestamps[0] || null;
      const lastExit = allTimestamps[allTimestamps.length - 1] || null;

      // Best and worst trade
      const best = dayFills.reduce((b, f) => f.pnl > b.pnl ? f : b, dayFills[0]);
      const worst = dayFills.reduce((w, f) => f.pnl < w.pnl ? f : w, dayFills[0]);

      return {
        date,
        fills: dayFills,
        totalPnl,
        totalQty,
        fillCount: dayFills.length,
        totalDuration,
        avgDuration,
        wins,
        losses,
        be,
        winRate: dayFills.length > 0 ? (wins / dayFills.length * 100) : 0,
        instruments,
        firstEntry,
        lastExit,
        sessionDuration: firstEntry && lastExit ? (lastExit - firstEntry) / 1000 : 0,
        bestTrade: best,
        worstTrade: worst,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function ImportPage() {
  const { accounts, currentAccount, currentAccountId } = useAccount();
  const [fills, setFills] = useState([]);
  const [daySummaries, setDaySummaries] = useState([]);
  const [existingTrades, setExistingTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [matchResults, setMatchResults] = useState({});
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Load existing trades for matching
  useEffect(() => {
    const loadTrades = async () => {
      if (!currentAccountId) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', currentAccountId)
        .eq('is_payout', false);
      setExistingTrades(data || []);
    };
    loadTrades();
  }, [currentAccountId]);

  // Match Tradovate days with existing trades
  useEffect(() => {
    if (daySummaries.length === 0 || existingTrades.length === 0) return;
    const matches = {};
    daySummaries.forEach(day => {
      const dayTrades = existingTrades.filter(t => t.date === day.date);
      if (dayTrades.length > 0) {
        matches[day.date] = {
          status: 'matched',
          trades: dayTrades,
          pnlDiff: Math.abs(day.totalPnl - dayTrades.reduce((s, t) => s + parseFloat(t.pnl), 0)),
        };
      } else {
        matches[day.date] = { status: 'new', trades: [] };
      }
    });
    setMatchResults(matches);
  }, [daySummaries, existingTrades]);

  const handleFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.csv')) {
      alert('Fichier CSV requis');
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsedFills = parseTradovateCSV(text);
      setFills(parsedFills);
      setDaySummaries(groupFillsByDay(parsedFills));
      setImported(true);
      setLoading(false);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  // Enrich existing trades with Tradovate data
  const enrichTrades = async () => {
    if (!currentAccountId) return;
    setImporting(true);
    setImportStatus(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setImporting(false); return; }

    let enriched = 0;
    let errors = 0;

    for (const day of daySummaries) {
      const match = matchResults[day.date];
      if (!match || match.status !== 'matched') continue;

      // Build tradovate_data JSON
      const tradovateData = {
        fillCount: day.fillCount,
        totalQty: day.totalQty,
        avgDuration: day.avgDuration,
        totalDuration: day.totalDuration,
        sessionDuration: day.sessionDuration,
        firstEntry: day.firstEntry?.toISOString() || null,
        lastExit: day.lastExit?.toISOString() || null,
        winRate: day.winRate,
        wins: day.wins,
        losses: day.losses,
        instruments: day.instruments,
        bestTrade: day.bestTrade ? { pnl: day.bestTrade.pnl, instrument: day.bestTrade.instrument, duration: day.bestTrade.duration } : null,
        worstTrade: day.worstTrade ? { pnl: day.worstTrade.pnl, instrument: day.worstTrade.instrument, duration: day.worstTrade.duration } : null,
        fills: day.fills.map(f => ({
          symbol: f.symbol,
          qty: f.qty,
          buyPrice: f.buyPrice,
          sellPrice: f.sellPrice,
          pnl: f.pnl,
          duration: f.duration,
          durationSec: f.durationSec,
          buyTime: f.buyTimestamp?.toISOString() || null,
          sellTime: f.sellTimestamp?.toISOString() || null,
        })),
        importedAt: new Date().toISOString(),
      };

      // Update all matched trades for this day
      for (const trade of match.trades) {
        const { error } = await supabase
          .from('trades')
          .update({ tradovate_data: tradovateData })
          .eq('id', trade.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error enriching trade:', trade.id, error);
          errors++;
        } else {
          enriched++;
        }
      }
    }

    setImporting(false);
    setImportStatus({ enriched, errors });
  };

  const reset = () => {
    setFills([]);
    setDaySummaries([]);
    setImported(false);
    setMatchResults({});
    setImportStatus(null);
  };

  const fmt = (v) => (v >= 0 ? '+' : '') + v.toFixed(2) + '€';
  const fmtTime = (d) => d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  // ─── STATS GLOBALES DU CSV ─────────────────────────────────
  const totalFills = fills.length;
  const totalPnl = fills.reduce((s, f) => s + f.pnl, 0);
  const tradingDays = daySummaries.length;
  const matchedDays = Object.values(matchResults).filter(m => m.status === 'matched').length;
  const newDays = Object.values(matchResults).filter(m => m.status === 'new').length;

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h2 className="font-display font-bold text-lg">Import Tradovate</h2>
          <p className="text-txt-3 text-xs mt-0.5">Importe ton CSV Performance pour enrichir tes trades</p>
        </div>
        {imported && (
          <button onClick={reset} className="px-4 py-2 text-sm border border-brd text-txt-2 rounded-lg active:scale-95 transition-all">
            ↻ Nouveau fichier
          </button>
        )}
      </div>

      {/* ─── DROP ZONE ─────────────────────────────────────── */}
      {!imported && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
            ${dragActive ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-brd hover:border-accent/50'}
          `}
          onClick={() => document.getElementById('csvInput').click()}
        >
          <input
            id="csvInput"
            type="file"
            accept=".csv"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="text-4xl mb-4 opacity-50">↥</div>
          <div className="text-txt-1 font-display font-bold text-lg mb-2">
            {loading ? 'Analyse en cours...' : 'Glisse ton CSV ici'}
          </div>
          <p className="text-txt-3 text-sm">
            ou clique pour sélectionner · Fichier <code className="text-accent">Performance.csv</code> de Tradovate
          </p>
        </div>
      )}

      {/* ─── IMPORT RESULTS ────────────────────────────────── */}
      {imported && (
        <>
          {/* Global stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            <div className="bg-bg-card border border-brd rounded-xl p-3 text-center">
              <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">Fills CSV</div>
              <div className="text-lg font-bold font-display">{totalFills}</div>
            </div>
            <div className="bg-bg-card border border-brd rounded-xl p-3 text-center">
              <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">Jours</div>
              <div className="text-lg font-bold font-display">{tradingDays}</div>
            </div>
            <div className="bg-bg-card border border-brd rounded-xl p-3 text-center">
              <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">P&L CSV</div>
              <div className={`text-lg font-bold font-display font-mono ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(totalPnl)}</div>
            </div>
            <div className="bg-bg-card border border-brd rounded-xl p-3 text-center">
              <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">Matchés</div>
              <div className="text-lg font-bold font-display text-profit">{matchedDays}</div>
            </div>
            <div className="bg-bg-card border border-brd rounded-xl p-3 text-center">
              <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-1">Non matchés</div>
              <div className="text-lg font-bold font-display text-amber-400">{newDays}</div>
            </div>
          </div>

          {/* Enrich button */}
          {matchedDays > 0 && !importStatus && (
            <div className="bg-bg-card border border-accent/30 rounded-xl p-5 mb-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="font-display font-bold text-sm mb-1">Enrichir {matchedDays} jour{matchedDays > 1 ? 's' : ''} matché{matchedDays > 1 ? 's' : ''}</div>
                  <p className="text-txt-3 text-xs">Ajoute durée, fills, prix d'entrée/sortie, heures de session à tes trades existants</p>
                </div>
                <button
                  onClick={enrichTrades}
                  disabled={importing}
                  className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-lg shadow-lg shadow-accent/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  {importing ? '⟳ Import...' : '⚡ Enrichir les trades'}
                </button>
              </div>
            </div>
          )}

          {/* Import status */}
          {importStatus && (
            <div className={`rounded-xl p-5 mb-5 border ${importStatus.errors > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-profit/10 border-profit/30'}`}>
              <div className="font-display font-bold text-sm mb-1">
                {importStatus.errors > 0 ? '⚠️' : '✓'} Import terminé
              </div>
              <p className="text-txt-2 text-xs">
                {importStatus.enriched} trade{importStatus.enriched > 1 ? 's' : ''} enrichi{importStatus.enriched > 1 ? 's' : ''}
                {importStatus.errors > 0 && ` · ${importStatus.errors} erreur${importStatus.errors > 1 ? 's' : ''}`}
              </p>
              <p className="text-txt-3 text-[0.65rem] mt-2">
                Les données Tradovate sont maintenant associées à tes trades. Elles seront visibles dans le détail de chaque journée.
              </p>
            </div>
          )}

          {/* Day-by-day breakdown */}
          <div className="space-y-2">
            {daySummaries.map(day => {
              const match = matchResults[day.date] || {};
              const isExpanded = expandedDay === day.date;

              return (
                <div key={day.date} className="bg-bg-card border border-brd rounded-xl overflow-hidden">
                  {/* Day header */}
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-bg-secondary/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${match.status === 'matched' ? 'bg-profit' : 'bg-amber-400'}`} />
                      <span className="font-display font-bold text-sm">
                        {new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {day.instruments.map(i => (
                          <span key={i} className="text-[0.6rem] font-mono font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded">{i}</span>
                        ))}
                      </div>
                      <span className="text-[0.65rem] text-txt-3 font-mono">{day.fillCount} fills</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className={`font-mono font-bold text-sm ${day.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(day.totalPnl)}</div>
                        <div className="text-[0.6rem] text-txt-3 font-mono">{formatDuration(Math.round(day.avgDuration))} moy.</div>
                      </div>
                      <span className={`text-txt-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-brd px-4 py-4">
                      {/* Day stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-bg-secondary border border-brd rounded-lg p-2.5">
                          <div className="text-[0.55rem] text-txt-3 font-mono uppercase">Win Rate</div>
                          <div className={`text-base font-bold font-display ${day.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>{day.winRate.toFixed(0)}%</div>
                          <div className="text-[0.55rem] text-txt-3 font-mono">{day.wins}W / {day.losses}L{day.be > 0 ? ` / ${day.be}BE` : ''}</div>
                        </div>
                        <div className="bg-bg-secondary border border-brd rounded-lg p-2.5">
                          <div className="text-[0.55rem] text-txt-3 font-mono uppercase">Durée Moy.</div>
                          <div className="text-base font-bold font-display">{formatDuration(Math.round(day.avgDuration))}</div>
                          <div className="text-[0.55rem] text-txt-3 font-mono">Total: {formatDuration(day.totalDuration)}</div>
                        </div>
                        <div className="bg-bg-secondary border border-brd rounded-lg p-2.5">
                          <div className="text-[0.55rem] text-txt-3 font-mono uppercase">Session</div>
                          <div className="text-base font-bold font-display">{fmtTime(day.firstEntry)}</div>
                          <div className="text-[0.55rem] text-txt-3 font-mono">→ {fmtTime(day.lastExit)}</div>
                        </div>
                        <div className="bg-bg-secondary border border-brd rounded-lg p-2.5">
                          <div className="text-[0.55rem] text-txt-3 font-mono uppercase">Volume</div>
                          <div className="text-base font-bold font-display">{day.totalQty}</div>
                          <div className="text-[0.55rem] text-txt-3 font-mono">contrats</div>
                        </div>
                      </div>

                      {/* Best / Worst */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-profit/5 border border-profit/20 rounded-lg p-2.5">
                          <div className="text-[0.55rem] text-profit font-mono uppercase font-bold mb-1">Meilleur fill</div>
                          <div className="text-profit font-bold font-mono">{fmt(day.bestTrade.pnl)}</div>
                          <div className="text-[0.55rem] text-txt-3 font-mono">{day.bestTrade.instrument} · {day.bestTrade.duration}</div>
                        </div>
                        <div className="bg-loss/5 border border-loss/20 rounded-lg p-2.5">
                          <div className="text-[0.55rem] text-loss font-mono uppercase font-bold mb-1">Pire fill</div>
                          <div className="text-loss font-bold font-mono">{fmt(day.worstTrade.pnl)}</div>
                          <div className="text-[0.55rem] text-txt-3 font-mono">{day.worstTrade.instrument} · {day.worstTrade.duration}</div>
                        </div>
                      </div>

                      {/* Match info */}
                      {match.status === 'matched' && (
                        <div className="bg-profit/5 border border-profit/20 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-profit rounded-full" />
                            <span className="text-xs font-bold text-profit">Matché avec {match.trades.length} trade{match.trades.length > 1 ? 's' : ''} TradeScope</span>
                          </div>
                          {match.pnlDiff > 0.01 && (
                            <div className="text-[0.65rem] text-txt-3 font-mono">
                              Écart P&L: {match.pnlDiff.toFixed(2)}€ (commissions/frais probables)
                            </div>
                          )}
                        </div>
                      )}
                      {match.status === 'new' && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full" />
                            <span className="text-xs font-bold text-amber-400">Aucun trade TradeScope ce jour</span>
                          </div>
                          <div className="text-[0.65rem] text-txt-3 mt-1">Ce jour n'a pas de trade saisi dans le compte actuel</div>
                        </div>
                      )}

                      {/* Fills table */}
                      <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-2 font-bold">Détail des fills</div>
                      <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {day.fills.map((f, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 bg-bg-secondary border border-brd rounded-lg px-3 py-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono font-bold text-[0.7rem]">{f.instrument}</span>
                              <span className="text-txt-3 font-mono">{f.qty}ct</span>
                              <span className="text-txt-3 font-mono">{fmtTime(f.buyTimestamp)} → {fmtTime(f.sellTimestamp)}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-txt-3 font-mono">{f.duration}</span>
                              <span className={`font-mono font-bold ${f.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmt(f.pnl)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
