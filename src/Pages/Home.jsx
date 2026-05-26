// // src/Pages/Home.jsx
// import { Link } from "react-router-dom";
// import { useEffect, useMemo, useState } from "react";
// import { currency } from "../utils/currency";
// import { loadStatementSummary } from "../utils/statementStore";
// import api from "../Components/api";
// import KPIs from "../Components/Kpi";

// function soloFecha(value) {
//   if (!value) return "";
//   const d = new Date(value);
//   d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
//   return d.toISOString().slice(0, 10);
// }

// // Helper para leer respuestas envueltas en { data } o { Data } e incluso data[0]
// async function fetchList(url) {
//   try {
//     const r = await fetch(url);
//     if (!r.ok) return [];
//     const j = await r.json();

//     // casos: { data: [...] } | { data: [ [...] ] } | { Data: [...] } | array directo
//     const raw = j?.data ?? j?.Data ?? j;
//     if (Array.isArray(raw)) {
//       return Array.isArray(raw[0]) ? raw[0] : raw;
//     }
//     return [];
//   } catch {
//     return [];
//   }
// }
// // helper arriba del componente (o fuera)
// const pickDataList = (res) => {
//   // Soporta { data: [...] } o { data: [ [...] ] }
//   const pack = res?.data?.data ?? res?.data?.Data ?? [];
//   if (Array.isArray(pack)) return Array.isArray(pack[0]) ? pack[0] : pack;
//   return [];
// };
// export default function Home() {
//   const [ingresos, setIngresos] = useState([]);
//   const [egresos, setEgresos] = useState([]);
//   const [movimientos, setMovimientos] = useState([]);
//   const [lastStatement, setLastStatement] = useState(null);

//   const ts = (d) => (d ? new Date(d).getTime() : 0);

// // ordenados DESC por fecha (y por id si hay empate)
// const movimientosSorted = useMemo(
//   () =>
//     [...movimientos].sort(
//       (a, b) =>
//         (ts(b.fecha) - ts(a.fecha)) || ((b.id ?? 0) - (a.id ?? 0))
//     ),
//   [movimientos]
// );

// useEffect(() => {
//   (async () => {
//     try {

//       const [inRes, egRes, movRes] = await Promise.all([
//         api.get("/Ingreso/detalle"),
//         api.get("/Egreso/detalle"),
//         api.get("/Ingreso/ultimos", { params: { take: 10 } }),

//       ]);

//       setIngresos(pickDataList(inRes));
//       setEgresos(pickDataList(egRes));
//       setMovimientos(pickDataList(movRes));

//     } catch (err) {
//       console.error(err);
//       setIngresos([]);
//       setEgresos([]);
//       setMovimientos([]);
//     } finally {
//       setLastStatement(loadStatementSummary());
//     }
//   })();
// }, []);

//   // Totales locales (fallback si aún no hay Statement)
//   const totalIngresosLocal = useMemo(
//     () => ingresos.reduce((a, x) => a + Number(x.importe ?? x.Importe ?? 0), 0),
//     [ingresos]
//   );
//   const totalEgresosLocal = useMemo(
//     () => egresos.reduce((a, x) => a + Number(x.importe ?? x.Importe ?? 0), 0),
//     [egresos]
//   );
//   const balanceLocal = totalIngresosLocal - totalEgresosLocal;

//   // Preferimos el último statement si existe; si no, los locales
//   const totalIngresos = lastStatement?.totalIngresos ?? totalIngresosLocal;
//   const totalEgresos = lastStatement?.totalEgresos ?? totalEgresosLocal;
//   const balance = lastStatement?.balance ?? balanceLocal;

//   const balColor = balance >= 0 ? "text-emerald-700" : "text-rose-700";

//   return (
//     <>
//       {/* KPIs superiores */}

//       <KPIs  /* refreshKey={refreshKey} */ />
//       {/* Acciones */}
//       <section className="text-center">
//         <h3 className="text-2xl font-semibold text-slate-900">Acciones</h3>
//       </section>

//       <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Ingresos */}
//         <div className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-6">
//           <h3 className="text-lg font-semibold text-slate-700 text-center mb-4">Ingresos</h3>
//           <div className="space-y-3">
//             <Link
//               to="/register-income"
//               className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-base shadow transition
//                          bg-emerald-600 text-white hover:bg-emerald-700 w-full justify-center"
//             >
//               Registrar ingreso
//             </Link>
//             <Link
//               to="/showIncomes"
//               className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 shadow transition
//                          bg-white text-emerald-700 ring-1 ring-emerald-600 hover:bg-emerald-50
//                          w-full justify-center"
//             >
//               Ver ingresos
//             </Link>
//             <Link
//               to="/ingresos-detalle"
//               className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 shadow transition
//                          bg-white text-emerald-700 ring-1 ring-emerald-600 hover:bg-emerald-50
//                          w-full justify-center"
//             >
//               Detalle de ingresos
//             </Link>
//           </div>
//         </div>

