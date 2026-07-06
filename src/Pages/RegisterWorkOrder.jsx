import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Images,
  Search,
  Trash2,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import api, { getCurrentWorkshopId } from "../Components/api";
import { useBusinessTerminology } from "../utils/businessTerminology";
import PartPicker, {
  getPartDisplayName,
  getPartId,
  getPartProviderId,
  getPartProviderName,
  getPartPurchasePrice,
  getPartSalePrice,
} from "../Components/PartPicker";
import { usesZagaInvoiceTemplate } from "../Components/ZagaInvoiceDocument";
import ReceptionPhotosModal from "../Components/ReceptionPhotosModal";
import { amountInput } from "../utils/currency";
import SmallSuccessModal from "../Components/SmallSuccessModal";
import ConfirmActionModal from "../Components/ConfirmActionModal";
import {
  buildWorkOrderPayload,
  getRepairLineQuantity,
  getRepairLineSection,
  getRepairLineTotal,
  normalizeRepairLine,
} from "../utils/repairOrderPayload";
import {
  canInvoiceWorkOrder,
  getAllowedWorkOrderStates,
  isWorkOrderEditLocked,
  normalizeWorkOrderState,
  requiresCompletionConfirmation,
} from "../utils/workOrderWorkflow";

const EMPTY_ORDER = {
  ClienteId: "",
  Cliente: "",
  Dni: "",
  Telefono: "",
  Direccion: "",
  CodigoPostal: "",
  Poblacion: "",
  Provincia: "",
  Clasificacion: "Particular",
  VehiculoId: "",
  Matricula: "",
  Bastidor: "",
  Marca: "",
  Modelo: "",
  FechaMatriculacion: "",
  Motor: "",
  Kw: "",
  Cv: "",
  Combustible: "",
  Kilometraje: "",
  Fecha: new Date().toISOString().slice(0, 10),
  FechaPrevistaEntrega: "",
  TiempoEstimadoHoras: "",
  TipoOperacion: "Mecanica",
  Trabajo: "",
  Items: [],
  Repuestos: "",
  Cantidad: "1",
  ManoObra: "",
  Estado: "Recibido",
  Observaciones: "",
};

const DEFAULT_FREQUENT_SERVICES = [
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

const getStateStyles = (estado) => {
  switch (estado) {
    case "Recibido":
      return "border-sky-300 bg-sky-50/40";

    case "Diagnóstico":
      return "border-violet-300 bg-violet-50/40";

    case "Reparando":
      return "border-amber-300 bg-amber-50/40";

    case "Esperando repuesto":
      return "border-orange-500 bg-orange-50/40";

    case "Terminado":
      return "border-emerald-300 bg-emerald-50/40";

    case "Entregado":
      return "border-slate-300 bg-slate-100/60";

    default:
      return "border-slate-200 bg-white";
  }
};

const ensureOk = (res) => {
  const data = res?.data;
  if (data?.ok === 0 || data?.Ok === 0) {
    throw new Error(
      data?.message || data?.Message || "La operación no se pudo completar.",
    );
  }
  return data;
};

const DEFAULT_WHATSAPP_COUNTRY_PREFIX = "34";
const READY_ORDER_ALERTS_KEY_PREFIX = "tc:ready-order-alerts";

function getReadyOrderAlertsKey() {
  const workshopId = getCurrentWorkshopId();
  return workshopId
    ? `${READY_ORDER_ALERTS_KEY_PREFIX}:${workshopId}`
    : READY_ORDER_ALERTS_KEY_PREFIX;
}

function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith(DEFAULT_WHATSAPP_COUNTRY_PREFIX)) return digits;
  if (digits.length === 9) return `${DEFAULT_WHATSAPP_COUNTRY_PREFIX}${digits}`;
  return digits;
}

function openWhatsAppVehicleReady(order, businessName = "nuestro taller") {
  const phone = normalizeWhatsAppPhone(order.Telefono);

  if (!phone) {
    alert("Este cliente no tiene teléfono registrado.");
    return false;
  }

  const cliente = order.Cliente || "";
  const matricula = order.Matricula || "";
  const marca = order.Marca || "";
  const modelo = order.Modelo || "";

  const message = `Hola ${cliente}, le informamos desde ${businessName} que su vehículo${
    matricula ? ` matrícula ${matricula}` : ""
  }${marca || modelo ? ` (${marca} ${modelo})` : ""} ya está listo para retirar. Puede pasar por nuestras instalaciones cuando le resulte conveniente. ¡Gracias por confiar en nosotros!

  ${businessName}`;

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer",
  );

  return true;
}

function readReadyOrderAlerts() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(getReadyOrderAlertsKey()) || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildReadyOrderAlertMessage(order, businessName = "nuestro taller") {
  const cliente = order.Cliente || "";
  const matricula = order.Matricula || "";
  const marca = order.Marca || "";
  const modelo = order.Modelo || "";

  return `Hola ${cliente}, le informamos desde ${businessName} que su vehículo${
    matricula ? ` matrícula ${matricula}` : ""
  }${marca || modelo ? ` (${marca} ${modelo})` : ""} ya está listo para retirar. Puede pasar por nuestras instalaciones cuando le resulte conveniente. ¡Gracias por confiar en nosotros!

  ${businessName}`;
}

function saveReadyOrderAlert(order, businessName = "nuestro taller") {
  const id = `ready-order-${order.Id}`;
  const alert = {
    id,
    local: true,
    kind: "vehicle-ready",
    cliente: order.Cliente || "",
    telefono: order.Telefono || "",
    mensaje: `Orden lista para retirar. Notifica a ${order.Cliente || "cliente"} que ya puede retirar su vehículo.`,
    whatsappText: buildReadyOrderAlertMessage(order, businessName),
    fechaAviso: new Date().toISOString(),
  };
  const next = [
    alert,
    ...readReadyOrderAlerts().filter((item) => item.id !== id),
  ];
  localStorage.setItem(getReadyOrderAlertsKey(), JSON.stringify(next));
  window.dispatchEvent(new Event("tc:client-alerts:refresh"));
}

