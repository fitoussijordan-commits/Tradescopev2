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

      if (window.ExcelJS) { buildExcel(data); return; }
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

    const darkBlue = 'FF1B2A4A';
    const headerBg = 'FF2C3E6B';
    const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
    const redFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
    const greenFont = { color: { argb: 'FF006100' } };
    const redFont = { color: { argb: 'FF9C0006' } };
    const white = 'FFFFFFFF';

    monthKeys.forEach((mk) => {
      const [yr, mo] = mk.split('-').map(Number);
      const monthTrades = tradesByMonth[mk];
      const ws = wb.addWorksheet(`${monthNames[mo - 1]} ${yr}`);

      // Column widths - BIGGER
      ws.getColumn(1).width = 8;
      ws.getColumn(2).width = 18;
      ws.getColumn(3).width = 16;
      ws.getColumn(4).width = 20;
      ws.getColumn(5).width = 12;
      ws.getColumn(6).width = 20;
      ws.getColumn(7).width = 20;
      ws.getColumn(8).width = 4; // spacer

      // Row 1 - Title
      ws.mergeCells('A1:G1');
      const t1 = ws.getCell('A1');
      t1.value = `MOIS - ${monthNames[mo - 1].toUpperCase()} ${yr}`;
      t1.font = { bold: true, size: 16, color: { argb: white } };
      t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkBlue } };
      t1.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 36;

      // Calculate starting capital for this month
      let startCapital = parseFloat(account.base_capital);
      for (const t of trades) {
        if (new Date(t.date) < new Date(yr, mo - 1, 1)) {
          startCapital += parseFloat(t.pnl);
        }
      }

      // Row 2 - Capital de base + Perte max
      ws.getCell('A2').value = 'Capital de base';
      ws.getCell('A2').font = { bold: true, size: 11 };
      ws.mergeCells('A2:C2');
      ws.getCell('D2').value = parseFloat(account.base_capital);
      ws.getCell('D2').numFmt = '#,##0.00 €';
      ws.getCell('D2').font = { bold: true, size: 11 };
      ws.getCell('F2').value = 'Perte Max autorisee';
      ws.getCell('F2').font = { bold: true, size: 10 };
      ws.getCell('G2').value = params.maxLoss / 100;
      ws.getCell('G2').numFmt = '0.0%';
      ws.getCell('G2').font = { bold: true, size: 12, color: { argb: 'FFFF0000' } };
      ws.getCell('G2').fill = redFill;
      ws.getRow(2).height = 22;

      // Row 3 - Capital en cours + Obj/S
      const monthPnl = monthTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
      ws.getCell('A3').value = 'Capital en cours';
      ws.getCell('A3').font = { bold: true, size: 11 };
      ws.mergeCells('A3:C3');
      ws.getCell('D3').value = startCapital + monthPnl;
      ws.getCell('D3').numFmt = '#,##0.00 €';
      ws.getCell('D3').font = { bold: true, size: 11 };
      ws.getCell('F3').value = 'Obj/S gain en % =';
      ws.getCell('F3').font = { bold: true, size: 10 };
      ws.getCell('G3').value = params.objWeekPct / 100;
      ws.getCell('G3').numFmt = '0.0%';
      ws.getCell('G3').font = { bold: true, size: 11 };
      ws.getRow(3).height = 22;

      // Row 4 - Obj/J
      ws.getCell('F4').value = 'Obj/J en % =';
      ws.getCell('F4').font = { bold: true, size: 10 };
      ws.getCell('G4').value = params.objDayPct / 100;
      ws.getCell('G4').numFmt = '0.0%';
      ws.getCell('G4').font = { bold: true, size: 11 };
      ws.getRow(4).height = 22;

      // Row 5 - empty
      ws.getRow(5).height = 8;

      // Row 6 - Column headers
      const headers = ['Sem.', 'Capital', 'Obj Gain /J', 'Profits/Pertes / J', '% / J', 'Avance et retard', 'Profit mensuel'];
      const hRow = ws.getRow(6);
      headers.forEach((h, i) => {
        const c = hRow.getCell(i + 1);
        c.value = h;
        c.font = { bold: true, color: { argb: white }, size: 11 };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      hRow.height = 26;

      // Build weeks (Mon-Fri)
      const daysInMonth = new Date(yr, mo, 0).getDate();
      const weeks = [];
      let curWeek = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dow = new Date(yr, mo - 1, d).getDay();
        if (dow === 1 && curWeek.length > 0) { weeks.push(curWeek); curWeek = []; }
        if (dow >= 1 && dow <= 5) curWeek.push(d);
      }
      if (curWeek.length > 0) weeks.push(curWeek);

      let row = 7;
      let cumCapital = startCapital;
      let cumPnl = 0;
      const objPerDay = startCapital * (params.objDayPct / 100);
      const dataStartRow = 7;

      weeks.forEach((week, wIdx) => {
        let weekPnl = 0;
        const weekStartRow = row;

        week.forEach((day) => {
          const dayTrades = monthTrades.filter(t => new Date(t.date).getDate() === day);
          const dayPnl = dayTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
          weekPnl += dayPnl;

          const r = ws.getRow(row);
          r.height = 20;

          // B: Capital
          r.getCell(2).value = cumCapital;
          r.getCell(2).numFmt = '#,##0.00 €';
          r.getCell(2).font = { size: 10 };

          // C: Obj Gain /J
          r.getCell(3).value = objPerDay;
          r.getCell(3).numFmt = '#,##0.00€';
          r.getCell(3).font = { bold: true, size: 10 };

          // D: Profits/Pertes / J
          r.getCell(4).value = dayPnl;
          r.getCell(4).numFmt = '#,##0.00€';
          r.getCell(4).font = { size: 10, ...(dayPnl > 0 ? greenFont : dayPnl < 0 ? redFont : {}) };
          if (dayPnl > 0) r.getCell(4).fill = greenFill;
          else if (dayPnl < 0) r.getCell(4).fill = redFill;

          // E: % / J
          const pct = cumCapital > 0 ? dayPnl / cumCapital : 0;
          r.getCell(5).value = pct;
          r.getCell(5).numFmt = '0.0%';
          r.getCell(5).font = { size: 10, ...(dayPnl < 0 ? redFont : dayPnl > 0 ? greenFont : {}) };

          cumCapital += dayPnl;
          cumPnl += dayPnl;
          row++;
        });

        // F: Avance et retard - write on FIRST cell of week BEFORE merging
        const weekPct = startCapital > 0 ? weekPnl / startCapital : 0;
        const avanceCell = ws.getRow(weekStartRow).getCell(6);
        avanceCell.value = weekPct;
        avanceCell.numFmt = '0.0%';
        avanceCell.alignment = { horizontal: 'center', vertical: 'middle' };
        avanceCell.font = { bold: true, size: 11, ...(weekPnl < 0 ? redFont : weekPnl > 0 ? greenFont : {}) };
        if (weekPnl < 0) avanceCell.fill = redFill;
        else if (weekPnl > 0) avanceCell.fill = greenFill;

        // A: Week label on FIRST cell BEFORE merging
        ws.getRow(weekStartRow).getCell(1).value = `s${wIdx + 1}`;
        ws.getRow(weekStartRow).getCell(1).font = { bold: true, size: 11 };
        ws.getRow(weekStartRow).getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

        // Merge week label + avance columns
        if (week.length > 1) {
          ws.mergeCells(weekStartRow, 1, weekStartRow + week.length - 1, 1);
          ws.mergeCells(weekStartRow, 6, weekStartRow + week.length - 1, 6);
        }
      });

      const dataEndRow = row - 1;

      // G: Profit mensuel - write on FIRST cell BEFORE merging
      if (dataEndRow >= dataStartRow) {
        const profitCell = ws.getRow(dataStartRow).getCell(7);
        profitCell.value = cumPnl;
        profitCell.numFmt = '#,##0.00€';
        profitCell.font = { bold: true, size: 16, ...(cumPnl >= 0 ? greenFont : redFont) };
        profitCell.fill = cumPnl >= 0 ? greenFill : redFill;
        profitCell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (dataEndRow > dataStartRow) {
          ws.mergeCells(dataStartRow, 7, dataEndRow, 7);
        }
      }

      // Total row
      const totalRow = ws.getRow(row);
      totalRow.height = 24;
      totalRow.getCell(4).value = cumPnl;
      totalRow.getCell(4).numFmt = '#,##0.00 €';
      totalRow.getCell(4).font = { bold: true, size: 12, ...(cumPnl >= 0 ? greenFont : redFont) };
      totalRow.getCell(4).fill = cumPnl >= 0 ? greenFill : redFill;
      const totalPct = startCapital > 0 ? cumPnl / startCapital : 0;
      totalRow.getCell(5).value = totalPct;
      totalRow.getCell(5).numFmt = '0.0%';
      totalRow.getCell(5).font = { bold: true, size: 12, ...(cumPnl >= 0 ? greenFont : redFont) };
      totalRow.getCell(5).fill = cumPnl >= 0 ? greenFill : redFill;

      // Borders on all data cells
      for (let r = 7; r <= row; r++) {
        for (let c = 1; c <= 7; c++) {
          const cell = ws.getRow(r).getCell(c);
          cell.border = {
            top: { style: 'hair', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'hair', color: { argb: 'FFD0D0D0' } },
            left: { style: 'hair', color: { argb: 'FFD0D0D0' } },
            right: { style: 'hair', color: { argb: 'FFD0D0D0' } },
          };
          if (!cell.alignment) cell.alignment = {};
          cell.alignment.vertical = 'middle';
        }
      }
    });

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
        <p className="text-txt-2 text-sm mb-6">Genere un fichier Excel avec tes trades, par mois.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-[0.65rem] text-txt-3 font-mono uppercase tracking-wider mb-1.5">Compte</label>
            <select value={selectedAccount || ''} onChange={e => setSelectedAccount(e.target.value)}
              className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {a.prop_firm}</option>)}
            </select>
          </div>

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

          <button onClick={generateExcel} disabled={exporting || !selectedAccount}
            className="w-full py-3 bg-accent text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-glow disabled:opacity-50">
            {exporting ? 'Generation en cours...' : 'Telecharger Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}