//         {/* Gastos */}
//         <div className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-6">
//           <h3 className="text-lg font-semibold text-slate-700 text-center mb-4">Gastos</h3>
//           <div className="space-y-3">
//             <Link
//               to="/register-expense"
//               className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-base shadow transition
//                          bg-sky-600 text-white hover:bg-sky-700 w-full justify-center"
//             >
//               Registrar gasto
//             </Link>
//             <Link
//               to="/showExpenses"
//               className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 shadow transition
//                          bg-white text-rose-700 ring-1 ring-rose-600 hover:bg-rose-50
//                          w-full justify-center"
//             >
//               Ver gastos
//             </Link>
//             <Link
//               to="/egresos-detalle"
//               className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 shadow transition
//                          bg-white text-rose-700 ring-1 ring-rose-600 hover:bg-rose-50
//                          w-full justify-center"
//             >
//               Detalle de gastos
//             </Link>
//           </div>
//         </div>
//       </section>

//       {/* Relación ingresos / gastos */}
//       <section className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-6
//                           flex items-center justify-between gap-4 mt-6">
//         <div>
//           <h3 className="text-lg font-semibold text-slate-900">Relación de ingresos y gastos</h3>
//           <p className="mt-1 text-sm text-slate-500">Compara periodos y categorías.</p>
//         </div>
//         <Link
//           to="/statement"
//           className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 shadow transition
//                      bg-sky-600 text-white hover:bg-sky-700"
//         >
//           Generar
//         </Link>
//       </section>

// {/* Movimientos recientes */}
// <section className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-4">
//   <div className="flex items-center justify-between gap-3 mb-3">
//     <h3 className="text-lg md:text-xl font-semibold text-slate-900">
//       Movimientos recientes
//     </h3>
//     <Link
//       to="/statement"
//       className="hidden sm:inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
//     >
//       Ver todo
//     </Link>
//   </div>

//   {/* --- Móvil: lista de tarjetas --- */}
//   <div className="md:hidden divide-y rounded-xl border border-slate-200 bg-white/60">
//     {movimientos.length === 0 && (
//       <div className="px-3 py-4 text-slate-500">No hay movimientos aún.</div>
//     )}

//     {movimientosSorted.map((m) => (
//       <div key={`${m.kind}-${m.id}`} className="px-3 py-3 flex items-start justify-between gap-3">
//         <div className="min-w-0">
//           <div className="text-sm font-medium text-slate-800">
//             {soloFecha(m.fecha)}
//             {" "}
//             <span
//               className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${
//                 m.kind === "ingreso"
//                   ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
//                   : "bg-rose-50 text-rose-700 ring-rose-200"
//               }`}
//             >
//               {m.kind === "ingreso" ? "Ingreso" : "Egreso"}
//             </span>
//           </div>
//           <div className="text-sm text-slate-600 mt-0.5 truncate max-w-[14rem]">
//             {m.descripcion ?? "—"}
//           </div>
//         </div>
//         <div
//           className={`shrink-0 text-right font-semibold text-sm ${
//             m.kind === "ingreso" ? "text-emerald-700" : "text-rose-700"
//           }`}
//         >
//           {m.kind === "ingreso" ? "+" : "-"}
//           {currency(m.importe)}
//         </div>
//       </div>
//     ))}
//   </div>

//   {/* --- Desktop: tabla --- */}
//   <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden">
//     <div className="max-h-[420px] overflow-y-auto">
//       <table className="min-w-full text-sm">
//         <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
//           <tr className="text-left text-slate-600">
//             <th className="py-2.5 px-3 font-semibold w-[140px]">Fecha</th>
//             <th className="py-2.5 px-3 font-semibold w-[120px]">Tipo</th>
//             <th className="py-2.5 px-3 font-semibold">Descripción</th>
//             <th className="py-2.5 px-3 font-semibold text-right w-[160px]">Importe</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-slate-100">
//           {movimientos.length === 0 && (
//             <tr>
//               <td className="py-4 px-3 text-slate-500" colSpan={4}>No hay movimientos aún.</td>
//             </tr>
//           )}

