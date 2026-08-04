function toMoneyNumber(value) {
  if (typeof value === "string") {
    const normalized = value
      .replace(/\s/g, "")
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(?:\D|$))/g, "")
      .replace(",", ".");

    return Number(normalized) || 0;
  }

  return Number(value ?? 0) || 0;
}

function getFirstValue(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

export function isSupplierCreditInvoice(invoice) {
  return toMoneyNumber(getFirstValue(invoice?.total, invoice?.Total)) < 0;
}

export function getAccountsPayableDisplay(invoice) {
  const total = toMoneyNumber(getFirstValue(invoice?.total, invoice?.Total));
  const importePagado = toMoneyNumber(
    getFirstValue(invoice?.importePagado, invoice?.ImportePagado),
  );
  const providedSaldo = getFirstValue(
    invoice?.saldoPendiente,
    invoice?.SaldoPendiente,
  );
  const tipoDocumento = String(
    getFirstValue(invoice?.tipoDocumento, invoice?.TipoDocumento) ?? "",
  )
    .trim()
    .toLowerCase();
  const isSupplierCredit = total < 0 || tipoDocumento.includes("abono");
  const normalSaldo = toMoneyNumber(providedSaldo ?? total - importePagado);
  let saldoAFavor = 0;

  if (isSupplierCredit) {
    const creditSaldoBase =
      providedSaldo !== undefined && providedSaldo !== null
        ? toMoneyNumber(providedSaldo)
        : Math.max(0, Math.abs(total) - importePagado);
    saldoAFavor = Math.abs(creditSaldoBase);
  }

  return {
    isSupplierCredit,
    canRegisterPayment: !isSupplierCredit,
    estadoVisual: isSupplierCredit
      ? "Abono pendiente"
      : invoice?.estado ?? invoice?.Estado ?? "Pendiente de pago",
    saldoPendiente: isSupplierCredit ? -saldoAFavor : normalSaldo,
    saldoVisual: isSupplierCredit ? saldoAFavor : normalSaldo,
    saldoLabel: isSupplierCredit ? "Saldo a favor" : "Saldo pendiente",
    saldoAFavor,
  };
}
