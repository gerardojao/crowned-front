export const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function normalizeProviderId(value) {
  const providerId = Number(value);
  return Number.isInteger(providerId) && providerId > 0 ? providerId : null;
}

export function getInvoiceLineSection(item) {
  const raw = String(
    item?.section ??
      item?.Section ??
      item?.kind ??
      item?.Kind ??
      item?.tipo ??
      item?.Tipo ??
      "",
  )
    .trim()
    .toLowerCase();
  if (raw.includes("pintura")) return "Pintura";
  if (
    raw.includes("pieza") ||
    raw.includes("recambio") ||
    raw.includes("repuesto") ||
    raw.includes("material")
  ) {
    return "Piezas";
  }
  return "ManoObra";
}

export function getInvoiceLineQuantity(item) {
  const section = getInvoiceLineSection(item);
  const value =
    section === "Piezas"
      ? item?.cantidad ?? item?.Cantidad
      : item?.tiempo ?? item?.Tiempo ?? item?.cantidad ?? item?.Cantidad;
  const number = Number(value || 0);
  return number > 0 ? number : 1;
}

export function getInvoiceLineTotal(item) {
  const storedTotal = getStoredInvoiceLineTotal(item);
  const numericStoredTotal = Number(storedTotal);
  if (Number.isFinite(numericStoredTotal)) return round2(numericStoredTotal);

  return round2(Number(item?.cantidad || 0) * Number(item?.importe || 0));
}

export function isInvoiceLineEligible(item) {
  const description = String(item?.descripcion || item?.codigo || "").trim();
  const total = getInvoiceLineTotal(item);
  return Boolean(description) && Number.isFinite(total) && total >= 0;
}

function getStoredInvoiceLineTotal(item) {
  return (
    item?.lineTotal ??
    item?.LineTotal ??
    item?.totalLinea ??
    item?.TotalLinea ??
    item?.netTotal ??
    item?.NetTotal
  );
}

export function normalizeInvoiceLineForTotals(
  item,
  invoiceIvaPct = 21,
  detailed = false,
) {
  if (!detailed) {
    return {
      ...item,
      lineTotal: getInvoiceLineTotal(item),
    };
  }

  const section = getInvoiceLineSection(item);
  const quantity = getInvoiceLineQuantity({ ...item, section });
  const price = Number(
    item?.precioUnitario ??
      item?.PrecioUnitario ??
      item?.importe ??
      item?.Importe ??
      0,
  );
  const discount = Math.min(
    100,
    Math.max(0, Number(item?.descuentoPct ?? item?.DescuentoPct ?? 0)),
  );
  const storedLineTotal = Number(getStoredInvoiceLineTotal(item));
  const lineTotal = Number.isFinite(storedLineTotal)
    ? round2(storedLineTotal)
    : round2(quantity * price * (1 - discount / 100));
  const unitNet = quantity > 0 ? round2(lineTotal / quantity) : 0;
  const kind = section === "Piezas" ? "repuesto" : "labor";

  return {
    ...item,
    codigo: item?.codigo ?? item?.Codigo ?? "",
    section,
    cantidad: quantity,
    tiempo: section === "Piezas" ? item?.tiempo ?? item?.Tiempo ?? "" : quantity,
    precioUnitario: round2(price),
    descuentoPct: discount,
    ivaPct: Number(item?.ivaPct ?? item?.IvaPct ?? invoiceIvaPct ?? 21),
    importe: unitNet,
    lineTotal,
    kind,
  };
}

export function parseOrderItems(itemsJson) {
  if (!itemsJson) return [];

  try {
    const parsed = JSON.parse(itemsJson);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) =>
        normalizeInvoiceLineForTotals(
          {
            codigo: item?.codigo ?? item?.Codigo ?? "",
            section: getInvoiceLineSection(item),
            descripcion: item?.descripcion || item?.Descripcion || "",
            cantidad: Number(item?.cantidad ?? item?.Cantidad ?? 1),
            tiempo:
              item?.tiempo ??
              item?.Tiempo ??
              item?.cantidad ??
              item?.Cantidad ??
              1,
            precioUnitario: Number(
              item?.precioUnitario ??
                item?.PrecioUnitario ??
                item?.precio ??
                item?.Precio ??
                item?.importe ??
                item?.Importe ??
                0,
            ),
            descuentoPct: Number(item?.descuentoPct ?? item?.DescuentoPct ?? 0),
            ivaPct: Number(item?.ivaPct ?? item?.IvaPct ?? 21),
            importe: Number(
              item?.importe ??
                item?.Importe ??
                item?.precioUnitario ??
                item?.PrecioUnitario ??
                0,
            ),
            lineTotal:
              item?.lineTotal ??
              item?.LineTotal ??
              item?.totalLinea ??
              item?.TotalLinea ??
              item?.netTotal ??
              item?.NetTotal,
            kind: item?.kind ?? item?.Kind ?? item?.tipo ?? item?.Tipo ?? null,
            repuestoStockId:
              item?.repuestoStockId ??
              item?.RepuestoStockId ??
              item?.idRepuesto ??
              item?.IdRepuesto ??
              null,
            idProveedor: normalizeProviderId(
              item?.idProveedor ?? item?.IdProveedor,
            ),
            nombreProveedor: item?.nombreProveedor ?? item?.NombreProveedor ?? null,
            precioCompra: item?.precioCompra ?? item?.PrecioCompra ?? null,
          },
          Number(item?.ivaPct ?? item?.IvaPct ?? 21),
          true,
        ),
      )
      .filter(
        (item) =>
          item.descripcion.trim() &&
          item.cantidad > 0 &&
          getInvoiceLineTotal(item) >= 0,
      );
  } catch {
    return [];
  }
}

export function getInvoiceSubtotal(items) {
  return round2(
    items.reduce((sum, item) => sum + getInvoiceLineTotal(item), 0),
  );
}

export function buildInvoicePayloadItems(items) {
  return items.flatMap((item) => {
    const quantity = Number(item.cantidad || 0);
    const lineTotal = getInvoiceLineTotal(item);
    const normalizedUnit = quantity > 0 ? round2(lineTotal / quantity) : 0;

    if (
      quantity > 1 &&
      Number.isInteger(quantity) &&
      round2(quantity * normalizedUnit) !== lineTotal
    ) {
      return splitLineForBackendTwoDecimalUnit(item, quantity, lineTotal);
    }

    return [{
      ...item,
      importe: normalizedUnit,
      idProveedor: normalizeProviderId(
        item?.idProveedor ?? item?.IdProveedor,
      ),
    }];
  });
}

function splitLineForBackendTwoDecimalUnit(item, quantity, lineTotal) {
  const totalCents = Math.round(lineTotal * 100);
  const baseUnitCents = Math.floor(totalCents / quantity);
  const higherUnitCount = totalCents - baseUnitCents * quantity;
  const lowerUnitCount = quantity - higherUnitCount;
  const rows = [];

  if (higherUnitCount > 0) {
    rows.push({
      ...item,
      cantidad: higherUnitCount,
      importe: round2((baseUnitCents + 1) / 100),
      idProveedor: normalizeProviderId(
        item?.idProveedor ?? item?.IdProveedor,
      ),
    });
  }

  if (lowerUnitCount > 0) {
    rows.push({
      ...item,
      cantidad: lowerUnitCount,
      importe: round2(baseUnitCents / 100),
      idProveedor: normalizeProviderId(
        item?.idProveedor ?? item?.IdProveedor,
      ),
    });
  }

  return rows;
}
