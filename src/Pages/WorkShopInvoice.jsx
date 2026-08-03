import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Printer, Wrench } from "lucide-react";
import api, { resolveApiAssetUrl } from "../Components/api";
import logoTaller from "../assets/LogoTallerCrowned.png";
import { useBusinessTerminology } from "../utils/businessTerminology";
import ZagaInvoiceDocument, {
  usesZagaInvoiceTemplate,
} from "../Components/ZagaInvoiceDocument";
import PartPicker, {
  getPartDisplayName,
  getPartId,
  getPartProviderId,
  getPartProviderName,
  getPartPurchasePrice,
  getPartSalePrice,
} from "../Components/PartPicker";
import { amountInput } from "../utils/currency";
import {
  currentFiscalYearStart,
  localDateInputValue,
} from "../utils/date";
import { buildInvoicePaymentContract } from "../utils/invoicePayment";

const EMPTY_ITEM = {
  codigo: "",
  section: "ManoObra",
  descripcion: "",
  cantidad: 1,
  tiempo: 1,
  precioUnitario: 0,
  descuentoPct: 0,
  ivaPct: 21,
  importe: 0,
};

const FREQUENT_SERVICES = [
  "Servicio cambio de aceite y filtro",
  "Cambio de pastillas de frenos",
  "Cambio de rodamientos delanteros",
  "Cambio de amortiguadores",
  "Mano de obra",
  "Repuestos",
];

const SERVICE_PREFIX = "Servicio ";
const normalizeFrequentServiceName = (value) => {
  const name = value.trim();
  if (!name) return "";
  return /^servicio\b/i.test(name) ? name : `${SERVICE_PREFIX}${name}`;
};

const DEFAULT_TALLER = {
  nombre: "Multiservicios Crower",
  razonSocial: "JUAN CARLOS FERNANDEZ SILVA",
  nif: " 61407055E",
  direccion: "CALLE ALCACER 63 D, Albal, 46470",
  telefono: "960057935/655042253",
  email: "multiservicioscrower@gmail.com",
  iban: "ES69 2100 4014 9122 0012 3843",
  serieFactura: "A",
  logoUrl: "",
  documentTemplateKey: "",
  allowInvoiceClientEdit: false,
  enableDetailedRepairInvoiceLines: false,
  enableAccountsReceivable: false,
};

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const PAYMENT_METHODS = [
  { key: "efectivo", label: "Efectivo" },
  { key: "transferencia", label: "Transferencia" },
  { key: "tdc", label: "TPV" },
  { key: "bizum", label: "Bizum" },
];

const EMPTY_PAYMENT_METHODS = PAYMENT_METHODS.reduce(
  (acc, method) => ({
    ...acc,
    [method.key]: {
      checked: false,
      amount: "",
      bankAccountId: "",
    },
  }),
  {},
);

const inputCls = "rounded-xl border border-slate-300 px-3 py-2 text-sm";
const lockedInputCls =
  "rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600";

