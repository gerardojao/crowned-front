export const roundInvoiceAmount = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function calculateNetLineAndUnit({
  quantity,
  price,
  discountPct = 0,
}) {
  const normalizedQuantity = Number(quantity || 0);
  const normalizedPrice = Number(price || 0);
  const normalizedDiscount = Math.min(
    100,
    Math.max(0, Number(discountPct || 0)),
  );

  const netTotal = roundInvoiceAmount(
    normalizedQuantity *
      normalizedPrice *
      (1 - normalizedDiscount / 100),
  );

  return {
    netTotal,
    // Preserve enough precision so multiplying by quantity reconstructs
    // the already-rounded line total instead of creating phantom cents.
    unitNet: normalizedQuantity > 0 ? netTotal / normalizedQuantity : 0,
  };
}
