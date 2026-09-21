import test from "node:test";
import assert from "node:assert/strict";
import { validateSupplierInvoiceTotal } from "./supplierInvoiceRules.js";

test("standalone supplier invoice accepts positive and negative totals", () => {
  assert.equal(validateSupplierInvoiceTotal("Factura", 121), null);
  assert.equal(validateSupplierInvoiceTotal("Factura", -121), null);
  assert.match(validateSupplierInvoiceTotal("Factura", 0), /no puede ser cero/i);
});

test("supplier credits must remain negative", () => {
  assert.equal(validateSupplierInvoiceTotal("Abono", -121), null);
  assert.equal(validateSupplierInvoiceTotal("Rappel", -121), null);
  assert.match(validateSupplierInvoiceTotal("Abono", 121), /debe ser negativo/i);
});

test("supplier tickets remain positive", () => {
  assert.equal(validateSupplierInvoiceTotal("Ticket", 121), null);
  assert.match(validateSupplierInvoiceTotal("Ticket", -121), /debe ser positivo/i);
});
