import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, LifeBuoy, Mail, ShieldQuestion } from "lucide-react";
import { sendSupportRequest } from "../Components/supportRequest";

const supportItems = [
  "Correo de la cuenta afectada.",
  "Nombre del negocio o taller.",
  "Descripcion breve de lo que ocurre.",
  "Numero de orden, presupuesto o factura, si aplica.",
  "Captura de pantalla si el error es visual o aparece un mensaje tecnico.",
];

const commonCases = [
  "Alta, baja o cambio de usuarios.",
  "Recuperacion de acceso o problemas con contrasena.",
  "Revision de modulos activos por negocio.",
  "Incidencias al crear presupuestos, ordenes, facturas, ingresos o gastos.",
  "Dudas sobre configuracion del negocio, logo, serie de factura o datos fiscales.",
];

const initialForm = {
  name: "",
  business: "",
  email: "",
  type: "",
  message: "",
};

export default function Support() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submitSupport = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      await sendSupportRequest({
        ...form,
        source: "Pagina /support",
      });
      setStatus({
        type: "success",
        message: `${form.name}, tu correo ha sido enviado a ZagaPro. A la brevedad sera atendida tu consulta.`,
      });
      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "No se pudo enviar la solicitud.",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
              Estamos para ayudarte con acceso, configuracion, usuarios, modulos e incidencias operativas dentro de
              ZagaPro.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <InfoPanel icon={Mail} title="Canal principal">
            <p>
              Usa el formulario de soporte para enviar tu solicitud directamente a ZagaPro. Incluye toda la informacion
              posible para revisar el caso con rapidez.
            </p>
          </InfoPanel>

          <InfoPanel icon={ShieldQuestion} title="Acceso y seguridad">
            <p>
              Si perdiste acceso, indica el correo de la cuenta y el negocio asociado. Por seguridad, podemos solicitar
              validacion adicional antes de modificar usuarios o contrasenas.
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
          <p className="font-bold">Atencion prioritaria</p>
          <p className="mt-1">
            Las incidencias que impidan facturar, acceder al sistema o consultar informacion critica del negocio se
            revisan con prioridad frente a consultas generales o solicitudes de mejora.
          </p>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <div className="flex items-center gap-2 text-slate-900">
            <Mail size={19} className="text-emerald-600" />
            <h2 className="font-bold">Enviar solicitud</h2>
          </div>

          {status && (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
                status.type === "success"
                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                  : "bg-red-50 text-red-800 ring-1 ring-red-200"
              }`}
            >
              {status.message}
            </div>
          )}

          <form className="mt-5 space-y-4" onSubmit={submitSupport}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Nombre
                <input
                  value={form.name}
                  onChange={setField("name")}
                  required
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Negocio
                <input
                  value={form.business}
                  onChange={setField("business")}
                  required
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-bold text-slate-800">
              Correo de usuario
              <input
                type="email"
                value={form.email}
                onChange={setField("email")}
                required
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-bold text-slate-800">
              Tipo de ayuda
              <select
                value={form.type}
                onChange={setField("type")}
                required
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Selecciona una opcion</option>
                <option value="Acceso o contrasena">Acceso o contrasena</option>
                <option value="Alta o cambio de usuario">Alta o cambio de usuario</option>
                <option value="Problema con facturas o documentos">Facturas o documentos</option>
                <option value="Configuracion del negocio">Configuracion del negocio</option>
                <option value="Otra consulta">Otra consulta</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-bold text-slate-800">
              Mensaje
              <textarea
                rows={5}
                value={form.message}
                onChange={setField("message")}
                required
                className="resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Enviando..." : "Enviar soporte"}
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </section>
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
