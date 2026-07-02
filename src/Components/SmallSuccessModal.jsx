import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export default function SmallSuccessModal({
  open,
  title = "Listo",
  message,
  onClose,
  variant = "success",
}) {
  if (!open || !message) return null;

  const isWarning = variant === "warning";
  const Icon = isWarning ? AlertTriangle : CheckCircle2;
  const iconClass = isWarning
    ? "bg-amber-50 text-amber-600"
    : "bg-emerald-50 text-emerald-600";

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/20 px-4 pt-24">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-full p-2 ${iconClass}`}>
            <Icon size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-600">{message}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
