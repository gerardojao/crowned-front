import assert from "node:assert/strict";
import test from "node:test";
import { buildInvoicePaymentContract } from "./invoicePayment.js";

test("cash-only counted invoice keeps backend cash compatibility", () => {
  const contract = buildInvoicePaymentContract({
    selectedPaymentMethods: [{ key: "efectivo" }],
    selectedBankId: "7",
  });

  assert.equal(contract.hasBankPayment, false);
  assert.equal(contract.backendTipoPago, "Efectivo");
  assert.equal(contract.bankAccountId, null);
});

test("counted invoice with bank payment sends bank-backed contado", () => {
  const contract = buildInvoicePaymentContract({
    selectedPaymentMethods: [{ key: "transferencia" }],
    selectedBankId: "7",
  });

  assert.equal(contract.hasBankPayment, true);
  assert.equal(contract.backendTipoPago, "Contado");
  assert.equal(contract.bankAccountId, 7);
});

test("credit invoice keeps CxC type and does not assign bank as invoice bank", () => {
  const contract = buildInvoicePaymentContract({
    isCredit: true,
    selectedPaymentMethods: [{ key: "transferencia" }],
    selectedBankId: "7",
  });

  assert.equal(contract.backendTipoPago, "Credito");
  assert.equal(contract.bankAccountId, null);
});
