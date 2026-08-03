const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const PAYMENT_METHOD_LABELS = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tdc: "TPV",
  tpv: "TPV",
  bizum: "Bizum",
};

const isCashPayment = (method) => method?.key === "efectivo";

const normalizeBankId = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export function buildInvoicePaymentContract({
  isCredit = false,
  selectedPaymentMethods = [],
  selectedBankId = "",
} = {}) {
  const payableMethods = selectedPaymentMethods.filter(
    (method) => method?.checked !== false && round2(method?.amount || 0) > 0,
  );

  const pagos = payableMethods.map((method) => {
    const bankAccountId = isCashPayment(method)
      ? null
      : normalizeBankId(method.bankAccountId || selectedBankId);

    return {
      metodoPago: PAYMENT_METHOD_LABELS[method.key] || method.label || "Efectivo",
      importe: round2(method.amount || 0),
      bankAccountId,
    };
  });

  const firstBankPayment = pagos.find((pago) => pago.bankAccountId);
  const hasBankPayment = selectedPaymentMethods.some(
    (method) => method?.key && !isCashPayment(method),
  );

  return {
    hasBankPayment,
    backendTipoPago: isCredit
      ? "Credito"
      : hasBankPayment
        ? "Contado"
        : "Efectivo",
    bankAccountId: isCredit
      ? normalizeBankId(selectedBankId)
      : firstBankPayment?.bankAccountId ?? null,
    pagos,
  };
}
