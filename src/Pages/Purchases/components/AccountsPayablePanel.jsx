import { useCallback, useEffect, useState } from "react";
import api from "../../../Components/api";
import Loader from "../../../Components/Loader";
import { formatCurrency, formatDate } from "../utils/purchaseFormatters";
import PaymentModal from "./PaymentModal";

const CASH_PAYMENT_VALUE = "cash";

function normalizePendingInvoice(item) {
  return {
    id: item?.id ?? item?.Id,
    fecha: item?.fecha ?? item?.Fecha,
    proveedor: item?.proveedorNombre ?? item?.ProveedorNombre ?? "Proveedor no indicado",
    numeroFactura: item?.numeroFactura ?? item?.NumeroFactura ?? "",
    referencia: item?.referencia ?? item?.Referencia ?? "",
    descripcion: item?.descripcion ?? item?.Descripcion ?? "",
    tipoDocumento: item?.tipoDocumento ?? item?.TipoDocumento ?? "Factura",
    base: Number(item?.tbase ?? item?.Tbase ?? item?.base ?? item?.Base ?? 0),
    iva: Number(item?.iva ?? item?.Iva ?? 0),
    total: Number(item?.total ?? item?.Total ?? 0),
    importePagado: Number(item?.importePagado ?? item?.ImportePagado ?? 0),
    saldoPendiente: Number(
      item?.saldoPendiente ??
        item?.SaldoPendiente ??
        Number(item?.total ?? item?.Total ?? 0) -
          Number(item?.importePagado ?? item?.ImportePagado ?? 0),
    ),
    estado: item?.estado ?? item?.Estado ?? "Pendiente de pago",
    raw: item,
  };
}

