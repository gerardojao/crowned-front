// src/utils/format.js
export const currency = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(n || 0));

export const amountInput = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
};

export const parseSpanishMoney = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const clean = String(value ?? "")
    .trim()
    .replace(/[\s€]/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!clean) return 0;

  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");
  let normalized = clean;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalized = normalized
      .split(thousandsSeparator)
      .join("")
      .replace(decimalSeparator, ".");
  } else if (lastComma >= 0) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (lastDot >= 0) {
    const dotParts = normalized.split(".");
    const looksLikeThousands =
      dotParts.length > 2 ||
      (dotParts.length === 2 && dotParts[1].length === 3 && dotParts[0].length <= 3);
    normalized = looksLikeThousands ? dotParts.join("") : normalized.replace(/,/g, "");
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};

export const formatSpanishMoney = (value) => {
  const [integerPart, decimalPart] = parseSpanishMoney(value).toFixed(2).split(".");
  const sign = integerPart.startsWith("-") ? "-" : "";
  const digits = integerPart.replace("-", "");
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${grouped},${decimalPart}`;
};
