import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";

const EMPTY_BUDGET = {
  NumeroPresupuesto: "",
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
  Estado: "Pendiente",
  Observaciones: "",
};

const states = ["Pendiente", "Aprobado", "Rechazado", "Convertido"];

export default function RegisterBudget() {
  const [budget, setBudget] = useState(EMPTY_BUDGET);
  const [budgets, setBudgets] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const total = Number(budget.Repuestos || 0) + Number(budget.ManoObra || 0);

  const setField = (name, value) => {
    setBudget((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange = (e) => {
    setField(e.target.name, e.target.value);
  };

  const normalizeBudget = (x) => ({
    Id: x.id ?? x.Id,
    NumeroPresupuesto: x.numeroPresupuesto ?? x.NumeroPresupuesto ?? "",
    Cliente: x.cliente ?? x.Cliente ?? "",
    Telefono: x.telefono ?? x.Telefono ?? "",
    Matricula: x.matricula ?? x.Matricula ?? "",
    Marca: x.marca ?? x.Marca ?? "",
    Modelo: x.modelo ?? x.Modelo ?? "",
    Kilometraje: x.kilometraje ?? x.Kilometraje ?? "",
    Fecha: x.fecha ?? x.Fecha,
    Trabajo: x.trabajo ?? x.Trabajo ?? "",
    Repuestos: x.repuestos ?? x.Repuestos ?? 0,
    ManoObra: x.manoObra ?? x.ManoObra ?? 0,
    Estado: x.estado ?? x.Estado ?? "Pendiente",
    Observaciones: x.observaciones ?? x.Observaciones ?? "",
    ConvertidoEnOrden: x.convertidoEnOrden ?? x.ConvertidoEnOrden ?? false,
    IdOrdenTrabajo: x.idOrdenTrabajo ?? x.IdOrdenTrabajo ?? null,
  });

  const loadBudgets = async () => {
    try {
      setError("");

      const hasFilters = dateFrom || dateTo;

      const res = hasFilters
        ? await api.get("/Presupuesto", {
            params: {
              fechaDesde: dateFrom || null,
              fechaHasta: dateTo || null,
            },
          })
        : await api.get("/Presupuesto/ultimos", {
            params: { take: 20 },
          });

      const data = res?.data?.data?.[0] || [];
      setBudgets(data.map(normalizeBudget));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los presupuestos.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBudgets();
    }, 400);

    return () => clearTimeout(timer);
  }, [dateFrom, dateTo]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      setNotice("");
      setError("");

      const payload = {
        numeroPresupuesto: budget.NumeroPresupuesto || null,
        cliente: budget.Cliente,
        telefono: budget.Telefono || null,
        matricula: budget.Matricula,
        marca: budget.Marca || null,
        modelo: budget.Modelo,
        kilometraje: budget.Kilometraje ? Number(budget.Kilometraje) : null,
        fecha: budget.Fecha,
        trabajo: budget.Trabajo,
        repuestos: Number(budget.Repuestos || 0),
        manoObra: Number(budget.ManoObra || 0),
        estado: budget.Estado || "Pendiente",
        observaciones: budget.Observaciones || null,
      };

      if (editingId) {
        await api.put(`/Presupuesto/${editingId}`, payload);
        setNotice("Presupuesto actualizado correctamente.");
      } else {
        await api.post("/Presupuesto", payload);
        setNotice("Presupuesto registrado correctamente.");
      }

      setBudget(EMPTY_BUDGET);
      setEditingId(null);
      await loadBudgets();
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
      Telefono: p.Telefono || "",
      Matricula: p.Matricula || "",
      Marca: p.Marca || "",
      Modelo: p.Modelo || "",
      Kilometraje: p.Kilometraje || "",
      Fecha: p.Fecha
        ? String(p.Fecha).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      Trabajo: p.Trabajo || "",
      Repuestos: p.Repuestos || "",
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
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

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
            name="Telefono"
            value={budget.Telefono}
            onChange={handleChange}
            className={cls}
            placeholder="Teléfono"
          />

          <input
            name="Matricula"
            value={budget.Matricula}
            onChange={(e) =>
              setField("Matricula", e.target.value.toUpperCase())
            }
            className={cls}
            placeholder="Matrícula *"
            required
          />

          <input
            name="Marca"
            value={budget.Marca}
            onChange={handleChange}
            className={cls}
            placeholder="Marca"
          />

          <input
            name="Modelo"
            value={budget.Modelo}
            onChange={handleChange}
            className={cls}
            placeholder="Modelo *"
            required
          />

          <input
            name="Kilometraje"
            type="number"
            value={budget.Kilometraje}
            onChange={handleChange}
            className={cls}
            placeholder="Kilometraje"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <textarea
            name="Trabajo"
            value={budget.Trabajo}
            onChange={handleChange}
            className={`${cls} md:col-span-3`}
            rows={3}
            placeholder="Trabajo presupuestado *"
            required
          />

          <input
            name="Repuestos"
            type="number"
            step="0.01"
            value={budget.Repuestos}
            onChange={handleChange}
            className={cls}
            placeholder="Repuestos €"
          />

          <input
            name="ManoObra"
            type="number"
            step="0.01"
            value={budget.ManoObra}
            onChange={handleChange}
            className={cls}
            placeholder="Mano de obra €"
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">Total presupuesto</div>
            <div className="text-xl font-semibold text-slate-900">
              {total.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </div>

          <textarea
            name="Observaciones"
            value={budget.Observaciones}
            onChange={handleChange}
            className={`${cls} md:col-span-3`}
            rows={2}
            placeholder="Observaciones"
          />
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
        onChange={(e) => setDateFrom(e.target.value)}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
      />

      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
      />

      {(dateFrom || dateTo) && (
        <button
          type="button"
          onClick={() => {
            setDateFrom("");
            setDateTo("");
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
              {(Number(p.Repuestos || 0) + Number(p.ManoObra || 0)).toLocaleString(
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
</section>
    </>
  );
}
