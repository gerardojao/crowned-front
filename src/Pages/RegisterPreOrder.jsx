import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Printer, Search, Trash2, X } from "lucide-react";
import api from "../Components/api";
import { usesZagaInvoiceTemplate } from "../Components/ZagaInvoiceDocument";

const EMPTY_PRE_ORDER = {
  ClienteId: "",
  Cliente: "",
  Dni: "",
  Telefono: "",
  Direccion: "",
  Matricula: "",
  Marca: "",
  Modelo: "",
  Kilometraje: "",
  Fecha: new Date().toISOString().slice(0, 10),
  FechaPrevistaEntrega: "",
  TiempoEstimadoHoras: "",
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
    throw new Error(data?.message || data?.Message || "La operacion no se pudo completar.");
  }
  return data;
}

function pickItems(res) {
  const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? {};
  return Array.isArray(pack.items ?? pack.Items) ? pack.items ?? pack.Items : [];
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
    Matricula: row.matricula ?? row.Matricula ?? "",
    Marca: row.marca ?? row.Marca ?? "",
    Modelo: row.modelo ?? row.Modelo ?? "",
    Kilometraje: row.kilometraje ?? row.Kilometraje ?? "",
    Fecha: row.fecha ?? row.Fecha,
    FechaPrevistaEntrega: row.fechaPrevistaEntrega ?? row.FechaPrevistaEntrega ?? "",
    TiempoEstimadoHoras: row.tiempoEstimadoHoras ?? row.TiempoEstimadoHoras ?? "",
    MotivoRecepcion: row.motivoRecepcion ?? row.MotivoRecepcion ?? "",
    DiagnosticoMecanico: row.diagnosticoMecanico ?? row.DiagnosticoMecanico ?? "",
    RepuestosNecesarios: row.repuestosNecesarios ?? row.RepuestosNecesarios ?? "",
    Observaciones: row.observaciones ?? row.Observaciones ?? "",
    Estado: row.estado ?? row.Estado ?? "Pendiente",
    ConvertidaEnOrden: row.convertidaEnOrden ?? row.ConvertidaEnOrden ?? false,
    IdOrdenTrabajo: row.idOrdenTrabajo ?? row.IdOrdenTrabajo ?? null,
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
    Matricula: row.matricula ?? row.Matricula ?? "",
    Marca: row.marca ?? row.Marca ?? "",
    Modelo: row.modelo ?? row.Modelo ?? "",
    Kilometraje: row.kilometraje ?? row.Kilometraje ?? "",
  };
}

