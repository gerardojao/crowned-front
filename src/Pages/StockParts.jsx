import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  PackagePlus,
  RefreshCcw,
  Save,
  Search,
  Trash,
  Trash2,
  X,
} from "lucide-react";
import api from "../Components/api";
import {
  buildQuickProviderPayload,
  emptyQuickProviderForm,
  getCreatedProviderId,
  validateQuickProviderForm,
} from "./Purchases/utils/supplierQuickCreate";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const qty = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const emptyPartForm = {
  codigoReferencia: "",
  nombre: "",
  marca: "",
  categoria: "",
  cantidad: "0",
  stockMinimo: "3",
  precioCompra: "0",
  precioVenta: "",
  ubicacion: "",
  observaciones: "",
  numeroFactura: "",
  idProveedor: "",
};

function getValue(row, field, fallback = "") {
  const pascal = field.charAt(0).toUpperCase() + field.slice(1);
  return row?.[field] ?? row?.[pascal] ?? fallback;
}

function getProviderId(provider) {
  return provider?.id ?? provider?.Id;
}

function getProviderName(provider) {
  return provider?.nombre ?? provider?.Nombre ?? "";
}

function getPartLabel(row) {
  const ref = getValue(row, "codigoReferencia");
  const name = getValue(row, "nombre", "-");
  return [ref, name].filter(Boolean).join(" - ");
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-ES");
}

function getLineTotals(row) {
  const cantidad = Number(getValue(row, "cantidad", 0));
  const compra = Number(getValue(row, "precioCompra", 0));
  const venta = Number(getValue(row, "precioVenta", 0));
  const totalCompra = compra * cantidad;
  const totalVenta = venta * cantidad;
  const ganancia = totalVenta - totalCompra;

  return {
    cantidad,
    compra,
    venta,
    totalCompra,
    totalVenta,
    ganancia,
    utilidad: totalCompra > 0 ? (ganancia / totalCompra) * 100 : null,
  };
}

function toPayload(form) {
  return {
    codigoReferencia: form.codigoReferencia.trim(),
    nombre: form.nombre.trim(),
    marca: form.marca.trim(),
    categoria: form.categoria.trim(),
    cantidad: toNumber(form.cantidad),
    stockMinimo: Math.max(0, Math.trunc(toNumber(form.stockMinimo, 3))),
    precioCompra: toNumber(form.precioCompra),
    precioVenta: form.precioVenta === "" ? null : toNumber(form.precioVenta),
    ubicacion: form.ubicacion.trim(),
    observaciones: form.observaciones.trim(),
    numeroFactura: form.numeroFactura.trim(),
    idProveedor: form.idProveedor ? Number(form.idProveedor) : null,
  };
}

