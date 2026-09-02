import { useCallback, useEffect, useState } from "react";
import { Download, Landmark, X } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../../../Components/api";
import Loader from "../../../Components/Loader";
import {
  buildAccountsPayableQueryParams,
  emptyAccountsPayableFilters,
} from "../utils/accountsPayableFilters";
import { getAccountsPayableDisplay } from "../utils/accountsPayableDisplay";
import { formatCurrency, formatDate } from "../utils/purchaseFormatters";
import PaymentModal from "./PaymentModal";

const CASH_PAYMENT_VALUE = "cash";

const isRefundableSupplierCredit = (invoice) =>
  invoice?.isSupplierCredit === true &&
  Number(invoice?.saldoAFavor || 0) > 0;

function normalizePendingInvoice(item) {
  const total = Number(item?.total ?? item?.Total ?? 0);
  const importePagado = Number(item?.importePagado ?? item?.ImportePagado ?? 0);
  const saldoPendiente = Number(
    item?.saldoPendiente ??
      item?.SaldoPendiente ??
      total - importePagado,
  );
  const estado = item?.estado ?? item?.Estado ?? "Pendiente de pago";
  const tipoDocumento = item?.tipoDocumento ?? item?.TipoDocumento ?? "Factura";
  const display = getAccountsPayableDisplay({
    total,
    importePagado,
    saldoPendiente,
    estado,
    tipoDocumento,
  });

  return {
    id: item?.id ?? item?.Id,
    fecha: item?.fecha ?? item?.Fecha,
    fechaVencimiento: item?.fechaVencimiento ?? item?.FechaVencimiento ?? null,
    proveedor: item?.proveedorNombre ?? item?.ProveedorNombre ?? "Proveedor no indicado",
    proveedorId: item?.proveedorId ?? item?.ProveedorId ?? null,
    numeroFactura: item?.numeroFactura ?? item?.NumeroFactura ?? "",
    referencia: item?.referencia ?? item?.Referencia ?? "",
    descripcion: item?.descripcion ?? item?.Descripcion ?? "",
    tipoDocumento,
    base: Number(item?.tbase ?? item?.Tbase ?? item?.base ?? item?.Base ?? 0),
    iva: Number(item?.iva ?? item?.Iva ?? 0),
    total,
    importePagado,
    saldoPendiente: display.saldoPendiente,
    saldoVisual: display.saldoVisual,
    saldoLabel: display.saldoLabel,
    saldoAFavor: display.saldoAFavor,
    estado,
    estadoVisual: display.estadoVisual,
    isSupplierCredit: display.isSupplierCredit,
    canRegisterPayment: display.canRegisterPayment,
    raw: item,
  };
}

