import assert from "node:assert/strict";
import test from "node:test";
import {
  appendAccountsReceivableSummary,
  CXC_INCOME_LABEL,
  appendAccountsPayableSummary,
  CXP_EXPENSE_LABEL,
} from "./financialStatementSummaries.js";

test("appendAccountsReceivableSummary does not duplicate existing CxC row", () => {
  const rows = appendAccountsReceivableSummary(
    [{ cuenta_Ingreso: CXC_INCOME_LABEL, total: 100 }],
    { summaryRow: { cuenta_Ingreso: CXC_INCOME_LABEL, total: 100 } },
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].total, 100);
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