export default function RegisterPreOrder() {
  const [form, setForm] = useState(EMPTY_PRE_ORDER);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
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
          settings.enablePreOrders ??
          settings.EnablePreOrders ??
          true;
        setAllowed(usesZagaInvoiceTemplate(settings) && moduleEnabled);
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
      setError("No se pudieron cargar las pre-ordenes.");
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
      const pack = res?.data?.data?.[0] ?? {};
      const list = Array.isArray(pack.items ?? pack.Items) ? pack.items ?? pack.Items : [];
      setCustomerMatches(list.map(normalizeCustomer));
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

  const fillFromCustomer = async (customer) => {
    const fullCustomer = await loadCustomerDetail(customer);
    setForm((prev) => ({
      ...prev,
      ClienteId: fullCustomer.Id || prev.ClienteId,
      Cliente: fullCustomer.Nombre || prev.Cliente,
      Dni: fullCustomer.Dni || prev.Dni,
      Telefono: fullCustomer.Telefono || prev.Telefono,
      Direccion: fullCustomer.Direccion || prev.Direccion,
      Matricula: fullCustomer.Matricula || prev.Matricula,
      Marca: fullCustomer.Marca || prev.Marca,
      Modelo: fullCustomer.Modelo || prev.Modelo,
      Kilometraje: fullCustomer.Kilometraje || prev.Kilometraje,
    }));
    setCustomerSearch("");
    setCustomerMatches([]);
  };

  const resetForm = () => {
    setForm(EMPTY_PRE_ORDER);
    setEditingId(null);
    setCustomerSearch("");
    setCustomerMatches([]);
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

      const payload = {
        cliente: submitForm.Cliente,
        dni: submitForm.Dni || null,
        telefono: submitForm.Telefono || null,
        direccion: submitForm.Direccion || null,
        matricula: submitForm.Matricula,
        marca: submitForm.Marca || null,
        modelo: submitForm.Modelo,
        kilometraje: submitForm.Kilometraje ? Number(submitForm.Kilometraje) : null,
        fecha: submitForm.Fecha,
        fechaPrevistaEntrega: submitForm.FechaPrevistaEntrega || null,
        tiempoEstimadoHoras: submitForm.TiempoEstimadoHoras
          ? Number(submitForm.TiempoEstimadoHoras)
          : null,
        motivoRecepcion: submitForm.MotivoRecepcion,
        diagnosticoMecanico: submitForm.DiagnosticoMecanico || null,
        repuestosNecesarios: submitForm.RepuestosNecesarios || null,
        observaciones: submitForm.Observaciones || null,
      };

      if (editingId) {
        ensureOk(await api.put(`/PreOrdenTrabajo/${editingId}`, payload));
        setNotice("Pre-orden actualizada correctamente.");
      } else {
        ensureOk(await api.post("/PreOrdenTrabajo", payload));
        setNotice("Pre-orden registrada correctamente.");
      }

      resetForm();
      await loadPreOrders();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "No se pudo guardar la pre-orden.");
    } finally {
      setSaving(false);
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
      Matricula: item.Matricula,
      Marca: item.Marca,
      Modelo: item.Modelo,
      Kilometraje: item.Kilometraje || "",
      Fecha: item.Fecha ? String(item.Fecha).slice(0, 10) : new Date().toISOString().slice(0, 10),
      FechaPrevistaEntrega: item.FechaPrevistaEntrega
        ? String(item.FechaPrevistaEntrega).slice(0, 10)
        : "",
      TiempoEstimadoHoras: item.TiempoEstimadoHoras || "",
      MotivoRecepcion: item.MotivoRecepcion,
      DiagnosticoMecanico: item.DiagnosticoMecanico,
      RepuestosNecesarios: item.RepuestosNecesarios,
      Observaciones: item.Observaciones,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      setError(err?.response?.data?.message || err?.message || "No se pudo eliminar la pre-orden.");
    }
  };

  return (
    <>
      {allowed === false ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Modulo no disponible</h2>
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
      <div className="mt-2 mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Pre-ordenes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Recepcion inicial del vehiculo antes de convertirla en orden de trabajo.
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

      {notice && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">{notice}</div>}
      {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>}

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric label="Pendientes en pantalla" value={pendingCount} />
        <Metric label="Total filtrado" value={total} />
        <Metric label="Pagina" value={`${page}/${totalPages}`} />
      </section>

      <form onSubmit={submit} className="mb-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
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
              placeholder="Nombre, telefono, matricula o modelo"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            {customerSearch && (
              <button
                type="button"
                onClick={() => {
                  setCustomerSearch("");
                  setCustomerMatches([]);
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
                  onClick={() => fillFromCustomer(customer)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <span className="block font-semibold text-slate-900">{customer.Nombre}</span>
                  <span className="mt-1 block text-slate-600">
                    {customer.Matricula || "Sin matricula"} · {customer.Marca} {customer.Modelo}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">{customer.Telefono || "Sin telefono"}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input name="Cliente" value={form.Cliente} onChange={setField} placeholder="Cliente *" required />
          <Input name="Dni" value={form.Dni} onChange={setField} placeholder="DNI/NIE" />
          <Input name="Telefono" value={form.Telefono} onChange={setField} placeholder="Telefono" />
          <Input name="Direccion" value={form.Direccion} onChange={setField} placeholder="Direccion" />
          <Input name="Fecha" type="date" value={form.Fecha} onChange={setField} required />
          <Input name="Matricula" value={form.Matricula} onChange={setField} placeholder="Matricula *" required />
          <Input name="Marca" value={form.Marca} onChange={setField} placeholder="Marca" />
          <Input name="Modelo" value={form.Modelo} onChange={setField} placeholder="Modelo *" required />
          <Input name="Kilometraje" type="number" value={form.Kilometraje} onChange={setField} placeholder="Kilometraje" />
          <Input name="FechaPrevistaEntrega" type="date" value={form.FechaPrevistaEntrega} onChange={setField} title="Fecha prevista de entrega" />
          <Input name="TiempoEstimadoHoras" type="number" value={form.TiempoEstimadoHoras} onChange={setField} placeholder="Tiempo estimado horas" />

          <Textarea
            name="MotivoRecepcion"
            value={form.MotivoRecepcion}
            onChange={setField}
            className="md:col-span-4"
            rows={3}
            placeholder="Lo que indica el cliente o recepcion. Ej: al carro le suenan los frenos *"
            required
          />
          <Textarea
            name="DiagnosticoMecanico"
            value={form.DiagnosticoMecanico}
            onChange={setField}
            className="md:col-span-2"
            rows={4}
            placeholder="Espacio para mecanico: trabajo que hay que hacerle"
          />
          <Textarea
            name="RepuestosNecesarios"
            value={form.RepuestosNecesarios}
            onChange={setField}
            className="md:col-span-2"
            rows={4}
            placeholder="Espacio para mecanico: repuestos necesarios"
          />
          <Textarea
            name="Observaciones"
            value={form.Observaciones}
            onChange={setField}
            className="md:col-span-4"
            rows={2}
            placeholder="Observaciones"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-amber-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : editingId ? "Actualizar pre-orden" : "Crear pre-orden"}
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
          <h3 className="text-lg font-semibold text-slate-800">Pre-ordenes recientes</h3>
          <div className="relative w-full md:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              className={`${cls} pl-10`}
              placeholder="Buscar cliente, matricula, motivo..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <article key={item.Id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">#{item.Id} · {item.Fecha ? new Date(item.Fecha).toLocaleDateString("es-ES") : ""}</p>
                  <h4 className="text-lg font-bold text-slate-900">{item.Matricula}</h4>
                  <p className="text-sm text-slate-600">{item.Cliente} · {[item.Marca, item.Modelo].filter(Boolean).join(" ")}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                  item.ConvertidaEnOrden
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                }`}>
                  {item.ConvertidaEnOrden ? "Convertida" : item.Estado}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-700">{item.MotivoRecepcion}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <a
                  href={`/print-pre-order/${item.Id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <Printer size={16} />
                  Imprimir
                </a>
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
                    target="_blank"
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
              No hay pre-ordenes para mostrar.
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500 lg:col-span-2">
              Cargando pre-ordenes...
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
          <span className="text-sm text-slate-500">Pagina {page} de {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </section>
        </>
      )}
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
