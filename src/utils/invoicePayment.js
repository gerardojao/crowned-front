export function buildInvoicePaymentContract({
  isCredit = false,
  selectedPaymentMethods = [],
  selectedBankId = "",
} = {}) {
  const hasBankPayment = selectedPaymentMethods.some(
    (method) => method?.key !== "efectivo",
  );

  return {
    hasBankPayment,
    backendTipoPago: isCredit
      ? "Credito"
      : hasBankPayment
        ? "Contado"
        : "Efectivo",
    bankAccountId:
      !isCredit && hasBankPayment && selectedBankId
        ? Number(selectedBankId)
        : null,
  };
}