//           {movimientosSorted.map((m) => (
//             <tr key={`${m.kind}-${m.id}`} className="hover:bg-slate-50">
//               <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
//                 {soloFecha(m.fecha)}
//               </td>
//               <td className="py-2.5 px-3">
//                 <span
//                   className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${
//                     m.kind === "ingreso"
//                       ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
//                       : "bg-rose-50 text-rose-700 ring-rose-200"
//                   }`}
//                 >
//                   {m.kind === "ingreso" ? "Ingreso" : "Egreso"}
//                 </span>
//               </td>
//               <td className="py-2.5 px-3 text-slate-700 truncate">
//                 {m.descripcion ?? "—"}
//               </td>
//               <td
//                 className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
//                   m.kind === "ingreso" ? "text-emerald-700" : "text-rose-700"
//                 }`}
//               >
//                 {m.kind === "ingreso" ? "+" : "-"}
//                 {currency(m.importe)}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   </div>

//   {/* CTA móvil (debajo de la lista) */}
//   <div className="mt-3 md:hidden">
//     <Link
//       to="/statement"
//       className="inline-flex w-full justify-center items-center rounded-lg px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
//     >
//       Ver todo
//     </Link>
//   </div>
// </section>

//     </>
//   );
// }
// src/Pages/Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Users,
  Truck,
  Wallet,
  ReceiptText,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { currency } from "../utils/currency";
import { loadStatementSummary } from "../utils/statementStore";
import api from "../Components/api";
import KPIs from "../Components/Kpi";

