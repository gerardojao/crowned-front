
import React, { useEffect, useState } from "react";
import api from "../Components/api";
import { Link } from "react-router-dom";
import Loader from "../Components/Loader";
import { currency } from "../utils/currency";
import { ArrowLeft } from "lucide-react";
import { saveStatementSummary } from "../utils/statementStore";
import KPIs from "../Components/Kpi";

const IVA_RATE = 0.21;
const amountOf = (value) => Number(value ?? 0);
const ivaOf = (value) => amountOf(value) * IVA_RATE;
const totalWithIva = (value) => amountOf(value) + ivaOf(value);

export default function Statement() {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
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

    setIncomes(res?.data?.data?.[0] || []);
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
        cuenta_Egreso: originalName === "Transporte" ? "Gastos casa" : originalName,
      };
    });

    setExpenses(translatedData);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");
      const settingsPromise = api.get("/WorkshopSettings");
      const [, , settingsRes] = await Promise.all([getIncomes(), getExpenses(), settingsPromise]);
      const settings = settingsRes?.data || {};
      setFeatures({
        enableInvoiceExport: settings.enableInvoiceExport ?? settings.EnableInvoiceExport ?? true,
        enableProfitAndLoss: settings.enableProfitAndLoss ?? settings.EnableProfitAndLoss ?? true,
      });
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Error cargando relación");
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
    0
  );
  const totalIncomesIva = totalIncomes * IVA_RATE;
  const totalIncomesWithIva = totalIncomes + totalIncomesIva;

  const totalExpenses = expenses.reduce(
    (s, x) => s + Number(x.total ?? x.Total ?? 0),
    0
  );

  const variableExpenses = expenses.reduce((s, x) => {
    const tipo = String(x.tipoGasto ?? x.TipoGasto ?? "variable").toLowerCase();
    return tipo === "fijo" ? s : s + Number(x.total ?? x.Total ?? 0);
  }, 0);

  const fixedExpenses = expenses.reduce((s, x) => {
    const tipo = String(x.tipoGasto ?? x.TipoGasto ?? "variable").toLowerCase();
    return tipo === "fijo" ? s + Number(x.total ?? x.Total ?? 0) : s;
  }, 0);

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
      setErr("Selecciona fecha desde y fecha hasta para generar el estado de resultados.");
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

      const reportIncomes = incomeRes?.data?.data?.[0] || [];
      const reportExpenses = expenseRes?.data?.data?.[0] || [];

      const reportTotalIncomes = sumRows(reportIncomes);
      const reportVariableExpenses = reportExpenses.reduce((sum, item) => {
        const kind = String(item.tipoGasto ?? item.TipoGasto ?? "variable").toLowerCase();
        return kind === "fijo" ? sum : sum + Number(item.total ?? item.Total ?? 0);
      }, 0);
      const reportFixedExpenses = reportExpenses.reduce((sum, item) => {
        const kind = String(item.tipoGasto ?? item.TipoGasto ?? "variable").toLowerCase();
        return kind === "fijo" ? sum + Number(item.total ?? item.Total ?? 0) : sum;
      }, 0);
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
      setErr(e?.response?.data?.message || e.message || "No se pudo generar el estado de resultados.");
    }
  };

  const downloadInvoices = async () => {
    if (!from || !to) {
      setErr("Selecciona fecha desde y fecha hasta para descargar las facturas.");
      return;
    }

    if (from > to) {
      setErr("La fecha desde no puede ser mayor que la fecha hasta.");
      return;
    }

    try {
      setErr("");
      const res = await api.get("/FacturaEmitida/exportar", {
        params: { fechaInicio: from, fechaFin: to },
        responseType: "blob",
      });

      downloadBlob(res.data, `facturas-${from}-a-${to}.zip`);
      setAppliedFrom(from);
      setAppliedTo(to);
    } catch (e) {
      const message = await readBlobError(e);
      setErr(message || "No se pudieron descargar las facturas del periodo.");
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
                onClick={downloadInvoices}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 transition"
              >
                Descargar facturas
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

      <KPIs from={appliedFrom} to={appliedTo} className="mb-6" />
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
                        {i.cuenta_Ingreso ?? i.Cuenta_Ingreso ?? i.nombre ?? "Sin tipo"}
                      </td>
                      <td className="td text-right text-slate-600">
                        {formatPct(amount, totalIncomes)}
                      </td>
                      <td className="td text-right font-semibold text-emerald-700">
                        {currency(amount)}
                      </td>
                      <td className="td text-right font-semibold text-slate-700">
                        {currency(ivaOf(amount))}
                      </td>
                      <td className="td text-right font-bold text-emerald-700">
                        {currency(totalWithIva(amount))}
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
                    <th className="th text-right" colSpan={2}>Total ingresos</th>
                    <th className="th text-right">{currency(totalIncomes)}</th>
                    <th className="th text-right">{currency(totalIncomesIva)}</th>
                    <th className="th text-right">{currency(totalIncomesWithIva)}</th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Gastos
          </h3>

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
                      {e.cuenta_Egreso ?? e.Cuenta_Egreso ?? e.nombre ?? "Sin tipo"}
                    </td>
                    <td className="td">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                        String(e.tipoGasto ?? e.TipoGasto ?? "variable").toLowerCase() === "fijo"
                          ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}>
                        {String(e.tipoGasto ?? e.TipoGasto ?? "variable").toLowerCase() === "fijo" ? "Fijo" : "Variable"}
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
  return rows.reduce((sum, item) => sum + Number(item.total ?? item.Total ?? 0), 0);
}

