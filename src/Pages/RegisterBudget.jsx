import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileSignature,
  Search,
  Trash2,
  UserPlus,
  Wrench,
  X,
  Info,
  Plus,
} from "lucide-react";
import api from "../Components/api";
import { useBusinessTerminology } from "../utils/businessTerminology";
import SignatureModal from "../Components/SignatureModal";
import SmallSuccessModal from "../Components/SmallSuccessModal";
import PartPicker, {
  getPartDisplayName,
  getPartId,
  getPartProviderId,
  getPartProviderName,
  getPartPurchasePrice,
  getPartSalePrice,
} from "../Components/PartPicker";
import { amountInput } from "../utils/currency";

const EMPTY_BUDGET = {
  NumeroPresupuesto: "",
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
  TipoOperacion: "Mecanica",
  Trabajo: "",
  Items: [],
  Repuestos: "",
  Cantidad: "1",
  ManoObra: "",
  Estado: "Pendiente",
  Observaciones: "",
};

const states = ["Pendiente", "Aprobado", "Rechazado", "Convertido"];

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

const ensureOk = (res) => {
  const data = res?.data;
  if (data?.ok === 0 || data?.Ok === 0) {
    throw new Error(
      data?.message || data?.Message || "La operación no se pudo completar.",
    );
  }
  return data;
};

function firstResponseItem(data) {
  return data?.data?.[0] ?? data?.Data?.[0] ?? null;
}

