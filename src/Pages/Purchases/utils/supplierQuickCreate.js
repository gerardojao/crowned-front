export const emptyQuickProviderForm = {
  nombre: "",
  telefono: "",
  nifCif: "",
  categoria: "",
  email: "",
};

const trimOrNull = (value) => {
  const text = String(value || "").trim();
  return text || null;
};

export function validateQuickProviderForm(form) {
  const errors = {};

  if (!String(form?.nombre || "").trim()) {
    errors.nombre = "El nombre es requerido.";
  }

  if (!String(form?.nifCif || "").trim()) {
    errors.nifCif = "El NIF/CIF es requerido.";
  }

  return errors;
}

export function buildQuickProviderPayload(form) {
  return {
    nombre: String(form?.nombre || "").trim(),
    telefono: trimOrNull(form?.telefono),
    email: trimOrNull(form?.email),
    nifCif: trimOrNull(form?.nifCif),
    categoria: trimOrNull(form?.categoria),
    clasificacion: "Empresa",
    observaciones: "Proveedor creado desde alta rapida de facturas proveedor.",
  };
}

export function getCreatedProviderId(responseData) {
  return (
    responseData?.data?.[0]?.id ??
    responseData?.data?.[0]?.Id ??
    responseData?.Data?.[0]?.id ??
    responseData?.Data?.[0]?.Id ??
    null
  );
}
