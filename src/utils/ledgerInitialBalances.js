const read = (item, camel, pascal, fallback = "") =>
  item?.[camel] ?? item?.[pascal] ?? fallback;

export const extractInitialBalanceInvoiceRef = (item) => {
  const haystack = [
    read(item, "referencia", "Referencia"),
    read(item, "descripcion", "Descripcion"),
  ].join(" ");
  return haystack.match(/\bSI-[A-Z0-9-]+/i)?.[0]?.toUpperCase() || "";
};

export const filterDuplicateInitialBalanceRows = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  const mayorInitialBalanceRefs = new Set(
    list
      .filter((item) => read(item, "source", "Source", "Mayor") === "Mayor")
      .map(extractInitialBalanceInvoiceRef)
      .filter(Boolean),
  );

  if (mayorInitialBalanceRefs.size === 0) return list;

  return list.filter((item) => {
    const source = read(item, "source", "Source", "Mayor");
    const ref = extractInitialBalanceInvoiceRef(item);
    return !(source === "Ingreso" && ref && mayorInitialBalanceRefs.has(ref));
  });
};

export const buildSummaryFromItems = (rows) => {
  const map = new Map();

  for (const item of Array.isArray(rows) ? rows : []) {
    let cuenta = read(item, "cuenta", "Cuenta");
    if (cuenta === "Caja") cuenta = "Efectivo";
    if (!cuenta) continue;

    const tipo = read(item, "tipoMovimiento", "TipoMovimiento");
    const importe = Number(read(item, "importe", "Importe", 0));
    const row = map.get(cuenta) || {
      cuenta,
      Cuenta: cuenta,
      ingresos: 0,
      Ingresos: 0,
      egresos: 0,
      Egresos: 0,
      saldo: 0,
      Saldo: 0,
    };

    if (tipo === "Egreso") {
      row.egresos += Math.abs(importe);
      row.Egresos = row.egresos;
    } else {
      row.ingresos += importe;
      row.Ingresos = row.ingresos;
    }

    row.saldo = row.ingresos - row.egresos;
    row.Saldo = row.saldo;
    map.set(cuenta, row);
  }

  return Array.from(map.values());
};
