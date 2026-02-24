'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAccount } from '@/components/AccountContext';

export default function DashboardPage() {
  const { currentAccount, currentAccountId } = useAccount();
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentAccountId) loadData();
  }, [currentAccountId]);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load trades with strategy information
      const { data: tradesData } = await supabase
        .from('trades')
        .select(`
          *, 
          strategies(name, color)
        `)
        .eq('account_id', currentAccountId)
        .order('date', { ascending: false });

      // Load strategies
      const { data: strategiesData } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id);

      setTrades(tradesData || []);
      setStrategies(strategiesData || []);
      calculateStats(tradesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tradesData) => {
    const realTrades = tradesData.filter(t => !t.is_payout);
    const payouts = tradesData.filter(t => t.is_payout);
    
    if (realTrades.length === 0) {
      setStats(null);
      return;
    }

    const wins = realTrades.filter(t => t.pnl > 0);
    const losses = realTrades.filter(t => t.pnl < 0);
    const breakevens = realTrades.filter(t => t.pnl === 0);
    
    const totalPnl = realTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const totalPayouts = payouts.reduce((sum, t) => sum + Math.abs(t.pnl), 0);
    
    const winRate = (wins.length / realTrades.length) * 100;
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
    const expectancy = realTrades.length > 0 ? totalPnl / realTrades.length : 0;
    
    // Max drawdown calculation
    let maxDrawdown = 0;
    let runningPnl = 0;
    let peak = 0;
    
    [...realTrades].reverse().forEach(trade => {
      runningPnl += trade.pnl;
      if (runningPnl > peak) peak = runningPnl;
      const drawdown = peak - runningPnl;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Sharpe ratio approximation (simplified)
    const returns = realTrades.map(t => t.pnl_percent || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;

    // Strategy performance
    const strategyStats = {};
    realTrades.forEach(trade => {
      const strategyName = trade.strategies?.name || 'Sans stratégie';
      if (!strategyStats[strategyName]) {
        strategyStats[strategyName] = { trades: 0, pnl: 0, wins: 0, color: trade.strategies?.color || '#6B7280' };
      }
      strategyStats[strategyName].trades++;
      strategyStats[strategyName].pnl += trade.pnl;
      if (trade.pnl > 0) strategyStats[strategyName].wins++;
    });

    // Error analysis
    const errorStats = {};
    realTrades.forEach(trade => {
      if (trade.error_tags && trade.pnl < 0) {
        trade.error_tags.forEach(error => {
          errorStats[error] = (errorStats[error] || 0) + 1;
        });
      }
    });

    // Confidence analysis
    const confidenceStats = {};
    realTrades.forEach(trade => {
      if (trade.confidence) {
        if (!confidenceStats[trade.confidence]) {
          confidenceStats[trade.confidence] = { trades: 0, pnl: 0, wins: 0 };
        }
        confidenceStats[trade.confidence].trades++;
        confidenceStats[trade.confidence].pnl += trade.pnl;
        if (trade.pnl > 0) confidenceStats[trade.confidence].wins++;
      }
    });

    setStats({
      totalTrades: realTrades.length,
      totalPnl,
      totalPayouts,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      expectancy,
      maxDrawdown,
      sharpeRatio,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      strategyStats,
      errorStats,
      confidenceStats,
    });
  };

  if (!currentAccount) {
    return <div className="text-center py-20"><p className="text-txt-2">Sélectionne un compte pour voir le dashboard</p></div>;
  }

  if (loading) {
    return <div className="text-center py-20"><div className="text-txt-3">Chargement...</div></div>;
  }

  if (!stats) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-6xl opacity-50">📊</div>
        <div><p className="text-lg font-semibold">Aucun trade trouvé</p><p className="text-txt-2 text-sm">Commence à enregistrer tes trades pour voir tes stats</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard PREVIEW - {currentAccount?.name}</h1>
          <p className="text-txt-2 text-sm">{currentAccount?.prop_firm}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold font-display ${stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.totalPnl)}
          </div>
          <div className="text-txt-2 text-sm">{stats.totalTrades} trades • {stats.totalPayouts > 0 ? `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.totalPayouts)} payouts` : 'Aucun payout'}</div>
        </div>
      </div>

      {/* Preview Badge */}
      <div className="bg-accent-dim border border-accent/30 rounded-xl p-4 text-center">
        <div className="text-accent font-bold text-sm">🚀 TradeScope PREVIEW v36</div>
        <div className="text-xs text-txt-2 mt-1">Stratégies multi-niveaux • Analytics visuels • Tags d'erreurs • Confidence tracking</div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-card border border-brd rounded-xl p-4">
          <div className="text-txt-2 text-xs font-mono uppercase tracking-wide mb-1">Win Rate</div>
          <div className="text-2xl font-bold font-display">{stats.winRate.toFixed(1)}%</div>
        </div>
        <div className="bg-bg-card border border-brd rounded-xl p-4">
          <div className="text-txt-2 text-xs font-mono uppercase tracking-wide mb-1">Profit Factor</div>
          <div className="text-2xl font-bold font-display">{stats.profitFactor === 999 ? '∞' : stats.profitFactor.toFixed(2)}</div>
        </div>
        <div className="bg-bg-card border border-brd rounded-xl p-4">
          <div className="text-txt-2 text-xs font-mono uppercase tracking-wide mb-1">Expectancy</div>
          <div className={`text-2xl font-bold font-display ${stats.expectancy >= 0 ? 'text-profit' : 'text-loss'}`}>
            {stats.expectancy >= 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.expectancy)}
          </div>
        </div>
        <div className="bg-bg-card border border-brd rounded-xl p-4">
          <div className="text-txt-2 text-xs font-mono uppercase tracking-wide mb-1">Max Drawdown</div>
          <div className="text-2xl font-bold font-display text-loss">
            -{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.maxDrawdown)}
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-bg-card border border-brd rounded-xl p-6">
          <h3 className="font-bold mb-4">Distribution des Trades</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-profit rounded-full"></div>
                <span>Gains</span>
              </div>
              <span className="font-bold">{stats.wins}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-loss rounded-full"></div>
                <span>Pertes</span>
              </div>
              <span className="font-bold">{stats.losses}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-txt-3 rounded-full"></div>
                <span>BE</span>
              </div>
              <span className="font-bold">{stats.breakevens}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-brd rounded-xl p-6">
          <h3 className="font-bold mb-4">P&L par Stratégie</h3>
          <div className="space-y-3">
            {Object.entries(stats.strategyStats).map(([name, stat]) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }}></div>
                  <span className="text-sm">{name}</span>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${stat.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {stat.pnl >= 0 ? '+' : ''}{stat.pnl.toFixed(0)}€
                  </div>
                  <div className="text-xs text-txt-3">
                    {stat.trades}T • {((stat.wins / stat.trades) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-brd rounded-xl p-6">
          <h3 className="font-bold mb-4">Erreurs Fréquentes</h3>
          <div className="space-y-2">
            {Object.entries(stats.errorStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([error, count]) => (
                <div key={error} className="flex justify-between items-center">
                  <span className="text-sm">{error}</span>
                  <span className="bg-loss-dim text-loss px-2 py-1 rounded text-xs font-bold">{count}×</span>
                </div>
              ))
            }
            {Object.keys(stats.errorStats).length === 0 && (
              <div className="text-center text-txt-3 py-4">
                <div className="text-xl mb-1">🎯</div>
                <div className="text-xs">Aucune erreur identifiée</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confidence Analysis */}
      {Object.keys(stats.confidenceStats).length > 0 && (
        <div className="bg-bg-card border border-brd rounded-xl p-6">
          <h3 className="font-bold mb-4">Performance par Niveau de Confiance</h3>
          <div className="grid grid-cols-5 gap-4">
            {[1,2,3,4,5].map(conf => {
              const stat = stats.confidenceStats[conf];
              if (!stat) return (
                <div key={conf} className="text-center p-4 bg-bg-secondary rounded-lg">
                  <div className="text-lg font-bold text-txt-3">Conf {conf}</div>
                  <div className="text-xs text-txt-3 mt-1">Aucune donnée</div>
                </div>
              );
              const avgPnl = stat.pnl / stat.trades;
              const wr = (stat.wins / stat.trades) * 100;
              return (
                <div key={conf} className="text-center p-4 bg-bg-secondary rounded-lg">
                  <div className="text-lg font-bold">Conf {conf}</div>
                  <div className={`text-sm font-bold ${avgPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {avgPnl >= 0 ? '+' : ''}{avgPnl.toFixed(0)}€
                  </div>
                  <div className="text-xs text-txt-3 mt-1">
                    {stat.trades}T • {wr.toFixed(0)}% WR
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-card border border-brd rounded-xl p-4 text-center">
          <div className="text-txt-2 text-xs font-mono uppercase tracking-wide mb-1">Gain Moyen</div>
          <div className="text-lg font-bold font-display text-profit">
            +{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.avgWin)}
          </div>
        </div>
        <div className="bg-bg-card border border-brd rounded-xl p-4 text-center">
          <div className="text-txt-2 text-xs font-mono uppercase tracking-wide mb-1">Perte Moyenne</div>
          <div className="text-lg font-bold font-display text-loss">
            -{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.avgLoss)}
          </div>
        </div>
        <div className="bg-bg-card border border-brd rounded-xl p-4 text-center">
          <div className="text-txt-2 text-xs font-mono uppercase tracking-wide mb-1">Sharpe Ratio</div>
          <div className="text-lg font-bold font-display">{stats.sharpeRatio.toFixed(2)}</div>
        </div>
        <div className="bg-bg-card border border-brd rounded-xl p-4 text-center">
          <div className="text-txt-2 text-xs font-mono uppercase tracking-wide mb-1">Total Trades</div>
          <div className="text-lg font-bold font-display">{stats.totalTrades}</div>
        </div>
      </div>
    </div>
  );
}
