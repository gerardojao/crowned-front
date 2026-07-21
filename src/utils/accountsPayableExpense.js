import api from "../Components/api";
import { soloFecha } from "./date";
import {
  appendAccountsPayableSummary,
  CXP_EXPENSE_LABEL,
  CXP_EXPENSE_SOURCE,
} from "./financialStatementSummaries";

export {
  appendAccountsPayableSummary,
  CXP_EXPENSE_LABEL,
  CXP_EXPENSE_SOURCE,
};

const pickItems = (res) => {
  const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? res?.data?.items ?? [];
  return Array.isArray(pack) ? pack : [];
};

const read = (item, camel, pascal, fallback = null) =>
  item?.[camel] ?? item?.[pascal] ?? fallback;

const inRange = (item, from, to) => {
  if (!from && !to) return true;
  const fecha = soloFecha(read(item, "fecha", "Fecha"));
  if (!fecha) return false;
  if (from && fecha < from) return false;
  if (to && fecha > to) return false;
  return true;
};

export async function fetchAccountsPayableExpense({ from = "", to = "" } = {}) {
  const settingsRes = await api.get("/WorkshopSettings");
  const settings = settingsRes?.data || {};
  const enabled =
    settings.enableAccountsPayable ?? settings.EnableAccountsPayable ?? false;

  if (!enabled) {
    return { enabled: false, total: 0, rows: [], summaryRow: null };
  }

  const res = await api.get("/FacturaRecibida/pendientes", {
    params: {
      fechaInicio: from || null,
      fechaFin: to || null,
    },
  });
  const rows = pickItems(res)
    .filter((item) => inRange(item, from, to))
    .map((item) => {
      const saldoPendiente = Number(
        read(
          item,
          "saldoPendiente",
          "SaldoPendiente",
          Math.abs(Number(read(item, "total", "Total", 0))) -
            Number(read(item, "importePagado", "ImportePagado", 0)),
        ),
      );

      return {
        id: `cxp-${read(item, "id", "Id", "")}`,
        fecha: read(item, "fecha", "Fecha"),
        cuenta_Egreso: CXP_EXPENSE_LABEL,
        Cuenta_Egreso: CXP_EXPENSE_LABEL,
        tipoGasto: "variable",
        TipoGasto: "variable",
        total: saldoPendiente,
        Total: saldoPendiente,
        source: CXP_EXPENSE_SOURCE,
      };
    })
    .filter((item) => item.total > 0);

  const total = rows.reduce((sum, item) => sum + item.total, 0);

  return {
    enabled: true,
    total,
    rows,
    summaryRow:
      total > 0
        ? {
            cuenta_Egreso: CXP_EXPENSE_LABEL,
            Cuenta_Egreso: CXP_EXPENSE_LABEL,
            tipoGasto: "variable",
            TipoGasto: "variable",
            total,
            Total: total,
            source: CXP_EXPENSE_SOURCE,
          }
        : null,
  };
}
