import test from "node:test";
import assert from "node:assert/strict";
import {
  extractDeliveryNoteResponse,
  normalizeDeliveryNote,
} from "./deliveryNotes.js";

test("delivery note normalizer reads PascalCase detail with fiscal line totals", () => {
  const note = normalizeDeliveryNote({
    Id: 15,
    IdProveedor: 3,
    Proveedor: "Proveedor QA",
    NumeroAlbaran: "ALB-15",
    Fecha: "2026-07-11T00:00:00",
    Observaciones: "Entrada mostrador",
    Estado: "PendienteFactura",
    Base: 100,
    Iva: 21,
    Total: 121,
    Lineas: [
      {
        Id: 91,
        CodigoReferencia: "REF-1",
        Nombre: "Filtro",
        Marca: "Bosch",
        Cantidad: 2,
        PrecioCompra: 50,
        IvaPct: 21,
        Base: 100,
        Iva: 21,
        Total: 121,
      },
    ],
  });

  assert.equal(note.id, 15);
  assert.equal(note.proveedor, "Proveedor QA");
  assert.equal(note.lineas.length, 1);
  assert.equal(note.lineas[0].codigoReferencia, "REF-1");
  assert.equal(note.lineas[0].ivaPct, 21);
  assert.equal(note.lineas[0].total, 121);
});

test("delivery note response extractor reads legacy data array", () => {
  const item = { id: 4, numeroAlbaran: "A-4" };
  const extracted = extractDeliveryNoteResponse({
    data: {
      ok: 1,
      data: [item],
    },
  });

  assert.equal(extracted, item);
});
