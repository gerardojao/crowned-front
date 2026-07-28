import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Printer, Search, Trash2, UserPlus } from "lucide-react";
import api, { resolveApiAssetUrl } from "../Components/api";
import logoTaller from "../assets/LogoTallerCrowned.png";
import PartPicker, {
  getPartDisplayName,
  getPartId,
  getPartProviderId,
  getPartProviderName,
  getPartPurchasePrice,
  getPartSalePrice,
} from "../Components/PartPicker";
import ZagaInvoiceDocument, { usesZagaInvoiceTemplate } from "../Components/ZagaInvoiceDocument";
import {
  currentFiscalYearStart,
  localDateInputValue,
} from "../utils/date";

const DEFAULT_TALLER = {
  nombre: "Multiservicios Crower",
  razonSocial: "JUAN CARLOS FERNANDEZ SILVA",
  nif: "61407055E",
  direccion: "CALLE ALCACER 63 D, Albal, 46470",
  telefono: "960057935/655042253",
  email: "multiservicioscrower@gmail.com",
  iban: "ES69 2100 4014 9122 0012 3843",
  serieFacturaRecambio: "RC",
  serieFacturaRapel: "RP",
  serieFacturaSinIva: "SI",
  logoUrl: "",
  enableSpecialInvoices: true,
  enableRapelInvoices: false,
  enableNoVatInvoices: false,
  enableAccountsReceivable: false,
};

const EMPTY_ITEM = {
  descripcion: "",
  cantidad: 1,
  importe: "",
  tipo: "Recambio",
  kind: "Recambio",
};

const PAYMENT_OPTIONS = [
  { value: "Efectivo", label: "Efectivo" },
  { value: "Transferencia", label: "Transferencia" },
  { value: "TDC", label: "TPV" },
  { value: "Bizum", label: "Bizum" },
  { value: "Credito", label: "Credito" },
];

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const inputCls = "rounded-xl border border-slate-300 px-3 py-2 text-sm";

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function getInvoiceMode(type) {
  const key = String(type || "parts").toLowerCase();
  if (key === "rapel") {
    return {
      key: "rapel",
      tipoFactura: "Rapel",
      itemType: "Rapel",
      operationType: "Rapel",
      title: "Factura Rapel",
      titleLower: "factura Rapel",
      description: "Regularizacion comercial con base e importes siempre en negativo.",
      linesTitle: "Conceptos Rapel",
      linePlaceholder: "Descripcion del rapel",
      ivaPct: 21,
      isRapel: true,
      isNoVat: false,
      usesParts: false,
    };
  }
  if (key === "no-vat" || key === "sin-iva" || key === "siniva") {
    return {
      key: "no-vat",
      tipoFactura: "SinIva",
      itemType: "SinIva",
      operationType: "Sin IVA",
      title: "Factura sin IVA",
      titleLower: "factura sin IVA",
      description: "Factura especial con numeracion propia y tasa de IVA 0%.",
      linesTitle: "Conceptos",
      linePlaceholder: "Descripcion del concepto",
      ivaPct: 0,
      isRapel: false,
      isNoVat: true,
      usesParts: false,
    };
  }
  return {
    key: "parts",
    tipoFactura: "Recambio",
    itemType: "Recambio",
    operationType: "Recambio",
    title: "Factura especial de recambio",
    titleLower: "factura de recambio",
    description: "Venta directa de piezas con numeracion independiente.",
    linesTitle: "Recambios",
    linePlaceholder: "Descripcion del recambio",
    ivaPct: 21,
    isRapel: false,
    isNoVat: false,
    usesParts: true,
  };
}

function getSerieForMode(taller, mode) {
  if (mode.isRapel) return taller.serieFacturaRapel || taller.SerieFacturaRapel || "RP";
  if (mode.isNoVat) return taller.serieFacturaSinIva || taller.SerieFacturaSinIva || "SI";
  return taller.serieFacturaRecambio || taller.SerieFacturaRecambio || "RC";
}

function getSignedQuantity(item, mode) {
  const quantity = Math.abs(Number(item.cantidad || 0));
  return mode.isRapel ? -quantity : quantity;
}

