const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function calcIva(base, ivaPct) {
  return roundMoney(((Number(base) || 0) * (Number(ivaPct) || 0)) / 100);
}

export function calcTotal(base, ivaPct) {
  return roundMoney((Number(base) || 0) + calcIva(base, ivaPct));
}

export function calcInvoiceLine(line) {
  const base = roundMoney(line?.base);
  const ivaPct = Number(line?.ivaPct) || 0;
  const iva = calcIva(base, ivaPct);
  const total = roundMoney(base + iva);

  return { base, iva, total, ivaPct };
}

export function sumInvoiceLines(lines) {
  return (lines || []).reduce(
    (acc, line) => {
      const total = calcInvoiceLine(line);
      acc.base = roundMoney(acc.base + total.base);
      acc.iva = roundMoney(acc.iva + total.iva);
      acc.total = roundMoney(acc.total + total.total);
      return acc;
    },
    { base: 0, iva: 0, total: 0 },
  );
}

export function calcDeliveryLine(line) {
  const cantidad = Number(line?.cantidad) || 0;
  const precioCompra = Number(line?.precioCompra) || 0;
  const ivaPct = Number(line?.ivaPct) || 0;
  const base = roundMoney(cantidad * precioCompra);
  const iva = calcIva(base, ivaPct);
  const total = roundMoney(base + iva);

  return { base, iva, total, ivaPct };
}

export function sumDeliveryLines(lines) {
  return (lines || []).reduce(
    (acc, line) => {
      const total = calcDeliveryLine(line);
      acc.base = roundMoney(acc.base + total.base);
      acc.iva = roundMoney(acc.iva + total.iva);
      acc.total = roundMoney(acc.total + total.total);
      return acc;
    },
    { base: 0, iva: 0, total: 0 },
  );
}
