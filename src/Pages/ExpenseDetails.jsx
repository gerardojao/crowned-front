import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  Filter,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import api from "../Components/api";
import Loader from "../Components/Loader";
import { soloFecha } from "../utils/date";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const ymd = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const textOf = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function read(row, camel, pascal, fallback = "") {
  return row?.[camel] ?? row?.[pascal] ?? fallback;
}

function amount(row) {
  return Number(read(row, "importe", "Importe", read(row, "total", "Total", 0))) || 0;
}

function typeName(row) {
  const value = read(row, "nombre", "Nombre", read(row, "tipo", "Tipo", ""));
  return value === "Transporte" ? "Gastos Casa" : value || "-";
}

function providerName(row) {
  return read(row, "proveedorNombre", "ProveedorNombre", "");
}

function description(row) {
  return read(row, "descripcion", "Descripcion", "");
}

function invoiceNumber(row) {
  return read(row, "numeroFactura", "NumeroFactura", "");
}

function paymentMethod(row) {
  const method = read(row, "bankAccountName", "BankAccountName", "") || "Efectivo";
  return String(method).toLowerCase() === "caja" ? "Efectivo" : method;
}

function Banner({ notice, onClose }) {
  if (!notice?.text) return null;
  const className =
    notice.type === "error"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return (
    <div className={`mb-4 rounded-xl p-3 text-sm ring-1 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{notice.text}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs underline underline-offset-2"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "slate" }) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-700 ring-rose-100"
      : "bg-slate-50 text-slate-700 ring-slate-100";
  return (
    <div className={`rounded-xl px-4 py-3 ring-1 ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function ActionButton({ label, icon: Icon, tone = "slate", onClick }) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : "border-slate-200 text-slate-600 hover:bg-slate-100";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition ${toneClass}`}
      title={label}
      aria-label={label}
    >
      <Icon size={15} />
    </button>
  );
}

function ConfirmModal({ row, loading, onConfirm, onCancel }) {
  if (!row) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onCancel} />
      <div className="relative z-10 w-[92%] max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Trash2 size={19} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Eliminar gasto
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Esta accion ocultara el gasto del detalle.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            <Trash2 size={16} />
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + amount(row), 0),
    [rows],
  );

  const paymentMethods = useMemo(() => {
    const names = new Set(allRows.map((row) => paymentMethod(row)).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b, "es"));
  }, [allRows]);

  const applyFilters = useCallback((list, method, search) => {
    const cleanSearch = textOf(search);
    return list.filter((row) => {
      if (method && paymentMethod(row) !== method) return false;
      if (!cleanSearch) return true;
      return [
        typeName(row),
        providerName(row),
        description(row),
        invoiceNumber(row),
        paymentMethod(row),
        row?.mes,
        row?.Mes,
      ].some((value) => textOf(value).includes(cleanSearch));
    });
  }, []);

  const loadTypes = useCallback(async () => {
    try {
      const res = await api.get("/Egreso");
      const list = res.data?.data ?? [];
      setTypes(
        list.map((item) => ({
          id: item.id ?? item.Id,
          nombre:
            (item.nombre ?? item.Nombre) === "Transporte"
              ? "Gastos Casa"
              : item.nombre ?? item.Nombre,
        })),
      );
    } catch {
      setTypes([]);
      setNotice({ type: "error", text: "No se pudieron cargar los tipos de gasto." });
    }
  }, []);

  const fetchData = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const nextFrom = opts.from ?? from;
        const nextTo = opts.to ?? to;
        const nextType = opts.tipoId ?? tipoId;
        const nextPayment = opts.paymentFilter ?? "";
        const nextSearch = opts.searchFilter ?? "";
        if (nextFrom) params.set("fechaInicio", nextFrom);
        if (nextTo) params.set("fechaFin", nextTo);
        if (nextType) params.set("tipoId", nextType);

        const res = await api.get(`/Egreso/detalle?${params.toString()}`);
        const list = res.data?.data?.[0] ?? [];
        const nextRows = Array.isArray(list) ? list : [];
        setAllRows(nextRows);
        setRows(applyFilters(nextRows, nextPayment, nextSearch));
      } catch {
        setAllRows([]);
        setRows([]);
        setNotice({ type: "error", text: "No se pudo obtener el detalle de gastos." });
      } finally {
        setLoading(false);
      }
    },
    [applyFilters, from, tipoId, to],
  );

  useEffect(() => {
    loadTypes();
    fetchData();
  }, [loadTypes, fetchData]);

  useEffect(() => {
    const flash = location.state?.flash;
    if (flash?.text) {
      setNotice({ type: flash.type || "success", text: flash.text });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const onSubmit = (event) => {
    event.preventDefault();
    fetchData({ paymentFilter, searchFilter });
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setTipoId("");
    setPaymentFilter("");
    setSearchFilter("");
    fetchData({ from: "", to: "", tipoId: "", paymentFilter: "", searchFilter: "" });
  };

  const handlePaymentFilterChange = (value) => {
    setPaymentFilter(value);
    setRows(applyFilters(allRows, value, searchFilter));
  };

  const handleSearchFilterChange = (value) => {
    setSearchFilter(value);
    setRows(applyFilters(allRows, paymentFilter, value));
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    setFrom(start);
    setTo(end);
    fetchData({ from: start, to: end, paymentFilter, searchFilter });
  };

  const setLast30 = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setFrom(ymd(start));
    setTo(ymd(end));
    fetchData({ from: ymd(start), to: ymd(end), paymentFilter, searchFilter });
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    try {
      setDeleting(true);
      const id = deleteRow.id ?? deleteRow.Id;
      await api.delete(`/FichaEgreso/detalle/${id}`);
      setRows((current) => current.filter((row) => (row.id ?? row.Id) !== id));
      setDeleteRow(null);
      setNotice({ type: "success", text: "Gasto eliminado correctamente." });
    } catch {
      setNotice({ type: "error", text: "No se pudo eliminar el gasto." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Egresos
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Detalle de gastos
          </h2>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
        >
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>

      <Banner notice={notice} onClose={() => setNotice(null)} />

      <form
        className="mb-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5"
        onSubmit={onSubmit}
      >
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter size={17} className="text-slate-500" />
          Filtros
        </div>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1fr_1.1fr_1.1fr_1.4fr_auto]">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Desde
            <input
              type="date"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Hasta
            <input
              type="date"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tipo
            <select
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={tipoId}
              onChange={(event) => setTipoId(event.target.value)}
            >
              <option value="">Todos</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Metodo de pago
            <select
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={paymentFilter}
              onChange={(event) => handlePaymentFilterChange(event.target.value)}
            >
              <option value="">Todos</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Buscar
            <input
              type="search"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={searchFilter}
              onChange={(event) => handleSearchFilterChange(event.target.value)}
              placeholder="Coincidencia"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              <Search size={18} /> {loading ? "Buscando..." : "Buscar"}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              title="Limpiar filtros"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={16} /> Rapidos:
          </span>
          <button
            type="button"
            onClick={setThisMonth}
            className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100"
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={setLast30}
            className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100"
          >
            Ultimos 30 dias
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
          >
            <XCircle size={14} className="inline -mt-0.5" /> Quitar filtro
          </button>
        </div>
      </form>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="Resultados" value={rows.length} />
        <Stat label="Total" value={eur.format(total)} tone="rose" />
      </section>

      <section className="md:hidden space-y-3">
        {loading ? (
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <Loader />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl bg-white p-4 text-slate-500 shadow-sm ring-1 ring-slate-200">
            Sin resultados
          </div>
        ) : (
          rows.map((row) => (
            <article
              key={row.id ?? row.Id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">
                    {row.fecha ? soloFecha(row.fecha) : "-"}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {typeName(row)} - {row.mes ?? row.Mes ?? "-"}
                  </div>
                  {providerName(row) && (
                    <div className="mt-1 text-xs text-slate-500">
                      Proveedor: {providerName(row)}
                    </div>
                  )}
                  <div className="mt-1 truncate text-sm text-slate-700">
                    {description(row) || "-"}
                  </div>
                  {invoiceNumber(row) && (
                    <div className="mt-1 text-xs text-slate-500">
                      Comprobante: {invoiceNumber(row)}
                    </div>
                  )}
                  <div className="mt-1 text-xs font-medium text-slate-600">
                    Metodo de pago: {paymentMethod(row)}
                  </div>
                </div>
                <div className="shrink-0 text-right font-semibold text-rose-700">
                  {eur.format(amount(row))}
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <ActionButton
                  label="Editar gasto"
                  icon={Edit3}
                  onClick={() =>
                    navigate("/register-expense", {
                      state: { edit: true, record: row },
                    })
                  }
                />
                <ActionButton
                  label="Eliminar gasto"
                  icon={Trash2}
                  tone="danger"
                  onClick={() => setDeleteRow(row)}
                />
              </div>
            </article>
          ))
        )}
      </section>

      <section className="hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:block">
        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Comprobante</th>
                    <th className="px-4 py-3 text-left font-semibold">Proveedor</th>
                    <th className="px-4 py-3 text-left font-semibold">Metodo de pago</th>
                    <th className="px-4 py-3 text-left font-semibold">Descripcion</th>
                    <th className="px-4 py-3 text-right font-semibold">Importe</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-slate-500" colSpan={7}>
                        Sin resultados
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id ?? row.Id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                          {row.fecha ? soloFecha(row.fecha) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {typeName(row)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {invoiceNumber(row) || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {providerName(row) || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {paymentMethod(row)}
                        </td>
                        <td className="max-w-[320px] px-4 py-3 text-slate-700">
                          {description(row) || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-rose-700">
                          {eur.format(amount(row))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              label="Editar gasto"
                              icon={Edit3}
                              onClick={() =>
                                navigate("/register-expense", {
                                  state: { edit: true, record: row },
                                })
                              }
                            />
                            <ActionButton
                              label="Eliminar gasto"
                              icon={Trash2}
                              tone="danger"
                              onClick={() => setDeleteRow(row)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50 text-sm">
                  <tr>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700" colSpan={6}>
                      Total
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-slate-900">
                      {eur.format(total)}
                    </th>
                    <th />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </section>

      <ConfirmModal
        row={deleteRow}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
