"use client";

import { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { EmployeeRow, PayrollState } from './PayrollTypes';
import { computeRow, formatCurrency, toCsv } from './PayrollTypes';

const defaultRow = (): EmployeeRow => ({
  id: uuid(),
  name: '',
  hours: 40,
  hourlyRate: 25,
  overtimeHours: 0,
  overtimeMultiplier: 1.5,
  bonus: 0,
  preTaxDeductions: 0,
  taxRatePct: 20,
  postTaxDeductions: 0,
});

function numberOrZero(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function PayrollTable() {
  const [state, setState] = useState<PayrollState>(() => {
    if (typeof window === 'undefined') return { periodLabel: '', company: '', rows: [defaultRow()] };
    const saved = window.localStorage.getItem('payroll-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PayrollState;
        return parsed;
      } catch {}
    }
    return { periodLabel: '', company: '', rows: [defaultRow()] };
  });

  useEffect(() => {
    window.localStorage.setItem('payroll-state', JSON.stringify(state));
  }, [state]);

  const computed = useMemo(() => state.rows.map(computeRow), [state.rows]);
  const totals = useMemo(() => {
    return computed.reduce(
      (acc, r) => {
        acc.gross += r.grossPay;
        acc.taxable += r.taxableIncome;
        acc.taxes += r.taxes;
        acc.net += r.netPay;
        return acc;
      },
      { gross: 0, taxable: 0, taxes: 0, net: 0 }
    );
  }, [computed]);

  function updateRow(id: string, patch: Partial<EmployeeRow>) {
    setState(prev => ({
      ...prev,
      rows: prev.rows.map(r => r.id === id ? { ...r, ...patch } : r)
    }));
  }

  function addRow() {
    setState(prev => ({ ...prev, rows: [...prev.rows, defaultRow()] }));
  }

  function removeRow(id: string) {
    setState(prev => ({ ...prev, rows: prev.rows.filter(r => r.id !== id) }));
  }

  function clearAll() {
    if (confirm('Clear all rows?')) {
      setState({ company: '', periodLabel: '', rows: [defaultRow()] });
    }
  }

  function handleExportCsv() {
    const csv = toCsv(state);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `payroll_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input
              value={state.company}
              onChange={e => setState(s => ({ ...s, company: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pay period</label>
            <input
              value={state.periodLabel}
              onChange={e => setState(s => ({ ...s, periodLabel: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Nov 1 - Nov 15"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={addRow} className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Add employee</button>
          <button onClick={handleExportCsv} className="rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">Export CSV</button>
          <button onClick={() => window.print()} className="rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">Print</button>
          <button onClick={clearAll} className="rounded-md border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50">Clear</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <Th>Employee</Th>
              <Th className="text-right">Hours</Th>
              <Th className="text-right">Rate</Th>
              <Th className="text-right">OT Hours</Th>
              <Th className="text-right">OT Mult</Th>
              <Th className="text-right">Bonus</Th>
              <Th className="text-right">Pre-Tax Ded</Th>
              <Th className="text-right">Tax %</Th>
              <Th className="text-right">Post-Tax Ded</Th>
              <Th className="text-right">Gross</Th>
              <Th className="text-right">Taxable</Th>
              <Th className="text-right">Taxes</Th>
              <Th className="text-right">Net</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.rows.map((r) => {
              const c = computeRow(r);
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td>
                    <input
                      value={r.name}
                      onChange={e => updateRow(r.id, { name: e.target.value })}
                      className="w-48 rounded-md border border-gray-300 px-2 py-1 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Employee name"
                    />
                  </Td>
                  <Td className="text-right"><Num value={r.hours} onChange={v => updateRow(r.id, { hours: v })} /></Td>
                  <Td className="text-right"><Num value={r.hourlyRate} onChange={v => updateRow(r.id, { hourlyRate: v })} /></Td>
                  <Td className="text-right"><Num value={r.overtimeHours} onChange={v => updateRow(r.id, { overtimeHours: v })} /></Td>
                  <Td className="text-right"><Num value={r.overtimeMultiplier} step={0.1} onChange={v => updateRow(r.id, { overtimeMultiplier: v })} /></Td>
                  <Td className="text-right"><Num value={r.bonus} onChange={v => updateRow(r.id, { bonus: v })} /></Td>
                  <Td className="text-right"><Num value={r.preTaxDeductions} onChange={v => updateRow(r.id, { preTaxDeductions: v })} /></Td>
                  <Td className="text-right"><Num value={r.taxRatePct} onChange={v => updateRow(r.id, { taxRatePct: v })} /></Td>
                  <Td className="text-right"><Num value={r.postTaxDeductions} onChange={v => updateRow(r.id, { postTaxDeductions: v })} /></Td>
                  <Td className="text-right font-medium">{formatCurrency(c.grossPay)}</Td>
                  <Td className="text-right">{formatCurrency(c.taxableIncome)}</Td>
                  <Td className="text-right text-rose-600">{formatCurrency(c.taxes)}</Td>
                  <Td className="text-right font-semibold text-emerald-700">{formatCurrency(c.netPay)}</Td>
                  <Td className="text-right">
                    <button onClick={() => removeRow(r.id)} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">Remove</button>
                  </Td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <Td colSpan={9} className="text-right font-semibold">Totals</Td>
              <Td className="text-right font-semibold">{formatCurrency(totals.gross)}</Td>
              <Td className="text-right font-semibold">{formatCurrency(totals.taxable)}</Td>
              <Td className="text-right font-semibold text-rose-700">{formatCurrency(totals.taxes)}</Td>
              <Td className="text-right font-bold text-emerald-800">{formatCurrency(totals.net)}</Td>
              <Td></Td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-xs text-gray-500">Values are estimates; consult your payroll provider for exact calculations.</div>
    </div>
  );
}

function Th({ children, className = '' }: { children?: React.ReactNode, className?: string }) {
  return <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 ${className}`}>{children}</th>;
}
function Td({ children, className = '', colSpan }: { children?: React.ReactNode, className?: string, colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}

function Num({ value, onChange, step = 0.01 }: { value: number, onChange: (v: number) => void, step?: number }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={e => onChange(numberOrZero(e.target.value))}
      className="w-28 rounded-md border border-gray-300 px-2 py-1 text-right focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    />
  );
}
