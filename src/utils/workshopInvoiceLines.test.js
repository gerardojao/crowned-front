import assert from "node:assert/strict";
import test from "node:test";
import { buildInvoicePaymentContract } from "./invoicePayment.js";
import {
  buildInvoicePayloadItems,
  getInvoiceLineTotal,
  getInvoiceSubtotal,
  isInvoiceLineEligible,
  normalizeInvoiceLineForTotals,
  round2,
} from "./workshopInvoiceLines.js";

test("invoice lines with a description and zero price remain eligible", () => {
  assert.equal(
    isInvoiceLineEligible({ descripcion: "Trabajo en garantía", cantidad: 1, importe: 0 }),
    true,
  );
  assert.equal(isInvoiceLineEligible({ descripcion: "", cantidad: 1, importe: 0 }), false);
  assert.equal(
    isInvoiceLineEligible({ descripcion: "Importe inválido", cantidad: 1, importe: -1 }),
    false,
  );
});

test("keeps original line net total when rounded unit net would inflate it", () => {
  const line = normalizeInvoiceLineForTotals(
    {
      descripcion: "Ajuste fino",
      section: "Piezas",
      cantidad: 10,
      precioUnitario: 10.005,
      descuentoPct: 0,
    },
    21,
    true,
  );

  assert.equal(getInvoiceLineTotal(line), 100.05);
  assert.notEqual(round2(line.cantidad * line.importe), 100.05);
  assert.equal(backendSubtotal(buildInvoicePayloadItems([line])), 100.05);
});

test("keeps original line net total after repeated detailed normalization", () => {
  const line = normalizeInvoiceLineForTotals(
    {
      descripcion: "Ajuste fino",
      section: "Piezas",
      cantidad: 10,
      precioUnitario: 10.005,
      descuentoPct: 0,
    },
    21,
    true,
  );
  const normalizedAgain = normalizeInvoiceLineForTotals(line, 21, true);

  assert.equal(getInvoiceLineTotal(normalizedAgain), 100.05);
  assert.equal(backendSubtotal(buildInvoicePayloadItems([normalizedAgain])), 100.05);
});

test("quantity 1 keeps current line behavior", () => {
  const line = normalizeInvoiceLineForTotals(
    {
      descripcion: "Mano de obra",
      section: "ManoObra",
      cantidad: 1,
      tiempo: 1,
      precioUnitario: 75.55,
      descuentoPct: 0,
    },
    21,
    true,
  );

  assert.equal(line.importe, 75.55);
  assert.equal(getInvoiceLineTotal(line), 75.55);
  assert.equal(buildInvoicePayloadItems([line])[0].importe, 75.55);
});

test("multiple quantities and discounts sum exactly to invoice subtotal", () => {
  const lines = [
    normalizeInvoiceLineForTotals(
      {
        descripcion: "Pieza",
        section: "Piezas",
        cantidad: 10,
        precioUnitario: 10.005,
      },
      21,
      true,
    ),
    normalizeInvoiceLineForTotals(
      {
        descripcion: "Servicio",
        section: "ManoObra",
        tiempo: 3,
        precioUnitario: 44.444,
        descuentoPct: 10,
      },
      21,
      true,
    ),
    normalizeInvoiceLineForTotals(
      {
        descripcion: "Pintura",
        section: "Pintura",
        tiempo: 2,
        precioUnitario: 31.337,
        descuentoPct: 5,
      },
      21,
      true,
    ),
  ];
  const expected = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));

  assert.equal(getInvoiceSubtotal(lines), expected);
});

test("cash invoice exact payment has zero payment difference", () => {
  const lines = [
    normalizeInvoiceLineForTotals(
      {
        descripcion: "Base exacta",
        section: "ManoObra",
        tiempo: 1,
        precioUnitario: 359.34,
      },
      21,
      true,
    ),
    normalizeInvoiceLineForTotals(
      {
        descripcion: "Redondeo critico",
        section: "Piezas",
        cantidad: 10,
        precioUnitario: 10.005,
      },
      21,
      true,
    ),
  ];
  const subtotal = getInvoiceSubtotal(lines);
  const total = round2(subtotal * 1.21);
  const contract = buildInvoicePaymentContract({
    selectedPaymentMethods: [{ key: "efectivo", amount: total }],
  });
  const paymentTotal = round2(contract.pagos.reduce((sum, pago) => sum + pago.importe, 0));

  assert.equal(total, 555.86);
  assert.equal(round2(total - paymentTotal), 0);
  assert.equal(contract.backendTipoPago, "Efectivo");
});

test("credit, split payments and franchise calculations keep existing contracts", () => {
  const line = normalizeInvoiceLineForTotals(
    {
      descripcion: "Trabajo aseguradora",
      section: "ManoObra",
      tiempo: 5,
      precioUnitario: 91.237,
      descuentoPct: 3,
    },
    21,
    true,
  );
  const subtotal = getInvoiceSubtotal([line]);
  const total = round2(subtotal * 1.21);
  const franchise = 150;
  const companyPayable = round2(Math.max(0, total - franchise));
  const contract = buildInvoicePaymentContract({
    isCredit: true,
    selectedBankId: "9",
    selectedPaymentMethods: [
      { key: "efectivo", amount: 100 },
      { key: "transferencia", amount: 125.5, bankAccountId: "7" },
    ],
  });
  const paymentTotal = round2(contract.pagos.reduce((sum, pago) => sum + pago.importe, 0));

  assert.equal(contract.backendTipoPago, "Credito");
  assert.equal(contract.bankAccountId, 9);
  assert.deepEqual(contract.pagos, [
    { metodoPago: "Efectivo", importe: 100, bankAccountId: null },
    { metodoPago: "Transferencia", importe: 125.5, bankAccountId: 7 },
  ]);
  assert.equal(round2(companyPayable - paymentTotal) >= 0, true);
});

test("payload matches backend two-decimal unit normalization for real invoice lines", () => {
  const lines = [
    normalizeInvoiceLineForTotals(
      {
        descripcion: "Servicio reparacion mayor",
        section: "ManoObra",
        tiempo: 1,
        precioUnitario: 46,
        descuentoPct: 10,
      },
      21,
      true,
    ),
    normalizeInvoiceLineForTotals(
      {
        descripcion: "Diagnosis",
        section: "ManoObra",
        tiempo: 1,
        precioUnitario: 40,
      },
      21,
      true,
    ),
    normalizeInvoiceLineForTotals(
      {
        descripcion: "NGK91039 - BUJIA - 9063KSK",
        section: "Piezas",
        cantidad: 4,
        precioUnitario: 40.56,
        descuentoPct: 10,
      },
      21,
      true,
    ),
    normalizeInvoiceLineForTotals(
      {
        descripcion: "NGK48404 - BOBINA DE ENCENDIDO - 9063KSK",
        section: "Piezas",
        cantidad: 1,
        precioUnitario: 257.77,
        descuentoPct: 10,
      },
      21,
      true,
    ),
  ];
  const subtotal = getInvoiceSubtotal(lines);
  const total = round2(subtotal * 1.21);
  const payloadItems = buildInvoicePayloadItems(lines);

  assert.equal(subtotal, 459.41);
  assert.equal(total, 555.89);
  assert.equal(backendSubtotal(payloadItems), subtotal);
});

function backendSubtotal(items) {
  return round2(
    items.reduce(
      (sum, item) => sum + round2(Number(item.cantidad || 0) * round2(item.importe)),
      0,
    ),
  );
}
