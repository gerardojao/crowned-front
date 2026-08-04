import test from "node:test";
import assert from "node:assert/strict";
import { getAccountsPayableDisplay } from "./accountsPayableDisplay.js";

test("normal invoice keeps the pending balance sign unchanged", () => {
  const display = getAccountsPayableDisplay({
    total: 250,
    importePagado: 50,
    saldoPendiente: 200,
    estado: "Pendiente de pago",
  });

  assert.equal(display.isSupplierCredit, false);
  assert.equal(display.saldoPendiente, 200);
  assert.equal(display.saldoVisual, 200);
  assert.equal(display.estadoVisual, "Pendiente de pago");
  assert.equal(display.canRegisterPayment, true);
});

test("negative supplier invoice is shown as pending supplier credit", () => {
  const display = getAccountsPayableDisplay({
    total: -1277.45,
    importePagado: 0,
    saldoPendiente: 1277.45,
    estado: "Pendiente de pago",
  });

  assert.equal(display.isSupplierCredit, true);
  assert.equal(display.saldoPendiente, -1277.45);
  assert.equal(display.saldoVisual, 1277.45);
  assert.equal(display.saldoLabel, "Saldo a favor");
  assert.equal(display.estadoVisual, "Abono pendiente");
  assert.equal(display.canRegisterPayment, false);
});

test("spanish money strings are detected as supplier credits", () => {
  const display = getAccountsPayableDisplay({
    total: "-1.277,45 €",
    importePagado: "0,00 €",
    saldoPendiente: "1.277,45 €",
    estado: "Pendiente de pago",
  });

  assert.equal(display.isSupplierCredit, true);
  assert.equal(display.saldoPendiente, -1277.45);
  assert.equal(display.saldoVisual, 1277.45);
});

test("supplier credit can be detected by document type", () => {
  const display = getAccountsPayableDisplay({
    tipoDocumento: "Abono",
    total: 1277.45,
    saldoPendiente: 1277.45,
  });

  assert.equal(display.isSupplierCredit, true);
  assert.equal(display.estadoVisual, "Abono pendiente");
  assert.equal(display.canRegisterPayment, false);
});
