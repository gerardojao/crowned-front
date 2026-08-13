export const normalizeWorkOrderSearchText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const compactWorkOrderSearchText = (value) =>
  normalizeWorkOrderSearchText(value).replace(/[^a-z0-9]/g, "");

export const includesWorkOrderSearchText = (value, term) => {
  const cleanValue = normalizeWorkOrderSearchText(value);
  const cleanTerm = normalizeWorkOrderSearchText(term);
  if (!cleanTerm) return true;
  if (cleanValue.includes(cleanTerm)) return true;
  return compactWorkOrderSearchText(value).includes(
    compactWorkOrderSearchText(term),
  );
};

export const matchesWorkOrderPlateSearch = (order, term) =>
  includesWorkOrderSearchText(order?.Matricula ?? order?.matricula ?? "", term);

export const parseExplicitOrderIdSearch = (value) => {
  const clean = String(value || "").trim();
  return clean.startsWith("#") ? parseOrderIdSearch(clean) : null;
};

export function parseOrderIdSearch(value) {
  const clean = String(value || "").trim().replace(/^#/, "");
  if (!/^\d+$/.test(clean)) return null;
  const id = Number(clean);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
