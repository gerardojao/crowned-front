export function getMiscExpenseItems(response) {
  const data = response?.data?.data ?? response?.data?.Data;
  if (Array.isArray(data?.[0])) return data[0];
  if (Array.isArray(data)) return data;
  return [];
}

export function validateMiscExpenseForm(form) {
  const errors = {};
  if (!String(form.numeroComprobante || "").trim()) {
    errors.numeroComprobante = "El numero de comprobante es requerido.";
  }
  if (!String(form.proveedorNombre || "").trim()) {
    errors.proveedorNombre = "El nombre del proveedor es requerido.";
  }
  if (!form.tipoGastoId) {
    errors.tipoGastoId = "Selecciona el tipo de gasto.";
  }
  if (Number(form.importe) <= 0 || Number.isNaN(Number(form.importe))) {
    errors.importe = "El importe debe ser mayor que 0.";
  }
  if (!form.bankAccountId) {
    errors.bankAccountId = "Selecciona el banco del gasto.";
  }
  return errors;
}

export function buildMiscExpensePayload(form) {
  return {
    numeroComprobante: String(form.numeroComprobante || "").trim(),
    fecha: form.fecha,
    proveedorNombre: String(form.proveedorNombre || "").trim(),
    descripcion: String(form.descripcion || "").trim() || null,
    tipoGastoId: Number(form.tipoGastoId),
    importe: Number(form.importe),
    bankAccountId: Number(form.bankAccountId),
  };
}
