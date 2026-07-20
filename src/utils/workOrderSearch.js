export function parseOrderIdSearch(value) {
  const clean = String(value || "").trim().replace(/^#/, "");
  if (!/^\d+$/.test(clean)) return null;
  const id = Number(clean);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
