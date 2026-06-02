import { useEffect, useState } from "react";
import api from "../Components/api";
import { useAuth } from "../Components/AuthContext";

const DEFAULT_TEXT =
  "Tratamos datos necesarios para la gestion del taller: usuarios, clientes, vehiculos, matriculas, telefonos, presupuestos, ordenes de trabajo, facturas, ingresos y gastos. Estos datos se usan para prestar el servicio, mantener la seguridad de la cuenta, generar documentos operativos y conservar la informacion fiscal que corresponda.";

export default function Privacy() {
  const { isAuthed } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!isAuthed) return;
    api.get("/WorkshopSettings").then((res) => setSettings(res.data)).catch(() => {});
  }, [isAuthed]);

  const workshopName = settings?.nombre ?? settings?.Nombre ?? "App Multitaller";
  const text = settings?.privacyPolicyText ?? settings?.PrivacyPolicyText ?? DEFAULT_TEXT;
  const email = settings?.email ?? settings?.Email ?? "soporte@tallercrowned.store";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 text-slate-700 space-y-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Politica de privacidad</h1>

      <p>
        En <strong>{workshopName}</strong>:
      </p>

      <p className="whitespace-pre-line">{text}</p>

      <p>
        Puedes solicitar informacion, rectificacion o eliminacion cuando proceda escribiendo a{" "}
        <a href={`mailto:${email}`} className="text-sky-600 hover:underline">
          {email}
        </a>.
      </p>

      <p>Ultima actualizacion: {new Date().toLocaleDateString("es-ES")}</p>
    </div>
  );
}
