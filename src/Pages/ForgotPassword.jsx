import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import api from "../Components/api";
import { supportMailto } from "../Components/support";

const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Introduce un correo válido.");
      return;
    }

    try {
      setBusy(true);
      await api.post("/Auth/forgot", { email: email.trim() });
      setMsg("Si el correo existe, te enviamos un enlace para restablecer la contraseña.");
    } catch (ex) {
      setErr(ex?.response?.data?.message || ex.message || "No se pudo procesar la solicitud.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4">
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Volver al login
        </Link>
      </div>

      <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">¿Olvidaste tu contraseña?</h2>
        <p className="text-sm text-slate-600 mb-4">Escribe tu correo y te enviaremos un enlace para restablecerla.</p>

        {err && <div className="mb-3 rounded-xl bg-rose-50 text-rose-700 px-3 py-2 text-sm">{err}</div>}
        {msg && <div className="mb-3 rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">{msg}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="email">Correo</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                className={inputCls + " pr-10"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@dominio.com"
              />
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
          >
            <Send size={18} /> {busy ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Si no recibes el correo,{" "}
          <a href={supportMailto("Soporte recuperación de contraseña")} className="font-medium text-emerald-700 hover:text-emerald-800">
            contacta soporte
          </a>
          .
        </p>
      </div>
    </div>
  );
}
