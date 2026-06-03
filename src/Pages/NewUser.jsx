import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Building2, LogIn, Mail } from "lucide-react";
import { supportMailto } from "../Components/support";

export default function NewUser() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const qReturn = params.get("returnUrl") || "";
  const loginPath = qReturn
    ? `/login?returnUrl=${encodeURIComponent(qReturn)}`
    : "/login";

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} />
          Volver
        </Link>
      </div>

      <section className="rounded-3xl bg-white/85 p-6 text-center shadow-sm ring-1 ring-slate-200 md:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-white">
          <Building2 size={28} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-900">
          Alta de usuarios gestionada
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Para mantener cada taller aislado y seguro, las nuevas cuentas las crea el administrador del sistema y las asigna al taller correspondiente.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left text-sm text-slate-700 ring-1 ring-slate-200">
          <p className="font-semibold text-slate-900">Solicita el alta indicando:</p>
          <p className="mt-2">Nombre del taller, nombre del usuario, correo y rol operativo.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={supportMailto("Alta usuario ZagaPro")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <Mail size={17} />
            Solicitar alta
          </a>
          <Link
            to={loginPath}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            <LogIn size={17} />
            Iniciar sesion
          </Link>
        </div>
      </section>
    </div>
  );
}
