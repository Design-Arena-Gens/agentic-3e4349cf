export type EmployeeRow = {
  id: string;
  name: string;
  hours: number;
  hourlyRate: number;
  overtimeHours: number;
  overtimeMultiplier: number; // usually 1.5
  bonus: number;
  preTaxDeductions: number;
  taxRatePct: number; // 0-100
  postTaxDeductions: number;
};

export type ComputedRow = EmployeeRow & {
  grossPay: number;
  taxableIncome: number;
  taxes: number;
  netPay: number;
};

export type PayrollState = {
  periodLabel: string;
  company: string;
  rows: EmployeeRow[];
};

export function computeRow(row: EmployeeRow): ComputedRow {
  const basePay = row.hours * row.hourlyRate;
  const overtimePay = row.overtimeHours * row.hourlyRate * row.overtimeMultiplier;
  const grossPay = basePay + overtimePay + row.bonus;
  const taxableIncome = Math.max(0, grossPay - row.preTaxDeductions);
  const taxes = taxableIncome * (row.taxRatePct / 100);
  const netPay = taxableIncome - taxes - row.postTaxDeductions;

  return {
    ...row,
    grossPay,
    taxableIncome,
    taxes,
    netPay,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

export function toCsv(state: PayrollState): string {
  const header = [
    'Employee',
    'Hours',
    'Rate',
    'OT Hours',
    'OT Mult',
    'Bonus',
    'Pre-Tax Ded',
    'Tax %',
    'Post-Tax Ded',
    'Gross',
    'Taxable',
    'Taxes',
    'Net'
  ];

  const lines = [header.join(',')];
  for (const r of state.rows) {
    const c = computeRow(r);
    lines.push([
      escapeCsv(c.name),
      c.hours,
      c.hourlyRate,
      c.overtimeHours,
      c.overtimeMultiplier,
      c.bonus,
      c.preTaxDeductions,
      c.taxRatePct,
      c.postTaxDeductions,
      c.grossPay,
      c.taxableIncome,
      c.taxes,
      c.netPay,
    ].join(','));
  }
  return lines.join('\n');
}

function escapeCsv(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}
