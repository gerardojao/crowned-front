import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";
import { soloFecha } from "../utils/date";
import { useRef } from "react";
import PurchaseModuleScreen from "./PurchaseModuleScreen";


const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const EMPTY_EXPENSE = {
  Id:"", Foto:"", Fecha:"", Mes:"", Importe:"", IvaPct:"21", NombreEgreso:"", Referencia:"", Descripcion:"", NumeroFactura:"", BankAccountId:"",
};

const VAT_OPTIONS = ["0", "10", "21"];

const calculateTaxBase = (amount, ivaPct) => {
  const total = Number(amount);
  const pct = Number(ivaPct);
  if (!Number.isFinite(total) || total <= 0) return 0;
  if (!Number.isFinite(pct) || pct <= 0) return Math.round(total * 100) / 100;
  return Math.round((total / (1 + pct / 100)) * 100) / 100;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value) || 0);

const splitExpenseReference = (value = "") => {
  const text = String(value || "");
  const separator = " - ";
  const index = text.indexOf(separator);
  if (index <= 0) {
    return { referencia: "", descripcion: text };
  }
  return {
    referencia: text.slice(0, index),
    descripcion: text.slice(index + separator.length),
  };
};

const buildExpenseDescription = (expense) => {
  const referencia = String(expense.Referencia || "").trim();
  const descripcion = String(expense.Descripcion || "").trim();
  return referencia && descripcion
    ? `${referencia} - ${descripcion}`
    : referencia || descripcion || null;
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
  const [bankAccounts, setBankAccounts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // errores por campo
  const [errors, setErrors] = useState({});
  // banner global
  const [notice, setNotice] = useState(null); // { type: 'success'|'error', text: string }

  const [purchasesEnabled, setPurchasesEnabled] = useState(false);
  const [checkingPurchasesModule, setCheckingPurchasesModule] = useState(true);

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

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/WorkshopBankAccounts");
        const banks = Array.isArray(res?.data) ? res.data : [];
        setBankAccounts(banks);
        const main = banks.find((x) => x.esPrincipal ?? x.EsPrincipal) || banks[0];
        const mainId = main?.id ?? main?.Id ?? "";
        if (mainId && !expense?.BankAccountId) {
          setField("BankAccountId", String(mainId));
        }
      } catch {
        setBankAccounts([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Reset en crear; prefill en editar
  useEffect(() => {
    if (!isEdit) {
      setExpense(EMPTY_EXPENSE);
      return;
    }
    const r = record || {};
    const parsedDescription = splitExpenseReference(r.descripcion ?? "");
    setExpense({
      Id: state.id || r.id || "",
      Foto: r.foto ?? "",
      Fecha: r.fecha ? soloFecha(r.fecha) : "",
      Mes: r.mes ?? "",
      Importe: r.importe ?? "",
      NombreEgreso: r.tipoId ?? "",
      Referencia: parsedDescription.referencia,
      Descripcion: parsedDescription.descripcion,
      NumeroFactura: r.numeroFactura ?? r.NumeroFactura ?? "",
      IvaPct: r.ivaPct ?? r.IvaPct ?? "21",
      BankAccountId: r.bankAccountId ?? r.BankAccountId ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  useEffect(() => {
  let alive = true;

  (async () => {
    try {
      setCheckingPurchasesModule(true);

      // Ajusta este endpoint al que tengas para consultar módulos del taller.
      // La idea es que devuelva enableAccountsPayable o EnableAccountsPayable.
      const res = await api.get("/WorkshopSettings");

      const enabled =
        res?.data?.enableAccountsPayable ??
        res?.data?.EnableAccountsPayable ??
        res?.data?.data?.enableAccountsPayable ??
        res?.data?.data?.EnableAccountsPayable ??
        false;

      console.log(res.data);
      

      if (alive) setPurchasesEnabled(Boolean(enabled));
    } catch (err) {
      console.error("No se pudo validar el módulo de compras", err);
      if (alive) setPurchasesEnabled(false);
    } finally {
      if (alive) setCheckingPurchasesModule(false);
    }
  })();

  return () => {
    alive = false;
  };
}, []);

  // --- Validación ---
  const REQUIRED = "Este campo es requerido.";

  const validateField = (name, value) => {
    let msg = "";
    switch (name) {
      case "NombreEgreso":
      case "Fecha":
      case "Descripcion":
        if (!value) msg = REQUIRED;
        break;
      case "BankAccountId":
        if (bankAccounts.length > 1 && !value) msg = REQUIRED;
        break;
      case "Importe":
        if (value === "" || value === null || value === undefined) msg = REQUIRED;
        else if (isNaN(Number(value))) msg = "Formato inválido.";
        else if (Number(value) <= 0) msg = "Debe ser mayor que 0.";
        break;
      default:
        // campos opcionales: Foto
        break;
    }
    setErrors(prev => ({ ...prev, [name]: msg || undefined }));
    return !msg;
  };

  const validateAll = () => {
    const fields = ["NombreEgreso", "Fecha", "Descripcion", "Importe"];
    if (bankAccounts.length > 1) fields.push("BankAccountId");
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
    const firstError = ["NombreEgreso", "Fecha", "Descripcion", "Importe", "BankAccountId"].find(f => next[f]);
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
      const importeBase = calculateTaxBase(expense.Importe, expense.IvaPct);

      if (isEdit) {
        const id = state.id || record?.id;
        await api.put(`/FichaEgreso/detalle/${id}`, {
          fecha: expense.Fecha || null,
          mes: expense.Mes || null,
          nombreEgreso: expense.NombreEgreso ? Number(expense.NombreEgreso) : null,
          descripcion: buildExpenseDescription(expense),
          numeroFactura: expense.NumeroFactura?.trim() || null,
          importe: importeBase,
          ivaPct: Number(expense.IvaPct ?? 21),
          foto: expense.Foto ?? null,
          ...(expense.BankAccountId ? { bankAccountId: Number(expense.BankAccountId) } : {}),
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
        Fecha: expense.Fecha || null,
        Mes: expense.Mes || null,
        Importe: importeBase, // base imponible segun IVA seleccionado
        IvaPct: Number(expense.IvaPct ?? 21),
        NombreEgreso: Number(expense.NombreEgreso), // requerido
        Descripcion: buildExpenseDescription(expense),
        NumeroFactura: expense.NumeroFactura?.trim() || null,
        BankAccountId: expense.BankAccountId ? Number(expense.BankAccountId) : null,
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

  const importeBase = calculateTaxBase(expense.Importe, expense.IvaPct);


if (checkingPurchasesModule) {
  return (
    <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
      Validando módulo de compras...
    </div>
  );
}

if (purchasesEnabled) {
  return <PurchaseModuleScreen />;
}

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {bankAccounts.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="BankAccountId">Banco</label>
              <select
                id="BankAccountId"
                name="BankAccountId"
                className={cls("BankAccountId")}
                value={expense.BankAccountId ?? ""}
                onChange={handleChange}
                onBlur={onBlurValidate}
                aria-invalid={!!errors.BankAccountId}
                aria-describedby={errors.BankAccountId ? "BankAccountId-error" : undefined}
              >
                <option value="">Selecciona...</option>
                {bankAccounts.map((bank) => {
                  const id = bank.id ?? bank.Id;
                  const name = bank.nombre ?? bank.Nombre ?? "Cuenta bancaria";
                  const iban = bank.iban ?? bank.Iban ?? "";
                  return <option key={id} value={id}>{name} - {iban}</option>;
                })}
              </select>
              {errors.BankAccountId && <FieldError id="BankAccountId-error">{errors.BankAccountId}</FieldError>}
            </div>
          )}

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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="NumeroFactura">Nº Factura</label>
            <input
              id="NumeroFactura"
              type="text"
              className={cls("NumeroFactura")}
              name="NumeroFactura"
              value={expense.NumeroFactura ?? ""}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Referencia">Referencia interna</label>
            <input
              id="Referencia"
              type="text"
              className={cls("Referencia")}
              name="Referencia"
              value={expense.Referencia ?? ""}
              onChange={handleChange}
              placeholder="Opcional"
              aria-invalid={!!errors.Referencia}
              aria-describedby={errors.Referencia ? "Referencia-error" : undefined}
            />
            {errors.Referencia && <FieldError id="Referencia-error">{errors.Referencia}</FieldError>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Descripcion">Descripcion</label>
            <input
              id="Descripcion"
              type="text"
              className={cls("Descripcion")}
              name="Descripcion"
              value={expense.Descripcion ?? ""}
              onChange={handleChange}
              placeholder="Recambio amortiguador Fiat"
              onBlur={onBlurValidate}
              required
              aria-invalid={!!errors.Descripcion}
              aria-describedby={errors.Descripcion ? "Descripcion-error" : undefined}
            />
            {errors.Descripcion && <FieldError id="Descripcion-error">{errors.Descripcion}</FieldError>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="Importe">Importe con IVA</label>
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
            {Number(expense.Importe) > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Base gasto: {formatCurrency(importeBase)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="IvaPct">IVA</label>
            <select
              id="IvaPct"
              name="IvaPct"
              className={cls("IvaPct")}
              value={expense.IvaPct ?? "21"}
              onChange={handleChange}
            >
              {VAT_OPTIONS.map((value) => (
                <option key={value} value={value}>{value}%</option>
              ))}
            </select>
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

function SummaryCard({ label, value, detail = "", tone = "slate" }) {
  const color =
    tone === "rose"
      ? "text-rose-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-extrabold ${color}`}>
        {currency(value)}
      </p>
      {detail && <p className="mt-1 text-sm font-semibold text-slate-500">{detail}</p>}
    </div>
  );
}

function FacturaRow({
  factura,
  abonos,
  abonoBanks,
  bankAccounts,
  setAbono,
  setAbonoBank,
  registrarAbono,
}) {
  const id = factura.id ?? factura.Id;
  const estado = factura.estadoCxC ?? factura.EstadoCxC;
  const atraso = daysOverdue(factura.fechaVencimiento ?? factura.FechaVencimiento, estado);
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-3 py-3 font-bold text-slate-900">
        {factura.numeroFactura ?? factura.NumeroFactura}
      </td>
      <td className="px-3 py-3 text-slate-700">
        {factura.cliente ?? factura.Cliente}
      </td>
      <td className="px-3 py-3 font-semibold text-slate-600">
        {factura.matricula ?? factura.Matricula ?? "-"}
      </td>
      <td className="px-3 py-3 text-slate-600">
        {dateOnly(factura.fecha ?? factura.Fecha)}
      </td>
      <td className="px-3 py-3 text-slate-600">
        {dateOnly(factura.fechaVencimiento ?? factura.FechaVencimiento)}
      </td>
      <td className="px-3 py-3 text-right">
        {atraso > 0 ? (
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
            {atraso}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </td>
      <td className="px-3 py-3 text-right font-semibold">
        {currency(factura.totalFactura ?? factura.TotalFactura)}
      </td>
      <td className="px-3 py-3 text-right">
        {currency(factura.totalAbonado ?? factura.TotalAbonado)}
      </td>
      <td className="px-3 py-3 text-right font-bold text-rose-700">
        {currency(factura.saldoPendiente ?? factura.SaldoPendiente)}
      </td>
      <td className="px-3 py-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${badgeClass(estado)}`}
        >
          {estado}
        </span>
      </td>
<td className="px-3 py-3">
  {["Pagada", "Rectificada"].includes(estado) ? (
    <span className="text-xs font-bold text-emerald-700">Completa</span>
  ) : (
    <div className="flex items-center justify-center gap-2">
      <input
        type="number"
        min="0"
        step="0.01"
        value={abonos[id] || ""}
        onChange={(e) => setAbono(id, e.target.value)}
        onBlur={(e) => setAbono(id, amountInput(e.target.value))}
        className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        placeholder="0.00"
      />

      <BankSelect
        value={abonoBanks[id] || ""}
        bankAccounts={bankAccounts}
        onChange={(value) => setAbonoBank(id, value)}
      />

      <button
        type="button"
        onClick={() => registrarAbono(factura)}
        disabled={bankAccounts.length === 0}
        className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60"
      >
        Aplicar
      </button>
    </div>
  )}
</td>
    </tr>
  );
}

function BankSelect({ value, bankAccounts, onChange }) {
  if (bankAccounts.length === 0) {
    return (
      <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
        Sin bancos activos
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-44 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
    >
      <option value="">Banco del abono</option>
      {bankAccounts.map((bank) => {
        const id = bank.id ?? bank.Id;
        const name = bank.nombre ?? bank.Nombre ?? "Cuenta bancaria";
        const iban = bank.iban ?? bank.Iban ?? "";
        return (
          <option key={id} value={id}>
            {iban ? `${name} - ${iban}` : name}
          </option>
        );
      })}
    </select>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
