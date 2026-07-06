import assert from "node:assert/strict";
import test from "node:test";
import {
  canInvoiceWorkOrder,
  getAllowedWorkOrderStates,
  normalizeWorkOrderState,
  requiresCompletionConfirmation,
} from "./workOrderWorkflow.js";

test("work order state options only include the current and valid next states", () => {
  assert.deepEqual(getAllowedWorkOrderStates("Recibido", false), [
    "Recibido",
    "Diagnóstico",
    "Reparando",
  ]);
  assert.deepEqual(getAllowedWorkOrderStates("Reparando", false), [
    "Reparando",
    "Esperando repuesto",
    "Terminado",
  ]);
});

test("delivered state is only available after invoicing", () => {
  assert.deepEqual(getAllowedWorkOrderStates("Terminado", false), [
    "Terminado",
  ]);
  assert.deepEqual(getAllowedWorkOrderStates("Terminado", true), [
    "Terminado",
    "Entregado",
  ]);
});

test("only finished work orders can be invoiced", () => {
  assert.equal(canInvoiceWorkOrder("Terminado"), true);
  assert.equal(canInvoiceWorkOrder("Listo"), true);
  assert.equal(canInvoiceWorkOrder("Recibido"), false);
  assert.equal(canInvoiceWorkOrder("Entregado"), false);
  assert.equal(normalizeWorkOrderState("Diagnostico"), "Diagnóstico");
});
 
test("finishing an order requires confirmation only when entering the final state", () => {
  assert.equal(
    requiresCompletionConfirmation("Reparando", "Terminado"),
    true,
  );
  assert.equal(
    requiresCompletionConfirmation("Esperando repuesto", "Terminado"),
    true,
  );
  assert.equal(
    requiresCompletionConfirmation("Terminado", "Terminado"),
    false,
  );
  assert.equal(
    requiresCompletionConfirmation("Reparando", "Esperando repuesto"),
    false,
  );
});
