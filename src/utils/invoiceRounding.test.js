import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateNetLineAndUnit,
  roundInvoiceAmount,
} from "./invoiceRounding.js";

test("preserves 555.86 instead of creating 555.91 from unit rounding", () => {
  const sensitiveLine = calculateNetLineAndUnit({
    quantity: 10,
    price: 10.005,
    discountPct: 0,
  });

  const unaffectedLinesTotal = 455.81;
  const correctedInvoiceTotal = roundInvoiceAmount(
    sensitiveLine.unitNet * 10 + unaffectedLinesTotal,
  );
  const legacyInvoiceTotal = roundInvoiceAmount(
    roundInvoiceAmount(sensitiveLine.unitNet) * 10 + unaffectedLinesTotal,
  );

  assert.equal(sensitiveLine.netTotal, 100.05);
  assert.equal(correctedInvoiceTotal, 555.86);
  assert.equal(legacyInvoiceTotal, 555.91);
  assert.equal(roundInvoiceAmount(555.86 - correctedInvoiceTotal), 0);
});

test("quantity one keeps the existing cent result", () => {
  const line = calculateNetLineAndUnit({
    quantity: 1,
    price: 123.456,
    discountPct: 0,
  });

  assert.equal(line.netTotal, 123.46);
  assert.equal(line.unitNet, 123.46);
});