function downloadProfitAndLossExcel(report, filename) {
  const incomeRows = report.incomes
    .map((item) => {
      const amount = Number(item.total ?? item.Total ?? 0);
      const name = item.cuenta_Ingreso ?? item.Cuenta_Ingreso ?? item.nombre ?? "Sin tipo";

      return `
        <tr>
          <td class="cell name" colspan="2">${escapeHtmlCell(name)}</td>
          <td class="cell percent">${escapeHtmlCell(formatPct(amount, report.totalIncomes))}</td>
          <td class="cell money positive">${formatMoneyCell(amount)}</td>
          <td class="cell money">${formatMoneyCell(ivaOf(amount))}</td>
          <td class="cell money positive">${formatMoneyCell(totalWithIva(amount))}</td>
        </tr>
      `;
    })
    .join("");

  const expenseRows = report.expenses
    .map((item) => {
      const amount = Number(item.total ?? item.Total ?? 0);
      const name = item.cuenta_Egreso ?? item.Cuenta_Egreso ?? item.nombre ?? "Sin tipo";
      const kind = String(item.tipoGasto ?? item.TipoGasto ?? "variable").toLowerCase() === "fijo"
        ? "Fijo"
        : "Variable";

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
            margin: 0.35in 0.35in 0.35in 0.35in;
            mso-page-orientation: portrait;
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
            width: 840px;
          }
          .title {
            background: #0f172a;
            color: #ffffff;
            font-size: 18px;
            font-weight: 700;
            padding: 12px;
            text-align: center;
          }
          .subtitle {
            background: #e0f2fe;
            color: #075985;
            font-size: 10px;
            padding: 7px;
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
            padding: 7px;
            text-transform: uppercase;
          }
          .head {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            padding: 6px;
            border: 1px solid #cbd5e1;
            font-size: 10px;
          }
          .cell {
            border: 1px solid #dbe3ee;
            padding: 6px;
            font-size: 10px;
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
            padding: 6px;
            font-size: 10px;
          }
          .summary-value {
            border: 1px solid #dbe3ee;
            padding: 6px;
            text-align: right;
            font-weight: 700;
            font-size: 10px;
          }
          .net-label {
            background: #0f172a;
            color: #ffffff;
            border: 1px solid #0f172a;
            font-size: 11px;
            font-weight: 700;
            padding: 8px;
          }
          .net-value {
            background: #0f172a;
            border: 1px solid #0f172a;
            font-size: 11px;
            padding: 8px;
            text-align: right;
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
            <col style="width: 260px;" />
            <col style="width: 90px;" />
            <col style="width: 110px;" />
            <col style="width: 120px;" />
            <col style="width: 120px;" />
            <col style="width: 140px;" />
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
            <td class="net-label" colspan="5">Resultado neto</td>
            <td class="net-value ${resultClass}">${formatMoneyCell(report.netResult)}</td>
          </tr>

          <tr class="spacer"><td colspan="6"></td></tr>

          <tr>
            <td class="section" colspan="6">Ingresos por categoria</td>
          </tr>
          <tr>
            <td class="head" colspan="2">Categoria</td>
            <td class="head">Participacion</td>
            <td class="head">Importe</td>
            <td class="head">IVA</td>
            <td class="head">Total</td>
          </tr>
          ${incomeRows || `<tr><td class="cell" colspan="6">Sin ingresos registrados en el periodo.</td></tr>`}
          <tr>
            <td class="summary-label" colspan="3">Total ingresos</td>
            <td class="summary-value positive">${formatMoneyCell(report.totalIncomes)}</td>
            <td class="summary-value">${formatMoneyCell(ivaOf(report.totalIncomes))}</td>
            <td class="summary-value positive">${formatMoneyCell(totalWithIva(report.totalIncomes))}</td>
          </tr>

          <tr class="spacer"><td colspan="6"></td></tr>

          <tr>
            <td class="section" colspan="6">Gastos por categoria</td>
          </tr>
          <tr>
            <td class="head" colspan="2">Categoria</td>
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

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
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

  return escapeHtmlCell(safeAmount.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function readBlobError(error) {
  const blob = error?.response?.data;
  if (!blob || typeof blob.text !== "function") {
    return error?.response?.data?.message || error?.message || "";
  }

  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed?.message || parsed?.Message || text;
  } catch {
    return error?.message || "";
  }
}

function escapeHtmlCell(value) {
  if (value === null || value === undefined) return "";
  return (typeof value === "number"
    ? value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(value)
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
