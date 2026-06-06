import { useEffect, useState } from "react";
import api from "../Components/api";
import { useAuth } from "../Components/AuthContext";
import { SUPPORT_DELIVERY_EMAIL, SUPPORT_EMAIL } from "../Components/support";

const DEFAULT_TEXT = `El usuario se compromete a introducir información veraz, revisar los documentos antes de entregarlos a sus clientes y utilizar la aplicación de forma responsable.

Los presupuestos, órdenes, facturas, reportes, alertas y descargas generadas por ZagaPro dependen de la información registrada por cada negocio. ZagaPro facilita la gestión, pero no sustituye la revisión contable, fiscal, legal o administrativa que corresponda.`;

export default function Terms() {
  const { isAuthed } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!isAuthed) return;
    api.get("/WorkshopSettings").then((res) => setSettings(res.data)).catch(() => {});
  }, [isAuthed]);

  const workshopName = settings?.nombre ?? settings?.Nombre ?? "ZagaPro";
  const text = settings?.termsText ?? settings?.TermsText ?? DEFAULT_TEXT;
  const contactEmail = settings?.email ?? settings?.Email ?? SUPPORT_EMAIL;
  const contactMailto = settings?.email || settings?.Email ? contactEmail : SUPPORT_DELIVERY_EMAIL;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-slate-700">
      <section className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <p className="text-sm font-bold uppercase text-emerald-700">Condiciones</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Términos y condiciones de uso</h1>
        <p className="mt-3 text-sm text-slate-500">
          Condiciones aplicables al uso de <strong>{workshopName}</strong> dentro de ZagaPro.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7">
          <Block title="Objeto del servicio">
            <p>
              ZagaPro es una plataforma de gestión para negocios de servicios. Permite administrar clientes, trabajos,
              presupuestos, órdenes, facturas, ingresos, gastos, proveedores, repuestos, usuarios y módulos adicionales
              según la configuración contratada o activada para cada negocio.
            </p>
          </Block>

          <Block title="Uso responsable">
            <p className="whitespace-pre-line">{text}</p>
          </Block>

          <Block title="Responsabilidad sobre la información">
            <ul className="list-disc space-y-2 pl-5">
              <li>El negocio es responsable de la información fiscal, comercial y operativa que introduce.</li>
              <li>Los documentos deben revisarse antes de enviarlos, imprimirlos o entregarlos a terceros.</li>
              <li>Los importes, impuestos, datos de cliente y numeraciones deben validarse por el usuario.</li>
              <li>Los reportes financieros son herramientas de control interno y no sustituyen asesoría profesional.</li>
            </ul>
          </Block>

          <Block title="Usuarios, acceso y seguridad">
            <p>
              Cada cuenta es personal. El negocio debe cuidar sus credenciales, asignar usuarios autorizados y solicitar
              la baja o modificación de accesos cuando cambie su equipo. El superadministrador del sistema puede
              habilitar negocios, usuarios y módulos por motivos operativos, comerciales o de soporte.
            </p>
          </Block>

          <Block title="Módulos opcionales">
            <p>
              Algunas funcionalidades pueden estar disponibles como módulos activables por negocio, por ejemplo alertas
              con WhatsApp, descarga de facturas por período o estado de resultados. Si un módulo está desactivado, la
              opción puede no mostrarse o funcionar de forma limitada.
            </p>
          </Block>

          <Block title="Disponibilidad y cambios">
            <p>
              Se procura mantener el servicio disponible y estable. Pueden existir interrupciones por mantenimiento,
              actualizaciones, incidencias técnicas, cambios de infraestructura o causas ajenas al sistema. Las
              funcionalidades pueden evolucionar para mejorar seguridad, rendimiento o experiencia de uso.
            </p>
          </Block>

          <Block title="Contacto">
            <p>
              Para dudas sobre estas condiciones o soporte operativo, contacta con{" "}
              <a href={`mailto:${contactMailto}`} className="font-semibold text-emerald-700 hover:underline">
                {contactEmail}
              </a>
              .
            </p>
          </Block>
        </div>
      </section>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
