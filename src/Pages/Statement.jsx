import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../Components/api";
import { Link } from "react-router-dom";
import Loader from "../Components/Loader";
import { currency } from "../utils/currency";
import { ArrowLeft } from "lucide-react";
import { saveStatementSummary } from "../utils/statementStore";
import KPIs from "../Components/Kpi";
import {
  appendAccountsReceivableSummary,
  fetchAccountsReceivableIncome,
  incomeIvaAmount,
  incomeTotalAmount,
} from "../utils/accountsReceivableIncome";
import {
  appendAccountsPayableSummary,
  fetchAccountsPayableExpense,
} from "../utils/accountsPayableExpense";
import {
  aggregateExpenseRows,
  aggregateIncomeRows,
  expenseCategoryName,
  incomeCategoryName,
} from "../utils/profitAndLossRows";

const IVA_RATE = 0.21;
const amountOf = (value) => Number(value ?? 0);
const ivaOf = (value) => amountOf(value) * IVA_RATE;
const totalWithIva = (value) => amountOf(value) + ivaOf(value);
const incomeIvaOf = (item, value) =>
  incomeIvaAmount(item, amountOf(value), IVA_RATE);
const incomeTotalWithIva = (item, value) =>
  incomeTotalAmount(item, amountOf(value), IVA_RATE);
const normalizeExpenseKind = (value) =>
  String(value ?? "variable")
    .trim()
    .toLowerCase() === "fijo"
    ? "fijo"
    : "variable";
const expenseKindOf = (item) =>
  normalizeExpenseKind(item?.tipoGasto ?? item?.TipoGasto);
const isFixedExpense = (item) => expenseKindOf(item) === "fijo";
const expenseKindLabel = (item) => (isFixedExpense(item) ? "Fijo" : "Variable");
const sumExpensesByKind = (rows, kind) =>
  rows.reduce((sum, item) => {
    return expenseKindOf(item) === kind
      ? sum + Number(item.total ?? item.Total ?? 0)
      : sum;
  }, 0);

