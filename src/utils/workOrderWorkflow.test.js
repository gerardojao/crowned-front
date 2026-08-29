import assert from "node:assert/strict";
import test from "node:test";
import {
  canInvoiceWorkOrder,
  getAllowedWorkOrderStates,
  isWorkOrderEditLocked,
  normalizeWorkOrderState,
  requiresCompletionConfirmation,
  VISIBLE_WORK_ORDER_STATES,
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
    "Repuesto Recibido",
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

test("hidden legacy states are not offered as selectable options", () => {
  assert.equal(VISIBLE_WORK_ORDER_STATES.includes("Repuesto devuelto"), false);
  assert.deepEqual(getAllowedWorkOrderStates("Repuesto Recibido", false), [
    "Repuesto Recibido",
    "Reparando",
    "Terminado",
  ]);
  assert.deepEqual(getAllowedWorkOrderStates("Repuesto devuelto", false), [
    "Repuesto devuelto",
    "Repuesto Recibido",
  ]);
});

test("work orders are editable until they are invoiced", () => {
  assert.equal(isWorkOrderEditLocked(false), false);
  assert.equal(isWorkOrderEditLocked(undefined), false);
  assert.equal(isWorkOrderEditLocked(true), true);
});
