export const numberOf = (value) => Number(value ?? 0) || 0;

export function monthKeys(from, to) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const keys = [];
  for (let date = new Date(start.getFullYear(), start.getMonth(), 1); date <= end; date.setMonth(date.getMonth() + 1)) {
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function groupMonthly(rows, keys, dateField, amountField) {
  const totals = new Map(keys.map((key) => [key, 0]));
  rows.forEach((row) => {
    const rawDate = row[dateField] ?? row[dateField[0].toUpperCase() + dateField.slice(1)];
    if (!rawDate) return;
    const key = String(rawDate).slice(0, 7);
    if (!totals.has(key)) return;
    const rawAmount = row[amountField] ?? row[amountField[0].toUpperCase() + amountField.slice(1)];
    totals.set(key, totals.get(key) + numberOf(rawAmount));
  });
  return keys.map((key) => totals.get(key));
}

export function topCustomers(invoices, limit = 8) {
  const totals = new Map();
  invoices.forEach((invoice) => {
    const customer = String(invoice.customerName ?? invoice.CustomerName ?? "Sin cliente").trim() || "Sin cliente";
    const total = numberOf(invoice.totalAmount ?? invoice.TotalAmount);
    totals.set(customer, (totals.get(customer) || 0) + total);
  });
  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
