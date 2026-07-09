import assert from "node:assert/strict";
import test from "node:test";
import {
  buildQuickProviderPayload,
  getCreatedProviderId,
  validateQuickProviderForm,
} from "./supplierQuickCreate.js";

test("quick provider validates required minimum fields", () => {
  assert.deepEqual(validateQuickProviderForm({ nombre: " ", telefono: "" }), {
    nombre: "El nombre es requerido.",
    telefono: "El telefono es requerido.",
  });
});

test("quick provider builds Proveedor payload with trimmed optional fields", () => {
  assert.deepEqual(
    buildQuickProviderPayload({
      nombre: "  Recambios Norte  ",
      telefono: "  911222333 ",
      email: "",
      nifCif: " B12345678 ",
      categoria: " Repuestos ",
    }),
    {
      nombre: "Recambios Norte",
      telefono: "911222333",
      email: null,
      nifCif: "B12345678",
      categoria: "Repuestos",
      clasificacion: "Empresa",
      observaciones: "Proveedor creado desde alta rapida de facturas proveedor.",
    },
  );
});

test("quick provider reads created id from camelCase or PascalCase responses", () => {
  assert.equal(getCreatedProviderId({ data: [{ id: 17 }] }), 17);
  assert.equal(getCreatedProviderId({ Data: [{ Id: 21 }] }), 21);
});
