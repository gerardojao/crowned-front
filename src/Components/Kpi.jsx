// import React, { useEffect, useMemo, useState } from "react";
// import api from "./api";
// import { useAuth } from "./AuthContext";

// export default function KPIs({ from, to, className, refreshKey = 0 }) {
//   const { token } = useAuth();
//   const [totIn, setTotIn] = useState(0);
//   const [totEg, setTotEg] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");

//   const hasRange = !!from && !!to;
//   const isoFrom = toISODate(from);
//   const isoTo = toISODate(to);

//   useEffect(() => {
//     if (!token) return; // espera a estar autenticado

//     let alive = true;
//     (async () => {
//       setLoading(true);
//       setErr("");
//       try {
//         // Con rango => /totalesPorMes, sin rango => /totales
//         const [rIng, rEgr] = hasRange
//           ? await Promise.all([
//               api.get("/Ingreso/totalesPorMes", {
//                 params: { fechaInicio: isoFrom, fechaFin: isoTo },
//               }),
//               api.get("/Egreso/totalesPorMes", {
//                 params: { fechaInicio: isoFrom, fechaFin: isoTo },
//               }),
//             ])
//           : await Promise.all([api.get("/Ingreso/totales"), api.get("/Egreso/totales")]);

//         const inList = rIng.data?.data?.[0] ?? [];
//         const egList = rEgr.data?.data?.[0] ?? [];
//         const tIn = sumTotals(inList);
//         const tEg = sumTotals(egList);

//         if (!alive) return;
//         setTotIn(tIn);
//         setTotEg(tEg);
//       } catch (e) {
//         if (!alive) return;
//         setErr(e?.response?.data?.message || e.message || "Error cargando KPIs");
//         setTotIn(0);
//         setTotEg(0);
//       } finally {
//         if (alive) setLoading(false);
//       }
//     })();

//     return () => {
//       alive = false;
//     };
//   }, [token, hasRange, isoFrom, isoTo, refreshKey]);

//   const balance = useMemo(() => totIn - totEg, [totIn, totEg]);
//   const balColor = balance >= 0 ? "text-emerald-700" : "text-rose-700";

//   return (
//     <section className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ""}`}>
//       <Card
//         title="Total Ingresos"
//         tone="emerald"
//         value={formatCurrency(totIn)}
//         loading={loading}
//       />
//       <Card
//         title="Total Gastos"
//         tone="rose"
//         value={formatCurrency(totEg)}
//         loading={loading}
//       />
//       <Card
//         title={`Balance${hasRange ? ` (${isoFrom} → ${isoTo})` : ""}`}
//         tone="slate"
//         value={formatCurrency(balance)}
//         loading={loading}
//         extraValueClass={balColor}
//       />
//       {err && (
//         <div className="md:col-span-3 rounded-xl bg-rose-50 text-rose-700 px-3 py-2 text-sm">
//           {err}
//         </div>
//       )}
//     </section>
//   );
// }

// function Card({ title, value, tone, loading, extraValueClass }) {
//   const t = {
//     emerald: { border: "border-emerald-200", grad: "from-emerald-50", text: "text-emerald-700" },
//     rose: { border: "border-rose-200", grad: "from-rose-50", text: "text-rose-700" },
//     slate: { border: "border-slate-200", grad: "from-slate-50", text: "text-slate-900" },
//   }[tone] || { border: "border-slate-200", grad: "from-white", text: "text-slate-900" };

//   return (
//     <div className={`rounded-2xl border ${t.border} bg-gradient-to-br ${t.grad} to-white p-5`}>
//       <div className="text-sm text-slate-500">{title}</div>
//       <div className={`mt-1 text-2xl font-semibold ${extraValueClass || t.text}`}>
//         {loading ? "…" : value}
//       </div>
//     </div>
//   );
// }

// const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
// const formatCurrency = (n) => eur.format(Number(n || 0));
// const sumTotals = (arr) => arr.reduce((s, x) => s + Number(x.Total ?? x.total ?? 0), 0);
// const toISODate = (d) => (typeof d === "string" ? d : d?.toISOString?.().slice(0, 10));
import React, { useEffect, useMemo, useState } from "react";
import api from "./api";
import { useAuth } from "./AuthContext";

export default function KPIs({ from, to, className, refreshKey = 0 }) {
  const { token } = useAuth();

  const [totIn, setTotIn] = useState(0);
  const [totEg, setTotEg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const hasRange = !!from && !!to;
  const isoFrom = toISODate(from);
  const isoTo = toISODate(to);

  useEffect(() => {
    if (!token) return;

    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const [rIng, rEgr] = hasRange
          ? await Promise.all([
              api.get("/Ingreso/totalesPorMes", {
                params: { fechaInicio: isoFrom, fechaFin: isoTo },
              }),
              api.get("/Egreso/totalesPorMes", {
                params: { fechaInicio: isoFrom, fechaFin: isoTo },
              }),
            ])
          : await Promise.all([
              api.get("/Ingreso/totales"),
              api.get("/Egreso/totales"),
            ]);

        const inList = rIng.data?.data?.[0] ?? [];
        const egList = rEgr.data?.data?.[0] ?? [];

        if (!alive) return;

        setTotIn(sumTotals(inList));
        setTotEg(sumTotals(egList));
      } catch (e) {
        if (!alive) return;

        setErr(e?.response?.data?.message || e.message || "Error cargando KPIs");
        setTotIn(0);
        setTotEg(0);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token, hasRange, isoFrom, isoTo, refreshKey]);

  const balance = useMemo(() => totIn - totEg, [totIn, totEg]);
  const balColor = balance >= 0 ? "text-emerald-700" : "text-rose-700";

  return (
    <section className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ""}`}>
      <Card title="Total Ingresos" tone="emerald" value={formatCurrency(totIn)} loading={loading} />

      <Card title="Total Gastos" tone="rose" value={formatCurrency(totEg)} loading={loading} />

      <Card
        title={hasRange ? `Balance (${isoFrom} → ${isoTo})` : "Balance"}
        tone="slate"
        value={formatCurrency(balance)}
        loading={loading}
        extraValueClass={balColor}
      />

      {err && (
        <div className="md:col-span-3 rounded-xl bg-rose-50 text-rose-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}
    </section>
  );
}

function Card({ title, value, tone, loading, extraValueClass }) {
  const t = {
    emerald: {
      border: "border-emerald-200",
      grad: "from-emerald-50",
      text: "text-emerald-700",
    },
    rose: {
      border: "border-rose-200",
      grad: "from-rose-50",
      text: "text-rose-700",
    },
    slate: {
      border: "border-slate-200",
      grad: "from-slate-50",
      text: "text-slate-900",
    },
  }[tone];

  return (
    <div className={`rounded-2xl border ${t.border} bg-gradient-to-br ${t.grad} to-white p-5`}>
      <div className="text-sm text-slate-500">{title}</div>
      <div className={`mt-1 text-2xl font-semibold ${extraValueClass || t.text}`}>
        {loading ? "…" : value}
      </div>
    </div>
  );
}

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const formatCurrency = (n) => eur.format(Number(n || 0));

const sumTotals = (arr) =>
  arr.reduce((s, x) => s + Number(x.Total ?? x.total ?? 0), 0);

const toISODate = (d) =>
  typeof d === "string" ? d : d?.toISOString?.().slice(0, 10);