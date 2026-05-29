import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";
import { soloFecha } from "../utils/date";
import { useRef } from "react";

const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const EMPTY_EXPENSE = {
  Id:"", Foto:"", Fecha:"", Mes:"", Importe:"", NombreEgreso:"", Descripcion:"",
};

// Mini componente para mostrar errores de campo
const FieldError = ({ id, children }) => (
  <p id={id} className="mt-1 text-xs text-rose-600">{children}</p>
);

// Banner superior para éxito/error
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


export default function Register({ expense, setExpense }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const record = state.record;
  const isEdit = Boolean(state.edit === true && (state.id || record?.id));

  const [outTypes, setOutTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // errores por campo
  const [errors, setErrors] = useState({});
  // banner global
  const [notice, setNotice] = useState(null); // { type: 'success'|'error', text: string }

  const setField = (name, value) => {
    setExpense(prev => ({ ...prev, [name]: value }));
    // limpiar error al escribir
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (e) => setField(e.target.name, e.target.value);

  const convertirImagen = (files) => {
    const file = files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField("Foto", String(reader.result));
    reader.readAsDataURL(file);
  };

  const autoTimerRef = useRef(null);

useEffect(() => {
  // limpia timer anterior si cambia el notice
  if (autoTimerRef.current) {
    clearTimeout(autoTimerRef.current);
    autoTimerRef.current = null;
  }
  if (notice?.autocloseMs && typeof notice.onClose === "function") {
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


  useEffect(() => {
    (async () => {
      try { const res = await api.get("/Egreso"); setOutTypes(res.data?.data || []); }
      catch { setOutTypes([]); }
    })();
  }, []);

  // ✅ Reset en crear; prefill en editar
  useEffect(() => {
    if (!isEdit) {
      setExpense(EMPTY_EXPENSE);
      return;
    }
    const r = record || {};
    setExpense({
      Id: state.id || r.id || "",
      Foto: r.foto ?? "",
      Fecha: r.fecha ? soloFecha(r.fecha) : "",
      Mes: r.mes ?? "",
      Importe: r.importe ?? "",
      NombreEgreso: r.tipoId ?? "",
      Descripcion: r.descripcion ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  // --- Validación ---
  const REQUIRED = "Este campo es requerido.";

  const validateField = (name, value) => {
    let msg = "";
    switch (name) {
      case "NombreEgreso":
      case "Mes":
      case "Fecha":
        if (!value) msg = REQUIRED;
        break;
      case "Importe":
        if (value === "" || value === null || value === undefined) msg = REQUIRED;
        else if (isNaN(Number(value))) msg = "Formato inválido.";
        else if (Number(value) <= 0) msg = "Debe ser mayor que 0.";
        break;
      default:
        // campos opcionales: Descripcion, Foto
        break;
    }
    setErrors(prev => ({ ...prev, [name]: msg || undefined }));
    return !msg;
  };

  const validateAll = () => {
    const fields = ["NombreEgreso", "Mes", "Fecha", "Importe"];
    const next = {};
    for (const f of fields) {
      const ok = validateField(f, expense[f]);
      if (!ok) next[f] = REQUIRED; // el mensaje puntual ya lo dejó validateField
    }
    // para Importe guardamos su mensaje específico si aplica
    if (expense.Importe === "" || expense.Importe === null || expense.Importe === undefined) {
      next["Importe"] = REQUIRED;
    } else if (isNaN(Number(expense.Importe))) {
      next["Importe"] = "Formato inválido.";
    } else if (Number(expense.Importe) <= 0) {
      next["Importe"] = "Debe ser mayor que 0.";
    }
    setErrors(prev => ({ ...prev, ...next }));
    // enfocar el primero con error
    const firstError = ["NombreEgreso", "Mes", "Fecha", "Importe"].find(f => next[f]);
    if (firstError) {
      const el = document.getElementById(firstError);
      el?.focus();
      return false;
    }
    return true;
  };

  const onBlurValidate = (e) => validateField(e.target.name, e.target.value);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Validación de front
    if (!validateAll()) return;

    try {
      setSubmitting(true);

      if (isEdit) {
        const id = state.id || record?.id;
        await api.put(`/FichaEgreso/detalle/${id}`, {
          fecha: expense.Fecha, // ahora requerido
          mes: expense.Mes,
          nombreEgreso: expense.NombreEgreso ? Number(expense.NombreEgreso) : null,
          descripcion: expense.Descripcion ?? null,
          importe: Number(expense.Importe ?? 0),
          foto: expense.Foto ?? null,
        });
        setNotice({
            type: "success",
            text: "Gasto actualizado correctamente.",
            actionLabel: "Ir al detalle",
            onAction: () => navigate("/egresos-detalle", { replace: true }),
            onClose: () => navigate("/egresos-detalle", { replace: true }),
            autocloseMs: 7000, // opcional: auto-redirigir tras 2.5s
          });
        // Opcional: pasar flash a la otra vista si quieres verlo allí
        // navigate("/egresos-detalle", { replace: true, state: { flash: "Gasto actualizado." } });
        //navigate("/egresos-detalle", { replace: true });
        return;
      }

      // CREATE
      await api.post("/FichaEgreso", {
        Foto: expense.Foto || null,
        Fecha: expense.Fecha,             // requerido
        Mes: expense.Mes,                 // requerido
        Importe: Number(expense.Importe), // requerido > 0
        NombreEgreso: Number(expense.NombreEgreso), // requerido
        Descripcion: expense.Descripcion || null,
      });

      setNotice({
        type: "success",
        text: "Gasto registrado satisfactoriamente.",
        actionLabel: "Ir al inicio",
        onAction: () => navigate("/", { replace: true }),
        onClose: () => navigate("/", { replace: true }),
        autocloseMs: 5000, // opcional
      });
      setExpense(EMPTY_EXPENSE);
      //navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text:
          (isEdit ? "No se pudo actualizar: " : "No se pudo registrar: ") +
          (err?.response?.data?.message || err?.message || "Error"),
      });
    } finally {
      setSubmitting(false);
      // autocierre del banner a los 4s (opcional)
      //setTimeout(() => setNotice(null), 4000);
    }
  };

  // clases con error
  const cls = (name) =>
    `w-full rounded-xl border bg-white px-3 py-2 text-sm ${
      errors[name]
        ? "border-rose-400 ring-1 ring-rose-200 focus-visible:ring-rose-400"
        : "border-slate-300"
    }`;

    const getDisplayName = (originalName) => {
      if (originalName === "Transporte") {
        return "Gastos Casa";
      }
    
      return originalName;
    };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-slate-900">
            {isEdit ? "Editar gasto" : "Registro de gasto"}
          </h2>
          {isEdit && (state.id || record?.id) && (
            <span className="text-xs rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200 px-2 py-1">
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
        notice.onClose(); // ← navega y, si quieres, limpia el banner
      } else {
        setNotice(null);
      }
    }}
    actionLabel={notice?.actionLabel}
    onAction={notice?.onAction}
  />


      <form className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="NombreEgreso">Tipo de egreso</label>
          <select
            id="NombreEgreso"
            name="NombreEgreso"
            className={cls("NombreEgreso")}
            value={expense.NombreEgreso ?? ""}
            onChange={handleChange}
            onBlur={onBlurValidate}
            aria-invalid={!!errors.NombreEgreso}
            aria-describedby={errors.NombreEgreso ? "NombreEgreso-error" : undefined}
          >
            <option value="">Selecciona…</option>
            {outTypes.map(o => <option key={o.id} value={o.id}>{getDisplayName(o.nombre)}</option>)}
          </select>
          {errors.NombreEgreso && <FieldError id="NombreEgreso-error">{errors.NombreEgreso}</FieldError>}
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Foto">Foto (opcional)</label>
          <input id="Foto" type="file" className={cls("Foto")}
            accept="image/*" onChange={(e)=>convertirImagen(e.target.files)} />
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Fecha">Fecha</label>
            <input
              id="Fecha"
              type="date"
              className={cls("Fecha")}
              name="Fecha"
              value={expense.Fecha ?? ""}
              onChange={handleChange}
              onBlur={onBlurValidate}
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
              value={expense.Mes ?? ""}
              onChange={handleChange}
              onBlur={onBlurValidate}
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
              value={expense.Descripcion ?? ""}
              onChange={handleChange}
              placeholder="(opcional)"
              onBlur={onBlurValidate}
            />
            {/* sin error: opcional */}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Importe">Importe</label>
            <input
              id="Importe"
              type="number"
              step="0.01"
              className={cls("Importe")}
              name="Importe"
              value={expense.Importe ?? ""}
              onChange={handleChange}
              onBlur={onBlurValidate}
              placeholder="0,00"
              aria-invalid={!!errors.Importe}
              aria-describedby={errors.Importe ? "Importe-error" : undefined}
            />
            {errors.Importe && <FieldError id="Importe-error">{errors.Importe}</FieldError>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 bg-sky-600 text-white hover:bg-sky-700 transition disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar gasto" : "Registrar gasto")}
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
