const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function isSupplierCreditDocument(documentType) {
  return documentType === "Abono" || documentType === "Rappel";
}

export function validateSupplierInvoiceTotal(documentType, total) {
  const roundedTotal = roundMoney(total);

  if (roundedTotal === 0) {
    return "El total del documento no puede ser cero.";
  }

  if (documentType === "Factura") return null;

  if (isSupplierCreditDocument(documentType)) {
    return roundedTotal < 0
      ? null
      : "El total debe ser negativo para rappels o abonos.";
  }

  return roundedTotal > 0
    ? null
    : "El total debe ser positivo para este tipo de documento.";
}