function soloFecha(value) {
  if (!value) return "";
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const pickDataList = (res) => {
  const pack = res?.data?.data ?? res?.data?.Data ?? [];
  if (Array.isArray(pack)) return Array.isArray(pack[0]) ? pack[0] : pack;
  return [];
};

const moduleCard =
  "group rounded-2xl bg-white/85 backdrop-blur shadow-sm ring-1 ring-slate-200 p-5 transition hover:-translate-y-0.5 hover:shadow-md";

const moduleIcon =
  "flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm";

const actionLink =
  "inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200 transition";

export default function Home() {
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [lastStatement, setLastStatement] = useState(null);

  const ts = (d) => (d ? new Date(d).getTime() : 0);

  const movimientosSorted = useMemo(
    () =>
      [...movimientos].sort(
        (a, b) => ts(b.fecha) - ts(a.fecha) || (b.id ?? 0) - (a.id ?? 0),
      ),
    [movimientos],
  );

  useEffect(() => {
    (async () => {
      try {
        const [inRes, egRes, movRes] = await Promise.all([
          api.get("/Ingreso/detalle"),
          api.get("/Egreso/detalle"),
          api.get("/Ingreso/ultimos", { params: { take: 10 } }),
        ]);

        setIngresos(pickDataList(inRes));
        setEgresos(pickDataList(egRes));
        setMovimientos(pickDataList(movRes));
      } catch (err) {
        console.error(err);
        setIngresos([]);
        setEgresos([]);
        setMovimientos([]);
      } finally {
        setLastStatement(loadStatementSummary());
      }
    })();
  }, []);

  const totalIngresosLocal = useMemo(
    () => ingresos.reduce((a, x) => a + Number(x.importe ?? x.Importe ?? 0), 0),
    [ingresos],
  );

  const totalEgresosLocal = useMemo(
    () => egresos.reduce((a, x) => a + Number(x.importe ?? x.Importe ?? 0), 0),
    [egresos],
  );

  const balanceLocal = totalIngresosLocal - totalEgresosLocal;

  const totalIngresos = lastStatement?.totalIngresos ?? totalIngresosLocal;
  const totalEgresos = lastStatement?.totalEgresos ?? totalEgresosLocal;
  const balance = lastStatement?.balance ?? balanceLocal;

  return (
    <>
      <KPIs />

      <section className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-5 md:p-6">
        <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Gestión del taller
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Accede rápido a las operaciones principales del día.
              </p>
            </div>

            <Link
              to="/register-work-order"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-orange-600 text-white hover:bg-orange-700 transition shadow-sm font-semibold"
            >
              Nueva orden
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <article className={moduleCard}>
              <div className="flex items-start gap-4">
                <span className={`${moduleIcon} bg-orange-600`}>
                  <ClipboardList size={26} />
                </span>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Órdenes de trabajo
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Crea órdenes, registra trabajos y controla el estado del
                    vehículo.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link to="/register-work-order" className={actionLink}>
                      Nueva orden <ArrowRight size={15} />
                    </Link>
                    <Link
                      to="/register-work-order#ordenes-recientes"
                      className={actionLink}
                    >
                      Ver órdenes <ArrowRight size={15} />
                    </Link>
                    <a
                      href="https://invoice.familyapp.store"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={actionLink}
                    >
                      Facturar orden <ArrowRight size={15} />
                    </a>
                  </div>
                </div>
              </div>
            </article>

            <article className={moduleCard}>
              <div className="flex items-start gap-4">
                <span className={`${moduleIcon} bg-emerald-600`}>
                  <Users size={26} />
                </span>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Clientes
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Registra clientes con matrícula, modelo y datos del
                    vehículo.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link to="/register-customer" className={actionLink}>
                      Registrar cliente <ArrowRight size={15} />
                    </Link>
                    <Link to="/register-customer" className={actionLink}>
                      Buscar cliente <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            <article className={moduleCard}>
              <div className="flex items-start gap-4">
                <span className={`${moduleIcon} bg-teal-700`}>
                  <Truck size={26} />
                </span>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Proveedores
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Administra proveedores de repuestos, pintura, neumáticos y
                    servicios.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link to="/register-supplier" className={actionLink}>
                      Registrar proveedor <ArrowRight size={15} />
                    </Link>
                    <Link to="/register-supplier" className={actionLink}>
                      Ver proveedores <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            <article className={moduleCard}>
              <div className="flex items-start gap-4">
                <span className={`${moduleIcon} bg-sky-600`}>
                  <Wallet size={26} />
                </span>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Finanzas
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Controla ingresos, gastos y balance general del taller.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link to="/register-income" className={actionLink}>
                      Registrar nuevo ingreso <ArrowRight size={15} />
                    </Link>

                    <Link to="/register-expense" className={actionLink}>
                      Registrar nuevo gasto <ArrowRight size={15} />
                    </Link>

                    <Link to="/statement" className={actionLink}>
                      Ver balance <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900">
              Movimientos recientes
            </h3>
            <p className="text-sm text-slate-500">
              Últimos ingresos y egresos registrados.
            </p>
          </div>

          <Link
            to="/statement"
            className="hidden sm:inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Ver todo
          </Link>
        </div>

        <div className="md:hidden divide-y rounded-xl border border-slate-200 bg-white/60">
          {movimientos.length === 0 && (
            <div className="px-3 py-4 text-slate-500">
              No hay movimientos aún.
            </div>
          )}

          {movimientosSorted.map((m) => (
            <div
              key={`${m.kind}-${m.id}`}
              className="px-3 py-3 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800">
                  {soloFecha(m.fecha)}
                  <span
                    className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${
                      m.kind === "ingreso"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-rose-50 text-rose-700 ring-rose-200"
                    }`}
                  >
                    {m.kind === "ingreso" ? "Ingreso" : "Egreso"}
                  </span>
                </div>

                <div className="text-sm text-slate-600 mt-0.5 truncate max-w-[14rem]">
                  {m.descripcion ?? "—"}
                </div>
              </div>

              <div
                className={`shrink-0 text-right font-semibold text-sm ${
                  m.kind === "ingreso" ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {m.kind === "ingreso" ? "+" : "-"}
                {currency(m.importe)}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="text-left text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-[140px]">Fecha</th>
                  <th className="py-2.5 px-3 font-semibold w-[120px]">Tipo</th>
                  <th className="py-2.5 px-3 font-semibold">Descripción</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-[160px]">
                    Importe
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {movimientos.length === 0 && (
                  <tr>
                    <td className="py-4 px-3 text-slate-500" colSpan={4}>
                      No hay movimientos aún.
                    </td>
                  </tr>
                )}

                {movimientosSorted.map((m) => (
                  <tr key={`${m.kind}-${m.id}`} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {soloFecha(m.fecha)}
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${
                          m.kind === "ingreso"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-rose-200"
                        }`}
                      >
                        {m.kind === "ingreso" ? "Ingreso" : "Egreso"}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 truncate">
                      {m.descripcion ?? "—"}
                    </td>

                    <td
                      className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                        m.kind === "ingreso"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {m.kind === "ingreso" ? "+" : "-"}
                      {currency(m.importe)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <Link
            to="/statement"
            className="inline-flex w-full justify-center items-center rounded-lg px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Ver todo
          </Link>
        </div>
      </section>
    </>
  );
}
