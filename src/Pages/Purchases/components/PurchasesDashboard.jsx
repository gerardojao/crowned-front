import Loader from "../../../Components/Loader";
import EmptyState from "./EmptyState";
import { getAccountsPayableDisplay } from "../utils/accountsPayableDisplay";
import { formatCurrency, formatDate } from "../utils/purchaseFormatters";

function isPendingInvoice(invoice) {
  const state = String(invoice?.estado || "").toLowerCase();
  return state.includes("pendiente") || state.includes("parcial");
}

function isInvoiceableNote(note) {
  const state = String(note?.estado || "").toLowerCase();
  return !note?.facturaRecibidaId && !state.includes("facturado");
}

export default function PurchasesDashboard({
  setActiveTab,
  supplierInvoices = [],
  notes = [],
  loadingInvoices = false,
  loadingNotes = false,
}) {
  const pendingInvoices = supplierInvoices
    .filter(isPendingInvoice)
    .slice(0, 5);

  const recentNotes = notes.slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Facturas pendientes
            </h3>
            <p className="text-xs text-slate-500">
              Proximos pagos a proveedores.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("cxp")}
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            Ver cuentas por pagar
          </button>
        </div>

        {loadingInvoices ? (
          <div className="p-6 text-center">
            <Loader />
          </div>
        ) : pendingInvoices.length === 0 ? (
          <EmptyState text="Todavía no hay facturas pendientes de proveedor." />
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingInvoices.map((invoice) => {
              const display = getAccountsPayableDisplay(invoice);

              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {invoice.proveedor}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(invoice.fecha)} · {invoice.numeroFactura || "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      display.isSupplierCredit ? "text-sky-700" : "text-amber-700"
                    }`}
                  >
                    {formatCurrency(display.saldoVisual)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {display.estadoVisual}
                  </p>
                  {display.isSupplierCredit && (
                    <p className="text-[11px] font-semibold text-sky-600">
                      {display.saldoLabel}
                    </p>
                  )}
                </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Últimos albaranes
            </h3>
            <p className="text-xs text-slate-500">
              Entradas recientes de material.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("albaranes")}
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            Ver albaranes
          </button>
        </div>

        {loadingNotes ? (
          <div className="p-6 text-center">
            <Loader />
          </div>
        ) : recentNotes.length === 0 ? (
          <EmptyState text="Todavía no hay albaranes registrados." />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {note.proveedor}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(note.fecha)} · {note.numeroAlbaran || "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {formatCurrency(note.total)}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${
                      isInvoiceableNote(note)
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    {note.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
