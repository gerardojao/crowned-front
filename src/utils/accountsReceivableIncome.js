import api from "../Components/api";
import { soloFecha } from "./date";
import {
  appendAccountsReceivableSummary,
  CXC_INCOME_DISPLAY_LABEL,
  CXC_INCOME_LABEL,
  CXC_INCOME_SOURCE,
} from "./financialStatementSummaries";

export {
  appendAccountsReceivableSummary,
  CXC_INCOME_DISPLAY_LABEL,
  CXC_INCOME_LABEL,
  CXC_INCOME_SOURCE,
};

const pickItems = (res) => {
  const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? [];
  return Array.isArray(pack) ? pack : [];
};

const read = (item, camel, pascal, fallback = null) =>
  item?.[camel] ?? item?.[pascal] ?? fallback;

const dateValue = (value) => {
  if (!value) return "";
  return soloFecha(value);
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
      const totalAbonado = Number(read(item, "totalAbonado", "TotalAbonado", 0));
      const numeroFactura = read(item, "numeroFactura", "NumeroFactura", "");
      const cliente = read(item, "cliente", "Cliente", "");

      return {
        id: `cxc-${read(item, "id", "Id", numeroFactura)}`,
        fecha: read(item, "fecha", "Fecha"),
        mes: "",
        tipo: CXC_INCOME_DISPLAY_LABEL,
        descripcion: `Abono factura ${numeroFactura}${cliente ? ` - ${cliente}` : ""}`,
        importe: totalAbonado,
        totalConIva: totalAbonado,
        totalAbonado,
        totalIncludesIva: true,
        isTotalAmount: true,
        source: CXC_INCOME_SOURCE,
      };
    })
    .filter((item) => item.totalAbonado > 0);

  const total = rows.reduce((sum, item) => sum + item.importe, 0);

  return {
    enabled: true,
    total,
    rows,
    summaryRow:
      total > 0
        ? {
            cuenta_Ingreso: CXC_INCOME_DISPLAY_LABEL,
            Cuenta_Ingreso: CXC_INCOME_DISPLAY_LABEL,
            total,
            Total: total,
            totalIncludesIva: true,
            isTotalAmount: true,
            source: CXC_INCOME_SOURCE,
          }
        : null,
  };
}

export const isAccountsReceivableIncome = (item) =>
  (item?.source ?? item?.Source) === CXC_INCOME_SOURCE ||
  Boolean(
    item?.totalIncludesIva ??
      item?.TotalIncludesIva ??
      item?.isTotalAmount ??
      item?.IsTotalAmount,
  );

export const incomeIvaAmount = (item, amount, ivaRate = 0.21) =>
  isAccountsReceivableIncome(item) ? 0 : Number(amount || 0) * ivaRate;

export const incomeTotalAmount = (item, amount, ivaRate = 0.21) =>
  Number(amount || 0) + incomeIvaAmount(item, amount, ivaRate);
