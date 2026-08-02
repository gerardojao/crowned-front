import assert from "node:assert/strict";
import test from "node:test";
import {
  appendAccountsReceivableSummary,
  CXC_INCOME_DISPLAY_LABEL,
  CXC_INITIAL_BALANCE_DISPLAY_LABEL,
  CXC_INCOME_LABEL,
  appendAccountsPayableSummary,
  CXP_EXPENSE_LABEL,
  incomeDisplayLabel,
} from "./financialStatementSummaries.js";

test("appendAccountsReceivableSummary does not duplicate existing CxC row", () => {
  const rows = appendAccountsReceivableSummary(
    [{ cuenta_Ingreso: CXC_INCOME_LABEL, total: 100 }],
    { summaryRow: { cuenta_Ingreso: CXC_INCOME_LABEL, total: 100 } },
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].total, 100);
});

test("appendAccountsReceivableSummary appends CxC display row even when Ventas exists", () => {
  const rows = appendAccountsReceivableSummary(
    [{ cuenta_Ingreso: CXC_INCOME_DISPLAY_LABEL, total: 100 }],
    {
      summaryRow: {
        cuenta_Ingreso: CXC_INCOME_DISPLAY_LABEL,
        total: 25,
        source: "cxc",
      },
    },
  );

  assert.equal(rows.length, 2);
  assert.equal(rows[1].cuenta_Ingreso, CXC_INCOME_DISPLAY_LABEL);
  assert.equal(rows[1].source, "cxc");
});

test("incomeDisplayLabel shows CxC abonos as Ventas", () => {
  assert.equal(
    incomeDisplayLabel({
      tipo: CXC_INCOME_LABEL,
      descripcion: "Abono factura MT-2026-T2-0018 - Axel Arrieta",
    }),
    CXC_INCOME_DISPLAY_LABEL,
  );
});

test("incomeDisplayLabel shows initial CxC balances separately", () => {
  assert.equal(
    incomeDisplayLabel({
      tipo: CXC_INCOME_LABEL,
      descripcion: "Abono factura SI-2026000508 - ALQUIBER QUALITY, S.A.",
    }),
    CXC_INITIAL_BALANCE_DISPLAY_LABEL,
  );
});

test("incomeDisplayLabel keeps non-abono CxC label", () => {
  assert.equal(
    incomeDisplayLabel({
      tipo: CXC_INCOME_LABEL,
      descripcion: "Factura pendiente",
    }),
    CXC_INCOME_LABEL,
  );
});

test("appendAccountsPayableSummary appends CxP only when missing", () => {
  const rows = appendAccountsPayableSummary(
    [{ cuenta_Egreso: "Proveedor", total: 50 }],
    { summaryRow: { cuenta_Egreso: CXP_EXPENSE_LABEL, total: 25 } },
  );

  assert.equal(rows.length, 2);
  assert.equal(rows[1].cuenta_Egreso, CXP_EXPENSE_LABEL);
});

test("appendAccountsPayableSummary does not duplicate existing CxP row", () => {
  const rows = appendAccountsPayableSummary(
    [{ cuenta_Egreso: CXP_EXPENSE_LABEL, total: 25 }],
    { summaryRow: { cuenta_Egreso: CXP_EXPENSE_LABEL, total: 25 } },
  );

  assert.equal(rows.length, 1);
});
