const SERVICE_LABEL = "Servicios";

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const incomeCategoryName = (item) =>
  item?.cuenta_Ingreso ?? item?.Cuenta_Ingreso ?? item?.nombre ?? "Sin tipo";

export const expenseCategoryName = (item) =>
  item?.cuenta_Egreso ?? item?.Cuenta_Egreso ?? item?.nombre ?? "Sin tipo";

export function normalizeIncomeCategoryName(value) {
  const clean = normalizeText(value);
  if (
    clean === "servicio" ||
    clean === "servicios" ||
    clean.startsWith("servicio ") ||
    clean.startsWith("servicios ") ||
    clean.includes("mano de obra")
  ) {
    return SERVICE_LABEL;
  }

  return String(value || "Sin tipo").trim() || "Sin tipo";
}

export function aggregateIncomeRows(rows) {
  const grouped = new Map();

  (Array.isArray(rows) ? rows : []).forEach((item) => {
    const name = normalizeIncomeCategoryName(incomeCategoryName(item));
    const current = grouped.get(name) || {
      ...item,
      cuenta_Ingreso: name,
      Cuenta_Ingreso: name,
      total: 0,
      Total: 0,
    };
    const amount = Number(item?.total ?? item?.Total ?? 0);
    current.total = Number(current.total || 0) + amount;
    current.Total = current.total;
    grouped.set(name, current);
  });

  return Array.from(grouped.values());
}

export function aggregateExpenseRows(rows) {
  const grouped = new Map();

  (Array.isArray(rows) ? rows : []).forEach((item) => {
    const name = expenseCategoryName(item);
    const kind = item?.tipoGasto ?? item?.TipoGasto ?? "variable";
    const key = `${name}__${kind}`;
    const current = grouped.get(key) || {
      ...item,
      cuenta_Egreso: name,
      Cuenta_Egreso: name,
      total: 0,
      Total: 0,
    };
    const amount = Number(item?.total ?? item?.Total ?? 0);
    current.total = Number(current.total || 0) + amount;
    current.Total = current.total;
    grouped.set(key, current);
  });

  return Array.from(grouped.values());
}
