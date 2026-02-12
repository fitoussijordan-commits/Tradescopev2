'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const BACKUP_DATA = {
  accounts: [
    { oldId: 1770453841818, name: "Apex 50k-65", propFirm: "Apex", baseCapital: 50000, isBurned: false },
    { oldId: 1770453949751, name: "Apex 50k-66", propFirm: "Apex", baseCapital: 50000, isBurned: false },
    { oldId: 1770453960133, name: "Bulenox", propFirm: "Bulenox", baseCapital: 50000, isBurned: false },
  ],
  trades: [
    { accountOldId: 1770453841818, date: "2026-02-11", instrument: "NQ", type: "SHORT", pnl: 101.26, risk: 0, size: 4, tradingViewLink: "", followedStrategy: false, notes: "", isPayout: false, pnlPercent: 0.2, rr: null },
    { accountOldId: 1770453949751, date: "2026-02-11", instrument: "NQ", type: "SHORT", pnl: -526.88, risk: 0, size: 4, tradingViewLink: "", followedStrategy: false, notes: "", isPayout: false, pnlPercent: -1.06, rr: null },
    { accountOldId: 1770453841818, date: "2026-02-11", instrument: "NQ", type: "SHORT", pnl: 211.84, risk: 0, size: 4, tradingViewLink: "", followedStrategy: false, notes: "", isPayout: false, pnlPercent: 0.42, rr: null },
    { accountOldId: 1770453949751, date: "2026-02-10", instrument: "NQ", type: "SHORT", pnl: -20.3, risk: 0, size: 5, tradingViewLink: "", followedStrategy: false, notes: "", isPayout: false, pnlPercent: -0.04, rr: null },
    { accountOldId: 1770453949751, date: "2026-02-10", instrument: "NQ", type: "LONG", pnl: -227.7, risk: 0, size: 5, tradingViewLink: "https://www.tradingview.com/x/3OO45QiE/", followedStrategy: false, notes: "", isPayout: false, pnlPercent: -0.46, rr: null },
    { accountOldId: 1770453949751, date: "2026-02-10", instrument: "NQ", type: "LONG", pnl: -225.4, risk: 0, size: 10, tradingViewLink: "", followedStrategy: false, notes: "", isPayout: false, pnlPercent: -0.45, rr: null },
    { accountOldId: 1770453949751, date: "2026-02-10", instrument: "NQ", type: "LONG", pnl: 67, risk: 0, size: 5, tradingViewLink: "https://www.tradingview.com/x/GuQQlTGe/", followedStrategy: true, notes: "", isPayout: false, pnlPercent: 0.13, rr: null },
    { accountOldId: 1770453949751, date: "2026-02-10", instrument: "NQ", type: "LONG", pnl: 152.7, risk: 0, size: 5, tradingViewLink: "https://www.tradingview.com/x/MfrxAJOI/", followedStrategy: true, notes: "", isPayout: false, pnlPercent: 0.31, rr: null },
    { accountOldId: 1770453949751, date: "2026-02-10", instrument: "NQ", type: "SHORT", pnl: -160.6, risk: 0, size: 5, tradingViewLink: "", followedStrategy: false, notes: "", isPayout: false, pnlPercent: -0.32, rr: null },
    { accountOldId: 1770453949751, date: "2026-02-10", instrument: "NQ", type: "LONG", pnl: -110.4, risk: 0, size: 5, tradingViewLink: "https://www.tradingview.com/x/iY6XbEGq/", followedStrategy: true, notes: "", isPayout: false, pnlPercent: -0.22, rr: null },
    { accountOldId: 1770453841818, date: "2026-02-10", instrument: "NQ", type: "LONG", pnl: -157.42, risk: 0, size: 5, tradingViewLink: "", followedStrategy: false, notes: "", isPayout: false, pnlPercent: -0.31, rr: null },
    { accountOldId: 1770453841818, date: "2026-02-10", instrument: "NQ", type: "SHORT", pnl: 74.28, risk: 0, size: 10, tradingViewLink: "", followedStrategy: false, notes: "Revenge gros lot", isPayout: false, pnlPercent: 0.15, rr: null },
    { accountOldId: 1770453841818, date: "2026-02-10", instrument: "NQ", type: "LONG", pnl: -627.32, risk: 627.32, size: 9, tradingViewLink: "https://www.tradingview.com/x/NWun4tL1/", followedStrategy: true, notes: "", isPayout: false, pnlPercent: -1.24, rr: null },
    { accountOldId: 1770453841818, date: "2026-02-10", instrument: "NQ", type: "SHORT", pnl: -58, risk: 58, size: 3, tradingViewLink: "", followedStrategy: true, notes: "", isPayout: false, pnlPercent: -0.11, rr: null },
    { accountOldId: 1770453841818, date: "2026-02-10", instrument: "NQ", type: "LONG", pnl: 235.84, risk: 78, size: 4, tradingViewLink: "https://www.tradingview.com/x/3Q33cM9H/", followedStrategy: true, notes: "", isPayout: false, pnlPercent: 0.47, rr: 3.02 },
    { accountOldId: 1770453841818, date: "2026-02-09", instrument: "NQ", type: "LONG", pnl: 402.82, risk: 200, size: 4, tradingViewLink: "", followedStrategy: true, notes: "Macro 10h50", isPayout: false, pnlPercent: 0.81, rr: 2.01 },
    { accountOldId: 1770453841818, date: "2026-02-09", instrument: "NQ", type: "SHORT", pnl: 109.7, risk: 100, size: 3, tradingViewLink: "https://www.tradingview.com/x/STExUlob/", followedStrategy: true, notes: "", isPayout: false, pnlPercent: 0.22, rr: 1.10 },
    { accountOldId: 1770453841818, date: "2026-02-09", instrument: "NQ", type: "LONG", pnl: -52, risk: 0, size: 3, tradingViewLink: "", followedStrategy: true, notes: "", isPayout: false, pnlPercent: -0.10, rr: null },
    { accountOldId: 1770453841818, date: "2026-02-09", instrument: "NQ", type: "LONG", pnl: -69.7, risk: 0, size: 3, tradingViewLink: "https://www.tradingview.com/x/STExUlob/", followedStrategy: false, notes: "", isPayout: false, pnlPercent: -0.14, rr: null },
  ],
};

