import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, CalendarDays, ChevronRight, RefreshCw, TrendingUp, WalletCards, Wrench } from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import api, { getCurrentWorkshopId } from "../Components/api";
import Loader from "../Components/Loader";
import { useAuth } from "../Components/AuthContext";
import { filterByDateRange, groupMonthly, monthKeys, numberOf, topCustomers } from "../utils/ownerAnalytics";
import { isLegacyOwnerAccount } from "../utils/ownerAccess";

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "short", year: "2-digit" });
const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const unwrap = (response) => response?.data?.data?.[0] ?? response?.data?.Data?.[0] ?? [];

function defaultRange() {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
  return { from: iso(start), to: iso(end) };
}

async function fetchInvoices(from, to) {
  const first = await api.get("/FacturaEmitida", { params: { fechaInicio: from, fechaFin: to, page: 1, pageSize: 100 } });
  const rows = Array.isArray(first.data?.data) ? first.data.data : [];
  const pages = Math.max(1, numberOf(first.data?.totalPages));
  if (pages === 1) return rows;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) =>
    api.get("/FacturaEmitida", { params: { fechaInicio: from, fechaFin: to, page: index + 2, pageSize: 100 } }),
  ));
  return rows.concat(rest.flatMap((response) => response.data?.data ?? []));
}