export default function Statement() {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingInvoices, setExportingInvoices] = useState(false);
  const [err, setErr] = useState("");
  const [features, setFeatures] = useState({
    enableInvoiceExport: true,
    enableProfitAndLoss: true,
  });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const hasRange = !!appliedFrom && !!appliedTo;

  const getIncomes = async () => {
    const res = hasRange
      ? await api.get("/Ingreso/totalesPorMes", {
          params: { fechaInicio: appliedFrom, fechaFin: appliedTo },
        })
      : await api.get("/Ingreso/totales");

    const cxc = await fetchAccountsReceivableIncome({
      from: appliedFrom,
      to: appliedTo,
    });
    setIncomes(
      aggregateIncomeRows(
        appendAccountsReceivableSummary(res?.data?.data?.[0] || [], cxc),
      ),
    );
  };

  const getExpenses = async () => {
    const res = hasRange
      ? await api.get("/Egreso/totalesPorMes", {
          params: { fechaInicio: appliedFrom, fechaFin: appliedTo },
        })
      : await api.get("/Egreso/totales");

    const rawData = res?.data?.data?.[0] || [];

    const translatedData = rawData.map((item) => {
      const originalName =
        item.cuenta_Egreso ??
        item.Cuenta_Egreso ??
        item.nombre ??
        item.nombreEgreso;

      return {
        ...item,
        cuenta_Egreso:
          originalName === "Transporte" ? "Gastos casa" : originalName,
      };
    });

    const cxp = await fetchAccountsPayableExpense({
      from: appliedFrom,
      to: appliedTo,
    });

    setExpenses(
      aggregateExpenseRows(appendAccountsPayableSummary(translatedData, cxp)),
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");
      const settingsPromise = api.get("/WorkshopSettings");
      const [, , settingsRes] = await Promise.all([
        getIncomes(),
        getExpenses(),
        settingsPromise,
      ]);
      const settings = settingsRes?.data || {};
      setFeatures({
        enableInvoiceExport:
          settings.enableInvoiceExport ?? settings.EnableInvoiceExport ?? true,
        enableProfitAndLoss:
          settings.enableProfitAndLoss ?? settings.EnableProfitAndLoss ?? true,
      });
    } catch (e) {
      setErr(
        e?.response?.data?.message || e.message || "Error cargando relación",
      );
      setIncomes([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [appliedFrom, appliedTo]);

  const totalIncomes = incomes.reduce(
    (s, x) => s + Number(x.total ?? x.Total ?? 0),
    0,
  );
  const totalIncomesIva = incomes.reduce(
    (s, x) => s + incomeIvaOf(x, x.total ?? x.Total ?? 0),
    0,
  );
  const totalIncomesWithIva = incomes.reduce(
    (s, x) => s + incomeTotalWithIva(x, x.total ?? x.Total ?? 0),
    0,
  );

  const totalExpenses = expenses.reduce(
    (s, x) => s + Number(x.total ?? x.Total ?? 0),
    0,
  );

  const variableExpenses = sumExpensesByKind(expenses, "variable");
  const fixedExpenses = sumExpensesByKind(expenses, "fijo");

  const grossProfit = totalIncomes - variableExpenses;
  const operatingProfit = grossProfit - fixedExpenses;
  const balance = totalIncomes - totalExpenses;

  useEffect(() => {
    if (loading) return;

    saveStatementSummary({
      from: appliedFrom || null,
      to: appliedTo || null,
      totalIngresos: totalIncomes,
      totalEgresos: totalExpenses,
      balance,
      ts: Date.now(),
    });
  }, [loading, appliedFrom, appliedTo, totalIncomes, totalExpenses, balance]);

  const applyFilter = () => {
    if (!from || !to) {
      setErr("Debes seleccionar fecha desde y fecha hasta.");
      return;
    }

    if (from > to) {
      setErr("La fecha desde no puede ser mayor que la fecha hasta.");
      return;
    }

    setErr("");
    setAppliedFrom(from);
    setAppliedTo(to);
  };

  const clearFilter = () => {
    setFrom("");
    setTo("");
    setAppliedFrom("");
    setAppliedTo("");
    setErr("");
  };

  const generateProfitAndLoss = async () => {
    if (!from || !to) {
      setErr(
        "Selecciona fecha desde y fecha hasta para generar el estado de resultados.",
      );
      return;
    }

    if (from > to) {
      setErr("La fecha desde no puede ser mayor que la fecha hasta.");
      return;
    }

    try {
      setErr("");

      const [incomeRes, expenseRes] = await Promise.all([
        api.get("/Ingreso/totalesPorMes", {
          params: { fechaInicio: from, fechaFin: to },
        }),
        api.get("/Egreso/totalesPorMes", {
          params: { fechaInicio: from, fechaFin: to },
        }),
      ]);

      const cxc = await fetchAccountsReceivableIncome({ from, to });
      const cxp = await fetchAccountsPayableExpense({ from, to });
      const reportIncomes = aggregateIncomeRows(
        appendAccountsReceivableSummary(incomeRes?.data?.data?.[0] || [], cxc),
      );
      const reportExpenses = aggregateExpenseRows(
        appendAccountsPayableSummary(expenseRes?.data?.data?.[0] || [], cxp),
      );

      const reportTotalIncomes = sumRows(reportIncomes);
      const reportTotalIncomesIva = sumIncomeIva(reportIncomes);
      const reportTotalIncomesWithIva = sumIncomeWithIva(reportIncomes);
      const reportVariableExpenses = sumExpensesByKind(
        reportExpenses,
        "variable",
      );
      const reportFixedExpenses = sumExpensesByKind(reportExpenses, "fijo");
      const reportTotalExpenses = reportVariableExpenses + reportFixedExpenses;
      const reportGrossProfit = reportTotalIncomes - reportVariableExpenses;
      const reportNetResult = reportGrossProfit - reportFixedExpenses;

      downloadProfitAndLossExcel(
        {
          from,
          to,
          incomes: reportIncomes,
          expenses: reportExpenses,
          totalIncomes: reportTotalIncomes,
          totalIncomesIva: reportTotalIncomesIva,
          totalIncomesWithIva: reportTotalIncomesWithIva,
          variableExpenses: reportVariableExpenses,
          fixedExpenses: reportFixedExpenses,
          totalExpenses: reportTotalExpenses,
          grossProfit: reportGrossProfit,
          netResult: reportNetResult,
        },
        `estado-resultados-${from}-a-${to}.xls`,
      );
      setAppliedFrom(from);
      setAppliedTo(to);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e.message ||
          "No se pudo generar el estado de resultados.",
      );
    }
  };

  const exportInvoicesForAccounting = async () => {
    if (!from || !to) {
      setErr(
        "Selecciona fecha desde y fecha hasta para exportar las facturas.",
      );
      return;
    }

    if (from > to) {
      setErr("La fecha desde no puede ser mayor que la fecha hasta.");
      return;
    }

    try {
      setErr("");
      setExportingInvoices(true);

      const firstRes = await api.get("/FacturaEmitida", {
        params: {
          fechaInicio: from,
          fechaFin: to,
          page: 1,
          pageSize: 100,
        },
      });
      const firstRows = Array.isArray(firstRes.data?.data)
        ? firstRes.data.data
        : [];
      const totalPages = Math.max(1, Number(firstRes.data?.totalPages ?? 1));
      const remainingResponses = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          api.get("/FacturaEmitida", {
            params: {
              fechaInicio: from,
              fechaFin: to,
              page: index + 2,
              pageSize: 100,
            },
          }),
        ),
      );
      const invoices = remainingResponses.reduce(
        (all, response) =>
          all.concat(
            Array.isArray(response.data?.data) ? response.data.data : [],
          ),
        firstRows,
      );

      if (invoices.length === 0) {
        setErr("No hay facturas en el periodo seleccionado.");
        return;
      }

      const metadata = firstRes.data?.reportMetadata ?? {};
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "ZagaPro";
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet("Facturas", {
        views: [{ state: "frozen", ySplit: 5 }],
        pageSetup: {
          paperSize: 9,
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
      });

      worksheet.mergeCells("A1:O1");
      worksheet.getCell("A1").value = "EXPORTACION DE FACTURAS PARA CONTABILIDAD";
      worksheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      worksheet.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF334155" },
      };
      worksheet.getCell("A1").alignment = { horizontal: "center" };

      worksheet.mergeCells("A2:O2");
      worksheet.getCell("A2").value = [
        metadata.issuerName,
        metadata.issuerNif ? `NIF: ${metadata.issuerNif}` : "",
      ].filter(Boolean).join(" - ");
      worksheet.getCell("A2").alignment = { horizontal: "center" };

      worksheet.mergeCells("A3:O3");
      worksheet.getCell("A3").value = `Periodo: ${from} a ${to}`;
      worksheet.getCell("A3").alignment = { horizontal: "center" };
      worksheet.addRow([]);

      const headers = [
        "Fecha",
        "Nº factura",
        "Cliente",
        "NIF",
        "Origen",
        "Tipo",
        "Factura rectificada",
        "Matrícula",
        "Base imponible",
        "IVA",
        "Total",
        "Forma de pago",
        "Estado de cobro",
        "Saldo pendiente",
        "Orden de trabajo",
      ];
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF475569" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      invoices.forEach((invoice) => {
        worksheet.addRow([
          invoice.date ? new Date(invoice.date) : null,
          invoice.invoiceNumber || "",
          invoice.customerName || "",
          invoice.nif || "",
          invoiceOriginLabel(invoice.origin),
          invoiceTypeLabel(invoice),
          invoice.originalInvoiceNumber || "",
          invoice.matricula || "",
          Number(invoice.baseAmount || 0),
          Number(invoice.ivaAmount || 0),
          Number(invoice.totalAmount || 0),
          invoice.tipoPago || "",
          invoice.estadoCxC || "",
          Number(invoice.saldoPendiente || 0),
          invoice.idOrdenTrabajo || "",
        ]);
      });

      const totalRow = worksheet.addRow([
        "", "", "", "", "", "", "", "TOTALES",
        invoices.reduce((sum, item) => sum + Number(item.baseAmount || 0), 0),
        invoices.reduce((sum, item) => sum + Number(item.ivaAmount || 0), 0),
        invoices.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
        "", "",
        invoices.reduce((sum, item) => sum + Number(item.saldoPendiente || 0), 0),
        "",
      ]);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" },
        };
      });

      worksheet.columns = [
        { width: 13 }, { width: 20 }, { width: 32 }, { width: 17 },
        { width: 14 }, { width: 17 }, { width: 21 }, { width: 15 },
        { width: 17 }, { width: 14 }, { width: 16 }, { width: 18 },
        { width: 18 }, { width: 18 }, { width: 18 },
      ];
      worksheet.autoFilter = { from: "A5", to: "O5" };
      worksheet.getColumn(1).numFmt = "dd/mm/yyyy";
      [9, 10, 11, 14].forEach((columnNumber) => {
        worksheet.getColumn(columnNumber).numFmt = '#,##0.00 [$€-es-ES]';
      });
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < 5) return;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
          cell.alignment = { vertical: "middle" };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `facturas-contabilidad-${from}-a-${to}.xlsx`,
      );

      setAppliedFrom(from);
      setAppliedTo(to);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo exportar la información contable de las facturas.",
      );
    } finally {
      setExportingInvoices(false);
    }
  };

  if (loading) {
    return (
      <section className="card p-4">
        <Loader />
      </section>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Relación de Ingresos y Gastos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {hasRange
              ? `Mostrando resultados desde ${appliedFrom} hasta ${appliedTo}`
              : "Mostrando totales generales"}
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
      </div>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Filtro por fechas
            </h3>
            <p className="text-sm text-slate-500">
              Por defecto se muestran los totales generales.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_160px_auto_auto_auto_auto]">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={applyFilter}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-slate-700 text-white hover:bg-slate-800 transition"
            >
              Filtrar
            </button>

            <button
              type="button"
              onClick={clearFilter}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
            >
              Limpiar
            </button>

            {features.enableProfitAndLoss && (
              <button
                type="button"
                onClick={generateProfitAndLoss}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition"
              >
                Generar estado
              </button>
            )}

            {features.enableInvoiceExport && (
              <button
                type="button"
                onClick={exportInvoicesForAccounting}
                disabled={exportingInvoices}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exportingInvoices
                  ? "Exportando..."
                  : "Exportar facturas para contabilidad"}
              </button>
            )}
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-xl bg-rose-50 text-rose-700 px-3 py-2 text-sm">
            {err}
          </div>
        )}
      </section>

      <KPIs
        from={appliedFrom}
        to={appliedTo}
        className="mb-6"
        totalsOverride={{
          ingresos: totalIncomesWithIva,
          gastos: totalExpenses,
        }}
      />
      <section className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <Link
          to="/register-income"
          className="rounded-2xl bg-emerald-600 text-white px-4 py-3 text-center font-semibold hover:bg-emerald-700 transition"
        >
          Nuevo ingreso
        </Link>

        <Link
          to="/ingresos-detalle"
          className="rounded-2xl bg-white text-emerald-700 px-4 py-3 text-center font-semibold ring-1 ring-emerald-200 hover:bg-emerald-50 transition"
        >
          Detalle ingresos
        </Link>

        <Link
          to="/register-expense"
          className="rounded-2xl bg-rose-600 text-white px-4 py-3 text-center font-semibold hover:bg-rose-700 transition"
        >
          Nuevo gasto
        </Link>

        <Link
          to="/egresos-detalle"
          className="rounded-2xl bg-white text-rose-700 px-4 py-3 text-center font-semibold ring-1 ring-rose-200 hover:bg-rose-50 transition"
        >
          Detalle gastos
        </Link>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Ingresos
          </h3>

          <div className="table-wrap">
            <table className="table">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="th">Tipo</th>
                  <th className="th text-right">Participación</th>
                  <th className="th text-right">Importe</th>
                  <th className="th text-right">IVA</th>
                  <th className="th text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {incomes.map((i, idx) => {
                  const amount = amountOf(i.total ?? i.Total);

                  return (
                    <tr key={idx} className="tr">
                      <td className="td">
                        {incomeCategoryName(i)}
                      </td>
                      <td className="td text-right text-slate-600">
                        {formatPct(amount, totalIncomes)}
                      </td>
                      <td className="td text-right font-semibold text-emerald-700">
                        {currency(amount)}
                      </td>
                      <td className="td text-right font-semibold text-slate-700">
                        {currency(incomeIvaOf(i, amount))}
                      </td>
                      <td className="td text-right font-bold text-emerald-700">
                        {currency(incomeTotalWithIva(i, amount))}
                      </td>
                    </tr>
                  );
                })}

                {incomes.length === 0 && (
                  <tr>
                    <td className="td text-slate-500" colSpan={5}>
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
              {incomes.length > 0 && (
                <tfoot className="bg-slate-50">
                  <tr>
                    <th className="th text-right" colSpan={2}>
                      Total ingresos
                    </th>
                    <th className="th text-right">{currency(totalIncomes)}</th>
                    <th className="th text-right">
                      {currency(totalIncomesIva)}
                    </th>
                    <th className="th text-right">
                      {currency(totalIncomesWithIva)}
                    </th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Gastos</h3>

          <div className="table-wrap">
            <table className="table">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="th">Tipo</th>
                  <th className="th">Clasificación</th>
                  <th className="th text-right">Participación</th>
                  <th className="th text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((e, idx) => (
                  <tr key={idx} className="tr">
                    <td className="td">
                      {expenseCategoryName(e)}
                    </td>
                    <td className="td">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                          isFixedExpense(e)
                            ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {expenseKindLabel(e)}
                      </span>
                    </td>
                    <td className="td text-right text-slate-600">
                      {formatPct(e.total ?? e.Total ?? 0, totalExpenses)}
                    </td>
                    <td className="td text-right font-semibold text-rose-700">
                      {currency(e.total ?? e.Total ?? 0)}
                    </td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <tr>
                    <td className="td text-slate-500" colSpan={4}>
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

function formatPct(value, total) {
  const amount = Number(value || 0);
  const base = Number(total || 0);
  if (base <= 0) return "0,00%";
  return `${((amount / base) * 100).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function sumRows(rows) {
  return rows.reduce(
    (sum, item) => sum + Number(item.total ?? item.Total ?? 0),
    0,
  );
}

function sumIncomeIva(rows) {
  return rows.reduce(
    (sum, item) => sum + incomeIvaOf(item, item.total ?? item.Total ?? 0),
    0,
  );
}

function sumIncomeWithIva(rows) {
  return rows.reduce(
    (sum, item) =>
      sum + incomeTotalWithIva(item, item.total ?? item.Total ?? 0),
    0,
  );
}

function downloadProfitAndLossExcel(report, filename) {
  const incomeRows = report.incomes
    .map((item) => {
      const amount = Number(item.total ?? item.Total ?? 0);
      const name = incomeCategoryName(item);

      return `
        <tr>
          <td class="cell name" colspan="2">${escapeHtmlCell(name)}</td>
          <td class="cell percent">${escapeHtmlCell(formatPct(amount, report.totalIncomes))}</td>
          <td class="cell money positive">${formatMoneyCell(amount)}</td>
          <td class="cell money">${formatMoneyCell(incomeIvaOf(item, amount))}</td>
          <td class="cell money positive">${formatMoneyCell(incomeTotalWithIva(item, amount))}</td>
        </tr>
      `;
    })
    .join("");

  const expenseRows = report.expenses
    .map((item) => {
      const amount = Number(item.total ?? item.Total ?? 0);
      const name = expenseCategoryName(item);
      const kind = expenseKindLabel(item);

      return `
        <tr>
          <td class="cell name" colspan="2">${escapeHtmlCell(name)}</td>
          <td class="cell center ${kind === "Fijo" ? "fixed" : "variable"}">${kind}</td>
          <td class="cell percent">${escapeHtmlCell(formatPct(amount, report.totalExpenses))}</td>
          <td class="cell money negative" colspan="2">${formatMoneyCell(amount)}</td>
        </tr>
      `;
    })
    .join("");

  const resultClass = report.netResult >= 0 ? "positive" : "negative";
  const generatedAt = new Date().toLocaleString("es-ES");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Estado de Resultado</x:Name>
                <x:WorksheetOptions>
                  <x:FitToPage/>
                  <x:Print>
                    <x:FitWidth>1</x:FitWidth>
                    <x:FitHeight>0</x:FitHeight>
                  </x:Print>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          @page {
              margin: 0.25in;
              mso-page-orientation: landscape;
          }
          body {
            font-family: Arial, sans-serif;
            color: #1f2937;
            background: #ffffff;
            margin: 0;
          }
          table {
            border-collapse: collapse;
          }
          .sheet {
            table-layout: fixed;
            width: 100%;
          }
.title {
  background: #0f172a;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  padding: 8px;
  text-align: center;
}
.subtitle {
  background: #e0f2fe;
  color: #075985;
  font-size: 9px;
  padding: 5px;
  text-align: center;
}
          .spacer td {
            height: 10px;
            border: none;
          }
.section {
  background: #334155;
  color: #ffffff;
  font-weight: 700;
  padding: 5px;
  text-transform: uppercase;
  font-size: 9px;
}
.head {
  background: #f1f5f9;
  color: #334155;
  font-weight: 700;
  padding: 5px;
  border: 1px solid #cbd5e1;
  font-size: 9px;
  text-align: center;
}
    .cell {
  border: 1px solid #dbe3ee;
  padding: 5px;
  font-size: 9px;
}
          .name {
            color: #111827;
            font-weight: 600;
            white-space: normal;
            word-wrap: break-word;
          }
          .center {
            text-align: center;
          }
          .percent,
          .money {
            text-align: right;
          }
          .money {
            mso-number-format: "0.00";
            white-space: nowrap;
          }
          .positive {
            color: #047857;
            font-weight: 700;
          }
          .negative {
            color: #be123c;
            font-weight: 700;
          }
          .fixed {
            background: #eef2ff;
            color: #3730a3;
            font-weight: 700;
          }
          .variable {
            background: #fff7ed;
            color: #9a3412;
            font-weight: 700;
          }
.summary-label {
  background: #f8fafc;
  border: 1px solid #dbe3ee;
  color: #475569;
  font-weight: 700;
  padding: 5px;
  font-size: 9px;
}
.summary-value {
  border: 1px solid #dbe3ee;
  padding: 5px;
  text-align: right;
  font-weight: 700;
  font-size: 9px;
  white-space: nowrap;
}
.net-label {
  background: #0f172a;
  color: #ffffff;
  border: 1px solid #0f172a;
  font-size: 10px;
  font-weight: 700;
  padding: 6px;
}
.net-value {
  background: #0f172a;
  border: 1px solid #0f172a;
  font-size: 10px;
  padding: 6px;
  text-align: right;
  white-space: nowrap;
}
          .note {
            color: #64748b;
            font-size: 9px;
            padding: 6px;
          }
        </style>
      </head>
      <body>
        <table class="sheet">
          <colgroup>
              <col style="width: 32%;" />
              <col style="width: 13%;" />
              <col style="width: 13%;" />
              <col style="width: 14%;" />
              <col style="width: 14%;" />
              <col style="width: 14%;" />
          </colgroup>
          <tr>
            <td class="title" colspan="6">Estado de Ganancias y Perdidas</td>
          </tr>
          <tr>
            <td class="subtitle" colspan="6">
              Periodo: ${escapeHtmlCell(report.from)} al ${escapeHtmlCell(report.to)} | Generado: ${escapeHtmlCell(generatedAt)}
            </td>
          </tr>
          <tr class="spacer"><td colspan="6"></td></tr>

          <tr>
            <td class="section" colspan="6">Resumen ejecutivo</td>
          </tr>
          <tr>
            <td class="summary-label" colspan="5">Ingresos totales</td>
            <td class="summary-value positive">${formatMoneyCell(report.totalIncomes)}</td>
          </tr>
          <tr>
            <td class="summary-label" colspan="5">Gastos variables</td>
            <td class="summary-value negative">${formatMoneyCell(report.variableExpenses)}</td>
          </tr>
          <tr>
            <td class="summary-label" colspan="5">Ganancia bruta</td>
            <td class="summary-value ${report.grossProfit >= 0 ? "positive" : "negative"}">${formatMoneyCell(report.grossProfit)}</td>
          </tr>
          <tr>
            <td class="summary-label" colspan="5">Gastos fijos</td>
            <td class="summary-value negative">${formatMoneyCell(report.fixedExpenses)}</td>
          </tr>
          <tr>
            <td class="summary-label" colspan="5">Total gastos</td>
            <td class="summary-value negative">${formatMoneyCell(report.totalExpenses)}</td>
          </tr>
          <tr>
            <td className="net-label" colSpan="5">
                ${report.netResult > 0
                    ? "Beneficio neto"
                    : report.netResult < 0
                        ? "Pérdida neta"
                        : "Resultado neto"}
            </td>
            <td class="net-value ${resultClass}">${formatMoneyCell(report.netResult)}</td>
          </tr>

          <tr class="spacer"><td colspan="6"></td></tr>

          <tr>
            <td class="section" colspan="6">Ingresos por categoría</td>
          </tr>
          <tr>
            <td class="head" colspan="2">Categoría</td>
            <td class="head">Participacion</td>
            <td class="head">Importe</td>
            <td class="head">IVA</td>
            <td class="head">Total</td>
          </tr>
          ${incomeRows || `<tr><td class="cell" colspan="6">Sin ingresos registrados en el periodo.</td></tr>`}
          <tr>
            <td class="summary-label" colspan="3">Total ingresos</td>
            <td class="summary-value positive">${formatMoneyCell(report.totalIncomes)}</td>
            <td class="summary-value">${formatMoneyCell(report.totalIncomesIva ?? ivaOf(report.totalIncomes))}</td>
            <td class="summary-value positive">${formatMoneyCell(report.totalIncomesWithIva ?? totalWithIva(report.totalIncomes))}</td>
          </tr>

          <tr class="spacer"><td colspan="6"></td></tr>

          <tr>
            <td class="section" colspan="6">Gastos por categoría</td>
          </tr>
          <tr>
            <td class="head" colspan="2">Categoría</td>
            <td class="head">Clasificacion</td>
            <td class="head">Participacion</td>
            <td class="head" colspan="2">Importe</td>
          </tr>
          ${expenseRows || `<tr><td class="cell" colspan="6">Sin gastos registrados en el periodo.</td></tr>`}
          <tr>
            <td class="summary-label" colspan="4">Total gastos</td>
            <td class="summary-value negative" colspan="2">${formatMoneyCell(report.totalExpenses)}</td>
          </tr>

          <tr class="spacer"><td colspan="6"></td></tr>
          <tr>
            <td class="note" colspan="6">
              Los importes se muestran en euros. Este archivo se genera desde ZagaPro con la informacion registrada para el rango seleccionado.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatMoneyCell(value) {
  const amount = Number(value || 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return escapeHtmlCell(
    safeAmount.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  );
}

function invoiceOriginLabel(origin) {
  const labels = {
    workshop: "Taller",
    sparePart: "Recambio",
    rapel: "Rápel",
    noVat: "Sin IVA",
  };

  return labels[origin] || origin || "";
}

function invoiceTypeLabel(invoice) {
  if (invoice.isRectification) return "Rectificativa";

  const labels = {
    Recambio: "Recambio",
    Rapel: "Rápel",
    SinIva: "Sin IVA",
    Normal: "Normal",
  };

  return labels[invoice.tipoFactura] || "Normal";
}

function escapeHtmlCell(value) {
  if (value === null || value === undefined) return "";
  return (
    typeof value === "number"
      ? value.toLocaleString("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : String(value)
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
