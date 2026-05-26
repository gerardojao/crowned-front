// // src/Pages/Statement.jsx
// import React, { useEffect, useState } from "react";
// import api from "../Components/api";
// import { Link } from "react-router-dom";
// import Loader from "../Components/Loader";
// import { currency } from "../utils/currency";
// import { ArrowLeft } from "lucide-react";
// import { saveStatementSummary } from "../utils/statementStore";
// import KPIs from "../Components/Kpi";

// export default function Statement() {
//   const [incomes, setIncomes] = useState([]);   // [{ cuenta_Ingreso/ Cuenta_Ingreso, total/Total }, ...]
//   const [expenses, setExpenses] = useState([]); // [{ cuenta_Egreso / Cuenta_Egreso, total/Total }, ...]
//   const [loading, setLoading] = useState(true);

//   const getIncomes = async () => {
//     const res = await api.get("/Ingreso/totales");
//     // El backend devuelve en data[0]
//     setIncomes(res?.data?.data?.[0] || []);
//   };

//   const getExpenses = async () => {
//     const NAME_MAP = {
//     "Transporte": "Gastos Casa",   
//   };
//     const res = await api.get("/Egreso/totales");
//     const rawData = res?.data?.data?.[0] || [];
//     const translatedData = rawData.map(item => {     
//       const originalName = item.nombre ?? item.nombreEgreso; 
      
//       console.log(originalName);
       
//       return {
//         ...item,
//         nombre: NAME_MAP[originalName] || originalName 
//       }
//       });
//     setExpenses(translatedData);
//   };
   
//   useEffect(() => {
//     (async () => {
//       try {
//         await Promise.all([getIncomes(), getExpenses()]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   // Totales robustos (acepta Total/total)
//   const totalIncomes = incomes.reduce(
//     (s, x) => s + Number(x.total ?? x.Total ?? 0),
//     0
//   );
//   const totalExpenses = expenses.reduce(
//     (s, x) => s + Number(x.total ?? x.Total ?? 0),
//     0
//   );
//   const balance = totalIncomes - totalExpenses;

//   // Guarda el resumen para que HOME lo pueda leer
//   useEffect(() => {
//     if (loading) return;
//     saveStatementSummary({
//       // Si luego agregas filtros de fecha, setéalos aquí:
//       from: null,
//       to: null,
//       totalIngresos: totalIncomes,
//       totalEgresos: totalExpenses,
//       balance,
//       ts: Date.now(),
//     });
//   }, [loading, totalIncomes, totalExpenses, balance]);

//   if (loading) return <section className="card p-4"><Loader /></section>;

//   return (
//     <>
//       {/* Header + volver */}
//       <div className="flex items-center justify-between gap-3 mb-4">
//         <h2 className="text-xl font-semibold text-slate-900">Relación de Ingresos y Gastos</h2>
//         <Link
//           to="/"
//           className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
//         >
//           <ArrowLeft size={18} />
//           Volver
//         </Link>
//       </div>

//       {/* KPIs */}
//       <KPIs  /* refreshKey={refreshKey} */ />

//       {/* Tablas Ingresos / Gastos */}
//       <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Ingresos */}
//         <div className="card p-4">
//           <h3 className="text-lg font-semibold text-slate-900 mb-3">Ingresos</h3>
//           <div className="table-wrap">
//             <table className="table">
//               <thead className="bg-slate-50">
//                 <tr className="text-left text-slate-500">
//                   <th className="th">Tipo</th>
//                   <th className="th text-right">Total</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {incomes.map((i, idx) => (
//                   <tr key={idx} className="tr">
//                     <td className="td">{i.cuenta_Ingreso ?? i.Cuenta_Ingreso}</td>
//                     <td className="td text-right font-semibold text-emerald-700">
//                       {currency(i.total ?? i.Total ?? 0)}
//                     </td>
//                   </tr>
//                 ))}
//                 {incomes.length === 0 && (
//                   <tr>
//                     <td className="td text-slate-500" colSpan={2}>Sin resultados</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Gastos */}
//         <div className="card p-4">
//           <h3 className="text-lg font-semibold text-slate-900 mb-3">Gastos</h3>
//           <div className="table-wrap">
//             <table className="table">
//               <thead className="bg-slate-50">
//                 <tr className="text-left text-slate-500">
//                   <th className="th">Tipo</th>
//                   <th className="th text-right">Total</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {expenses.map((e, idx) => (
//                   <tr key={idx} className="tr">
//                     <td className="td">{e.cuenta_Egreso === 'Transporte' ? 'Gastos casa' : e.cuenta_Egreso}</td>
//                     <td className="td text-right font-semibold text-rose-700">
//                       {currency(e.total ?? e.Total ?? 0)}
//                     </td>
//                   </tr>
//                 ))}
//                 {expenses.length === 0 && (
//                   <tr>
//                     <td className="td text-slate-500" colSpan={2}>Sin resultados</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>
//     </>
//   );
// }
import React, { useEffect, useState } from "react";
import api from "../Components/api";
import { Link } from "react-router-dom";
import Loader from "../Components/Loader";
import { currency } from "../utils/currency";
import { ArrowLeft } from "lucide-react";
import { saveStatementSummary } from "../utils/statementStore";
import KPIs from "../Components/Kpi";

export default function Statement() {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
      await Promise.all([getIncomes(), getExpenses()]);
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

  const totalExpenses = expenses.reduce(
    (s, x) => s + Number(x.total ?? x.Total ?? 0),
    0
  );

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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_160px_auto_auto]">
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
                  <th className="th text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {incomes.map((i, idx) => (
                  <tr key={idx} className="tr">
                    <td className="td">
                      {i.cuenta_Ingreso ?? i.Cuenta_Ingreso ?? i.nombre ?? "Sin tipo"}
                    </td>
                    <td className="td text-right font-semibold text-emerald-700">
                      {currency(i.total ?? i.Total ?? 0)}
                    </td>
                  </tr>
                ))}

                {incomes.length === 0 && (
                  <tr>
                    <td className="td text-slate-500" colSpan={2}>
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
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
                  <th className="th text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((e, idx) => (
                  <tr key={idx} className="tr">
                    <td className="td">
                      {e.cuenta_Egreso ?? e.Cuenta_Egreso ?? e.nombre ?? "Sin tipo"}
                    </td>
                    <td className="td text-right font-semibold text-rose-700">
                      {currency(e.total ?? e.Total ?? 0)}
                    </td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <tr>
                    <td className="td text-slate-500" colSpan={2}>
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