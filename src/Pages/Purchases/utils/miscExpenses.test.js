import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMiscExpensePayload,
  getMiscExpenseItems,
  validateMiscExpenseForm,
} from "./miscExpenses.js";

test("misc expense validates required cash expense fields", () => {
  assert.deepEqual(
    validateMiscExpenseForm({
      numeroComprobante: " ",
      proveedorNombre: "",
      tipoGastoId: "",
      importe: "0",
      bankAccountId: "",
    }),
    {
      numeroComprobante: "El numero de comprobante es requerido.",
      proveedorNombre: "El nombre del proveedor es requerido.",
      tipoGastoId: "Selecciona el tipo de gasto.",
      importe: "El importe debe ser mayor que 0.",
      bankAccountId: "Selecciona el banco del gasto.",
    },
  );
});

test("misc expense builds trimmed payload with numeric ids and amount", () => {
  assert.deepEqual(
    buildMiscExpensePayload({
      numeroComprobante: "  TCK-42 ",
      fecha: "2026-07-10",
      proveedorNombre: "  Proveedor local ",
      descripcion: "  Taxi a ITV ",
      tipoGastoId: "7",
      importe: "24.50",
      bankAccountId: "3",
    }),
    {
      numeroComprobante: "TCK-42",
      fecha: "2026-07-10",
      proveedorNombre: "Proveedor local",
      descripcion: "Taxi a ITV",
      tipoGastoId: 7,
      importe: 24.5,
      bankAccountId: 3,
    },
  );
});

test("misc expense reads nested legacy response items", () => {
  const items = [{ id: 1, proveedorNombre: "Proveedor" }];
  assert.equal(getMiscExpenseItems({ data: { data: [items] } }), items);
  assert.equal(getMiscExpenseItems({ data: { Data: [items] } }), items);
});
