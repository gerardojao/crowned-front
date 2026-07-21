export function signedLedgerAmount(value, type) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 0;
  return type === "Egreso" ? -Math.abs(amount) : amount;
}
