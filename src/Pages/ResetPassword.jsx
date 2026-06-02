import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "../Components/api";
import { supportMailto } from "../Components/support";

const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const email = sp.get("email") || "";
  const token = sp.get("token") || "";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setErr("");
    setMsg("");
    if (!email || !token) {
      setErr("Enlace inválido. Falta el token o el correo.");
    }
  }, [email, token]);

  const pwdIssue = useMemo(() => {
    if (p1.length < 8) return "Mínimo 8 caracteres";
    if (!/[A-Z]/.test(p1)) return "Debe incluir una mayúscula";
    if (!/[a-z]/.test(p1)) return "Debe incluir una minúscula";
    if (!/[0-9]/.test(p1)) return "Debe incluir un número";
    if (p1 !== p2) return "Las contraseñas no coinciden";
    return "";
  }, [p1, p2]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!email || !token) {
      setErr("Enlace inválido.");
      return;
    }

    if (pwdIssue) {
      setErr(pwdIssue);
      return;
    }

    try {
      setBusy(true);
      await api.post("/Auth/reset-password", {
        email: email.trim(),
        token,
        newPassword: p1,
      });
      setMsg("Contraseña actualizada. Inicia sesión con tu nueva contraseña.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (ex) {
      setErr(ex?.response?.data?.message || ex.message || "No se pudo actualizar la contraseña.");
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
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-xl bg-emerald-100 p-2">
            <Lock className="text-emerald-700" size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Restablecer contraseña</h2>
        </div>

        <p className="text-sm text-slate-600 mb-3 break-all">
          Correo: <span className="font-medium text-slate-900">{email || "-"}</span>
        </p>

        {err && <div className="mb-3 rounded-xl bg-rose-50 text-rose-700 px-3 py-2 text-sm">{err}</div>}
        {msg && (
          <div className="mb-3 rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="p1">Nueva contraseña</label>
            <div className="relative">
              <input
                id="p1"
                type={show1 ? "text" : "password"}
                className={inputCls + " pr-10"}
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShow1((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500"
                aria-label={show1 ? "Ocultar" : "Mostrar"}
              >
                {show1 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="p2">Repite la contraseña</label>
            <div className="relative">
              <input
                id="p2"
                type={show2 ? "text" : "password"}
                className={inputCls + " pr-10"}
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShow2((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500"
                aria-label={show2 ? "Ocultar" : "Mostrar"}
              >
                {show2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.
            </p>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
          >
            <Lock size={18} /> {busy ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Si el enlace caducó o no funciona,{" "}
          <a href={supportMailto("Soporte recuperación de contraseña")} className="font-medium text-emerald-700 hover:text-emerald-800">
            contacta soporte
          </a>
          .
        </p>
      </div>
    </div>
  );
}
