import { Mail, LifeBuoy } from "lucide-react";
import { SUPPORT_EMAIL, supportMailto } from "../Components/support";

export default function Support() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <section className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <LifeBuoy size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Soporte y contacto</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Para dudas, incidencias, altas de usuarios o recuperación de acceso, escribe al soporte del sistema.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
          <p className="font-semibold text-slate-900">Incluye estos datos si aplica:</p>
          <p className="mt-2">Correo de tu cuenta, taller, una descripción breve y el número de presupuesto, orden o factura afectado.</p>
        </div>

        <a
          href={supportMailto("Soporte ZagaPro")}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <Mail size={17} />
          {SUPPORT_EMAIL}
        </a>
      </section>
    </div>
  );
}
