import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, Wrench, X } from "lucide-react";
import api from "../Components/api";
import { useBusinessTerminology } from "../utils/businessTerminology";
import PartPicker, { getPartDisplayName, getPartSalePrice } from "../Components/PartPicker";
import { amountInput } from "../utils/currency";

const EMPTY_ORDER = {
  Cliente: "",
  Telefono: "",
  Matricula: "",
  Marca: "",
  Modelo: "",
  Kilometraje: "",
  Fecha: new Date().toISOString().slice(0, 10),
  Trabajo: "",
  Repuestos: "",
  ManoObra: "",
  Estado: "Recibido",
  Observaciones: "",
};

const states = [
  "Recibido",
  "Diagnóstico",
  "Reparando",
  "Esperando repuesto",
  "Listo",
  "Entregado",
];

const DEFAULT_FREQUENT_SERVICES = [
  "Servicio cambio de aceite y filtro",
  "Cambio de pastillas de frenos",
  "Cambio de rodamientos delanteros",
  "Cambio de amortiguadores",
  "Mano de obra",
  "Repuestos",
];

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

    case "Listo":
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
    throw new Error(data?.message || data?.Message || "La operacion no se pudo completar.");
  }
  return data;
};

const isOrderEditLocked = (estado) =>
  ["Reparando", "Esperando repuesto", "Listo", "Entregado"].includes(estado);