export default function SpecialPartsInvoice() {
  const { type = "parts" } = useParams();
  const navigate = useNavigate();
  const invoiceMode = getInvoiceMode(type);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [taller, setTaller] = useState(DEFAULT_TALLER);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [includeVehicle, setIncludeVehicle] = useState(false);
  const [invoice, setInvoice] = useState({
    numero: "",
    idCliente: "",
    fecha: localDateInputValue(),
    cliente: "",
    dni: "",
    direccionCliente: "",
    codigoPostalCliente: "",
    poblacionCliente: "",
    provinciaCliente: "",
    telefonoCliente: "",
    matricula: "",
    bastidor: "",
    marca: "",
    modelo: "",
    fechaMatriculacion: "",
    motor: "",
    kw: "",
    cv: "",
    combustible: "",
    km: "",
    clasificacion: "Particular",
    franquiciaImporte: "",
    observaciones: "",
    tipoOperacion: invoiceMode.operationType,
    ivaPct: invoiceMode.ivaPct,
    tipoPago: "Efectivo",
    plazoCreditoDias: 30,
    fechaVencimiento: "",
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  const isCredit = invoice.tipoPago === "Credito";
  const accountsReceivableEnabled = Boolean(
    taller.enableAccountsReceivable ?? taller.EnableAccountsReceivable ?? false,
  );
  const effectiveTipoPago = accountsReceivableEnabled ? invoice.tipoPago : "Efectivo";
  const isCashPayment = effectiveTipoPago === "Efectivo";
  const moduleEnabled = invoiceMode.isRapel
    ? (taller.enableRapelInvoices ?? taller.EnableRapelInvoices ?? false)
    : invoiceMode.isNoVat
      ? (taller.enableNoVatInvoices ?? taller.EnableNoVatInvoices ?? false)
      : (taller.enableSpecialInvoices ?? taller.EnableSpecialInvoices ?? true);

  const subtotal = useMemo(
    () =>
      round2(
        items.reduce(
          (sum, item) =>
            sum + getSignedQuantity(item, invoiceMode) * Math.abs(Number(item.importe || 0)),
          0,
        ),
      ),
    [items, invoiceMode.key],
  );
  const iva = round2(subtotal * (Number(invoice.ivaPct || 0) / 100));
  const total = round2(subtotal + iva);
  const selectedBank = useMemo(
    () =>
      bankAccounts.find(
        (bank) => String(bank.id ?? bank.Id) === String(selectedBankId),
      ) || null,
    [bankAccounts, selectedBankId],
  );
  const selectedBankIban = selectedBank?.iban ?? selectedBank?.Iban ?? "";
  const selectedBankName = selectedBank?.nombre ?? selectedBank?.Nombre ?? "";
  const isInsuranceCustomer =
    !invoiceMode.isRapel &&
    String(invoice.clasificacion || "").toLowerCase().includes("seguro");
  const franchiseAmount = isInsuranceCustomer ? round2(Math.max(0, Number(invoice.franquiciaImporte || 0))) : 0;
  const companyPayable = round2(Math.max(0, total - franchiseAmount));
  const totals = { subtotal, iva, otros: 0, total };

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const settingsRes = await api.get("/WorkshopSettings");
        const settings = settingsRes?.data || {};
        const nextTaller = {
          ...DEFAULT_TALLER,
          nombre: settings.nombre ?? settings.Nombre ?? DEFAULT_TALLER.nombre,
          razonSocial:
            settings.razonSocial ?? settings.RazonSocial ?? DEFAULT_TALLER.razonSocial,
          nif: settings.nif ?? settings.Nif ?? DEFAULT_TALLER.nif,
          direccion: settings.direccion ?? settings.Direccion ?? DEFAULT_TALLER.direccion,
          telefono: settings.telefono ?? settings.Telefono ?? DEFAULT_TALLER.telefono,
          email: settings.email ?? settings.Email ?? DEFAULT_TALLER.email,
          iban: settings.iban ?? settings.Iban ?? DEFAULT_TALLER.iban,
          serieFacturaRecambio:
            settings.serieFacturaRecambio ??
            settings.SerieFacturaRecambio ??
            DEFAULT_TALLER.serieFacturaRecambio,
          serieFacturaRapel:
            settings.serieFacturaRapel ??
            settings.SerieFacturaRapel ??
            DEFAULT_TALLER.serieFacturaRapel,
          serieFacturaSinIva:
            settings.serieFacturaSinIva ??
            settings.SerieFacturaSinIva ??
            DEFAULT_TALLER.serieFacturaSinIva,
          logoUrl: settings.logoUrl ?? settings.LogoUrl ?? "",
          documentTemplateKey:
            settings.documentTemplateKey ?? settings.DocumentTemplateKey ?? "",
          enableSpecialInvoices:
            settings.enableSpecialInvoices ?? settings.EnableSpecialInvoices ?? true,
          enableRapelInvoices:
            settings.enableRapelInvoices ?? settings.EnableRapelInvoices ?? false,
          enableNoVatInvoices:
            settings.enableNoVatInvoices ?? settings.EnableNoVatInvoices ?? false,
          enableAccountsReceivable:
            settings.enableAccountsReceivable ??
            settings.EnableAccountsReceivable ??
            DEFAULT_TALLER.enableAccountsReceivable,
        };

        const banksRes = await api.get("/WorkshopBankAccounts");
        const banks = Array.isArray(banksRes?.data) ? banksRes.data : [];
        const main = banks.find((x) => x.esPrincipal ?? x.EsPrincipal) || banks[0];

        const previewRes = await api.get("/NumeradorFactura/preview", {
          params: { serie: getSerieForMode(nextTaller, invoiceMode) },
        });
        const numeroFactura =
          previewRes?.data?.data?.[0]?.numeroFactura ||
          previewRes?.data?.Data?.[0]?.NumeroFactura ||
          "";

        if (!alive) return;
        setTaller({
          ...nextTaller,
          iban: main?.iban ?? main?.Iban ?? nextTaller.iban,
        });
        setBankAccounts(banks);
        setSelectedBankId(String(main?.id ?? main?.Id ?? ""));
        setInvoice((prev) => ({
          ...prev,
          numero: numeroFactura,
          tipoOperacion: invoiceMode.operationType,
          ivaPct: invoiceMode.ivaPct,
        }));
      } catch (err) {
        console.error(err);
        if (alive) setError(`No se pudo cargar la ${invoiceMode.titleLower}.`);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [invoiceMode.key]);

  useEffect(() => {
    if (accountsReceivableEnabled || !isCredit) return;
    setInvoice((prev) => ({ ...prev, tipoPago: "Efectivo" }));
  }, [accountsReceivableEnabled, isCredit]);

  useEffect(() => {
    const search = clientSearch.trim();
    if (search.length < 2) {
      setClientResults([]);
      return undefined;
    }

    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/Cliente", {
          params: { search, page: 1, pageSize: 8 },
        });
        if (!alive) return;
        setClientResults(res?.data?.data?.[0]?.items || []);
      } catch (err) {
        console.error(err);
        if (alive) setClientResults([]);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [clientSearch]);

  const setInvoiceField = (field, value) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
  };

  const hasSelectedClient = Boolean(invoice.idCliente);

  const selectClient = (client) => {
    setInvoice((prev) => ({
      ...prev,
      idCliente: client.id ?? client.Id ?? "",
      cliente: client.nombre ?? client.Nombre ?? "",
      dni: client.dni ?? client.Dni ?? "",
      direccionCliente: client.direccion ?? client.Direccion ?? "",
      codigoPostalCliente: client.codigoPostal ?? client.CodigoPostal ?? "",
      poblacionCliente: client.poblacion ?? client.Poblacion ?? "",
      provinciaCliente: client.provincia ?? client.Provincia ?? "",
      telefonoCliente: client.telefono ?? client.Telefono ?? "",
      matricula: client.matricula ?? client.Matricula ?? "",
      bastidor: client.bastidor ?? client.Bastidor ?? "",
      marca: client.marca ?? client.Marca ?? "",
      modelo: client.modelo ?? client.Modelo ?? "",
      fechaMatriculacion: String(client.fechaMatriculacion ?? client.FechaMatriculacion ?? "").slice(0, 10),
      motor: client.motor ?? client.Motor ?? "",
      kw: client.kw ?? client.Kw ?? "",
      cv: client.cv ?? client.Cv ?? "",
      combustible: client.combustible ?? client.Combustible ?? "",
      km: client.kilometraje ?? client.Kilometraje ?? "",
      clasificacion: client.clasificacion ?? client.Clasificacion ?? "Particular",
    }));
    setClientSearch("");
    setClientResults([]);
    setShowClientForm(false);
    setIncludeVehicle(false);
  };

  const saveClientFromInvoice = async () => {
    if (savingCustomer) return;

    const payload = {
      nombre: invoice.cliente,
      dni: invoice.dni || null,
      telefono: invoice.telefonoCliente,
      email: null,
      direccion: invoice.direccionCliente || null,
      codigoPostal: invoice.codigoPostalCliente || null,
      poblacion: invoice.poblacionCliente || null,
      provincia: invoice.provinciaCliente || null,
      clasificacion: invoice.clasificacion || "Particular",
      observaciones: invoice.observaciones || null,
    };

    if (!payload.nombre?.trim()) return setError("Indica el nombre del cliente para registrarlo.");
    if (!payload.telefono?.trim()) return setError("Indica el telefono del cliente para registrarlo.");
    if (includeVehicle) {
      payload.matricula = invoice.matricula;
      payload.bastidor = invoice.bastidor || null;
      payload.marca = invoice.marca || null;
      payload.modelo = invoice.modelo;
      payload.fechaMatriculacion = invoice.fechaMatriculacion || null;
      payload.motor = invoice.motor || null;
      payload.kw = invoice.kw ? Number(invoice.kw) : null;
      payload.cv = invoice.cv ? Number(invoice.cv) : null;
      payload.combustible = invoice.combustible || null;
      payload.kilometraje = invoice.km ? Number(invoice.km) : null;

      if (!payload.matricula?.trim()) return setError("Indica la matricula para registrar el vehiculo.");
      if (!payload.modelo?.trim()) return setError("Indica el modelo para registrar el vehiculo.");
    }
    try {
      setSavingCustomer(true);
      setError("");
      const res = await api.post("/Cliente", payload);
      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(res?.data?.message || res?.data?.Message || "No se pudo guardar el cliente.");
      }
      const created = res?.data?.data?.[0] || res?.data?.Data?.[0] || {};
      const createdId = created.id ?? created.Id ?? "";
      setInvoice((prev) => ({
        ...prev,
        idCliente: createdId || prev.idCliente,
      }));
      setShowClientForm(false);
      setIncludeVehicle(false);
      setNotice("Cliente guardado correctamente.");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "No se pudo guardar el cliente.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const setItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);

  const removeItem = (index) => {
    setItems((prev) =>
      prev.length === 1 ? [{ ...EMPTY_ITEM }] : prev.filter((_, i) => i !== index),
    );
  };

  const addPart = (part) => {
    const next = {
      ...EMPTY_ITEM,
      descripcion: getPartDisplayName(part),
      cantidad: 1,
      importe: getPartSalePrice(part),
      tipo: invoiceMode.itemType,
      kind: invoiceMode.itemType,
      precioCompra: getPartPurchasePrice(part),
      idProveedor: getPartProviderId(part),
      proveedor: getPartProviderName(part),
      repuestoStockId: getPartId(part),
    };

    setItems((prev) => {
      const emptyIndex = prev.findIndex(
        (item) => !String(item.descripcion || "").trim() && !Number(item.importe || 0),
      );
      if (emptyIndex < 0) return [...prev, next];
      return prev.map((item, index) => (index === emptyIndex ? next : item));
    });
  };

  const emitInvoice = async () => {
    const billableItems = items
      .filter(
        (item) =>
          String(item.descripcion || "").trim() &&
          Number(item.cantidad || 0) > 0 &&
          Number(item.importe || 0) > 0,
      )
      .map((item) => ({
        ...item,
        cantidad: getSignedQuantity(item, invoiceMode),
        importe: Math.abs(Number(item.importe || 0)),
        tipo: invoiceMode.itemType,
        kind: invoiceMode.itemType,
      }));

    if (!invoice.cliente.trim()) throw new Error("El cliente es requerido.");
    if (!billableItems.length) {
      throw new Error(`Agrega al menos una línea de ${invoiceMode.titleLower} con importe mayor que 0.`);
    }
    if (!isCredit && !isCashPayment && bankAccounts.length > 1 && !selectedBankId) {
      throw new Error("Selecciona el banco para esta factura.");
    }
    if (isCredit && !accountsReceivableEnabled) {
      throw new Error("El módulo de cuentas por cobrar no está habilitado para este taller.");
    }
    if (!invoiceMode.isRapel && franchiseAmount > total) {
      throw new Error("La franquicia no puede superar el total de la factura.");
    }

    const effectiveBankAccountId =
      !isCredit && !isCashPayment && selectedBankId ? Number(selectedBankId) : null;

    const res = await api.post("/FacturaEmitida/emitir", {
      tipoFactura: invoiceMode.tipoFactura,
      serie: getSerieForMode(taller, invoiceMode),
      idCliente: invoice.idCliente ? Number(invoice.idCliente) : null,
      fecha: invoice.fecha,
      cliente: invoice.cliente,
      dni: invoice.dni || null,
      direccionCliente: invoice.direccionCliente || null,
      codigoPostalCliente: invoice.codigoPostalCliente || null,
      poblacionCliente: invoice.poblacionCliente || null,
      provinciaCliente: invoice.provinciaCliente || null,
      telefonoCliente: invoice.telefonoCliente || null,
      clasificacionCliente: invoice.clasificacion || "Particular",
      franquiciaImporte: isInsuranceCustomer ? franchiseAmount : 0,
      matricula: invoice.matricula || null,
      km: invoice.km ? String(invoice.km) : null,
      marca: invoice.marca || null,
      modelo: invoice.modelo || null,
      observaciones: invoice.observaciones || null,
      tipoOperacion: invoiceMode.operationType,
      ivaPct: Number(invoice.ivaPct || 0),
      tipoPago: effectiveTipoPago,
      metodoPagoDetalle: isCredit ? "Pago a credito" : invoice.tipoPago,
      totalAbonado: isCredit || invoiceMode.isRapel ? 0 : companyPayable,
      plazoCreditoDias: isCredit ? Number(invoice.plazoCreditoDias || 30) : null,
      fechaVencimiento: isCredit ? invoice.fechaVencimiento || null : null,
      bankAccountId: effectiveBankAccountId,
      items: billableItems,
    });

    if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
      throw new Error(res?.data?.message || res?.data?.Message || "No se pudo emitir la factura.");
    }

    const created =
      res?.data?.data?.[0] ||
      res?.data?.Data?.[0] ||
      {};
    return {
      numeroFactura: created.numeroFactura ?? created.NumeroFactura ?? "",
      idCliente:
        created.idCliente ??
        created.IdCliente ??
        created.numeroCliente ??
        created.NumeroCliente ??
        "",
    };
  };

  const printInvoice = async () => {
    try {
      setSaving(true);
      setError("");
      setNotice("");
      const emitted = await emitInvoice();
      const numeroFactura = emitted.numeroFactura;
      if (!numeroFactura) throw new Error("No se recibio el numero de factura emitida.");
      setInvoice((prev) => ({
        ...prev,
        numero: numeroFactura,
        idCliente: emitted.idCliente || prev.idCliente,
        numeroCliente: emitted.idCliente || prev.numeroCliente,
      }));
      setNotice(`${invoiceMode.title} emitida correctamente.`);
      navigate(
        `/reprint-invoice/number/${encodeURIComponent(numeroFactura)}?autoprint=1&returnTo=${encodeURIComponent("/invoices-history")}`,
        { replace: true },
      );
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          `No se pudo emitir la ${invoiceMode.titleLower}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="rounded-2xl bg-white/80 p-6 ring-1 ring-slate-200">Cargando factura...</section>;
  }

  if (!moduleEnabled) {
    return (
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="text-xl font-bold text-slate-900">{invoiceMode.title} desactivada</h2>
        <p className="mt-2 text-sm text-slate-600">
          El módulo de {invoiceMode.titleLower} no está habilitado para este taller.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-white hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
      </section>
    );
  }

  const printableItems = items
    .filter((item) => String(item.descripcion || "").trim())
    .map((item) => ({
      ...item,
      cantidad: getSignedQuantity(item, invoiceMode),
      importe: Math.abs(Number(item.importe || 0)),
      tipo: invoiceMode.itemType,
      kind: invoiceMode.itemType,
    }));
  const documentTaller = {
    ...taller,
    iban: selectedBankIban || taller.iban,
  };

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{invoiceMode.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {invoiceMode.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printInvoice}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            <Printer size={18} />
            {saving ? "Emitiendo..." : "Emitir e imprimir"}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-white transition hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
        </div>
      </div>

      {error && (
        <div className="no-print mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="no-print mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {notice}
        </div>
      )}
      <section className="no-print mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4 rounded-2xl bg-white/90 p-5 ring-1 ring-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cliente</h3>
            <div className="relative mt-3">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-slate-500" />
                <input
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                  placeholder="Buscar cliente registrado"
                  className={`${inputCls} w-full`}
                />
              </div>
              {clientResults.length > 0 && (
                <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  {clientResults.map((client) => {
                    const id = client.id ?? client.Id;
                    const name = client.nombre ?? client.Nombre;
                    const phone = client.telefono ?? client.Telefono;
                    const nif = client.dni ?? client.Dni;                    
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-orange-50"
                      >
                        <span className="block font-bold text-slate-900">{name}</span>
                        <span className="text-xs text-slate-500">
                          {[nif, phone].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {hasSelectedClient && !showClientForm && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-slate-700">
              <p className="font-bold text-slate-900">{invoice.cliente}</p>
              <p className="mt-1">
                {[invoice.dni, invoice.telefonoCliente].filter(Boolean).join(" · ") ||
                  "Sin DNI/telefono"}
              </p>
              {(invoice.matricula || invoice.marca || invoice.modelo) && (
                <p className="mt-1 text-xs text-slate-500">
                  {[invoice.matricula, invoice.marca, invoice.modelo]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowClientForm((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <UserPlus size={17} />
            {showClientForm
              ? "Ocultar formulario"
              : hasSelectedClient
                ? "Editar datos"
                : "Nuevo cliente"}
          </button>

          {showClientForm && (
            <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Cliente" value={invoice.cliente} onChange={(v) => setInvoiceField("cliente", v)} />
            <Input label="NIF/DNI" value={invoice.dni} onChange={(v) => setInvoiceField("dni", v)} />
            <Input label="Telefono" value={invoice.telefonoCliente} onChange={(v) => setInvoiceField("telefonoCliente", v)} />
            <Input label="Direccion" value={invoice.direccionCliente} onChange={(v) => setInvoiceField("direccionCliente", v)} />
            <Input label="Código postal" value={invoice.codigoPostalCliente} onChange={(v) => setInvoiceField("codigoPostalCliente", v)} />
            <Input label="Poblacion" value={invoice.poblacionCliente} onChange={(v) => setInvoiceField("poblacionCliente", v)} />
            <Input label="Provincia" value={invoice.provinciaCliente} onChange={(v) => setInvoiceField("provinciaCliente", v)} />
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Clasificacion
              <select
                value={invoice.clasificacion}
                onChange={(event) => setInvoiceField("clasificacion", event.target.value)}
                className={inputCls}
              >
                <option value="Particular">Particular</option>
                <option value="Empresa">Empresa</option>
                <option value="Compania de seguro">Compania de seguro</option>
              </select>
            </label>
            {isInsuranceCustomer && (
              <Input
                label="Franquicia"
                type="number"
                value={invoice.franquiciaImporte}
                onChange={(v) => setInvoiceField("franquiciaImporte", v)}
              />
            )}
          </div>
          {!hasSelectedClient && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {includeVehicle ? "Vehiculo incluido en el registro" : "Registrar vehiculo ahora"}
                </p>
                <p className="text-xs text-slate-500">
                  Puedes guardar solo el cliente y asociarle un vehiculo despues.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIncludeVehicle((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <Plus size={16} />
                {includeVehicle ? "Quitar vehiculo" : "Agregar vehiculo"}
              </button>
            </div>
          )}
          {!hasSelectedClient && includeVehicle && (
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
              <Input label="Matricula" value={invoice.matricula} onChange={(v) => setInvoiceField("matricula", v)} />
              <Input label="Bastidor" value={invoice.bastidor} onChange={(v) => setInvoiceField("bastidor", v)} />
              <Input label="Km" value={invoice.km} onChange={(v) => setInvoiceField("km", v)} />
              <Input label="Marca" value={invoice.marca} onChange={(v) => setInvoiceField("marca", v)} />
              <Input label="Modelo" value={invoice.modelo} onChange={(v) => setInvoiceField("modelo", v)} />
              <Input label="Fecha matriculacion" type="date" value={invoice.fechaMatriculacion} onChange={(v) => setInvoiceField("fechaMatriculacion", v)} />
              <Input label="Motor" value={invoice.motor} onChange={(v) => setInvoiceField("motor", v)} />
              <Input label="KW" type="number" value={invoice.kw} onChange={(v) => setInvoiceField("kw", v)} />
              <Input label="CV" type="number" value={invoice.cv} onChange={(v) => setInvoiceField("cv", v)} />
              <Input label="Combustible" value={invoice.combustible} onChange={(v) => setInvoiceField("combustible", v)} />
            </div>
          )}
          {!hasSelectedClient && (
            <button
              type="button"
              onClick={saveClientFromInvoice}
              disabled={savingCustomer}
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {savingCustomer ? "Guardando cliente..." : "Guardar cliente"}
            </button>
          )}
            </>
          )}

          <div>
            <h3 className="mb-3 text-lg font-bold text-slate-900">{invoiceMode.linesTitle}</h3>
            {invoiceMode.usesParts && (
              <PartPicker
                onSelect={addPart}
                placeholder="Buscar recambio en stock"
                buttonLabel="Agregar"
                allowCreate
              />
            )}
            <div className="mt-4 space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_90px_120px_44px]">
                  <input
                    value={item.descripcion}
                    onChange={(event) => setItem(index, "descripcion", event.target.value)}
                    placeholder={invoiceMode.linePlaceholder}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.cantidad}
                    onChange={(event) => setItem(index, "cantidad", event.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.importe}
                    onChange={(event) => setItem(index, "importe", event.target.value)}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100"
                    title="Quitar línea"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              <Plus size={17} />
              Agregar línea manual
            </button>
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl bg-white/90 p-5 ring-1 ring-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Datos de factura</h3>
          <Input label="Numero" value={invoice.numero} readOnly />
          <Input
            label="Fecha"
            type="date"
            value={invoice.fecha}
            min={currentFiscalYearStart()}
            max={localDateInputValue()}
            onChange={(v) => setInvoiceField("fecha", v)}
          />
          <label className="block text-sm font-medium text-slate-700">
            Metodo de pago
            <select
              value={invoice.tipoPago}
              onChange={(event) => setInvoiceField("tipoPago", event.target.value)}
              className={`${inputCls} mt-1 w-full`}
            >
              {PAYMENT_OPTIONS.filter((option) => accountsReceivableEnabled || option.value !== "Credito").map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {isCredit && (
            <div className="grid grid-cols-1 gap-3">
              <Input
                label="Plazo crédito días"
                type="number"
                value={invoice.plazoCreditoDias}
                onChange={(v) => setInvoiceField("plazoCreditoDias", v)}
              />
              <Input
                label="Fecha vencimiento"
                type="date"
                value={invoice.fechaVencimiento}
                onChange={(v) => setInvoiceField("fechaVencimiento", v)}
              />
            </div>
          )}
          {!isCredit && !isCashPayment && bankAccounts.length > 0 && (
            <label className="block text-sm font-medium text-slate-700">
              Banco
              <select
                value={selectedBankId}
                onChange={(event) => setSelectedBankId(event.target.value)}
                className={`${inputCls} mt-1 w-full`}
              >
                {bankAccounts.map((bank) => {
                  const id = bank.id ?? bank.Id;
                  return (
                    <option key={id} value={id}>
                      {bank.nombre ?? bank.Nombre}
                    </option>
                  );
                })}
              </select>
            </label>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Observaciones
            <textarea
              value={invoice.observaciones}
              onChange={(event) => setInvoiceField("observaciones", event.target.value)}
              rows={4}
              className={`${inputCls} mt-1 w-full`}
            />
          </label>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
            <div className="flex justify-between">
              <span>Base imponible</span>
              <strong>{eur.format(subtotal)}</strong>
            </div>
            <div className="mt-2 flex justify-between">
              <span>IVA {invoice.ivaPct}%</span>
              <strong>{eur.format(iva)}</strong>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base text-slate-900">
              <span>Total</span>
              <strong>{eur.format(total)}</strong>
            </div>
            {isInsuranceCustomer && (
              <>
                <div className="mt-2 flex justify-between text-slate-700">
                  <span>Franquicia</span>
                  <strong>{eur.format(franchiseAmount)}</strong>
                </div>
                <div className="mt-2 flex justify-between text-slate-900">
                  <span>Paga compania</span>
                  <strong>{eur.format(companyPayable)}</strong>
                </div>
              </>
            )}
          </div>
        </aside>
      </section>

      {usesZagaInvoiceTemplate(taller) ? (
        <ZagaInvoiceDocument
          taller={documentTaller}
          invoice={{
            ...invoice,
            tipoFactura: invoiceMode.tipoFactura,
            tipoOperacion: invoiceMode.operationType,
            franquiciaImporte: franchiseAmount,
            clasificacionCliente: invoice.clasificacion,
            bankAccountName: isCredit ? "" : selectedBankName,
            bankAccountIban: isCredit ? "" : selectedBankIban,
            totalAbonado: 0,
            saldoPendiente: isCredit ? companyPayable : 0,
          }}
          items={printableItems}
          totals={totals}
          selectedPaymentMethods={[{ label: invoice.tipoPago }]}
        />
      ) : (
        <StandardInvoiceDocument
          taller={documentTaller}
          invoice={{
            ...invoice,
            tipoFactura: invoiceMode.tipoFactura,
            tipoOperacion: invoiceMode.operationType,
            franquiciaImporte: franchiseAmount,
            clasificacionCliente: invoice.clasificacion,
            bankAccountName: isCredit ? "" : selectedBankName,
            bankAccountIban: isCredit ? "" : selectedBankIban,
            totalAbonado: 0,
            saldoPendiente: isCredit ? companyPayable : 0,
          }}
          items={printableItems}
          totals={totals}
        />
      )}
    </>
  );
}

function Input({ label, value, onChange, type = "text", readOnly = false, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value ?? ""}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className={`${inputCls} mt-1 w-full ${readOnly ? "bg-slate-100 text-slate-600" : ""}`}
        {...props}
      />
    </label>
  );
}

function StandardInvoiceDocument({ taller, invoice, items, totals }) {
  const logo = resolveApiAssetUrl(taller.logoUrl) || logoTaller;
  const franchiseAmount = Math.max(0, Number(invoice.franquiciaImporte || 0));
  const isInsuranceInvoice =
    franchiseAmount > 0 ||
    String(invoice.clasificacionCliente || invoice.clasificacion || "").toLowerCase().includes("seguro");
  const companyPayable = Math.max(0, Number(totals.total || 0) - franchiseAmount);

  return (
    <section className="invoice-print rounded-2xl bg-white p-8 text-slate-950 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <img src={logo} alt="Logo taller" className="h-16 max-w-56 object-contain" />
          <h1 className="mt-5 text-2xl font-bold">
            {invoice.tipoFactura === "Rapel"
              ? "Factura Rapel"
              : invoice.tipoFactura === "SinIva"
                ? "Factura sin IVA"
                : "Factura especial de recambio"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{invoice.numero}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold">{taller.razonSocial || taller.nombre}</p>
          <p>{taller.nif}</p>
          <p>{taller.direccion}</p>
          <p>{taller.telefono}</p>
          <p>{taller.email}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div>
          <InvoiceCustomerBox invoice={invoice} />
        </div>
        <div className="md:text-right">
          <p>Fecha: {invoice.fecha}</p>
          <p>Pago: {isCredit ? "Pago a credito" : invoice.tipoPago}</p>
          {invoice.fechaVencimiento && <p>Vencimiento: {invoice.fechaVencimiento}</p>}
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left">
            <th className="py-2">Descripcion</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">Precio</th>
            <th className="py-2 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const quantity = Number(item.cantidad || 0);
            const price = Number(item.importe || 0);
            return (
              <tr key={index} className="border-b border-slate-100">
                <td className="py-2">{item.descripcion}</td>
                <td className="py-2 text-right">{quantity}</td>
                <td className="py-2 text-right">{eur.format(price)}</td>
                <td className="py-2 text-right">{eur.format(quantity * price)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Base imponible</span>
          <strong>{eur.format(totals.subtotal)}</strong>
        </div>
        <div className="flex justify-between">
          <span>IVA</span>
          <strong>{eur.format(totals.iva)}</strong>
        </div>
        <div className="flex justify-between border-t border-slate-300 pt-2 text-base">
          <span>Total</span>
          <strong>{eur.format(totals.total)}</strong>
        </div>
        {isInsuranceInvoice && (
          <>
            <div className="flex justify-between">
              <span>Franquicia</span>
              <strong>{eur.format(franchiseAmount)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Paga compania</span>
              <strong>{eur.format(companyPayable)}</strong>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function InvoiceCustomerBox({ invoice }) {
  const cityLine = [invoice.codigoPostalCliente, invoice.poblacionCliente]
    .filter(Boolean)
    .join("-");

  return (
    <div className="relative min-h-[96px] max-w-sm px-9 py-5 text-left text-[12px] uppercase leading-[1.18] text-black">
      <InvoiceCustomerCorner className="left-0 top-0 border-l-2 border-t-2 border-black" />
      <InvoiceCustomerCorner className="right-0 top-0 border-r-2 border-t-2 border-black" />
      <InvoiceCustomerCorner className="bottom-0 left-0 border-b-2 border-l-2 border-black" />
      <InvoiceCustomerCorner className="bottom-0 right-0 border-b-2 border-r-2 border-black" />
      <div className="font-extrabold">{invoice.cliente || ""}</div>
      {invoice.direccionCliente && <div>{invoice.direccionCliente}</div>}
      {cityLine && <div>{cityLine}</div>}
      {invoice.provinciaCliente && <div>{invoice.provinciaCliente}</div>}
      {invoice.telefonoCliente && <div>{invoice.telefonoCliente}</div>}
    </div>
  );
}

function InvoiceCustomerCorner({ className }) {
  return <span className={`absolute h-8 w-8 ${className}`} />;
}