export default function OwnerAnalytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initial = useMemo(defaultRange, []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [appliedRange, setAppliedRange] = useState(initial);
  const [data, setData] = useState({ invoices: [], incomes: [], expenses: [], receivables: [], orders: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { from: appliedFrom, to: appliedTo } = appliedRange;
    setLoading(true);
    setError("");
    try {
      const mine = await api.get("/WorkshopSettings/mine");
      const activeId = String(getCurrentWorkshopId());
      const active = (Array.isArray(mine.data) ? mine.data : []).find((item) => String(item.id ?? item.Id) === activeId);
      const workshopRole = String(active?.workshopRole ?? active?.WorkshopRole ?? "").toLowerCase();
      const systemRole = String(user?.role ?? user?.Role ?? "").toLowerCase();
      if (workshopRole !== "owner" && systemRole !== "owner" && !isLegacyOwnerAccount(user)) {
        navigate("/", { replace: true });
        return;
      }

      const [invoices, incomesRes, expensesRes, cxcResult, repairing, finished, delivered] = await Promise.all([
        fetchInvoices(appliedFrom, appliedTo),
        api.get("/Ingreso/detalle", { params: { fechaInicio: appliedFrom, fechaFin: appliedTo } }),
        api.get("/Egreso/detalle", { params: { fechaInicio: appliedFrom, fechaFin: appliedTo } }),
        api.get("/FacturaEmitida/cxc").catch(() => ({ data: { data: [[]] } })),
        api.get("/OrdenTrabajo", { params: { estado: "Reparando", page: 1, pageSize: 1 } }),
        api.get("/OrdenTrabajo", { params: { estado: "Terminado", page: 1, pageSize: 1 } }),
        api.get("/OrdenTrabajo", { params: { estado: "Entregado", page: 1, pageSize: 1 } }),
      ]);
      setData({
        invoices,
        incomes: unwrap(incomesRes),
        expenses: unwrap(expensesRes),
        receivables: unwrap(cxcResult),
        orders: {
          repairing: numberOf(repairing.data?.data?.[0]?.total),
          finished: numberOf(finished.data?.data?.[0]?.total),
          delivered: numberOf(delivered.data?.data?.[0]?.total),
        },
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? "No se pudieron cargar los indicadores.");
    } finally {
      setLoading(false);
    }
  }, [appliedRange, navigate, user]);

  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => {
    const { from: appliedFrom, to: appliedTo } = appliedRange;
    const keys = monthKeys(appliedFrom, appliedTo);
    const invoices = filterByDateRange(data.invoices, appliedFrom, appliedTo, "date");
    const incomeRows = filterByDateRange(data.incomes, appliedFrom, appliedTo, "fecha");
    const expenseRows = filterByDateRange(data.expenses, appliedFrom, appliedTo, "fecha");
    const billing = groupMonthly(invoices, keys, "date", "totalAmount");
    const incomes = groupMonthly(incomeRows, keys, "fecha", "importe");
    const expenses = groupMonthly(expenseRows, keys, "fecha", "importe");
    const invoiceTotal = billing.reduce((sum, value) => sum + value, 0);
    const normalInvoices = invoices.filter((invoice) => !(invoice.isRectification ?? invoice.IsRectification) && numberOf(invoice.totalAmount ?? invoice.TotalAmount) > 0);
    return {
      keys,
      billing,
      incomes,
      expenses,
      invoiceTotal,
      cashResult: incomes.reduce((sum, value, index) => sum + value - expenses[index], 0),
      ticket: normalInvoices.length ? normalInvoices.reduce((sum, invoice) => sum + numberOf(invoice.totalAmount ?? invoice.TotalAmount), 0) / normalInvoices.length : 0,
      receivable: data.receivables.reduce((sum, item) => sum + numberOf(item.saldoPendiente ?? item.SaldoPendiente), 0),
      customers: topCustomers(invoices),
    };
  }, [appliedRange, data]);

  const labels = metrics.keys.map((key) => monthLabel.format(new Date(`${key}-01T00:00:00`)));
  const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } };

  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Visión del propietario</p><h1 className="mt-2 text-3xl font-black">Analytics del negocio</h1><p className="mt-1 text-sm text-slate-300">Facturación, caja, clientes y operación en una sola vista.</p></div>
          <Link to="/" className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20">Volver al inicio</Link>
        </div>
        <form onSubmit={(event) => {
          event.preventDefault();
          if (from === appliedRange.from && to === appliedRange.to) load();
          else setAppliedRange({ from, to });
        }} className="mt-5 flex flex-wrap items-end gap-3">
          <DateField label="Desde" value={from} onChange={setFrom} /><DateField label="Hasta" value={to} onChange={setTo} />
          <button type="submit" disabled={loading || from > to} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"><RefreshCw size={16} /> Actualizar</button>
        </form>
      </header>

      {error && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>}
      {loading ? <div className="rounded-2xl bg-white p-10"><Loader /></div> : <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Facturación neta" value={money.format(metrics.invoiceTotal)} icon={TrendingUp} tone="emerald" />
          <Metric title="Flujo registrado" value={money.format(metrics.cashResult)} icon={BarChart3} tone={metrics.cashResult >= 0 ? "sky" : "rose"} />
          <Metric title="Pendiente de cobro" value={money.format(metrics.receivable)} icon={WalletCards} tone="amber" />
          <Metric title="Ticket medio" value={money.format(metrics.ticket)} icon={CalendarDays} tone="violet" />
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <ChartCard title="Evolución de facturación" hint="Incluye rectificativas con signo negativo"><Line data={{ labels, datasets: [{ label: "Facturación", data: metrics.billing, borderColor: "#059669", backgroundColor: "rgba(16,185,129,.15)", fill: true, tension: .3 }] }} options={commonOptions} /></ChartCard>
          <ChartCard title="Ingresos y gastos registrados" hint="Comparativa de movimientos del periodo"><Bar data={{ labels, datasets: [{ label: "Ingresos", data: metrics.incomes, backgroundColor: "#10b981" }, { label: "Gastos", data: metrics.expenses, backgroundColor: "#f43f5e" }] }} options={commonOptions} /></ChartCard>
          <ChartCard title="Principales clientes" hint="Facturación neta por cliente"><Bar data={{ labels: metrics.customers.map((item) => item.name), datasets: [{ label: "Facturación", data: metrics.customers.map((item) => item.total), backgroundColor: "#6366f1" }] }} options={{ ...commonOptions, indexAxis: "y" }} /></ChartCard>
          <ChartCard title="Estado de órdenes" hint="Situación operativa actual"><Doughnut data={{ labels: ["Reparando", "Terminadas", "Entregadas"], datasets: [{ data: [data.orders.repairing, data.orders.finished, data.orders.delivered], backgroundColor: ["#f59e0b", "#10b981", "#64748b"] }] }} options={commonOptions} /></ChartCard>
        </section>

        <Link to="/statement" className="flex items-center justify-between rounded-2xl bg-white p-5 font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"><span className="flex items-center gap-3"><Wrench className="text-sky-600" /> Abrir detalle financiero y exportaciones</span><ChevronRight /></Link>
      </>}
    </div>
  );
}

function DateField({ label, value, onChange }) { return <label className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}<input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]" /></label>; }
function Metric({ title, value, icon: Icon, tone }) { const colors = { emerald: "text-emerald-700 bg-emerald-50", sky: "text-sky-700 bg-sky-50", rose: "text-rose-700 bg-rose-50", amber: "text-amber-700 bg-amber-50", violet: "text-violet-700 bg-violet-50" }; return <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className={`inline-flex rounded-xl p-2.5 ${colors[tone]}`}><Icon size={20} /></div><p className="mt-4 text-sm font-semibold text-slate-500">{title}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></article>; }
function ChartCard({ title, hint, children }) { return <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="font-bold text-slate-900">{title}</h2><p className="text-xs text-slate-500">{hint}</p><div className="mt-4 h-72">{children}</div></article>; }