export default function AccountsPayablePanel({
  bankAccounts,
  onInvoicesChanged,
}) {
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    invoice: null,
    fecha: new Date().toISOString().slice(0, 10),
    bankAccountId: "",
    ivaPct: "21",
    amount: "",
    mode: "full",
    loading: false,
  });

  const loadPendingInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/FacturaRecibida/pendientes");
      const list = Array.isArray(res?.data?.data?.[0]) ? res.data.data[0] : [];
      setPendingInvoices(list.map(normalizePendingInvoice));
    } catch {
      setPendingInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingInvoices();
  }, [loadPendingInvoices]);

  const openPaymentModal = (invoice, mode = "full") => {
    const mainBank =
      bankAccounts.find((bank) => bank.esPrincipal ?? bank.EsPrincipal) ||
      bankAccounts[0];
    const defaultBankId = mainBank?.id ?? mainBank?.Id ?? "";

    setPaymentModal({
      open: true,
      invoice,
      fecha: new Date().toISOString().slice(0, 10),
      bankAccountId: String(defaultBankId || ""),
      ivaPct: "21",
      amount: "",
      mode,
      loading: false,
    });
  };

  const closePaymentModal = () => {
    if (paymentModal.loading) return;

    setPaymentModal({
      open: false,
      invoice: null,
      fecha: new Date().toISOString().slice(0, 10),
      bankAccountId: "",
      ivaPct: "21",
      amount: "",
      mode: "full",
      loading: false,
    });
  };

  const confirmPayment = async () => {
    const invoice = paymentModal.invoice;
    if (!invoice || paymentModal.loading) return;

    if (!paymentModal.bankAccountId) {
      alert("Selecciona el metodo de pago.");
      return;
    }

    try {
      setPaymentModal((prev) => ({ ...prev, loading: true }));

      const amount = Number(paymentModal.amount);
      const saldo = Number(invoice.saldoPendiente ?? invoice.total ?? 0);
      if (
        paymentModal.mode === "partial" &&
        (!Number.isFinite(amount) || amount <= 0 || amount > saldo)
      ) {
        throw new Error(
          "El importe abonado debe ser mayor que 0 y no superar el saldo pendiente.",
        );
      }

      const payload = {
        fechaPago: paymentModal.fecha || null,
        bankAccountId:
          paymentModal.bankAccountId === CASH_PAYMENT_VALUE
            ? null
            : Number(paymentModal.bankAccountId),
      };

      const res =
        paymentModal.mode === "partial"
          ? await api.post(`/FacturaRecibida/${invoice.id}/abonos`, {
              ...payload,
              importe: amount,
            })
          : await api.patch(`/FacturaRecibida/${invoice.id}/pagar`, payload);

      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo marcar la factura como pagada.",
        );
      }

      await loadPendingInvoices();
      await onInvoicesChanged?.();
      closePaymentModal();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.response?.data?.detail ||
          err?.message ||
          "No se pudo marcar la factura como pagada.",
      );
      setPaymentModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const totals = pendingInvoices.reduce(
    (acc, item) => {
      acc.base += Number(item.base) || 0;
      acc.iva += Number(item.iva) || 0;
      acc.total += Number(item.total) || 0;
      acc.pagado += Number(item.importePagado) || 0;
      acc.saldo += Number(item.saldoPendiente) || 0;
      return acc;
    },
    { base: 0, iva: 0, total: 0, pagado: 0, saldo: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-bold text-slate-900">
          Cuentas por pagar
        </h3>
        <p className="text-sm text-slate-500">
          Facturas recibidas pendientes de pago.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Referencia</th>
                <th className="px-4 py-3 text-right">Base</th>
                <th className="px-4 py-3 text-right">IVA</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Pagado</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center">
                    <Loader />
                  </td>
                </tr>
              ) : pendingInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No hay facturas pendientes de pago.
                    </p>
                  </td>
                </tr>
              ) : (
                pendingInvoices.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">{formatDate(item.fecha)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.proveedor}
                    </td>
                    <td className="px-4 py-3">
                      {item.tipoDocumento} {item.numeroFactura || "-"}
                    </td>
                    <td className="px-4 py-3">{item.referencia || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.base)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.iva)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.importePagado)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">
                      {formatCurrency(item.saldoPendiente)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openPaymentModal(item, "partial")}
                          className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100"
                        >
                          Pago parcial
                        </button>
                        <button
                          type="button"
                          onClick={() => openPaymentModal(item, "full")}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                        >
                          Liquidar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot className="bg-slate-50">
              <tr>
                <th
                  colSpan={4}
                  className="px-4 py-3 text-right font-bold text-slate-700"
                >
                  Totales
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(totals.base)}
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(totals.iva)}
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(totals.total)}
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(totals.pagado)}
                </th>
                <th className="px-4 py-3 text-right font-bold text-amber-700">
                  {formatCurrency(totals.saldo)}
                </th>
                <th></th>
                <th></th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <PaymentModal
        open={paymentModal.open}
        invoice={paymentModal.invoice}
        title={
          paymentModal.mode === "partial"
            ? "Registrar abono"
            : "Liquidar factura"
        }
        confirmLabel={paymentModal.mode === "partial" ? "Registrar abono" : "Liquidar"}
        fecha={paymentModal.fecha}
        bankAccountId={paymentModal.bankAccountId}
        ivaPct={paymentModal.ivaPct}
        amount={paymentModal.amount}
        maxAmount={paymentModal.invoice?.saldoPendiente}
        showAmount={paymentModal.mode === "partial"}
        bankAccounts={bankAccounts}
        loading={paymentModal.loading}
        onChangeFecha={(fecha) =>
          setPaymentModal((prev) => ({ ...prev, fecha }))
        }
        onChangeBank={(bankAccountId) =>
          setPaymentModal((prev) => ({ ...prev, bankAccountId }))
        }
        onChangeIva={(ivaPct) =>
          setPaymentModal((prev) => ({ ...prev, ivaPct }))
        }
        onChangeAmount={(amount) =>
          setPaymentModal((prev) => ({ ...prev, amount }))
        }
        onCancel={closePaymentModal}
        onConfirm={confirmPayment}
      />
    </div>
  );
}
