import assert from "node:assert/strict";
import test from "node:test";
import {
  calcDeliveryLine,
  calcInvoiceLine,
  sumInvoiceLines,
} from "./purchaseCalculations.js";

test("purchase preview calculates 4 percent VAT", () => {
  assert.deepEqual(calcInvoiceLine({ base: 100, ivaPct: 4 }), {
    base: 100,
    ivaPct: 4,
    iva: 4,
    total: 104,
  });
});

test("purchase preview keeps mixed VAT lines in the total", () => {
  assert.deepEqual(
    sumInvoiceLines([
      { base: 100, ivaPct: 0 },
      { base: 100, ivaPct: 4 },
      { base: 100, ivaPct: 10 },
      { base: 100, ivaPct: 21 },
    ]),
    { base: 400, iva: 35, total: 435 },
  );
});

test("delivery note line applies discount before taxable base", () => {
  assert.deepEqual(calcDeliveryLine({ cantidad: 5, precioCompra: 1000, descuentoPct: 10, ivaPct: 0 }), {
    base: 4500,
    ivaPct: 0,
    iva: 0,
    total: 4500,
    descuentoPct: 10,
    precioCompraNeto: 900,
  });
});
