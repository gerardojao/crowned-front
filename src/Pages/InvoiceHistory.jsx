import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import api from "../Components/api";
import Loader from "../Components/Loader";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { soloFecha } from "../utils/date";
import {
  Search,
  RotateCcw,
  ArrowLeft,
  CalendarDays,
  XCircle,
  Printer,
  Mail,
  Eye,
  FileWarning,
} from "lucide-react";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const amountOf = (value) => Number(value ?? 0);
const PAGE_SIZE = 10;

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const Banner = ({ type = "success", text, onClose }) => {
  if (!text) return null;

  const map = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    error: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mb-4 rounded-xl p-3 text-sm ring-1 ${map[type]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span>{text}</span>
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
};

export default function InvoiceHistory() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [origin, setOrigin] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [notice, setNotice] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const autoTimerRef = useRef(null);

  const totalBase = useMemo(
    () => rows.reduce((acc, x) => acc + amountOf(x.baseAmount), 0),
    [rows],
  );

  const totalIva = useMemo(
    () => rows.reduce((acc, x) => acc + amountOf(x.ivaAmount), 0),
    [rows],
  );

  const totalGeneral = useMemo(
    () => rows.reduce((acc, x) => acc + amountOf(x.totalAmount), 0),
    [rows],
  );

  const fetchData = useCallback(
    async (opts = {}) => {
      setLoading(true);

      try {
        const f = opts.from ?? from;
        const t = opts.to ?? to;
        const o = opts.origin ?? origin;
        const type = opts.invoiceType ?? invoiceType;
        const nextPage = opts.page ?? 1;

        const params = new URLSearchParams();

        if (f) params.set("fechaInicio", f);
        if (t) params.set("fechaFin", t);
        if (o) params.set("origin", o);
        if (type) params.set("invoiceType", type);
        params.set("page", String(nextPage));
        params.set("pageSize", String(PAGE_SIZE));

        const res = await api.get(`/FacturaEmitida?${params.toString()}`);
        console.log("API response for invoice history:", res.data);
        const list = res.data?.data ?? [];
        console.log("Fetched invoice history:", list);

        setRows(Array.isArray(list) ? list : []);
        setPage(Number(res.data?.page ?? nextPage));
        setTotal(Number(res.data?.total ?? 0));
        setTotalPages(Math.max(1, Number(res.data?.totalPages ?? 1)));
      } catch {
        setRows([]);
        setTotal(0);
        setTotalPages(1);
        setNotice({
          type: "error",
          text: "No se pudo obtener el historial de facturas.",
        });
      } finally {
        setLoading(false);
      }
    },
    [from, to, origin, invoiceType],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const flash = location.state?.flash;

    if (flash?.text) {
      setNotice({
        type: flash.type || "success",
        text: flash.text,
        autocloseMs: flash.autocloseMs ?? 2500,
      });

      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);

  useEffect(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }

    if (notice?.autocloseMs) {
      autoTimerRef.current = setTimeout(() => {
        setNotice(null);
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
    fetchData({ page: 1 });
  };

  const onClear = () => {
    setFrom("");
    setTo("");
    setOrigin("");
    setInvoiceType("");
    setSearchFilter("");
    fetchData({
      from: "",
      to: "",
      origin: "",
      invoiceType: "",
      page: 1,
    });
  };
  const setToday = () => {
    const today = ymd(new Date());

    setFrom(today);
    setTo(today);

    fetchData({ from: today, to: today, page: 1 });
  };

  const setThisMonth = () => {
    const now = new Date();
    const f = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
    const t = ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    setFrom(f);
    setTo(t);

    fetchData({ from: f, to: t, page: 1 });
  };

  const setLast30 = () => {
    const now = new Date();
    const past = new Date();

    past.setDate(now.getDate() - 30);

    const f = ymd(past);
    const t = ymd(now);

    setFrom(f);
    setTo(t);

    fetchData({ from: f, to: t, page: 1 });
  };

  const setThisYear = () => {
    const now = new Date();
    const f = ymd(new Date(now.getFullYear(), 0, 1));
    const t = ymd(new Date(now.getFullYear(), 11, 31));

    setFrom(f);
    setTo(t);

    fetchData({ from: f, to: t, page: 1 });
  };

  const getOriginLabel = (row) => {
    if (row.origin === "workshop") return "Taller";
    if (row.origin === "sparePart") return "Recambio";
    if (row.origin === "rapel") return "Rapel";
    if (row.origin === "noVat") return "Sin IVA";
    return "-";
  };

  const getTypeLabel = (row) => {
    return row.isRectification ? "Rectificativa" : "Normal";
  };

  const handlePrint = (row) => {
    if (row.idOrdenTrabajo) {
      window.open(`/reprint-invoice/order/${row.idOrdenTrabajo}`);
      return;
    }

    window.open(
      `/reprint-invoice/number/${encodeURIComponent(row.invoiceNumber)}`,
      "_blank",
    );
  };

  const handleView = (row) => {
    if (["sparePart", "rapel", "noVat"].includes(row.origin)) {
      navigate(
        `/reprint-invoice/number/${encodeURIComponent(row.invoiceNumber)}`,
      );
      return;
    }

    handlePrint(row);
  };

  const handleSendEmail = async (row) => {
    try {
      await api.post(`/FacturaEmitida/${row.origin}/${row.id}/send-email`);

      setNotice({
        type: "success",
        text: "Factura enviada correctamente por email.",
        autocloseMs: 2500,
      });
    } catch {
      setNotice({
        type: "error",
        text: "No se pudo enviar la factura por email.",
      });
    }
  };

  // const filteredRows = useMemo(() => {
  //   const search = searchFilter.trim().toLowerCase();

  //   if (!search) return rows;

  //   return rows.filter((x) =>
  //     [
  //       x.invoiceNumber,
  //       x.customerName,
  //       x.nif,
  //       x.matricula,
  //       x.vehiclePlate,
  //       x.marca,
  //       x.modelo,
  //       x.origin,
  //       x.totalAmount,
  //       x.baseAmount,
  //       x.ivaAmount,
  //       x.originalInvoiceNumber,
  //     ]
  //       .filter(Boolean)
  //       .some((value) =>
  //         String(value).toLowerCase().includes(search)
  //       )
  //   );
  // }, [rows, searchFilter]);
  const filteredRows = useMemo(() => {
    const search = searchFilter.trim().toLowerCase();

    if (!search) return rows;

    return rows.filter((row) =>
      Object.values(row)
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [rows, searchFilter]);

  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(total, page * PAGE_SIZE);
  const canGoPrevious = page > 1 && !loading;
  const canGoNext = page < totalPages && !loading;

  const goToPage = (nextPage) => {
    const safePage = Math.min(Math.max(1, nextPage), totalPages);
    fetchData({ page: safePage });
  };

  const PaginationControls = ({ className = "" }) => (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="text-sm text-slate-500">
        Mostrando{" "}
        <span className="font-medium text-slate-700">
          {pageStart}-{pageEnd}
        </span>{" "}
        de <span className="font-medium text-slate-700">{total}</span>{" "}
        facturas
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={!canGoPrevious}
          onClick={() => goToPage(page - 1)}
          className="rounded-xl px-3 py-2 text-sm bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        <span className="min-w-[7rem] text-center text-sm text-slate-600">
          Página {page} de {totalPages}
        </span>

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => goToPage(page + 1)}
          className="rounded-xl px-3 py-2 text-sm bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  );

  const buildInvoiceParams = ({ targetPage, targetPageSize }) => {
    const params = new URLSearchParams();

    if (from) params.set("fechaInicio", from);
    if (to) params.set("fechaFin", to);
    if (origin) params.set("origin", origin);
    if (invoiceType) params.set("invoiceType", invoiceType);
    params.set("page", String(targetPage));
    params.set("pageSize", String(targetPageSize));

    return params;
  };

  const fetchAllFilteredRows = async () => {
    const firstRes = await api.get(
      `/FacturaEmitida?${buildInvoiceParams({
        targetPage: 1,
        targetPageSize: 100,
      }).toString()}`,
    );
    const firstRows = Array.isArray(firstRes.data?.data) ? firstRes.data.data : [];
    const pages = Math.max(1, Number(firstRes.data?.totalPages ?? 1));

    if (pages === 1) return firstRows;

    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        api.get(
          `/FacturaEmitida?${buildInvoiceParams({
            targetPage: index + 2,
            targetPageSize: 100,
          }).toString()}`,
        ),
      ),
    );

    return rest.reduce(
      (acc, res) => acc.concat(Array.isArray(res.data?.data) ? res.data.data : []),
      firstRows,
    );
  };

  const applyLocalSearch = (items) => {
    const search = searchFilter.trim().toLowerCase();

    if (!search) return items;

    return items.filter((row) =>
      Object.values(row)
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  };

  const printSalesBookPdf = async () => {
    try {
      const rowsToPrint = applyLocalSearch(await fetchAllFilteredRows());

      const totalBase = rowsToPrint.reduce(
        (sum, r) => sum + Number(r.baseAmount || 0),
        0,
      );
      const totalIva = rowsToPrint.reduce(
        (sum, r) => sum + Number(r.ivaAmount || 0),
        0,
      );
      const totalImporte = rowsToPrint.reduce(
        (sum, r) => sum + Number(r.totalAmount || 0),
        0,
      );

      const html = `
    <html>
      <head>
        <title>Libro de ventas</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { text-align: center; margin-bottom: 6px; }
          .periodo { text-align: center; margin-bottom: 24px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #333; padding: 6px; }
          th { background: #eee; }
          td.num { text-align: right; }
          tfoot td { font-weight: bold; background: #f3f3f3; }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        </style>
      </head>
      <body>
        <h1>Libro de ventas</h1>
        <div class="periodo">Desde: ${from || "-"} &nbsp; Hasta: ${to || "-"}</div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nº Factura</th>
              <th>Cliente</th>
              <th>NIF</th>
              <th>Origen</th>
              <th>Tipo</th>
              <th>Base imponible</th>
              <th>IVA</th>
              <th>Total importe</th>
            </tr>
          </thead>
          <tbody>
            ${rowsToPrint.map((r) => `
              <tr>
                <td>${r.date ? soloFecha(r.date) : ""}</td>
                <td>${r.invoiceNumber || ""}</td>
                <td>${r.customerName || ""}</td>
                <td>${r.nif || ""}</td>
                <td>${getOriginLabel(r)}</td>
                <td>${getTypeLabel(r)}</td>
                <td class="num">${Number(r.baseAmount || 0).toFixed(2)}</td>
                <td class="num">${Number(r.ivaAmount || 0).toFixed(2)}</td>
                <td class="num">${Number(r.totalAmount || 0).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6">TOTALES</td>
              <td class="num">${totalBase.toFixed(2)}</td>
              <td class="num">${totalIva.toFixed(2)}</td>
              <td class="num">${totalImporte.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;

      const win = window.open("", "_blank");
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } catch {
      setNotice({
        type: "error",
        text: "No se pudo preparar el libro de ventas para imprimir.",
      });
    }
  };
  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-2 mb-3 md:mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">
          Historial de facturas
        </h2>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>

      <Banner
        type={notice?.type}
        text={notice?.text}
        onClose={() => setNotice(null)}
      />

      <form
        className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p- mb-6"
        onSubmit={onSubmit}
      >
        <div className="grid grid-cols-1 md:grid-cols-6 items-end  justify-items-center">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {/* cambiar filtro a filtrar por cualquier cosa */}
          {/* <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                Nº Factura
            </label>

            <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}            
                placeholder="Cliente, factura, matrícula..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            </div> */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Factura, matrícula, cliente..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Origen
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="workshop">Taller</option>
              <option value="sparePart">Recambio</option>
              <option value="rapel">Rapel</option>
              <option value="noVat">Sin IVA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="normal">Normal</option>
              <option value="rectification">Rectificativa</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <Search size={18} /> {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 flex items-center gap-2">
            <CalendarDays size={16} /> Rápidos:
          </span>
          <button
            type="button"
            onClick={setToday}
            className="rounded-full px-3 py-1 text-sm bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={setThisMonth}
            className="rounded-full px-3 py-1 text-sm bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
          >
            Este mes
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
            <XCircle size={14} className="inline -mt-0.5" /> Limpiar
          </button>
        </div>
      </form>

      <section className="md:hidden space-y-3">
        {loading ? (
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4">
            <Loader />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 text-slate-500">
            Sin resultados
          </div>
        ) : (
          filteredRows.map((r) => (
            <article
              key={`${r.origin}-${r.id}`}
              className="rounded-2xl border border-slate-200 bg-white/70 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">
                    {r.date ? soloFecha(r.date) : "—"}

                    <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 bg-slate-50 text-slate-700 ring-slate-200">
                      {getOriginLabel(r)}
                    </span>

                    <span
                      className={`ml-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${
                        r.isRectification
                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      }`}
                    >
                      {getTypeLabel(r)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5">
                    Nº {r.invoiceNumber ?? "—"} · {r.customerName ?? "—"}
                  </div>

                  {r.originalInvoiceNumber && (
                    <div className="text-xs text-amber-700 mt-1">
                      Rectifica a: {r.originalInvoiceNumber}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <div className="font-semibold text-emerald-700">
                    {eur.format(amountOf(r.totalAmount))}
                  </div>
                  <div className="text-xs text-slate-500">
                    Base {eur.format(amountOf(r.baseAmount))} · IVA{" "}
                    {eur.format(amountOf(r.ivaAmount))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint(r)}
                  className="rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Ver
                </button>

                <button
                  type="button"
                  onClick={() => handlePrint(r)}
                  className="rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Imprimir
                </button>

                <button
                  type="button"
                  onClick={() => handleSendEmail(r)}
                  className="rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Email
                </button>

                {/* {!r.isRectification && (
                  <button
                    type="button"
                    onClick={() => handleCreateRectification(r)}
                    className="rounded-lg px-3 py-1.5 text-xs bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                  >
                    Rectificar
                  </button>
                )} */}
              </div>
            </article>
          ))
        )}
      </section>

      {!loading && total > 0 && <PaginationControls className="md:hidden mt-4" />}

      <section className="hidden md:block rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-6">
        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-500">
                Resultados:{" "}
                <span className="font-medium text-slate-700">
                  {total}
                </span>
              </div>

              <button
                type="button"
                onClick={printSalesBookPdf}
                className="rounded-xl px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 transition text-sm flex items-center gap-2"
              >
                Imprimir Ventas
              </button>

              <div className="text-sm font-medium text-slate-600">
                Total:{" "}
                <span className="text-slate-900">
                  {eur.format(totalGeneral)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="max-h-[560px] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                    <tr className="text-left text-slate-600">
                      <th className="py-2.5 px-3 font-semibold">Fecha</th>
                      <th className="py-2.5 px-3 font-semibold">Nº Factura</th>
                      <th className="py-2.5 px-3 font-semibold">Cliente</th>
                      <th className="py-2.5 px-3 font-semibold">Origen</th>
                      <th className="py-2.5 px-3 font-semibold">Tipo</th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        Base
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        IVA
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        Total
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td className="py-6 px-3 text-slate-500" colSpan={9}>
                          Sin resultados
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r) => (
                        <tr
                          key={`${r.origin}-${r.id}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                            {r.date ? soloFecha(r.date) : "—"}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-800">
                              {r.invoiceNumber ?? "—"}
                            </div>

                            {r.originalInvoiceNumber && (
                              <div className="text-xs text-amber-700">
                                Rectifica: {r.originalInvoiceNumber}
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-800">
                              {r.customerName ?? "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {r.nif ?? "—"}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 bg-slate-50 text-slate-700 ring-slate-200">
                              {getOriginLabel(r)}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${
                                r.isRectification
                                  ? "bg-amber-50 text-amber-700 ring-amber-200"
                                  : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              }`}
                            >
                              {getTypeLabel(r)}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                            {eur.format(amountOf(r.baseAmount))}
                          </td>

                          <td className="py-2.5 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                            {eur.format(amountOf(r.ivaAmount))}
                          </td>

                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                            {eur.format(amountOf(r.totalAmount))}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                title="Ver detalle"
                                onClick={() => handleView(r)}
                                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                title="Enviar email"
                                onClick={() => handleSendEmail(r)}
                                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                              >
                                <Mail size={16} />
                              </button>

                              {/* {!r.isRectification && (
                                <button
                                  type="button"
                                  title="Crear rectificativa"
                                  onClick={() => handleCreateRectification(r)}
                                  className="rounded-lg p-2 text-amber-700 hover:bg-amber-50"
                                >
                                  <FileWarning size={16} />
                                </button>
                              )} */}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  <tfoot className="bg-slate-50">
                    <tr>
                      <th
                        className="py-2.5 px-3 text-right font-semibold"
                        colSpan={5}
                      >
                        Total
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {eur.format(totalBase)}
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {eur.format(totalIva)}
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {eur.format(totalGeneral)}
                      </th>
                      <th />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {total > 0 && <PaginationControls className="mt-4" />}
          </>
        )}
      </section>
    </>
  );
}

