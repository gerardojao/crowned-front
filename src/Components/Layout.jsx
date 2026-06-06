import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
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
import { sendSupportRequest } from "./supportRequest";

const heroBtnBase =
  "group flex min-w-[240px] items-center justify-between gap-4 rounded-2xl px-5 py-5 text-white shadow-md transition hover:scale-[1.01]";

const heroBtnIcon =
  "flex h-12 w-12 items-center justify-center rounded-xl bg-white/20";

const mobileLink = "px-3 py-2 rounded-lg hover:bg-slate-100";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthed, user, logout } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [activeWorkshopId, setActiveWorkshopId] = useState(getCurrentWorkshopId());
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

  const isAuthRoute = /^\/(login|register)(\/|$)?/.test(location.pathname);
  const isPrintRoute = /^\/print-order\/.+/.test(location.pathname);

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
        const exists = list.some((x) => String(x.id ?? x.Id) === String(stored));
        const nextId = exists ? stored : String(list[0]?.id ?? list[0]?.Id ?? "");

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
    return () => window.removeEventListener("tc:workshop-changed", onWorkshopChanged);
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
  const activeWorkshopLogo = activeWorkshop?.logoUrl ?? activeWorkshop?.LogoUrl ?? "";
  const navbarLogo = isAuthed && activeWorkshopLogo
    ? resolveApiAssetUrl(activeWorkshopLogo)
    : zagaProLogo;
  const navbarLogoAlt = isAuthed
    ? `${activeWorkshop?.nombre ?? activeWorkshop?.Nombre ?? "Negocio"}`
    : "ZagaPro - Gestion inteligente de negocios";
  const labels = getBusinessTerminology(activeWorkshop);
  const isSuperAdmin = (user?.role || "").toLowerCase() === "superadmin";
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
      {!isPrintRoute && (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
          <div className="mx-auto w-full max-w-screen-2xl px-4 pr-5 sm:px-6 lg:px-8 py-3 flex items-center">
            <Link
              to="/"
              className="font-extrabold tracking-tight text-slate-900 text-lg sm:text-xl"
            >
              <img
                src={navbarLogo}
                alt={navbarLogoAlt}
                className="h-20 w-auto max-w-[220px] rounded-2xl bg-white object-contain p-2 shadow-sm ring-1 ring-slate-200 sm:h-24 sm:max-w-[280px]"
              />
            </Link>

            {!isAuthRoute && !isPrintRoute && (
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
            <div className="border-t border-slate-200 bg-white">
              <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-2">
                <div className="flex flex-col">
                  {isAuthed ? (
                    <>
                      <div className="border-b border-slate-100 px-3 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Sesión
                        </div>
                        <div className="mt-1 break-all text-sm font-medium text-slate-700">
                          {user?.email}
                        </div>
                        {workshops.length > 1 && (
                          <label className="mt-3 block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Negocio activo
                            </span>
                            <select
                              value={activeWorkshopId}
                              onChange={onWorkshopChange}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800"
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
                      <NavLink
                        to="/register-work-order"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        Nueva orden
                      </NavLink>
                      <NavLink
                        to="/register-customer"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        Registrar cliente
                      </NavLink>
                      <NavLink
                        to="/register-supplier"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        Registrar proveedor
                      </NavLink>
                      <NavLink
                        to="/register-income"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        Registrar ingreso
                      </NavLink>
                      <NavLink
                        to="/register-expense"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        Registrar gasto
                      </NavLink>
                      <NavLink
                        to="/statement"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        Ver balance
                      </NavLink>
                      <Link
                        to="/workshop-invoice"
                        className={mobileLink}
                        onClick={() => setOpen(false)}
                      >
                        Facturar
                      </Link>
                      {isSuperAdmin && (
                        <NavLink
                          to="/admin/workshops"
                          className={mobileLink}
                          onClick={() => setOpen(false)}
                        >
                          Administrar negocios
                        </NavLink>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          openClientAlerts();
                          setOpen(false);
                        }}
                        className="px-3 py-2 rounded-lg hover:bg-orange-50 text-left"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Bell size={16} />
                          Alertas clientes
                          {alertCount > 0 && (
                            <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
                              {alertCount}
                            </span>
                          )}
                        </span>
                      </button>

                      <button
                        onClick={onLogout}
                        className="mt-1 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 text-left"
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
      )}

      {!isAuthRoute && (
        <div
          className={`relative mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 ${
            isAuthed ? "pt-6 md:pt-8 pb-4 md:pb-6" : "pt-10 md:pt-14 pb-2 md:pb-3"
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
                          {activeWorkshop?.nombre ?? activeWorkshop?.Nombre ?? "Tu taller"}
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
                      : "Gestiona clientes, documentos, facturacion y operaciones desde una plataforma clara, segura y preparada para tu negocio."}
                  </p>

                  {!isAuthed && (
                    <>
                      <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-bold text-slate-700">
                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">Clientes</span>
                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">Documentos</span>
                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">Facturacion</span>
                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">Seguimiento</span>
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

              <div className={isAuthed ? "mt-7 hidden md:grid grid-cols-1 lg:grid-cols-4 gap-5" : "hidden"}>
                {isAuthed ? (
                  <>
                    <Link
                      to="/register-work-order"
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

                    <Link
                      to="/register-customer"
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
                      to="/register-supplier"
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
                          {labels.stockTitle}
                        </span>
                      </span>

                      <span className="text-xl opacity-80">›</span>
                    </Link>

                    <Link
                      to="/statement"
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
          isPrintRoute
            ? "w-full flex-1"
            : "mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 pb-12 space-y-6 flex-1"
        }
      >
        {children}
      </main>
          <ClientAlertModal workshop={activeWorkshop} />

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
                  Enviaremos tu solicitud al equipo de ZagaPro con los datos necesarios para atender tu consulta.
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
                  <option value="Acceso o contraseña">Acceso o contraseña</option>
                  <option value="Alta o cambio de usuario">Alta o cambio de usuario</option>
                  <option value="Problema con facturas o documentos">Facturas o documentos</option>
                  <option value="Configuración del negocio">Configuración del negocio</option>
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
               `© ${new Date().getFullYear()} ZagaPro. Todos los derechos reservados.`
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
