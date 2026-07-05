export function getRepairLineSection(item) {
  const raw = String(
    item?.section ??
      item?.Section ??
      item?.tipo ??
      item?.Tipo ??
      item?.kind ??
      item?.Kind ??
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

export function getRepairLineQuantity(item) {
  const section = getRepairLineSection(item);
  const value =
    section === "Piezas"
      ? (item?.cantidad ?? item?.Cantidad)
      : (item?.tiempo ?? item?.Tiempo ?? item?.cantidad ?? item?.Cantidad);
  const number = Number(value || 0);
  return number > 0 ? number : 1;
}

export function getRepairLineTotal(item) {
  const quantity = getRepairLineQuantity(item);
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

  return quantity * price * (1 - discount / 100);
}

export function normalizeRepairLine(item, detailed = false) {
  if (!detailed) return item;

  const section = getRepairLineSection(item);
  const quantity = getRepairLineQuantity({ ...item, section });
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
  const netTotal = getRepairLineTotal({
    ...item,
    section,
    precioUnitario: price,
    descuentoPct: discount,
  });
  const unitNet =
    quantity > 0
      ? Math.round((netTotal / quantity + Number.EPSILON) * 100) / 100
      : 0;

  return {
    ...item,
    section,
    cantidad: quantity,
    tiempo:
      section === "Piezas" ? (item?.tiempo ?? item?.Tiempo ?? "") : quantity,
    precioUnitario: price,
    descuentoPct: discount,
    ivaPct: Number(item?.ivaPct ?? item?.IvaPct ?? 21),
    importe: unitNet,
    kind: section === "Piezas" ? "repuesto" : "labor",
  };
}

export function buildNormalizedRepairItems(items, detailedRepairLinesEnabled) {
  const source = Array.isArray(items) ? items : [];

  if (!detailedRepairLinesEnabled) {
    return [];
  }

  return source
    .filter((item) => {
      const normalized = normalizeRepairLine(item, true);
      return (
        String(normalized.descripcion || normalized.codigo || "").trim() ||
        Number(normalized.cantidad || 0) * Number(normalized.importe || 0) > 0
      );
    })
    .map((item) => {
      const normalized = normalizeRepairLine(item, true);
      return {
        codigo: normalized.codigo || null,
        section: normalized.section || "ManoObra",
        descripcion: String(normalized.descripcion || "").trim(),
        cantidad: Number(normalized.cantidad || 1),
        tiempo: normalized.tiempo ? Number(normalized.tiempo || 0) : null,
        precioUnitario: Number(normalized.precioUnitario || 0),
        descuentoPct: Number(normalized.descuentoPct || 0),
        ivaPct: Number(normalized.ivaPct || 21),
        importe: Number(normalized.importe ?? normalized.precioUnitario ?? 0),
        kind: normalized.kind || null,
        repuestoStockId: normalized.repuestoStockId || null,
        idProveedor: normalized.idProveedor || null,
        nombreProveedor: normalized.nombreProveedor || null,
        precioCompra:
          normalized.precioCompra != null
            ? Number(normalized.precioCompra || 0)
            : null,
      };
    });
}

function splitLegacyRepairTotals(items) {
  const source = Array.isArray(items) ? items : [];

  return source.reduce(
    (acc, item) => {
      const section = getRepairLineSection(item);
      const quantity = getRepairLineQuantity(item);
      const price = Number(
        item?.precioUnitario ??
          item?.PrecioUnitario ??
          item?.importe ??
          item?.Importe ??
          0,
      );
      const total = quantity * price;
      const description = String(
        item?.descripcion ?? item?.Descripcion ?? "",
      ).trim();

      if (description) {
        acc.descriptions.push(description);
      }

      if (section === "Piezas") {
        acc.repuestos += price;
        acc.cantidad = Math.max(acc.cantidad, quantity);
      } else {
        acc.manoObra += total;
        acc.cantidad = Math.max(acc.cantidad, quantity);
      }

      return acc;
    },
    { descriptions: [], repuestos: 0, manoObra: 0, cantidad: 1 },
  );
}

export function buildWorkOrderPayload(order, detailedRepairLinesEnabled) {
  const normalizedItems = buildNormalizedRepairItems(
    order?.Items,
    detailedRepairLinesEnabled,
  );
  const legacyTotals = !detailedRepairLinesEnabled
    ? splitLegacyRepairTotals(order?.Items)
    : null;
  const laborTotal = normalizedItems
    .filter((item) => item.kind === "labor")
    .reduce((sum, item) => sum + item.cantidad * item.importe, 0);
  const partsTotal = normalizedItems
    .filter((item) => item.kind !== "labor")
    .reduce((sum, item) => sum + item.cantidad * item.importe, 0);
  const legacyTrabajo = legacyTotals?.descriptions.length
    ? legacyTotals.descriptions.join("\n")
    : null;

  return {
    cliente: order.Cliente,
    dni: order.Dni || null,
    telefono: order.Telefono || null,
    direccion: order.Direccion || null,
    codigoPostal: order.CodigoPostal || null,
    poblacion: order.Poblacion || null,
    provincia: order.Provincia || null,
    clasificacion: order.Clasificacion || "Particular",
    vehiculoId: order.VehiculoId ? Number(order.VehiculoId) : null,
    matricula: order.Matricula,
    bastidor: order.Bastidor || null,
    marca: order.Marca || null,
    modelo: order.Modelo,
    fechaMatriculacion: order.FechaMatriculacion || null,
    motor: order.Motor || null,
    kw: order.Kw ? Number(order.Kw) : null,
    cv: order.Cv ? Number(order.Cv) : null,
    combustible: order.Combustible || null,
    kilometraje: order.Kilometraje ? Number(order.Kilometraje) : null,
    fecha: order.Fecha,
    fechaPrevistaEntrega: order.FechaPrevistaEntrega || null,
    tiempoEstimadoHoras: order.TiempoEstimadoHoras
      ? Number(order.TiempoEstimadoHoras)
      : null,
    tipoOperacion: order.TipoOperacion || "Mecanica",
    trabajo: order.Trabajo || legacyTrabajo,
    itemsJson: normalizedItems.length ? JSON.stringify(normalizedItems) : null,
    repuestos: normalizedItems.length
      ? partsTotal
      : legacyTotals
        ? legacyTotals.repuestos
        : Number(order.Repuestos || 0),
    cantidad: normalizedItems.length
      ? Number(order.Cantidad || 1)
      : legacyTotals
        ? legacyTotals.cantidad
        : Number(order.Cantidad || 1),
    manoObra: normalizedItems.length
      ? laborTotal
      : legacyTotals
        ? legacyTotals.manoObra
        : Number(order.ManoObra || 0),
    estado: order.Estado || "Recibido",
    observaciones: order.Observaciones || null,
  };
}

export function buildPreOrderPayload(form) {
  return {
    cliente: form.Cliente,
    dni: form.Dni || null,
    telefono: form.Telefono || null,
    direccion: form.Direccion || null,
    codigoPostal: form.CodigoPostal || null,
    poblacion: form.Poblacion || null,
    provincia: form.Provincia || null,
    clasificacion: form.Clasificacion || "Particular",
    vehiculoId: form.VehiculoId ? Number(form.VehiculoId) : null,
    matricula: form.Matricula,
    bastidor: form.Bastidor || null,
    marca: form.Marca || null,
    modelo: form.Modelo,
    fechaMatriculacion: form.FechaMatriculacion || null,
    motor: form.Motor || null,
    kw: form.Kw ? Number(form.Kw) : null,
    cv: form.Cv ? Number(form.Cv) : null,
    combustible: form.Combustible || null,
    kilometraje: form.Kilometraje ? Number(form.Kilometraje) : null,
    fecha: form.Fecha,
    fechaPrevistaEntrega: form.FechaPrevistaEntrega || null,
    tiempoEstimadoHoras: form.TiempoEstimadoHoras
      ? Number(form.TiempoEstimadoHoras)
      : null,
    tipoOperacion: form.TipoOperacion || "Mecanica",
    motivoRecepcion: form.MotivoRecepcion,
    diagnosticoMecanico: form.DiagnosticoMecanico || null,
    repuestosNecesarios: form.RepuestosNecesarios || null,
    observaciones: form.Observaciones || null,
  };
}