export default function ImportPage() {
  const [status, setStatus] = useState('ready');
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const runImport = async () => {
    setStatus('running');
    setLog([]);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { addLog('❌ Non connecte'); setStatus('error'); return; }
      addLog(`✓ Connecte: ${user.email}`);

      // Check existing accounts to avoid duplicates
      const { data: existingAccounts } = await supabase.from('trading_accounts').select('name').eq('user_id', user.id);
      const existingNames = (existingAccounts || []).map(a => a.name);

      // Create accounts and map old IDs to new IDs
      const idMap = {};
      for (const acc of BACKUP_DATA.accounts) {
        if (existingNames.includes(acc.name)) {
          addLog(`⏭ Compte "${acc.name}" existe deja, skip`);
          const existing = (await supabase.from('trading_accounts').select('id').eq('user_id', user.id).eq('name', acc.name).single()).data;
          if (existing) idMap[acc.oldId] = existing.id;
          continue;
        }
        const { data, error } = await supabase.from('trading_accounts').insert({
          user_id: user.id,
          name: acc.name,
          prop_firm: acc.propFirm,
          base_capital: acc.baseCapital,
          is_burned: acc.isBurned,
        }).select().single();
        if (error) { addLog(`❌ Compte "${acc.name}": ${error.message}`); continue; }
        idMap[acc.oldId] = data.id;
        addLog(`✓ Compte "${acc.name}" cree`);
      }

      // Import trades
      let imported = 0;
      let skipped = 0;
      for (const trade of BACKUP_DATA.trades) {
        const accountId = idMap[trade.accountOldId];
        if (!accountId) { addLog(`⏭ Trade sans compte`); skipped++; continue; }

        const { error } = await supabase.from('trades').insert({
          user_id: user.id,
          account_id: accountId,
          date: trade.date,
          instrument: trade.instrument,
          type: trade.type,
          pnl: trade.pnl,
          risk: trade.risk || null,
          size: trade.size || null,
          trading_view_link: trade.tradingViewLink || null,
          followed_strategy: trade.followedStrategy,
          notes: trade.notes || null,
          is_payout: trade.isPayout,
          pnl_percent: trade.pnlPercent || null,
          rr: trade.rr || null,
        });
        if (error) { addLog(`❌ Trade ${trade.date}: ${error.message}`); skipped++; }
        else imported++;
      }

      addLog(`\n✅ Import termine: ${imported} trades importes, ${skipped} ignores`);
      setStatus('done');
    } catch (err) {
      addLog(`❌ Erreur: ${err.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <div className="bg-bg-card border border-brd rounded-xl p-6">
        <h2 className="font-display font-bold text-xl mb-2">Import Ancien TradeScope</h2>
        <p className="text-txt-2 text-sm mb-4">3 comptes, 19 trades (9-11 fev. 2026)</p>

        <div className="bg-bg-secondary border border-brd rounded-lg p-4 mb-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-txt-3">Apex 50k-65</span><span>11 trades · +171.00€</span></div>
          <div className="flex justify-between"><span className="text-txt-3">Apex 50k-66</span><span>8 trades · -1,051.58€</span></div>
          <div className="flex justify-between"><span className="text-txt-3">Bulenox</span><span>0 trades</span></div>
        </div>

        {status === 'ready' && (
          <button onClick={runImport} className="w-full py-3 bg-accent text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-glow">
            Importer les donnees
          </button>
        )}

        {status === 'running' && (
          <div className="w-full py-3 bg-accent/50 text-white font-bold rounded-lg text-center">
            Import en cours...
          </div>
        )}

        {status === 'done' && (
          <div className="w-full py-3 bg-profit text-white font-bold rounded-lg text-center">
            ✓ Import termine — Va sur Trades pour verifier
          </div>
        )}

        {log.length > 0 && (
          <div className="mt-4 bg-bg-secondary border border-brd rounded-lg p-3 max-h-60 overflow-y-auto">
            {log.map((l, i) => (
              <div key={i} className="text-xs font-mono text-txt-2 py-0.5">{l}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
