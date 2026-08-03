import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import AccountsPayablePanel from "./components/AccountsPayablePanel";
import MiscExpensesPanel from "./components/MiscExpensesPanel";
import PurchaseBookPanel from "./components/PurchaseBookPanel";
import PurchasesDashboard from "./components/PurchasesDashboard";
import PurchasesTabs from "./components/PurchasesTabs";
import SupplierDeliveryNotesPanel from "./components/SupplierDeliveryNotesPanel";
import SupplierInvoicesPanel from "./components/SupplierInvoicesPanel";
import { useBankAccounts } from "./hooks/useBankAccounts";
import { useDeliveryNotes } from "./hooks/useDeliveryNotes";
import { useSupplierInvoices } from "./hooks/useSupplierInvoices";
import { getAccountsPayableDisplay } from "./utils/accountsPayableDisplay";
import { formatCurrency } from "./utils/purchaseFormatters";

function isSameMonth(value, now = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isPendingState(value) {
  const state = String(value || "").toLowerCase();
  return state.includes("pendiente") || state.includes("parcial");
}

function isCancelled(value) {
  return String(value || "").toLowerCase().includes("anulad");
}

export default function PurchasesModuleScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { bankAccounts } = useBankAccounts();
  const { notes, loadingNotes, loadNotes } = useDeliveryNotes({ pageSize: 100 });
  const {
    supplierInvoices,
    setSupplierInvoices,
    loadingInvoices,
    loadSupplierInvoices,
  } = useSupplierInvoices();

  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeInvoices = supplierInvoices.filter(
      (invoice) => !isCancelled(invoice.estado),
    );

    const pendingInvoices = activeInvoices.filter((invoice) =>
      isPendingState(invoice.estado),
    );

    const overdueCount = pendingInvoices.filter((invoice) => {
      if (!invoice.fecha) return false;
      const date = new Date(invoice.fecha);
      if (Number.isNaN(date.getTime())) return false;
      date.setHours(0, 0, 0, 0);
      return date < today;
    }).length;

    const monthInvoices = activeInvoices.filter((invoice) =>
      isSameMonth(invoice.fecha),
    );

    const pendingTotal = pendingInvoices.reduce(
      (sum, invoice) => sum + getAccountsPayableDisplay(invoice).saldoPendiente,
      0,
    );

    const monthTotal = monthInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0,
    );

    const monthIva = monthInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.iva || 0),
      0,
    );

    return [
      { label: "Pendiente de pago", value: formatCurrency(pendingTotal) },
      { label: "Facturas vencidas", value: String(overdueCount) },
      { label: "Compras del mes", value: formatCurrency(monthTotal) },
      { label: "IVA soportado", value: formatCurrency(monthIva) },
    ];
  }, [supplierInvoices]);

  return (
    <>
      <div className="mt-2 mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Compras</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de facturas recibidas, cuentas por pagar, pagos, albaranes
            y libro de compras.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={18} /> Volver
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {kpis.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur md:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("facturas")}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <Plus size={17} />
              Nueva factura proveedor
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("albaranes")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Plus size={17} />
              Nuevo albarán
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("gastos-varios")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Plus size={17} />
              Nuevo gasto vario
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("libro")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <BookOpen size={17} />
              Libro de compras
            </button>
          </div>
        </div>

        <PurchasesTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="pt-5">
          {activeTab === "dashboard" && (
            <PurchasesDashboard
              setActiveTab={setActiveTab}
              supplierInvoices={supplierInvoices}
              notes={notes}
              loadingInvoices={loadingInvoices}
              loadingNotes={loadingNotes}
            />
          )}

          {activeTab === "facturas" && (
            <SupplierInvoicesPanel
              loadingInvoices={loadingInvoices}
              supplierInvoices={supplierInvoices}
              setSupplierInvoices={setSupplierInvoices}
              bankAccounts={bankAccounts}
              loadSupplierInvoices={loadSupplierInvoices}
            />
          )}

          {activeTab === "cxp" && (
            <AccountsPayablePanel
              bankAccounts={bankAccounts}
              onInvoicesChanged={loadSupplierInvoices}
            />
          )}

          {activeTab === "gastos-varios" && <MiscExpensesPanel />}

          {activeTab === "libro" && (
            <PurchaseBookPanel
              supplierInvoices={supplierInvoices}
              loadingInvoices={loadingInvoices}
            />
          )}

          {activeTab === "albaranes" && (
            <SupplierDeliveryNotesPanel
              onNotesChanged={loadNotes}
              onInvoicesChanged={loadSupplierInvoices}
            />
          )}
        </div>
      </div>
    </>
  );
}
