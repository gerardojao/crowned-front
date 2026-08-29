import assert from "node:assert/strict";
import test from "node:test";
import { buildInvoicePaymentContract } from "./invoicePayment.js";

test("cash-only counted invoice keeps backend cash compatibility", () => {
  const contract = buildInvoicePaymentContract({
    selectedPaymentMethods: [{ key: "efectivo", amount: 50 }],
    selectedBankId: "7",
  });

  assert.equal(contract.hasBankPayment, false);
  assert.equal(contract.backendTipoPago, "Efectivo");
  assert.equal(contract.bankAccountId, null);
  assert.deepEqual(contract.pagos, [
    { metodoPago: "Efectivo", importe: 50, bankAccountId: null },
  ]);
});

test("counted invoice with bank payment sends bank-backed contado and detailed payments", () => {
  const contract = buildInvoicePaymentContract({
    selectedPaymentMethods: [
      { key: "transferencia", amount: 75, bankAccountId: "7" },
    ],
  });

  assert.equal(contract.hasBankPayment, true);
  assert.equal(contract.backendTipoPago, "Contado");
  assert.equal(contract.bankAccountId, 7);
  assert.deepEqual(contract.pagos, [
    { metodoPago: "Transferencia", importe: 75, bankAccountId: 7 },
  ]);
});

test("mixed counted invoice keeps cash out of bank and keeps each bank id", () => {
  const contract = buildInvoicePaymentContract({
    selectedPaymentMethods: [
      { key: "efectivo", amount: 40 },
      { key: "tdc", amount: 35, bankAccountId: "8" },
      { key: "transferencia", amount: 25, bankAccountId: "9" },
    ],
  });

  assert.equal(contract.backendTipoPago, "Contado");
  assert.equal(contract.bankAccountId, 8);
  assert.deepEqual(contract.pagos, [
    { metodoPago: "Efectivo", importe: 40, bankAccountId: null },
    { metodoPago: "TPV", importe: 35, bankAccountId: 8 },
    { metodoPago: "Transferencia", importe: 25, bankAccountId: 9 },
  ]);
});

test("credit invoice keeps CxC type and separates credit bank from initial payment bank", () => {
  const contract = buildInvoicePaymentContract({
    isCredit: true,
    selectedBankId: "9",
    selectedPaymentMethods: [{ key: "transferencia", amount: 20, bankAccountId: "7" }],
  });

  assert.equal(contract.backendTipoPago, "Credito");
  assert.equal(contract.bankAccountId, 9);
  assert.deepEqual(contract.pagos, [
    { metodoPago: "Transferencia", importe: 20, bankAccountId: 7 },
  ]);
});

test("credit invoice without initial payment can still send selected bank account", () => {
  const contract = buildInvoicePaymentContract({
    isCredit: true,
    selectedPaymentMethods: [],
    selectedBankId: "7",
  });

  assert.equal(contract.backendTipoPago, "Credito");
  assert.equal(contract.bankAccountId, 7);
  assert.deepEqual(contract.pagos, []);
});

test("zero-total invoice needs no payment movement", () => {
  const contract = buildInvoicePaymentContract({
    selectedPaymentMethods: [],
  });

  assert.equal(contract.backendTipoPago, "Efectivo");
  assert.equal(contract.bankAccountId, null);
  assert.deepEqual(contract.pagos, []);
});
