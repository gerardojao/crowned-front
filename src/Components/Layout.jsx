import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
  matchPath,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import {
  Menu,
  X,
  LogOut,
  LogIn,
  ClipboardList,
  Users,
  FileText,
  BarChart3,
  Truck,
  ArrowRight,
  Bell,
  WalletCards,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import api, {
  getCurrentWorkshopId,
  resolveApiAssetUrl,
  setCurrentWorkshopId,
} from "./api";
import TrialBanner from "./TrialBanner";
import zagaProLogo from "../assets/logozagapro.png";
import ClientAlertModal from "./ClienteAlertModal";
import { getBusinessTerminology } from "../utils/businessTerminology";
import { usesZagaInvoiceTemplate } from "./ZagaInvoiceDocument";
import { sendSupportRequest } from "./supportRequest";

const ProductTour = lazy(() => import("./ProductTour"));

const heroBtnBase =
  "group flex min-w-[240px] items-center justify-between gap-4 rounded-2xl px-5 py-5 text-white shadow-md transition hover:scale-[1.01]";

const heroBtnIcon =
  "flex h-12 w-12 items-center justify-center rounded-xl bg-white/20";

const mobileLink =
  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 ring-1 ring-transparent transition hover:bg-white hover:text-slate-950 hover:shadow-sm hover:ring-slate-200";
const mobileLinkText = "flex min-w-0 flex-col";
const mobileLinkTitle = "truncate";
const mobileLinkHint = "text-xs font-medium text-slate-500";
const DEMO_SITE_URL = "https://demo.zagapro.store";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthed, user, logout } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [activeWorkshopId, setActiveWorkshopId] = useState(
    getCurrentWorkshopId(),
  );
  const [alertCount, setAlertCount] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpForm, setHelpForm] = useState({
    name: "",
    business: "",
    email: "",
    type: "",
    message: "",
  });
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [helpStatus, setHelpStatus] = useState(null);

  const isAuthRoute = /^\/(login|register)(\/|$)/.test(location.pathname);
  const isPrintRoute = /^\/print-(pre-)?order\/.+/.test(location.pathname);

  const compactRoutes = [
    "/pre-ordenes",
    "/register-work-order",
    "/register-customer",
    "/print-order/:id",
    "/print-pre-order/:id",
    "/print-budget/:id",
    "/workshop-invoice/:id",
    "/workshop-invoice",
    "/special-invoices/parts",
    "/special-invoices/:type",
    "/reprint-invoice/order/:idOrden",
    "/reprint-invoice/number/:numeroFactura",
    "/presupuestos",
    "/stock-parts",
    "/purchases",
    "/statement",
    "/accounts-receivable",
    "/ledger",
    "/invoices-history",
    "/register-expense"
  ];

  const isCompactRoute = compactRoutes.some((pattern) =>
    matchPath({ path: pattern, end: true }, location.pathname),
  );

  const onLogout = () => {
    logout();
    setCurrentWorkshopId("");
    setOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    if (!isAuthed) {
      setWorkshops([]);
      setActiveWorkshopId("");
      return;
    }

    let alive = true;
    api
      .get("/WorkshopSettings/mine")
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setWorkshops(list);

        const stored = getCurrentWorkshopId();
        const exists = list.some(
          (x) => String(x.id ?? x.Id) === String(stored),
        );
        const nextId = exists
          ? stored
          : String(list[0]?.id ?? list[0]?.Id ?? "");

        if (nextId && nextId !== stored) {
          setCurrentWorkshopId(nextId);
        }
        setActiveWorkshopId(nextId);
      })
      .catch(() => {
        if (alive) setWorkshops([]);
      });

    return () => {
      alive = false;
    };
  }, [isAuthed]);

  useEffect(() => {
    const onWorkshopChanged = () => setActiveWorkshopId(getCurrentWorkshopId());
    window.addEventListener("tc:workshop-changed", onWorkshopChanged);
    return () =>
      window.removeEventListener("tc:workshop-changed", onWorkshopChanged);
  }, []);

  useEffect(() => {
    const onClientAlerts = (ev) => {
      setAlertCount(Number(ev?.detail?.count || 0));
    };
    window.addEventListener("tc:client-alerts", onClientAlerts);
    return () => window.removeEventListener("tc:client-alerts", onClientAlerts);
  }, []);

  const onWorkshopChange = (ev) => {
    const nextId = ev.target.value;
    setCurrentWorkshopId(nextId);
    setActiveWorkshopId(nextId);
    window.location.reload();
  };

  const activeWorkshop = workshops.find(
    (x) => String(x.id ?? x.Id) === String(activeWorkshopId),
  );
  const activeWorkshopLogo =
    activeWorkshop?.logoUrl ?? activeWorkshop?.LogoUrl ?? "";
  const navbarLogo =
    isAuthed && activeWorkshopLogo
      ? resolveApiAssetUrl(activeWorkshopLogo)
      : zagaProLogo;
  const navbarLogoAlt = isAuthed
    ? `${activeWorkshop?.nombre ?? activeWorkshop?.Nombre ?? "Negocio"}`
    : "ZagaPro - Gestion inteligente de negocios";
  const labels = getBusinessTerminology(activeWorkshop);
  const useZagaDocuments = usesZagaInvoiceTemplate(activeWorkshop);
  const preOrdersEnabled =
    useZagaDocuments &&
    (activeWorkshop?.enablePreOrders ??
      activeWorkshop?.EnablePreOrders ??
      true);
  const isSuperAdmin = (user?.role || "").toLowerCase() === "superadmin";
  const accountsReceivableEnabled =
    activeWorkshop?.enableAccountsReceivable ??
    activeWorkshop?.EnableAccountsReceivable ??
    false;
  const ledgerEnabled =
    activeWorkshop?.enableLedger ?? activeWorkshop?.EnableLedger ?? false;
  const specialInvoicesEnabled =
    activeWorkshop?.enableSpecialInvoices ??
    activeWorkshop?.EnableSpecialInvoices ??
    true;
  const rapelInvoicesEnabled =
    activeWorkshop?.enableRapelInvoices ??
    activeWorkshop?.EnableRapelInvoices ??
    false;
  const noVatInvoicesEnabled =
    activeWorkshop?.enableNoVatInvoices ??
    activeWorkshop?.EnableNoVatInvoices ??
    false;
  const stockModuleEnabled =
    activeWorkshop?.enableAccountsPayable ??
    activeWorkshop?.EnableAccountsPayable ??
    false;
  const purchasesEnabled =
    activeWorkshop?.enableStockPayments ??
    activeWorkshop?.EnableStockPayments ??
    false;
  const stockAccessLabel = stockModuleEnabled
    ? labels.stockTitle
    : "Repuestos facturados";
  const openClientAlerts = () => {
    window.dispatchEvent(new Event("tc:client-alerts:open"));
  };

  const setHelpField = (field) => (event) => {
    setHelpForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const closeHelp = () => {
    setHelpOpen(false);
    setHelpStatus(null);
  };

  const submitHelp = async (event) => {
    event.preventDefault();
    setHelpSubmitting(true);
    setHelpStatus(null);

    try {
      await sendSupportRequest({
        ...helpForm,
        source: "Modal publico del front",
      });
      setHelpStatus({
        type: "success",
        message: `${helpForm.name}, tu correo ha sido enviado a ZagaPro. A la brevedad sera atendida tu consulta.`,
      });
      setHelpForm({
        name: "",
        business: "",
        email: "",
        type: "",
        message: "",
      });
    } catch (error) {
      setHelpStatus({
        type: "error",
        message: error?.message || "No se pudo enviar la solicitud.",
      });
    } finally {
      setHelpSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-cyan-50 via-white to-amber-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto w-full max-w-screen-2xl px-4 pr-5 sm:px-6 lg:px-8 py-3 flex items-center">
          <Link
            to="/"
            data-tour="main-logo"
            className="font-extrabold tracking-tight text-slate-900 text-lg sm:text-xl"
          >
            <img
              src={navbarLogo}
              alt={navbarLogoAlt}
              className="h-20 w-auto max-w-[220px] rounded-2xl bg-white object-contain p-2 shadow-sm ring-1 ring-slate-200 sm:h-24 sm:max-w-[280px]"
            />
          </Link>

          {!isAuthRoute && (
            <div className="ml-auto flex items-center gap-2">
              <nav className="hidden md:flex items-center gap-3">
                {isAuthed ? (
                  <>
                    <span className="text-sm text-slate-700">
                      {user?.email}
                    </span>
                    <button
                      type="button"
                      onClick={openClientAlerts}
                      data-tour="client-alerts"
                      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      aria-label={`Alertas pendientes: ${alertCount}`}
                      title={`Alertas pendientes: ${alertCount}`}
                    >
                      <Bell size={18} />
                      {alertCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                          {alertCount > 99 ? "99+" : alertCount}
                        </span>
                      )}
                    </button>
                    {workshops.length > 1 && (
                      <select
                        value={activeWorkshopId}
                        onChange={onWorkshopChange}
                        data-tour="workshop-switcher"
                        className="max-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                        aria-label="Taller activo"
                      >
                        {workshops.map((workshop) => (
                          <option
                            key={workshop.id ?? workshop.Id}
                            value={workshop.id ?? workshop.Id}
                          >
                            {workshop.nombre ?? workshop.Nombre}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={onLogout}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
                    >
                      <LogOut size={16} />
                      Salir
                    </button>
                    {isSuperAdmin && (
                      <NavLink
                        to="/admin/workshops"
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
                      >
                        Talleres
                      </NavLink>
                    )}
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-orange-600 text-white hover:bg-orange-700"
                    >
                      <LogIn size={16} />
                      Iniciar sesión
                    </NavLink>
                  </>
                )}
              </nav>

              <button
                data-tour="main-menu"
                className="mr-1 inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:mr-0"
                aria-label="Abrir menú"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          )}
        </div>

        {!isAuthRoute && open && (
          <div className="border-t border-slate-200 bg-slate-50/95 shadow-lg shadow-slate-900/5">
            <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-2">
                {isAuthed ? (
                  <>
                    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Sesión
                      </div>
                      <div className="mt-1 break-all text-sm font-medium text-slate-700">
                        {user?.email}
                      </div>
                      {workshops.length > 1 && (
                        <label className="mt-3 block">
                          <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">
                            Negocio activo
                          </span>
                          <select
                            value={activeWorkshopId}
                            onChange={onWorkshopChange}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800"
                            aria-label="Negocio activo"
                          >
                            {workshops.map((workshop) => (
                              <option
                                key={workshop.id ?? workshop.Id}
                                value={workshop.id ?? workshop.Id}
                              >
                                {workshop.nombre ?? workshop.Nombre}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {/* <NavLink
                        to="/register-work-order"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        <ClipboardList size={18} className="text-orange-600" />
                        Nueva orden
                      </NavLink> */}
                      {!preOrdersEnabled ? (
                        <NavLink
                          to="/register-work-order"
                          data-tour="menu-order"
                          className={mobileLink}
                          onClick={() => setOpen(false)}
                        >
                          <ClipboardList
                            size={18}
                            className="text-orange-600"
                          />
                          Nueva orden
                        </NavLink>
                      ) : (
                        <NavLink
                          to="/pre-ordenes"
                          data-tour="menu-order"
                          className={mobileLink}
                          onClick={() => setOpen(false)}
                        >
                          <Truck size={18} className="text-emerald-600" />
                          Pre-órdenes
                        </NavLink>
                      )}
                      <NavLink
                        to="/register-customer"
                        data-tour="menu-customers"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        <Users size={18} className="text-sky-600" />
                        Registrar cliente
                      </NavLink>
                      <NavLink
                        to="/register-supplier"
                        data-tour="menu-suppliers"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        <Truck size={18} className="text-violet-600" />
                        Registrar proveedor
                      </NavLink>
                      <NavLink
                        to="/register-income"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        <BarChart3 size={18} className="text-emerald-600" />
                        Registrar ingreso
                      </NavLink>
                      {accountsReceivableEnabled && (
                        <NavLink
                          to="/accounts-receivable"
                          className={`${mobileLink} bg-cyan-50 ring-cyan-100`}
                          onClick={() => setOpen(false)}
                        >
                          <WalletCards
                            size={18}
                            className="shrink-0 text-cyan-700"
                          />
                          <span className={mobileLinkText}>
                            <span className={mobileLinkTitle}>
                              Facturas por cobrar
                            </span>
                            <span className={mobileLinkHint}>
                              Pendientes y abonos
                            </span>
                          </span>
                        </NavLink>
                      )}
                      {purchasesEnabled && (
                        <NavLink
                          to="/purchases"
                          className={`${mobileLink} bg-amber-50 ring-amber-100`}
                          onClick={() => setOpen(false)}
                        >
                          <ShoppingCart
                            size={18}
                            className="shrink-0 text-amber-700"
                          />
                          <span className={mobileLinkText}>
                            <span className={mobileLinkTitle}>Compras</span>
                            <span className={mobileLinkHint}>
                              Facturas recibidas, albaranes y gastos.
                            </span>
                          </span>
                        </NavLink>
                      )}
                      <NavLink
                        to="/register-expense"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        <BarChart3 size={18} className="text-rose-600" />
                        Registrar gasto
                      </NavLink>
                      <NavLink
                        to="/statement"
                        data-tour="menu-balance"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        <FileText size={18} className="text-slate-600" />
                        Ver Balance
                      </NavLink>
                      {ledgerEnabled && (
                        <NavLink
                          to="/ledger"
                          className={mobileLink}
                          onClick={() => setOpen(false)}
                        >
                          <FileText size={18} className="text-indigo-600" />
                          Mayor
                        </NavLink>
                      )}
                      <Link
                        to="/invoices-history"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        <FileText size={18} className="text-orange-600" />
                        Listado de facturas
                      </Link>
                      {specialInvoicesEnabled && (
                        <Link
                          to="/special-invoices/parts"
                          className={mobileLink}
                          onClick={() => setOpen(false)}
                        >
                          <ClipboardList size={18} className="text-teal-600" />
                          Facturas de recambio
                        </Link>
                      )}
                      {rapelInvoicesEnabled && (
                        <Link
                          to="/special-invoices/rapel"
                          className={mobileLink}
                          onClick={() => setOpen(false)}
                        >
                          <ClipboardList size={18} className="text-amber-600" />
                          Facturas Rapel
                        </Link>
                      )}
                      {noVatInvoicesEnabled && (
                        <Link
                          to="/special-invoices/no-vat"
                          className={mobileLink}
                          onClick={() => setOpen(false)}
                        >
                          <ClipboardList size={18} className="text-slate-600" />
                          Facturas sin IVA
                        </Link>
                      )}
                      {isSuperAdmin && (
                        <NavLink
                          to="/admin/workshops"
                          className={mobileLink}
                          onClick={() => setOpen(false)}
                        >
                          <Users size={18} className="text-slate-700" />
                          Administrar negocios
                        </NavLink>
                      )}
                    </div>
                    <button
                      type="button"
                      data-tour="menu-alerts"
                      onClick={() => {
                        openClientAlerts();
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl bg-orange-50 px-3 py-3 text-left text-sm font-bold text-orange-800 ring-1 ring-orange-100 transition hover:bg-orange-100"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Bell size={16} />
                        Alertas clientes
                        {alertCount > 0 && (
                          <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs font-black text-white">
                            {alertCount > 99 ? "99+" : alertCount}
                          </span>
                        )}
                      </span>
                    </button>

                    <button
                      onClick={onLogout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LogOut size={16} />
                        Salir
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      className={mobileLink}
                      onClick={() => setOpen(false)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <LogIn size={16} />
                        Iniciar sesión
                      </span>
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {!isAuthRoute && !isCompactRoute && (
        <div
          className={`relative mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 ${
            isAuthed
              ? "pt-6 md:pt-8 pb-4 md:pb-6"
              : "pt-10 md:pt-14 pb-2 md:pb-3"
          }`}
        >
          <div className="relative overflow-hidden rounded-3xl bg-white/70 p-5 md:p-7 ring-1 ring-slate-200 shadow-sm">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-20 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />

            <div className="relative">
              {!isPrintRoute && (
                <div className="text-center">
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                    {isAuthed ? (
                      <>
                        <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                          {activeWorkshop?.nombre ??
                            activeWorkshop?.Nombre ??
                            "Tu taller"}
                        </span>
                      </>
                    ) : (
                      <>
                        <img
                          src={zagaProLogo}
                          alt="ZagaPro"
                          className="mx-auto h-32 w-auto max-w-full rounded-2xl bg-white object-contain p-3 shadow-sm ring-1 ring-slate-200 md:h-40"
                        />
                      </>
                    )}
                  </h1>

                  <p className="mx-auto mt-4 max-w-2xl text-slate-600 text-sm md:text-lg font-medium leading-7">
                    {isAuthed
                      ? `Gestion inteligente para ${labels.businessPlural}.`
                      : "Gestiona clientes, documentos, facturación y operaciones desde una plataforma clara, segura y preparada para tu negocio."}
                  </p>

                  {!isAuthed && (
                    <>
                      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-center shadow-sm">
                        <p className="text-sm font-black text-slate-950">
                          ¿Todavía no usas ZagaPro-qa?
                        </p>
                        <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-slate-600">
                          Solicita una demo gratuita de 15 minutos y descubre
                          cómo recuperar tiempo en la gestión de tu taller desde
                          una sola plataforma.
                        </p>
                        <a
                          href={DEMO_SITE_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          Solicitar demo gratuita
                          <ArrowRight size={16} />
                        </a>
                      </div>

                      <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-bold text-slate-700">
                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                          Clientes
                        </span>
                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                          Documentos
                        </span>
                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                          Facturacion
                        </span>
                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                          Seguimiento
                        </span>
                      </div>

                      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                          to="/login"
                          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
                        >
                          <LogIn size={18} />
                          Iniciar sesion
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setHelpOpen(true);
                            setHelpStatus(null);
                          }}
                          className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                          Necesito ayuda
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div
                className={
                  isAuthed
                    ? "mt-7 hidden md:grid grid-cols-1 lg:grid-cols-4 gap-5"
                    : "hidden"
                }
              >
                {isAuthed ? (
                  <>
                    {!preOrdersEnabled ? (
                      <Link
                        to="/register-work-order"
                        data-tour="quick-order"
                        className={`${heroBtnBase} bg-orange-600 hover:bg-orange-700`}
                      >
                        <span className={heroBtnIcon}>
                          <ClipboardList size={26} />
                        </span>

                        <span className="flex-1">
                          <span className="block text-base font-bold">
                            Nueva Orden
                          </span>

                          <span className="block text-xs text-white/90">
                            Crear orden de trabajo
                          </span>
                        </span>

                        <span className="text-xl opacity-80">›</span>
                      </Link>
                    ) : (
                      <Link
                        to="/pre-ordenes"
                        data-tour="quick-order"
                        className={`${heroBtnBase} bg-orange-600 hover:bg-orange-700`}
                      >
                        <span className={heroBtnIcon}>
                          <ClipboardList size={26} />
                        </span>

                        <span className="flex-1">
                          <span className="block text-base font-bold">
                            Nueva Pre-orden
                          </span>

                          <span className="block text-xs text-white/90">
                            Crear nueva pre-orden de trabajo
                          </span>
                        </span>

                        <span className="text-xl opacity-80">›</span>
                      </Link>
                    )}

                    <Link
                      to="/register-customer"
                      data-tour="quick-customers"
                      className={`${heroBtnBase} bg-emerald-600 hover:bg-emerald-700`}
                    >
                      <span className={heroBtnIcon}>
                        <Users size={26} />
                      </span>

                      <span className="flex-1">
                        <span className="block text-base font-bold">
                          Clientes
                        </span>

                        <span className="block text-xs text-white/90">
                          Registrar y buscar
                        </span>
                      </span>

                      <span className="text-xl opacity-80">›</span>
                    </Link>

                    <Link
                      to="/stock-parts"
                      data-tour="quick-suppliers"
                      className={`${heroBtnBase} bg-slate-700 hover:bg-slate-800`}
                    >
                      <span className={heroBtnIcon}>
                        <Truck size={26} />
                      </span>

                      <span className="flex-1">
                        <span className="block text-base font-bold">
                          Proveedores
                        </span>

                        <span className="block text-xs text-white/90">
                          {stockAccessLabel}
                        </span>
                      </span>

                      <span className="text-xl opacity-80">›</span>
                    </Link>

                    <Link
                      to="/statement"
                      data-tour="quick-balance"
                      className={`${heroBtnBase} bg-sky-600 hover:bg-sky-700`}
                    >
                      <span className={heroBtnIcon}>
                        <BarChart3 size={26} />
                      </span>

                      <span className="flex-1">
                        <span className="block text-base font-bold">
                          Balance
                        </span>

                        <span className="block text-xs text-white/90">
                          Finanzas y reportes
                        </span>
                      </span>

                      <span className="text-xl opacity-80">›</span>
                    </Link>
                    {false && ledgerEnabled && (
                      <Link
                        to="/ledger"
                        className={`${heroBtnBase} bg-indigo-700 hover:bg-indigo-800`}
                      >
                        <span className={heroBtnIcon}>
                          <Landmark size={26} />
                        </span>

                        <span className="flex-1">
                          <span className="block text-base font-bold">
                            Estado de cuentas
                          </span>

                          <span className="block text-xs text-white/90">
                            Cliente, proveedor y banco
                          </span>
                        </span>

                        <span className="text-xl opacity-80">€</span>
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="xl:col-span-4 flex justify-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-3 bg-orange-600 text-white hover:bg-orange-700"
                    >
                      <LogIn size={16} />
                      Iniciar sesión
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <TrialBanner />

      <main
        className={
          isCompactRoute
            ? "mx-auto w-full max-w-screen-2xl flex-1 px-4 sm:px-6 lg:px-8 pb-12"
            : "mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 pb-12 space-y-6 flex-1"
        }
      >
        {children}
      </main>
      <ClientAlertModal workshop={activeWorkshop} />
      <Suspense fallback={null}>
        <ProductTour
          isAuthed={isAuthed}
          pathname={location.pathname}
          disabled={isAuthRoute || isPrintRoute}
          menuOpen={open}
        />
      </Suspense>

      {isAuthed && !isAuthRoute && !isPrintRoute && (
        <button
          type="button"
          onClick={openClientAlerts}
          className="fixed bottom-5 right-5 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-2xl ring-4 ring-white md:hidden"
          aria-label={`Alertas pendientes: ${alertCount}`}
          title={`Alertas pendientes: ${alertCount}`}
        >
          <Bell size={22} />
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
              {alertCount > 99 ? "99+" : alertCount}
            </span>
          )}
        </button>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-700">
                  Soporte ZagaPro
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                  Cuéntanos qué necesitas
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enviaremos tu solicitud al equipo de ZagaPro con los datos
                  necesarios para atender tu consulta.
                </p>
              </div>
              <button
                type="button"
                onClick={closeHelp}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Cerrar ayuda"
              >
                <X size={20} />
              </button>
            </div>

            {helpStatus && (
              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  helpStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                    : "bg-red-50 text-red-800 ring-1 ring-red-200"
                }`}
              >
                {helpStatus.message}
              </div>
            )}

            <form className="mt-5 space-y-4" onSubmit={submitHelp}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                  Nombre
                  <input
                    value={helpForm.name}
                    onChange={setHelpField("name")}
                    required
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                  Negocio
                  <input
                    value={helpForm.business}
                    onChange={setHelpField("business")}
                    required
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Correo de usuario
                <input
                  type="email"
                  value={helpForm.email}
                  onChange={setHelpField("email")}
                  required
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Tipo de ayuda
                <select
                  value={helpForm.type}
                  onChange={setHelpField("type")}
                  required
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Acceso o contraseña">
                    Acceso o contraseña
                  </option>
                  <option value="Alta o cambio de usuario">
                    Alta o cambio de usuario
                  </option>
                  <option value="Problema con facturas o documentos">
                    Facturas o documentos
                  </option>
                  <option value="Configuración del negocio">
                    Configuración del negocio
                  </option>
                  <option value="Otra consulta">Otra consulta</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Mensaje
                <textarea
                  rows={4}
                  value={helpForm.message}
                  onChange={setHelpField("message")}
                  required
                  className="resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeHelp}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={helpSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
                >
                  {helpSubmitting ? "Enviando..." : "Enviar solicitud"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {!isPrintRoute && (
        <footer className="mt-auto border-t border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center gap-3 py-4 md:py-6 text-sm text-slate-500 md:flex-row md:justify-between">
              <div className="order-2 md:order-1 text-center md:text-left">
                © {new Date().getFullYear()} ZagaPro. Todos los derechos
                reservados.
              </div>

              <nav className="order-1 md:order-2 w-full md:w-auto">
                <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 md:gap-4">
                  <li>
                    <a
                      href="/privacy"
                      className="rounded-lg px-2 py-1.5 hover:text-slate-700 hover:bg-slate-100"
                    >
                      Privacidad
                    </a>
                  </li>
                  <li className="hidden md:block text-slate-300">•</li>
                  <li>
                    <a
                      href="/terms"
                      className="rounded-lg px-2 py-1.5 hover:text-slate-700 hover:bg-slate-100"
                    >
                      Términos
                    </a>
                  </li>
                  <li className="hidden md:block text-slate-300">•</li>
                  <li>
                    <a
                      href="/support"
                      className="rounded-lg px-2 py-1.5 hover:text-slate-700 hover:bg-slate-100"
                    >
                      Soporte
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
