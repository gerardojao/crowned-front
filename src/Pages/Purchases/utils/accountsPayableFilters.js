export const emptyAccountsPayableFilters = {
  search: "",
  fechaInicio: "",
  fechaFin: "",
  fechaVencimientoInicio: "",
  fechaVencimientoFin: "",
};

export function buildAccountsPayableQueryParams(filters = {}) {
  const params = {};

  const search = String(filters.search || "").trim();
  if (search) params.search = search;

  const fechaInicio = String(filters.fechaInicio || "").trim();
  if (fechaInicio) params.fechaInicio = fechaInicio;

  const fechaFin = String(filters.fechaFin || "").trim();
  if (fechaFin) params.fechaFin = fechaFin;

  const fechaVencimientoInicio = String(
    filters.fechaVencimientoInicio || "",
  ).trim();
  if (fechaVencimientoInicio)
    params.fechaVencimientoInicio = fechaVencimientoInicio;

  const fechaVencimientoFin = String(filters.fechaVencimientoFin || "").trim();
  if (fechaVencimientoFin) params.fechaVencimientoFin = fechaVencimientoFin;

  return params;
}
