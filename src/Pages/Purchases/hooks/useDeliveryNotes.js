import { useCallback, useEffect, useState } from "react";
import api from "../../../Components/api";

function toNumber(...values) {
  const value = values.find((item) => item !== undefined && item !== null);
  return Number(value ?? 0) || 0;
}

function normalizeDeliveryLine(item) {
  return {
    id: item?.id ?? item?.Id,
    repuestoStockId: item?.repuestoStockId ?? item?.RepuestoStockId ?? null,
    codigoReferencia: item?.codigoReferencia ?? item?.CodigoReferencia ?? "",
    nombre: item?.nombre ?? item?.Nombre ?? "",
    marca: item?.marca ?? item?.Marca ?? "",
    cantidad: toNumber(item?.cantidad, item?.Cantidad),
    precioCompra: toNumber(item?.precioCompra, item?.PrecioCompra),
    ivaPct: toNumber(item?.ivaPct, item?.IvaPct),
    base: toNumber(item?.base, item?.Base),
    iva: toNumber(item?.iva, item?.Iva),
    total: toNumber(item?.total, item?.Total),
    raw: item,
  };
}

function normalizeDeliveryNote(item) {
  const lineas = item?.lineas ?? item?.Lineas ?? [];

  return {
    id: item?.id ?? item?.Id,
    idProveedor: item?.idProveedor ?? item?.IdProveedor,
    proveedor: item?.proveedor ?? item?.Proveedor ?? "Proveedor no indicado",
    numeroAlbaran: item?.numeroAlbaran ?? item?.NumeroAlbaran ?? "",
    fecha: item?.fecha ?? item?.Fecha,
    observaciones: item?.observaciones ?? item?.Observaciones ?? "",
    estado: item?.estado ?? item?.Estado ?? "PendienteFactura",
    base: toNumber(item?.base, item?.Base),
    iva: toNumber(item?.iva, item?.Iva),
    total: toNumber(item?.total, item?.Total),
    facturaRecibidaId: item?.facturaRecibidaId ?? item?.FacturaRecibidaId ?? null,
    lineas: Array.isArray(lineas) ? lineas.map(normalizeDeliveryLine) : [],
    raw: item,
  };
}

export function useDeliveryNotes() {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      setLoadingNotes(true);
      const res = await api.get("/Albaran", {
        params: { page: 1, pageSize: 100 },
      });
      const items = res?.data?.data?.[0]?.items || [];
      setNotes(items.map(normalizeDeliveryNote));
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return { notes, loadingNotes, loadNotes };
}
