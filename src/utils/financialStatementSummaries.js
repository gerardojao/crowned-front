export const CXC_INCOME_LABEL = "Cuentas por cobrar";
export const CXC_INCOME_DISPLAY_LABEL = "Ventas";
export const CXC_INCOME_SOURCE = "cxc";
export const CXP_EXPENSE_LABEL = "Cuentas por pagar";
export const CXP_EXPENSE_SOURCE = "cxp";

const sameLabel = (left, right) =>
  String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();

const startsWithAny = (value, prefixes) => {
  const text = String(value || "").trim().toLowerCase();
  return prefixes.some((prefix) => text.startsWith(prefix));
};

export const isAccountsReceivableAbonoIncome = (item) => {
  const label = item?.tipo ?? item?.Tipo ?? item?.cuenta_Ingreso ?? item?.Cuenta_Ingreso ?? item?.nombre;
  const description = item?.descripcion ?? item?.Descripcion;

  return (
    sameLabel(label, CXC_INCOME_LABEL) &&
    startsWithAny(description, ["abono factura ", "abono inicial factura "])
  );
};

export const incomeDisplayLabel = (item) =>
  isAccountsReceivableAbonoIncome(item)
    ? CXC_INCOME_DISPLAY_LABEL
    : item?.tipo ?? item?.Tipo ?? item?.cuenta_Ingreso ?? item?.Cuenta_Ingreso ?? item?.nombre;

export const appendAccountsReceivableSummary = (rows, cxc) => {
  const list = Array.isArray(rows) ? [...rows] : [];
  const hasExisting = list.some((item) => {
    const label = item?.cuenta_Ingreso ?? item?.Cuenta_Ingreso ?? item?.nombre;
    const source = item?.source ?? item?.Source;
    return source === CXC_INCOME_SOURCE || sameLabel(label, CXC_INCOME_LABEL);
  });
  if (hasExisting) return list;
  return cxc?.summaryRow ? [...list, cxc.summaryRow] : list;
};

export const appendAccountsPayableSummary = (rows, cxp) => {
  const list = Array.isArray(rows) ? [...rows] : [];
  const hasExisting = list.some((item) => {
    const label = item?.cuenta_Egreso ?? item?.Cuenta_Egreso ?? item?.nombre;
    return sameLabel(label, CXP_EXPENSE_LABEL);
  });
  if (hasExisting) return list;
  return cxp?.summaryRow ? [...list, cxp.summaryRow] : list;
};
