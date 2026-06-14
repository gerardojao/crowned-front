import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Trash2, UserPlus, Wrench, X } from "lucide-react";
import api from "../Components/api";
import { useBusinessTerminology } from "../utils/businessTerminology";
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
  Cliente: "",
  Dni: "",
  Telefono: "",
  Direccion: "",
  Matricula: "",
  Marca: "",
  Modelo: "",
  Kilometraje: "",
  Fecha: new Date().toISOString().slice(0, 10),
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
    throw new Error(data?.message || data?.Message || "La operacion no se pudo completar.");
  }
  return data;
};

export default function RegisterBudget() {
  const labels = useBusinessTerminology();
  const [budget, setBudget] = useState(EMPTY_BUDGET);
  const [budgets, setBudgets] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMatches, setCustomerMatches] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [budgetPage, setBudgetPage] = useState(1);
  const [budgetTotal, setBudgetTotal] = useState(0);
  const [frequentServices, setFrequentServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState(SERVICE_PREFIX);
  const [savingService, setSavingService] = useState(false);
  const budgetPageSize = 10;

  const detailItems = Array.isArray(budget.Items) ? budget.Items : [];
  const detailTotal = detailItems.reduce(
    (sum, item) =>
      sum +
      Number(item.cantidad || 0) * Number(item.precioUnitario || item.importe || 0),
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

  const createDetailItem = (descripcion, cantidad = 1, precioUnitario = 0, extra = {}) => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    descripcion,
    cantidad,
    precioUnitario: Number(precioUnitario || 0).toFixed(2),
    ...extra,
  });

  const setDetailItemField = (id, field, value) => {
    setBudget((prev) => ({
      ...prev,
      Items: (Array.isArray(prev.Items) ? prev.Items : []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
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
        descripcion: "Mano de obra",
        cantidad: 1,
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
    Matricula: x.matricula ?? x.Matricula ?? "",
    Marca: x.marca ?? x.Marca ?? "",
    Modelo: x.modelo ?? x.Modelo ?? "",
    Kilometraje: x.kilometraje ?? x.Kilometraje ?? "",
    Fecha: x.fecha ?? x.Fecha,
    Trabajo: x.trabajo ?? x.Trabajo ?? "",
    Repuestos: x.repuestos ?? x.Repuestos ?? 0,
    Cantidad: x.cantidad ?? x.Cantidad ?? 1,
    ManoObra: x.manoObra ?? x.ManoObra ?? 0,
    Items: parseDetailItems(x.itemsJson ?? x.ItemsJson),
    Estado: x.estado ?? x.Estado ?? "Pendiente",
    Observaciones: x.observaciones ?? x.Observaciones ?? "",
    ConvertidoEnOrden: x.convertidoEnOrden ?? x.ConvertidoEnOrden ?? false,
    IdOrdenTrabajo: x.idOrdenTrabajo ?? x.IdOrdenTrabajo ?? null,
  });

  const parseDetailItems = (itemsJson) => {
    if (!itemsJson) return [];
    try {
      const parsed = JSON.parse(itemsJson);
      return Array.isArray(parsed)
        ? parsed.map((item, index) => ({
            id: item.id || `stored-${index}`,
            descripcion: item.descripcion || item.Descripcion || "",
            cantidad: item.cantidad ?? item.Cantidad ?? 1,
            precioUnitario:
              item.precioUnitario ??
              item.PrecioUnitario ??
              item.importe ??
              item.Importe ??
              0,
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
    Marca: c.marca ?? c.Marca ?? "",
    Modelo: c.modelo ?? c.Modelo ?? "",
    Kilometraje: c.kilometraje ?? c.Kilometraje ?? "",
    Email: c.email ?? c.Email ?? "",
    Direccion: c.direccion ?? c.Direccion ?? "",
    Observaciones: c.observaciones ?? c.Observaciones ?? "",
  });

  const fillBudgetFromCustomer = (customer) => {
    setBudget((prev) => ({
      ...prev,
      Cliente: customer.Nombre || prev.Cliente,
      Dni: customer.Dni || prev.Dni,
      Telefono: customer.Telefono || prev.Telefono,
      Direccion: customer.Direccion || prev.Direccion,
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

  const createCustomerFromBudget = async () => {
    if (savingCustomer) return;

    const payload = {
      nombre: budget.Cliente,
      dni: budget.Dni || null,
      telefono: budget.Telefono,
      email: null,
      direccion: budget.Direccion || null,
      matricula: budget.Matricula,
      marca: budget.Marca || null,
      modelo: budget.Modelo,
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
        fillBudgetFromCustomer(existing);
        setNotice("Cliente ya registrado; se cargaron sus datos en el presupuesto.");
        return;
      }

      ensureOk(await api.post("/Cliente", payload));
      setNotice("Cliente registrado y cargado en el presupuesto.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBudgets(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [dateFrom, dateTo]);

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
        .filter((item) => String(item.descripcion || "").trim())
        .map((item) => ({
          descripcion: String(item.descripcion || "").trim(),
          cantidad: Number(item.cantidad || 1),
          precioUnitario: Number(item.precioUnitario || 0),
          kind: item.kind || null,
          repuestoStockId: item.repuestoStockId || null,
          idProveedor: item.idProveedor || null,
          nombreProveedor: item.nombreProveedor || null,
          precioCompra: item.precioCompra != null ? Number(item.precioCompra || 0) : null,
        }));
      const laborTotal = normalizedItems
        .filter((item) => item.descripcion.trim().toLowerCase() === "mano de obra")
        .reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
      const partsTotal = normalizedItems
        .filter((item) => item.descripcion.trim().toLowerCase() !== "mano de obra")
        .reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);

      const payload = {
        numeroPresupuesto: budget.NumeroPresupuesto || null,
        cliente: budget.Cliente,
        dni: budget.Dni || null,
        telefono: budget.Telefono || null,
        matricula: budget.Matricula,
        marca: budget.Marca || null,
        modelo: budget.Modelo,
        kilometraje: budget.Kilometraje ? Number(budget.Kilometraje) : null,
        fecha: budget.Fecha,
        trabajo: budget.Trabajo,
        itemsJson: normalizedItems.length
          ? JSON.stringify(normalizedItems)
          : null,
        repuestos: normalizedItems.length ? partsTotal : Number(budget.Repuestos || 0),
        cantidad: Number(budget.Cantidad || 1),
        manoObra: normalizedItems.length ? laborTotal : Number(budget.ManoObra || 0),
        estado: budget.Estado || "Pendiente",
        observaciones: budget.Observaciones || null,
      };

      if (editingId) {
        ensureOk(await api.put(`/Presupuesto/${editingId}`, payload));
        setNotice("Presupuesto actualizado correctamente.");
      } else {
        ensureOk(await api.post("/Presupuesto", payload));
        setNotice("Presupuesto registrado correctamente.");
      }

      setBudget(EMPTY_BUDGET);
      setEditingId(null);
      setCustomerSearch("");
      setCustomerMatches([]);
      setShowNewCustomer(false);
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

    setBudget({
      NumeroPresupuesto: p.NumeroPresupuesto || "",
      Cliente: p.Cliente || "",
      Dni: p.Dni || "",
      Telefono: p.Telefono || "",
      Matricula: p.Matricula || "",
      Marca: p.Marca || "",
      Modelo: p.Modelo || "",
      Kilometraje: p.Kilometraje || "",
      Fecha: p.Fecha
        ? String(p.Fecha).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
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

      setNotice("Presupuesto convertido en orden correctamente.");
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

  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Presupuestos
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Crea presupuestos y conviértelos en órdenes de trabajo.
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
        <h3 className="text-lg font-semibold text-slate-800">
          {editingId ? "Actualizar presupuesto" : "Nuevo presupuesto"}
        </h3>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
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
                  onClick={() => fillBudgetFromCustomer(customer)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm hover:border-violet-300 hover:bg-violet-50"
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
                Completa nombre, telefono, matricula y modelo en los campos del presupuesto.
                Luego pulsa este boton para guardar el cliente en la base de datos.
              </p>
              <button
                type="button"
                onClick={createCustomerFromBudget}
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
            name="Matricula"
            value={budget.Matricula}
            onChange={(e) =>
              setField("Matricula", e.target.value.toUpperCase())
            }
            className={cls}
            placeholder={labels.referencePlaceholder}
            required
          />

          <input
            name="Marca"
            value={budget.Marca}
            onChange={handleChange}
            className={cls}
            placeholder={labels.makeLabel}
          />

          <input
            name="Modelo"
            value={budget.Modelo}
            onChange={handleChange}
            className={cls}
            placeholder={`${labels.modelLabel} *`}
            required
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 md:col-span-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto]">
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
          </div>

          <textarea
            name="Trabajo"
            value={budget.Trabajo}
            onChange={handleChange}
            className={`${cls} md:col-span-3`}
            rows={3}
            placeholder="Trabajo presupuestado *"
            required
          />

          <div className="md:col-span-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Lineas de detalle / costes
          </div>

          <div className="space-y-2 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50/80 p-3 md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Repuesto
            </label>
            <PartPicker
              onSelect={addPartToBudget}
              placeholder="Buscar pieza o repuesto"
              buttonLabel="Agregar"
            />
          </div>

          <div className="space-y-2 rounded-r-xl border border-l-0 border-slate-200 bg-slate-50/80 p-3 md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Mano de obra (EUR)
            </label>
          <input
            name="ManoObra"
            type="number"
            step="0.01"
            value={budget.ManoObra}
            onChange={handleChange}
            onBlur={(e) => upsertLaborItem(e.target.value)}
            className={cls}
            placeholder="Mano de obra €"
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
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                
              </div>
              <div className="hidden lg:grid grid-cols-[100px_minmax(0,1fr)_150px_150px_40px] gap-2 px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Cantidad</div>
                <div>Detalle del presupuesto</div>
                <div>P. Unit.</div>
                <div className="text-center">Importe</div>
                <div />
              </div>
              <div className="space-y-2">
                {detailItems.map((item) => {
                  const lineTotal =
                    Number(item.cantidad || 0) *
                    Number(item.precioUnitario || item.importe || 0);

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 gap-2 lg:grid-cols-[100px_minmax(0,1fr)_150px_150px_40px]"
                    >
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
                        placeholder="Precio unit."
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
                        aria-label="Eliminar linea"
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
              setBudget(EMPTY_BUDGET);
              setEditingId(null);
              setCustomerSearch("");
              setCustomerMatches([]);
              setShowNewCustomer(false);
            }}
            className="rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
          >
            Limpiar
          </button>
        </div>
      </form>

<section className="mt-8 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
    <h3 className="text-lg font-semibold text-slate-800">
      Presupuestos recientes
    </h3>

    <div className="flex flex-col md:flex-row gap-3">
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

  <div className="grid grid-cols-1 gap-4">
    {budgets.map((p) => (
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
              ).toLocaleString(
                "es-ES",
                {
                  style: "currency",
                  currency: "EUR",
                },
              )}
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
          
          <Link
  to={`/print-budget/${p.Id}`}
  target="_blank"
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

    {budgets.length === 0 && (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <h4 className="text-lg font-semibold text-slate-800">
          {(dateFrom || dateTo)
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
      Pagina {budgetPage} de {budgetTotalPages} · {budgetTotal} presupuestos
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
    </>
  );
}
