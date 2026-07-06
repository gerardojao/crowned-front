import { CheckCircle2 } from "lucide-react";

export default function PaymentModal({
  open,
  invoice,
  title = "Marcar factura como pagada",
  confirmLabel = "Marcar pagada",
  fecha,
  bankAccountId,
  amount,
  maxAmount,
  showAmount = false,
  bankAccounts,
  loading,
  onChangeFecha,
  onChangeBank,
  onChangeAmount,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/45"
        onClick={loading ? undefined : onCancel}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {invoice?.proveedor} · {invoice?.numeroFactura}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {showAmount && (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Importe abonado
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount || undefined}
                value={amount}
                onChange={(e) => onChangeAmount?.(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Fecha de pago
            <input
              type="date"
              value={fecha}
              onChange={(e) => onChangeFecha(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Banco *
            <select
              value={bankAccountId}
              onChange={(e) => onChangeBank(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecciona banco</option>
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
          </label>

          {bankAccounts.length === 0 && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
              No hay bancos activos configurados para este taller.
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={loading || bankAccounts.length === 0}
            onClick={onConfirm}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Registrando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
