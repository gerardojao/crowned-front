// src/Pages/IncomeByMonths.jsx
import React, { useEffect, useState } from "react";
import api from "../Components/api";
import { Link } from "react-router-dom";
import {
  appendAccountsReceivableSummary,
  fetchAccountsReceivableIncome,
} from "../utils/accountsReceivableIncome";
import {
  Chart as ChartJS, Colors, ArcElement, Tooltip, Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Colors, Tooltip, Legend);

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export default function IncomeByMonth() {
  const [rows, setRows] = useState([]);
  const [showGraph, setShowGraph] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchData = async (nextFrom = from, nextTo = to) => {
    try {
      const url =
        nextFrom && nextTo
          ? `/Ingreso/totalesPorMes?fechaInicio=${nextFrom}&fechaFin=${nextTo}`
          : `/Ingreso/totales`;
      const res = await api.get(url);
      const baseRows = res.data?.data?.[0] ?? [];
      const cxc = await fetchAccountsReceivableIncome({ from: nextFrom, to: nextTo });
      setRows(appendAccountsReceivableSummary(baseRows, cxc));
    } catch (e) {
      console.error(e);
      setRows([]);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const data = {
    labels: rows.map(r => r.cuenta_Ingreso),
    datasets: [{ data: rows.map(r => r.total) }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // permite controlar altura con Tailwind
    plugins: {
      legend: { position: "left" },
      tooltip: { enabled: true },
    },
  };

  const onSubmit = (e) => { e.preventDefault(); fetchData(); };
  const onClear  = () => { setFrom(""); setTo(""); fetchData("", ""); };

  return (
    <>
      {/* Cabecera + volver */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">Ingresos por rango de fecha</h2>
        <Link to="/" className="btn-ghost">Volver</Link>
      </div>

      {/* Filtros */}
      <form className="card p-4 mb-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="label" htmlFor="from">Desde</label>
            <input
              id="from"
              type="date"
              className="input"
              value={from}
              onChange={e=>setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="to">Hasta</label>
            <input
              id="to"
              type="date"
              className="input"
              value={to}
              onChange={e=>setTo(e.target.value)}
            />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button className="btn-emerald" type="submit">Buscar</button>
            <button className="btn-ghost" type="button" onClick={onClear}>Limpiar</button>
          </div>
        </div>
      </form>

      {/* Tabla */}
      <section className="card p-4 mb-4">
        <div className="table-wrap">
          <table className="table">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500">
                <th className="th">Tipo de ingreso</th>
                <th className="th text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i} className="tr">
                  <td className="td">{r.cuenta_Ingreso}</td>
                  <td className="td text-right font-semibold text-emerald-700">
                    {eur.format(r.total ?? 0)}
                  </td>
                </tr>
              ))}
              {rows.length===0 && (
                <tr>
                  <td className="td text-slate-500" colSpan={2}>Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button
            className={showGraph ? "btn-ghost" : "btn-emerald"}
            onClick={()=>setShowGraph(v=>!v)}
          >
            {showGraph ? "Ocultar gráfico" : "Mostrar gráfico"}
          </button>
        </div>
      </section>

      {/* Gráfico */}
      {showGraph && (
        <section className="card p-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Distribución de ingresos</h3>
          <div className="h-[28rem] md:h-[32rem]">
            <Doughnut data={data} options={options} />
          </div>
        </section>
      )}
    </>
  );
}
