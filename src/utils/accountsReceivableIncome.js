import api from "../Components/api";

export const CXC_INCOME_LABEL = "Cuentas por cobrar";
const IVA_RATE = 0.21;

const pickItems = (res) => {
  const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? [];
  return Array.isArray(pack) ? pack : [];
};

const read = (item, camel, pascal, fallback = null) =>
  item?.[camel] ?? item?.[pascal] ?? fallback;

const dateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const inRange = (item, from, to) => {
  if (!from && !to) return true;
  const fecha = dateValue(read(item, "fecha", "Fecha"));
  if (!fecha) return false;
  if (from && fecha < from) return false;
  if (to && fecha > to) return false;
  return true;
};

export async function fetchAccountsReceivableIncome({ from = "", to = "" } = {}) {
  const settingsRes = await api.get("/WorkshopSettings");
  const settings = settingsRes?.data || {};
  const enabled =
    settings.enableAccountsReceivable ??
    settings.EnableAccountsReceivable ??
    false;

  if (!enabled) {
    return { enabled: false, total: 0, rows: [], summaryRow: null };
  }

  const res = await api.get("/FacturaEmitida/cxc");
  const rows = pickItems(res)
    .filter((item) => inRange(item, from, to))
    .map((item) => {
      const totalFactura = Number(read(item, "totalFactura", "TotalFactura", 0));
      const baseFactura = totalFactura / (1 + IVA_RATE);
      const numeroFactura = read(item, "numeroFactura", "NumeroFactura", "");
      const cliente = read(item, "cliente", "Cliente", "");

      return {
        id: `cxc-${read(item, "id", "Id", numeroFactura)}`,
        fecha: read(item, "fecha", "Fecha"),
        mes: "",
        tipo: CXC_INCOME_LABEL,
        descripcion: `Factura ${numeroFactura}${cliente ? ` - ${cliente}` : ""}`,
        importe: baseFactura,
        totalConIva: totalFactura,
        source: "cxc",
      };
    })
    .filter((item) => item.totalConIva > 0);

  const total = rows.reduce((sum, item) => sum + item.importe, 0);

  return {
    enabled: true,
    total,
    rows,
    summaryRow:
      total > 0
        ? {
            cuenta_Ingreso: CXC_INCOME_LABEL,
            Cuenta_Ingreso: CXC_INCOME_LABEL,
            total,
            Total: total,
            source: "cxc",
          }
        : null,
  };
}

export const appendAccountsReceivableSummary = (rows, cxc) => {
  const list = Array.isArray(rows) ? [...rows] : [];
  return cxc?.summaryRow ? [...list, cxc.summaryRow] : list;
};
