// src/Pages/ShowIncomes.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import Loader from "../Components/Loader";
import api from "../Components/api";
import {
  appendAccountsReceivableSummary,
  fetchAccountsReceivableIncome,
} from "../utils/accountsReceivableIncome";

import {
  Chart as ChartJS,
  Colors,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "react-chartjs-2";
import { PieChart, Eye, EyeOff, RefreshCw, ArrowLeft } from "lucide-react";

ChartJS.register(ArcElement, Colors, Tooltip, Legend);
ChartJS.register(ChartDataLabels);

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

// Texto en el centro (opcional)
const CenterTextPlugin = {
  id: "centerText",
  afterDraw(chart) {
    const ds = chart.config.data?.datasets?.[0];
    if (!ds) return;
    const total = (ds.data || []).reduce((a, n) => a + n, 0);
    const ctx = chart.ctx;
    const { left, right, top, bottom } = chart.chartArea;
    ctx.save();
    ctx.font = "600 16px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(eur.format(total), (left + right) / 2, (top + bottom) / 2);
    ctx.restore();
  },
};
ChartJS.register(CenterTextPlugin);

export default function ShowIncomes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGraph, setShowGraph] = useState(true);

  const fetchTotals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/Ingreso/totales");
      const arr = Array.isArray(res?.data?.data) ? res.data.data[0] ?? [] : [];
      const cxc = await fetchAccountsReceivableIncome();
      setData(appendAccountsReceivableSummary(Array.isArray(arr) ? arr : [], cxc));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  const totalSum = useMemo(() => data.reduce((a, x) => a + (x.total ?? 0), 0), [data]);

  const palette = ["#10b981", "#0ea5e9", "#f59e0b", "#6366f1", "#ef4444", "#14b8a6", "#a855f7", "#84cc16"];

  const dataInfo = useMemo(
    () => ({
      labels: data.map((i) => i.cuenta_Ingreso),
      datasets: [{ data: data.map((i) => i.total), backgroundColor: data.map((_, i) => palette[i % palette.length]), borderWidth: 0, hoverOffset: 8, spacing: 2 }],
    }),
    [data]
  );

  const isNarrow = typeof window !== "undefined" ? window.innerWidth < 1280 : false;

  const opciones = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: { position: isNarrow ? "bottom" : "right", labels: { boxWidth: 12, usePointStyle: true, padding: 16 } },
        tooltip: { enabled: true },
        color: { enabled: false },
        datalabels: {
          color: "#334155",
          formatter: (v, ctx) => {
            const ds = ctx.chart.config.data.datasets[0].data || [];
            const t = ds.reduce((s, n) => s + n, 0) || 1;
            return `${((v / t) * 100).toFixed(1)}%`;
          },
          font: { weight: "600" },
          anchor: "end",
          align: "end",
          clamp: true,
        },
      },
    }),
    [isNarrow]
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">Ingresos</h2>
        <div className="flex items-center gap-2">
          {/* Mostrar/Ocultar -> azul/ámbar */}
          <button
            onClick={() => setShowGraph((s) => !s)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              ${showGraph ? "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-300" : "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-300"}`}
            title={showGraph ? "Ocultar gráfico" : "Mostrar gráfico"}
          >
            {showGraph ? <EyeOff size={18} /> : <PieChart size={18} />}
            {showGraph ? "Ocultar gráfico" : "Mostrar gráfico"}
          </button>


          {/* Volver -> gris/slate */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
        </div>
      </div>

      {/* Card */}
      <section className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-6">
        {loading ? (
          <Loader />
        ) : (
          <>
            {/* Cuando NO hay gráfico: limitamos ancho y centramos */}
            <div className={showGraph ? "grid grid-cols-1 xl:grid-cols-3 gap-6" : "max-w-5xl mx-auto"}>
              {/* Tabla */}
              <div className={showGraph ? "xl:col-span-2" : ""}>
                <div className="flex items-end justify-between mb-2">
                  <div className="text-sm text-slate-500">Totales por tipo de ingreso</div>
                  <div className="text-sm font-medium text-slate-600">
                    Total: <span className="text-slate-900">{eur.format(totalSum)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-slate-600">
                        <th className="py-2 px-3 font-semibold">Tipo de ingreso</th>
                        <th className="py-2 px-3 font-semibold text-right">Total ingreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.length === 0 ? (
                        <tr>
                          <td className="py-6 px-3 text-slate-500" colSpan={2}>
                            No hay datos disponibles.
                          </td>
                        </tr>
                      ) : (
                        data.map((ing, i) => (
                          <tr key={i} className="border-t border-slate-200/70 hover:bg-slate-50">
                            <td className="py-2 px-3">{ing.cuenta_Ingreso}</td>
                            <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                              {eur.format(ing.total ?? 0)}
                            </td>
                          </tr>
                        ))
                      )}
                      {data.length > 0 && (
                        <tr className="bg-slate-50 border-t border-slate-200/70">
                          <td className="py-2 px-3 font-semibold text-slate-700">Total</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{eur.format(totalSum)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gráfico */}
              {showGraph && (
                <div className="xl:col-span-1">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70">
                    <div className="pointer-events-none absolute inset-x-0 -top-px h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-sky-400" />
                    <div className="h-[28rem] md:h-[32rem] p-4">
                      <Doughnut data={dataInfo} options={opciones} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
