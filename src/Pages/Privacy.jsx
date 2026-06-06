import { useEffect, useState } from "react";
import api from "../Components/api";
import { useAuth } from "../Components/AuthContext";
import { SUPPORT_DELIVERY_EMAIL, SUPPORT_EMAIL } from "../Components/support";

const DEFAULT_TEXT = `ZagaPro trata los datos necesarios para prestar el servicio de gestión operativa y administrativa: usuarios, clientes, teléfonos, direcciones, vehículos o equipos, matrículas o referencias, órdenes, presupuestos, facturas, ingresos, gastos, proveedores, repuestos y alertas de seguimiento.

La información se utiliza para permitir el funcionamiento del sistema, generar documentos, conservar historial operativo, facilitar la atención al cliente, mantener la seguridad de la cuenta y cumplir obligaciones administrativas o fiscales cuando corresponda.

Los datos se conservan mientras exista una relación de uso del servicio o mientras sean necesarios para atender obligaciones legales, incidencias, copias de seguridad o trazabilidad del negocio.`;

export default function Privacy() {
  const { isAuthed } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!isAuthed) return;
    api.get("/WorkshopSettings").then((res) => setSettings(res.data)).catch(() => {});
  }, [isAuthed]);

  const workshopName = settings?.nombre ?? settings?.Nombre ?? "ZagaPro";
  const text = settings?.privacyPolicyText ?? settings?.PrivacyPolicyText ?? DEFAULT_TEXT;
  const contactEmail = settings?.email ?? settings?.Email ?? SUPPORT_EMAIL;
  const contactMailto = settings?.email || settings?.Email ? contactEmail : SUPPORT_DELIVERY_EMAIL;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-slate-700">
      <section className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <p className="text-sm font-bold uppercase text-emerald-700">Privacidad</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Política de privacidad</h1>
        <p className="mt-3 text-sm text-slate-500">
          Última actualización: {new Date().toLocaleDateString("es-ES")}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7">
          <Block title="Responsable y ámbito">
            <p>
              Esta política describe cómo se tratan los datos dentro de <strong>{workshopName}</strong> al utilizar
              ZagaPro como herramienta de gestión. Cada negocio es responsable de la exactitud de los datos que registra
              y del uso que realiza de la información de sus clientes.
            </p>
          </Block>

          <Block title="Datos tratados">
            <p className="whitespace-pre-line">{text}</p>
          </Block>

          <Block title="Finalidades principales">
            <ul className="list-disc space-y-2 pl-5">
              <li>Gestionar clientes, trabajos, presupuestos, órdenes, facturas, ingresos y gastos.</li>
              <li>Generar documentos operativos y administrativos asociados al negocio.</li>
              <li>Permitir alertas de seguimiento y recordatorios cuando el módulo esté activo.</li>
              <li>Dar soporte técnico, resolver incidencias y proteger la seguridad de las cuentas.</li>
              <li>Conservar trazabilidad e historial necesario para la operación del negocio.</li>
            </ul>
          </Block>

          <Block title="Acceso, seguridad y terceros">
            <p>
              El acceso se realiza mediante cuentas de usuario y roles por negocio. ZagaPro no vende datos personales.
              La información puede almacenarse en proveedores técnicos necesarios para alojar la aplicación, base de
              datos, copias de seguridad, correo o servicios equivalentes.
            </p>
          </Block>

          <Block title="Derechos y contacto">
            <p>
              Puedes solicitar acceso, rectificación, actualización o eliminación de datos cuando proceda escribiendo a{" "}
              <a href={`mailto:${contactMailto}`} className="font-semibold text-emerald-700 hover:underline">
                {contactEmail}
              </a>
              . Algunas solicitudes pueden estar limitadas por obligaciones legales, fiscales, contractuales o de
              conservación del historial operativo.
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
