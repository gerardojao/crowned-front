// utils/date.ts
export function soloFecha(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const t = value.indexOf('T');
    if (t > 0) return value.slice(0, t); // "YYYY-MM-DD" si viene ISO
  }
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // evita desfase por TZ
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function currentFiscalYearStart(date = new Date()) {
  return `${date.getFullYear()}-01-01`;
}
