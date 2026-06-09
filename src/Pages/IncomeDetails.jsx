import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import api from "../Components/api";
import Loader from "../Components/Loader";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { soloFecha } from "../utils/date";
import {
  Search, RotateCcw, ArrowLeft, CalendarDays, XCircle,
} from "lucide-react";

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const IVA_RATE = 0.21;
const amountOf = (value) => Number(value ?? 0);
const ivaOf = (value) => amountOf(value) * IVA_RATE;
const totalWithIva = (value) => amountOf(value) + ivaOf(value);
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Banner superior para éxito/error (igual que en Register/RegisterIncome) */
const Banner = ({ type = "success", text, onClose, actionLabel, onAction }) => {
  if (!text) return null;
  const map = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    error: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <div role="alert" aria-live="polite" className={`mb-4 rounded-xl p-3 text-sm ring-1 ${map[type]}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{text}</span>
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="rounded-lg px-2.5 py-1 text-xs ring-1 ring-current/20 hover:bg-white/60"
            >
              {actionLabel}
            </button>
          )}
          <button type="button" onClick={onClose} className="text-xs underline underline-offset-2">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

/** Modal de confirmación sencillo y accesible */
const ConfirmModal = ({ open, title, message, confirmLabel = "Sí", cancelLabel = "No", loading = false, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onCancel} />
      {/* Dialog */}
      <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <h3 id="confirm-title" className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl px-4 py-2.5 bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-xl px-4 py-2.5 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function IncomeDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Banner global
  const [notice, setNotice] = useState(null); // { type, text, actionLabel?, onAction?, onClose?, autocloseMs? }
  const autoTimerRef = useRef(null);

  // Estado del modal de confirmación
  const [confirmState, setConfirmState] = useState({
    open: false,
    row: null,
    loading: false,
  });

  const total = useMemo(() => rows.reduce((acc, x) => acc + amountOf(x.importe), 0), [rows]);
  const ivaTotal = total * IVA_RATE;
  const totalConIva = total + ivaTotal;

  const loadTipos = useCallback(async () => {
    try {
      const res = await api.get("/Ingreso");
      setTipos(res.data?.data ?? []);
    } catch {
      setTipos([]);
      setNotice({
        type: "error",
        text: "No se pudieron cargar los tipos de ingreso.",
      });
    }
  }, []);

  const fetchData = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const f = opts.from ?? from;
        const t = opts.to ?? to;
        const tid = opts.tipoId ?? tipoId;

        const params = new URLSearchParams();
        if (f) params.set("fechaInicio", f);
        if (t) params.set("fechaFin", t);
        if (tid) params.set("tipoId", tid);

        const res = await api.get(`/Ingreso/detalle?${params.toString()}`);
        const list = res.data?.data?.[0] ?? [];
        setRows(Array.isArray(list) ? list : []);
      } catch (e) {
        setRows([]);
        setNotice({
          type: "error",
          text: "No se pudo obtener el detalle de ingresos.",
        });
      } finally {
        setLoading(false);
      }
    },
    [from, to, tipoId]
  );

  useEffect(() => {
    loadTipos();
    fetchData();
  }, [loadTipos, fetchData]);

  // Soporte para "flash" al llegar desde otra pantalla
  useEffect(() => {
    const flash = location.state?.flash;
    if (flash?.text) {
      setNotice({
        type: flash.type || "success",
        text: flash.text,
        autocloseMs: flash.autocloseMs ?? 2500,
        onClose: () => setNotice(null),
      });
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autocierre de banners
  useEffect(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (notice?.autocloseMs && typeof notice?.onClose === "function") {
      autoTimerRef.current = setTimeout(() => {
        notice.onClose();
      }, notice.autocloseMs);
    }
    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [notice]);

  const onSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const onClear = () => {
    setFrom("");
    setTo("");
    setTipoId("");
    fetchData({ from: "", to: "", tipoId: "" });
  };

  // Rangos rápidos
  const setThisMonth = () => {
    const now = new Date();
    const f = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
    const t = ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    setFrom(f);
    setTo(t);
    fetchData({ from: f, to: t });
  };
  const setLast30 = () => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);
    const f = ymd(past), t = ymd(now);
    setFrom(f);
    setTo(t);
    fetchData({ from: f, to: t });
  };
  const setThisYear = () => {
    const now = new Date();
    const f = ymd(new Date(now.getFullYear(), 0, 1));
    const t = ymd(new Date(now.getFullYear(), 11, 31));
    setFrom(f);
    setTo(t);
    fetchData({ from: f, to: t });
  };

  // Acciones
  const onEdit = (row) =>
    navigate("/register-income", { state: { edit: true, record: row } });

  // Abrir modal de confirmación
  const onDeleteClick = (row) => {
    setConfirmState({ open: true, row, loading: false });
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    try {
      setConfirmState((s) => ({ ...s, loading: true }));
      await api.delete(`/Ingreso/detalle/${row.id}`);
      setRows((prev) => prev.filter((x) => x.id !== row.id));
      setConfirmState({ open: false, row: null, loading: false });
      setNotice({
        type: "success",
        text: "Ingreso eliminado correctamente.",
        autocloseMs: 2000,
        onClose: () => setNotice(null),
      });
    } catch {
      setConfirmState({ open: false, row: null, loading: false });
      setNotice({
        type: "error",
        text: "No se pudo eliminar el ingreso.",
      });
    }
  };

  return (
    <>
      {/* Header + volver */}
      <div className="flex items-center justify-between gap-3 mt-2 mb-3 md:mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">Detalle de ingresos</h2>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>

      {/* Banner global */}
      <Banner
        type={notice?.type}
        text={notice?.text}
        onClose={() => {
          if (typeof notice?.onClose === "function") {
            notice.onClose();
          } else {
            setNotice(null);
          }
        }}
        actionLabel={notice?.actionLabel}
        onAction={notice?.onAction}
      />

      {/* Filtros */}
      <form
        className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 mb-6"
        onSubmit={onSubmit}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="from">
              Desde
            </label>
            <input
              id="from"
              type="date"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="to">
              Hasta
            </label>
            <input
              id="to"
              type="date"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="tipo">
              Tipo
            </label>
            <select
              id="tipo"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
            >
              <option value="">Todos</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombreIngreso ?? t.nombre}
                </option>
              ))}
            </select>
          </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            <Search size={18} /> {loading ? "Buscando..." : "Buscar"}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
          >
            <RotateCcw size={18} /> Limpiar
          </button>
        </div>
        </div>

        {/* Rangos rápidos */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 flex items-center gap-2">
            <CalendarDays size={16} /> Rápidos:
          </span>
          <button
            type="button"
            onClick={setThisMonth}
            className="rounded-full px-3 py-1 text-sm bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={setLast30}
            className="rounded-full px-3 py-1 text-sm bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
          >
            Últimos 30 días
          </button>
          <button
            type="button"
            onClick={setThisYear}
            className="rounded-full px-3 py-1 text-sm bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
          >
            Este año
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full px-3 py-1 text-sm bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 transition"
          >
            <XCircle size={14} className="inline -mt-0.5" /> Quitar filtro
          </button>
        </div>
      </form>

      {/* LISTA MÓVIL */}
      <section className="md:hidden space-y-3">
        {loading ? (
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4">
            <Loader />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 text-slate-500">
            Sin resultados
          </div>
        ) : (
          rows.map((r) => (
            <article key={r.id} className="rounded-2xl border border-slate-200 bg-white/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">
                    {r.fecha ? soloFecha(r.fecha) : "—"}
                    <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200">
                      Ingreso
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {r.tipo ?? "—"} · {r.mes ?? "—"}
                  </div>
                  <div className="text-sm text-slate-700 mt-1 truncate">{r.descripcion ?? "—"}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold text-emerald-700">{eur.format(totalWithIva(r.importe))}</div>
                  <div className="text-xs text-slate-500">
                    Base {eur.format(amountOf(r.importe))} · IVA {eur.format(ivaOf(r.importe))}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* TABLA DESKTOP */}
      <section className="hidden md:block rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-6">
        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-500">
                Resultados: <span className="font-medium text-slate-700">{rows.length}</span>
              </div>
              <div className="text-sm font-medium text-slate-600">
                Total: <span className="text-slate-900">{eur.format(totalConIva)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="max-h-[520px] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                    <tr className="text-left text-slate-600">
                      <th className="py-2.5 px-3 font-semibold">Fecha</th>
                      <th className="py-2.5 px-3 font-semibold"> </th>
                      <th className="py-2.5 px-3 font-semibold">Tipo</th>
                      <th className="py-2.5 px-3 font-semibold">Descripción</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Importe</th>
                      <th className="py-2.5 px-3 font-semibold text-right">IVA</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td className="py-6 px-3 text-slate-500" colSpan={7}>
                          Sin resultados
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                            {r.fecha ? soloFecha(r.fecha) : "—"}
                          </td>
                          <td className="py-2.5 px-3">{"  "}</td>
                          <td className="py-2.5 px-3">{r.tipo ?? "—"}</td>
                          <td className="py-2.5 px-3 text-slate-700">{r.descripcion ?? "—"}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                            {eur.format(amountOf(r.importe))}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                            {eur.format(ivaOf(r.importe))}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                            {eur.format(totalWithIva(r.importe))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-3 text-right font-semibold" colSpan={4}>
                        Total
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">{eur.format(total)}</th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">{eur.format(ivaTotal)}</th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">{eur.format(totalConIva)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Modal de confirmación */}
      <ConfirmModal
        open={confirmState.open}
        title="Confirmar eliminación"
        message={
          confirmState.row
            ? `¿Estás seguro de eliminar el ingreso “${confirmState.row.descripcion ?? "Sin nombre"}”?`
            : "¿Estás seguro de eliminar este ingreso?"
        }
        confirmLabel="Sí"
        cancelLabel="No"
        loading={confirmState.loading}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmState({ open: false, row: null, loading: false })}
      />
    </>
  );
}
