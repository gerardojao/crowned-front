import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HandCoins, RefreshCw } from "lucide-react";
import api from "../Components/api";
import { currency, amountInput } from "../utils/currency";

const ESTADOS = ["Todas", "Pendiente", "Parcial", "Rectificada", "Parcial rectificada", "Pagada"];
const CASH_PAYMENT_VALUE = "cash";

const pickItems = (res) => {
  const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? [];
  return Array.isArray(pack) ? pack : [];
};

const dateOnly = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-ES");
};

const isoDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const includesText = (value, term) => {
  const cleanTerm = normalizeText(term);
  if (!cleanTerm) return true;
  return normalizeText(value).includes(cleanTerm);
};

const todayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const daysOverdue = (value, estado) => {
  if (!value || ["Pagada", "Rectificada"].includes(estado)) return 0;
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return 0;
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = todayStart().getTime() - dueStart.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
};

const badgeClass = (estado) => {
  switch (estado) {
    case "Pagada":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Rectificada":
      return "bg-slate-100 text-slate-700 ring-slate-300";
    case "Parcial rectificada":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "Parcial":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-rose-50 text-rose-700 ring-rose-200";
  }
};

export default function AccountsReceivable() {
  const [items, setItems] = useState([]);
  const [estado, setEstado] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [abonos, setAbonos] = useState({});
  const [abonoBanks, setAbonoBanks] = useState({});
  const [bankAccounts, setBankAccounts] = useState([]);
  const [moduleEnabled, setModuleEnabled] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [clienteFilter, setClienteFilter] = useState("");
  const [matriculaFilter, setMatriculaFilter] = useState("");
  const [facturaFilter, setFacturaFilter] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const settingsRes = await api.get("/WorkshopSettings");
      const settings = settingsRes?.data || {};
      const enabled =
        settings.enableAccountsReceivable ??
        settings.EnableAccountsReceivable ??
        false;
      setModuleEnabled(enabled);
      setSettingsLoaded(true);

      if (!enabled) {
        setItems([]);
        setBankAccounts([]);
        return;
      }

      const [res, banksRes] = await Promise.all([
        api.get("/FacturaEmitida/cxc", {
          params: estado === "Todas" ? {} : { estado },
        }),
        api.get("/WorkshopBankAccounts"),
      ]);
      setItems(pickItems(res));
      setBankAccounts(Array.isArray(banksRes?.data) ? banksRes.data : []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudieron cargar las facturas pendiente de cobro.",
      );
      setItems([]);
      setSettingsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const fecha = isoDate(item.fecha ?? item.Fecha);
        if (from && (!fecha || fecha < from)) return false;
        if (to && (!fecha || fecha > to)) return false;
        if (!includesText(item.cliente ?? item.Cliente, clienteFilter)) return false;
        if (!includesText(item.matricula ?? item.Matricula, matriculaFilter)) return false;
        if (!includesText(item.numeroFactura ?? item.NumeroFactura, facturaFilter)) return false;
        return true;
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fecha ?? a.Fecha ?? 0).getTime();
        const fechaB = new Date(b.fecha ?? b.Fecha ?? 0).getTime();
        if (fechaA !== fechaB) return fechaB - fechaA;
        return Number(b.id ?? b.Id ?? 0) - Number(a.id ?? a.Id ?? 0);
      });
  }, [items, from, to, clienteFilter, matriculaFilter, facturaFilter]);

  const summary = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const total = Number(item.totalFactura ?? item.TotalFactura ?? 0);
        const abonado = Number(item.totalAbonado ?? item.TotalAbonado ?? 0);
        const saldo = Number(item.saldoPendiente ?? item.SaldoPendiente ?? 0);
        const estadoCxC = item.estadoCxC ?? item.EstadoCxC;
        const atraso = daysOverdue(
          item.fechaVencimiento ?? item.FechaVencimiento,
          estadoCxC,
        );
        return {
          total: acc.total + total,
          abonado: acc.abonado + abonado,
          saldo: acc.saldo + saldo,
          vencidas: atraso > 0 ? acc.vencidas + 1 : acc.vencidas,
          saldoVencido: atraso > 0 ? acc.saldoVencido + saldo : acc.saldoVencido,
        };
      },
      { total: 0, abonado: 0, saldo: 0, vencidas: 0, saldoVencido: 0 },
    );
  }, [filteredItems]);

  const clearDateFilter = () => {
    setFrom("");
    setTo("");
  };

  const clearSearchFilters = () => {
    setClienteFilter("");
    setMatriculaFilter("");
    setFacturaFilter("");
  };

  const setAbono = (id, value) => {
    setAbonos((prev) => ({ ...prev, [id]: value }));
  };

  const setAbonoBank = (id, value) => {
    setAbonoBanks((prev) => ({ ...prev, [id]: value }));
  };

  const registrarAbono = async (factura) => {
    const id = factura.id ?? factura.Id;
    const importe = Number(abonos[id] || 0);
    if (importe <= 0) {
      setError("Indica un abono mayor que 0.");
      return;
    }

    const paymentMethod = abonoBanks[id];
    if (!paymentMethod) {
      setError("Selecciona el metodo de pago del abono.");
      return;
    }
    const isCash = paymentMethod === CASH_PAYMENT_VALUE;

    try {
      setError("");
      setNotice("");
      const res = await api.put(`/FacturaEmitida/${id}/abono`, {
        importe,
        metodoPago: isCash ? "Efectivo" : "Transferencia",
        bankAccountId: isCash ? null : Number(paymentMethod),
      });
      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(res?.data?.message || res?.data?.Message);
      }
      setNotice("Abono registrado correctamente.");
      setAbonos((prev) => ({ ...prev, [id]: "" }));
      setAbonoBanks((prev) => ({ ...prev, [id]: "" }));
      await load();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo registrar el abono.",
      );
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white">
              <HandCoins size={25} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Facturas pendiente de cobro
              </h2>
              <p className="text-sm text-slate-500">
                Facturas a credito, vencimientos, abonos y saldos pendientes.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Volver
            </Link>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              <RefreshCw size={17} />
              Actualizar
            </button>
          </div>
        </div>

        {notice && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </div>
        )}
      </div>

      {settingsLoaded && !moduleEnabled && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-bold">Modulo desactivado</p>
          <p className="mt-1 text-sm">
            Cuentas por cobrar no esta activo para el taller seleccionado.
          </p>
        </div>
      )}

      {moduleEnabled && (
      <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard label="Total facturado" value={summary.total} />
        <SummaryCard label="Total abonado" value={summary.abonado} />
        <SummaryCard label="Saldo pendiente" value={summary.saldo} tone="rose" />
        <SummaryCard
          label="Facturas vencidas"
          value={summary.saldoVencido}
          detail={`${summary.vencidas} factura${summary.vencidas === 1 ? "" : "s"}`}
          tone="amber"
        />
      </div>

      <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-bold text-slate-900">Facturas</h3>
            <div className="flex flex-wrap gap-2">
            {ESTADOS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEstado(item)}
                className={`rounded-xl px-3 py-2 text-sm font-bold ring-1 ${
                  estado === item
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(180px,1fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_auto] md:items-end">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Cliente
              <input
                type="search"
                value={clienteFilter}
                onChange={(event) => setClienteFilter(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Nombre del cliente"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Matricula
              <input
                type="search"
                value={matriculaFilter}
                onChange={(event) => setMatriculaFilter(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm uppercase"
                placeholder="Ej. 1234ABC"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Nº factura
              <input
                type="search"
                value={facturaFilter}
                onChange={(event) => setFacturaFilter(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Numero"
              />
            </label>
            <button
              type="button"
              onClick={clearSearchFilters}
              className="h-9 rounded-lg bg-white px-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Limpiar busqueda
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:ml-auto md:w-fit md:grid-cols-[170px_170px_auto] md:items-end">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Desde
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Hasta
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={clearDateFilter}
              className="h-9 rounded-lg bg-white px-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Limpiar fechas
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">
            Cargando facturas pendiente de cobro...
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No hay facturas para mostrar.
          </div>
        )}

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-center  text-slate-600">
              <tr>
                <th className="px-3 py-3 font-bold">Factura</th>
                <th className="px-3 py-3 font-bold">Cliente</th>
                <th className="px-3 py-3 font-bold">Matricula</th>
                <th className="px-3 py-3 font-bold">Fecha</th>
                <th className="px-3 py-3 font-bold">Vencimiento</th>
                <th className="px-3 py-3 text-right font-bold">Dias atraso</th>
                <th className="px-3 py-3 text-right font-bold">Total</th>
                <th className="px-3 py-3 text-right font-bold">Abonado</th>
                <th className="px-3 py-3 text-right font-bold">Saldo</th>
                <th className="px-3 py-3 font-bold">Estado</th>
              <th className="px-3 py-3 font-bold">Abono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((factura) => (
                <FacturaRow
                  key={factura.id ?? factura.Id}
                  factura={factura}
                  abonos={abonos}
                  abonoBanks={abonoBanks}
                  bankAccounts={bankAccounts}
                  setAbono={setAbono}
                  setAbonoBank={setAbonoBank}
                  registrarAbono={registrarAbono}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredItems.map((factura) => {
            const id = factura.id ?? factura.Id;
            const estadoCxC = factura.estadoCxC ?? factura.EstadoCxC;
            const atraso = daysOverdue(
              factura.fechaVencimiento ?? factura.FechaVencimiento,
              estadoCxC,
            );
            return (
              <article
                key={id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">
                      {factura.numeroFactura ?? factura.NumeroFactura}
                    </p>
                    <p className="text-sm text-slate-600">
                      {factura.cliente ?? factura.Cliente}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${badgeClass(estadoCxC)}`}
                  >
                    {estadoCxC}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Info label="Fecha" value={dateOnly(factura.fecha ?? factura.Fecha)} />
                  <Info
                    label="Vence"
                    value={dateOnly(factura.fechaVencimiento ?? factura.FechaVencimiento)}
                  />
                  <Info label="Matrícula" value={factura.matricula ?? factura.Matricula ?? "-"} />
                  {atraso > 0 && (
                    <Info label="Días atraso" value={`${atraso} día${atraso === 1 ? "" : "s"}`} />
                  )}
                  <Info
                    label="Total"
                    value={currency(factura.totalFactura ?? factura.TotalFactura)}
                  />
                  <Info
                    label="Saldo"
                    value={currency(factura.saldoPendiente ?? factura.SaldoPendiente)}
                  />
                </div>
                {!["Pagada", "Rectificada"].includes(estadoCxC) && (
                  <div className="mt-3 grid gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={abonos[id] || ""}
                      onChange={(e) => setAbono(id, e.target.value)}
                      onBlur={(e) => setAbono(id, amountInput(e.target.value))}
                      className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Abono"
                    />
                    <BankSelect
                      value={abonoBanks[id] || ""}
                      bankAccounts={bankAccounts}
                      onChange={(value) => setAbonoBank(id, value)}
                    />
                    <button
                      type="button"
                      onClick={() => registrarAbono(factura)}
                      className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
      </>
      )}
    </section>
  );
}

