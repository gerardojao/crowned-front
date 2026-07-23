import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Users,
  Truck,
  Wallet,
  Wrench,
  HandCoins,
  ReceiptText,
  BarChart3,
  ArrowRight,
  FileText,
  LogIn,
  Sparkles,
} from "lucide-react";
import { currency } from "../utils/currency";
import { loadStatementSummary } from "../utils/statementStore";
import {
  appendAccountsReceivableSummary,
  fetchAccountsReceivableIncome,
  incomeTotalAmount,
} from "../utils/accountsReceivableIncome";
import api from "../Components/api";
import KPIs from "../Components/Kpi";
import { useAuth } from "../Components/AuthContext";
import { useBusinessTerminology } from "../utils/businessTerminology";
import { usesZagaInvoiceTemplate } from "../Components/ZagaInvoiceDocument";
import {
  getWorkOrderOperationTypeBadgeClass,
  getWorkOrderOperationTypeLabel,
} from "../utils/repairOrderPayload";

function soloFecha(value) {
  if (!value) return "";
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const pickDataList = (res) => {
  const pack = res?.data?.data ?? res?.data?.Data ?? [];
  if (Array.isArray(pack)) return Array.isArray(pack[0]) ? pack[0] : pack;
  return [];
};

const pickPagingTotal = (res) => {
  const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? {};
  return Number(pack.total ?? pack.Total ?? 0);
};

const moduleCard =
  "group rounded-2xl bg-white/85 backdrop-blur shadow-sm ring-1 ring-slate-200 p-5 transition hover:-translate-y-0.5 hover:shadow-md";

const moduleIcon =
  "flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm";

const actionLink =
  "inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200 transition";

const URL_MIGRATION_NOTICE_KEY = "zagapro-url-migration-notice-v1";
const URL_MIGRATION_NOTICE_REQUIRED_VIEWS = 2;

const getUrlMigrationNoticeStorageKey = (user) => {
  const userKey = user?.id ?? user?.Id ?? user?.email ?? "anonymous";
  return `${URL_MIGRATION_NOTICE_KEY}:${userKey}`;
};

const getUrlMigrationNoticeViewCount = (user) => {
  const value = Number(localStorage.getItem(getUrlMigrationNoticeStorageKey(user)) || 0);
  return Number.isFinite(value) ? value : 0;
};

const IVA_RATE = 0.21;
const sumRows = (rows) =>
  (Array.isArray(rows) ? rows : []).reduce(
    (sum, item) => sum + Number(item.total ?? item.Total ?? 0),
    0,
  );
const sumIncomeRowsWithIva = (rows) =>
  (Array.isArray(rows) ? rows : []).reduce((sum, item) => {
    const amount = Number(item.total ?? item.Total ?? 0);
    return sum + incomeTotalAmount(item, amount, IVA_RATE);
  }, 0);

const getEstadoBadge = (estado) => {
  switch (estado) {
    case "Recibido":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "Diagnóstico":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "Reparando":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "Esperando repuesto":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "Repuesto Recibido":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "Terminado":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Entregado":
      return "bg-slate-100 text-slate-700 ring-slate-300";
    case "Repuesto devuelto":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
};

export default function Home() {
  const { isAuthed, user } = useAuth();
  const labels = useBusinessTerminology();
  const [ordenes, setOrdenes] = useState([]);
  const [vehiculosEstado, setVehiculosEstado] = useState({
    reparando: 0,
    entregado: 0,
  });
  const [vehiculosReparacionLoading, setVehiculosReparacionLoading] =
    useState(true);
  const [saldoCuentasPorCobrar, setSaldoCuentasPorCobrar] = useState(0);
  const [facturacionDashboard, setFacturacionDashboard] = useState({
    todayTotal: 0,
    monthTotal: 0,
  });
  const [facturacionLoading, setFacturacionLoading] = useState(true);
  const [dashboardFeatures, setDashboardFeatures] = useState({
    enableDashboardRepairVehicles: false,
    enableDashboardBilling: false,
    enablePreOrders: false,
    enableAccountsReceivable: false,
    enableAccountsPayable: false,
    enableStockPayments: false,
    enableLedger: false,
  });
  const [dashboardTotals, setDashboardTotals] = useState({
    ingresos: 0,
    gastos: 0,
  });
  const [lastStatement, setLastStatement] = useState(null);
  const [useZagaDocuments, setUseZagaDocuments] = useState(false);
  const [showUrlMigrationNotice, setShowUrlMigrationNotice] = useState(false);
  const [urlMigrationModalOpen, setUrlMigrationModalOpen] = useState(false);

  const ts = (d) => (d ? new Date(d).getTime() : 0);

  useEffect(() => {
    if (!isAuthed) {
      setShowUrlMigrationNotice(false);
      setUrlMigrationModalOpen(false);
      return;
    }

    setShowUrlMigrationNotice(
      getUrlMigrationNoticeViewCount(user) < URL_MIGRATION_NOTICE_REQUIRED_VIEWS,
    );
    setUrlMigrationModalOpen(false);
  }, [isAuthed, user?.id, user?.Id, user?.email]);

  const openUrlMigrationModal = () => {
    setUrlMigrationModalOpen(true);
  };

  const acceptUrlMigrationNotice = () => {
    const nextViewCount = getUrlMigrationNoticeViewCount(user) + 1;
    localStorage.setItem(
      getUrlMigrationNoticeStorageKey(user),
      String(nextViewCount),
    );
    setUrlMigrationModalOpen(false);
    setShowUrlMigrationNotice(
      nextViewCount < URL_MIGRATION_NOTICE_REQUIRED_VIEWS,
    );
  };

  const ordenesSorted = useMemo(
    () =>
      [...ordenes].sort(
        (a, b) => ts(b.fecha) - ts(a.fecha) || (b.id ?? 0) - (a.id ?? 0),
      ),
    [ordenes],
  );

  useEffect(() => {
    if (!isAuthed) {
      setOrdenes([]);
      setVehiculosEstado({ reparando: 0, terminado: 0, entregado: 0 });
      setSaldoCuentasPorCobrar(0);
      setFacturacionDashboard({ todayTotal: 0, monthTotal: 0 });
      setVehiculosReparacionLoading(false);
      setFacturacionLoading(false);
      setDashboardFeatures({
        enableDashboardRepairVehicles: false,
        enableDashboardBilling: false,
        enablePreOrders: false,
        enableAccountsReceivable: false,
        enableAccountsPayable: false,
        enableLedger: false,
      });
      setDashboardTotals({ ingresos: 0, gastos: 0 });
      setLastStatement(null);
      setUseZagaDocuments(false);
      return;
    }

    (async () => {
      setVehiculosReparacionLoading(true);
      setFacturacionLoading(true);

      try {
        const [
          movRes,
          reparacionRes,
          terminadoRes,
          entregadosRes,
          settingsRes,
          ingresosRes,
          gastosRes,
        ] = await Promise.all([
          api.get("/OrdenTrabajo/ultimas", { params: { take: 10 } }),
          api.get("/OrdenTrabajo", {
            params: { estado: "Reparando", page: 1, pageSize: 1 },
          }),
          api.get("/OrdenTrabajo", {
            params: { estado: "Terminado", page: 1, pageSize: 1 },
          }),
          api.get("/OrdenTrabajo", {
            params: { estado: "Entregado", page: 1, pageSize: 1 },
          }),
          api.get("/WorkshopSettings"),
          api.get("/Ingreso/totales"),
          api.get("/Egreso/totales"),
        ]);

        const settings = settingsRes?.data || {};
        setUseZagaDocuments(usesZagaInvoiceTemplate(settings));
        const enableAccountsReceivable =
          settings.enableAccountsReceivable ??
          settings.EnableAccountsReceivable ??
          false;
        const enableDashboardBilling =
          settings.enableDashboardBilling ??
          settings.EnableDashboardBilling ??
          false;

        setOrdenes(pickDataList(movRes));
        setVehiculosEstado({
          reparando: pickPagingTotal(reparacionRes),
          terminado: pickPagingTotal(terminadoRes),
          entregado: pickPagingTotal(entregadosRes),
        });

        if (enableDashboardBilling) {
          const billingRes = await api.get("/FacturaEmitida/dashboard-summary");
          const billingData = billingRes?.data?.data ?? billingRes?.data?.Data ?? {};
          setFacturacionDashboard({
            todayTotal: Number(
              billingData.todayTotal ?? billingData.TodayTotal ?? 0,
            ),
            monthTotal: Number(
              billingData.monthTotal ?? billingData.MonthTotal ?? 0,
            ),
          });
        } else {
          setFacturacionDashboard({ todayTotal: 0, monthTotal: 0 });
        }

        const cxcIncome = await fetchAccountsReceivableIncome();
        const incomeRows = appendAccountsReceivableSummary(
          ingresosRes?.data?.data?.[0] || [],
          cxcIncome,
        );
        const totalIngresos = sumIncomeRowsWithIva(incomeRows);
        const totalGastos = sumRows(gastosRes?.data?.data?.[0] || []);
        setDashboardTotals({
          ingresos: totalIngresos,
          gastos: totalGastos,
        });
        if (enableAccountsReceivable) {
          const cxcRes = await api.get("/FacturaEmitida/cxc");
          setSaldoCuentasPorCobrar(
            pickDataList(cxcRes).reduce(
              (sum, item) =>
                sum + Number(item.saldoPendiente ?? item.SaldoPendiente ?? 0),
              0,
            ),
          );
        } else {
          setSaldoCuentasPorCobrar(0);
        }
        setDashboardFeatures({
          enableDashboardRepairVehicles:
            settings.enableDashboardRepairVehicles ??
            settings.EnableDashboardRepairVehicles ??
            false,
          enableDashboardBilling,
          enablePreOrders:
            settings.enablePreOrders ??
            settings.EnablePreOrders ??
            true,
          enableAccountsReceivable,
          enableAccountsPayable:
            settings.enableAccountsPayable ??
            settings.EnableAccountsPayable ??
            false,
          enableStockPayments:
            settings.enableStockPayments ??
            settings.EnableStockPayments ??
            false,
          enableLedger:
            settings.enableLedger ??
            settings.EnableLedger ??
            false,
        });
      } catch (err) {
        console.error(err);

        setOrdenes([]);
        setVehiculosEstado({ reparando: 0, terminado: 0, entregado: 0 });
        setSaldoCuentasPorCobrar(0);
        setFacturacionDashboard({ todayTotal: 0, monthTotal: 0 });
        setDashboardTotals({ ingresos: 0, gastos: 0 });
      } finally {
        setVehiculosReparacionLoading(false);
        setFacturacionLoading(false);
        setLastStatement(loadStatementSummary());
      }
    })();
  }, [isAuthed]);

  if (!isAuthed) {
    return null;
  }

  const showDashboardModules =
    dashboardFeatures.enableDashboardRepairVehicles ||
    dashboardFeatures.enableDashboardBilling ||
    dashboardFeatures.enableAccountsReceivable;
  const preOrdersEnabled = useZagaDocuments && dashboardFeatures.enablePreOrders;
  const stockAccessLabel = dashboardFeatures.enableAccountsPayable
    ? labels.stockTitle
    : "Repuestos facturados";

  return (
    <>
      {showUrlMigrationNotice && (
        <section className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm ring-1 ring-orange-100 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              
              <div>
                <p className="text-lg font-black uppercase tracking-[0.14em] text-orange-700">
                  Nueva actualización
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950">
                  Próximo cambio de url del sistema
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Tenemos una comunicación importante sobre el acceso a ZagaPro.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openUrlMigrationModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
            >
              Ver
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {urlMigrationModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="url-migration-title"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
          >
            <div className="flex items-start gap-4">
  
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-700">
                  Nueva actualización
                </p>
                <h2
                  id="url-migration-title"
                  className="mt-1 text-2xl font-extrabold text-slate-950"
                >
                  Nueva URL de acceso
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Próximamente la URL del sistema será app.zagapro.es. No tienes que hacer nada ni cambiar tu forma de entrar: sigue accediendo como siempre y el propio sistema te redirigirá automáticamente cuando llegue el momento.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={acceptUrlMigrationNotice}
                className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
              >
                Aceptar
              </button>
            </div>
          </section>
        </div>
      )}

      <KPIs totalsOverride={dashboardTotals} />

      {showDashboardModules && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboardFeatures.enableDashboardRepairVehicles && (
            <Link
              to="/register-work-order#ordenes-recientes"
              className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-50">
                  <Wrench size={46} className="text-amber-700" />
                </div>

                <div>
                  <p className="text-xl text-left font-semibold text-slate-900">
                    Vehículos por estado
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
                      <p className="text-xs font-semibold text-amber-700">
                        Reparando
                      </p>
                      <p className="mt-1 text-3xl font-extrabold text-amber-700">
                        {vehiculosReparacionLoading
                          ? "..."
                          : vehiculosEstado.reparando}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
                      <p className="text-xs font-semibold text-emerald-700">
                        Terminado
                      </p>
                      <p className="mt-1 text-3xl font-extrabold text-emerald-700">
                        {vehiculosReparacionLoading
                          ? "..."
                          : vehiculosEstado.terminado}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                      <p className="text-xs font-semibold text-slate-600">
                        Entregado
                      </p>
                      <p className="mt-1 text-3xl font-extrabold text-slate-700">
                        {vehiculosReparacionLoading
                          ? "..."
                          : vehiculosEstado.entregado}
                      </p>
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Órdenes en reparación, terminadas y entregadas
                  </p>
                </div>
              </div>
            </Link>
          )}

          {dashboardFeatures.enableDashboardBilling && (
            <Link
              to="/invoices-history"
              className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-50">
                  <ReceiptText size={46} className="text-violet-700" />
                </div>

                <div>
                  <p className="text-xl text-left font-semibold text-slate-900">
                    Facturación
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-violet-50 px-3 py-2 ring-1 ring-violet-100">
                      <p className="text-xs font-semibold text-violet-700">
                        Hoy
                      </p>
                      <p className="mt-1 text-xl font-extrabold text-violet-700">
                        {facturacionLoading
                          ? "..."
                          : currency(facturacionDashboard.todayTotal)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                      <p className="text-xs font-semibold text-slate-600">
                        Mes
                      </p>
                      <p className="mt-1 text-xl font-extrabold text-slate-700">
                        {facturacionLoading
                          ? "..."
                          : currency(facturacionDashboard.monthTotal)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Total facturado del día y del mes
                  </p>
                </div>
              </div>
            </Link>
          )}

          {dashboardFeatures.enableAccountsReceivable && (
            <Link
              to="/accounts-receivable"
              className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-50">
                  <HandCoins size={46} className="text-sky-700" />
                </div>

                <div>
                  <p className="text-xl text-left font-semibold text-slate-900">
                    Facturas por cobrar
                  </p>

                  <div className="mt-2 text-3xl font-extrabold text-sky-700">
                    {currency(saldoCuentasPorCobrar)}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Importe pendiente de cobro
                  </p>
                </div>
              </div>
            </Link>
          )}

        </section>
      )}

      <section className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-5 md:p-6">
        <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {labels.managementTitle}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {labels.managementSubtitle}
              </p>
            </div>

            <Link
              to={preOrdersEnabled ? "/pre-ordenes" : "/register-work-order"}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-orange-600 text-white hover:bg-orange-700 transition shadow-sm font-semibold"
            >
              {preOrdersEnabled ? "Nueva pre-orden" : "Nueva orden"}
              <ArrowRight size={17} />
            </Link>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <article data-tour="home-orders" className={moduleCard}>
              <div className="flex items-start gap-4">
                <span className={`${moduleIcon} bg-orange-600`}>
                  <ClipboardList size={26} />
                </span>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Órdenes de trabajo
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Crea órdenes, registra trabajos y controla su estado.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {preOrdersEnabled && (
                      <Link to="/pre-ordenes" className={actionLink}>
                        Nueva pre-orden <ArrowRight size={15} />
                      </Link>
                    )}
                    {!preOrdersEnabled && (
                      <Link to="/register-work-order" className={actionLink}>
                      Nueva orden <ArrowRight size={15} />
                     </Link>
                    )}
                    
                    <Link
                      to="/register-work-order#ordenes-recientes"
                      className={actionLink}
                    >
                      Ver órdenes <ArrowRight size={15} />
                    </Link>
                    <Link to="/presupuestos" className={actionLink}>
                      Presupuestos <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            <article data-tour="home-customers" className={moduleCard}>
              <div className="flex items-start gap-4">
                <span className={`${moduleIcon} bg-emerald-600`}>
                  <Users size={26} />
                </span>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Clientes
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Registra clientes con matrícula, modelo y todos sus datos.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link to="/register-customer" className={actionLink}>
                      Registrar cliente <ArrowRight size={15} />
                    </Link>
                    <Link to="/register-customer" className={actionLink}>
                      Buscar cliente <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            <article data-tour="home-suppliers" className={moduleCard}>
              <div className="flex items-start gap-4">
                <span className={`${moduleIcon} bg-teal-700`}>
                  <Truck size={26} />
                </span>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Proveedores
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Administra proveedores de materiales, servicios y suministros.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link to="/register-supplier" className={actionLink}>
                      Registrar proveedor <ArrowRight size={15} />
                    </Link>
                    <Link to="/register-supplier" className={actionLink}>
                      Ver proveedores <ArrowRight size={15} />
                    </Link>
                    <Link to="/stock-parts" className={actionLink}>
                      {stockAccessLabel} <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            <article data-tour="home-balance" className={moduleCard}>
              <div className="flex items-start gap-4">
                <span className={`${moduleIcon} bg-sky-600`}>
                  <Wallet size={26} />
                </span>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Finanzas
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Controla ingresos, gastos y balance general del negocio.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link to="/register-income-type" className={actionLink}>
                      Registrar tipo de ingreso <ArrowRight size={15} />
                    </Link>

                    <Link to="/register-expense-type" className={actionLink}>
                      Registrar tipo de gasto <ArrowRight size={15} />
                    </Link>
                    {dashboardFeatures.enableAccountsReceivable && (
                      <Link to="/accounts-receivable" className={actionLink}>
                        Facturas por cobrar <ArrowRight size={15} />
                      </Link>
                    )}
                    {dashboardFeatures.enableStockPayments && (
                      <Link to="/purchases" className={actionLink}>
                        Modulo Compras <ArrowRight size={15} />
                      </Link>
                    )}
                    {dashboardFeatures.enableLedger && (
                      <Link to="/ledger" className={actionLink}>
                        Estado de cuentas <ArrowRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900">
              Órdenes recientes
            </h3>
            <p className="text-sm text-slate-500">
              Últimas órdenes registradas.
            </p>
          </div>

          <Link
            to="/register-work-order#ordenes-recientes"
            className="hidden sm:inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Ver todo
          </Link>
        </div>

        <div className="md:hidden space-y-3">
          {ordenes.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white/60 px-3 py-4 text-sm text-slate-500">
              No hay órdenes registradas.
            </div>
          )}

          {ordenesSorted.map((o) => {
            const id = o.id ?? o.Id;
            const fecha = o.fecha ?? o.Fecha;
            const estado = o.estado ?? o.Estado;
            const cliente = o.cliente ?? o.Cliente;
            const matricula = o.matricula ?? o.Matricula;
            const operationType = getWorkOrderOperationTypeLabel(o);

            return (
              <article
                key={id}
                className="rounded-xl border border-slate-200 bg-white/75 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {matricula ?? "Sin referencia"}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-700">
                      {cliente ?? "Sin cliente"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {soloFecha(fecha)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ${getEstadoBadge(estado)}`}
                    >
                      {estado}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${getWorkOrderOperationTypeBadgeClass(o)}`}
                    >
                      {operationType}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    to="/register-work-order#ordenes-recientes"
                    className="inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700"
                  >
                    Ir a orden
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="text-left text-slate-600">
                  <th className="py-2.5 px-3 font-bold w-[140px] text-center">
                    Fecha
                  </th>
                  <th className="py-2.5 px-3 font-bold w-[160px] text-center">
                    Estado
                  </th>
                  <th className="py-2.5 px-3 font-bold w-[150px] text-center">
                    Tipo
                  </th>
                  <th className="py-2.5 px-3 text-center font-bold">Cliente</th>
                  <th className="py-2.5 px-3 font-bold w-[140px] text-center">
                    {labels.referenceLabel}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-center w-[140px]"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {ordenes.length === 0 && (
                  <tr>
                    <td className="py-4 px-3 text-slate-500" colSpan={6}>
                      No hay órdenes aún.
                    </td>
                  </tr>
                )}

                {ordenesSorted.map((o) => {
                  const id = o.id ?? o.Id;
                  const fecha = o.fecha ?? o.Fecha;
                  const estado = o.estado ?? o.Estado;
                  const cliente = o.cliente ?? o.Cliente;
                  const matricula = o.matricula ?? o.Matricula;
                  const operationType = getWorkOrderOperationTypeLabel(o);

                  return (
                    <tr key={id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {soloFecha(fecha)}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${getEstadoBadge(estado)}`}
                        >
                          {estado}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${getWorkOrderOperationTypeBadgeClass(o)}`}
                        >
                          {operationType}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 truncate">
                        {cliente ?? "-"}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {matricula ?? "-"}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to="/register-work-order#ordenes-recientes"
                          className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700"
                        >
                          Ir a orden
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <Link
            to="/statement"
            className="inline-flex w-full justify-center items-center rounded-lg px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Ver todo
          </Link>
        </div>
      </section>
    </>
  );
}


