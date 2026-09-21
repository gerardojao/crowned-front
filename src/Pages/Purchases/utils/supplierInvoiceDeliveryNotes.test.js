import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGroupedDeliveryNoteDescription,
  normalizeLinkedDeliveryNotes,
} from "./supplierInvoiceDeliveryNotes.js";

test("grouped delivery-note description stays bounded", () => {
  const notes = Array.from({ length: 250 }, (_, index) => ({ id: index + 1 }));

  assert.equal(
    buildGroupedDeliveryNoteDescription(notes),
    "Factura agrupada de 250 albaranes",
  );
  assert.ok(buildGroupedDeliveryNoteDescription(notes).length < 500);
});

test("every linked delivery note returned by the API is normalized", () => {
  assert.deepEqual(
    normalizeLinkedDeliveryNotes({
      albaranes: [
        { id: 1, numeroAlbaran: "ALB-001", total: 12.5 },
        { Id: 2, NumeroAlbaran: "ALB-002", Total: 30 },
      ],
    }),
    [
      { id: 1, numeroAlbaran: "ALB-001", fecha: null, total: 12.5 },
      { id: 2, numeroAlbaran: "ALB-002", fecha: null, total: 30 },
    ],
  );
});