export default function RegisterWorkOrder() {
  const labels = useBusinessTerminology();
  const [searchParams, setSearchParams] = useSearchParams();
  const [order, setOrder] = useState(EMPTY_ORDER);
  const [orders, setOrders] = useState([]);
  const [notice, setNotice] = useState("");
  const [successModal, setSuccessModal] = useState("");
  const [warningModal, setWarningModal] = useState("");
  const [completionConfirmation, setCompletionConfirmation] = useState({
    order: null,
    nextState: "",
    loading: false,
  });
  const [plateSearch, setPlateSearch] = useState("");
  const [error, setError] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMatches, setCustomerMatches] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [selectedCustomerForVehicles, setSelectedCustomerForVehicles] =
    useState(null);
  const [loadingCustomerVehicles, setLoadingCustomerVehicles] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [frequentServices, setFrequentServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState(SERVICE_PREFIX);
  const [savingService, setSavingService] = useState(false);
  const [readyWhatsappOrder, setReadyWhatsappOrder] = useState(null);
  const [workshopName, setWorkshopName] = useState("nuestro taller");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [useZagaDocuments, setUseZagaDocuments] = useState(false);
  const [preOrdersEnabled, setPreOrdersEnabled] = useState(false);
  const [receptionPhotosEnabled, setReceptionPhotosEnabled] = useState(true);
  const [detailedRepairLinesEnabled, setDetailedRepairLinesEnabled] =
    useState(false);
  const [operationTypes, setOperationTypes] = useState(["Mecanica"]);
  const [photoTarget, setPhotoTarget] = useState(null);
  const [preOrderSourceId, setPreOrderSourceId] = useState(null);
  const orderPageSize = 10;
  const detailItems = Array.isArray(order.Items) ? order.Items : [];

  const hasSelectedClient = Boolean(order.Cliente);
  const hasSelectedVehicle = Boolean(
    order.Matricula || order.Modelo || order.VehiculoId,
  );
  const shouldShowOrderForm =
    showNewCustomer ||
    editingId ||
    preOrderSourceId ||
    (hasSelectedClient && hasSelectedVehicle);

  const [quickCreateNotice, setQuickCreateNotice] = useState("");

  const detailTotal = detailItems.reduce(
    (sum, item) => sum + getRepairLineTotal(item),
    0,
  );

  const loadWorkshopName = async () => {
    try {
      const res = await api.get("/WorkshopSettings");
      const data = res?.data || {};

      const enabled =
        data.enableWhatsappAlerts ?? data.EnableWhatsappAlerts ?? false;

      setWhatsappEnabled(enabled);
      const zagaDocuments = usesZagaInvoiceTemplate(data);
      const preOrderModuleEnabled =
        data.enablePreOrders ?? data.EnablePreOrders ?? true;
      setUseZagaDocuments(zagaDocuments);
      setPreOrdersEnabled(zagaDocuments && preOrderModuleEnabled);
      setReceptionPhotosEnabled(
        data.enableReceptionPhotos ?? data.EnableReceptionPhotos ?? true,
      );
      setDetailedRepairLinesEnabled(
        data.enableDetailedRepairInvoiceLines ??
          data.EnableDetailedRepairInvoiceLines ??
          false,
      );
      setOperationTypes(
        normalizeOperationTypes(data.operationTypes ?? data.OperationTypes),
      );

      const name =
        data.nombre ??
        data.Nombre ??
        data.razonSocial ??
        data.RazonSocial ??
        "nuestro taller";

      setWorkshopName(name);
    } catch (err) {
      console.error(err);
      setWorkshopName("nuestro taller");
    }
  };

  const total = detailItems.length
    ? detailTotal
    : Number(order.ManoObra || 0) +
      Number(order.Repuestos || 0) * Number(order.Cantidad || 1);

  const setField = (name, value) => {
    setOrder((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange = (e) => {
    setField(e.target.name, e.target.value);
  };

  const loadFrequentServices = async () => {
    try {
      const res = await api.get("/ServicioFrecuente");
      const responseData = res?.data?.data ?? res?.data?.Data ?? res?.data;
      const list = Array.isArray(responseData?.[0])
        ? responseData[0]
        : Array.isArray(responseData)
          ? responseData
          : [];
      const names = list
        .map((x) => (typeof x === "string" ? x : x?.nombre ?? x?.Nombre))
        .map((x) => String(x || "").trim())
        .filter(Boolean);
      setFrequentServices(names.length ? names : DEFAULT_FREQUENT_SERVICES);
    } catch (err) {
      console.error(err);
      setFrequentServices(DEFAULT_FREQUENT_SERVICES);
    }
  };

  const appendServiceToTrabajo = (service) => {
    const value = service?.trim();
    if (!value) return;
    setOrder((prev) => ({
      ...prev,
      Items: [
        ...(Array.isArray(prev.Items) ? prev.Items : []),
        createDetailItem(value, 1, 0, {
          kind: "labor",
          section: "ManoObra",
          codigo: "MO",
        }),
      ],
      Trabajo: prev.Trabajo?.trim()
        ? `${prev.Trabajo.trim()}\n${value}`
        : value,
    }));
  };

  const createDetailItem = (
    descripcion,
    cantidad = 1,
    precioUnitario = 0,
    extra = {},
  ) => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    descripcion,
    cantidad,
    tiempo: cantidad,
    precioUnitario: Number(precioUnitario || 0).toFixed(2),
    descuentoPct: 0,
    ivaPct: 21,
    section: extra.kind === "repuesto" ? "Piezas" : "ManoObra",
    ...extra,
  });

  const setDetailItemField = (id, field, value) => {
    setOrder((prev) => ({
      ...prev,
      Items: (Array.isArray(prev.Items) ? prev.Items : []).map((item) =>
        item.id === id
          ? normalizeRepairLine(
              { ...item, [field]: value },
              detailedRepairLinesEnabled,
            )
          : item,
      ),
    }));
  };

  const upsertLaborItem = (value) => {
    const amount = amountInput(value);
    setOrder((prev) => {
      const items = Array.isArray(prev.Items) ? prev.Items : [];
      const existing = items.find((item) => item.kind === "labor");
      const nextLabor = {
        ...(existing || createDetailItem("Mano de obra", 1, amount)),
        kind: "labor",
        section: "ManoObra",
        descripcion: "Mano de obra",
        cantidad: 1,
        tiempo: 1,
        precioUnitario: amount,
      };

      return {
        ...prev,
        ManoObra: amount,
        Items: existing
          ? items.map((item) => (item.id === existing.id ? nextLabor : item))
          : [...items, nextLabor],
      };
    });
  };

  const removeDetailItem = (id) => {
    setOrder((prev) => ({
      ...prev,
      Items: (Array.isArray(prev.Items) ? prev.Items : []).filter(
        (item) => item.id !== id,
      ),
    }));
  };

  const addManualDetailLine = () => {
    const section =
      detailedRepairLinesEnabled && order.TipoOperacion === "Chapa y pintura"
        ? "Piezas"
        : "ManoObra";
    setOrder((prev) => ({
      ...prev,
      Items: [
        ...(Array.isArray(prev.Items) ? prev.Items : []),
        createDetailItem("", 1, 0, {
          section,
          kind: section === "Piezas" ? "repuesto" : "labor",
          codigo: section === "Piezas" ? "MAT" : "MO",
        }),
      ],
    }));
  };

  const addPartToOrder = (part) => {
    const name = getPartDisplayName(part);
    const price = getPartSalePrice(part);
    if (!name) return;

    setOrder((prev) => {
      const currentParts = Number(prev.Repuestos || 0);
      const nextParts = (currentParts + price).toFixed(2);

      return {
        ...prev,
        Trabajo: prev.Trabajo?.trim()
          ? `${prev.Trabajo.trim()}\n${name}`
          : name,
        Items: [
          ...(Array.isArray(prev.Items) ? prev.Items : []),
          createDetailItem(name, 1, price, {
            kind: "repuesto",
            section: "Piezas",
            repuestoStockId: getPartId(part),
            idProveedor: getPartProviderId(part),
            nombreProveedor: getPartProviderName(part),
            precioCompra: getPartPurchasePrice(part),
          }),
        ],
        Repuestos: nextParts,
      };
    });

    setNotice(`Repuesto agregado al importe: ${name}.`);
  };

  const createFrequentService = async () => {
    const nombre = normalizeFrequentServiceName(newServiceName);
    if (!nombre || nombre.toLowerCase() === "servicio") return;

    try {
      setSavingService(true);
      setError("");
      const res = await api.post("/ServicioFrecuente", { nombre });
      ensureOk(res);
      await loadFrequentServices();
      appendServiceToTrabajo(nombre);
      setNewServiceName(SERVICE_PREFIX);
      setNotice("Servicio frecuente agregado.");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo registrar el servicio.",
      );
    } finally {
      setSavingService(false);
    }
  };

  const normalizeOrder = (o) => ({
    Id: o.id ?? o.Id,
    PreOrdenId: o.preOrdenId ?? o.PreOrdenId ?? null,
    Cliente: o.cliente ?? o.Cliente,
    Dni: o.dni ?? o.Dni ?? "",
    Telefono: o.telefono ?? o.Telefono,
    Direccion: o.direccion ?? o.Direccion ?? "",
    CodigoPostal: o.codigoPostal ?? o.CodigoPostal ?? "",
    Poblacion: o.poblacion ?? o.Poblacion ?? "",
    Provincia: o.provincia ?? o.Provincia ?? "",
    Clasificacion: o.clasificacion ?? o.Clasificacion ?? "Particular",
    VehiculoId: o.vehiculoId ?? o.VehiculoId ?? "",
    Matricula: o.matricula ?? o.Matricula,
    Bastidor: o.bastidor ?? o.Bastidor ?? "",
    Marca: o.marca ?? o.Marca,
    Modelo: o.modelo ?? o.Modelo,
    FechaMatriculacion: String(
      o.fechaMatriculacion ?? o.FechaMatriculacion ?? "",
    ).slice(0, 10),
    Motor: o.motor ?? o.Motor ?? "",
    Kw: o.kw ?? o.Kw ?? "",
    Cv: o.cv ?? o.Cv ?? "",
    Combustible: o.combustible ?? o.Combustible ?? "",
    Kilometraje: o.kilometraje ?? o.Kilometraje,
    Fecha: o.fecha ?? o.Fecha,
    FechaPrevistaEntrega:
      o.fechaPrevistaEntrega ?? o.FechaPrevistaEntrega ?? "",
    TiempoEstimadoHoras: o.tiempoEstimadoHoras ?? o.TiempoEstimadoHoras ?? "",
    TipoOperacion: o.tipoOperacion ?? o.TipoOperacion ?? "Mecanica",
    Trabajo: o.trabajo ?? o.Trabajo,
    Repuestos: o.repuestos ?? o.Repuestos ?? 0,
    Cantidad: o.cantidad ?? o.Cantidad ?? 1,
    ManoObra: o.manoObra ?? o.ManoObra ?? 0,
    Items: parseDetailItems(o.itemsJson ?? o.ItemsJson),
    Estado: o.estado ?? o.Estado,
    Observaciones: o.observaciones ?? o.Observaciones,
    Total:
      o.total ??
      o.Total ??
      Number(o.manoObra ?? o.ManoObra ?? 0) +
        Number(o.repuestos ?? o.Repuestos ?? 0) *
          Number(o.cantidad ?? o.Cantidad ?? 1),
    Facturada: o.facturada ?? o.Facturada ?? false,
  });

  const parseDetailItems = (itemsJson) => {
    if (!itemsJson) return [];
    try {
      const parsed = JSON.parse(itemsJson);
      return Array.isArray(parsed)
        ? parsed.map((item, index) => ({
            id: item.id || `stored-${index}`,
            codigo: item.codigo ?? item.Codigo ?? "",
            section: getRepairLineSection(item),
            descripcion: item.descripcion || item.Descripcion || "",
            cantidad: item.cantidad ?? item.Cantidad ?? 1,
            tiempo:
              item.tiempo ?? item.Tiempo ?? item.cantidad ?? item.Cantidad ?? 1,
            descuentoPct: item.descuentoPct ?? item.DescuentoPct ?? 0,
            ivaPct: item.ivaPct ?? item.IvaPct ?? 21,
            precioUnitario:
              item.precioUnitario ??
              item.PrecioUnitario ??
              item.importe ??
              item.Importe ??
              0,
            importe:
              item.importe ??
              item.Importe ??
              item.precioUnitario ??
              item.PrecioUnitario ??
              0,
            kind: item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? null,
            repuestoStockId:
              item.repuestoStockId ??
              item.RepuestoStockId ??
              item.idRepuesto ??
              item.IdRepuesto ??
              null,
            idProveedor: item.idProveedor ?? item.IdProveedor ?? null,
            nombreProveedor:
              item.nombreProveedor ?? item.NombreProveedor ?? null,
            precioCompra: item.precioCompra ?? item.PrecioCompra ?? null,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const normalizeCustomer = (c) => ({
    Id: c.id ?? c.Id,
    Nombre: c.nombre ?? c.Nombre ?? "",
    Dni: c.dni ?? c.Dni ?? "",
    Telefono: c.telefono ?? c.Telefono ?? "",
    Matricula: c.matricula ?? c.Matricula ?? "",
    Bastidor: c.bastidor ?? c.Bastidor ?? "",
    Marca: c.marca ?? c.Marca ?? "",
    Modelo: c.modelo ?? c.Modelo ?? "",
    FechaMatriculacion: String(
      c.fechaMatriculacion ?? c.FechaMatriculacion ?? "",
    ).slice(0, 10),
    Motor: c.motor ?? c.Motor ?? "",
    Kw: c.kw ?? c.Kw ?? "",
    Cv: c.cv ?? c.Cv ?? "",
    Combustible: c.combustible ?? c.Combustible ?? "",
    Kilometraje: c.kilometraje ?? c.Kilometraje ?? "",
    Email: c.email ?? c.Email ?? "",
    Direccion: c.direccion ?? c.Direccion ?? "",
    CodigoPostal: c.codigoPostal ?? c.CodigoPostal ?? "",
    Poblacion: c.poblacion ?? c.Poblacion ?? "",
    Provincia: c.provincia ?? c.Provincia ?? "",
    Clasificacion: c.clasificacion ?? c.Clasificacion ?? "Particular",
    Observaciones: c.observaciones ?? c.Observaciones ?? "",
  });

  const normalizeVehicle = (v) => ({
    Id: v.id ?? v.Id,
    ClienteId: v.clienteId ?? v.ClienteId,
    Matricula: v.matricula ?? v.Matricula ?? "",
    Bastidor: v.bastidor ?? v.Bastidor ?? "",
    Marca: v.marca ?? v.Marca ?? "",
    Modelo: v.modelo ?? v.Modelo ?? "",
    FechaMatriculacion: String(
      v.fechaMatriculacion ?? v.FechaMatriculacion ?? "",
    ).slice(0, 10),
    Motor: v.motor ?? v.Motor ?? "",
    Kw: v.kw ?? v.Kw ?? "",
    Cv: v.cv ?? v.Cv ?? "",
    Combustible: v.combustible ?? v.Combustible ?? "",
    Kilometraje: v.kilometraje ?? v.Kilometraje ?? "",
    UltimaVisita: String(v.ultimaVisita ?? v.UltimaVisita ?? "").slice(0, 10),
    ProximaItv: String(v.proximaItv ?? v.ProximaItv ?? "").slice(0, 10),
  });

  const firstResponseItem = (data) =>
    data?.data?.[0] ?? data?.Data?.[0] ?? null;

  const pickItems = (res) => {
    const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? {};
    return Array.isArray(pack.items ?? pack.Items)
      ? (pack.items ?? pack.Items)
      : [];
  };

  const pickArray = (res) => {
    const first = res?.data?.data?.[0] ?? res?.data?.Data?.[0];
    if (Array.isArray(first)) return first;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const normalizeLookup = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");

  const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

  const normalizePlate = (value) =>
    String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  const loadCustomerDetail = async (customer) => {
    const id = customer?.Id;
    if (!id) return customer;

    try {
      const res = await api.get(`/Cliente/${id}`);
      const data = res?.data?.data?.[0] ?? res?.data?.Data?.[0];
      return data ? normalizeCustomer(data) : customer;
    } catch (err) {
      console.error(err);
      return customer;
    }
  };

  const loadVehiclesForCustomer = async (customerId) => {
    if (!customerId) return [];
    const res = await api.get(`/Vehiculo/cliente/${customerId}`);
    return pickArray(res).map(normalizeVehicle);
  };

  const fillOrderFromCustomer = async (customer, vehicle = null) => {
    const fullCustomer = await loadCustomerDetail(customer);
    setOrder((prev) => ({
      ...prev,
      ClienteId: fullCustomer.Id || prev.ClienteId,
      Cliente: fullCustomer.Nombre || prev.Cliente,
      Dni: fullCustomer.Dni || prev.Dni,
      Telefono: fullCustomer.Telefono || prev.Telefono,
      Direccion: fullCustomer.Direccion || prev.Direccion,
      CodigoPostal: fullCustomer.CodigoPostal || prev.CodigoPostal,
      Poblacion: fullCustomer.Poblacion || prev.Poblacion,
      Provincia: fullCustomer.Provincia || prev.Provincia,
      Clasificacion: fullCustomer.Clasificacion || prev.Clasificacion,
      VehiculoId: vehicle?.Id || prev.VehiculoId,
      Matricula: vehicle?.Matricula || fullCustomer.Matricula || prev.Matricula,
      Bastidor: vehicle?.Bastidor || fullCustomer.Bastidor || prev.Bastidor,
      Marca: vehicle?.Marca || fullCustomer.Marca || prev.Marca,
      Modelo: vehicle?.Modelo || fullCustomer.Modelo || prev.Modelo,
      FechaMatriculacion:
        vehicle?.FechaMatriculacion ||
        fullCustomer.FechaMatriculacion ||
        prev.FechaMatriculacion,
      Motor: vehicle?.Motor || fullCustomer.Motor || prev.Motor,
      Kw: vehicle?.Kw || fullCustomer.Kw || prev.Kw,
      Cv: vehicle?.Cv || fullCustomer.Cv || prev.Cv,
      Combustible:
        vehicle?.Combustible || fullCustomer.Combustible || prev.Combustible,
      Kilometraje:
        (vehicle?.Kilometraje ?? fullCustomer.Kilometraje)
          ? String(vehicle?.Kilometraje ?? fullCustomer.Kilometraje)
          : prev.Kilometraje,
    }));
    setCustomerSearch("");
    setCustomerMatches([]);
    setCustomerVehicles([]);
    setSelectedCustomerForVehicles(null);
    setShowNewCustomer(false);
    setQuickCreateNotice("");
  };

  const fillCustomerOnlyForNewVehicle = async (customer) => {
    const fullCustomer = await loadCustomerDetail(customer);
    setOrder((prev) => ({
      ...prev,
      ClienteId: fullCustomer.Id || prev.ClienteId,
      Cliente: fullCustomer.Nombre || prev.Cliente,
      Dni: fullCustomer.Dni || prev.Dni,
      Telefono: fullCustomer.Telefono || prev.Telefono,
      Direccion: fullCustomer.Direccion || prev.Direccion,
      CodigoPostal: fullCustomer.CodigoPostal || prev.CodigoPostal,
      Poblacion: fullCustomer.Poblacion || prev.Poblacion,
      Provincia: fullCustomer.Provincia || prev.Provincia,
      Clasificacion: fullCustomer.Clasificacion || prev.Clasificacion,
      VehiculoId: "",
      Matricula: "",
      Bastidor: "",
      Marca: "",
      Modelo: "",
      FechaMatriculacion: "",
      Motor: "",
      Kw: "",
      Cv: "",
      Combustible: "",
      Kilometraje: "",
    }));
  };

  const clearVehicleForQuickCreate = () => {
    setOrder((prev) => ({
      ...prev,
      VehiculoId: "",
      Matricula: "",
      Bastidor: "",
      Marca: "",
      Modelo: "",
      FechaMatriculacion: "",
      Motor: "",
      Kw: "",
      Cv: "",
      Combustible: "",
      Kilometraje: "",
    }));
  };

  const toggleQuickCreate = () => {
    if (showNewCustomer) {
      setShowNewCustomer(false);
      setQuickCreateNotice("");
      return;
    }

    if (order.ClienteId) {
      clearVehicleForQuickCreate();
      setQuickCreateNotice(
        "Cliente seleccionado. Completa los datos del nuevo vehículo.",
      );
    }

    setShowNewCustomer(true);
  };

  const selectCustomerMatch = async (customer) => {
    const fallbackVehicle = {
      Id: "",
      Matricula: customer.Matricula,
      Bastidor: customer.Bastidor,
      Marca: customer.Marca,
      Modelo: customer.Modelo,
      FechaMatriculacion: customer.FechaMatriculacion,
      Motor: customer.Motor,
      Kw: customer.Kw,
      Cv: customer.Cv,
      Combustible: customer.Combustible,
      Kilometraje: customer.Kilometraje,
    };

    try {
      setLoadingCustomerVehicles(true);
      setSelectedCustomerForVehicles(customer);
      const res = await api.get(`/Vehiculo/cliente/${customer.Id}`);
      const list = pickArray(res).map(normalizeVehicle);

      if (list.length === 0) {
        await fillCustomerOnlyForNewVehicle(customer);
        setShowNewCustomer(true);
        setQuickCreateNotice(
          "Cliente seleccionado. Completa los datos del nuevo vehiculo.",
        );
        setWarningModal(
          "Este cliente no tiene coche asignado. Agrega un coche para poder completar la orden.",
        );
        return;
      }

      if (list.length === 1) {
        await fillOrderFromCustomer(customer, list[0]);
        return;
      }

      await fillCustomerOnlyForNewVehicle(customer);
      setCustomerVehicles(list);
    } catch (err) {
      console.error(err);
      await fillOrderFromCustomer(customer, fallbackVehicle);
    } finally {
      setLoadingCustomerVehicles(false);
    }
  };

  const loadCustomers = async (searchText) => {
    const search = searchText.trim();
    if (search.length < 2) {
      setCustomerMatches([]);
      return;
    }

    try {
      setLoadingCustomers(true);
      const res = await api.get("/Cliente", {
        params: {
          search,
          page: 1,
          pageSize: 6,
        },
      });
      setCustomerMatches(pickItems(res).map(normalizeCustomer));
    } catch (err) {
      console.error(err);
      setCustomerMatches([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const searchQuickCustomers = async (term) => {
    const search = String(term || "").trim();
    if (search.length < 2) return [];
    const res = await api.get("/Cliente", {
      params: {
        search,
        page: 1,
        pageSize: 10,
      },
    });
    return pickItems(res).map(normalizeCustomer);
  };

  const findExistingCustomerForQuickCreate = async (payload) => {
    const dniKey = normalizeLookup(payload.dni);
    const phoneKey = normalizePhone(payload.telefono);
    const nameKey = normalizeLookup(payload.nombre);

    if (dniKey) {
      const matches = await searchQuickCustomers(payload.dni);
      const exact = matches.find(
        (item) => normalizeLookup(item.Dni) === dniKey,
      );
      if (exact) return exact;
    }

    if (phoneKey) {
      const matches = await searchQuickCustomers(payload.telefono);
      const exact = matches.find(
        (item) => normalizePhone(item.Telefono) === phoneKey,
      );
      if (exact) return exact;
    }

    if (!dniKey && !phoneKey && nameKey) {
      const matches = await searchQuickCustomers(payload.nombre);
      const exact = matches.filter(
        (item) => normalizeLookup(item.Nombre) === nameKey,
      );
      if (exact.length > 1) {
        throw new Error(
          "Hay varios clientes con ese nombre. Selecciona el cliente desde el buscador antes de guardar el vehiculo.",
        );
      }
      if (exact.length === 1) return exact[0];
    }

    return null;
  };

  const vehiclePayloadFromQuickCreate = (payload) => ({
    matricula: payload.matricula,
    bastidor: payload.bastidor || null,
    marca: payload.marca || null,
    modelo: payload.modelo,
    fechaMatriculacion: payload.fechaMatriculacion || null,
    motor: payload.motor || null,
    kw: payload.kw,
    cv: payload.cv,
    combustible: payload.combustible || null,
    kilometraje: payload.kilometraje,
    observaciones: payload.observaciones || null,
  });

  const loadCreatedCustomerAndVehicle = async (customerId, matricula) => {
    const customer = await loadCustomerDetail({ Id: customerId });
    const vehicles = await loadVehiclesForCustomer(customerId);
    const vehicle =
      vehicles.find(
        (item) => normalizePlate(item.Matricula) === normalizePlate(matricula),
      ) || vehicles[0];

    await fillOrderFromCustomer(customer, vehicle || null);
  };

  const createCustomerFromOrder = async () => {
    if (savingCustomer) return;

    const payload = {
      nombre: order.Cliente,
      dni: order.Dni || null,
      telefono: order.Telefono,
      email: null,
      direccion: order.Direccion || null,
      codigoPostal: order.CodigoPostal || null,
      poblacion: order.Poblacion || null,
      provincia: order.Provincia || null,
      clasificacion: order.Clasificacion || "Particular",
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
      observaciones: order.Observaciones || null,
    };

    if (!payload.nombre?.trim()) {
      setError("Indica el nombre del cliente para registrarlo.");
      return;
    }
    if (!payload.telefono?.trim()) {
      setError("Indica el teléfono del cliente para registrarlo.");
      return;
    }
    if (!payload.matricula?.trim()) {
      setError(labels.referenceRequiredMessage);
      return;
    }
    if (!payload.modelo?.trim()) {
      setError(labels.modelRequiredMessage);
      return;
    }

    try {
      setSavingCustomer(true);
      setError("");
      const existingCustomer =
        await findExistingCustomerForQuickCreate(payload);

      if (existingCustomer?.Id) {
        const vehicles = await loadVehiclesForCustomer(existingCustomer.Id);
        let vehicle = vehicles.find(
          (item) =>
            normalizePlate(item.Matricula) ===
            normalizePlate(payload.matricula),
        );

        if (!vehicle) {
          const createdVehicle = ensureOk(
            await api.post(
              `/Vehiculo/cliente/${existingCustomer.Id}`,
              vehiclePayloadFromQuickCreate(payload),
            ),
          );
          vehicle = normalizeVehicle(firstResponseItem(createdVehicle) || {});
          setSuccessModal(
            "Cliente existente cargado y vehiculo agregado a la orden.",
          );
        } else {
          setSuccessModal("Cliente y vehiculo existentes cargados en la orden.");
        }

        await fillOrderFromCustomer(existingCustomer, vehicle);
        setShowNewCustomer(false);
        setQuickCreateNotice("");
        return;
      }

      const createdCustomer = ensureOk(await api.post("/Cliente", payload));
      const createdCustomerId =
        firstResponseItem(createdCustomer)?.id ??
        firstResponseItem(createdCustomer)?.Id;

      if (createdCustomerId) {
        await loadCreatedCustomerAndVehicle(
          createdCustomerId,
          payload.matricula,
        );
      }

      setSuccessModal("Cliente registrado y cargado en la orden.");
      setShowNewCustomer(false);
      setQuickCreateNotice("");
      setCustomerSearch("");
      setCustomerMatches([]);
      return;
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo registrar el cliente.",
      );
    } finally {
      setSavingCustomer(false);
    }
  };

  const getItemsFromResponse = (res) => {
    const pack = res?.data?.data?.[0] ?? [];

    if (Array.isArray(pack)) {
      return pack;
    }

    if (Array.isArray(pack.items)) {
      return pack.items;
    }

    return [];
  };

  const getPagingFromResponse = (res) => {
    const pack = res?.data?.data?.[0] ?? {};
    return {
      total: Number(pack.total ?? pack.Total ?? 0),
      page: Number(pack.page ?? pack.Page ?? orderPage),
      pageSize: Number(pack.pageSize ?? pack.PageSize ?? orderPageSize),
    };
  };

  const loadOrders = async (page = orderPage) => {
    try {
      setLoadingOrders(true);
      setError("");

      const search = plateSearch.trim();

      const res = await api.get("/OrdenTrabajo", {
        params: {
          matricula: search || null,
          fechaDesde: dateFrom || null,
          fechaHasta: dateTo || null,
          page,
          pageSize: orderPageSize,
        },
      });

      const items = getItemsFromResponse(res).map(normalizeOrder);
      const paging = getPagingFromResponse(res);
      setOrders(items);
      setOrderTotal(paging.total);
      setOrderPage(paging.page);
    } catch (err) {
      console.error(err);
      setOrders([]);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudieron cargar las órdenes.",
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (window.location.hash === "#ordenes-recientes") {
      setShowOrders(true);
    }
    loadWorkshopName();
    loadFrequentServices();
    loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const preOrdenId = searchParams.get("preOrdenId");
    if (!preOrdenId) return;

    let alive = true;
    (async () => {
      try {
        setError("");
        const res = await api.get(`/PreOrdenTrabajo/${preOrdenId}`);
        const data = res?.data?.data?.[0];
        if (!alive || !data) return;

        const motivo = data.motivoRecepcion ?? data.MotivoRecepcion ?? "";
        const diagnostico =
          data.diagnosticoMecanico ?? data.DiagnosticoMecanico ?? "";
        const repuestos =
          data.repuestosNecesarios ?? data.RepuestosNecesarios ?? "";
        const fechaPrevista =
          data.fechaPrevistaEntrega ?? data.FechaPrevistaEntrega ?? "";
        const tiempoEstimado =
          data.tiempoEstimadoHoras ?? data.TiempoEstimadoHoras ?? "";
        const tiempoEstimadoNumero = Number(tiempoEstimado || 0);
        const observaciones = [
          motivo ? `Motivo recibido: ${motivo}` : "",
          repuestos ? `Repuestos indicados en pre-orden: ${repuestos}` : "",
          data.observaciones ?? data.Observaciones ?? "",
        ]
          .filter(Boolean)
          .join("\n");

        setPreOrderSourceId(preOrdenId);
        setEditingId(null);
        setOrder({
          ...EMPTY_ORDER,
          ClienteId: data.clienteId ?? data.ClienteId ?? "",
          VehiculoId: data.vehiculoId ?? data.VehiculoId ?? "",
          Cliente: data.cliente ?? data.Cliente ?? "",
          Dni: data.dni ?? data.Dni ?? "",
          Telefono: data.telefono ?? data.Telefono ?? "",
          Direccion: data.direccion ?? data.Direccion ?? "",
          Matricula: data.matricula ?? data.Matricula ?? "",
          Marca: data.marca ?? data.Marca ?? "",
          Modelo: data.modelo ?? data.Modelo ?? "",
          Kilometraje: data.kilometraje ?? data.Kilometraje ?? "",
          Fecha: new Date().toISOString().slice(0, 10),
          FechaPrevistaEntrega: fechaPrevista
            ? String(fechaPrevista).slice(0, 10)
            : "",
          TiempoEstimadoHoras: tiempoEstimado ?? "",
          TipoOperacion: data.tipoOperacion ?? data.TipoOperacion ?? "Mecanica",
          Trabajo: diagnostico || motivo,
          Items:
            tiempoEstimadoNumero > 0
              ? [
                  createDetailItem(
                    diagnostico || motivo || "Trabajo mecánico",
                    tiempoEstimadoNumero,
                    0,
                    {
                      kind: "labor",
                      section: "ManoObra",
                    },
                  ),
                ]
              : [],
          Observaciones: observaciones,
          CodigoPostal: data.codigoPostal ?? data.CodigoPostal ?? "",
          Poblacion: data.poblacion ?? data.Poblacion ?? "",
          Provincia: data.provincia ?? data.Provincia ?? "",
          Clasificacion:
            data.clasificacion ?? data.Clasificacion ?? "Particular",
          Bastidor: data.bastidor ?? data.Bastidor ?? "",
          FechaMatriculacion: String(
            data.fechaMatriculacion ?? data.FechaMatriculacion ?? "",
          ).slice(0, 10),
          Motor: data.motor ?? data.Motor ?? "",
          Kw: data.kw ?? data.Kw ?? "",
          Cv: data.cv ?? data.Cv ?? "",
          Combustible: data.combustible ?? data.Combustible ?? "",
        });
        setNotice("Pre-orden cargada. Completa la orden y guardala.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error(err);
        if (alive) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "No se pudo cargar la pre-orden.",
          );
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(customerSearch);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerSearch]);

  useEffect(() => {
    const refreshOrders = () => {
      if (showOrders) loadOrders();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshOrders();
      }
    };

    const onStorage = (event) => {
      if (event.key === "tc:invoice-issued") {
        refreshOrders();
      }
    };

    const onMessage = (event) => {
      if (event?.data?.type === "tc:invoice-issued") {
        refreshOrders();
      }
    };

    window.addEventListener("focus", refreshOrders);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("storage", onStorage);
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("focus", refreshOrders);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("message", onMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOrders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showOrders) loadOrders(1);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateSearch, dateFrom, dateTo, showOrders]);

  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);

      if (el) {
        setTimeout(() => {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  }, []);

  const updateOrderState = async (targetOrder, nextState) => {
    const previousState = normalizeWorkOrderState(targetOrder.Estado);

    try {
      setError("");
      await api.put(`/OrdenTrabajo/estado/${targetOrder.Id}`, {
        estado: nextState,
      });

      const updatedOrder = {
        ...targetOrder,
        Estado: nextState,
      };

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.Id === targetOrder.Id ? updatedOrder : item,
        ),
      );

      if (
        whatsappEnabled &&
        previousState !== "Terminado" &&
        nextState === "Terminado"
      ) {
        setReadyWhatsappOrder(updatedOrder);
        setNotice(
          "Orden marcada como lista. Puedes avisar al cliente por WhatsApp.",
        );
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }, 100);
      }

      return true;
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo actualizar el estado.",
      );
      return false;
    }
  };

  const requestOrderStateChange = (targetOrder, nextState) => {
    if (
      requiresCompletionConfirmation(targetOrder.Estado, nextState)
    ) {
      setCompletionConfirmation({
        order: targetOrder,
        nextState,
        loading: false,
      });
      return;
    }

    void updateOrderState(targetOrder, nextState);
  };

  const closeCompletionConfirmation = () => {
    if (completionConfirmation.loading) return;
    setCompletionConfirmation({
      order: null,
      nextState: "",
      loading: false,
    });
  };

  const confirmOrderCompletion = async () => {
    const targetOrder = completionConfirmation.order;
    const nextState = completionConfirmation.nextState;
    if (!targetOrder || !nextState || completionConfirmation.loading) return;

    setCompletionConfirmation((current) => ({
      ...current,
      loading: true,
    }));

    const updated = await updateOrderState(targetOrder, nextState);

    if (updated) {
      setCompletionConfirmation({
        order: null,
        nextState: "",
        loading: false,
      });
      return;
    }

    setCompletionConfirmation((current) => ({
      ...current,
      loading: false,
    }));
  };

  const startEdit = (o) => {
    if (isWorkOrderEditLocked(o.Estado)) {
      setError(
        "No se puede editar una orden en reparacion, lista o entregada.",
      );
      return;
    }

    setEditingId(o.Id);

    setOrder({
      ClienteId: o.ClienteId || "",
      VehiculoId: o.VehiculoId || "",
      Cliente: o.Cliente || "",
      Dni: o.Dni || "",
      Telefono: o.Telefono || "",
      Direccion: o.Direccion || "",
      CodigoPostal: o.CodigoPostal || "",
      Poblacion: o.Poblacion || "",
      Provincia: o.Provincia || "",
      Clasificacion: o.Clasificacion || "Particular",
      Matricula: o.Matricula || "",
      Bastidor: o.Bastidor || "",
      Marca: o.Marca || "",
      Modelo: o.Modelo || "",
      FechaMatriculacion: o.FechaMatriculacion
        ? String(o.FechaMatriculacion).slice(0, 10)
        : "",
      Motor: o.Motor || "",
      Kw: o.Kw || "",
      Cv: o.Cv || "",
      Combustible: o.Combustible || "",
      Kilometraje: o.Kilometraje || "",
      Fecha: o.Fecha
        ? String(o.Fecha).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      FechaPrevistaEntrega: o.FechaPrevistaEntrega
        ? String(o.FechaPrevistaEntrega).slice(0, 10)
        : "",
      TiempoEstimadoHoras: o.TiempoEstimadoHoras || "",
      TipoOperacion: o.TipoOperacion || "Mecanica",
      Trabajo: o.Trabajo || "",
      Items: o.Items || [],
      Repuestos: o.Repuestos || "",
      Cantidad: o.Cantidad || "1",
      ManoObra: o.ManoObra || "",
      Estado: o.Estado || "Recibido",
      Observaciones: o.Observaciones || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      setNotice("");
      setError("");

      const payload = buildWorkOrderPayload(order, detailedRepairLinesEnabled);

      let savedOrderId = editingId;
      if (editingId) {
        ensureOk(await api.put(`/OrdenTrabajo/${editingId}`, payload));
        setSuccessModal("Orden actualizada correctamente.");
      } else {
        const created = ensureOk(await api.post("/OrdenTrabajo", payload));
        savedOrderId =
          created?.data?.[0]?.id ??
          created?.data?.[0]?.Id ??
          created?.Data?.[0]?.id ??
          created?.Data?.[0]?.Id ??
          null;
        setSuccessModal("Orden registrada correctamente.");
      }

      if (!editingId && preOrderSourceId && savedOrderId) {
        await api.put(`/PreOrdenTrabajo/${preOrderSourceId}/convertida`, {
          idOrdenTrabajo: savedOrderId,
        });
        setSuccessModal(
          "Orden registrada y pre-orden marcada como convertida.",
        );
        setPreOrderSourceId(null);
        setSearchParams({});
      }

      setOrder(EMPTY_ORDER);
      setEditingId(null);
      setCustomerSearch("");
      setCustomerMatches([]);
      setShowNewCustomer(false);
      setQuickCreateNotice("");
      setWarningModal("");

      await loadOrders(showOrders ? orderPage : 1);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo registrar la orden.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cls =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

  const filteredOrders = orders;
  const orderTotalPages = Math.max(1, Math.ceil(orderTotal / orderPageSize));
  const receivedOrdersCount = filteredOrders.filter(
    (item) => String(item.Estado || "").toLowerCase() === "recibido",
  ).length;

  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);

      if (el) {
        setTimeout(() => {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  }, []);

  console.log(order);

  return (
    <>
      <SmallSuccessModal
        open={Boolean(successModal)}
        message={successModal}
        onClose={() => setSuccessModal("")}
      />
      <SmallSuccessModal
        open={Boolean(warningModal)}
        title="Cliente sin coche"
        message={warningModal}
        variant="warning"
        onClose={() => setWarningModal("")}
      />
      <ConfirmActionModal
        open={Boolean(completionConfirmation.order)}
        title="Marcar orden como terminada"
        message="Esta acción es irreversible: después de terminar la orden no podrás volver a estados anteriores ni editarla. ¿Deseas continuar?"
        confirmLabel="Sí, terminar orden"
        loading={completionConfirmation.loading}
        onConfirm={confirmOrderCompletion}
        onCancel={closeCompletionConfirmation}
      />

      <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {labels.orderTitle}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{labels.orderSubtitle}</p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 p-3 text-sm">
          {notice}
        </div>
      )}

      {readyWhatsappOrder && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[min(calc(100vw-2rem),420px)] rounded-2xl bg-green-50 p-4 text-green-800 shadow-2xl ring-1 ring-green-200">
          <p className="font-bold">Orden lista para retirar</p>

          <p className="mt-1 text-sm">
            Notificale a {readyWhatsappOrder.Cliente} que ya puede retirar su
            vehículo.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                openWhatsAppVehicleReady(readyWhatsappOrder, workshopName);
                setReadyWhatsappOrder(null);
              }}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
            >
              Avisar por WhatsApp
            </button>

            <button
              type="button"
              onClick={() => {
                saveReadyOrderAlert(readyWhatsappOrder, workshopName);
                setReadyWhatsappOrder(null);
                setNotice("Notificación guardada en la campanita.");
              }}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-green-700 ring-1 ring-green-200 hover:bg-green-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 p-3 text-sm">
          {error}
        </div>
      )}

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric
          label="Recibidas en pantalla"
          value={loadingOrders ? "..." : receivedOrdersCount}
        />
        <Metric
          label="Órdenes totales"
          value={loadingOrders ? "..." : orderTotal}
        />
        <Metric label="Página" value={`${orderPage}/${orderTotalPages}`} />
      </section>

      <form
        onSubmit={onSubmit}
        autoComplete="off"
        className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 space-y-5"
      >
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Wrench size={18} className="text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-800">
              {editingId ? "Editar orden" : "Nueva orden"}
            </h3>
          </div>

          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Buscar cliente registrado
            </label>

            <div className="relative">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                autoComplete="off"
                className={`${cls} pl-10`}
                placeholder="Nombre, teléfono, matrícula o modelo"
              />

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              {customerSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearch("");
                    setCustomerMatches([]);
                    setCustomerVehicles([]);
                    setSelectedCustomerForVehicles(null);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {loadingCustomers && (
              <p className="mt-3 text-sm text-slate-500">
                Buscando clientes...
              </p>
            )}

            {!loadingCustomers &&
              customerSearch.trim().length >= 2 &&
              customerMatches.length === 0 && (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
                  No encontramos ese cliente.
                </div>
              )}

            {customerMatches.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {customerMatches.map((customer) => (
                  <button
                    key={customer.Id}
                    type="button"
                    onClick={() => selectCustomerMatch(customer)}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span className="block font-semibold text-slate-900">
                      {customer.Nombre}
                    </span>

                    <span className="mt-1 block text-slate-600">
                      {customer.Matricula || "Sin matrícula"} · {customer.Marca}{" "}
                      {customer.Modelo}
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      {customer.Telefono || "Sin teléfono"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {loadingCustomerVehicles && (
              <p className="mt-3 text-sm text-slate-500">
                Cargando vehiculos del cliente...
              </p>
            )}

            {selectedCustomerForVehicles && customerVehicles.length > 1 && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="mb-2 text-sm font-semibold text-emerald-900">
                  Selecciona el vehiculo de {selectedCustomerForVehicles.Nombre}
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {customerVehicles.map((vehicle) => (
                    <button
                      key={vehicle.Id}
                      type="button"
                      onClick={() =>
                        fillOrderFromCustomer(
                          selectedCustomerForVehicles,
                          vehicle,
                        )
                      }
                      className="rounded-xl border border-emerald-200 bg-white p-3 text-left text-sm hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <span className="block font-semibold text-slate-900">
                        {vehicle.Matricula || "Sin matricula"}
                      </span>
                      <span className="mt-1 block text-slate-600">
                        {vehicle.Marca || "-"} {vehicle.Modelo || ""}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {vehicle.Bastidor
                          ? `Bastidor ${vehicle.Bastidor}`
                          : "Sin bastidor"}{" "}
                        ·{" "}
                        {vehicle.Kilometraje
                          ? `${vehicle.Kilometraje} ${labels.metricLabel}`
                          : "Sin kilometraje"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400">o</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={toggleQuickCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <UserPlus size={17} />

                {showNewCustomer
                  ? "Ocultar alta rapida"
                  : order.ClienteId
                    ? "Agregar otro vehiculo"
                    : "Registrar nuevo"}
              </button>
              {showNewCustomer && order.ClienteId && (
                <p className="mt-2 text-xs font-medium text-emerald-700 ">
                  Se guardara como nuevo vehiculo de {order.Cliente}.
                </p>
              )}

              {showNewCustomer && (
                <button
                  type="button"
                  onClick={createCustomerFromOrder}
                  disabled={savingCustomer}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <UserPlus size={17} />

                  {savingCustomer
                    ? "Guardando..."
                    : order.ClienteId
                      ? "Guardar vehiculo en cliente"
                      : "Guardar cliente nuevo"}
                </button>
              )}

              {quickCreateNotice && (
                <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-emerald-800">
                      {quickCreateNotice}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuickCreateNotice("")}
                    className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
                    aria-label="Cerrar aviso"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
          {shouldShowOrderForm ? (
            <div className="space-y-5">
              <FormSection title="Cliente">
                <input
                  name="Cliente"
                  value={order.Cliente}
                  onChange={handleChange}
                  autoComplete="off"
                  className={cls}
                  placeholder="Cliente *"
                  required
                />

                <input
                  name="Dni"
                  value={order.Dni}
                  onChange={handleChange}
                  autoComplete="off"
                  className={cls}
                  placeholder="DNI/NIE"
                />

                <input
                  name="Telefono"
                  value={order.Telefono}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={cls}
                  placeholder="Teléfono"
                />

                <select
                  name="Clasificacion"
                  value={order.Clasificacion}
                  onChange={handleChange}
                  className={cls}
                >
                  <option value="Particular">Particular</option>
                  <option value="Empresa">Empresa</option>
                  <option value="Compania de seguro">Compañía de seguro</option>
                </select>

                <input
                  name="Direccion"
                  value={order.Direccion}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm md:col-span-2"
                  placeholder="Dirección del cliente"
                />

                <input
                  name="CodigoPostal"
                  value={order.CodigoPostal}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={cls}
                  placeholder="Código postal"
                />

                <input
                  name="Poblacion"
                  value={order.Poblacion}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={cls}
                  placeholder="Población"
                />

                <input
                  name="Provincia"
                  value={order.Provincia}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={cls}
                  placeholder="Provincia"
                />
              </FormSection>

              <FormSection title="Vehículo">
                <input
                  name="Matricula"
                  value={order.Matricula}
                  onChange={handleChange}
                  className={cls}
                  placeholder={labels.referencePlaceholder}
                  required
                />

                <input
                  name="Marca"
                  value={order.Marca}
                  onChange={handleChange}
                  className={cls}
                  placeholder={labels.makeLabel}
                />

                <input
                  name="Modelo"
                  value={order.Modelo}
                  onChange={handleChange}
                  className={cls}
                  placeholder={`${labels.modelLabel} *`}
                  required
                />

                <input
                  name="Bastidor"
                  value={order.Bastidor}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Bastidor"
                />

                <Field label="Fecha matriculación">
                  <input
                    name="FechaMatriculacion"
                    type="date"
                    value={order.FechaMatriculacion}
                    onChange={handleChange}
                    className={cls}
                  />
                </Field>

                <input
                  name="Kilometraje"
                  type="number"
                  value={order.Kilometraje}
                  onChange={handleChange}
                  className={cls}
                  placeholder={labels.metricPlaceholder}
                />

                <input
                  name="Combustible"
                  value={order.Combustible}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Combustible"
                />

                <input
                  name="Motor"
                  value={order.Motor}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Motor"
                />

                <input
                  name="Cv"
                  type="number"
                  step="0.01"
                  value={order.Cv}
                  onChange={handleChange}
                  className={cls}
                  placeholder="CV"
                />

                <input
                  name="Kw"
                  type="number"
                  step="0.01"
                  value={order.Kw}
                  onChange={handleChange}
                  className={cls}
                  placeholder="KW"
                />
              </FormSection>

              <FormSection title="Recepción">
                <Field label="Fecha recepción">
                  <input
                    name="Fecha"
                    type="date"
                    value={order.Fecha}
                    onChange={handleChange}
                    className={cls}
                  />
                </Field>

                <Field label="Fecha prevista de entrega">
                  <input
                    name="FechaPrevistaEntrega"
                    type="date"
                    value={order.FechaPrevistaEntrega}
                    onChange={handleChange}
                    className={cls}
                  />
                </Field>

                <input
                  name="TiempoEstimadoHoras"
                  type="number"
                  min="0"
                  step="0.25"
                  value={order.TiempoEstimadoHoras}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Tiempo estimado horas"
                />

                <select
                  name="TipoOperacion"
                  value={order.TipoOperacion}
                  onChange={handleChange}
                  className={cls}
                >
                  {operationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  name="Estado"
                  value={order.Estado}
                  onChange={handleChange}
                  className={cls}
                >
                  {(editingId
                    ? getAllowedWorkOrderStates(order.Estado, false)
                    : ["Recibido"]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormSection>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Busca un cliente registrado o crea uno nuevo para iniciar la
                orden.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Cuando selecciones el vehículo, aparecerán los datos necesarios
                para completar el trabajo y los costes.
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Trabajo y costes
          </h3>

          <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:grid-cols-[1fr_1fr_auto]">
            <div className="relative">
              <Wrench
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                defaultValue=""
                onChange={(e) => {
                  appendServiceToTrabajo(e.target.value);
                  e.target.value = "";
                }}
                className={`${cls} pl-9`}
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

            <input
              className={cls}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <textarea
              name="Trabajo"
              value={order.Trabajo}
              onChange={handleChange}
              className={`${cls} md:col-span-3`}
              rows={3}
              placeholder="Trabajo solicitado o realizado *"
              required
            />

            <div className="md:col-span-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Lineas de detalle / costes
            </div>

            {detailedRepairLinesEnabled && (
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={addManualDetailLine}
                  className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Agregar linea
                </button>
              </div>
            )}

            <div className="space-y-2 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50/80 p-3 md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Repuesto
              </label>
              <PartPicker
                onSelect={addPartToOrder}
                placeholder="Buscar pieza o repuesto"
                buttonLabel="Agregar"
              />
            </div>

            <div className="space-y-2 rounded-r-xl border border-l-0 border-slate-200 bg-slate-50/80 p-3 md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mano de obra (EUR)
              </label>
              <input
                name="ManoObra"
                type="number"
                step="0.01"
                value={order.ManoObra}
                onChange={handleChange}
                onBlur={(e) => upsertLaborItem(e.target.value)}
                className={cls}
                placeholder="Mano de obra"
              />
            </div>

            <textarea
              name="Observaciones"
              value={order.Observaciones}
              onChange={handleChange}
              className={`${cls} md:col-span-3`}
              rows={2}
              placeholder="Observaciones internas"
            />

            <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-right">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total estimado
              </div>
              <div className="mt-2 text-xl font-semibold text-slate-900">
                {total.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </div>
            </div>

            {detailItems.length > 0 && (
              <div className="md:col-span-4 rounded-xl border border-slate-200 bg-white p-3">
                {detailedRepairLinesEnabled && (
                  <div className="hidden xl:grid grid-cols-[85px_130px_minmax(0,1fr)_115px_95px_80px_75px_120px_40px] gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <div>Codigo</div>
                    <div>Seccion</div>
                    <div>Descripcion</div>
                    <div>Tiempo/Cant.</div>
                    <div>Precio</div>
                    <div>%DTO</div>
                    <div>%IVA</div>
                    <div className="text-right">Importe</div>
                    <div />
                  </div>
                )}
                {!detailedRepairLinesEnabled && (
                  <div className="hidden lg:grid grid-cols-[100px_minmax(0,1fr)_150px_150px_40px] gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <div>Cantidad</div>
                    <div>Detalle de la orden</div>
                    <div>P. Unit.</div>
                    <div className="text-center">Importe</div>
                    <div />
                  </div>
                )}
                <div className="space-y-2">
                  {detailItems.map((item) => {
                    const section = getRepairLineSection(item);
                    const lineTotal = getRepairLineTotal(item);

                    return (
                      <div
                        key={item.id}
                        className={
                          detailedRepairLinesEnabled
                            ? "grid grid-cols-1 gap-2 xl:grid-cols-[85px_130px_minmax(0,1fr)_115px_95px_80px_75px_120px_40px]"
                            : "grid grid-cols-1 gap-2 lg:grid-cols-[100px_minmax(0,1fr)_150px_150px_40px]"
                        }
                      >
                        {detailedRepairLinesEnabled && (
                          <>
                            <input
                              value={item.codigo || ""}
                              onChange={(e) =>
                                setDetailItemField(
                                  item.id,
                                  "codigo",
                                  e.target.value,
                                )
                              }
                              className={cls}
                              placeholder="Codigo"
                            />
                            <select
                              value={section}
                              onChange={(e) =>
                                setDetailItemField(
                                  item.id,
                                  "section",
                                  e.target.value,
                                )
                              }
                              className={cls}
                            >
                              <option value="ManoObra">Mano obra</option>
                              <option value="Piezas">
                                {order.TipoOperacion === "Chapa y pintura"
                                  ? "Materiales"
                                  : "Piezas"}
                              </option>
                              {order.TipoOperacion === "Chapa y pintura" && (
                                <option value="Pintura">Pintura</option>
                              )}
                            </select>
                          </>
                        )}
                       
                      {detailedRepairLinesEnabled ? (
  <>
    <input
      value={item.descripcion}
      onChange={(e) =>
        setDetailItemField(item.id, "descripcion", e.target.value)
      }
      className={cls}
      placeholder="Descripcion"
    />

    <input
      type="number"
      min="0.01"
      step="0.01"
      value={getRepairLineQuantity(item)}
      onChange={(e) =>
        setDetailItemField(
          item.id,
          section !== "Piezas" ? "tiempo" : "cantidad",
          e.target.value,
        )
      }
      className={cls}
      placeholder={section === "Piezas" ? "Cantidad" : "Tiempo"}
    />
  </>
) : (
  <>
    <input
      type="number"
      min="0.01"
      step="0.01"
      value={item.cantidad}
      onChange={(e) =>
        setDetailItemField(item.id, "cantidad", e.target.value)
      }
      className={cls}
      placeholder="Cantidad"
    />

    <input
      value={item.descripcion}
      onChange={(e) =>
        setDetailItemField(item.id, "descripcion", e.target.value)
      }
      className={cls}
      placeholder="Descripcion"
    />
  </>
)}
                        <input
                          type="number"
                          step="0.01"
                          value={item.precioUnitario}
                          onChange={(e) =>
                            setDetailItemField(
                              item.id,
                              "precioUnitario",
                              e.target.value,
                            )
                          }
                          onBlur={(e) =>
                            setDetailItemField(
                              item.id,
                              "precioUnitario",
                              Number(e.target.value || 0).toFixed(2),
                            )
                          }
                          className={cls}
                          placeholder="Precio"
                        />
                        {detailedRepairLinesEnabled && (
                          <>
                            <input
                              type="number"
                              step="0.01"
                              value={item.descuentoPct ?? 0}
                              onChange={(e) =>
                                setDetailItemField(
                                  item.id,
                                  "descuentoPct",
                                  e.target.value,
                                )
                              }
                              className={cls}
                              placeholder="%DTO"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={item.ivaPct ?? 21}
                              onChange={(e) =>
                                setDetailItemField(
                                  item.id,
                                  "ivaPct",
                                  e.target.value,
                                )
                              }
                              className={cls}
                              placeholder="%IVA"
                            />
                          </>
                        )}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-semibold text-slate-800">
                          {lineTotal.toLocaleString("es-ES", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDetailItem(item.id)}
                          className="inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100"
                          aria-label="Eliminar línea"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center rounded-xl px-5 py-3 bg-amber-600 text-white hover:bg-amber-700 transition shadow-md font-bold disabled:opacity-60"
          >
            {submitting
              ? "Guardando..."
              : editingId
                ? "Actualizar orden"
                : "Crear orden"}
          </button>

          <button
            type="button"
            onClick={() => {
              setOrder(EMPTY_ORDER);
              setEditingId(null);
              setPreOrderSourceId(null);
              setSearchParams({});
              setCustomerSearch("");
              setCustomerMatches([]);
              setShowNewCustomer(false);
              setQuickCreateNotice("");
            }}
            className="inline-flex items-center rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
          >
            Limpiar
          </button>
        </div>
      </form>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => {
            const next = !showOrders;
            setShowOrders(next);
            if (next) {
              setOrderPage(1);
              setTimeout(() => loadOrders(1), 0);
            }
          }}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          {showOrders ? "Ocultar órdenes" : "Ver órdenes"}
        </button>
      </div>

      {showOrders && (
        <section
          id="ordenes-recientes"
          className="mt-4 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-6"
        >
          <div className="grid grid-cols-1 gap-3 mb-6 md:grid-cols-[1fr_minmax(180px,320px)_auto_auto_auto] md:items-end">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800">
                Órdenes recientes
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Busca rápidamente una orden por matrícula.
              </p>
            </div>

            <input
              type="text"
              value={plateSearch}
              onChange={(e) => setPlateSearch(e.target.value)}
              placeholder={labels.referenceSearchPlaceholder}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {(plateSearch || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setPlateSearch("");
                  setDateFrom("");
                  setDateTo("");
                  setOrderPage(1);
                }}
                className="w-full rounded-2xl px-4 py-3 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition md:w-auto"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4">
            {loadingOrders && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                Cargando órdenes...
              </div>
            )}

            {filteredOrders.map((o) => (
              <article
                key={o.Id}
                className={`rounded-2xl border p-4 shadow-sm hover:shadow-md transition sm:p-5 ${getStateStyles(o.Estado)}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold text-slate-900">
                      {o.Matricula}
                    </h4>

                    <p className="text-sm text-slate-500">
                      {o.Marca} {o.Modelo}
                    </p>
                  </div>

                  <select
                    value={normalizeWorkOrderState(o.Estado)}
                    onChange={(e) =>
                      requestOrderStateChange(o, e.target.value)
                    }
                    className={`w-full rounded-full px-3 py-2 text-xs font-medium ring-1 bg-white sm:w-auto sm:py-1 ${
                      o.Estado === "Entregado"
                        ? "text-emerald-700 ring-emerald-200"
                        : o.Estado === "Reparando"
                          ? "text-amber-700 ring-amber-200"
                          : "text-slate-700 ring-slate-200"
                    }`}
                  >
                    {getAllowedWorkOrderStates(
                      o.Estado,
                      Boolean(o.Facturada || o.facturada),
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                  <div className="min-w-0 rounded-xl bg-white/50 p-3 text-left sm:text-center">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Cliente
                    </p>

                    <p className="text-md break-words font-semibold text-slate-800 sm:truncate">
                      {o.Cliente}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl bg-white/50 p-3 text-left sm:text-center">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Trabajo
                    </p>

                    <p className="text-md break-words text-slate-700 sm:line-clamp-2">
                      {o.Trabajo}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Total
                    </p>

                    <p className="text-xl font-bold text-slate-900">
                      {o.Total.toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
                    <a
                      href={`/print-order/${o.Id}?print=1`}
                      rel="noopener noreferrer"
                      className="inline-flex justify-center rounded-xl px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-sm font-medium text-slate-700 transition"
                    >
                      Imprimir
                    </a>

                    {useZagaDocuments && (
                      <>
                        {preOrdersEnabled && (
                          <a
                            href={
                              o.PreOrdenId
                                ? `/print-pre-order/${o.PreOrdenId}`
                                : "#"
                            }
                            rel="noopener noreferrer"
                            onClick={(event) => {
                              if (!o.PreOrdenId) {
                                event.preventDefault();
                                setError(
                                  "Esta orden no tiene una pre-orden asociada.",
                                );
                              }
                            }}
                            className="inline-flex justify-center rounded-xl px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-sm font-medium text-slate-700 transition"
                          >
                            Ver Pre-orden
                          </a>
                        )}

                        <a
                          href={`/print-order/${o.Id}?type=resguardo&print=1`}
                          rel="noopener noreferrer"
                          className="inline-flex justify-center rounded-xl px-3 py-2 bg-slate-700 hover:bg-slate-800 text-sm font-medium text-white transition"
                        >
                          Resguardo
                        </a>
                      </>
                    )}

                    {receptionPhotosEnabled && (
                      <button
                        type="button"
                        onClick={() => setPhotoTarget(o)}
                        className="inline-flex justify-center gap-2 rounded-xl px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-sm font-medium text-slate-700 transition"
                      >
                        <Images size={16} />
                        Fotos
                      </button>
                    )}

                    {!isWorkOrderEditLocked(o.Estado) && (
                      <button
                        type="button"
                        onClick={() => startEdit(o)}
                        className="inline-flex justify-center rounded-xl px-3 py-2 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition"
                      >
                        Editar
                      </button>
                    )}

                    {canInvoiceWorkOrder(o.Estado) &&
                      !(o.Facturada || o.facturada) && (
                      <Link
                        to={`/workshop-invoice/${o.Id}`}
                        rel="noopener noreferrer"
                        className="inline-flex justify-center rounded-xl px-3 py-2 bg-orange-600 hover:bg-orange-700 text-sm font-medium text-white transition"
                      >
                        Facturar
                      </Link>
                    )}

                    {(o.Facturada || o.facturada) && (
                      <Link
                        to={`/reprint-invoice/order/${o.Id}`}
                        rel="noopener noreferrer"
                        className="col-span-2 inline-flex justify-center rounded-xl px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-sm font-medium text-white transition sm:col-span-1"
                      >
                        Reimprimir factura
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {!loadingOrders && filteredOrders.length === 0 && (
              <div className="lg:col-span-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-sm font-bold uppercase text-orange-600">
                  OT
                </div>

                <h4 className="mt-4 text-lg font-semibold text-slate-800">
                  {plateSearch || dateFrom || dateTo
                    ? "No se encontraron órdenes"
                    : "No hay órdenes registradas"}
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  {plateSearch
                    ? "Prueba buscando otra matrícula."
                    : "Las nuevas órdenes aparecerán aquí automáticamente."}
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col items-stretch justify-center gap-3 text-sm sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={orderPage <= 1 || loadingOrders}
              onClick={() => loadOrders(orderPage - 1)}
              className="rounded-xl bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-center text-slate-600">
              Página {orderPage} de {orderTotalPages} · {orderTotal} órdenes
            </span>
            <button
              type="button"
              disabled={orderPage >= orderTotalPages || loadingOrders}
              onClick={() => loadOrders(orderPage + 1)}
              className="rounded-xl bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {photoTarget && (
        <ReceptionPhotosModal
          open={!!photoTarget}
          onClose={() => setPhotoTarget(null)}
          orderId={photoTarget.Id}
          title="Fotos de recepción"
          subtitle={`${photoTarget.Matricula || ""} - ${photoTarget.Cliente || ""}`}
          canUpload={false}
          context={{
            orderId: photoTarget.Id,
            cliente: photoTarget.Cliente,
            matricula: photoTarget.Matricula,
          }}
        />
      )}
    </>
  );
}

function normalizeOperationTypes(types) {
  const list = Array.isArray(types) ? types : ["Mecanica"];
  const filtered = list.filter((type) => type && type !== "Recambio");
  return filtered.length ? filtered : ["Mecanica"];
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
        {title}
      </h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}