function normalizeLookup(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePlate(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export default function RegisterBudget() {
  const labels = useBusinessTerminology();
  const [budget, setBudget] = useState(EMPTY_BUDGET);
  const [budgets, setBudgets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState("create");

  const [notice, setNotice] = useState("");
  const [successModal, setSuccessModal] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [budgetSearch, setBudgetSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMatches, setCustomerMatches] = useState([]);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [selectedCustomerForVehicles, setSelectedCustomerForVehicles] =
    useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingCustomerVehicles, setLoadingCustomerVehicles] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [quickCreateNotice, setQuickCreateNotice] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [budgetPage, setBudgetPage] = useState(1);
  const [budgetTotal, setBudgetTotal] = useState(0);
  const [frequentServices, setFrequentServices] = useState([]);
  const [operationTypes, setOperationTypes] = useState(["Mecanica"]);
  const [digitalSignaturesEnabled, setDigitalSignaturesEnabled] =
    useState(false);
  const [signatureModal, setSignatureModal] = useState({
    open: false,
    budget: null,
    saving: false,
  });
  const [newServiceName, setNewServiceName] = useState(SERVICE_PREFIX);
  const [savingService, setSavingService] = useState(false);

  const budgetPageSize = 10;

  const detailItems = Array.isArray(budget.Items) ? budget.Items : [];
  const hasSelectedClient = Boolean(budget.Cliente);
  const hasSelectedVehicle = Boolean(
    budget.Matricula || budget.Modelo || budget.VehiculoId,
  );
  const shouldShowBudgetFields =
    showNewCustomer || editingId || hasSelectedClient;
  const detailTotal = detailItems.reduce(
    (sum, item) => sum + getBudgetLineTotal(item),
    0,
  );
  const total = detailItems.length
    ? detailTotal
    : Number(budget.ManoObra || 0) +
      Number(budget.Repuestos || 0) * Number(budget.Cantidad || 1);

  const setField = (name, value) => {
    setBudget((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
//revisar
  const resetBudgetForm = () => {
    setBudget(EMPTY_BUDGET);
    setEditingId(null);
    setCustomerSearch("");
    setCustomerMatches([]);
    setCustomerVehicles([]);
    setSelectedCustomerForVehicles(null);
    setShowNewCustomer(false);
    setQuickCreateNotice("");
  };

  const handleChange = (e) => {
    setField(e.target.name, e.target.value);
  };

  const loadFrequentServices = async () => {
    try {
      const res = await api.get("/ServicioFrecuente");
      const list = res?.data?.data?.[0] || [];
      const names = list.map((x) => x.nombre ?? x.Nombre).filter(Boolean);
      setFrequentServices(names.length ? names : DEFAULT_FREQUENT_SERVICES);
    } catch (err) {
      console.error(err);
      setFrequentServices(DEFAULT_FREQUENT_SERVICES);
    }
  };

  const loadWorkshopSettings = async () => {
    try {
      const res = await api.get("/WorkshopSettings");
      const data = res?.data || {};
      setOperationTypes(
        normalizeOperationTypes(data.operationTypes ?? data.OperationTypes),
      );
      setDigitalSignaturesEnabled(
        data.enableDigitalSignatures ?? data.EnableDigitalSignatures ?? false,
      );
    } catch {
      setOperationTypes(["Mecanica"]);
      setDigitalSignaturesEnabled(false);
    }
  };

  const appendServiceToTrabajo = (service) => {
    const value = service?.trim();
    if (!value) return;
    setBudget((prev) => ({
      ...prev,
      Items: [
        ...(Array.isArray(prev.Items) ? prev.Items : []),
        createDetailItem(value, 1, 0),
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
    section: extra.kind === "repuesto" ? "Piezas" : "ManoObra",
    descuentoPct: 0,
    ivaPct: 21,
    ...extra,
  });

  const setDetailItemField = (id, field, value) => {
    setBudget((prev) => ({
      ...prev,
      Items: (Array.isArray(prev.Items) ? prev.Items : []).map((item) =>
        item.id === id
          ? normalizeBudgetLine({ ...item, [field]: value })
          : item,
      ),
    }));
  };

  const upsertLaborItem = (value) => {
    const amount = amountInput(value);
    setBudget((prev) => {
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
    setBudget((prev) => ({
      ...prev,
      Items: (Array.isArray(prev.Items) ? prev.Items : []).filter(
        (item) => item.id !== id,
      ),
    }));
  };

  const addManualDetailLine = () => {
    const section =
      budget.TipoOperacion === "Chapa y pintura" ? "Piezas" : "ManoObra";
    setBudget((prev) => ({
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

  const addPartToBudget = (part) => {
    const name = getPartDisplayName(part);
    const price = getPartSalePrice(part);
    if (!name) return;

    setBudget((prev) => {
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

  const normalizeBudget = (x) => ({
    Id: x.id ?? x.Id,
    NumeroPresupuesto: x.numeroPresupuesto ?? x.NumeroPresupuesto ?? "",
    Cliente: x.cliente ?? x.Cliente ?? "",
    Dni: x.dni ?? x.Dni ?? "",
    Telefono: x.telefono ?? x.Telefono ?? "",
    Direccion: x.direccion ?? x.Direccion ?? "",
    CodigoPostal: x.codigoPostal ?? x.CodigoPostal ?? "",
    Poblacion: x.poblacion ?? x.Poblacion ?? "",
    Provincia: x.provincia ?? x.Provincia ?? "",
    Clasificacion: x.clasificacion ?? x.Clasificacion ?? "Particular",
    Matricula: x.matricula ?? x.Matricula ?? "",
    Bastidor: x.bastidor ?? x.Bastidor ?? "",
    Marca: x.marca ?? x.Marca ?? "",
    Modelo: x.modelo ?? x.Modelo ?? "",
    FechaMatriculacion: String(
      x.fechaMatriculacion ?? x.FechaMatriculacion ?? "",
    ).slice(0, 10),
    Motor: x.motor ?? x.Motor ?? "",
    Kw: x.kw ?? x.Kw ?? "",
    Cv: x.cv ?? x.Cv ?? "",
    Combustible: x.combustible ?? x.Combustible ?? "",
    Kilometraje: x.kilometraje ?? x.Kilometraje ?? "",
    Fecha: x.fecha ?? x.Fecha,
    TipoOperacion: x.tipoOperacion ?? x.TipoOperacion ?? "Mecanica",
    Trabajo: x.trabajo ?? x.Trabajo ?? "",
    Repuestos: x.repuestos ?? x.Repuestos ?? 0,
    Cantidad: x.cantidad ?? x.Cantidad ?? 1,
    ManoObra: x.manoObra ?? x.ManoObra ?? 0,
    Items: parseDetailItems(x.itemsJson ?? x.ItemsJson),
    Estado: x.estado ?? x.Estado ?? "Pendiente",
    Observaciones: x.observaciones ?? x.Observaciones ?? "",
    ConvertidoEnOrden: x.convertidoEnOrden ?? x.ConvertidoEnOrden ?? false,
    IdOrdenTrabajo: x.idOrdenTrabajo ?? x.IdOrdenTrabajo ?? null,
    AcceptanceSignatureBase64:
      x.acceptanceSignatureBase64 ?? x.AcceptanceSignatureBase64 ?? "",
    AcceptanceSignatureDate:
      x.acceptanceSignatureDate ?? x.AcceptanceSignatureDate ?? null,
    IsAccepted: x.isAccepted ?? x.IsAccepted ?? false,
  });

  const parseDetailItems = (itemsJson) => {
    if (!itemsJson) return [];
    try {
      const parsed = JSON.parse(itemsJson);
      return Array.isArray(parsed)
        ? parsed.map((item, index) =>
            normalizeBudgetLine({
              id: item.id || `stored-${index}`,
              codigo: item.codigo ?? item.Codigo ?? "",
              section:
                item.section ??
                item.Section ??
                item.kind ??
                item.Kind ??
                item.tipo ??
                item.Tipo ??
                null,
              descripcion: item.descripcion || item.Descripcion || "",
              cantidad: item.cantidad ?? item.Cantidad ?? 1,
              tiempo:
                item.tiempo ??
                item.Tiempo ??
                item.cantidad ??
                item.Cantidad ??
                1,
              precioUnitario:
                item.precioUnitario ??
                item.PrecioUnitario ??
                item.importe ??
                item.Importe ??
                0,
              descuentoPct: item.descuentoPct ?? item.DescuentoPct ?? 0,
              ivaPct: item.ivaPct ?? item.IvaPct ?? 21,
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
            }),
          )
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

  const normalizeVehicle = (row) => ({
    Id: row.id ?? row.Id,
    ClienteId: row.clienteId ?? row.ClienteId,
    Matricula: row.matricula ?? row.Matricula ?? "",
    Bastidor: row.bastidor ?? row.Bastidor ?? "",
    Marca: row.marca ?? row.Marca ?? "",
    Modelo: row.modelo ?? row.Modelo ?? "",
    FechaMatriculacion: String(
      row.fechaMatriculacion ?? row.FechaMatriculacion ?? "",
    ).slice(0, 10),
    Motor: row.motor ?? row.Motor ?? "",
    Kw: row.kw ?? row.Kw ?? "",
    Cv: row.cv ?? row.Cv ?? "",
    Combustible: row.combustible ?? row.Combustible ?? "",
    Kilometraje: row.kilometraje ?? row.Kilometraje ?? "",
  });

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
    return (res?.data?.data?.[0] || []).map(normalizeVehicle);
  };

  const fillBudgetFromCustomer = async (customer, vehicle = null) => {
    const fullCustomer = await loadCustomerDetail(customer);
    setBudget((prev) => ({
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
    setBudget((prev) => ({
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
      const pack = res?.data?.data?.[0];
      const items = Array.isArray(pack?.items) ? pack.items : [];
      setCustomerMatches(items.map(normalizeCustomer));
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
    const pack = res?.data?.data?.[0];
    const items = Array.isArray(pack?.items ?? pack?.Items)
      ? (pack.items ?? pack.Items)
      : [];
    return items.map(normalizeCustomer);
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
          "Hay varios clientes con ese nombre. Selecciona el cliente desde el buscador antes de guardar.",
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

  const clearVehicleForQuickCreate = () => {
    setBudget((prev) => ({
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

    if (budget.ClienteId) {
      clearVehicleForQuickCreate();
      setQuickCreateNotice(
        `Cliente seleccionado. Completa los datos del nuevo vehículo de ${budget.Cliente}.`,
      );
    }

    setShowNewCustomer(true);
  };

  const selectCustomer = async (customer) => {
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
      const vehicles = await loadVehiclesForCustomer(customer.Id);

      if (vehicles.length === 0) {
        await fillCustomerOnlyForNewVehicle(customer);
        setCustomerVehicles([]);
        setQuickCreateNotice(
          `Cliente seleccionado. No tiene vehículos registrados; puedes agregar uno desde alta rápida.`,
        );
        return;
      }

      await fillCustomerOnlyForNewVehicle(customer);
      setCustomerVehicles(vehicles);
      setQuickCreateNotice(
        `Selecciona un vehículo de ${customer.Nombre} para el presupuesto.`,
      );
    } catch (err) {
      console.error(err);
      await fillBudgetFromCustomer(customer, fallbackVehicle);
    } finally {
      setLoadingCustomerVehicles(false);
    }
  };

  const loadCreatedCustomerAndVehicle = async (customerId, plate) => {
    const customer = await loadCustomerDetail({ Id: customerId });
    const vehicles = await loadVehiclesForCustomer(customerId);
    const vehicle =
      vehicles.find(
        (item) => normalizePlate(item.Matricula) === normalizePlate(plate),
      ) || vehicles[0];

    await fillBudgetFromCustomer(customer, vehicle || null);
  };

  const hasVehicleDataForQuickCreate = (payload) =>
    Boolean(
      payload.matricula?.trim() ||
      payload.modelo?.trim() ||
      payload.marca?.trim() ||
      payload.bastidor?.trim(),
    );

  const createCustomerFromBudget = async () => {
    if (savingCustomer) return;

    const payload = {
      nombre: budget.Cliente,
      dni: budget.Dni || null,
      telefono: budget.Telefono,
      email: null,
      direccion: budget.Direccion || null,
      codigoPostal: budget.CodigoPostal || null,
      poblacion: budget.Poblacion || null,
      provincia: budget.Provincia || null,
      clasificacion: budget.Clasificacion || "Particular",
      matricula: budget.Matricula,
      bastidor: budget.Bastidor || null,
      marca: budget.Marca || null,
      modelo: budget.Modelo,
      fechaMatriculacion: budget.FechaMatriculacion || null,
      motor: budget.Motor || null,
      kw: budget.Kw ? Number(budget.Kw) : null,
      cv: budget.Cv ? Number(budget.Cv) : null,
      combustible: budget.Combustible || null,
      kilometraje: budget.Kilometraje ? Number(budget.Kilometraje) : null,
      observaciones: budget.Observaciones || null,
    };

    if (!payload.nombre?.trim()) {
      setError("Indica el nombre del cliente para registrarlo.");
      return;
    }
    if (!payload.telefono?.trim()) {
      setError("Indica el telefono del cliente para registrarlo.");
      return;
    }
    const shouldCreateVehicle =
      Boolean(budget.ClienteId) || hasVehicleDataForQuickCreate(payload);
    if (shouldCreateVehicle && !payload.matricula?.trim()) {
      setError(labels.referenceRequiredMessage);
      return;
    }
    if (shouldCreateVehicle && !payload.modelo?.trim()) {
      setError(labels.modelRequiredMessage);
      return;
    }

    try {
      setSavingCustomer(true);
      setError("");
      const existing = budget.ClienteId
        ? { Id: budget.ClienteId, Nombre: budget.Cliente }
        : await findExistingCustomerForQuickCreate(payload);

      if (existing?.Id) {
        if (!shouldCreateVehicle) {
          await fillBudgetFromCustomer(existing);
          setNotice("Cliente existente cargado en el presupuesto.");
          setShowNewCustomer(false);
          return;
        }

        const vehicles = await loadVehiclesForCustomer(existing.Id);
        let vehicle = vehicles.find(
          (item) =>
            normalizePlate(item.Matricula) ===
            normalizePlate(payload.matricula),
        );

        if (!vehicle) {
          const createdVehicle = ensureOk(
            await api.post(
              `/Vehiculo/cliente/${existing.Id}`,
              vehiclePayloadFromQuickCreate(payload),
            ),
          );
          vehicle = normalizeVehicle(firstResponseItem(createdVehicle) || {});
          setNotice(
            "Cliente existente cargado y vehículo agregado al presupuesto.",
          );
        } else {
          setNotice(
            "Cliente y vehículo existentes cargados en el presupuesto.",
          );
        }

        await fillBudgetFromCustomer(existing, vehicle);
        setShowNewCustomer(false);
        return;
      }

      const createdCustomer = ensureOk(await api.post("/Cliente", payload));
      const createdCustomerId =
        firstResponseItem(createdCustomer)?.id ??
        firstResponseItem(createdCustomer)?.Id;

      if (createdCustomerId) {
        if (shouldCreateVehicle) {
          await loadCreatedCustomerAndVehicle(
            createdCustomerId,
            payload.matricula,
          );
        } else {
          await fillBudgetFromCustomer({ Id: createdCustomerId });
        }
      }

      setNotice(
        shouldCreateVehicle
          ? "Cliente registrado con vehículo y cargado en el presupuesto."
          : "Cliente registrado y cargado en el presupuesto.",
      );
      setShowNewCustomer(false);
      setCustomerSearch("");
      setCustomerMatches([]);
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

  const loadBudgets = async (page = budgetPage) => {
    try {
      setError("");

      const res = await api.get("/Presupuesto", {
        params: {
          fechaDesde: dateFrom || null,
          fechaHasta: dateTo || null,
          search: budgetSearch || null,
          page,
          pageSize: budgetPageSize,
        },
      });

      const pack = res?.data?.data?.[0] || {};
      const items = Array.isArray(pack) ? pack : pack.items || [];
      setBudgets(items.map(normalizeBudget));
      setBudgetTotal(Number(pack.total ?? items.length));
      setBudgetPage(Number(pack.page ?? page));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los presupuestos.");
    }
  };

  useEffect(() => {
    loadFrequentServices();
    loadWorkshopSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBudgets(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [dateFrom, dateTo, budgetSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(customerSearch);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerSearch]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      setNotice("");
      setError("");

      const normalizedItems = detailItems
        .map((item) => normalizeBudgetLine(item))
        .filter(
          (item) =>
            String(item.descripcion || item.codigo || "").trim() ||
            getBudgetLineTotal(item) > 0,
        )
        .map((item) => ({
          codigo: item.codigo || null,
          section: item.section || "ManoObra",
          descripcion: String(item.descripcion || "").trim(),
          cantidad: Number(item.cantidad || 1),
          tiempo: item.tiempo ? Number(item.tiempo || 0) : null,
          precioUnitario: Number(item.precioUnitario || 0),
          descuentoPct: Number(item.descuentoPct || 0),
          ivaPct: Number(item.ivaPct || 21),
          importe: Number(item.importe ?? item.precioUnitario ?? 0),
          kind: item.kind || null,
          repuestoStockId: item.repuestoStockId || null,
          idProveedor: item.idProveedor || null,
          nombreProveedor: item.nombreProveedor || null,
          precioCompra:
            item.precioCompra != null ? Number(item.precioCompra || 0) : null,
        }));
      const laborTotal = normalizedItems
        .filter((item) => item.kind === "labor")
        .reduce((sum, item) => sum + getBudgetLineTotal(item), 0);
      const partsTotal = normalizedItems
        .filter((item) => item.kind !== "labor")
        .reduce((sum, item) => sum + getBudgetLineTotal(item), 0);

      let submitBudget = budget;
      if (budget.ClienteId) {
        const fullCustomer = await loadCustomerDetail({ Id: budget.ClienteId });
        submitBudget = {
          ...budget,
          Dni: budget.Dni || fullCustomer.Dni || "",
          Telefono: budget.Telefono || fullCustomer.Telefono || "",
          Direccion: budget.Direccion || fullCustomer.Direccion || "",
          CodigoPostal: budget.CodigoPostal || fullCustomer.CodigoPostal || "",
          Poblacion: budget.Poblacion || fullCustomer.Poblacion || "",
          Provincia: budget.Provincia || fullCustomer.Provincia || "",
          Clasificacion:
            budget.Clasificacion || fullCustomer.Clasificacion || "Particular",
        };
        setBudget(submitBudget);
      }

      const payload = {
        numeroPresupuesto: submitBudget.NumeroPresupuesto || null,
        cliente: submitBudget.Cliente,
        dni: submitBudget.Dni || null,
        telefono: submitBudget.Telefono || null,
        direccion: submitBudget.Direccion || null,
        codigoPostal: submitBudget.CodigoPostal || null,
        poblacion: submitBudget.Poblacion || null,
        provincia: submitBudget.Provincia || null,
        clasificacion: submitBudget.Clasificacion || "Particular",
        vehiculoId: submitBudget.VehiculoId
          ? Number(submitBudget.VehiculoId)
          : null,
        matricula: submitBudget.Matricula,
        bastidor: submitBudget.Bastidor || null,
        marca: submitBudget.Marca || null,
        modelo: submitBudget.Modelo,
        fechaMatriculacion: submitBudget.FechaMatriculacion || null,
        motor: submitBudget.Motor || null,
        kw: submitBudget.Kw ? Number(submitBudget.Kw) : null,
        cv: submitBudget.Cv ? Number(submitBudget.Cv) : null,
        combustible: submitBudget.Combustible || null,
        kilometraje: submitBudget.Kilometraje
          ? Number(submitBudget.Kilometraje)
          : null,
        fecha: submitBudget.Fecha,
        tipoOperacion: submitBudget.TipoOperacion || "Mecanica",
        trabajo: submitBudget.Trabajo,
        itemsJson: normalizedItems.length
          ? JSON.stringify(normalizedItems)
          : null,
        repuestos: normalizedItems.length
          ? partsTotal
          : Number(submitBudget.Repuestos || 0),
        cantidad: Number(submitBudget.Cantidad || 1),
        manoObra: normalizedItems.length
          ? laborTotal
          : Number(submitBudget.ManoObra || 0),
        estado: submitBudget.Estado || "Pendiente",
        observaciones: submitBudget.Observaciones || null,
      };

      if (editingId) {
        ensureOk(await api.put(`/Presupuesto/${editingId}`, payload));
        setSuccessModal("Presupuesto actualizado correctamente.");
      } else {
        ensureOk(await api.post("/Presupuesto", payload));
        setSuccessModal("Presupuesto registrado correctamente.");
      }

      resetBudgetForm();
      setViewMode("list");
      await loadBudgets(1);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar el presupuesto.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.Id);
    setViewMode("edit");

    setBudget({
      NumeroPresupuesto: p.NumeroPresupuesto || "",
      Cliente: p.Cliente || "",
      Dni: p.Dni || "",
      Telefono: p.Telefono || "",
      Direccion: p.Direccion || "",
      CodigoPostal: p.CodigoPostal || "",
      Poblacion: p.Poblacion || "",
      Provincia: p.Provincia || "",
      Clasificacion: p.Clasificacion || "Particular",
      Matricula: p.Matricula || "",
      Bastidor: p.Bastidor || "",
      Marca: p.Marca || "",
      Modelo: p.Modelo || "",
      FechaMatriculacion: p.FechaMatriculacion
        ? String(p.FechaMatriculacion).slice(0, 10)
        : "",
      Motor: p.Motor || "",
      Kw: p.Kw || "",
      Cv: p.Cv || "",
      Combustible: p.Combustible || "",
      Kilometraje: p.Kilometraje || "",
      Fecha: p.Fecha
        ? String(p.Fecha).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      TipoOperacion: p.TipoOperacion || "Mecanica",
      Trabajo: p.Trabajo || "",
      Items: p.Items || [],
      Repuestos: p.Repuestos || "",
      Cantidad: p.Cantidad || "1",
      ManoObra: p.ManoObra || "",
      Estado: p.Estado || "Pendiente",
      Observaciones: p.Observaciones || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const convertToOrder = async (p) => {
    try {
      setError("");
      setNotice("");

      await api.post(`/Presupuesto/${p.Id}/convertir-orden`);

      setSuccessModal("Presupuesto convertido en orden correctamente.");
      await loadBudgets();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo convertir el presupuesto en orden.",
      );
    }
  };

  const openSignatureModal = (p) => {
    setError("");
    setNotice("");
    setSignatureModal({ open: true, budget: p, saving: false });
  };

  const closeSignatureModal = () => {
    if (signatureModal.saving) return;
    setSignatureModal({ open: false, budget: null, saving: false });
  };

  const saveAcceptanceSignature = async (signatureBase64) => {
    const target = signatureModal.budget;
    if (!target?.Id) return;

    try {
      setSignatureModal((current) => ({ ...current, saving: true }));
      setError("");
      setNotice("");

      await api.put(`/Presupuesto/${target.Id}/acceptance-signature`, {
        signatureBase64,
      });

      setNotice("Firma de aceptacion guardada correctamente.");
      setSignatureModal({ open: false, budget: null, saving: false });
      await loadBudgets();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar la firma.",
      );
      setSignatureModal((current) => ({ ...current, saving: false }));
    }
  };

  const deleteBudget = async (p) => {
    const ok = window.confirm(
      `¿Eliminar el presupuesto ${p.NumeroPresupuesto || p.Id}?`,
    );

    if (!ok) return;

    try {
      await api.delete(`/Presupuesto/${p.Id}`);

      setNotice("Presupuesto eliminado correctamente.");
      await loadBudgets();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo eliminar el presupuesto.",
      );
    }
  };

  const cls =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-center";

  const budgetTotalPages = Math.max(1, Math.ceil(budgetTotal / budgetPageSize));
  const isFormVisible = viewMode === "create" || viewMode === "edit";

  const filteredBudgets = budgets.filter((p) => {
  const term = normalizeLookup(budgetSearch);

  if (!term) return true;

  const text = normalizeLookup(`
    ${p.NumeroPresupuesto}
    ${p.Cliente}
    ${p.Dni}
    ${p.Telefono}
    ${p.Matricula}
    ${p.Marca}
    ${p.Modelo}
    ${p.Trabajo}
    ${p.Estado}
  `);

  return text.includes(term);
});

  return (
    <>
      <SmallSuccessModal
        open={Boolean(successModal)}
        message={successModal}
        onClose={() => setSuccessModal("")}
      />

      <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Presupuestos
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Crea presupuestos y conviertelos en Ordenes de trabajo.
          </p>
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

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 p-3 text-sm">
          {error}
        </div>
      )}

      {isFormVisible && (
        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 space-y-5"
        >

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
              <div>
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  Buscar cliente registrado
                </div>

                <div className="relative">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Nombre, teléfono, matrícula o modelo"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400">
                    o
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={toggleQuickCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    <Plus size={18} />
                    {showNewCustomer
                      ? "Ocultar alta rápida"
                      : budget.ClienteId
                        ? "Agregar otro vehículo"
                        : "Registrar nuevo cliente"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 ring-1 ring-emerald-200">
                    <Info size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Busca un cliente registrado o crea uno nuevo.
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Cuando selecciones el vehículo, aparecerán los datos
                      necesarios para completar el presupuesto y los costes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {loadingCustomers && (
              <p className="mt-3 text-sm text-slate-500">
                Buscando clientes...
              </p>
            )}

            {loadingCustomerVehicles && (
              <p className="mt-3 text-sm text-slate-500">
                Cargando vehículos del cliente...
              </p>
            )}

            {!loadingCustomers &&
              customerSearch.trim().length >= 2 &&
              customerMatches.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
                  No encontramos ese cliente. Puedes registrarlo como nuevo.
                </div>
              )}

            {customerMatches.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {customerMatches.map((customer) => (
                  <button
                    key={customer.Id}
                    type="button"
                    onClick={() => selectCustomer(customer)}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span className="block font-semibold text-slate-900">
                      {customer.Nombre}
                    </span>

                    {/* <span className="mt-1 block text-slate-600">
                      {customer.Matricula || "Sin matrícula"} · {customer.Marca}{" "}
                      {customer.Modelo}
                    </span> */}

                    <span className="mt-1 block text-xs text-slate-500">
                      {customer.Telefono || "Sin teléfono"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {customerVehicles.length > 0 && selectedCustomerForVehicles && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="mb-2 text-sm font-semibold text-emerald-900">
                  Vehículos registrados de {selectedCustomerForVehicles.Nombre}
                </p>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {customerVehicles.map((vehicle) => (
                    <button
                      key={vehicle.Id}
                      type="button"
                      onClick={() =>
                        fillBudgetFromCustomer(
                          selectedCustomerForVehicles,
                          vehicle,
                        )
                      }
                      className="rounded-xl border border-emerald-200 bg-white p-3 text-left text-sm hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <span className="block font-semibold text-slate-900">
                        {vehicle.Matricula || "Sin matrícula"}
                      </span>

                      <span className="mt-1 block text-slate-600">
                        {vehicle.Marca || "-"} {vehicle.Modelo || ""}
                      </span>

                      <span className="mt-1 block text-xs text-slate-500">
                        {vehicle.Bastidor
                          ? `Bastidor ${vehicle.Bastidor}`
                          : "Sin bastidor"}{" "}
                        -{" "}
                        {vehicle.Kilometraje
                          ? `${vehicle.Kilometraje} km`
                          : "Sin kilometraje"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showNewCustomer && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={createCustomerFromBudget}
                  disabled={savingCustomer}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <UserPlus size={17} />

                  {savingCustomer
                    ? "Guardando..."
                    : budget.ClienteId
                      ? "Guardar vehículo en cliente"
                      : hasVehicleDataForQuickCreate({
                            matricula: budget.Matricula,
                            marca: budget.Marca,
                            modelo: budget.Modelo,
                            bastidor: budget.Bastidor,
                          })
                        ? "Guardar cliente con vehículo"
                        : "Guardar solo cliente"}
                </button>

                {budget.ClienteId && (
                  <p className="text-xs font-medium text-emerald-700">
                    Se guardará como nuevo vehículo de {budget.Cliente}.
                  </p>
                )}
              </div>
            )}

            {quickCreateNotice && (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                <span>{quickCreateNotice}</span>

                <button
                  type="button"
                  onClick={() => setQuickCreateNotice("")}
                  className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </section>

          {shouldShowBudgetFields ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  name="NumeroPresupuesto"
                  value={budget.NumeroPresupuesto}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Número presupuesto automático"
                />

                <input
                  name="Cliente"
                  value={budget.Cliente}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Cliente *"
                  required
                />

                <input
                  name="Dni"
                  value={budget.Dni}
                  onChange={handleChange}
                  className={cls}
                  placeholder="DNI/NIE/NIF"
                />

                <input
                  name="Telefono"
                  value={budget.Telefono}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Teléfono"
                />

                <input
                  name="Direccion"
                  value={budget.Direccion}
                  onChange={handleChange}
                  className={`${cls} md:col-span-2`}
                  placeholder="Dirección del cliente"
                />
                <input
                  name="CodigoPostal"
                  value={budget.CodigoPostal}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Código postal"
                />
                <input
                  name="Poblacion"
                  value={budget.Poblacion}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Poblacion"
                />
                <input
                  name="Provincia"
                  value={budget.Provincia}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Provincia"
                />
                <select
                  name="Clasificacion"
                  value={budget.Clasificacion}
                  onChange={handleChange}
                  className={cls}
                >
                  <option value="Particular">Particular</option>
                  <option value="Empresa">Empresa</option>
                  <option value="Compania de seguro">Compania de seguro</option>
                </select>

                <input
                  name="Matricula"
                  value={budget.Matricula}
                  onChange={(e) =>
                    setField("Matricula", e.target.value.toUpperCase())
                  }
                  className={cls}
                  placeholder={labels.referencePlaceholder}
                />

                <input
                  name="Marca"
                  value={budget.Marca}
                  onChange={handleChange}
                  className={cls}
                  placeholder={labels.makeLabel}
                />

                <input
                  name="Bastidor"
                  value={budget.Bastidor}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Bastidor"
                />

                <input
                  name="Modelo"
                  value={budget.Modelo}
                  onChange={handleChange}
                  className={cls}
                  placeholder={labels.modelLabel}
                />

                <input
                  name="FechaMatriculacion"
                  type="date"
                  value={budget.FechaMatriculacion}
                  onChange={handleChange}
                  className={cls}
                  title="Fecha matriculación"
                />
                <input
                  name="Motor"
                  value={budget.Motor}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Motor"
                />
                <input
                  name="Kw"
                  type="number"
                  step="0.01"
                  value={budget.Kw}
                  onChange={handleChange}
                  className={cls}
                  placeholder="KW"
                />
                <input
                  name="Cv"
                  type="number"
                  step="0.01"
                  value={budget.Cv}
                  onChange={handleChange}
                  className={cls}
                  placeholder="CV"
                />
                <input
                  name="Combustible"
                  value={budget.Combustible}
                  onChange={handleChange}
                  className={cls}
                  placeholder="Combustible"
                />

                <input
                  name="Kilometraje"
                  type="number"
                  value={budget.Kilometraje}
                  onChange={handleChange}
                  className={cls}
                  placeholder={labels.metricPlaceholder}
                />

                <input
                  name="Fecha"
                  type="date"
                  value={budget.Fecha}
                  onChange={handleChange}
                  className={cls}
                />

                <select
                  name="TipoOperacion"
                  value={budget.TipoOperacion}
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
                  value={budget.Estado}
                  onChange={handleChange}
                  className={cls}
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

                             <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Trabajo y costes
          </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 md:col-span-4">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
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

                    <button
                      type="button"
                      onClick={addManualDetailLine}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      Agregar línea
                    </button>
                  </div>
                </div>

                {/* <textarea
                  name="Trabajo"
                  value={budget.Trabajo}
                  onChange={handleChange}
                  className={`${cls} md:col-span-3`}
                  rows={3}
                  placeholder="Trabajo presupuestado *"
                  required
                /> */}

                {/* <div className="md:col-span-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Líneas de detalle / costes
                </div> */}

                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 md:col-span-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Repuesto
                  </label>
                  <PartPicker
                    onSelect={addPartToBudget}
                    placeholder="Buscar pieza o repuesto"
                    buttonLabel="Agregar"
                  />
                </div>

                <textarea
                  name="Observaciones"
                  value={budget.Observaciones}
                  onChange={handleChange}
                  className={`${cls} md:col-span-3`}
                  rows={2}
                  placeholder="Observaciones"
                />

                <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total presupuestado
                  </div>
                  {/* <div className="mt-2 text-xs font-semibold text-slate-500">
              Calculo: ({Number(budget.Cantidad || 1)} x {Number(budget.Repuestos || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) + {Number(budget.ManoObra || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div> */}
                  <div className="mt-2 text-xl font-semibold text-slate-900">
                    {total.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </div>
                </div>

                {detailItems.length > 0 && (
                  <div className="md:col-span-4 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600"></div>
                    <div className="hidden lg:grid grid-cols-[85px_130px_minmax(0,1fr)_120px_115px_80px_120px_40px] gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <div>Código</div>
                      <div>Seccion</div>
                      <div>Detalle del presupuesto</div>
                      <div>Tiempo/Cant.</div>
                      <div>Precio</div>
                      <div>%DTO</div>
                      <div className="text-right">Importe</div>
                      <div />
                    </div>
                    <div className="space-y-2">
                      {detailItems.map((item) => {
                        const section = getBudgetLineSection(item);
                        const lineTotal = getBudgetLineTotal(item);

                        return (
                          <div
                            key={item.id}
                            className="grid grid-cols-1 gap-2 lg:grid-cols-[85px_130px_minmax(0,1fr)_120px_115px_80px_120px_40px]"
                          >
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
                              placeholder="Código"
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
                              <option value="ManoObra">Servicio</option>
                              <option value="Piezas">
                                {budget.TipoOperacion === "Chapa y pintura"
                                  ? "Materiales"
                                  : "Piezas"}
                              </option>
                              {budget.TipoOperacion === "Chapa y pintura" && (
                                <option value="Pintura">Pintura</option>
                              )}
                            </select>
                            <input
                              value={item.descripcion}
                              onChange={(e) =>
                                setDetailItemField(
                                  item.id,
                                  "descripcion",
                                  e.target.value,
                                )
                              }
                              className={cls}
                              placeholder="Descripcion"
                            />
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={getBudgetLineQuantity(item)}
                              onChange={(e) =>
                                setDetailItemField(
                                  item.id,
                                  section === "ManoObra"
                                    ? "tiempo"
                                    : "cantidad",
                                  e.target.value,
                                )
                              }
                              className={cls}
                              placeholder={
                                section === "ManoObra" ? "Horas" : "Cantidad"
                              }
                            />
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
                              placeholder={
                                section === "ManoObra" ? "Precio/h" : "Precio"
                              }
                            />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
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

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl px-5 py-3 bg-violet-600 text-white hover:bg-violet-700 transition shadow-md font-bold disabled:opacity-60"
                >
                  {submitting
                    ? "Guardando..."
                    : editingId
                      ? "Actualizar presupuesto"
                      : "Crear presupuesto"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetBudgetForm();                  
                  }}
                  className="rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center">
              
            </div>
          )}
        </form>
      )}

     
        <section className="mt-8 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
  <div>
    <h3 className="text-lg font-semibold text-slate-800">
      Presupuestos recientes
    </h3>
    <p className="mt-1 text-sm text-slate-500">
      Busca por número, cliente, matrícula, vehículo o trabajo.
    </p>
  </div>

  <div className="flex flex-col gap-3 md:flex-row md:items-center">
    <div className="relative w-full md:w-80">
      <Search
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        value={budgetSearch}
        onChange={(e) => {
          setBudgetSearch(e.target.value);
          setBudgetPage(1);
        }}
        placeholder="Buscar presupuesto..."
        className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
      />

      {budgetSearch && (
        <button
          type="button"
          onClick={() => {
            setBudgetSearch("");
            setBudgetPage(1);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={16} />
        </button>
      )}
    </div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setBudgetPage(1);
                }}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setBudgetPage(1);
                }}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />

              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setBudgetPage(1);
                  }}
                  className="rounded-2xl px-4 py-3 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4">
           {filteredBudgets.map((p) => (
              <article
                key={p.Id}
                className="rounded-2xl border border-violet-200 bg-violet-50/30 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">
                      {p.NumeroPresupuesto}
                    </h4>

                    <p className="text-sm text-slate-500">
                      {p.Matricula} · {p.Marca} {p.Modelo}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-violet-200 text-violet-700">
                    {p.Estado}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Cliente
                    </p>
                    <p className="font-semibold text-slate-800">{p.Cliente}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Trabajo
                    </p>
                    <p className="text-slate-700 line-clamp-2">{p.Trabajo}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Total
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {(
                        Number(p.ManoObra || 0) +
                        Number(p.Repuestos || 0) * Number(p.Cantidad || 1)
                      ).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-sky-600 text-white hover:bg-sky-700"
                  >
                    Editar
                  </button>

                  {!p.ConvertidoEnOrden && (
                    <button
                      type="button"
                      onClick={() => convertToOrder(p)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Convertir en orden
                    </button>
                  )}

                  {p.ConvertidoEnOrden && (
                    <Link
                      to="/register-work-order#ordenes-recientes"
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-sm font-medium"
                    >
                      Orden creada #{p.IdOrdenTrabajo}
                    </Link>
                  )}

                  {digitalSignaturesEnabled &&
                    (p.AcceptanceSignatureBase64 || p.IsAccepted ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                        <FileSignature size={16} />
                        Firmado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSignatureModal(p)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-slate-700 text-white hover:bg-slate-800"
                      >
                        <FileSignature size={16} />
                        Firmar aceptacion
                      </button>
                    ))}

                  <Link
                    to={`/print-budget/${p.Id}`}
                    // target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-violet-600 text-white hover:bg-violet-700"
                  >
                    Imprimir presupuesto
                  </Link>

                  <button
                    type="button"
                    onClick={() => deleteBudget(p)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}

           {filteredBudgets.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h4 className="text-lg font-semibold text-slate-800">
                  {dateFrom || dateTo
                    ? "No se encontraron presupuestos"
                    : "No hay presupuestos registrados"}
                </h4>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={budgetPage <= 1}
              onClick={() => loadBudgets(budgetPage - 1)}
              className="rounded-xl bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-slate-600">
              Página {budgetPage} de {budgetTotalPages} · {budgetTotal}{" "}
              presupuestos
            </span>
            <button
              type="button"
              disabled={budgetPage >= budgetTotalPages}
              onClick={() => loadBudgets(budgetPage + 1)}
              className="rounded-xl bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
    
      <SignatureModal
        open={signatureModal.open}
        title="Firma de aceptación del presupuesto"
        description={`Firma la aceptación del presupuesto ${
          signatureModal.budget?.NumeroPresupuesto || ""
        }.`}
        saving={signatureModal.saving}
        onClose={closeSignatureModal}
        onSave={saveAcceptanceSignature}
      />
    </>
  );
}

function normalizeOperationTypes(types) {
  const list = Array.isArray(types) ? types : ["Mecanica"];
  const filtered = list.filter((type) => type && type !== "Recambio");
  return filtered.length ? filtered : ["Mecanica"];
}

function getBudgetLineSection(item) {
  const raw = String(
    item.section ??
      item.Section ??
      item.kind ??
      item.Kind ??
      item.tipo ??
      item.Tipo ??
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

function getBudgetLineQuantity(item) {
  const section = getBudgetLineSection(item);
  const value =
    section === "Piezas" || section === "Pintura"
      ? (item.cantidad ?? item.Cantidad)
      : (item.tiempo ?? item.Tiempo ?? item.cantidad ?? item.Cantidad);
  const number = Number(value || 0);
  return number > 0 ? number : 1;
}

function getBudgetLineTotal(item) {
  const quantity = getBudgetLineQuantity(item);
  const price = Number(
    item.precioUnitario ??
      item.PrecioUnitario ??
      item.importe ??
      item.Importe ??
      0,
  );
  const discount = Math.min(
    100,
    Math.max(0, Number(item.descuentoPct ?? item.DescuentoPct ?? 0)),
  );
  return quantity * price * (1 - discount / 100);
}

function normalizeBudgetLine(item) {
  const section = getBudgetLineSection(item);
  const quantity = getBudgetLineQuantity({ ...item, section });
  const price = Number(
    item.precioUnitario ??
      item.PrecioUnitario ??
      item.importe ??
      item.Importe ??
      0,
  );
  const discount = Math.min(
    100,
    Math.max(0, Number(item.descuentoPct ?? item.DescuentoPct ?? 0)),
  );
  const netTotal = getBudgetLineTotal({
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
      section === "ManoObra" ? quantity : (item.tiempo ?? item.Tiempo ?? ""),
    precioUnitario: price,
    descuentoPct: discount,
    ivaPct: Number(item.ivaPct ?? item.IvaPct ?? 21),
    importe: unitNet,
    kind:
      section === "ManoObra"
        ? "labor"
        : section === "Pintura"
          ? "pintura"
          : "repuesto",
  };
}
