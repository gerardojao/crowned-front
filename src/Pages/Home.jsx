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
  FileText,
  LogIn,
  Sparkles,
} from "lucide-react";
import { currency } from "../utils/currency";
import { loadStatementSummary } from "../utils/statementStore";
import api from "../Components/api";
import KPIs from "../Components/Kpi";
import { useAuth } from "../Components/AuthContext";
import { useBusinessTerminology } from "../utils/businessTerminology";

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

const getEstadoBadge = (estado) => {
  switch (estado) {
    case "Recibido":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "Diagnóstico":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "Reparando":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "Esperando repuesto":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "Listo":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Entregado":
      return "bg-slate-100 text-slate-700 ring-slate-300";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
};

export default function Home() {
  const { isAuthed } = useAuth();
  const labels = useBusinessTerminology();
  const [ordenes, setOrdenes] = useState([]);
  const [lastStatement, setLastStatement] = useState(null);

  const ts = (d) => (d ? new Date(d).getTime() : 0);

  const ordenesSorted = useMemo(
    () =>
      [...ordenes].sort(
        (a, b) => ts(b.fecha) - ts(a.fecha) || (b.id ?? 0) - (a.id ?? 0),
      ),
    [ordenes],
  );

  useEffect(() => {
    if (!isAuthed) {
      setOrdenes([]);
      setLastStatement(null);
      return;
    }

    (async () => {
      try {
        const [movRes] = await Promise.all([
          api.get("/OrdenTrabajo/ultimas", { params: { take: 10 } }),
        ]);

        setOrdenes(pickDataList(movRes));
      } catch (err) {
        console.error(err);

        setOrdenes([]);
      } finally {
        setLastStatement(loadStatementSummary());
      }
    })();
  }, [isAuthed]);

  if (!isAuthed) {
    return (
      <div className="flex min-h-[calc(100dvh-24rem)] items-center justify-center py-3 md:min-h-[calc(100dvh-25rem)]">
      <section className="mx-auto w-full max-w-3xl rounded-3xl bg-white/90 p-6 text-center shadow-sm ring-1 ring-cyan-100 md:p-10">


        <p className="mt-5 text-lg font-semibold uppercase tracking-[0.18em] text-orange-700">
          PLATAFORMA CENTRALIZADA
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          Una plataforma lista para impulsar tu negocio
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          Gestiona clientes, documentos, facturación y operaciones desde un solo lugar. Una solución diseñada para el éxito de tu negocio.
        </p>

        <div className="mt-7 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700"
          >
            <LogIn size={18} />
            Iniciar sesion
          </Link>
        </div>
      </section>
      </div>
    );
  }

  return (
    <>
      <KPIs />

      <section className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-5 md:p-6">
        <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {labels.managementTitle}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {labels.managementSubtitle}
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
                    {labels.assetSingular}.
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
                    <Link to="/presupuestos" className={actionLink}>
                      Presupuestos <ArrowRight size={15} />
                    </Link>
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
                    {labels.assetSingular}.
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
                    Administra proveedores de materiales, servicios y suministros.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link to="/register-supplier" className={actionLink}>
                      Registrar proveedor <ArrowRight size={15} />
                    </Link>
                    <Link to="/register-supplier" className={actionLink}>
                      Ver proveedores <ArrowRight size={15} />
                    </Link>
                    <Link to="/stock-parts" className={actionLink}>
                      {labels.stockTitle} <ArrowRight size={15} />
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
                    Controla ingresos, gastos y balance general de la {labels.businessSingular}.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link to="/register-income-type" className={actionLink}>
                      Registrar tipo de ingreso <ArrowRight size={15} />
                    </Link>

                    <Link to="/register-expense-type" className={actionLink}>
                      Registrar tipo de gasto <ArrowRight size={15} />
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
              Ordenes recientes
            </h3>
            <p className="text-sm text-slate-500">
              Últimas ordenes registrados.
            </p>
          </div>

          <Link
            to="/register-work-order#ordenes-recientes"
            className="hidden sm:inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Ver todo
          </Link>
        </div>

        <div className="md:hidden divide-y rounded-xl border border-slate-200 bg-white/60">
          {ordenes.length === 0 && (
            <div className="px-3 py-4 text-slate-500">
              No hay ordenes registradas.
            </div>
          )}

          {ordenes.length === 0 && (
            <tr>
              <td className="py-4 px-3 text-slate-500" colSpan={5}>
                No hay órdenes recientes.
              </td>
            </tr>
          )}

          {ordenesSorted.map((o) => {
            const id = o.id ?? o.Id;
            const fecha = o.fecha ?? o.Fecha;
            const estado = o.estado ?? o.Estado;
            const cliente = o.cliente ?? o.Cliente;
            const matricula = o.matricula ?? o.Matricula;

            return (
              <tr key={id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                  {soloFecha(fecha)}
                </td>

                <td className="py-2.5 px-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${getEstadoBadge(estado)}`}
                  >
                    {estado}
                  </span>
                </td>

                <td className="py-2.5 px-3 text-slate-700 truncate">
                  {cliente ?? "—"}
                </td>

                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  {matricula ?? "—"}
                </td>

                <td className="py-2.5 px-3 text-right">
                  <Link
                    to="/register-work-order#ordenes-recientes"
                    className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700"
                  >
                    Ir a orden
                  </Link>
                </td>
              </tr>
            );
          })}
        </div>

        <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="text-left text-slate-600">
                  <th className="py-2.5 px-3 font-bold w-[140px] text-center">
                    Fecha
                  </th>
                  <th className="py-2.5 px-3 font-bold w-[160px] text-center">
                    Estado
                  </th>
                  <th className="py-2.5 px-3 text-center font-bold">Cliente</th>
                  <th className="py-2.5 px-3 font-bold w-[140px] text-center">
                    {labels.referenceLabel}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-center w-[140px]"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {ordenes.length === 0 && (
                  <tr>
                    <td className="py-4 px-3 text-slate-500" colSpan={4}>
                      No hay ordenes aún.
                    </td>
                  </tr>
                )}

                {ordenesSorted.map((o) => {
                  const id = o.id ?? o.Id;
                  const fecha = o.fecha ?? o.Fecha;
                  const estado = o.estado ?? o.Estado;
                  const cliente = o.cliente ?? o.Cliente;
                  const matricula = o.matricula ?? o.Matricula;

                  return (
                    <tr key={id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {soloFecha(fecha)}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${getEstadoBadge(estado)}`}
                        >
                          {estado}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 truncate">
                        {cliente ?? "—"}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {matricula ?? "—"}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to="/register-work-order#ordenes-recientes"
                          className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700"
                        >
                          Ir a orden
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