export default function RegisterWorkOrder() {
  const labels = useBusinessTerminology();
  const [order, setOrder] = useState(EMPTY_ORDER);
  const [orders, setOrders] = useState([]);
  const [notice, setNotice] = useState("");
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
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [frequentServices, setFrequentServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [savingService, setSavingService] = useState(false);
  const orderPageSize = 10;

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
      const list = res?.data?.data?.[0] || [];
      const names = list
        .map((x) => x.nombre ?? x.Nombre)
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
      Trabajo: prev.Trabajo?.trim()
        ? `${prev.Trabajo.trim()}\n${value}`
        : value,
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
        Repuestos: nextParts,
      };
    });

    setNotice(`Repuesto agregado al importe: ${name}.`);
  };

  const createFrequentService = async () => {
    const nombre = newServiceName.trim();
    if (!nombre) return;

    try {
      setSavingService(true);
      setError("");
      const res = await api.post("/ServicioFrecuente", { nombre });
      ensureOk(res);
      await loadFrequentServices();
      appendServiceToTrabajo(nombre);
      setNewServiceName("");
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

  const total = Number(order.Repuestos || 0) + Number(order.ManoObra || 0);

  const normalizeOrder = (o) => ({
    Id: o.id ?? o.Id,
    Cliente: o.cliente ?? o.Cliente,
    Telefono: o.telefono ?? o.Telefono,
    Matricula: o.matricula ?? o.Matricula,
    Marca: o.marca ?? o.Marca,
    Modelo: o.modelo ?? o.Modelo,
    Kilometraje: o.kilometraje ?? o.Kilometraje,
    Fecha: o.fecha ?? o.Fecha,
    Trabajo: o.trabajo ?? o.Trabajo,
    Repuestos: o.repuestos ?? o.Repuestos ?? 0,
    ManoObra: o.manoObra ?? o.ManoObra ?? 0,
    Estado: o.estado ?? o.Estado,
    Observaciones: o.observaciones ?? o.Observaciones,
    Total:
      o.total ??
      o.Total ??
      Number(o.repuestos ?? o.Repuestos ?? 0) +
        Number(o.manoObra ?? o.ManoObra ?? 0),
    Facturada: o.facturada ?? o.Facturada ?? false,
  });

  const normalizeCustomer = (c) => ({
    Id: c.id ?? c.Id,
    Nombre: c.nombre ?? c.Nombre ?? "",
    Telefono: c.telefono ?? c.Telefono ?? "",
    Matricula: c.matricula ?? c.Matricula ?? "",
    Marca: c.marca ?? c.Marca ?? "",
    Modelo: c.modelo ?? c.Modelo ?? "",
    Kilometraje: c.kilometraje ?? c.Kilometraje ?? "",
    Email: c.email ?? c.Email ?? "",
    Direccion: c.direccion ?? c.Direccion ?? "",
    Observaciones: c.observaciones ?? c.Observaciones ?? "",
  });

  const fillOrderFromCustomer = (customer) => {
    setOrder((prev) => ({
      ...prev,
      Cliente: customer.Nombre || prev.Cliente,
      Telefono: customer.Telefono || prev.Telefono,
      Matricula: customer.Matricula || prev.Matricula,
      Marca: customer.Marca || prev.Marca,
      Modelo: customer.Modelo || prev.Modelo,
      Kilometraje: customer.Kilometraje ? String(customer.Kilometraje) : prev.Kilometraje,
    }));
    setCustomerSearch("");
    setCustomerMatches([]);
    setShowNewCustomer(false);
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

  const findExistingCustomerByPlate = async (plate) => {
    const matricula = plate?.trim();
    if (!matricula) return null;

    const res = await api.get("/Cliente", {
      params: {
        matricula,
        page: 1,
        pageSize: 5,
      },
    });
    const pack = res?.data?.data?.[0];
    const items = Array.isArray(pack?.items) ? pack.items.map(normalizeCustomer) : [];
    return items.find(
      (item) => item.Matricula?.toUpperCase() === matricula.toUpperCase(),
    ) || null;
  };

  const createCustomerFromOrder = async () => {
    if (savingCustomer) return;

    const payload = {
      nombre: order.Cliente,
      telefono: order.Telefono,
      email: null,
      direccion: null,
      matricula: order.Matricula,
      marca: order.Marca || null,
      modelo: order.Modelo,
      kilometraje: order.Kilometraje ? Number(order.Kilometraje) : null,
      observaciones: order.Observaciones || null,
    };

    if (!payload.nombre?.trim()) {
      setError("Indica el nombre del cliente para registrarlo.");
      return;
    }
    if (!payload.telefono?.trim()) {
      setError("Indica el telefono del cliente para registrarlo.");
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
      const existing = await findExistingCustomerByPlate(payload.matricula);
      if (existing) {
        fillOrderFromCustomer(existing);
        setNotice("Cliente ya registrado; se cargaron sus datos en la orden.");
        return;
      }

      ensureOk(await api.post("/Cliente", payload));
      setNotice("Cliente registrado y cargado en la orden.");
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
    loadFrequentServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const startEdit = (o) => {
    if (isOrderEditLocked(o.Estado)) {
      setError("No se puede editar una orden en reparacion, lista o entregada.");
      return;
    }

    setEditingId(o.Id);

    setOrder({
      Cliente: o.Cliente || "",
      Telefono: o.Telefono || "",
      Matricula: o.Matricula || "",
      Marca: o.Marca || "",
      Modelo: o.Modelo || "",
      Kilometraje: o.Kilometraje || "",
      Fecha: o.Fecha
        ? String(o.Fecha).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      Trabajo: o.Trabajo || "",
      Repuestos: o.Repuestos || "",
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

      const payload = {
        cliente: order.Cliente,
        telefono: order.Telefono || null,
        matricula: order.Matricula,
        marca: order.Marca || null,
        modelo: order.Modelo,
        kilometraje: order.Kilometraje ? Number(order.Kilometraje) : null,
        fecha: order.Fecha,
        trabajo: order.Trabajo,
        repuestos: Number(order.Repuestos || 0),
        manoObra: Number(order.ManoObra || 0),
        estado: order.Estado || "Recibido",
        observaciones: order.Observaciones || null,
      };

      if (editingId) {
        ensureOk(await api.put(`/OrdenTrabajo/${editingId}`, payload));
        setNotice("Orden actualizada correctamente.");
      } else {
        ensureOk(await api.post("/OrdenTrabajo", payload));
        setNotice("Orden registrada correctamente.");
      }

      setOrder(EMPTY_ORDER);
      setEditingId(null);
      setCustomerSearch("");
      setCustomerMatches([]);
      setShowNewCustomer(false);

      if (showOrders) await loadOrders();
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

  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {labels.orderTitle}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {labels.orderSubtitle}
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

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 space-y-5"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {labels.customerAndAssetTitle}
          </h3>

          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Buscar cliente registrado
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className={`${cls} pl-10`}
                    placeholder="Nombre, telefono, matricula, modelo o email"
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
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Limpiar busqueda"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewCustomer((v) => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <UserPlus size={17} />
                {showNewCustomer ? "Ocultar alta rapida" : "Registrar nuevo"}
              </button>
            </div>

            {loadingCustomers && (
              <p className="mt-3 text-sm text-slate-500">Buscando clientes...</p>
            )}

            {!loadingCustomers && customerSearch.trim().length >= 2 && customerMatches.length === 0 && (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
                No encontramos ese cliente. Puedes completar los campos y usar "Registrar nuevo".
              </div>
            )}

            {customerMatches.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {customerMatches.map((customer) => (
                  <button
                    key={customer.Id}
                    type="button"
                    onClick={() => fillOrderFromCustomer(customer)}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span className="block font-semibold text-slate-900">
                      {customer.Nombre}
                    </span>
                    <span className="mt-1 block text-slate-600">
                      {customer.Matricula || `Sin ${labels.referenceLabel.toLowerCase()}`} · {customer.Marca} {customer.Modelo}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {customer.Telefono || "Sin telefono"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showNewCustomer && (
              <div className="mt-4 rounded-xl bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-200">
                <p>
                  Completa nombre, telefono, matricula y modelo en los campos de abajo.
                  Luego pulsa este boton para guardar el cliente en la base de datos.
                </p>
                <button
                  type="button"
                  onClick={createCustomerFromOrder}
                  disabled={savingCustomer}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <UserPlus size={17} />
                  {savingCustomer ? "Guardando cliente..." : "Guardar cliente nuevo"}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              name="Cliente"
              value={order.Cliente}
              onChange={handleChange}
              className={cls}
              placeholder="Cliente *"
              required
            />

            <input
              name="Telefono"
              value={order.Telefono}
              onChange={handleChange}
              className={cls}
              placeholder="Teléfono"
            />

            <input
              name="Matricula"
              value={order.Matricula}
              onChange={handleChange}
              className={cls}
              placeholder={labels.referencePlaceholder}
              required
            />

            <input
              name="Kilometraje"
              type="number"
              value={order.Kilometraje}
              onChange={handleChange}
              className={cls}
              placeholder={labels.metricPlaceholder}
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
              name="Fecha"
              type="date"
              value={order.Fecha}
              onChange={handleChange}
              className={cls}
            />

            <select
              name="Estado"
              value={order.Estado}
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
              disabled={savingService || !newServiceName.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {savingService ? "Guardando..." : "Guardar servicio"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <textarea
              name="Trabajo"
              value={order.Trabajo}
              onChange={handleChange}
              className={`${cls} md:col-span-3`}
              rows={3}
              placeholder="Trabajo solicitado o realizado *"
              required
            />

            <div className="space-y-2">
              <PartPicker
                onSelect={addPartToOrder}
                placeholder="Buscar repuesto en rentabilidad"
                buttonLabel="Agregar"
              />
              <input
                name="Repuestos"
                type="number"
                step="0.01"
                value={order.Repuestos}
                onChange={handleChange}
                onBlur={(e) => setField("Repuestos", amountInput(e.target.value))}
                className={cls}
                placeholder={`${labels.partsPlaceholder} IVA incl.`}
              />
            </div>

            <input
              name="ManoObra"
              type="number"
              step="0.01"
              value={order.ManoObra}
              onChange={handleChange}
              onBlur={(e) => setField("ManoObra", amountInput(e.target.value))}
              className={cls}
              placeholder="Mano de obra IVA incl. €"
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Total estimado IVA incl.</div>
              <div className="text-xl font-semibold text-slate-900">
                {total.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </div>
            </div>

            <textarea
              name="Observaciones"
              value={order.Observaciones}
              onChange={handleChange}
              className={`${cls} md:col-span-3`}
              rows={2}
              placeholder="Observaciones internas"
            />
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
              setCustomerSearch("");
              setCustomerMatches([]);
              setShowNewCustomer(false);
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
          {showOrders ? "Ocultar ordenes" : "Ver ordenes"}
        </button>
      </div>

      {showOrders && (
        <section
          id="ordenes-recientes"
          className="mt-4 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-6"
        >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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
            className="w-full md:w-80 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
              className="rounded-2xl px-4 py-3 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4">
          {loadingOrders && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
              Cargando ordenes...
            </div>
          )}

          {filteredOrders.map((o) => (
            <article
              key={o.Id}
              className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition ${getStateStyles(o.Estado)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {o.Matricula}
                  </h4>

                  <p className="text-sm text-slate-500">
                    {o.Marca} {o.Modelo}
                  </p>
                </div>

                <select
                  value={o.Estado}
                  onChange={async (e) => {
                    const nuevoEstado = e.target.value;

                    try {
                      await api.put(`/OrdenTrabajo/estado/${o.Id}`, {
                        estado: nuevoEstado,
                      });

                      setOrders((prev) =>
                        prev.map((item) =>
                          item.Id === o.Id
                            ? { ...item, Estado: nuevoEstado }
                            : item,
                        ),
                      );
                    } catch (err) {
                      console.error(err);
                      setError(
                        err?.response?.data?.message ||
                          err?.message ||
                          "No se pudo actualizar el estado.",
                      );
                    }
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 bg-white ${
                    o.Estado === "Entregado"
                      ? "text-emerald-700 ring-emerald-200"
                      : o.Estado === "Reparando"
                        ? "text-amber-700 ring-amber-200"
                        : "text-slate-700 ring-slate-200"
                  }`}
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex items-start justify-center gap-16">
                <div className="w-48 text-center">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Cliente
                  </p>

                  <p className="text-md font-semibold text-slate-800 truncate">
                    {o.Cliente}
                  </p>
                </div>

                <div className="w-[420px] text-center">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Trabajo
                  </p>

                  <p className="text-md text-slate-700 line-clamp-2">
                    {o.Trabajo}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
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

                <div className="mt-3 flex md:justify-end items-center gap-2">
                  <a
                    href={`/print-order/${o.Id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-sm font-medium text-slate-700 transition"
                  >
                    Imprimir
                  </a>

                  {!isOrderEditLocked(o.Estado) && (
                    <button
                      type="button"
                      onClick={() => startEdit(o)}
                      className="rounded-xl px-3 py-2 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition"
                    >
                      Editar
                    </button>
                  )}

                  {o.Estado === "Listo" && !(o.Facturada || o.facturada) && (
                    <Link
                      to={`/workshop-invoice/${o.Id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl px-3 py-2 bg-orange-600 hover:bg-orange-700 text-sm font-medium text-white transition"
                    >
                      Facturar
                    </Link>
                  )}

                  {(o.Facturada || o.facturada) && (
                    // <span className="rounded-xl px-3 py-2 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-sm font-medium">
                    //   Orden facturada
                    // </span>
                    <Link
                      to={`/reprint-invoice/order/${o.Id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-sm font-medium text-white transition"
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 text-2xl">
                🚗
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

        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={orderPage <= 1 || loadingOrders}
            onClick={() => loadOrders(orderPage - 1)}
            className="rounded-xl bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-slate-600">
            Pagina {orderPage} de {orderTotalPages} · {orderTotal} ordenes
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
    </>
  );
}
