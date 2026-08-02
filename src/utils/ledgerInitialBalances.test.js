import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSummaryFromItems,
  extractInitialBalanceInvoiceRef,
  filterDuplicateInitialBalanceRows,
} from "./ledgerInitialBalances.js";

test("extractInitialBalanceInvoiceRef reads SI invoice references", () => {
  assert.equal(
    extractInitialBalanceInvoiceRef({
      descripcion: "Cuentas por cobrar - Abono factura SI-2026000508 - Cliente",
    }),
    "SI-2026000508",
  );
  assert.equal(
    extractInitialBalanceInvoiceRef({ referencia: "si-2026000507" }),
    "SI-2026000507",
  );
});

test("filterDuplicateInitialBalanceRows removes generated income rows when mayor has the same SI ref", () => {
  const rows = [
    {
      source: "Ingreso",
      cuenta: "Cliente",
      tipoMovimiento: "Ingreso",
      referencia: "ING-7123",
      descripcion: "Cuentas por cobrar - Abono factura SI-2026000508 - Cliente",
      importe: 10,
    },
    {
      source: "Ingreso",
      cuenta: "IvaRepercutido",
      tipoMovimiento: "Ingreso",
      referencia: "ING-7123",
      descripcion: "Cuentas por cobrar - Abono factura SI-2026000508 - Cliente",
      importe: 2.1,
    },
    {
      source: "Mayor",
      cuenta: "Cliente",
      tipoMovimiento: "Ingreso",
      referencia: "SI-2026000508",
      descripcion: "Abono cuenta por cobrar SI-2026000508 - Cliente",
      importe: 10,
    },
  ];

  const filtered = filterDuplicateInitialBalanceRows(rows);

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].source, "Mayor");
  assert.equal(filtered[0].referencia, "SI-2026000508");
});

test("filterDuplicateInitialBalanceRows preserves normal income rows", () => {
  const rows = [
    {
      source: "Ingreso",
      cuenta: "Cliente",
      tipoMovimiento: "Ingreso",
      referencia: "ING-1",
      descripcion: "Servicio normal",
      importe: 10,
    },
  ];

  assert.equal(filterDuplicateInitialBalanceRows(rows).length, 1);
});

test("buildSummaryFromItems recalculates summary without IVA duplicate", () => {
  const summary = buildSummaryFromItems([
    {
      source: "Mayor",
      cuenta: "Cliente",
      tipoMovimiento: "Ingreso",
      importe: 10,
    },
    {
      source: "Mayor",
      cuenta: "Efectivo",
      tipoMovimiento: "Ingreso",
      importe: 10,
    },
  ]);

  assert.deepEqual(
    summary.map((item) => ({
      cuenta: item.cuenta,
      ingresos: item.ingresos,
      saldo: item.saldo,
    })),
    [
      { cuenta: "Cliente", ingresos: 10, saldo: 10 },
      { cuenta: "Efectivo", ingresos: 10, saldo: 10 },
    ],
  );
});
