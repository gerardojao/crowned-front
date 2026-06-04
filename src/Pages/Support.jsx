import { AlertCircle, CheckCircle2, LifeBuoy, Mail, ShieldQuestion } from "lucide-react";
import { SUPPORT_EMAIL, supportMailto } from "../Components/support";

const supportItems = [
  "Correo de la cuenta afectada.",
  "Nombre del negocio o taller.",
  "Descripción breve de lo que ocurre.",
  "Número de orden, presupuesto o factura, si aplica.",
  "Captura de pantalla si el error es visual o aparece un mensaje técnico.",
];

const commonCases = [
  "Alta, baja o cambio de usuarios.",
  "Recuperación de acceso o problemas con contraseña.",
  "Revisión de módulos activos por negocio.",
  "Incidencias al crear presupuestos, órdenes, facturas, ingresos o gastos.",
  "Dudas sobre configuración del negocio, logo, serie de factura o datos fiscales.",
];

export default function Support() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <section className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <LifeBuoy size={24} />
          </div>

          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-emerald-700">Soporte</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Soporte y contacto</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Estamos para ayudarte con acceso, configuración, usuarios, módulos e incidencias operativas dentro de
              ZagaPro.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <InfoPanel icon={Mail} title="Canal principal">
            <p>
              Escríbenos a{" "}
              <a href={supportMailto("Soporte ZagaPro")} className="font-semibold text-emerald-700 hover:underline">
                {SUPPORT_EMAIL}
              </a>
              . Incluye toda la información posible para revisar el caso con rapidez.
            </p>
          </InfoPanel>

          <InfoPanel icon={ShieldQuestion} title="Acceso y seguridad">
            <p>
              Si perdiste acceso, indica el correo de la cuenta y el negocio asociado. Por seguridad, podemos solicitar
              validación adicional antes de modificar usuarios o contraseñas.
            </p>
          </InfoPanel>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-slate-900">
              <CheckCircle2 size={19} className="text-emerald-600" />
              <h2 className="font-bold">Incluye estos datos</h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              {supportItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-slate-900">
              <AlertCircle size={19} className="text-orange-600" />
              <h2 className="font-bold">Casos habituales</h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              {commonCases.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
          <p className="font-bold">Atención prioritaria</p>
          <p className="mt-1">
            Las incidencias que impidan facturar, acceder al sistema o consultar información crítica del negocio se
            revisan con prioridad frente a consultas generales o solicitudes de mejora.
          </p>
        </div>

        <a
          href={supportMailto("Soporte ZagaPro")}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <Mail size={17} />
          Contactar soporte
        </a>
      </section>
    </div>
  );
}

function InfoPanel({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="flex items-center gap-2 text-slate-900">
        <Icon size={19} className="text-emerald-600" />
        <h2 className="font-bold">{title}</h2>
      </div>
      <div className="mt-3 text-sm leading-6 text-slate-600">{children}</div>
    </section>
  );
}