export default function AccountsPayablePanel({
  bankAccounts,
  onInvoicesChanged,
}) {
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(emptyAccountsPayableFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyAccountsPayableFilters);
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
  const [refundModal, setRefundModal] = useState({
    open: false,
    credit: null,
    bankAccountId: "",
    amount: "",
    fecha: new Date().toISOString().slice(0, 10),
    referencia: "",
    saving: false,
    error: "",
  });

  const setFilterField = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const loadPendingInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/FacturaRecibida/pendientes", {
        params: buildAccountsPayableQueryParams(appliedFilters),
      });
      const list = Array.isArray(res?.data?.data?.[0]) ? res.data.data[0] : [];
      setPendingInvoices(list.map(normalizePendingInvoice));
    } catch {
      setPendingInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadPendingInvoices();
  }, [loadPendingInvoices]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAppliedFilters(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const clearFilters = () => {
    setFilters(emptyAccountsPayableFilters);
    setAppliedFilters(emptyAccountsPayableFilters);
  };

  const openPaymentModal = (invoice, mode = "full") => {
    if (invoice?.isSupplierCredit) return;

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

    if (invoice.isSupplierCredit) {
      alert("Este documento es un abono del proveedor y no se liquida desde CxP.");
      return;
    }

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

  const openRefundModal = (credit) => {
    if (!isRefundableSupplierCredit(credit)) return;

    const mainBank =
      bankAccounts.find((bank) => bank.esPrincipal ?? bank.EsPrincipal) ||
      bankAccounts[0];
    setRefundModal({
      open: true,
      credit,
      bankAccountId: String(mainBank?.id ?? mainBank?.Id ?? ""),
      amount: String(Number(credit.saldoAFavor || 0)),
      fecha: new Date().toISOString().slice(0, 10),
      referencia: "",
      saving: false,
      error: "",
    });
  };

  const closeRefundModal = () => {
    if (refundModal.saving) return;
    setRefundModal((prev) => ({ ...prev, open: false }));
  };

  const confirmRefund = async () => {
    const credit = refundModal.credit;
    const amount = Number(refundModal.amount);
    const available = Number(credit?.saldoAFavor || 0);
    if (!credit || refundModal.saving) return;
    if (!refundModal.bankAccountId) {
      setRefundModal((prev) => ({ ...prev, error: "Selecciona una cuenta bancaria." }));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > available) {
      setRefundModal((prev) => ({
        ...prev,
        error: "El importe debe ser mayor que cero y no superar el saldo disponible.",
      }));
      return;
    }

    try {
      setRefundModal((prev) => ({ ...prev, saving: true, error: "" }));
      const res = await api.post(`/FacturaRecibida/${credit.id}/devoluciones`, {
        importe: amount,
        bankAccountId: Number(refundModal.bankAccountId),
        fecha: refundModal.fecha || null,
        referencia: refundModal.referencia.trim() || null,
      });
      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(res?.data?.message || res?.data?.Message);
      }

      setRefundModal((prev) => ({ ...prev, open: false, saving: false }));
      await loadPendingInvoices();
      await onInvoicesChanged?.();
    } catch (err) {
      setRefundModal((prev) => ({
        ...prev,
        saving: false,
        error:
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo registrar la devolución bancaria.",
      }));
    }
  };

  const totals = pendingInvoices.reduce(
    (acc, item) => {
      acc.base += Number(item.base) || 0;
      acc.iva += Number(item.iva) || 0;
      acc.total += Number(item.total) || 0;
      acc.pagado += Number(item.importePagado) || 0;
      acc.saldo += Number(item.saldoPendiente) || 0;
      acc.saldoAFavor += Number(item.saldoAFavor) || 0;
      return acc;
    },
    { base: 0, iva: 0, total: 0, pagado: 0, saldo: 0, saldoAFavor: 0 },
  );

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cuentas por pagar", {
      pageSetup: {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    worksheet.mergeCells("A1:J1");
    worksheet.getCell("A1").value = "CUENTAS POR PAGAR";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.mergeCells("A2:J2");
    worksheet.getCell("A2").value = `Periodo: ${
      appliedFilters.fechaInicio ? formatDate(appliedFilters.fechaInicio) : "Inicio"
    } - ${appliedFilters.fechaFin ? formatDate(appliedFilters.fechaFin) : "Actualidad"}`;
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    worksheet.mergeCells("A3:J3");
    worksheet.getCell("A3").value = `Fecha de exportacion: ${formatDate(new Date())}`;
    worksheet.getCell("A3").alignment = { horizontal: "center" };

    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      "Fecha",
      "Proveedor",
      "Documento",
      "Referencia",
      "Base",
      "IVA",
      "Total",
      "Pagado",
      "Saldo",
      "Estado",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF334155" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    pendingInvoices.forEach((item) => {
      worksheet.addRow([
        formatDate(item.fecha),
        item.proveedor,
        `${item.tipoDocumento || ""} ${item.numeroFactura || "-"}`,
        item.referencia || "-",
        Number(item.base) || 0,
        Number(item.iva) || 0,
        Number(item.total) || 0,
        Number(item.importePagado) || 0,
        Number(item.saldoVisual) || 0,
        item.fechaVencimiento
          ? `${item.estadoVisual || item.estado || ""} - vence ${formatDate(item.fechaVencimiento)}`
          : item.estadoVisual || item.estado || "",
      ]);
    });

    worksheet.addRow([]);
    const totalRow = worksheet.addRow([
      "",
      "",
      "",
      "TOTALES",
      totals.base,
      totals.iva,
      totals.total,
      totals.pagado,
      totals.saldo,
      "",
    ]);

    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "double" },
      };
    });

    worksheet.columns = [
      { width: 12 },
      { width: 30 },
      { width: 24 },
      { width: 18 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 18 },
    ];

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber >= 5 && colNumber <= 9 ? "right" : "left",
        };
        if (rowNumber > 5) {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        }
        if (colNumber >= 5 && colNumber <= 9 && typeof cell.value === "number") {
          cell.numFmt = "#,##0.00";
        }
      });
    });

    worksheet.views = [{ state: "frozen", ySplit: 5 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `cuentas-por-pagar-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Cuentas por pagar
            </h3>
            <p className="text-sm text-slate-500">
              Facturas recibidas pendientes de pago.
            </p>
          </div>
          <button
            type="button"
            onClick={exportExcel}
            disabled={loading || pendingInvoices.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 md:w-auto"
          >
            <Download size={16} />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_170px_170px_170px_170px_auto] md:items-end">
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Buscar
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilterField("search", event.target.value)}
              placeholder="Documento, referencia, proveedor o descripción"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Factura desde
            </label>
            <input
              type="date"
              value={filters.fechaInicio}
              onChange={(event) =>
                setFilterField("fechaInicio", event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Factura hasta
            </label>
            <input
              type="date"
              value={filters.fechaFin}
              onChange={(event) =>
                setFilterField("fechaFin", event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Vence desde
            </label>
            <input
              type="date"
              value={filters.fechaVencimientoInicio}
              onChange={(event) =>
                setFilterField("fechaVencimientoInicio", event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Vence hasta
            </label>
            <input
              type="date"
              value={filters.fechaVencimientoFin}
              onChange={(event) =>
                setFilterField("fechaVencimientoFin", event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Limpiar
          </button>
        </div>
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
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        item.isSupplierCredit ? "text-sky-700" : "text-amber-700"
                      }`}
                    >
                      <div>{formatCurrency(item.saldoVisual)}</div>
                      <div className="text-[11px] font-semibold text-slate-500">
                        {item.saldoLabel}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                          item.isSupplierCredit
                            ? "bg-sky-50 text-sky-700 ring-sky-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {item.estadoVisual}
                      </span>
                      {item.fechaVencimiento ? (
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          Vence {formatDate(item.fechaVencimiento)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isRefundableSupplierCredit(item) ? (
                        <button
                          type="button"
                          onClick={() => openRefundModal(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
                        >
                          <Landmark size={14} />
                          Registrar devolución
                        </button>
                      ) : item.canRegisterPayment ? (
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
                      ) : (
                        <span className="inline-flex rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                          Sin acciones de pago
                        </span>
                      )}
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
                  <div>{formatCurrency(totals.saldo)}</div>
                  {totals.saldoAFavor > 0 && (
                    <div className="text-[11px] font-semibold text-sky-700">
                      A favor: {formatCurrency(totals.saldoAFavor)}
                    </div>
                  )}
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

      {refundModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-white">
                  <Landmark size={21} />
                </div>
                <h3 className="text-xl font-bold text-slate-950">
                  Registrar devolución bancaria
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Registra el dinero devuelto por el proveedor directamente en el banco.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRefundModal}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
              <p className="text-sm font-bold text-sky-900">
                {refundModal.credit?.proveedor}
              </p>
              <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                <span className="text-sky-700">
                  {refundModal.credit?.tipoDocumento}{" "}
                  {refundModal.credit?.numeroFactura || "-"}
                </span>
                <span className="font-extrabold text-sky-900">
                  Disponible: {formatCurrency(refundModal.credit?.saldoAFavor)}
                </span>
              </div>
            </div>

            {refundModal.error && (
              <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
                {refundModal.error}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Cuenta bancaria de destino
                <select
                  value={refundModal.bankAccountId}
                  onChange={(event) =>
                    setRefundModal((prev) => ({
                      ...prev,
                      bankAccountId: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                >
                  <option value="">Selecciona un banco</option>
                  {bankAccounts.map((bank) => (
                    <option key={bank.id ?? bank.Id} value={bank.id ?? bank.Id}>
                      {bank.nombre ?? bank.Nombre}
                      {(bank.iban ?? bank.Iban) ? ` · ${bank.iban ?? bank.Iban}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Importe devuelto
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={refundModal.credit?.saldoAFavor}
                  value={refundModal.amount}
                  onChange={(event) =>
                    setRefundModal((prev) => ({
                      ...prev,
                      amount: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Fecha de devolución
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={refundModal.fecha}
                  onChange={(event) =>
                    setRefundModal((prev) => ({ ...prev, fecha: event.target.value }))
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Referencia o justificante (opcional)
                <input
                  type="text"
                  maxLength={120}
                  value={refundModal.referencia}
                  onChange={(event) =>
                    setRefundModal((prev) => ({ ...prev, referencia: event.target.value }))
                  }
                  placeholder="Referencia del ingreso bancario"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                />
              </label>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">Entrada en banco</span>
                  <strong className="text-slate-950">
                    {formatCurrency(Number(refundModal.amount || 0))}
                  </strong>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span className="text-slate-600">Saldo a favor restante</span>
                  <strong>
                    {formatCurrency(Math.max(0, Number(refundModal.credit?.saldoAFavor || 0) - Number(refundModal.amount || 0)))}
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRefundModal}
                disabled={refundModal.saving}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRefund}
                disabled={!refundModal.bankAccountId || refundModal.saving}
                className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refundModal.saving ? "Registrando..." : "Registrar devolución"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
