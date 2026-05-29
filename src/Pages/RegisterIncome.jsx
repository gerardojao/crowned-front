import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";
import { soloFecha } from "../utils/date";

const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const EMPTY_INCOME = {
  Id: "", Foto: "", Fecha: "", Mes: "", Importe: "",
  NombreIngreso: "", IngresoId: "", Descripcion: "",
};

// --- UI auxiliares ---
const FieldError = ({ id, children }) => (
  <p id={id} className="mt-1 text-xs text-rose-600">{children}</p>
);

const Banner = ({ type = "success", text, onClose, actionLabel, onAction }) => {
  if (!text) return null;
  const map = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    error: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <div role="alert" aria-live="polite" className={`mb-4 rounded-xl p-3 text-sm ring-1 ${map[type]}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{text}</span>
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="rounded-lg px-2.5 py-1 text-xs ring-1 ring-current/20 hover:bg-white/60"
            >
              {actionLabel}
            </button>
          )}
          <button type="button" onClick={onClose} className="text-xs underline underline-offset-2">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------

export default function RegisterIncome({ income, setIncome }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const record = state.record;
  const isEdit = Boolean(state.edit === true && (state.id || record?.id));

  const [incTypes, setIncTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // errores por campo
  const [errors, setErrors] = useState({});
  // banner global
  const [notice, setNotice] = useState(null); // { type, text, actionLabel?, onAction?, onClose?, autocloseMs? }

  // === Config rápida: Fecha requerida o no ===
  const REQUIRE_FECHA = true; // ← pon en true si quieres obligatoria

  const setField = (name, value) => {
    setIncome(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (e) => setField(e.target.name, e.target.value);

  const handleTipoIngresoChange = (e) => {
    const value = e.target.value;
    const selected = incTypes.find(t => String(t.id) === String(value));
    setField("IngresoId", value);
    setField("NombreIngreso", selected?.nombreIngreso || "");
    if (errors["IngresoId"]) setErrors(prev => ({ ...prev, IngresoId: undefined }));
  };

  const convertirImagen = (files) => {
    const file = files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField("Foto", String(reader.result));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    (async () => {
      try { const res = await api.get("/Ingreso"); setIncTypes(res.data?.data || []); }
      catch { setIncTypes([]); }
    })();
  }, []);

  // Reset/prefill
  useEffect(() => {
    if (!isEdit) {
      setIncome(EMPTY_INCOME);
      return;
    }
    const r = record || {};
    setIncome({
      Id: state.id || r.id || "",
      Foto: r.foto ?? "",
      Fecha: r.fecha ? soloFecha(r.fecha) : "",
      Mes: r.mes ?? "",
      Importe: r.importe ?? "",
      IngresoId: r.tipoId ?? "",
      NombreIngreso: r.tipo ?? "",
      Descripcion: r.descripcion ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  // --- Validación ---
  const REQUIRED = "Este campo es requerido.";

  const validateField = (name, value) => {
    let msg = "";
    switch (name) {
      case "IngresoId":

      case "Fecha":
        if (REQUIRE_FECHA && !value) msg = REQUIRED;
        break;
      case "Importe":
        if (value === "" || value === null || value === undefined) msg = REQUIRED;
        else if (isNaN(Number(value))) msg = "Formato inválido.";
        else if (Number(value) <= 0) msg = "Debe ser mayor que 0.";
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: msg || undefined }));
    return !msg;
  };

  const validateAll = () => {
    const fields = ["IngresoId", "Mes", "Fecha", "Importe"];
    const next = {};
    for (const f of fields) {
      const ok = validateField(f, income[f]);
      if (!ok) {
        // mensajes específicos ya puestos; solo marcamos para detectar el primero
        next[f] = true;
      }
    }
    // enfocar el primero con error
    const firstError = ["IngresoId", "Mes", "Fecha", "Importe"].find(f => next[f]);
    if (firstError) {
      const el = document.getElementById(firstError === "IngresoId" ? "TipoIngreso" : firstError);
      el?.focus();
      return false;
    }
    return true;
  };

  const onBlurValidate = (e) => validateField(e.target.name, e.target.value);

  // Auto-cierre con redirección si se configuró
  const autoTimerRef = useRef(null);
  useEffect(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (notice?.autocloseMs && typeof notice?.onClose === "function") {
      autoTimerRef.current = setTimeout(() => {
        notice.onClose();
      }, notice.autocloseMs);
    }
    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [notice]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateAll()) return;

    try {
      setSubmitting(true);

      if (isEdit) {
        const id = state.id || record?.id;
        await api.put(`/Ingreso/detalle/${id}`, {
          fecha: income.Fecha || null,                // sigue opcional
          mes: income.Mes || null,
          nombreIngreso: income.IngresoId ? Number(income.IngresoId) : null,
          descripcion: income.Descripcion ?? null,
          importe: Number(income.Importe ?? 0),
          foto: income.Foto ?? null,
        });
        setNotice({
          type: "success",
          text: "Ingreso actualizado correctamente.",
          actionLabel: "Ir al detalle",
          onAction: () => navigate("/ingresos-detalle", { replace: true }),
          onClose: () => navigate("/ingresos-detalle", { replace: true }),
          autocloseMs: 7000, // quítalo si no quieres auto-redirección
        });
        return; // no navegues inmediatamente
      }

      // Crear
      await api.post("/FichaIngreso/Create", {
        Foto: income.Foto || null,
        Fecha: income.Fecha || null,                 // opcional
        Mes: income.Mes,
        Importe: Number(income.Importe),
        NombreIngreso: Number(income.IngresoId),     // FK esperado
        Descripcion: income.Descripcion || null,
      });

      setIncome(EMPTY_INCOME);
      setNotice({
        type: "success",
        text: "Ingreso registrado satisfactoriamente.",
        actionLabel: "Ir al inicio",
        onAction: () => navigate("/", { replace: true }),
        onClose: () => navigate("/", { replace: true }),
        autocloseMs: 2500, // quítalo si no quieres auto-redirección
      });
      return; // no navegues inmediatamente
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text:
          (isEdit ? "No se pudo actualizar: " : "No se pudo registrar: ") +
          (err?.response?.data?.message || err?.message || "Error"),
        // sin autoclose para que lo lean
      });
    } finally {
      setSubmitting(false);
    }
  };

  // clases con error
  const cls = (name) =>
    `w-full rounded-xl border bg-white px-3 py-2 text-sm ${
      errors[name]
        ? "border-rose-400 ring-1 ring-rose-200 focus-visible:ring-rose-400"
        : "border-slate-300"
    }`;

  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-slate-900">
            {isEdit ? "Editar ingreso" : "Registro de ingreso"}
          </h2>
          {isEdit && (state.id || record?.id) && (
            <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2 py-1">
              ID #{state.id || record?.id}
            </span>
          )}
        </div>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition">
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>

      {/* Banner global */}
      <Banner
        type={notice?.type}
        text={notice?.text}
        onClose={() => {
          if (typeof notice?.onClose === "function") {
            notice.onClose();
          } else {
            setNotice(null);
          }
        }}
        actionLabel={notice?.actionLabel}
        onAction={notice?.onAction}
      />

      <form className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="TipoIngreso">Tipo de ingreso</label>
          <select
            id="TipoIngreso"
            name="IngresoId"
            className={cls("IngresoId")}
            onChange={handleTipoIngresoChange}
            onBlur={(e) => validateField("IngresoId", e.target.value)}
            value={income.IngresoId || ""}
            aria-invalid={!!errors.IngresoId}
            aria-describedby={errors.IngresoId ? "IngresoId-error" : undefined}
          >
            <option value="">Selecciona…</option>
            {incTypes.map(t => <option key={t.id} value={t.id}>{t.nombreIngreso}</option>)}
          </select>
          {errors.IngresoId && <FieldError id="IngresoId-error">{errors.IngresoId}</FieldError>}
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Foto">Foto (opcional)</label>
          <input id="Foto" type="file" className={cls("Foto")}
            accept="image/*" onChange={(e)=>convertirImagen(e.target.files)} />
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Fecha">Fecha{REQUIRE_FECHA && " *"}</label>
            <input
              id="Fecha"
              type="date"
              className={cls("Fecha")}
              name="Fecha"
              value={income.Fecha || ""}
              onChange={handleChange}
              //onBlur={onBlurValidate}
              aria-invalid={!!errors.Fecha}
              aria-describedby={errors.Fecha ? "Fecha-error" : undefined}
            />
            {errors.Fecha && <FieldError id="Fecha-error">{errors.Fecha}</FieldError>}
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Mes">Mes</label>
            <select
              id="Mes"
              className={cls("Mes")}
              name="Mes"
              value={income.Mes || ""}
              onChange={handleChange}
              //onBlur={onBlurValidate}
              aria-invalid={!!errors.Mes}
              aria-describedby={errors.Mes ? "Mes-error" : undefined}
            >
              <option value="">Selecciona…</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.Mes && <FieldError id="Mes-error">{errors.Mes}</FieldError>}
          </div> */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Descripcion">Descripción</label>
            <input
              id="Descripcion"
              type="text"
              className={cls("Descripcion")}
              name="Descripcion"
              value={income.Descripcion || ""}
              onChange={handleChange}
              placeholder="(opcional)"
              //onBlur={onBlurValidate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Importe">Importe</label>
            <input
              id="Importe"
              type="number"
              step="0.01"
              className={cls("Importe")}
              name="Importe"
              value={income.Importe || ""}
              onChange={handleChange}
              //onBlur={onBlurValidate}
              placeholder="0,00"
              aria-invalid={!!errors.Importe}
              aria-describedby={errors.Importe ? "Importe-error" : undefined}
            />
            {errors.Importe && <FieldError id="Importe-error">{errors.Importe}</FieldError>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar ingreso" : "Registrar ingreso")}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
            onClick={()=>navigate(-1)}
          >
            Cancelar
          </button>
        </div>
      </form>
    </>
  );
}
