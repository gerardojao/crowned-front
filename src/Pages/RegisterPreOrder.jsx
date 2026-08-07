import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Images,
  Printer,
  Search,
  Trash2,
  X,
  CheckCircle,
  PenLine,
  UserPlus,
} from "lucide-react";
import api from "../Components/api";
import ReceptionPhotosModal from "../Components/ReceptionPhotosModal";
import SignatureModal from "../Components/SignatureModal";
import SmallSuccessModal from "../Components/SmallSuccessModal";
import { buildPreOrderPayload } from "../utils/repairOrderPayload";

const EMPTY_PRE_ORDER = {
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
  MotivoRecepcion: "",
  DiagnosticoMecanico: "",
  RepuestosNecesarios: "",
  Observaciones: "",
};

const cls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

function ensureOk(res) {
  const data = res?.data;
  if (data?.ok === 0 || data?.Ok === 0) {
    throw new Error(
      data?.message || data?.Message || "La operación no se pudo completar.",
    );
  }
  return data;
}

function pickItems(res) {
  const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? {};
  return Array.isArray(pack.items ?? pack.Items)
    ? (pack.items ?? pack.Items)
    : [];
}

function pickArray(res) {
  const first = res?.data?.data?.[0] ?? res?.data?.Data?.[0];
  if (Array.isArray(first)) return first;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function pickTotal(res) {
  const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? {};
  return Number(pack.total ?? pack.Total ?? 0);
}

function normalizePreOrder(row) {
  return {
    Id: row.id ?? row.Id,
    Cliente: row.cliente ?? row.Cliente ?? "",
    Dni: row.dni ?? row.Dni ?? "",
    Telefono: row.telefono ?? row.Telefono ?? "",
    Direccion: row.direccion ?? row.Direccion ?? "",
    CodigoPostal: row.codigoPostal ?? row.CodigoPostal ?? "",
    Poblacion: row.poblacion ?? row.Poblacion ?? "",
    Provincia: row.provincia ?? row.Provincia ?? "",
    Clasificacion: row.clasificacion ?? row.Clasificacion ?? "Particular",
    VehiculoId: row.vehiculoId ?? row.VehiculoId ?? "",
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
    Fecha: row.fecha ?? row.Fecha,
    FechaPrevistaEntrega:
      row.fechaPrevistaEntrega ?? row.FechaPrevistaEntrega ?? "",
    TiempoEstimadoHoras:
      row.tiempoEstimadoHoras ?? row.TiempoEstimadoHoras ?? "",
    TipoOperacion: row.tipoOperacion ?? row.TipoOperacion ?? "Mecanica",
    MotivoRecepcion: row.motivoRecepcion ?? row.MotivoRecepcion ?? "",
    DiagnosticoMecanico:
      row.diagnosticoMecanico ?? row.DiagnosticoMecanico ?? "",
    RepuestosNecesarios:
      row.repuestosNecesarios ?? row.RepuestosNecesarios ?? "",
    Observaciones: row.observaciones ?? row.Observaciones ?? "",
    Estado: row.estado ?? row.Estado ?? "Pendiente",
    ConvertidaEnOrden: row.convertidaEnOrden ?? row.ConvertidaEnOrden ?? false,
    IdOrdenTrabajo: row.idOrdenTrabajo ?? row.IdOrdenTrabajo ?? null,
    ClientSignatureBase64:
      row.clientSignatureBase64 ?? row.ClientSignatureBase64 ?? "",

    ClientSignatureDate:
      row.clientSignatureDate ?? row.ClientSignatureDate ?? null,
  };
}

function normalizeCustomer(row) {
  return {
    Id: row.id ?? row.Id,
    ClienteId: row.idCliente ?? row.IdCliente ?? "",
    Nombre: row.nombre ?? row.Nombre ?? "",
    Dni: row.dni ?? row.Dni ?? "",
    Telefono: row.telefono ?? row.Telefono ?? "",
    Direccion: row.direccion ?? row.Direccion ?? "",
    CodigoPostal: row.codigoPostal ?? row.CodigoPostal ?? "",
    Poblacion: row.poblacion ?? row.Poblacion ?? "",
    Provincia: row.provincia ?? row.Provincia ?? "",
    Clasificacion: row.clasificacion ?? row.Clasificacion ?? "Particular",
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
    VehicleCount:
      row.vehicleCount ??
      row.VehicleCount ??
      row.vehiculosCount ??
      row.VehiculosCount ??
      row.totalVehiculos ??
      row.TotalVehiculos ??
      null,
  };
}

function normalizeVehicle(row) {
  return {
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
    UltimaVisita: String(row.ultimaVisita ?? row.UltimaVisita ?? "").slice(
      0,
      10,
    ),
    ProximaItv: String(row.proximaItv ?? row.ProximaItv ?? "").slice(0, 10),
  };
}

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

export default function RegisterPreOrder() {
  const [form, setForm] = useState(EMPTY_PRE_ORDER);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [successModal, setSuccessModal] = useState("");
  const [warningModal, setWarningModal] = useState("");
  const [error, setError] = useState("");
  const [allowed, setAllowed] = useState(null);

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMatches, setCustomerMatches] = useState([]);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [selectedCustomerForVehicles, setSelectedCustomerForVehicles] =
    useState(null);
  const [loadingCustomerVehicles, setLoadingCustomerVehicles] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [receptionPhotosEnabled, setReceptionPhotosEnabled] = useState(true);
  const [operationTypes, setOperationTypes] = useState(["Mecanica"]);
  const [photoTarget, setPhotoTarget] = useState(null);
  const [successAfterPhotos, setSuccessAfterPhotos] = useState("");

  const [digitalSignaturesEnabled, setDigitalSignaturesEnabled] =
    useState(false);

  const [signatureModal, setSignatureModal] = useState({
    open: false,
    preOrder: null,
    saving: false,
  });

  const hasSelectedClient = Boolean(form.Cliente);
  const hasSelectedVehicle = Boolean(
    form.Matricula || form.Modelo || form.VehiculoId,
  );
  const shouldShowPreOrderForm =
    showNewCustomer || (hasSelectedClient && hasSelectedVehicle);

  const [quickCreateNotice, setQuickCreateNotice] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pendingCount = useMemo(
    () => items.filter((item) => !item.ConvertidaEnOrden).length,
    [items],
  );

  useEffect(() => {
    api
      .get("/WorkshopSettings")
      .then((res) => {
        const settings = res?.data || {};
        const moduleEnabled =
          settings.enablePreOrders ?? settings.EnablePreOrders ?? true;
        setAllowed(moduleEnabled);
        setReceptionPhotosEnabled(
          settings.enableReceptionPhotos ??
            settings.EnableReceptionPhotos ??
            true,
        );
        setDigitalSignaturesEnabled(
          settings.enableDigitalSignatures ??
            settings.EnableDigitalSignatures ??
            false,
        );
        setOperationTypes(
          normalizeOperationTypes(
            settings.operationTypes ?? settings.OperationTypes,
          ),
        );
      })
      .catch(() => setAllowed(false));
  }, []);

  useEffect(() => {
    if (allowed === false) return;
    loadPreOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, allowed]);

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(customerSearch), 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadPreOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/PreOrdenTrabajo", {
        params: {
          search: search || undefined,
          page,
          pageSize,
        },
      });
      setItems(pickItems(res).map(normalizePreOrder));
      setTotal(pickTotal(res));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las pre-órdenes.");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async (term) => {
    const value = term.trim();
    if (value.length < 2) {
      setCustomerMatches([]);
      return;
    }

    try {
      const res = await api.get("/Cliente", {
        params: { search: value, page: 1, pageSize: 6 },
      });
      const normalizedCustomers = pickItems(res).map(normalizeCustomer);

      const customersWithVehicleCount = await Promise.all(
        normalizedCustomers.map(async (customer) => {
          try {
            const vehicleRes = await api.get(
              `/Vehiculo/cliente/${customer.Id}`,
            );
            const vehicles = pickArray(vehicleRes);
            return {
              ...customer,
              VehicleCount: Array.isArray(vehicles) ? vehicles.length : 0,
            };
          } catch {
            return {
              ...customer,
              VehicleCount: customer.Matricula ? 1 : 0,
            };
          }
        }),
      );

      setCustomerMatches(customersWithVehicleCount);
    } catch (err) {
      console.error(err);
      setCustomerMatches([]);
    }
  };

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

  const searchQuickCustomers = async (term) => {
    const value = String(term || "").trim();
    if (value.length < 2) return [];

    const res = await api.get("/Cliente", {
      params: { search: value, page: 1, pageSize: 10 },
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
          "Hay varios clientes con ese nombre. Selecciona el cliente desde el buscador antes de guardar el vehículo.",
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

    await fillFromCustomer(customer, vehicle || null);
  };

  const fillFromCustomer = async (customer, vehicle = null) => {
    const fullCustomer = await loadCustomerDetail(customer);
    setForm((prev) => ({
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
        (vehicle?.Kilometraje ?? fullCustomer.Kilometraje) || prev.Kilometraje,
    }));
    setCustomerSearch("");
    setCustomerMatches([]);
    setCustomerVehicles([]);
    setSelectedCustomerForVehicles(null);
  };

  const fillCustomerOnlyForNewVehicle = async (customer) => {
    const fullCustomer = await loadCustomerDetail(customer);
    setForm((prev) => ({
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
    setForm((prev) => ({
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
      return;
    }

    if (form.ClienteId) {
      clearVehicleForQuickCreate();
      setQuickCreateNotice(
        "Cliente seleccionado. Completa los datos del nuevo vehículo.",
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
      const res = await api.get(`/Vehiculo/cliente/${customer.Id}`);
      const vehicles = pickArray(res).map(normalizeVehicle);

      if (vehicles.length === 0) {
        await fillCustomerOnlyForNewVehicle(customer);
        setShowNewCustomer(true);
        setQuickCreateNotice(
          "Cliente seleccionado. Completa los datos del nuevo vehículo.",
        );
        setWarningModal(
          "Este cliente no tiene coche asignado. Agrega un coche para poder completar la pre-orden.",
        );
        return;
      }

      if (vehicles.length === 1) {
        await fillFromCustomer(customer, vehicles[0]);
        return;
      }

      await fillCustomerOnlyForNewVehicle(customer);
      setCustomerVehicles(vehicles);
    } catch (err) {
      console.error(err);
      await fillFromCustomer(customer, fallbackVehicle);
    } finally {
      setLoadingCustomerVehicles(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_PRE_ORDER);
    setEditingId(null);
    setCustomerSearch("");
    setCustomerMatches([]);
    setCustomerVehicles([]);
    setSelectedCustomerForVehicles(null);
    setShowNewCustomer(false);
    setWarningModal("");
  };

  const createCustomerFromPreOrder = async () => {
    if (savingCustomer) return;

    const payload = {
      nombre: form.Cliente,
      dni: form.Dni || null,
      telefono: form.Telefono,
      email: null,
      direccion: form.Direccion || null,
      codigoPostal: form.CodigoPostal || null,
      poblacion: form.Poblacion || null,
      provincia: form.Provincia || null,
      clasificacion: form.Clasificacion || "Particular",
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
      observaciones: form.Observaciones || null,
    };

    if (!payload.nombre?.trim())
      return setError("Indica el nombre del cliente para registrarlo.");
    if (!payload.telefono?.trim())
      return setError("Indica el telefono del cliente para registrarlo.");
    if (!payload.matricula?.trim())
      return setError(
        "Indica la matrícula del vehículo para registrar el cliente.",
      );
    if (!payload.modelo?.trim())
      return setError(
        "Indica el modelo del vehículo para registrar el cliente.",
      );

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
          setNotice(
            "Cliente existente cargado y vehículo agregado a la pre-orden.",
          );
        } else {
          setNotice("Cliente y vehículo existentes cargados en la pre-orden.");
        }

        await fillFromCustomer(existingCustomer, vehicle);
        setShowNewCustomer(false);
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

      setNotice("Cliente registrado y cargado en la pre-orden.");
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

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setNotice("");
      setError("");

      let submitForm = form;
      if (form.ClienteId) {
        const fullCustomer = await loadCustomerDetail({ Id: form.ClienteId });
        submitForm = {
          ...form,
          Dni: form.Dni || fullCustomer.Dni || "",
          Telefono: form.Telefono || fullCustomer.Telefono || "",
          Direccion: form.Direccion || fullCustomer.Direccion || "",
        };
        setForm(submitForm);
      }

      const payload = buildPreOrderPayload(submitForm);

      if (editingId) {
        ensureOk(await api.put(`/PreOrdenTrabajo/${editingId}`, payload));
        setSuccessModal("Pre-orden actualizada correctamente.");
      } else {
    localStorage.setItem(
      `zaga:preorden:motivoRecepcion:${submitForm.Matricula}`,
      submitForm.MotivoRecepcion || ""

    //localStorage.setItem("preOrderForm", JSON.stringify(form.MotivoRecepcion));
    );
        const createdData = ensureOk(
          await api.post("/PreOrdenTrabajo", payload),
        );
        const created = createdData?.data?.[0] ?? createdData?.Data?.[0];
        if (created && receptionPhotosEnabled) {
          setPhotoTarget(normalizePreOrder(created));
          setSuccessAfterPhotos("Pre-orden registrada correctamente.");
        } else {
          setSuccessModal("Pre-orden registrada correctamente.");
        }
      }

      resetForm();
      await loadPreOrders();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar la pre-orden.",
      );
    } finally {
      setSaving(false);
    }
  };

  const closePhotosModal = () => {
    setPhotoTarget(null);
    if (successAfterPhotos) {
      setSuccessModal(successAfterPhotos);
      setSuccessAfterPhotos("");
    }
  };

  const startEdit = (item) => {
    if (item.ConvertidaEnOrden) {
      setError("No se puede editar una pre-orden ya convertida.");
      return;
    }

    setEditingId(item.Id);
    setForm({
      ClienteId: "",
      Cliente: item.Cliente,
      Dni: item.Dni,
      Telefono: item.Telefono,
      Direccion: item.Direccion,
      CodigoPostal: item.CodigoPostal || "",
      Poblacion: item.Poblacion || "",
      Provincia: item.Provincia || "",
      Clasificacion: item.Clasificacion || "Particular",
      VehiculoId: item.VehiculoId || "",
      Matricula: item.Matricula,
      Bastidor: item.Bastidor || "",
      Marca: item.Marca,
      Modelo: item.Modelo,
      FechaMatriculacion: item.FechaMatriculacion
        ? String(item.FechaMatriculacion).slice(0, 10)
        : "",
      Motor: item.Motor || "",
      Kw: item.Kw || "",
      Cv: item.Cv || "",
      Combustible: item.Combustible || "",
      Kilometraje: item.Kilometraje || "",
      Fecha: item.Fecha
        ? String(item.Fecha).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      FechaPrevistaEntrega: item.FechaPrevistaEntrega
        ? String(item.FechaPrevistaEntrega).slice(0, 10)
        : "",
      TiempoEstimadoHoras: item.TiempoEstimadoHoras || "",
      TipoOperacion: item.TipoOperacion || "Mecanica",
      MotivoRecepcion: item.MotivoRecepcion,
      DiagnosticoMecanico: item.DiagnosticoMecanico,
      RepuestosNecesarios: item.RepuestosNecesarios,
      Observaciones: item.Observaciones,
    });
    //window.scrollTo({ top: 0, behavior: "smooth" });
  };

  localStorage.setItem("preOrderForm", JSON.stringify(form.MotivoRecepcion));


  const remove = async (item) => {
    if (!window.confirm(`Eliminar la pre-orden de ${item.Matricula}?`)) return;

    try {
      setNotice("");
      setError("");
      ensureOk(await api.delete(`/PreOrdenTrabajo/${item.Id}`));
      setNotice("Pre-orden eliminada correctamente.");
      await loadPreOrders();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo eliminar la pre-orden.",
      );
    }
  };

  const openSignatureModal = (preOrder) => {
    setError("");
    setNotice("");

    setSignatureModal({
      open: true,
      preOrder,
      saving: false,
    });
  };

  const closeSignatureModal = () => {
    if (signatureModal.saving) return;

    setSignatureModal({
      open: false,
      preOrder: null,
      saving: false,
    });
  };

  const saveReceptionSignature = async (signatureBase64) => {
    const target = signatureModal.preOrder;

    if (!target?.Id) return;

    try {
      setSignatureModal((c) => ({ ...c, saving: true }));

      ensureOk(
        await api.put(`/PreOrdenTrabajo/${target.Id}/client-signature`, {
          signatureBase64,
        }),
      );

      setNotice("Recepción firmada correctamente.");

      closeSignatureModal();

      await loadPreOrders();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar la firma.",
      );

      setSignatureModal((c) => ({ ...c, saving: false }));
    }
  };

  return (
    <>
      {allowed === false ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Modulo no disponible
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            La pre-orden no esta habilitada para este taller.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-xl bg-slate-700 px-4 py-2.5 text-white hover:bg-slate-800"
          >
            Volver
          </Link>
        </div>
      ) : (
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

          <div className="mt-2 mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Pre-órdenes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Recepción inicial del vehículo antes de convertirla en orden de
                trabajo.
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
            <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
              {notice}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </div>
          )}

          <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Metric label="Pendientes en pantalla" value={pendingCount} />
            <Metric label="Total pre-órdenes" value={total} />
            <Metric label="Pagina" value={`${page}/${totalPages}`} />
          </section>

          <form
            onSubmit={submit}
            className="mb-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200 md:p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <FileText size={18} className="text-slate-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                {editingId ? "Editar pre-orden" : "Nueva pre-orden"}
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
                  onChange={(event) => setCustomerSearch(event.target.value)}
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

              {customerMatches.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {customerMatches.map((customer) => (
                    <button
                      key={customer.Id}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <span className="block font-semibold text-slate-900">
                        Cliente: {customer.Nombre}
                      </span>
                      <span className="mt-1 block text-slate-600">
                        Tel: {customer.Telefono || "Sin teléfono"}
                      </span>

                      <span className="mt-1 block text-xs text-slate-500">
                        Vehículos:{" "}
                        {customer.VehicleCount !== null
                          ? `${customer.VehicleCount} registrado${Number(customer.VehicleCount) === 1 ? "" : "s"}`
                          : customer.Matricula
                            ? `${customer.Matricula} · ${[customer.Marca, customer.Modelo].filter(Boolean).join(" ")}`
                            : "Vehículos registrados"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {loadingCustomerVehicles && (
                <p className="mt-3 text-sm text-slate-500">
                  Cargando vehículos del cliente...
                </p>
              )}

              {selectedCustomerForVehicles && customerVehicles.length > 1 && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="mb-2 text-sm font-semibold text-emerald-900">
                    Selecciona el vehículo de{" "}
                    {selectedCustomerForVehicles.Nombre}
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {customerVehicles.map((vehicle) => (
                      <button
                        key={vehicle.Id}
                        type="button"
                        onClick={() =>
                          fillFromCustomer(selectedCustomerForVehicles, vehicle)
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
                          ·{" "}
                          {vehicle.Kilometraje
                            ? `${vehicle.Kilometraje} km`
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
                    ? "Ocultar alta rápida"
                    : form.ClienteId
                      ? "Agregar otro vehículo"
                      : "Registrar nuevo"}
                </button>
                {showNewCustomer && form.ClienteId && (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Se guardará como nuevo vehículo de {form.Cliente}.
                  </p>
                )}
                {showNewCustomer && (
                  <button
                    type="button"
                    onClick={createCustomerFromPreOrder}
                    disabled={savingCustomer}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingCustomer
                      ? "Guardando..."
                      : form.ClienteId
                        ? "Guardar vehículo en cliente"
                        : "Guardar cliente nuevo"}
                  </button>
                )}
                {quickCreateNotice && (
                  <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
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
              </div>
            </div>
            {shouldShowPreOrderForm ? (
              <div className="space-y-5">
                <FormSection title="Cliente">
                  <Input
                    name="Cliente"
                    value={form.Cliente}
                    onChange={setField}
                    placeholder="Cliente *"
                    required
                  />
                  <Input
                    name="Dni"
                    value={form.Dni}
                    onChange={setField}
                    placeholder="DNI/NIE"
                  />
                  <Input
                    name="Telefono"
                    value={form.Telefono}
                    onChange={setField}
                    placeholder="Teléfono"
                  />
                  <select
                    value={form.Clasificacion}
                    onChange={(event) =>
                      setField("Clasificacion", event.target.value)
                    }
                    className={cls}
                  >
                    <option value="Particular">Particular</option>
                    <option value="Empresa">Empresa</option>
                    <option value="Compania de seguro">
                      Compañía de seguro
                    </option>
                  </select>

                  <Input
                    name="Direccion"
                    value={form.Direccion}
                    onChange={setField}
                    placeholder="Dirección"
                  />
                  <Input
                    name="CodigoPostal"
                    value={form.CodigoPostal}
                    onChange={setField}
                    placeholder="Código postal"
                  />
                  <Input
                    name="Poblacion"
                    value={form.Poblacion}
                    onChange={setField}
                    placeholder="Población"
                  />
                  <Input
                    name="Provincia"
                    value={form.Provincia}
                    onChange={setField}
                    placeholder="Provincia"
                  />
                </FormSection>
                <FormSection title="Vehículo">
                  <Input
                    name="Matricula"
                    value={form.Matricula}
                    onChange={setField}
                    placeholder="Matrícula *"
                    required
                  />
                  <Input
                    name="Marca"
                    value={form.Marca}
                    onChange={setField}
                    placeholder="Marca"
                  />
                  <Input
                    name="Modelo"
                    value={form.Modelo}
                    onChange={setField}
                    placeholder="Modelo *"
                    required
                  />
                  <Input
                    name="Bastidor"
                    value={form.Bastidor}
                    onChange={setField}
                    placeholder="Bastidor"
                  />

                  <Field label="Fecha matriculación">
                    <Input
                      name="FechaMatriculacion"
                      type="date"
                      value={form.FechaMatriculacion}
                      onChange={setField}
                    />
                  </Field>

                  <Input
                    name="Kilometraje"
                    type="number"
                    value={form.Kilometraje}
                    onChange={setField}
                    placeholder="Kilometraje"
                  />
                  <Input
                    name="Combustible"
                    value={form.Combustible}
                    onChange={setField}
                    placeholder="Combustible"
                  />
                  <Input
                    name="Motor"
                    value={form.Motor}
                    onChange={setField}
                    placeholder="Motor"
                  />

                  <Input
                    name="Cv"
                    type="number"
                    value={form.Cv}
                    onChange={setField}
                    placeholder="CV"
                  />
                  <Input
                    name="Kw"
                    type="number"
                    value={form.Kw}
                    onChange={setField}
                    placeholder="KW"
                  />
                </FormSection>
                <FormSection title="Recepción">
                  <Field label="Fecha recepción">
                    <Input
                      name="Fecha"
                      type="date"
                      value={form.Fecha}
                      onChange={setField}
                      required
                    />
                  </Field>

                  <Field label="Fecha prevista de entrega">
                    <Input
                      name="FechaPrevistaEntrega"
                      type="date"
                      value={form.FechaPrevistaEntrega}
                      onChange={setField}
                    />
                  </Field>

                  <Input
                    name="TiempoEstimadoHoras"
                    type="number"
                    value={form.TiempoEstimadoHoras}
                    onChange={setField}
                    placeholder="Tiempo estimado horas"
                  />

                  <select
                    value={form.TipoOperacion}
                    onChange={(event) =>
                      setField("TipoOperacion", event.target.value)
                    }
                    className={cls}
                  >
                    {operationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormSection>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
                    Trabajo / recepción
                  </h4>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Textarea
                      name="MotivoRecepcion"
                      value={form.MotivoRecepcion}
                      onChange={setField}
                      className="md:col-span-4"
                      rows={4}
                      placeholder="Lo que indica el cliente o recepción. Ej: al carro le suenan los frenos *"
                      required
                    />

                    {/* <Textarea
                      name="Observaciones"
                      value={form.Observaciones}
                      onChange={setField}
                      className="md:col-span-4"
                      rows={2}
                      placeholder="Observaciones"
                    /> */}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Busca un cliente registrado o crea uno nuevo para iniciar la
                  pre-orden.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Cuando selecciones el vehículo, aparecerán los datos
                  necesarios para completar la recepción.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-amber-700 disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar pre-orden"
                    : "Crear pre-orden"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Limpiar
              </button>
            </div>
          </form>

          <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Pre-órdenes recientes
              </h3>
              <div className="relative w-full md:max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  className={`${cls} pl-10`}
                  placeholder="Buscar cliente, matrícula, motivo..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.Id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        #{item.Id} ·{" "}
                        {item.Fecha
                          ? new Date(item.Fecha).toLocaleDateString("es-ES")
                          : ""}
                      </p>
                      <h4 className="text-lg font-bold text-slate-900">
                        {item.Matricula}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {item.Cliente} ·{" "}
                        {[item.Marca, item.Modelo].filter(Boolean).join(" ")}
                      </p>
                    </div>

                    {/* <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                        item.ConvertidaEnOrden
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {item.ConvertidaEnOrden ? "Convertida" : item.Estado}
                    </span> */}

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                          item.ConvertidaEnOrden
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {item.ConvertidaEnOrden ? "Convertida" : item.Estado}
                      </span>

                      {digitalSignaturesEnabled &&
                        (item.ClientSignatureBase64 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle size={14} />
                            Recepción firmada
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openSignatureModal(item)}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                          >
                            <PenLine size={14} />
                            Firmar recepción
                          </button>
                        ))}
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-700">
                    {item.MotivoRecepcion}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <a
                      href={`/print-pre-order/${item.Id}?print=1`}
                      rel="noopener noreferrer"
                      className="inline-flex justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      <Printer size={16} />
                      Imprimir
                    </a>
                    <a
                      href={`/print-pre-order/${item.Id}?type=resguardo&print=1`}
                      rel="noopener noreferrer"
                      className="inline-flex justify-center gap-2 rounded-xl bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      <Printer size={16} />
                      Resguardo
                    </a>
                    {receptionPhotosEnabled && (
                      <button
                        type="button"
                        onClick={() => setPhotoTarget(item)}
                        className="inline-flex justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                      >
                        <Images size={16} />
                        Fotos
                      </button>
                    )}
                    {!item.ConvertidaEnOrden && (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                        >
                          Editar
                        </button>
                        <Link
                          to={`/register-work-order?preOrdenId=${item.Id}`}
                          className="inline-flex justify-center rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
                        >
                          Convertir en orden
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(item)}
                          className="inline-flex justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      </>
                    )}
                    {item.ConvertidaEnOrden && item.IdOrdenTrabajo && (
                      <Link
                        to={`/print-order/${item.IdOrdenTrabajo}`}
                        rel="noopener noreferrer"
                        className="inline-flex justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Ver orden
                      </Link>
                    )}
                  </div>
                </article>
              ))}

              {!loading && items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 lg:col-span-2">
                  No hay pre-órdenes para mostrar.
                </div>
              )}

              {loading && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500 lg:col-span-2">
                  Cargando pre-órdenes...
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
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
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </section>
        </>
      )}

      {photoTarget && (
        <ReceptionPhotosModal
          open={!!photoTarget}
          onClose={closePhotosModal}
          preOrderId={photoTarget.Id}
          title="Fotos del vehículo"
          subtitle={`${photoTarget.Matricula || ""} - ${photoTarget.Cliente || ""}`}
          canUpload={!photoTarget.ConvertidaEnOrden}
          context={{
            preOrderId: photoTarget.Id,
            cliente: photoTarget.Cliente,
            matricula: photoTarget.Matricula,
          }}
        />
      )}

      <SignatureModal
        open={signatureModal.open}
        title="Firma de recepción"
        description="Solicite al cliente que firme la recepción del vehículo."
        saving={signatureModal.saving}
        onClose={closeSignatureModal}
        onSave={saveReceptionSignature}
      />
    </>
  );
}

function Input({ name, value, onChange, type = "text", ...props }) {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
      className={cls}
      {...props}
    />
  );
}

function Textarea({ name, value, onChange, className = "", ...props }) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
      className={`${cls} ${className}`}
      {...props}
    />
  );
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

function normalizeOperationTypes(types) {
  const list = Array.isArray(types) ? types : ["Mecanica"];
  const filtered = list.filter((type) => type && type !== "Recambio");
  return filtered.length ? filtered : ["Mecanica"];
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
