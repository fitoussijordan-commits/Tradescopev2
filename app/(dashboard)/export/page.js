'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function ExportPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [maxLoss, setMaxLoss] = useState('1.0');
  const [objWeek, setObjWeek] = useState('4.0');
  const [objDay, setObjDay] = useState('2.0');

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id).order('created_at');
    setAccounts(data || []);
    if (data?.length) setSelectedAccount(data[0].id);
    setLoading(false);
  };

  const generateExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          maxLoss: parseFloat(maxLoss),
          objWeekPct: parseFloat(objWeek),
          objDayPct: parseFloat(objDay),
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); setExporting(false); return; }

      // Dynamic import ExcelJS from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
      script.onload = () => buildExcel(data);
      document.head.appendChild(script);
    } catch (err) {
      alert('Erreur export');
      setExporting(false);
    }
  };

  const buildExcel = async (data) => {
    const { account, trades, params } = data;
    const ExcelJS = window.ExcelJS;
    const wb = new ExcelJS.Workbook();

    // Group trades by month
    const tradesByMonth = {};
    trades.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!tradesByMonth[key]) tradesByMonth[key] = [];
      tradesByMonth[key].push(t);
    });

    const monthNames = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
    const monthKeys = Object.keys(tradesByMonth).sort();

    if (monthKeys.length === 0) {
      const now = new Date();
      monthKeys.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      tradesByMonth[monthKeys[0]] = [];
    }

    monthKeys.forEach((mk, mIdx) => {
      const [yr, mo] = mk.split('-').map(Number);
      const monthTrades = tradesByMonth[mk];
      const sheetName = `${monthNames[mo - 1]} ${yr}`;
      const ws = wb.addWorksheet(sheetName);

      // Colors
      const darkBlue = 'FF1B2A4A';
      const headerBg = 'FF2C3E6B';
      const greenBg = 'FF00B050';
      const redBg = 'FFFF0000';
      const lightGreen = 'FFE2EFDA';
      const lightRed = 'FFFCE4EC';
      const white = 'FFFFFFFF';
      const gray = 'FFF5F5F5';

      // Column widths
      ws.getColumn(1).width = 6;   // A: week
      ws.getColumn(2).width = 14;  // B: Capital
      ws.getColumn(3).width = 14;  // C: Obj Gain/J
      ws.getColumn(4).width = 16;  // D: Profits/Pertes/J
      ws.getColumn(5).width = 10;  // E: %/J
      ws.getColumn(6).width = 16;  // F: Avance et retard
      ws.getColumn(7).width = 16;  // G: Profit mensuel

      // Header area
      ws.mergeCells('A1:G1');
      const titleCell = ws.getCell('A1');
      titleCell.value = `MOIS - ${monthNames[mo - 1].toUpperCase()} ${yr}`;
      titleCell.font = { bold: true, size: 14, color: { argb: white } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkBlue } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 30;

      // Account info row 2
      ws.getCell('A2').value = 'Capital de base';
      ws.getCell('A2').font = { bold: true, size: 10 };
      ws.mergeCells('A2:C2');
      ws.getCell('D2').value = parseFloat(account.base_capital);
      ws.getCell('D2').numFmt = '#,##0.00 €';
      ws.getCell('D2').font = { bold: true };

      ws.getCell('F2').value = 'Perte Max autorisee';
      ws.getCell('F2').font = { bold: true, size: 9 };
      ws.getCell('G2').value = params.maxLoss / 100;
      ws.getCell('G2').numFmt = '0.0%';
      ws.getCell('G2').font = { bold: true, color: { argb: 'FFFF0000' } };
      ws.getCell('G2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightRed } };

      // Row 3
      let runningCapital = parseFloat(account.base_capital);
      for (const t of trades) {
        if (new Date(t.date) < new Date(yr, mo - 1, 1)) {
          runningCapital += parseFloat(t.pnl);
        }
      }
      ws.getCell('A3').value = 'Capital en cours';
      ws.getCell('A3').font = { bold: true, size: 10 };
      ws.mergeCells('A3:C3');

      const monthPnl = monthTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
      ws.getCell('D3').value = runningCapital + monthPnl;
      ws.getCell('D3').numFmt = '#,##0.00 €';
      ws.getCell('D3').font = { bold: true };

      ws.getCell('F3').value = 'Obj/S gain en % =';
      ws.getCell('F3').font = { bold: true, size: 9 };
      ws.getCell('G3').value = params.objWeekPct / 100;
      ws.getCell('G3').numFmt = '0.0%';
      ws.getCell('G3').font = { bold: true };

      // Row 4
      ws.getCell('F4').value = 'Obj/J en % =';
      ws.getCell('F4').font = { bold: true, size: 9 };
      ws.getCell('G4').value = params.objDayPct / 100;
      ws.getCell('G4').numFmt = '0.0%';
      ws.getCell('G4').font = { bold: true };

      // Column headers row 5
      const headers = ['Sem.', 'Capital', 'Obj Gain /J', 'Profits/Pertes / J', '% / J', 'Avance et retard', 'Profit mensuel'];
      const headerRow = ws.getRow(6);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: white }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: darkBlue } },
        };
      });
      headerRow.height = 22;

      // Build day-by-day data grouped by weeks
      const daysInMonth = new Date(yr, mo, 0).getDate();
      const firstDow = new Date(yr, mo - 1, 1).getDay();

      // Group by trading weeks (Mon-Fri)
      const weeks = [];
      let currentWeek = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dow = new Date(yr, mo - 1, d).getDay();
        if (dow === 1 && currentWeek.length > 0) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
        if (dow >= 1 && dow <= 5) {
          currentWeek.push(d);
        }
      }
      if (currentWeek.length > 0) weeks.push(currentWeek);

      let row = 7;
      let cumCapital = runningCapital;
      let cumPnl = 0;
      const objPerDay = runningCapital * (params.objDayPct / 100);

      weeks.forEach((week, wIdx) => {
        let weekPnl = 0;
        const weekStartRow = row;

        week.forEach((day, dIdx) => {
          const dayTrades = monthTrades.filter(t => new Date(t.date).getDate() === day);
          const dayPnl = dayTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
          weekPnl += dayPnl;

          const r = ws.getRow(row);

          // Week label (first day only)
          if (dIdx === 0) {
            r.getCell(1).value = `s${wIdx + 1}`;
            r.getCell(1).font = { bold: true, size: 10 };
            r.getCell(1).alignment = { vertical: 'middle' };
          }

          // Capital
          r.getCell(2).value = cumCapital;
          r.getCell(2).numFmt = '#,##0.00 €';

          // Obj Gain /J
          r.getCell(3).value = objPerDay;
          r.getCell(3).numFmt = '#,##0.00€';
          r.getCell(3).font = { bold: true };

          // Profits/Pertes / J
          r.getCell(4).value = dayPnl;
          r.getCell(4).numFmt = '#,##0.00€';
          if (dayPnl > 0) {
            r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
            r.getCell(4).font = { color: { argb: 'FF006100' } };
          } else if (dayPnl < 0) {
            r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
            r.getCell(4).font = { color: { argb: 'FF9C0006' } };
          }

          // % / J
          const pct = cumCapital > 0 ? dayPnl / cumCapital : 0;
          r.getCell(5).value = pct;
          r.getCell(5).numFmt = '0.0%';
          if (dayPnl < 0) {
            r.getCell(5).font = { color: { argb: 'FF9C0006' } };
          }

          cumCapital += dayPnl;
          cumPnl += dayPnl;
          row++;
        });

        // Week summary - Avance et retard
        const weekTarget = runningCapital * (params.objWeekPct / 100);
        const avance = weekPnl > 0 ? ((weekPnl / runningCapital) * 100).toFixed(1) + '%' : weekPnl < 0 ? ((weekPnl / runningCapital) * 100).toFixed(1) + '%' : '0.0%';
        const midRow = weekStartRow + Math.floor(week.length / 2);
        const avanceCell = ws.getRow(midRow).getCell(6);
        avanceCell.value = parseFloat(avance) / 100;
        avanceCell.numFmt = '0.0%';
        avanceCell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (weekPnl < 0) {
          avanceCell.font = { color: { argb: 'FF9C0006' }, bold: true };
          avanceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        } else {
          avanceCell.font = { color: { argb: 'FF006100' }, bold: true };
        }

        // Merge week label
        if (week.length > 1) {
          ws.mergeCells(weekStartRow, 1, weekStartRow + week.length - 1, 1);
          ws.mergeCells(weekStartRow, 6, weekStartRow + week.length - 1, 6);
        }
      });

      // Monthly profit column - merged on right
      const dataStartRow = 7;
      const dataEndRow = row - 1;
      if (dataEndRow >= dataStartRow) {
        const midDataRow = dataStartRow + Math.floor((dataEndRow - dataStartRow) / 2);
        const profitCell = ws.getRow(midDataRow).getCell(7);
        profitCell.value = cumPnl;
        profitCell.numFmt = '#,##0.00€';
        profitCell.font = { bold: true, size: 14, color: { argb: cumPnl >= 0 ? 'FF006100' : 'FF9C0006' } };
        profitCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cumPnl >= 0 ? 'FFC6EFCE' : 'FFFFC7CE' } };
        profitCell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (dataEndRow > dataStartRow) {
          ws.mergeCells(dataStartRow, 7, dataEndRow, 7);
        }
      }

      // Total row
      const totalRow = ws.getRow(row);
      totalRow.getCell(4).value = cumPnl;
      totalRow.getCell(4).numFmt = '#,##0.00 €';
      totalRow.getCell(4).font = { bold: true, color: { argb: cumPnl >= 0 ? 'FF006100' : 'FF9C0006' } };
      totalRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cumPnl >= 0 ? 'FFC6EFCE' : 'FFFFC7CE' } };

      const totalPct = runningCapital > 0 ? cumPnl / runningCapital : 0;
      totalRow.getCell(5).value = totalPct;
      totalRow.getCell(5).numFmt = '0.0%';
      totalRow.getCell(5).font = { bold: true, color: { argb: cumPnl >= 0 ? 'FF006100' : 'FF9C0006' } };
      totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cumPnl >= 0 ? 'FFC6EFCE' : 'FFFFC7CE' } };

      // Style all data rows with light borders
      for (let r = 7; r <= row; r++) {
        for (let c = 1; c <= 7; c++) {
          const cell = ws.getRow(r).getCell(c);
          cell.border = { bottom: { style: 'hair', color: { argb: 'FFD0D0D0' } } };
          if (!cell.alignment) cell.alignment = {};
          cell.alignment.vertical = 'middle';
        }
      }
    });

    // Generate and download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TradeScope-${accounts.find(ac => ac.id === selectedAccount)?.name || 'export'}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <div className="bg-bg-card border border-brd rounded-xl p-6">
        <h2 className="font-display font-bold text-xl mb-1">Export Excel</h2>
        <p className="text-txt-2 text-sm mb-6">Genere un fichier Excel style Family Trader avec tes trades.</p>

        <div className="space-y-4">
          {/* Account select */}
          <div>
            <label className="block text-[0.65rem] text-txt-3 font-mono uppercase tracking-wider mb-1.5">Compte</label>
            <select value={selectedAccount || ''} onChange={e => setSelectedAccount(e.target.value)}
              className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {a.prop_firm}</option>)}
            </select>
          </div>

          {/* Params */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[0.65rem] text-txt-3 font-mono uppercase tracking-wider mb-1.5">Perte Max (%)</label>
              <input type="number" step="0.1" value={maxLoss} onChange={e => setMaxLoss(e.target.value)}
                className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-[0.65rem] text-txt-3 font-mono uppercase tracking-wider mb-1.5">Obj/Semaine (%)</label>
              <input type="number" step="0.1" value={objWeek} onChange={e => setObjWeek(e.target.value)}
                className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-[0.65rem] text-txt-3 font-mono uppercase tracking-wider mb-1.5">Obj/Jour (%)</label>
              <input type="number" step="0.1" value={objDay} onChange={e => setObjDay(e.target.value)}
                className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-bg-secondary border border-brd rounded-lg p-4 text-sm">
            <div className="text-[0.6rem] text-txt-3 font-mono uppercase tracking-wider mb-2">Apercu du format</div>
            <div className="grid grid-cols-7 gap-1 text-[0.55rem] font-mono">
              <div className="bg-[#2C3E6B] text-white p-1 rounded text-center font-bold">Sem.</div>
              <div className="bg-[#2C3E6B] text-white p-1 rounded text-center font-bold">Capital</div>
              <div className="bg-[#2C3E6B] text-white p-1 rounded text-center font-bold">Obj/J</div>
              <div className="bg-[#2C3E6B] text-white p-1 rounded text-center font-bold">P&L/J</div>
              <div className="bg-[#2C3E6B] text-white p-1 rounded text-center font-bold">%/J</div>
              <div className="bg-[#2C3E6B] text-white p-1 rounded text-center font-bold">Avance</div>
              <div className="bg-[#2C3E6B] text-white p-1 rounded text-center font-bold">Mensuel</div>
              <div className="p-1 text-txt-3">s1</div>
              <div className="p-1">50 000€</div>
              <div className="p-1 font-bold">1 000€</div>
              <div className="p-1 rounded" style={{backgroundColor: 'rgba(34,197,94,0.15)', color: '#006100'}}>+295€</div>
              <div className="p-1" style={{color: '#006100'}}>0.6%</div>
              <div className="p-1 text-txt-3">-0.6%</div>
              <div className="p-1 rounded font-bold" style={{backgroundColor: 'rgba(239,68,68,0.15)', color: '#9C0006'}}>-273€</div>
            </div>
          </div>

          <button onClick={generateExcel} disabled={exporting || !selectedAccount}
            className="w-full py-3 bg-accent text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-glow disabled:opacity-50">
            {exporting ? 'Generation en cours...' : 'Telecharger Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}