export default function WorkshopInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const labels = useBusinessTerminology();

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [frequentServices, setFrequentServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState(SERVICE_PREFIX);
  const [savingService, setSavingService] = useState(false);

  const [order, setOrder] = useState(null);

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
    clasificacionCliente: "Particular",
    franquiciaImporte: "",
    matricula: "",
    km: "",
    observaciones: "",
    tipoOperacion: "Mecanica",
    ivaPct: 21,
    otros: "",
    tipoPago: "Contado",
    plazoCreditoDias: 30,
    fechaVencimiento: "",
  });

  const [taller, setTaller] = useState(DEFAULT_TALLER);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState(EMPTY_PAYMENT_METHODS);

  const [items, setItems] = useState([
    { descripcion: "Repuestos", cantidad: 1, importe: 0 },
    { descripcion: "Mano de obra", cantidad: 1, importe: 0 },
  ]);

  const clientFieldsLocked = Boolean(id) && !taller.allowInvoiceClientEdit;

  const normalizeOrder = (o) => ({
    id: o.id ?? o.Id,
    idCliente: o.idCliente ?? o.IdCliente ?? o.numeroCliente ?? o.NumeroCliente ?? "",
    numeroCliente: o.numeroCliente ?? o.NumeroCliente ?? o.idCliente ?? o.IdCliente ?? "",
    cliente: o.cliente ?? o.Cliente ?? "",
    dni: o.dni ?? o.Dni ?? "",
    telefono: o.telefono ?? o.Telefono ?? "",
    direccionCliente:
      o.direccionCliente ?? o.DireccionCliente ?? o.direccion ?? o.Direccion ?? "",
    codigoPostal: o.codigoPostal ?? o.CodigoPostal ?? "",
    poblacion: o.poblacion ?? o.Poblacion ?? "",
    provincia: o.provincia ?? o.Provincia ?? "",
    matricula: o.matricula ?? o.Matricula ?? "",
    bastidor: o.bastidor ?? o.Bastidor ?? "",
    marca: o.marca ?? o.Marca ?? "",
    modelo: o.modelo ?? o.Modelo ?? "",
    fechaMatriculacion: o.fechaMatriculacion ?? o.FechaMatriculacion ?? "",
    motor: o.motor ?? o.Motor ?? "",
    kilometraje: o.kilometraje ?? o.Kilometraje ?? "",
    tipoOperacion: o.tipoOperacion ?? o.TipoOperacion ?? "Mecanica",
    trabajo: o.trabajo ?? o.Trabajo ?? "",
    itemsJson: o.itemsJson ?? o.ItemsJson ?? null,
    repuestos: Number(o.repuestos ?? o.Repuestos ?? 0),
    cantidad: Number(o.cantidad ?? o.Cantidad ?? 1),
    manoObra: Number(o.manoObra ?? o.ManoObra ?? 0),
    estado: o.estado ?? o.Estado ?? "",
    observaciones: o.observaciones ?? o.Observaciones ?? "",
    otros: Number(o.otros ?? o.Otros ?? 0),
  });

  const normalizeCustomer = (c) => ({
    id: c.id ?? c.Id ?? "",
    nombre: c.nombre ?? c.Nombre ?? "",
    dni: c.dni ?? c.Dni ?? "",
    telefono: c.telefono ?? c.Telefono ?? "",
    direccion: c.direccion ?? c.Direccion ?? "",
    codigoPostal: c.codigoPostal ?? c.CodigoPostal ?? "",
    poblacion: c.poblacion ?? c.Poblacion ?? "",
    provincia: c.provincia ?? c.Provincia ?? "",
    clasificacion: c.clasificacion ?? c.Clasificacion ?? "Particular",
    matricula: c.matricula ?? c.Matricula ?? "",
  });

  const findCustomerAddressForOrder = async (orderData) => {
    const matricula = String(orderData.matricula || "").trim();
    const cliente = String(orderData.cliente || "").trim();

    try {
      const res = await api.get("/Cliente", {
        params: matricula
          ? { matricula, page: 1, pageSize: 10 }
          : { search: cliente, page: 1, pageSize: 10 },
      });
      const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0];
      const customers = Array.isArray(pack?.items)
        ? pack.items.map(normalizeCustomer)
        : Array.isArray(pack?.Items)
          ? pack.Items.map(normalizeCustomer)
        : [];

      const exactMatch =
        customers.find(
          (item) =>
            matricula &&
            item.matricula?.toUpperCase() === matricula.toUpperCase(),
        ) ||
        customers.find(
          (item) =>
            cliente &&
            item.nombre?.trim().toLowerCase() === cliente.toLowerCase(),
        ) ||
        customers[0];

      return exactMatch || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // useEffect(() => {
  //   if (id) {
  //     loadOrder();
  //   } else {
  //     setLoading(false);
  //   }
  // }, [id]);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      const settings = await loadWorkshopSettings();
      if (alive) await loadBankAccounts();
      if (alive) await loadFrequentServices();
      if (alive) await loadInvoice(settings?.serieFactura || "A");
    };
    init();
    return () => {
      alive = false;
    };
  }, [id]);

  const loadFrequentServices = async () => {
    try {
      const res = await api.get("/ServicioFrecuente");
      const list = res?.data?.data?.[0] || [];
      const names = list
        .map((x) => x.nombre ?? x.Nombre)
        .filter(Boolean);
      setFrequentServices(names.length ? names : FREQUENT_SERVICES);
    } catch (err) {
      console.error(err);
      setFrequentServices(FREQUENT_SERVICES);
    }
  };

  const loadWorkshopSettings = async () => {
    try {
      const res = await api.get("/WorkshopSettings");
      const data = res?.data || {};

      const next = {
        nombre: data.nombre ?? data.Nombre ?? DEFAULT_TALLER.nombre,
        razonSocial: data.razonSocial ?? data.RazonSocial ?? DEFAULT_TALLER.razonSocial,
        nif: data.nif ?? data.Nif ?? DEFAULT_TALLER.nif,
        direccion: data.direccion ?? data.Direccion ?? DEFAULT_TALLER.direccion,
        telefono: data.telefono ?? data.Telefono ?? DEFAULT_TALLER.telefono,
        email: data.email ?? data.Email ?? DEFAULT_TALLER.email,
        iban: data.iban ?? data.Iban ?? DEFAULT_TALLER.iban,
        serieFactura: data.serieFactura ?? data.SerieFactura ?? DEFAULT_TALLER.serieFactura,
        logoUrl: data.logoUrl ?? data.LogoUrl ?? DEFAULT_TALLER.logoUrl,
        documentTemplateKey:
          data.documentTemplateKey ??
          data.DocumentTemplateKey ??
          DEFAULT_TALLER.documentTemplateKey,
        allowInvoiceClientEdit:
          data.allowInvoiceClientEdit ??
          data.AllowInvoiceClientEdit ??
          DEFAULT_TALLER.allowInvoiceClientEdit,
        enableDetailedRepairInvoiceLines:
          data.enableDetailedRepairInvoiceLines ??
          data.EnableDetailedRepairInvoiceLines ??
          DEFAULT_TALLER.enableDetailedRepairInvoiceLines,
        enableAccountsReceivable:
          data.enableAccountsReceivable ??
          data.EnableAccountsReceivable ??
          DEFAULT_TALLER.enableAccountsReceivable,
      };
      setTaller(next);
      return next;
    } catch {
      setTaller(DEFAULT_TALLER);
      return DEFAULT_TALLER;
    }
  };

  const loadInvoice = async (serieFactura = taller.serieFactura || "A") => {
    try {
      setLoading(true);
      setError("");

      const previewRes = await api.get("/NumeradorFactura/preview", {
        params: { serie: serieFactura || "A" },
      });

      const numeroFacturaPrev =
        previewRes?.data?.data?.[0]?.numeroFactura || "";

      if (id) {
        await loadOrder(numeroFacturaPrev);
      } else {
        setInvoice((prev) => ({
          ...prev,
          numero: numeroFacturaPrev,
        }));

        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo generar el numero de factura.",
      );
      setLoading(false);
    }
  };

  const loadOrder = async (numeroFacturaPrev) => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/OrdenTrabajo/${id}`);
      const raw = res?.data?.data?.[0];

      const o = normalizeOrder(raw);
      setOrder(o);
      const customerForOrder = await findCustomerAddressForOrder(o);
      const direccionCliente = o.direccionCliente || customerForOrder?.direccion || "";

      setInvoice((prev) => ({
        ...prev,
        numero: numeroFacturaPrev,
        idCliente: o.idCliente || customerForOrder?.id || "",
        numeroCliente: o.numeroCliente || o.idCliente || customerForOrder?.id || "",
        cliente: o.cliente,
        dni: o.dni,
        direccionCliente,
        codigoPostalCliente: o.codigoPostal || customerForOrder?.codigoPostal || "",
        poblacionCliente: o.poblacion || customerForOrder?.poblacion || "",
        provinciaCliente: o.provincia || customerForOrder?.provincia || "",
        clasificacionCliente: customerForOrder?.clasificacion || "Particular",
        franquiciaImporte: "",
        telefonoCliente: o.telefono,
        matricula: o.matricula,
        chasis: o.bastidor,
        bastidor: o.bastidor,
        motor: o.motor,
        marca: o.marca,
        modelo: o.modelo,
        marcaModelo: [o.marca, o.modelo].filter(Boolean).join(" "),
        fechaMatriculacion: o.fechaMatriculacion,
        km: o.kilometraje || "",
        observaciones: o.observaciones || "",
        tipoOperacion: o.tipoOperacion || "Mecanica",
        otros: o.otros || "",
      }));

      const orderItems = parseOrderItems(o.itemsJson);
      setItems(
        orderItems.length > 0
          ? orderItems
          : [
              {
                descripcion: o.trabajo || "Trabajo realizado",
                cantidad: Number(o.cantidad || 1),
                importe: Number(o.repuestos || 0),
              },
              {
                descripcion: "Mano de obra",
                cantidad: 1,
                importe: Number(o.manoObra || 0),
              },
            ],
      );
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar la orden.",
      );
    } finally {
      setLoading(false);
    }
  };

  const baseAntesOtros = useMemo(() => {
    return round2(
      items.reduce(
        (sum, item) =>
          sum + Number(item.cantidad || 0) * Number(item.importe || 0),
        0,
      ),
    );
  }, [items]);

  const otros = useMemo(() => {
    return round2(Number(invoice.otros || 0));
  }, [invoice.otros]);

  const subtotal = useMemo(() => {
    return round2(Math.max(0, baseAntesOtros - otros));
  }, [baseAntesOtros, otros]);

  const iva = useMemo(() => {
    return round2(subtotal * (Number(invoice.ivaPct || 0) / 100));
  }, [subtotal, invoice.ivaPct]);

  const totalFinal = useMemo(() => {
    return round2(subtotal + iva);
  }, [subtotal, iva]);

  const isInsuranceCustomer = useMemo(() => {
    return String(invoice.clasificacionCliente || "")
      .trim()
      .toLowerCase()
      .includes("seguro");
  }, [invoice.clasificacionCliente]);

  const franchiseAmount = useMemo(() => {
    if (!isInsuranceCustomer) return 0;
    return round2(Math.max(0, Number(invoice.franquiciaImporte || 0)));
  }, [isInsuranceCustomer, invoice.franquiciaImporte]);

  const companyPayable = useMemo(() => {
    return round2(Math.max(0, totalFinal - franchiseAmount));
  }, [totalFinal, franchiseAmount]);
  const useDetailedRepairLines = Boolean(taller.enableDetailedRepairInvoiceLines);

  const selectedPaymentMethods = useMemo(
    () =>
      PAYMENT_METHODS.map((method) => {
        const bankAccountId = paymentMethods[method.key]?.bankAccountId || "";
        const bank = bankAccounts.find(
          (item) => String(item.id ?? item.Id) === String(bankAccountId),
        );

        return {
          ...method,
          amount: round2(Number(paymentMethods[method.key]?.amount || 0)),
          rawAmount: paymentMethods[method.key]?.amount || "",
          checked: Boolean(paymentMethods[method.key]?.checked),
          bankAccountId,
          bankAccountName: bank?.nombre ?? bank?.Nombre ?? "",
          bankAccountIban: bank?.iban ?? bank?.Iban ?? "",
        };
      }).filter((method) => method.checked),
    [bankAccounts, paymentMethods],
  );

  const paymentTotal = useMemo(
    () =>
      round2(
        selectedPaymentMethods.reduce(
          (sum, method) => sum + Number(method.amount || 0),
          0,
        ),
      ),
    [selectedPaymentMethods],
  );

  const paymentDifference = useMemo(
    () => round2(companyPayable - paymentTotal),
    [companyPayable, paymentTotal],
  );

  const hasPaymentMethods = selectedPaymentMethods.length > 0;
  const isCredit = invoice.tipoPago === "Credito";
  const accountsReceivableEnabled = Boolean(taller.enableAccountsReceivable);
  const paymentContract = buildInvoicePaymentContract({
    isCredit,
    selectedPaymentMethods,
    selectedBankId,
  });
  const { backendTipoPago, bankAccountId, pagos } = paymentContract;
  const paymentDetailText = useMemo(() => {
    if (isCredit) return "Pago a credito";
    const selectedLabels = selectedPaymentMethods
      .map((method) =>
        method.amount > 0 ? `${method.label} ${formatMoney(method.amount)}` : method.label,
      )
      .join(" / ");
    if (selectedLabels) return selectedLabels;
    return invoice.tipoPago;
  }, [invoice.tipoPago, isCredit, selectedPaymentMethods]);
  const hasTransferPayment = useMemo(
    () =>
      selectedPaymentMethods.some((method) => method.key === "transferencia") ||
      String(paymentDetailText || "").toLowerCase().includes("transferencia"),
    [paymentDetailText, selectedPaymentMethods],
  );
  const selectedBank = useMemo(() => {
    const firstBankPayment = selectedPaymentMethods.find(
      (method) => method.key !== "efectivo" && method.bankAccountId,
    );
    const effectiveBankId = isCredit
      ? selectedBankId
      : firstBankPayment?.bankAccountId || selectedBankId;
    return bankAccounts.find((item) => String(item.id ?? item.Id) === String(effectiveBankId));
  }, [bankAccounts, isCredit, selectedBankId, selectedPaymentMethods]);
  const useZagaTemplate = usesZagaInvoiceTemplate(taller);

  useEffect(() => {
    const iban = selectedBank?.iban ?? selectedBank?.Iban ?? "";
    if (!iban) return;
    setTaller((prev) => (prev.iban === iban ? prev : { ...prev, iban }));
  }, [selectedBank]);

  useEffect(() => {
    if (!isCredit) return;

    const baseDate = invoice.fecha || new Date().toISOString().slice(0, 10);
    const due = new Date(`${baseDate}T00:00:00`);
    due.setDate(due.getDate() + Number(invoice.plazoCreditoDias || 30));
    setInvoice((prev) => ({
      ...prev,
      fechaVencimiento: due.toISOString().slice(0, 10),
    }));
  }, [isCredit, invoice.fecha, invoice.plazoCreditoDias]);

  useEffect(() => {
    if (accountsReceivableEnabled || !isCredit) return;
    setTipoPago("Contado");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsReceivableEnabled, isCredit]);

  const setInvoiceField = (name, value) => {
    setInvoice((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setPaymentMethodChecked = (key, checked) => {
    const mainBank = bankAccounts.find((item) => item.esPrincipal ?? item.EsPrincipal) || bankAccounts[0];
    const defaultBankId = mainBank?.id ?? mainBank?.Id ?? selectedBankId ?? "";
    setPaymentMethods((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        checked,
        amount: checked ? prev[key]?.amount || "" : "",
        bankAccountId:
          checked && key !== "efectivo"
            ? prev[key]?.bankAccountId || String(defaultBankId || "")
            : prev[key]?.bankAccountId || "",
      },
    }));
  };

  const setPaymentMethodAmount = (key, amount) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        amount,
      },
    }));
  };

  const setPaymentMethodBank = (key, bankAccountId) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        bankAccountId,
      },
    }));
  };

  const loadBankAccounts = async () => {
    try {
      const res = await api.get("/WorkshopBankAccounts");
      const banks = Array.isArray(res?.data) ? res.data : [];
      setBankAccounts(banks);

      const main = banks.find((x) => x.esPrincipal ?? x.EsPrincipal) || banks[0];
      const mainId = main?.id ?? main?.Id ?? "";
      const mainIban = main?.iban ?? main?.Iban ?? "";
      if (mainId) {
        const normalizedMainId = String(mainId);
        setSelectedBankId(normalizedMainId);
        setPaymentMethods((prev) =>
          PAYMENT_METHODS.reduce((acc, method) => {
            const current = prev[method.key] || {};
            acc[method.key] = {
              ...current,
              bankAccountId:
                method.key === "efectivo"
                  ? current.bankAccountId || ""
                  : current.bankAccountId || normalizedMainId,
            };
            return acc;
          }, {}),
        );
      }
      if (mainIban) {
        setTaller((prev) => ({
          ...prev,
          iban: mainIban,
        }));
      }
      return banks;
    } catch (err) {
      console.error(err);
      setBankAccounts([]);
      return [];
    }
  };

  const setTipoPago = (tipoPago) => {
    if (tipoPago === "Credito" && !accountsReceivableEnabled) {
      setError("El módulo de cuentas por cobrar no está habilitado para este taller.");
      return;
    }

    setInvoice((prev) => ({
      ...prev,
      tipoPago,
      plazoCreditoDias: tipoPago === "Credito" ? prev.plazoCreditoDias || 30 : 30,
      fechaVencimiento: tipoPago === "Credito" ? prev.fechaVencimiento : "",
    }));

    if (tipoPago === "Credito") {
      setPaymentMethods(EMPTY_PAYMENT_METHODS);
    }
  };

  const setItemField = (index, name, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? normalizeInvoiceLineForTotals(
              {
                ...item,
                [name]: value,
              },
              invoice.ivaPct,
              useDetailedRepairLines,
            )
          : item,
      ),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      normalizeInvoiceLineForTotals(
        {
          ...EMPTY_ITEM,
          section: invoice.tipoOperacion === "Chapa y pintura" ? "ManoObra" : "ManoObra",
          ivaPct: invoice.ivaPct,
        },
        invoice.ivaPct,
        useDetailedRepairLines,
      ),
    ]);
  };

  const addFrequentService = (descripcion) => {
    if (!descripcion) return;
    setItems((prev) => [
      ...prev,
      {
        descripcion,
        cantidad: 1,
        tiempo: 1,
        precioUnitario: 0,
        descuentoPct: 0,
        ivaPct: invoice.ivaPct,
        section: "ManoObra",
        importe: 0,
      },
    ]);
  };

  const addPartItem = (part) => {
    const descripcion = getPartDisplayName(part);
    if (!descripcion) return;

    setItems((prev) => [
      ...prev,
      {
        descripcion,
        cantidad: 1,
        tiempo: 1,
        precioUnitario: getPartSalePrice(part).toFixed(2),
        descuentoPct: 0,
        ivaPct: invoice.ivaPct,
        section: "Piezas",
        importe: getPartSalePrice(part).toFixed(2),
        kind: "repuesto",
        repuestoStockId: getPartId(part),
        idProveedor: getPartProviderId(part),
        nombreProveedor: getPartProviderName(part),
        precioCompra: getPartPurchasePrice(part),
      },
    ]);
  };

  const createFrequentService = async () => {
    const nombre = normalizeFrequentServiceName(newServiceName);
    if (!nombre || nombre.toLowerCase() === "servicio") return;

    try {
      setSavingService(true);
      setError("");
      const res = await api.post("/ServicioFrecuente", { nombre });
      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(res?.data?.message || res?.data?.Message || "No se pudo registrar el servicio.");
      }

      await loadFrequentServices();
      addFrequentService(nombre);
      setNewServiceName(SERVICE_PREFIX);
      setNotice("Servicio frecuente agregado.");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo registrar el servicio.",
      );
    } finally {
      setSavingService(false);
    }
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

const saveIssuedInvoice = async () => {
  const billableItems = items
    .map((item) =>
      normalizeInvoiceLineForTotals(
        item,
        invoice.ivaPct,
        useDetailedRepairLines,
      ),
    )
    .filter(
      (item) =>
        String(item.descripcion || item.codigo || "").trim() &&
        round2(Number(item.cantidad || 0) * Number(item.importe || 0)) > 0,
    );

  if (billableItems.length === 0) {
    throw new Error("La factura debe tener al menos una línea con importe mayor que 0.");
  }

  const payload = {
    idOrdenTrabajo: id ? Number(id) : null,
    fecha: invoice.fecha,
    idCliente: invoice.idCliente ? Number(invoice.idCliente) : null,
    cliente: invoice.cliente,
    dni: invoice.dni || null,
    direccionCliente: invoice.direccionCliente || null,
    codigoPostalCliente: invoice.codigoPostalCliente || null,
    poblacionCliente: invoice.poblacionCliente || null,
    provinciaCliente: invoice.provinciaCliente || null,
    telefonoCliente: invoice.telefonoCliente || null,
    clasificacionCliente: invoice.clasificacionCliente || "Particular",
    franquiciaImporte: isInsuranceCustomer ? franchiseAmount : 0,
    matricula: invoice.matricula || null,
    km: invoice.km ? String(invoice.km) : null,
    otros,
    ivaPct: Number(invoice.ivaPct || 21),
    serie: taller.serieFactura || "A",
    observaciones: invoice.observaciones || null,
    tipoOperacion: invoice.tipoOperacion || "Mecanica",
    tipoPago: backendTipoPago,
    metodoPagoDetalle: paymentDetailText || null,
    totalAbonado: isCredit ? paymentTotal : companyPayable,
    plazoCreditoDias: isCredit ? Number(invoice.plazoCreditoDias || 30) : null,
    fechaVencimiento: isCredit ? invoice.fechaVencimiento || null : null,
    bankAccountId,
    pagos,
    items: billableItems,
  };

  return await api.post("/FacturaEmitida/emitir", payload);
};

const printInvoice = async () => {
  try {
    if (otros < 0 || otros > baseAntesOtros) {
      throw new Error("Otros debe ser un descuento entre 0 y la base de la factura.");
    }

    if (isCredit && !accountsReceivableEnabled) {
      throw new Error("El módulo de cuentas por cobrar no está habilitado para este taller.");
    }

    if (!isCredit && !hasPaymentMethods) {
      throw new Error("Selecciona al menos un metodo de pago.");
    }

    const paymentWithoutAmount = selectedPaymentMethods.find(
      (method) => Number(method.amount || 0) <= 0,
    );
    if (paymentWithoutAmount) {
      throw new Error(`Indica un importe mayor que 0 para ${paymentWithoutAmount.label}.`);
    }

    if (franchiseAmount > totalFinal) {
      throw new Error("La franquicia no puede superar el total de la factura.");
    }

    if (!isCredit && Math.abs(paymentDifference) >= 0.01) {
      throw new Error(
        `La suma de los metodos de pago (${formatMoney(paymentTotal)}) debe coincidir con el importe a pagar por el cliente (${formatMoney(companyPayable)}).`,
      );
    }

    if (isCredit && paymentTotal > companyPayable) {
      throw new Error("El abono inicial no puede superar el importe a pagar por el cliente.");
    }

    const bankPaymentWithoutBank = selectedPaymentMethods.find(
      (method) => method.key !== "efectivo" && !method.bankAccountId,
    );
    if (bankPaymentWithoutBank) {
      throw new Error(`Selecciona el banco para ${bankPaymentWithoutBank.label}.`);
    }

    const res = await saveIssuedInvoice();
    if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
      throw new Error(res?.data?.message || res?.data?.Message || "No se pudo guardar la factura.");
    }

    const numeroFactura =
      res?.data?.data?.[0]?.numeroFactura ||
      res?.data?.data?.[0]?.NumeroFactura ||
      "";
    const emittedInvoice = res?.data?.data?.[0] || res?.data?.Data?.[0] || {};
    const emittedClientId =
      emittedInvoice.idCliente ??
      emittedInvoice.IdCliente ??
      emittedInvoice.numeroCliente ??
      emittedInvoice.NumeroCliente ??
      "";

    if (!numeroFactura) {
      throw new Error("No se recibio el numero de factura emitida.");
    }

    const issuedEvent = {
      type: "tc:invoice-issued",
      idOrden: id ? Number(id) : null,
      numeroFactura,
      issuedAt: new Date().toISOString(),
    };

    setInvoice((prev) => ({
      ...prev,
      numero: numeroFactura,
      idCliente: emittedClientId || prev.idCliente,
      numeroCliente: emittedClientId || prev.numeroCliente,
      metodoPagoDetalle:
        emittedInvoice.metodoPagoDetalle ??
        emittedInvoice.MetodoPagoDetalle ??
        paymentDetailText ??
        prev.metodoPagoDetalle,
      bankAccountName:
        emittedInvoice.bankAccountName ??
        emittedInvoice.BankAccountName ??
        selectedBank?.nombre ??
        selectedBank?.Nombre ??
        prev.bankAccountName,
      bankAccountIban:
        emittedInvoice.bankAccountIban ??
        emittedInvoice.BankAccountIban ??
        selectedBank?.iban ??
        selectedBank?.Iban ??
        prev.bankAccountIban,
      franquiciaImporte:
        emittedInvoice.franquiciaImporte ??
        emittedInvoice.FranquiciaImporte ??
        prev.franquiciaImporte,
      totalAbonado:
        emittedInvoice.totalAbonado ??
        emittedInvoice.TotalAbonado ??
        (isCredit ? paymentTotal : companyPayable),
      saldoPendiente:
        emittedInvoice.saldoPendiente ??
        emittedInvoice.SaldoPendiente ??
        Math.max(0, paymentDifference),
      leyendaPago:
        emittedInvoice.leyendaPago ??
        emittedInvoice.LeyendaPago ??
        prev.leyendaPago,
      clasificacionCliente:
        emittedInvoice.clasificacionCliente ??
        emittedInvoice.ClasificacionCliente ??
        prev.clasificacionCliente,
    }));

    localStorage.setItem("tc:invoice-issued", JSON.stringify(issuedEvent));
    window.dispatchEvent(new CustomEvent("tc:invoice-issued", { detail: issuedEvent }));
    window.dispatchEvent(new Event("tc:client-alerts:refresh"));

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(issuedEvent, window.location.origin);
    }

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
        "No se pudo guardar la factura.",
    );
  }
};

  if (loading) {
    return (
      <section className="rounded-2xl bg-white/80 p-6 ring-1 ring-slate-200">
        Cargando factura...
      </section>
    );
  }

  return (
    <>
      <div className="no-print flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {labels.invoiceTitle}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {id
              ? labels.invoiceFromOrder(id)
              : "Genera una nueva Factura."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printInvoice}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-orange-600 text-white hover:bg-orange-700 transition"
          >
            <Printer size={18} />
            Imprimir
          </button>

          <Link
            to="/register-work-order#ordenes-recientes"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
        </div>
      </div>

      {notice && (
        <div className="no-print mb-4 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 p-3 text-sm">
          {notice}
        </div>
      )}

      {error && (
        <div className="no-print mb-4 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 p-3 text-sm">
          {error}
        </div>
      )}

      <section className="no-print grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Datos del {labels.businessSingular}
          </h3>

          <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            Estos datos pertenecen a la {labels.businessSingular} activa y no se editan desde la factura.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className={lockedInputCls}
              placeholder="Nombre comercial"
              value={taller.nombre}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="Razon social"
              value={taller.razonSocial}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="NIF/CIF"
              value={taller.nif}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="Telefono"
              value={taller.telefono}
              readOnly
            />

            <input
              className={`md:col-span-2 ${lockedInputCls}`}
              placeholder="Direccion"
              value={taller.direccion}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="Email"
              value={taller.email}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="IBAN"
              value={taller.iban}
              readOnly
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Datos de factura
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className={inputCls}
              placeholder="Numero factura"
              value={invoice.numero}
              readOnly
            />

            <input
              type="date"
              className={inputCls}
              value={invoice.fecha}
              min={currentFiscalYearStart()}
              max={localDateInputValue()}
              onChange={(e) => setInvoiceField("fecha", e.target.value)}
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder="Cliente"
              value={invoice.cliente}
              readOnly={clientFieldsLocked}
              onChange={(e) => setInvoiceField("cliente", e.target.value)}
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder="DNI/NIE/NIF"
              value={invoice.dni}
              readOnly={clientFieldsLocked}
              onChange={(e) => setInvoiceField("dni", e.target.value)}
            />

            <input
              className={`md:col-span-2 ${clientFieldsLocked ? lockedInputCls : inputCls}`}
              placeholder="Direccion cliente"
              value={invoice.direccionCliente}
              readOnly={clientFieldsLocked}
              onChange={(e) =>
                setInvoiceField("direccionCliente", e.target.value)
              }
            />
            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder="Código postal"
              value={invoice.codigoPostalCliente}
              readOnly={clientFieldsLocked}
              onChange={(e) =>
                setInvoiceField("codigoPostalCliente", e.target.value)
              }
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder="Poblacion"
              value={invoice.poblacionCliente}
              readOnly={clientFieldsLocked}
              onChange={(e) =>
                setInvoiceField("poblacionCliente", e.target.value)
              }
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder="Provincia"
              value={invoice.provinciaCliente}
              readOnly={clientFieldsLocked}
              onChange={(e) =>
                setInvoiceField("provinciaCliente", e.target.value)
              }
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder="Telefono cliente"
              value={invoice.telefonoCliente}
              readOnly={clientFieldsLocked}
              onChange={(e) =>
                setInvoiceField("telefonoCliente", e.target.value)
              }
            />

            <label className="block text-sm font-semibold text-slate-700">
              Clasificacion
              <select
                className={`mt-1 w-full ${clientFieldsLocked ? lockedInputCls : inputCls}`}
                value={invoice.clasificacionCliente}
                disabled={clientFieldsLocked}
                onChange={(e) => setInvoiceField("clasificacionCliente", e.target.value)}
              >
                <option value="Particular">Particular</option>
                <option value="Empresa">Empresa</option>
                <option value="Compania de seguro">Compania de seguro</option>
              </select>
            </label>

            {isInsuranceCustomer && (
              <input
                type="number"
                step="0.01"
                className={inputCls}
                placeholder="Franquicia"
                value={invoice.franquiciaImporte}
                onChange={(e) => setInvoiceField("franquiciaImporte", e.target.value)}
                onBlur={(e) => setInvoiceField("franquiciaImporte", amountInput(e.target.value))}
              />
            )}

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder={labels.referenceLabel}
              value={invoice.matricula}
              readOnly={clientFieldsLocked}
              onChange={(e) =>
                setInvoiceField("matricula", e.target.value.toUpperCase())
              }
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder={labels.metricLabel}
              value={invoice.km}
              readOnly={clientFieldsLocked}
              onChange={(e) => setInvoiceField("km", e.target.value)}
            />

            <input
              type="number"
              className={inputCls}
              placeholder="IVA %"
              value={invoice.ivaPct}
              onChange={(e) => setInvoiceField("ivaPct", e.target.value)}
            />
            <input
              type="number"
              className={inputCls}
              placeholder="Otros"
              value={invoice.otros}
              min="0"
              max={baseAntesOtros}
              onChange={(e) => setInvoiceField("otros", e.target.value)}
              onBlur={(e) => setInvoiceField("otros", amountInput(e.target.value))}
            />

    {accountsReceivableEnabled && (
            <label className="block text-sm font-semibold text-slate-700">
              Tipo de pago
              <select
                className={`mt-1 w-full ${inputCls}`}
                value={invoice.tipoPago}
                onChange={(e) => setTipoPago(e.target.value)}
              >
                <option value="Contado">Contado</option>
            
                  <option value="Credito">A plazos</option>
               
              </select>
            </label>
 )}
            {isCredit && (
              <>
                <label className="block text-sm font-semibold text-slate-700">
                  Plan de credito
                  <select
                    className={`mt-1 w-full ${inputCls}`}
                    value={invoice.plazoCreditoDias}
                    onChange={(e) =>
                      setInvoiceField("plazoCreditoDias", Number(e.target.value))
                    }
                  >
                    <option value={30}>30 días</option>
                    <option value={60}>60 días</option>
                  </select>
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Cuenta bancaria
                  <select
                    className={`mt-1 w-full ${inputCls}`}
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                  >
                    <option value="">Banco</option>
                    {bankAccounts.map((bank) => {
                      const id = bank.id ?? bank.Id;
                      const name = bank.nombre ?? bank.Nombre ?? "Cuenta bancaria";
                      const iban = bank.iban ?? bank.Iban ?? "";
                      return (
                        <option key={id} value={id}>
                          {name} - {iban}
                        </option>
                      );
                    })}
                  </select>
                </label>

                {/* <label className="block text-sm font-semibold text-slate-700">
                  Fecha de vencimiento
                  <input
                    type="date"
                    className={`mt-1 w-full ${inputCls}`}
                    value={invoice.fechaVencimiento}
                    onChange={(e) =>
                      setInvoiceField("fechaVencimiento", e.target.value)
                    }
                  />
                </label> */}
              </>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Metodos de pago
                </h4>
                <p className="text-xs text-slate-500">
                  {isCredit
                    ? "Registra el abono inicial si el cliente paga una parte."
                    : "La suma debe coincidir con el total antes de imprimir."}
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-600">
                Total factura: {formatMoney(totalFinal)}
                {isInsuranceCustomer && (
                  <> · Paga compania: {formatMoney(companyPayable)}</>
                )}
              </div>
            </div>

            {!isCredit && !hasPaymentMethods && (
              <div className="mt-3 text-sm text-slate-500">
                Por favor, selecciona un método de pago.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {PAYMENT_METHODS.map((method) => {
                const checked = Boolean(paymentMethods[method.key]?.checked);
                return (
                  <div
                    key={method.key}
                    className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setPaymentMethodChecked(method.key, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      {method.label}
                    </label>

                    {checked && (
                      <div className="mt-2 space-y-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          placeholder="Importe"
                          value={paymentMethods[method.key]?.amount || ""}
                          onChange={(e) =>
                            setPaymentMethodAmount(method.key, e.target.value)
                          }
                          onBlur={(e) =>
                            setPaymentMethodAmount(
                              method.key,
                              amountInput(e.target.value),
                            )
                          }
                        />

                        {method.key !== "efectivo" && (
                          <select
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={paymentMethods[method.key]?.bankAccountId || ""}
                            onChange={(e) =>
                              setPaymentMethodBank(method.key, e.target.value)
                            }
                          >
                            <option value="">Banco</option>
                            {bankAccounts.map((bank) => {
                              const id = bank.id ?? bank.Id;
                              const name = bank.nombre ?? bank.Nombre ?? "Cuenta bancaria";
                              const iban = bank.iban ?? bank.Iban ?? "";
                              return (
                                <option key={id} value={id}>
                                  {name} - {iban}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ${
                isCredit || (hasPaymentMethods && Math.abs(paymentDifference) < 0.01)
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-amber-50 text-amber-800 ring-amber-200"
              }`}
            >
              {isCredit ? "Abono inicial" : "Asignado"}:{" "}
              {formatMoney(paymentTotal)} ·{" "}
              {isCredit ? "Saldo pendiente" : "Diferencia"}:{" "}
              {formatMoney(Math.max(0, paymentDifference))}
            </div>
          </div>
        </div>
      </section>

      <section className="no-print rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 shadow-sm mb-8">
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Conceptos</h3>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <PartPicker
              onSelect={addPartItem}
              placeholder="Buscar repuesto"
              buttonLabel="Agregar línea"
              className="w-full sm:w-80"
            />

            <div className="relative">
              <Wrench
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                defaultValue=""
                onChange={(e) => {
                  addFrequentService(e.target.value);
                  e.target.value = "";
                }}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 sm:w-72"
                aria-label="Agregar servicio frecuente"
              >
                <option value="" disabled>
                  Agregar servicio frecuente
                </option>
                {frequentServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 bg-slate-700 text-white hover:bg-slate-800 transition text-sm"
            >
              <Plus size={16} />
              Añadir línea
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nuevo servicio frecuente"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createFrequentService();
              }
            }}
          />
          <button
            type="button"
            onClick={createFrequentService}
            disabled={
              savingService ||
              !newServiceName.trim() ||
              newServiceName.trim().toLowerCase() === "servicio"
            }
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {savingService ? "Guardando..." : "Guardar servicio"}
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const lineTotal = getInvoiceLineTotal(item);
            const qtyLabel = item.section === "Piezas" ? "Cantidad" : "Tiempo";

            return (
              <div
                key={index}
                className={
                  useDetailedRepairLines
                    ? "grid grid-cols-1 gap-3 xl:grid-cols-[90px_135px_1fr_110px_95px_80px_75px_105px_40px]"
                    : "grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_160px_40px]"
                }
              >
                {useDetailedRepairLines && (
                  <>
                    <input
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Código"
                      value={item.codigo || ""}
                      onChange={(e) => setItemField(index, "codigo", e.target.value)}
                    />
                    <select
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      value={item.section || "ManoObra"}
                      onChange={(e) => setItemField(index, "section", e.target.value)}
                    >
                      <option value="ManoObra">Mano obra</option>
                      <option value="Piezas">
                        {invoice.tipoOperacion === "Chapa y pintura" ? "Materiales" : "Piezas"}
                      </option>
                      {invoice.tipoOperacion === "Chapa y pintura" && (
                        <option value="Pintura">Pintura</option>
                      )}
                    </select>
                  </>
                )}

                <input
                  list="frequent-services"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Descripcion"
                  value={item.descripcion}
                  onChange={(e) =>
                    setItemField(index, "descripcion", e.target.value)
                  }
                />

                <input
                  type="number"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder={qtyLabel}
                  value={useDetailedRepairLines ? getInvoiceLineQuantity(item) : item.cantidad}
                  onChange={(e) =>
                    setItemField(
                      index,
                      useDetailedRepairLines && item.section !== "Piezas" ? "tiempo" : "cantidad",
                      e.target.value,
                    )
                  }
                />

                <input
                  type="number"
                  step="0.01"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder={useDetailedRepairLines ? "Precio" : "Precio unitario"}
                  value={useDetailedRepairLines ? item.precioUnitario ?? item.importe : item.importe}
                  onChange={(e) =>
                    setItemField(
                      index,
                      useDetailedRepairLines ? "precioUnitario" : "importe",
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    setItemField(
                      index,
                      useDetailedRepairLines ? "precioUnitario" : "importe",
                      amountInput(e.target.value),
                    )
                  }
                />

                {useDetailedRepairLines && (
                  <>
                    <input
                      type="number"
                      step="0.01"
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="%DTO"
                      value={item.descuentoPct ?? 0}
                      onChange={(e) => setItemField(index, "descuentoPct", e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="%IVA"
                      value={item.ivaPct ?? invoice.ivaPct}
                      onChange={(e) => setItemField(index, "ivaPct", e.target.value)}
                    />
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-bold text-slate-700">
                      {formatMoney(lineTotal)}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })}
        </div>
        <datalist id="frequent-services">
          {frequentServices.map((service) => (
            <option key={service} value={service} />
          ))}
        </datalist>
      </section>

      {useZagaTemplate && (
        <ZagaInvoiceDocument
          taller={taller}
          invoice={{
            ...invoice,
            idOrdenTrabajo: id || "",
            chasis: invoice.chasis || invoice.bastidor || order?.bastidor || "",
            bastidor: invoice.bastidor || order?.bastidor || "",
            motor: invoice.motor || order?.motor || "",
            marcaModelo:
              invoice.marcaModelo ||
              [order?.marca, order?.modelo].filter(Boolean).join(" "),
            fechaMatriculacion:
              invoice.fechaMatriculacion || order?.fechaMatriculacion || "",
            franquiciaImporte: franchiseAmount,
            totalAbonado: isCredit ? paymentTotal : companyPayable,
            saldoPendiente: Math.max(0, paymentDifference),
            metodoPagoDetalle: paymentDetailText,
            bankAccountName: selectedBank?.nombre ?? selectedBank?.Nombre ?? "",
            bankAccountIban: selectedBank?.iban ?? selectedBank?.Iban ?? taller.iban
          }}
          items={items}
          totals={{
            subtotal,
            iva,
            otros,
            total: totalFinal,
          }}
          selectedPaymentMethods={selectedPaymentMethods}
          warrantyTitle={labels.warrantyTitle}
          warrantyText={labels.warrantyText}
        />
      )}

      {!useZagaTemplate && (
      <section className="invoice-print bg-white text-black">
        <div className="invoice-sheet mx-auto max-w-5xl">
          <div className="grid grid-cols-[150px_1fr_310px] items-start gap-6 border-b-2 border-black pb-4">
            <div className="flex h-32 items-center justify-center">
              <img
                src={resolveApiAssetUrl(taller.logoUrl) || logoTaller}
                alt="Logo taller"
                className="max-h-28 max-w-36 object-contain"
              />
            </div>

            <div className="min-w-0 text-center">
              <h1 className="mt-3 text-3xl font-extrabold tracking-wide uppercase leading-tight">
                {taller.nombre}
              </h1>

              <div className="mt-3 text-sm leading-5">
                <p className="font-semibold">{taller.razonSocial}</p>
                <p>{taller.nif && `NIF/CIF: ${taller.nif}`}</p>
                <p>{taller.direccion}</p>
                <p>{taller.telefono}</p>
                <p>{taller.email}</p>
              </div>
            </div>

              <div className="text-sm">
                <div className="grid grid-cols-[112px_1fr] gap-x-2 gap-y-1">
                  <p className="font-bold">FECHA:</p>
                  <p>{formatDate(invoice.fecha)}</p>

                  <p className="font-bold">Nº FACTURA:</p>
                  <p className="text-xl font-extrabold">{invoice.numero}</p>

                  <p className="font-bold">TIPO PAGO:</p>
                  <p>{isCredit ? "Pago a credito" : paymentDetailText || invoice.tipoPago}</p>

                  {isCredit && paymentTotal > 0 && (
                    <>
                      <p className="font-bold">ABONO:</p>
                      <p>Cliente abono {formatMoney(paymentTotal)}</p>
                    </>
                  )}

                  {isCredit && (
                    <>
                      <p className="font-bold">VENCIMIENTO:</p>
                      <p>{formatDate(invoice.fechaVencimiento)}</p>
                    </>
                  )}

                  <p className="font-bold">FACTURAR A:</p>
                  <p className="font-bold">{invoice.cliente}</p>

                  <p className="font-bold">DNI/NIE/NIF:</p>
                  <p>{invoice.dni}</p>

                  <p className="font-bold">DIRECCION:</p>
                  <p>{formatCustomerAddress(invoice)}</p>

                  <p className="font-bold">TELEFONO:</p>
                  <p>{invoice.telefonoCliente}</p>

                <p className="font-bold">{labels.referenceLabel.toUpperCase()}:</p>
                <p className="font-bold">{invoice.matricula}</p>

                <p className="font-bold">{labels.metricLabel.toUpperCase()}:</p>
                <p>{invoice.km}</p>
              </div>
            </div>
          </div>

          {isCredit && (selectedBank?.iban ?? selectedBank?.Iban) && (
            <div className="text-center text-sm font-bold italic border-b border-black py-2">
              Saldo pendiente a la cuenta {selectedBank?.iban ?? selectedBank?.Iban} a nombre de{" "}
              {taller.razonSocial}
            </div>
          )}

          {!isCredit && taller.iban && hasTransferPayment && (
            <div className="text-center text-sm font-bold italic border-b border-black py-2">
              Transferencias a la cuenta {taller.iban} a nombre de{" "}
              {taller.razonSocial}
            </div>
          )}

          <table className="w-full border-collapse text-sm mt-2">
            <thead>
              <tr style={{ backgroundColor: "#e2e8f0" }}>
                <th
                  className="border border-black px-2 py-2 w-24 text-center"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  CANTIDAD
                </th>
                <th
                  className="border border-black px-2 py-2 text-center"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  DESCRIPCION
                </th>
                <th
                  className="border border-black px-2 py-2 w-36 text-right"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  PRECIO UNITARIO
                </th>
                <th
                  className="border border-black px-2 py-2 w-36 text-right"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  IMPORTE
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black px-2 py-2 text-center">
                    {item.cantidad}
                  </td>
                  <td className="border border-black px-2 py-2">
                    {item.descripcion}
                  </td>
                  <td className="border border-black px-2 py-2 text-right">
                    {formatMoney(Number(item.importe || 0))}
                  </td>
                  <td className="border border-black px-2 py-2 text-right">
                    {formatMoney(
                      Number(item.cantidad || 0) * Number(item.importe || 0),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 grid grid-cols-[1fr_280px] gap-6 items-start">
            <div className="text-sm">
              <p className="font-extrabold">{labels.warrantyTitle}</p>

              <p className="mt-2 italic font-semibold leading-5">
                {labels.warrantyText}
              </p>

              <p className="mt-4">
                Si tiene cualquier tipo de pregunta sobre esta factura, pongase
                en contacto con nosotros.
              </p>

              {selectedPaymentMethods.length > 0 && (
                <div className="mt-6 text-center">
                  <p className="text-left text-base font-semibold text-slate-700">
                    Metodos de Pago:
                  </p>
                  <div className="mt-0 flex flex-wrap items-center justify-center gap-x-7  text-base font-semibold text-slate-700">
                    {selectedPaymentMethods.map((method) => (
                      <span key={method.key}>
                        {method.label}: {formatMoney(method.amount)}
                        {method.bankAccountName && ` - ${method.bankAccountName}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-6 text-center font-extrabold italic">
                GRACIAS POR SU CONFIANZA
              </p>

              <div className="mt-4">
                <p className="text-left text-lg font-extrabold underline">
                  OBSERVACIONES:
                </p>

                <p className="mt-2">{invoice.observaciones}</p>
              </div>
            </div>

            <div className="text-sm">
              <Row label="BASE IMPONIBLE" value={formatMoney(subtotal)} />
              <Row label="TASA IVA" value={`${invoice.ivaPct || 0}%`} />
              <Row label="IVA" value={formatMoney(iva)} />
              <Row label="OTROS" value={`- ${formatMoney(otros)}`} />
              {isInsuranceCustomer && (
                <>
                  <Row label="FRANQUICIA" value={`- ${formatMoney(franchiseAmount)}`} />
                  <Row label="PAGA COMPANIA" value={formatMoney(companyPayable)} strong />
                </>
              )}
              <Row label="TOTAL" value={formatMoney(totalFinal)} strong />
            </div>
          </div>

          <div className="mt-8 border-t border-black pt-2 text-xs">
            <p>
              RAZON SOCIAL: {taller.razonSocial}
              {taller.nif ? ` / NIF: ${taller.nif}` : ""}
              {taller.direccion
                ? ` / DOMICILIO FISCAL: ${taller.direccion}`
                : ""}
            </p>
          </div>
        </div>
      </section>
      )}
    </>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="grid grid-cols-[1fr_140px] items-stretch">
      <div className="px-3 py-2 text-right text-xs font-bold italic text-slate-700">
        {label}
      </div>
      <div className={`border border-black bg-slate-50 px-3 py-2 text-right ${strong ? "font-extrabold" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function InvoiceCustomerBox({ invoice }) {
  const cityLine = [invoice.codigoPostalCliente, invoice.poblacionCliente]
    .filter(Boolean)
    .join("-");

  return (
    <div className="relative min-h-[96px] px-9 py-5 text-left text-[12px] uppercase leading-[1.18]">
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

function formatMoney(value) {
  return eur.format(Number(value || 0));
}

function formatCustomerAddress(invoice) {
  return [
    invoice.direccionCliente,
    [invoice.codigoPostalCliente, invoice.poblacionCliente].filter(Boolean).join(" "),
    invoice.provinciaCliente,
  ]
    .filter(Boolean)
    .join(", ");
}

function getInvoiceLineSection(item) {
  const raw = String(item.section ?? item.Section ?? item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? "")
    .trim()
    .toLowerCase();
  if (raw.includes("pintura")) return "Pintura";
  if (
    raw.includes("pieza") ||
    raw.includes("recambio") ||
    raw.includes("repuesto") ||
    raw.includes("material")
  )
    return "Piezas";
  return "ManoObra";
}

function getInvoiceLineQuantity(item) {
  const section = getInvoiceLineSection(item);
  const value =
    section === "Piezas"
      ? item.cantidad ?? item.Cantidad
      : item.tiempo ?? item.Tiempo ?? item.cantidad ?? item.Cantidad;
  const number = Number(value || 0);
  return number > 0 ? number : 1;
}

function getInvoiceLineTotal(item) {
  return round2(Number(item.cantidad || 0) * Number(item.importe || 0));
}

function normalizeInvoiceLineForTotals(item, invoiceIvaPct = 21, detailed = false) {
  if (!detailed) return item;

  const section = getInvoiceLineSection(item);
  const quantity = getInvoiceLineQuantity({ ...item, section });
  const price = Number(
    item.precioUnitario ?? item.PrecioUnitario ?? item.importe ?? item.Importe ?? 0,
  );
  const discount = Math.min(100, Math.max(0, Number(item.descuentoPct ?? item.DescuentoPct ?? 0)));
  const netTotal = round2(quantity * price * (1 - discount / 100));
  const unitNet = quantity > 0 ? round2(netTotal / quantity) : 0;
  const kind = section === "Piezas" ? "repuesto" : "labor";

  return {
    ...item,
    codigo: item.codigo ?? item.Codigo ?? "",
    section,
    cantidad: quantity,
    tiempo: section === "Piezas" ? item.tiempo ?? item.Tiempo ?? "" : quantity,
    precioUnitario: round2(price),
    descuentoPct: discount,
    ivaPct: Number(item.ivaPct ?? item.IvaPct ?? invoiceIvaPct ?? 21),
    importe: unitNet,
    kind,
  };
}

function parseOrderItems(itemsJson) {
  if (!itemsJson) return [];

  try {
    const parsed = JSON.parse(itemsJson);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        codigo: item.codigo ?? item.Codigo ?? "",
        section: getInvoiceLineSection(item),
        descripcion: item.descripcion || item.Descripcion || "",
        cantidad: Number(item.cantidad ?? item.Cantidad ?? 1),
        tiempo: item.tiempo ?? item.Tiempo ?? item.cantidad ?? item.Cantidad ?? 1,
        precioUnitario: Number(
          item.precioUnitario ??
            item.PrecioUnitario ??
            item.precio ??
            item.Precio ??
            item.importe ??
            item.Importe ??
            0,
        ),
        descuentoPct: Number(item.descuentoPct ?? item.DescuentoPct ?? 0),
        ivaPct: Number(item.ivaPct ?? item.IvaPct ?? 21),
        importe: Number(
          item.importe ??
            item.Importe ??
            item.precioUnitario ??
            item.PrecioUnitario ??
            0,
        ),
        kind: item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? null,
        repuestoStockId:
          item.repuestoStockId ??
          item.RepuestoStockId ??
          item.idRepuesto ??
          item.IdRepuesto ??
          null,
        idProveedor: item.idProveedor ?? item.IdProveedor ?? null,
        nombreProveedor: item.nombreProveedor ?? item.NombreProveedor ?? null,
        precioCompra: item.precioCompra ?? item.PrecioCompra ?? null,
      }))
      .filter(
        (item) =>
          item.descripcion.trim() &&
          item.cantidad > 0 &&
          item.importe >= 0,
      );
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
