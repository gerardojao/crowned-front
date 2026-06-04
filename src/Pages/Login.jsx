import { useEffect, useState } from "react";
import { BarChart3, Eye, EyeOff, FileText, LogIn, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Components/AuthContext";
import { supportMailto } from "../Components/support";
import zagaProLogo from "../assets/logozagapro.png";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const { login, isAuthed } = useAuth();

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const params = new URLSearchParams(location.search);
  const qReturn = params.get("returnUrl") || "";

  const allowed = [
    "https://invoice.tallercrowned.store",
    "https://www.invoice.tallercrowned.store",
    "https://zagapro.app",
    "https://www.zagapro.app",
    "https://invoice.zagapro.app",
    "https://www.invoice.zagapro.app",
    "https://zagapro.store",
    "https://www.zagapro.store",
    "https://demo.zagapro.store",
    "https://localhost:5173",
    "https://localhost:5174",
    "http://localhost:5173",
    "http://localhost:5174",
  ];

  const hasAllowedReturn = allowed.some((a) => qReturn.startsWith(a));
  const targetAfterLogin = hasAllowedReturn ? qReturn : "/";

  useEffect(() => {
    if (!isAuthed) return;

    (async () => {
      const base = import.meta.env.VITE_API_BASE ?? "https://localhost:7288/api";
      const r = await fetch(`${base}/auth/me`, { credentials: "include", cache: "no-store" });
      if (!r.ok) return;

      if (targetAfterLogin === "/") {
        nav("/");
      } else {
        window.location.assign(targetAfterLogin);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email || !pwd) {
      setErr("Completa tus credenciales.");
      return;
    }

    try {
      setBusy(true);
      await login(email.trim(), pwd);

      if (targetAfterLogin === "/") {
        nav("/");
      } else {
        window.location.assign(targetAfterLogin);
      }
    } catch (ex) {
      const msg =
        ex?.response?.data?.message ??
        ex?.response?.data?.Message ??
        ex?.message ??
        "Error al iniciar sesion";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 pt-8 md:pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl ring-1 ring-slate-800 md:p-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300" />

        <div className="relative flex h-full flex-col">
          <div className="flex items-center gap-3">
            {/* <img
              src={zagaProLogo}
              alt="ZagaPro"
              className="h-28 w-auto max-w-full rounded-2xl bg-white object-contain p-3 shadow-lg shadow-cyan-500/10 md:h-36"
            /> */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-cyan-100">
                PLATAFORMA CENTRALIZADA
              </p>
            </div>
          </div>

          <div className="my-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-200">
              Productividad, control y crecimiento
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Administra tu operacion con una plataforma clara, rapida y profesional.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Clientes, documentos, facturacion, ingresos, gastos y procesos diarios
              conectados en un mismo entorno para tomar mejores decisiones.
            </p>
          </div>

          <div className="mt-auto grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <FileText className="text-cyan-300" size={24} />
              <p className="mt-3 text-sm font-bold">Documentos</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                Presupuestos, ordenes y facturas con trazabilidad.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <BarChart3 className="text-emerald-300" size={24} />
              <p className="mt-3 text-sm font-bold">Control financiero</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                Ingresos, gastos y balance para ver el negocio completo.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <ShieldCheck className="text-amber-200" size={24} />
              <p className="mt-3 text-sm font-bold">Acceso seguro</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                Cada usuario entra solo a los espacios asignados.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-200 md:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            Acceso privado
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Iniciar sesion
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Entra a tu panel y continua gestionando clientes, documentos y operaciones.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {err && (
            <div className="rounded-lg bg-rose-50 text-rose-700 px-3 py-2 text-sm ring-1 ring-rose-200">
              {err}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              autoComplete="username"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="tucorreo@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contrasena</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="********"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                onClick={() => setShow((s) => !s)}
                aria-label="Mostrar contrasena"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-cyan-600 text-white hover:bg-cyan-700 transition disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            <LogIn size={18} /> {busy ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/" className="text-slate-600 hover:text-slate-900">
            Volver al inicio
          </Link>
          <Link to="/forgot" className="text-cyan-700 hover:text-cyan-800">
            Olvidaste tu contrasena?
          </Link>
        </div>
        <div className="mt-3 text-center text-sm">
          <a href={supportMailto("Soporte acceso ZagaPro")} className="text-slate-600 hover:text-slate-900">
            Necesitas soporte?
          </a>
        </div>
      </div>
    </div>
  );
}