export default function StockParts() {
  const [tab, setTab] = useState("inventory");
  const [providers, setProviders] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [notice, setNotice] = useState(null);
  const [accountsPayableEnabled, setAccountsPayableEnabled] = useState(false);
  const [stockModuleEnabled, setStockModuleEnabled] = useState(true);

  const [inventoryParts, setInventoryParts] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [showLowOnly, setShowLowOnly] = useState(false);

  const [form, setForm] = useState(emptyPartForm);
  const [editingPartId, setEditingPartId] = useState(null);
  const [savingPart, setSavingPart] = useState(false);
  const [showQuickProvider, setShowQuickProvider] = useState(false);
  const [quickProvider, setQuickProvider] = useState(emptyQuickProviderForm);
  const [quickProviderErrors, setQuickProviderErrors] = useState({});
  const [savingQuickProvider, setSavingQuickProvider] = useState(false);
  const [quantityModal, setQuantityModal] = useState({
    open: false,
    row: null,
    mode: "set",
    value: "",
    loading: false,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    row: null,
    loading: false,
  });
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    row: null,
    numeroFactura: "",
    fecha: "",
    bankAccountId: "",
    ivaPct: "21",
    loading: false,
  });

  const [billedParts, setBilledParts] = useState([]);
  const [billedSearch, setBilledSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [billedPage, setBilledPage] = useState(1);
  const [billedTotal, setBilledTotal] = useState(0);
  const [billedLoading, setBilledLoading] = useState(false);
  const [editingBilledId, setEditingBilledId] = useState(null);
  const [billedEditForm, setBilledEditForm] = useState({
    idProveedor: "",
    precioCompra: "",
  });
  const [savingBilled, setSavingBilled] = useState(false);

  const pageSize = 20;

  const loadProviders = async () => {
    try {
      const res = await api.get("/Proveedor", {
        params: { page: 1, pageSize: 100 },
      });
      const items = res?.data?.data?.[0]?.items || [];
      setProviders(items);
      return items;
    } catch (err) {
      console.error(err);
      setProviders([]);
      return [];
    }
  };

  const setQuickProviderField = (name, value) => {
    setQuickProvider((prev) => ({ ...prev, [name]: value }));
    if (quickProviderErrors[name]) {
      setQuickProviderErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const resetQuickProvider = () => {
    setQuickProvider(emptyQuickProviderForm);
    setQuickProviderErrors({});
  };

  const createQuickProvider = async () => {
    if (savingQuickProvider) return;

    const errors = validateQuickProviderForm(quickProvider);
    setQuickProviderErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = buildQuickProviderPayload(quickProvider);

    try {
      setSavingQuickProvider(true);
      const res = await api.post("/Proveedor", payload);

      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo registrar el proveedor.",
        );
      }

      const createdId = getCreatedProviderId(res?.data);
      await loadProviders();

      if (createdId) {
        setForm((current) => ({
          ...current,
          idProveedor: String(createdId),
        }));
      }

      resetQuickProvider();
      setShowQuickProvider(false);
    } catch (err) {
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo registrar el proveedor.",
      });
    } finally {
      setSavingQuickProvider(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const res = await api.get("/WorkshopBankAccounts");
      setBankAccounts(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setBankAccounts([]);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.get("/WorkshopSettings");
      const settings = res?.data || {};
      const stockEnabled =
        settings.enableAccountsPayable ??
          settings.EnableAccountsPayable ??
          false;
      const paymentEnabled =
        settings.enableStockPayments ??
          settings.EnableStockPayments ??
          false;
      setAccountsPayableEnabled(paymentEnabled);
      setStockModuleEnabled(stockEnabled);
      if (!stockEnabled) setTab("billed");
    } catch (err) {
      console.error(err);
      setAccountsPayableEnabled(false);
      setStockModuleEnabled(false);
      setTab("billed");
    }
  };

  const loadInventory = async () => {
    try {
      setInventoryLoading(true);
      const endpoint = showLowOnly
        ? "/RepuestoStock/stock-bajo"
        : "/RepuestoStock";
      const res = await api.get(endpoint, {
        params: showLowOnly
          ? undefined
          : {
              search: inventorySearch || undefined,
              esFacturado: false,
              page: inventoryPage,
              pageSize,
            },
      });

      if (showLowOnly) {
        const list = res?.data?.data?.[0] || [];
        setInventoryParts(list);
        setInventoryTotal(list.length);
        return;
      }

      const pack = res?.data?.data?.[0];
      setInventoryParts(pack?.items || []);
      setInventoryTotal(pack?.total || 0);
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: "No se pudo cargar el inventario de repuestos.",
      });
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadBilled = async () => {
    try {
      setBilledLoading(true);
      const res = await api.get("/RepuestoStock", {
        params: {
          search: billedSearch || undefined,
          esFacturado: true,
          fechaInicio: dateFrom || undefined,
          fechaFin: dateTo || undefined,
          page: billedPage,
          pageSize,
        },
      });

      const pack = res?.data?.data?.[0];
      setBilledParts(pack?.items || []);
      setBilledTotal(pack?.total || 0);
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: "No se pudo cargar la rentabilidad de repuestos facturados.",
      });
    } finally {
      setBilledLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
    loadSettings();
    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (stockModuleEnabled !== true) return;
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockModuleEnabled, inventorySearch, inventoryPage, showLowOnly]);

  useEffect(() => {
    if (stockModuleEnabled == null) return;
    if (stockModuleEnabled && tab !== "billed") return;
    loadBilled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockModuleEnabled, tab, billedSearch, dateFrom, dateTo, billedPage]);

  const inventorySummary = useMemo(() => {
    return inventoryParts.reduce(
      (acc, row) => {
        const cantidad = Number(getValue(row, "cantidad", 0));
        const compra = Number(getValue(row, "precioCompra", 0));
        const venta = Number(getValue(row, "precioVenta", 0));
        acc.unidades += cantidad;
        acc.valorCompra += compra * cantidad;
        acc.valorVenta += venta * cantidad;
        if (getValue(row, "stockBajo", false)) acc.stockBajo += 1;
        if (accountsPayableEnabled && !getValue(row, "pagado", false)) {
          acc.pendientesPago += 1;
        }
        return acc;
      },
      { unidades: 0, valorCompra: 0, valorVenta: 0, stockBajo: 0, pendientesPago: 0 },
    );
  }, [inventoryParts, accountsPayableEnabled]);

  const billedSummary = useMemo(() => {
    return billedParts.reduce(
      (acc, row) => {
        const totals = getLineTotals(row);
        acc.cantidad += totals.cantidad;
        acc.compra += totals.totalCompra;
        acc.venta += totals.totalVenta;
        acc.ganancia += totals.ganancia;
        return acc;
      },
      { cantidad: 0, compra: 0, venta: 0, ganancia: 0 },
    );
  }, [billedParts]);

  const invoiceGroups = useMemo(() => {
    const map = new Map();

    for (const row of billedParts) {
      const invoiceNumber =
        getValue(row, "numeroFactura", "Sin factura") || "Sin factura";
      const existing = map.get(invoiceNumber) || {
        numeroFactura: invoiceNumber,
        fechaFactura: getValue(row, "fechaFactura"),
        cliente: getValue(row, "cliente", "-"),
        matricula: getValue(row, "matricula", "-"),
        rows: [],
        compra: 0,
        venta: 0,
        ganancia: 0,
      };

      const totals = getLineTotals(row);
      existing.rows.push(row);
      existing.compra += totals.totalCompra;
      existing.venta += totals.totalVenta;
      existing.ganancia += totals.ganancia;
      map.set(invoiceNumber, existing);
    }

    return Array.from(map.values());
  }, [billedParts]);

  const inventoryTotalPages = Math.max(1, Math.ceil(inventoryTotal / pageSize));
  const billedTotalPages = Math.max(1, Math.ceil(billedTotal / pageSize));
  const inventoryColumnCount = accountsPayableEnabled ? 13 : 12;
  const isInventoryView = stockModuleEnabled === true && tab === "inventory";

  const resetPartForm = () => {
    setEditingPartId(null);
    setForm(emptyPartForm);
  };

  const startPartEdit = (row) => {
    setNotice(null);
    setEditingPartId(getValue(row, "id"));
    setForm({
      codigoReferencia: String(getValue(row, "codigoReferencia", "") || ""),
      nombre: String(getValue(row, "nombre", "") || ""),
      marca: String(getValue(row, "marca", "") || ""),
      categoria: String(getValue(row, "categoria", "") || ""),
      cantidad: String(getValue(row, "cantidad", 0) ?? 0),
      stockMinimo: String(getValue(row, "stockMinimo", 3) ?? 3),
      precioCompra: String(getValue(row, "precioCompra", 0) ?? 0),
      precioVenta:
        getValue(row, "precioVenta", "") == null
          ? ""
          : String(getValue(row, "precioVenta", "")),
      ubicacion: String(getValue(row, "ubicacion", "") || ""),
      observaciones: String(getValue(row, "observaciones", "") || ""),
      numeroFactura: String(getValue(row, "numeroFactura", "") || ""),
      idProveedor: String(getValue(row, "idProveedor", "") || ""),
    });
  };

  const savePart = async (event) => {
    event.preventDefault();
    if (savingPart) return;

    const payload = toPayload(form);
    if (!payload.nombre) {
      setNotice({
        type: "error",
        text: "El nombre del repuesto es requerido.",
      });
      return;
    }

    try {
      setSavingPart(true);
      setNotice(null);

      if (editingPartId) {
        await api.put(`/RepuestoStock/${editingPartId}`, payload);
        setNotice({
          type: "success",
          text: "Repuesto actualizado correctamente.",
        });
      } else {
        await api.post("/RepuestoStock", payload);
        setNotice({
          type: "success",
          text: "Repuesto registrado correctamente.",
        });
      }

      resetPartForm();
      await loadInventory();
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar el repuesto.",
      });
    } finally {
      setSavingPart(false);
    }
  };

  const updateQuantity = async (row, mode) => {
    const current = Number(getValue(row, "cantidad", 0));
    setQuantityModal({
      open: true,
      row,
      mode,
      value: mode === "set" ? String(current) : "1",
      loading: false,
    });
  };

  const closeQuantityModal = () => {
    if (quantityModal.loading) return;
    setQuantityModal({
      open: false,
      row: null,
      mode: "set",
      value: "",
      loading: false,
    });
  };

  const confirmQuantityUpdate = async () => {
    const row = quantityModal.row;
    if (!row || quantityModal.loading) return;

    const id = getValue(row, "id");
    const current = Number(getValue(row, "cantidad", 0));
    const raw = String(quantityModal.value || "");
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value)) {
      setNotice({ type: "error", text: "Cantidad invalida." });
      return;
    }

    const next = Math.round((quantityModal.mode === "set" ? value : current + value) * 100) / 100;
    if (next < 0) {
      setNotice({
        type: "error",
        text: "El stock no puede quedar en negativo.",
      });
      return;
    }

    try {
      setQuantityModal((currentState) => ({ ...currentState, loading: true }));
      setNotice(null);
      const res = await api.patch(`/RepuestoStock/${id}/cantidad`, { cantidad: next });
      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(res?.data?.message || res?.data?.Message || "No se pudo actualizar la cantidad.");
      }
      await loadInventory();
      setQuantityModal({
        open: false,
        row: null,
        mode: "set",
        value: "",
        loading: false,
      });
      setNotice({
        type: "success",
        text: "Cantidad actualizada correctamente.",
      });
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message || "No se pudo actualizar la cantidad.",
      });
      setQuantityModal((currentState) => ({ ...currentState, loading: false }));
    }
  };

  const deletePart = async (row) => {
    setDeleteModal({ open: true, row, loading: false });
  };

  const closeDeleteModal = () => {
    if (deleteModal.loading) return;
    setDeleteModal({ open: false, row: null, loading: false });
  };

  const confirmDeletePart = async () => {
    const row = deleteModal.row;
    if (!row || deleteModal.loading) return;

    const id = getValue(row, "id");

    try {
      setDeleteModal((currentState) => ({ ...currentState, loading: true }));
      setNotice(null);
      await api.delete(`/RepuestoStock/${id}`);
      await loadInventory();
      setDeleteModal({ open: false, row: null, loading: false });
      setNotice({ type: "success", text: "Repuesto eliminado correctamente." });
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message || "No se pudo eliminar el repuesto.",
      });
      setDeleteModal((currentState) => ({ ...currentState, loading: false }));
    }
  };

  const openPaymentModal = (row) => {
    if (!accountsPayableEnabled) return;
    const existingBankId = getValue(row, "bankAccountId", "");
    const mainBank =
      bankAccounts.find((bank) => bank.esPrincipal ?? bank.EsPrincipal) ||
      bankAccounts[0];
    const defaultBankId = existingBankId || mainBank?.id || mainBank?.Id || "";

    setPaymentModal({
      open: true,
      row,
      numeroFactura: String(getValue(row, "numeroFactura", "") || ""),
      fecha: new Date().toISOString().slice(0, 10),
      bankAccountId: String(defaultBankId || ""),
      ivaPct: "21",
      loading: false,
    });
  };

  const closePaymentModal = () => {
    if (paymentModal.loading) return;
    setPaymentModal({
      open: false,
      row: null,
      numeroFactura: "",
      fecha: "",
      bankAccountId: "",
      ivaPct: "21",
      loading: false,
    });
  };

  const confirmPayment = async () => {
    const row = paymentModal.row;
    const id = getValue(row, "id");
    const numeroFactura = paymentModal.numeroFactura.trim();

    if (!row || paymentModal.loading) return;
    if (!numeroFactura) {
      setNotice({
        type: "error",
        text: "Indica factura o albarán antes de marcar como pagado.",
      });
      return;
    }
    if (!paymentModal.bankAccountId) {
      setNotice({
        type: "error",
        text: "Selecciona el banco por el que se hace el pago.",
      });
      return;
    }

    try {
      setPaymentModal((currentState) => ({ ...currentState, loading: true }));
      setNotice(null);
      await api.patch(`/RepuestoStock/${id}/pagado`, {
        pagado: true,
        numeroFactura,
        fecha: paymentModal.fecha || null,
        bankAccountId: Number(paymentModal.bankAccountId),
        ivaPct: Number(paymentModal.ivaPct ?? 21),
      });
      await loadInventory();
      setPaymentModal({
        open: false,
        row: null,
        numeroFactura: "",
        fecha: "",
        bankAccountId: "",
        ivaPct: "21",
        loading: false,
      });
      setNotice({
        type: "success",
        text: "Repuesto marcado como pagado y registrado en gastos.",
      });
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo marcar el repuesto como pagado.",
      });
      setPaymentModal((currentState) => ({ ...currentState, loading: false }));
    }
  };

  const startBilledEdit = (row) => {
    setNotice(null);
    setEditingBilledId(getValue(row, "id"));
    setBilledEditForm({
      idProveedor: String(getValue(row, "idProveedor", "") || ""),
      precioCompra: String(getValue(row, "precioCompra", 0) || ""),
    });
  };

  const cancelBilledEdit = () => {
    setEditingBilledId(null);
    setBilledEditForm({
      idProveedor: "",
      precioCompra: "",
    });
  };

  const saveBilledEdit = async () => {
    if (!editingBilledId || savingBilled) return;

    try {
      setSavingBilled(true);
      setNotice(null);

      const payload = {
        idProveedor: billedEditForm.idProveedor
          ? Number(billedEditForm.idProveedor)
          : 0,
        precioCompra: Number(billedEditForm.precioCompra || 0),
      };

      const res = await api.patch(
        `/RepuestoStock/${editingBilledId}/rentabilidad`,
        payload,
      );
      const updated = res?.data?.data?.[0];

      if (updated) {
        setBilledParts((current) =>
          current.map((row) =>
            String(getValue(row, "id")) === String(editingBilledId)
              ? updated
              : row,
          ),
        );
      } else {
        await loadBilled();
      }

      cancelBilledEdit();
      setNotice({
        type: "success",
        text: "Línea de rentabilidad actualizada correctamente.",
      });
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo actualizar la línea.",
      });
    } finally {
      setSavingBilled(false);
    }
  };

  return (
    <>
      <div className="mt-2 mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {!isInventoryView
              ? "Ganancias por reparación"
              : "Stock de repuestos"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {!isInventoryView
              ? "Margen real por concepto vendido desde facturas emitidas."
              : "Inventario, stock mínimo y rentabilidad de repuestos facturados."}
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-xl p-3 text-sm ring-1 ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-rose-200"
          }`}
        >
          {notice.text}
        </div>
      )}

      {stockModuleEnabled && (
        <div className="mb-5 inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => setTab("inventory")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === "inventory"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600"
            }`}
          >
            Inventario
          </button>
          <button
            type="button"
            onClick={() => setTab("billed")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === "billed"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600"
            }`}
          >
            Facturados
          </button>
        </div>
      )}

      {isInventoryView ? (
        <>
          <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <MetricCard
              label="Unidades"
              value={qty.format(inventorySummary.unidades)}
            />
            <MetricCard
              label="Valor compra"
              value={eur.format(inventorySummary.valorCompra)}
            />
            <MetricCard
              label="Stock bajo"
              value={inventorySummary.stockBajo}
              danger={inventorySummary.stockBajo > 0}
            />
            {/* {accountsPayableEnabled && (
              <MetricCard
                label="Pendientes pago"
                value={inventorySummary.pendientesPago}
                danger={inventorySummary.pendientesPago > 0}
              />
            )} */}
          </section>

          <section className="mb-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <PackagePlus size={18} className="text-slate-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                {editingPartId ? "Editar repuesto" : "Registrar repuesto"}
              </h3>
            </div>

            <form
              onSubmit={savePart}
              className="grid grid-cols-1 gap-3 lg:grid-cols-4"
            >
              <Input
                label="Referencia"
                value={form.codigoReferencia}
                onChange={(v) =>
                  setForm((f) => ({ ...f, codigoReferencia: v }))
                }
              />
              <Input
                label="Factura / albarán"
                value={form.numeroFactura}
                onChange={(v) => setForm((f) => ({ ...f, numeroFactura: v }))}
              />
              <Input
                label="Nombre *"
                value={form.nombre}
                onChange={(v) => setForm((f) => ({ ...f, nombre: v }))}
              />
              <Input
                label="Marca"
                value={form.marca}
                onChange={(v) => setForm((f) => ({ ...f, marca: v }))}
              />
              <Input
                label="Categoría"
                value={form.categoria}
                onChange={(v) => setForm((f) => ({ ...f, categoria: v }))}
              />
              <Input
                type="number"
                step="0.01"
                label="Cantidad"
                value={form.cantidad}
                onChange={(v) => setForm((f) => ({ ...f, cantidad: v }))}
              />
              <Input
                type="number"
                step="1"
                label="Stock mínimo"
                value={form.stockMinimo}
                onChange={(v) => setForm((f) => ({ ...f, stockMinimo: v }))}
              />
              <Input
                type="number"
                step="0.01"
                label="Precio compra"
                value={form.precioCompra}
                onChange={(v) => setForm((f) => ({ ...f, precioCompra: v }))}
              />
              <Input
                type="number"
                step="0.01"
                label="Precio venta"
                value={form.precioVenta}
                onChange={(v) => setForm((f) => ({ ...f, precioVenta: v }))}
              />
              <Input
                label="Ubicacion"
                value={form.ubicacion}
                onChange={(v) => setForm((f) => ({ ...f, ubicacion: v }))}
              />

              <div className="relative flex flex-col gap-1 text-sm font-medium text-slate-700">
                <span>Proveedor</span>
                <div className="flex gap-2">
                  <select
                    value={form.idProveedor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, idProveedor: e.target.value }))
                    }
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Sin proveedor</option>
                    {providers.map((provider) => {
                      const id = getProviderId(provider);
                      return (
                        <option key={id} value={id}>
                          {getProviderName(provider)}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowQuickProvider(true)}
                    className="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
                  >
                    + Nuevo
                  </button>
                </div>

                {showQuickProvider && (
                  <>
                    <button
                      type="button"
                      aria-label="Cerrar alta rapida de proveedor"
                      onClick={() => {
                        resetQuickProvider();
                        setShowQuickProvider(false);
                      }}
                      className="fixed inset-0 z-20 cursor-default bg-black/35"
                    />

                    <div className="absolute right-0 top-0 z-30 -mt-1 w-[min(42rem,calc(100vw-2rem))] rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Alta rapida de proveedor
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Crea el proveedor y seleccionalo en este repuesto.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            resetQuickProvider();
                            setShowQuickProvider(false);
                          }}
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                          Cerrar
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            value={quickProvider.nombre}
                            onChange={(e) =>
                              setQuickProviderField("nombre", e.target.value)
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm ${
                              quickProviderErrors.nombre
                                ? "border-rose-400 ring-1 ring-rose-200"
                                : "border-slate-300"
                            }`}
                            placeholder="Nombre del proveedor"
                          />
                          {quickProviderErrors.nombre && (
                            <p className="mt-1 text-xs text-rose-600">
                              {quickProviderErrors.nombre}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">
                            Telefono
                          </label>
                          <input
                            type="text"
                            value={quickProvider.telefono}
                            onChange={(e) =>
                              setQuickProviderField("telefono", e.target.value)
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm ${
                              "border-slate-300"
                            }`}
                            placeholder="Telefono"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">
                            NIF/CIF *
                          </label>
                          <input
                            type="text"
                            value={quickProvider.nifCif}
                            onChange={(e) =>
                              setQuickProviderField("nifCif", e.target.value)
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm ${
                              quickProviderErrors.nifCif
                                ? "border-rose-400 ring-1 ring-rose-200"
                                : "border-slate-300"
                            }`}
                            placeholder="B12345678"
                          />
                          {quickProviderErrors.nifCif && (
                            <p className="mt-1 text-xs text-rose-600">
                              {quickProviderErrors.nifCif}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">
                            Categoria
                          </label>
                          <input
                            type="text"
                            value={quickProvider.categoria}
                            onChange={(e) =>
                              setQuickProviderField("categoria", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Repuestos, pintura, servicios..."
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-slate-700">
                            Email
                          </label>
                          <input
                            type="email"
                            value={quickProvider.email}
                            onChange={(e) =>
                              setQuickProviderField("email", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            placeholder="correo@email.com"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          disabled={savingQuickProvider}
                          onClick={() => {
                            resetQuickProvider();
                            setShowQuickProvider(false);
                          }}
                          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          disabled={savingQuickProvider}
                          onClick={createQuickProvider}
                          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                          {savingQuickProvider
                            ? "Guardando..."
                            : "Crear proveedor"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 lg:col-span-2">
                Observaciones
                <input
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, observaciones: e.target.value }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <div className="flex flex-wrap items-end gap-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={savingPart}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Save size={17} />
                  {editingPartId ? "Guardar cambios" : "Registrar repuesto"}
                </button>
                {editingPartId && (
                  <button
                    type="button"
                    disabled={savingPart}
                    onClick={resetPartForm}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <X size={17} />
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Inventario actual
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(260px,1fr)_auto_auto]">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    placeholder="Buscar factura, albarán, referencia, nombre, marca, categoría o proveedor..."
                    value={inventorySearch}
                    onChange={(e) => {
                      setInventoryPage(1);
                      setInventorySearch(e.target.value);
                    }}
                    disabled={showLowOnly}
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm disabled:bg-slate-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInventoryPage(1);
                    setShowLowOnly((value) => !value);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 ${
                    showLowOnly
                      ? "bg-amber-100 text-amber-800 ring-amber-200"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Stock bajo
                </button>
                <button
                  type="button"
                  onClick={loadInventory}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <RefreshCcw size={16} />
                  Actualizar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-center">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Referencia</th>
                    <th className="px-3 py-3">Factura / Albaran</th>
                    <th className="px-3 py-3">Repuesto</th>
                    <th className="px-3 py-3">Marca</th>
                    <th className="px-3 py-3">Proveedor</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Minimo</th>
                    <th className="px-3 py-3">Compra</th>
                    <th className="px-3 py-3">Venta</th>
                    <th className="px-3 py-3">Ubicacion</th>
                    {/* {accountsPayableEnabled && (
                      <th className="px-3 py-3">Pago</th>
                    )} */}
                    <th className="px-3 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryParts.map((row) => {
                    const id = getValue(row, "id");
                    const stockBajo = Boolean(
                      getValue(row, "stockBajo", false),
                    );
                    const pagado = Boolean(getValue(row, "pagado", false));

                    return (
                      <tr
                        key={id}
                        className={
                          stockBajo ? "bg-amber-50/70" : "hover:bg-slate-50"
                        }
                      >
                        <td className="px-3 py-3 text-slate-700">
                          {formatDate(getValue(row, "fechaCreacion"))}
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-800">
                          {getValue(row, "codigoReferencia", "-") || "-"}
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-800">
                          {getValue(row, "numeroFactura", "-") || "-"}
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {getValue(row, "nombre", "-")}
                        </td>
                        <td className="px-3 py-3">
                          {getValue(row, "marca", "-") || "-"}
                        </td>
                        <td className="px-3 py-3">
                          {getValue(row, "nombreProveedor", "-") || "-"}
                        </td>
                        <td
                          className={`px-3 py-3 font-bold ${stockBajo ? "text-amber-800" : "text-slate-900"}`}
                        >
                          {qty.format(Number(getValue(row, "cantidad", 0)))}
                        </td>
                        <td className="px-3 py-3">
                          {getValue(row, "stockMinimo", 0)}
                        </td>
                        <td className="px-3 py-3">
                          {eur.format(Number(getValue(row, "precioCompra", 0)))}
                        </td>
                        <td className="px-3 py-3">
                          {eur.format(Number(getValue(row, "precioVenta", 0)))}
                        </td>
                        <td className="px-3 py-3">
                          {getValue(row, "ubicacion", "-") || "-"}
                        </td>
                        {/* {accountsPayableEnabled && (
                          <td className="px-3 py-3">
                            {pagado ? (
                              <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                                Pagado
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openPaymentModal(row)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                              >
                                <CheckCircle2 size={14} />
                                Pagar
                              </button>
                            )}
                          </td>
                        )} */}
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => startPartEdit(row)}
                              className="rounded-lg bg-sky-600 p-2 text-white hover:bg-sky-700"
                              title="Editar"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateQuantity(row, "set")}
                              className="rounded-lg bg-slate-700 px-2.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                            >
                              Stock
                            </button>
                            {/* <button
                              type="button"
                              onClick={() => updateQuantity(row, "add")}
                              className="rounded-lg bg-white px-2.5 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                            >
                              +/-
                            </button> */}
                            <button
                              type="button"
                              onClick={() => deletePart(row)}
                              className="rounded-lg bg-rose-600 p-2 text-white hover:bg-rose-700"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!inventoryLoading && inventoryParts.length === 0 && (
                    <tr>
                      <td
                        colSpan={inventoryColumnCount}
                        className="py-8 text-center text-slate-500"
                      >
                        No hay repuestos para mostrar.
                      </td>
                    </tr>
                  )}

                  {inventoryLoading && (
                    <tr>
                      <td
                        colSpan={inventoryColumnCount}
                        className="py-8 text-center text-slate-500"
                      >
                        Cargando inventario...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!showLowOnly && (
              <Pagination
                page={inventoryPage}
                totalPages={inventoryTotalPages}
                onPage={setInventoryPage}
              />
            )}
          </section>
        </>
      ) : (
        <>
          <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <MetricCard
              label="Total venta"
              value={eur.format(billedSummary.venta)}
            />
            <MetricCard
              label="Total compra"
              value={eur.format(billedSummary.compra)}
            />
            <MetricCard
              label="Ganancia"
              value={eur.format(billedSummary.ganancia)}
              danger={billedSummary.ganancia < 0}
            />
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Líneas facturadas
              </h3>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-[160px_160px_minmax(260px,1fr)_auto]">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setBilledPage(1);
                    setDateFrom(e.target.value);
                  }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  aria-label="Fecha inicio"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setBilledPage(1);
                    setDateTo(e.target.value);
                  }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  aria-label="Fecha fin"
                />
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    placeholder="Buscar factura, cliente, matrícula o concepto..."
                    value={billedSearch}
                    onChange={(e) => {
                      setBilledPage(1);
                      setBilledSearch(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                {(dateFrom || dateTo || billedSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBilledPage(1);
                      setDateFrom("");
                      setDateTo("");
                      setBilledSearch("");
                    }}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-center">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Factura</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3">Matricula</th>
                    <th className="px-3 py-3">Referencia</th>
                    <th className="px-3 py-3">Concepto</th>
                    <th className="px-3 py-3">Proveedor</th>
                    <th className="px-3 py-3">Cant.</th>
                    <th className="px-3 py-3">Compra</th>
                    <th className="px-3 py-3">Venta</th>
                    <th className="px-3 py-3">Ganancia</th>
                    <th className="px-3 py-3">% utilidad</th>
                    <th className="px-3 py-3">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {invoiceGroups.map((group) => (
                    <React.Fragment key={group.numeroFactura}>
                      <tr className="border-t border-slate-200 bg-slate-100/80">
                        <td colSpan={13} className="px-4 py-3">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="font-bold text-slate-900">
                                {group.fechaFactura
                                  ? formatDate(group.fechaFactura)
                                  : "Sin fecha"}
                              </span>
                              <span className="text-slate-600">
                                <strong>{group.numeroFactura}</strong>
                              </span>
                              <span className="text-slate-700">
                                {group.cliente}
                              </span>
                              <span className="text-slate-500">
                                {group.matricula}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                              <span>
                                Venta:{" "}
                                <strong>{eur.format(group.venta)}</strong>
                              </span>
                              <span>
                                Compra:{" "}
                                <strong>{eur.format(group.compra)}</strong>
                              </span>
                              <span
                                className={
                                  group.ganancia >= 0
                                    ? "text-emerald-700"
                                    : "text-rose-700"
                                }
                              >
                                Ganancia:{" "}
                                <strong>{eur.format(group.ganancia)}</strong>
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {group.rows.map((row) => {
                        const id = getValue(row, "id");
                        const totals = getLineTotals(row);
                        const isEditing =
                          String(editingBilledId) === String(id);

                        return (
                          <tr key={id} className="hover:bg-slate-50">
                            <td className="px-3 py-3 text-slate-400">-</td>
                            <td className="px-3 py-3 text-slate-400">-</td>
                            <td className="px-3 py-3 text-slate-400">-</td>
                            <td className="px-3 py-3 text-slate-400">-</td>
                            <td className="px-3 py-3 font-semibold">
                              {getValue(row, "codigoReferencia", "-") || "-"}
                            </td>
                            <td className="px-3 py-3 font-semibold">
                              {getValue(row, "nombre", "-")}
                            </td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <select
                                  value={billedEditForm.idProveedor}
                                  onChange={(e) =>
                                    setBilledEditForm((current) => ({
                                      ...current,
                                      idProveedor: e.target.value,
                                    }))
                                  }
                                  className="w-48 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                                  aria-label="Proveedor"
                                >
                                  <option value="">Sin proveedor</option>
                                  {providers.map((provider) => {
                                    const providerId = getProviderId(provider);
                                    return (
                                      <option
                                        key={providerId}
                                        value={providerId}
                                      >
                                        {getProviderName(provider)}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                getValue(row, "nombreProveedor", "-") || "-"
                              )}
                            </td>
                            <td className="px-3 py-3 font-semibold">
                              {qty.format(totals.cantidad)}
                            </td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={billedEditForm.precioCompra}
                                  onChange={(e) =>
                                    setBilledEditForm((current) => ({
                                      ...current,
                                      precioCompra: e.target.value,
                                    }))
                                  }
                                  className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                                  aria-label="Precio compra"
                                />
                              ) : (
                                eur.format(totals.compra)
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {eur.format(totals.venta)}
                            </td>
                            <td
                              className={`px-3 py-3 font-semibold ${totals.ganancia >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                            >
                              {eur.format(totals.ganancia)}
                            </td>
                            <td className="px-3 py-3 font-semibold">
                              {totals.utilidad == null
                                ? "-"
                                : `${pct.format(totals.utilidad)}%`}
                            </td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <div className="flex justify-center gap-2">
                                  <button
                                    type="button"
                                    disabled={savingBilled}
                                    onClick={saveBilledEdit}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                                  >
                                    <Save size={14} />
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingBilled}
                                    onClick={cancelBilledEdit}
                                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    <X size={14} />
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startBilledEdit(row)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                                >
                                  <Edit3 size={14} />
                                  Editar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}

                  {!billedLoading && billedParts.length === 0 && (
                    <tr>
                      <td
                        colSpan={13}
                        className="py-8 text-center text-slate-500"
                      >
                        No hay líneas facturadas para mostrar.
                      </td>
                    </tr>
                  )}

                  {billedLoading && (
                    <tr>
                      <td
                        colSpan={13}
                        className="py-8 text-center text-slate-500"
                      >
                        Cargando rentabilidad...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={billedPage}
              totalPages={billedTotalPages}
              onPage={setBilledPage}
            />
          </section>
        </>
      )}

      <QuantityModal
        open={quantityModal.open}
        mode={quantityModal.mode}
        value={quantityModal.value}
        loading={quantityModal.loading}
        partLabel={quantityModal.row ? getPartLabel(quantityModal.row) : ""}
        onChange={(value) =>
          setQuantityModal((current) => ({ ...current, value }))
        }
        onCancel={closeQuantityModal}
        onConfirm={confirmQuantityUpdate}
      />

      <ConfirmModal
        open={deleteModal.open}
        title="Eliminar repuesto"
        message={
          deleteModal.row
            ? `Eliminar ${getPartLabel(deleteModal.row)} del inventario?`
            : ""
        }
        confirmLabel="Eliminar"
        loading={deleteModal.loading}
        onCancel={closeDeleteModal}
        onConfirm={confirmDeletePart}
      />

      <PaymentModal
        open={paymentModal.open}
        numeroFactura={paymentModal.numeroFactura}
        fecha={paymentModal.fecha}
        bankAccountId={paymentModal.bankAccountId}
        ivaPct={paymentModal.ivaPct}
        bankAccounts={bankAccounts}
        loading={paymentModal.loading}
        partLabel={paymentModal.row ? getPartLabel(paymentModal.row) : ""}
        onChangeNumero={(numeroFactura) =>
          setPaymentModal((current) => ({ ...current, numeroFactura }))
        }
        onChangeFecha={(fecha) =>
          setPaymentModal((current) => ({ ...current, fecha }))
        }
        onChangeBank={(bankAccountId) =>
          setPaymentModal((current) => ({ ...current, bankAccountId }))
        }
        onChangeIva={(ivaPct) =>
          setPaymentModal((current) => ({ ...current, ivaPct }))
        }
        onCancel={closePaymentModal}
        onConfirm={confirmPayment}
      />
    </>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/45"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
            <Trash size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuantityModal({
  open,
  mode,
  value,
  loading,
  partLabel,
  onChange,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/45"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <h3 className="text-lg font-bold text-slate-900">
          {mode === "set" ? "Actualizar stock" : "Aumentar inventario"}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{partLabel}</p>
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-slate-700">
          {mode === "set" ? "Nueva cantidad en stock" : "Cantidad a sumar o restar"}
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            autoFocus
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({
  open,
  numeroFactura,
  fecha,
  bankAccountId,
  ivaPct,
  bankAccounts,
  loading,
  partLabel,
  onChangeNumero,
  onChangeFecha,
  onChangeBank,
  onChangeIva,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/45"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Marcar como pagado</h3>
            <p className="mt-1 text-sm text-slate-600">{partLabel}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <Input
            label="Factura / albarán *"
            value={numeroFactura}
            onChange={onChangeNumero}
          />
          <Input
            type="date"
            label="Fecha"
            value={fecha}
            onChange={onChangeFecha}
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            IVA
            <select
              value={ivaPct ?? "21"}
              onChange={(event) => onChangeIva(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="0">0%</option>
              <option value="10">10%</option>
              <option value="21">21%</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Banco *
            <select
              value={bankAccountId}
              onChange={(event) => onChangeBank(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecciona banco</option>
              {bankAccounts.map((bank) => {
                const id = bank.id ?? bank.Id;
                const name = bank.nombre ?? bank.Nombre ?? "Cuenta bancaria";
                const iban = bank.iban ?? bank.Iban ?? "";
                return (
                  <option key={id} value={id}>
                    {iban ? `${name} - ${iban}` : name}
                  </option>
                );
              })}
            </select>
          </label>
          {bankAccounts.length === 0 && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
              No hay bancos activos configurados para este taller.
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading || bankAccounts.length === 0}
            onClick={onConfirm}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Registrando..." : "Marcar pagado"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, danger = false }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-bold ${danger ? "text-rose-700" : "text-slate-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", step }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage((p) => Math.max(1, p - 1))}
        className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
      >
        Anterior
      </button>
      <span className="text-sm text-slate-500">
        Pagina {page} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage((p) => Math.min(totalPages, p + 1))}
        className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
      >
        Siguiente
      </button>
    </div>
  );
}
