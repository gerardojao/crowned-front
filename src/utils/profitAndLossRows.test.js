import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateExpenseRows,
  aggregateIncomeRows,
} from "./profitAndLossRows.js";

test("aggregateIncomeRows groups service income categories as Servicios", () => {
  const rows = aggregateIncomeRows([
    { cuenta_Ingreso: "Servicio", total: 10 },
    { cuenta_Ingreso: "Servicio cambio de aceite y filtro", total: 20 },
    { cuenta_Ingreso: "Mano de obra", total: 30 },
    { cuenta_Ingreso: "Ventas", total: 40 },
  ]);

  assert.equal(rows.length, 2);
  assert.equal(rows.find((row) => row.cuenta_Ingreso === "Servicios").total, 60);
  assert.equal(rows.find((row) => row.cuenta_Ingreso === "Ventas").total, 40);
});

test("aggregateExpenseRows merges repeated expense categories", () => {
  const rows = aggregateExpenseRows([
    { cuenta_Egreso: "Cuentas por pagar", tipoGasto: "variable", total: 10 },
    { cuenta_Egreso: "Cuentas por pagar", tipoGasto: "variable", total: 15 },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].total, 25);
});
