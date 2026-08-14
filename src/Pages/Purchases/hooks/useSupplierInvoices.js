import { useCallback, useEffect, useState } from "react";
import api from "../../../Components/api";

function toNumber(...values) {
  const value = values.find((item) => item !== undefined && item !== null);
  return Number(value ?? 0) || 0;
}

function normalizeIvaDetails(item) {
  const details =
    item?.ivaDetalles ??
    item?.IvaDetalles ??
    item?.lineasIva ??
    item?.LineasIva ??
    [];

  if (!Array.isArray(details)) return [];

  return details
    .map((line) => ({
      base: toNumber(
        line?.base,
        line?.tbase,
        line?.Base,
        line?.TBase,
        line?.baseImponible,
        line?.BaseImponible,
      ),
      ivaPct: toNumber(line?.ivaPct, line?.IvaPct, line?.tipoIva, line?.TipoIva),
      iva: toNumber(
        line?.iva,
        line?.Iva,
        line?.cuota,
        line?.Cuota,
        line?.importeIva,
        line?.ImporteIva,
      ),
      total: toNumber(line?.total, line?.Total),
      raw: line,
    }))
    .filter(
      (line) => line.base !== 0 || line.iva !== 0 || line.total !== 0,
    );
}

function normalizeSupplierInvoice(item) {
  const ivaDetalles = normalizeIvaDetails(item);
  const total = toNumber(item?.total, item?.Total);
  const importePagado = toNumber(item?.importePagado, item?.ImportePagado);

  return {
    id: item?.id ?? item?.Id,
    fecha: item?.fecha ?? item?.Fecha,
    fechaVencimiento: item?.fechaVencimiento ?? item?.FechaVencimiento ?? null,
    proveedor: item?.proveedorNombre ?? item?.ProveedorNombre ?? "Proveedor no indicado",
    proveedorId: item?.proveedorId ?? item?.ProveedorId ?? null,
    numeroFactura: item?.numeroFactura ?? item?.NumeroFactura,
    referencia: item?.referencia ?? item?.Referencia ?? "",
    descripcion: item?.descripcion ?? item?.Descripcion ?? "",
    tipoDocumento: item?.tipoDocumento ?? item?.TipoDocumento ?? "Factura",
    tipoGastoId: item?.tipoGastoId ?? item?.TipoGastoId ?? null,
    base: toNumber(item?.base, item?.tbase, item?.Base, item?.TBase),
    iva: toNumber(item?.iva, item?.Iva),
    total,
    importePagado,
    saldoPendiente: toNumber(
      item?.saldoPendiente ??
        item?.SaldoPendiente ??
        total - importePagado,
    ),
    estado: item?.estado ?? item?.Estado ?? "Pendiente de pago",
    fechaPago: item?.fechaPago ?? item?.FechaPago ?? null,
    bankAccountId: item?.bankAccountId ?? item?.BankAccountId ?? null,
    fichaEgresoId: item?.fichaEgresoId ?? item?.FichaEgresoId ?? null,
    source: "facturaRecibida",
    ivaDetalles,
    lineasIva: ivaDetalles,
    raw: item,
  };
}

export function useSupplierInvoices() {
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const loadSupplierInvoices = useCallback(async () => {
    try {
      setLoadingInvoices(true);
      const res = await api.get("/FacturaRecibida");
      const list = Array.isArray(res?.data?.data?.[0]) ? res.data.data[0] : [];
      setSupplierInvoices(list.map(normalizeSupplierInvoice));
    } catch {
      setSupplierInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  useEffect(() => {
    loadSupplierInvoices();
  }, [loadSupplierInvoices]);

  return {
    supplierInvoices,
    setSupplierInvoices,
    loadingInvoices,
    loadSupplierInvoices,
  };
}
