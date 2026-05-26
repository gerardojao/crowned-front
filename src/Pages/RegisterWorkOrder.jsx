import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";

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

export default function RegisterWorkOrder() {
  const [order, setOrder] = useState(EMPTY_ORDER);
  const [orders, setOrders] = useState([]);
  const [notice, setNotice] = useState("");
  const [plateSearch, setPlateSearch] = useState("");
  const [error, setError] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const setField = (name, value) => {
    setOrder((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange = (e) => {
    setField(e.target.name, e.target.value);
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
  });

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

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      setError("");

      const search = plateSearch.trim();

      const res = search
        ? await api.get("/OrdenTrabajo", {
            params: {
              matricula: search,
              page: 1,
              pageSize: 10,
            },
          })
        : await api.get("/OrdenTrabajo/ultimas", {
            params: {
              take: 10,
            },
          });

      const items = getItemsFromResponse(res).map(normalizeOrder);
      setOrders(items);
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
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateSearch]);

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
        await api.put(`/OrdenTrabajo/${editingId}`, payload);
        setNotice("Orden actualizada correctamente.");
      } else {
        await api.post("/OrdenTrabajo", payload);
        setNotice("Orden registrada correctamente.");
      }

      setOrder(EMPTY_ORDER);
      setEditingId(null);

      await loadOrders();
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

  const filteredOrders = orders.filter((o) =>
    (o.Matricula || "")
      .toLowerCase()
      .includes(plateSearch.trim().toLowerCase()),
  );

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
            Nueva orden de trabajo
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Registra trabajos, vehículo, estado y costes del servicio.
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
            Datos del cliente y vehículo
          </h3>

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
              placeholder="Matrícula *"
              required
            />

            <input
              name="Kilometraje"
              type="number"
              value={order.Kilometraje}
              onChange={handleChange}
              className={cls}
              placeholder="Kilometraje"
            />

            <input
              name="Marca"
              value={order.Marca}
              onChange={handleChange}
              className={cls}
              placeholder="Marca"
            />

            <input
              name="Modelo"
              value={order.Modelo}
              onChange={handleChange}
              className={cls}
              placeholder="Modelo *"
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

            <input
              name="Repuestos"
              type="number"
              step="0.01"
              value={order.Repuestos}
              onChange={handleChange}
              className={cls}
              placeholder="Repuestos €"
            />

            <input
              name="ManoObra"
              type="number"
              step="0.01"
              value={order.ManoObra}
              onChange={handleChange}
              className={cls}
              placeholder="Mano de obra €"
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Total estimado</div>
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
            }}
            className="inline-flex items-center rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
          >
            Limpiar
          </button>
        </div>
      </form>

      <section
        id="ordenes-recientes"
        className="mt-8 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-6"
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
            placeholder="Buscar matrícula..."
            className="w-full md:w-80 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4">
          {filteredOrders.map((o) => (
            <article
              key={o.Id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
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

                  <button
                    type="button"
                    onClick={() => startEdit(o)}
                    className="rounded-xl px-3 py-2 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition"
                  >
                    Editar
                  </button>

                  <a
                    href="https://invoice.familyapp.store"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl px-3 py-2 bg-orange-600 hover:bg-orange-700 text-sm font-medium text-white transition"
                  >
                    Facturar
                  </a>
                </div>
              </div>
            </article>
          ))}

          {filteredOrders.length === 0 && (
            <div className="lg:col-span-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 text-2xl">
                🚗
              </div>

              <h4 className="mt-4 text-lg font-semibold text-slate-800">
                {plateSearch
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
      </section>
    </>
  );
}