function SummaryCard({ label, value, detail = "", tone = "slate" }) {
  const color =
    tone === "rose"
      ? "text-rose-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-extrabold ${color}`}>
        {currency(value)}
      </p>
      {detail && <p className="mt-1 text-sm font-semibold text-slate-500">{detail}</p>}
    </div>
  );
}

function FacturaRow({
  factura,
  abonos,
  abonoBanks,
  bankAccounts,
  setAbono,
  setAbonoBank,
  registrarAbono,
}) {
  const id = factura.id ?? factura.Id;
  const estado = factura.estadoCxC ?? factura.EstadoCxC;
  const atraso = daysOverdue(factura.fechaVencimiento ?? factura.FechaVencimiento, estado);
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-3 py-3 font-bold text-slate-900">
        {factura.numeroFactura ?? factura.NumeroFactura}
      </td>
      <td className="px-3 py-3 text-slate-700">
        {factura.cliente ?? factura.Cliente}
      </td>
      <td className="px-3 py-3 font-semibold text-slate-600">
        {factura.matricula ?? factura.Matricula ?? "-"}
      </td>
      <td className="px-3 py-3 text-slate-600">
        {dateOnly(factura.fecha ?? factura.Fecha)}
      </td>
      <td className="px-3 py-3 text-slate-600">
        {dateOnly(factura.fechaVencimiento ?? factura.FechaVencimiento)}
      </td>
      <td className="px-3 py-3 text-right">
        {atraso > 0 ? (
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
            {atraso}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </td>
      <td className="px-3 py-3 text-right font-semibold">
        {currency(factura.totalFactura ?? factura.TotalFactura)}
      </td>
      <td className="px-3 py-3 text-right">
        {currency(factura.totalAbonado ?? factura.TotalAbonado)}
      </td>
      <td className="px-3 py-3 text-right font-bold text-rose-700">
        {currency(factura.saldoPendiente ?? factura.SaldoPendiente)}
      </td>
      <td className="px-3 py-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${badgeClass(estado)}`}
        >
          {estado}
        </span>
      </td>
<td className="px-3 py-3">
  {["Pagada", "Rectificada"].includes(estado) ? (
    <span className="text-xs font-bold text-emerald-700">Completa</span>
  ) : (
    <div className="flex items-center justify-center gap-2">
      <input
        type="number"
        min="0"
        step="0.01"
        value={abonos[id] || ""}
        onChange={(e) => setAbono(id, e.target.value)}
        onBlur={(e) => setAbono(id, amountInput(e.target.value))}
        className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        placeholder="0.00"
      />

      <BankSelect
        value={abonoBanks[id] || ""}
        bankAccounts={bankAccounts}
        onChange={(value) => setAbonoBank(id, value)}
      />

      <button
        type="button"
        onClick={() => registrarAbono(factura)}
        className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60"
      >
        Aplicar
      </button>
    </div>
  )}
</td>
    </tr>
  );
}

function BankSelect({ value, bankAccounts, onChange }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-44 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
    >
      <option value="">Metodo de pago</option>
      <option value={CASH_PAYMENT_VALUE}>Efectivo</option>
      {bankAccounts.map((bank) => {
        const id = bank.id ?? bank.Id;
        const name = bank.nombre ?? bank.Nombre ?? "Cuenta bancaria";
        const iban = bank.iban ?? bank.Iban ?? "";
        return (
          <option key={id} value={id}>
            {iban ? `${name} - ${iban}` : name}
          </option>
        );
      })}
    </select>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
