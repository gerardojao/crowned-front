import test from "node:test";
import assert from "node:assert/strict";
import { signedLedgerAmount } from "./ledgerAmounts.js";

test("signedLedgerAmount shows egresos as negative values", () => {
  assert.equal(signedLedgerAmount(125.5, "Egreso"), -125.5);
});

test("signedLedgerAmount preserves ingresos as received", () => {
  assert.equal(signedLedgerAmount(125.5, "Ingreso"), 125.5);
});

test("signedLedgerAmount avoids double negatives for egresos", () => {
  assert.equal(signedLedgerAmount(-125.5, "Egreso"), -125.5);
});
