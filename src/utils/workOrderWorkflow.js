export const WORK_ORDER_STATES = [
  "Recibido",
  "Diagnóstico",
  "Reparando",
  "Esperando repuesto",
  "Repuesto Recibido",
  "Repuesto devuelto",
  "Terminado",
  "Entregado",
];

const HIDDEN_WORK_ORDER_STATES = ["Repuesto devuelto"];

export const VISIBLE_WORK_ORDER_STATES = WORK_ORDER_STATES.filter(
  (state) => !HIDDEN_WORK_ORDER_STATES.includes(state),
);

const transitions = {
  Recibido: ["Diagnóstico", "Reparando"],
  Diagnóstico: ["Reparando", "Esperando repuesto"],
  Reparando: ["Esperando repuesto","Repuesto Recibido", "Terminado"],
  "Esperando repuesto": ["Repuesto Recibido","Reparando"],
  "Repuesto Recibido": ["Repuesto devuelto", "Reparando", "Terminado"],
  "Repuesto devuelto": ["Repuesto Recibido"],
  Terminado: ["Entregado"],
  Entregado: [],
};

export function normalizeWorkOrderState(state) {
  const clean = String(state || "")
    .trim()
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  if (clean === "listo") return "Terminado";
  return (
    WORK_ORDER_STATES.find(
      (candidate) =>
        candidate
          .toLocaleLowerCase("es-ES")
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "") === clean,
    ) || state
  );
}

export function getAllowedWorkOrderStates(currentState, isInvoiced) {
  const normalizedState = normalizeWorkOrderState(currentState);
  const nextStates = transitions[normalizedState] || [];
  const filteredNextStates = nextStates.filter(
    (state) =>
      !HIDDEN_WORK_ORDER_STATES.includes(state) &&
      (state !== "Entregado" || Boolean(isInvoiced)),
  );
  return [normalizedState, ...filteredNextStates].filter(
    (state, index, values) => state && values.indexOf(state) === index,
  );
}

export function canInvoiceWorkOrder(state) {
  return normalizeWorkOrderState(state) === "Terminado";
}

export function requiresCompletionConfirmation(currentState, nextState) {
  return (
    normalizeWorkOrderState(currentState) !== "Terminado" &&
    normalizeWorkOrderState(nextState) === "Terminado"
  );
}

export function isWorkOrderEditLocked(state) {
  return [
    "Esperando repuesto",
    "Terminado",
    "Entregado",
  ].includes(normalizeWorkOrderState(state));
}
