import { useEffect, useState } from "react";
import api from "../Components/api";
import { useAuth } from "../Components/AuthContext";

const DEFAULT_TEXT =
  "Al usar la aplicacion, aceptas hacerlo de forma responsable y mantener actualizados los datos fiscales y operativos de tu taller. Los documentos generados dependen de la informacion introducida por el usuario. El taller debe revisar presupuestos, ordenes y facturas antes de entregarlos a sus clientes.";

export default function Terms() {
  const { isAuthed } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!isAuthed) return;
    api.get("/WorkshopSettings").then((res) => setSettings(res.data)).catch(() => {});
  }, [isAuthed]);

  const workshopName = settings?.nombre ?? settings?.Nombre ?? "App Multitaller";
  const text = settings?.termsText ?? settings?.TermsText ?? DEFAULT_TEXT;
  const email = settings?.email ?? settings?.Email ?? "soporte@zagapro.app";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 text-slate-700 space-y-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Terminos de uso</h1>

      <p>
        Condiciones aplicables a <strong>{workshopName}</strong>:
      </p>

      <p className="whitespace-pre-line">{text}</p>

      <p>
        Para dudas o soporte, contacta con{" "}
        <a href={`mailto:${email}`} className="text-sky-600 hover:underline">
          {email}
        </a>.
      </p>
    </div>
  );
}
