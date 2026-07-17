import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Landmark, RefreshCw, Trash2 } from "lucide-react";
import api from "../Components/api";
import { amountInput, currency } from "../utils/currency";

const ACCOUNTS = ["Cliente", "Proveedor", "IvaSoportado", "IvaRepercutido", "Banco", "Efectivo"];
const MOVEMENT_TYPES = ["Ingreso", "Egreso"];

const today = () => new Date().toISOString().slice(0, 10);

// const pickPack = (res) => {
//   const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? {};
//   return {
//     items: Array.isArray(pack.items) ? pack.items : pack.Items || [],
//     resumen: Array.isArray(pack.resumen) ? pack.resumen : pack.Resumen || [],
//   };
// };
const pickPack = (res) => {
  const pack = res?.data?.data?.[0] ?? res?.data?.Data?.[0] ?? {};
  return {
    items: Array.isArray(pack.items) ? pack.items : pack.Items || [],
    resumen: Array.isArray(pack.resumen) ? pack.resumen : pack.Resumen || [],
    page: pack.page ?? pack.Page ?? 1,
    pageSize: pack.pageSize ?? pack.PageSize ?? 20,
    totalItems: pack.totalItems ?? pack.TotalItems ?? 0,
    totalPages: pack.totalPages ?? pack.TotalPages ?? 1,
  };
};

const dateOnly = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-ES");
};

const defaultTypeForAccount = (account) =>
  account === "Proveedor" || account === "IvaSoportado" ? "Egreso" : "Ingreso";

const accountLabel = (account) =>
  ({
    Cliente: "Ventas",
    Proveedor: "Compras/Gastos",
    IvaSoportado: "IVA soportado",
    IvaRepercutido: "IVA repercutido",
  })[account] || account;

const isNoVatSummaryAccount = (account) =>
  account === "Cliente" || account === "Proveedor";

export default function Ledger() {
  const [moduleEnabled, setModuleEnabled] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankFilter, setBankFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState({
    cuenta: "Cliente",
    tipoMovimiento: "Ingreso",
    fecha: today(),
    referencia: "",
    descripcion: "",
    importe: "",
  });

  const [searchFilter, setSearchFilter] = useState("");

  const load = async (filters = {}) => {
    try {
      setLoading(true);
      setError("");
      const nextAccountFilter = Object.prototype.hasOwnProperty.call(
        filters,
        "accountFilter",
      )
        ? filters.accountFilter
        : accountFilter;
      const nextBankFilter = Object.prototype.hasOwnProperty.call(
        filters,
        "bankFilter",
      )
        ? filters.bankFilter
        : bankFilter;
      const nextTypeFilter = Object.prototype.hasOwnProperty.call(
        filters,
        "typeFilter",
      )
        ? filters.typeFilter
        : typeFilter;
      const nextFrom = Object.prototype.hasOwnProperty.call(filters, "from")
        ? filters.from
        : from;
      const nextTo = Object.prototype.hasOwnProperty.call(filters, "to")
        ? filters.to
        : to;

      const settingsRes = await api.get("/WorkshopSettings");
      const settings = settingsRes?.data || {};
      const enabled = settings.enableLedger ?? settings.EnableLedger ?? false;
      setModuleEnabled(enabled);
      setSettingsLoaded(true);

      const nextSearchFilter = Object.prototype.hasOwnProperty.call(filters, "searchFilter")
      ? filters.searchFilter
      : searchFilter;

      const nextPage = filters.page ?? page;

      if (!enabled) {
        setItems([]);
        setSummary([]);
        return;
      }

      const bankParam =
        nextAccountFilter === "Banco" && nextBankFilter
          ? Number(nextBankFilter)
          : null;
      const [itemsRes, summaryRes, banksRes] = await Promise.all([
        api.get("/Mayor", {
          params: {
            cuenta: nextAccountFilter || null,
            tipoMovimiento: nextTypeFilter || null,
            bankAccountId: bankParam,
            fechaInicio: nextFrom || null,
            fechaFin: nextTo || null,
            busqueda: nextSearchFilter || null,
            page: nextPage,
            pageSize,
          },
        }),
        api.get("/Mayor", {
          params: {
            bankAccountId: bankParam,
            tipoMovimiento: nextTypeFilter || null,
            fechaInicio: nextFrom || null,
            fechaFin: nextTo || null,
            busqueda: nextSearchFilter || null,
          },
        }),
        api.get("/WorkshopBankAccounts"),
      ]);
      const itemsPack = pickPack(itemsRes);
      const summaryPack = pickPack(summaryRes);
      setItems(itemsPack.items);
      setSummary(summaryPack.resumen);
      setPage(itemsPack.page);
      setTotalItems(itemsPack.totalItems);
      setTotalPages(itemsPack.totalPages);
      setBankAccounts(Array.isArray(banksRes?.data) ? banksRes.data : []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo cargar el mayor.",
      );
      setItems([]);
      setSummary([]);
      setSettingsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "cuenta") {
        next.tipoMovimiento = defaultTypeForAccount(value);
      }
      return next;
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const res = await api.post("/Mayor", {
        ...form,
        importe: Number(form.importe || 0),
      });
      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(res?.data?.message || res?.data?.Message);
      }
      setNotice("Movimiento registrado en el mayor.");
      setForm((prev) => ({
        ...prev,
        fecha: today(),
        referencia: "",
        descripcion: "",
        importe: "",
      }));
      await load();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo registrar el movimiento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      setError("");
      setNotice("");
      await api.delete(`/Mayor/${id}`);
      setNotice("Movimiento eliminado.");
      await load();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo eliminar el movimiento.",
      );
    }
  };

  const clearFilters = () => {
    setAccountFilter("");
    setTypeFilter("");
    setBankFilter("");
    setFrom("");
    setTo("");
    setPage(1);
    setSearchFilter("");
    load({ 
    accountFilter: "",
    typeFilter: "",
    bankFilter: "",
    from: "",
    to: "",
    searchFilter: "",
    page: 1, });
  };

  return (
    <section className="space-y-5">
      <div className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-700 text-white">
              <Landmark size={25} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Mayor</h2>
              <p className="text-sm text-slate-500">
                Registro por cuenta contable: Cliente, Compras/Gastos, IVA, Banco y Efectivo.
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
              onClick={() => load({ page: 1 })}
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
            Mayor no esta activo para el taller seleccionado.
          </p>
        </div>
      )}

      {moduleEnabled && (
        <>
          {/* <section className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]"> */}
          <section className="space-y-5">
            {/* <form onSubmit={save} className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Nuevo movimiento</h3>
              <div className="mt-4 space-y-3">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Cuenta
                  <select
                    value={form.cuenta}
                    onChange={(event) => setField("cuenta", event.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {ACCOUNTS.map((account) => (
                      <option key={account} value={account}>
                        {account}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Tipo
                  <select
                    value={form.tipoMovimiento}
                    onChange={(event) => setField("tipoMovimiento", event.target.value)}
                    disabled={form.cuenta !== "Banco"}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
                  >
                    {MOVEMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Fecha
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(event) => setField("fecha", event.target.value)}
                    required
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>

                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Referencia
                  <input
                    value={form.referencia}
                    onChange={(event) => setField("referencia", event.target.value)}
                    required
                    placeholder="Factura, recibo, transferencia..."
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>

                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Importe
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.importe}
                    onChange={(event) => setField("importe", event.target.value)}
                    onBlur={(event) => setField("importe", amountInput(event.target.value))}
                    required
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>

                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Descripcion
                  <textarea
                    rows={3}
                    value={form.descripcion}
                    onChange={(event) => setField("descripcion", event.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <button
                disabled={saving}
                className="mt-5 w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Registrar movimiento"}
              </button>
            </form> */}

            <div className="space-y-5">
              <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:items-end">
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Cuenta
                    <select
                      value={accountFilter}
                      onChange={(event) => {
                        const value = event.target.value;
                        setAccountFilter(value);
                        if (value !== "Banco") setBankFilter("");
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Todas</option>
                      {ACCOUNTS.map((account) => (
                        <option key={account} value={account}>
                          {accountLabel(account)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {accountFilter === "Banco" && bankAccounts.length > 1 && (
                    <label className="grid gap-1 text-sm font-semibold text-slate-700">
                      Banco
                      <select
                        value={bankFilter}
                        onChange={(event) => setBankFilter(event.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Todos</option>
                        {bankAccounts.map((bank) => {
                          const id = bank.id ?? bank.Id;
                          const name =
                            bank.nombre ?? bank.Nombre ?? "Cuenta bancaria";
                          return (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  )}
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Tipo
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Todos</option>
                      {MOVEMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
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
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                      Buscar
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Factura, proveedor, cliente, ING-..., EGR-..."
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                  <button
                    type="button"
                    onClick={load}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Limpiar
                  </button>
                </div>
              </section>

              <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-lg font-bold text-slate-900">
                  Resumen por cuenta
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {ACCOUNTS.map((account) => {
                    const row = summary.find(
                      (item) => (item.cuenta ?? item.Cuenta) === account,
                    );
                    return (
                      <div
                        key={account}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <p className="font-bold text-slate-900">
                            {accountLabel(account)}
                          </p>
                          {isNoVatSummaryAccount(account) && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                              Sin IVA
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs font-bold uppercase text-slate-400">
                          Saldo
                        </p>
                        <p className="text-xl font-extrabold text-slate-900">
                          {currency(row?.saldo ?? row?.Saldo)}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold">
                          <span className="text-emerald-700">
                            In: {currency(row?.ingresos ?? row?.Ingresos)}
                          </span>
                          <span className="text-rose-700">
                            Out: {currency(row?.egresos ?? row?.Egresos)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-lg font-bold text-slate-900">
                  Movimientos
                </h3>

                {loading && (
                  <div className="mt-4 rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                    Cargando mayor...
                  </div>
                )}

                {!loading && items.length === 0 && (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    No hay movimientos para mostrar.
                  </div>
                )}

                <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-3 py-3 font-bold">Fecha</th>
                        <th className="px-3 py-3 font-bold">Cuenta</th>
                        <th className="px-3 py-3 font-bold">Tipo</th>
                        <th className="px-3 py-3 font-bold">Origen</th>
                        <th className="px-3 py-3 font-bold">Banco</th>
                        <th className="px-3 py-3 font-bold">Referencia</th>
                        <th className="px-3 py-3 font-bold">Descripcion</th>
                        <th className="px-3 py-3 text-right font-bold">
                          Importe
                        </th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <LedgerRow
                          key={item.id ?? item.Id}
                          item={item}
                          onRemove={remove}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                  {items.map((item) => (
                    <MobileMovement
                      key={item.id ?? item.Id}
                      item={item}
                      onRemove={remove}
                    />
                  ))}
                </div>
                {!loading && totalItems > 0 && (
                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Mostrando {items.length} de {totalItems} movimientos.
                      Página {page} de {totalPages}.
                    </p>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => load({ page: page - 1 })}
                        className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>

                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => load({ page: page + 1 })}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function TypeBadge({ type }) {
  const ingreso = type === "Ingreso";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
        ingreso
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-rose-50 text-rose-700 ring-rose-200"
      }`}
    >
      {type}
    </span>
  );
}

function LedgerRow({ item, onRemove }) {
  const id = item.id ?? item.Id;
  const sourceId = item.sourceId ?? item.SourceId;
  const type = item.tipoMovimiento ?? item.TipoMovimiento;
  const source = item.source ?? item.Source ?? "Mayor";
  const account = item.cuenta ?? item.Cuenta;
  const bankName = item.bankAccountName ?? item.BankAccountName;
  const canDelete = source === "Mayor";
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-3 py-3 text-slate-600">
        {dateOnly(item.fecha ?? item.Fecha)}
      </td>
      <td className="px-3 py-3 font-bold text-slate-900">
        {accountLabel(account)}
      </td>
      <td className="px-3 py-3">
        <TypeBadge type={type} />
      </td>
      <td className="px-3 py-3">
        <SourceBadge source={source} />
      </td>
      <td className="px-3 py-3 text-slate-600">
        {account === "Banco" ? bankName || "Sin banco asignado" : "-"}
      </td>
      <td className="px-3 py-3 text-slate-700">
        {item.referencia ?? item.Referencia}
      </td>
      <td className="px-3 py-3 text-slate-600">
        {item.descripcion ?? item.Descripcion ?? "-"}
      </td>
      <td
        className={`px-3 py-3 text-right font-bold ${type === "Ingreso" ? "text-emerald-700" : "text-rose-700"}`}
      >
        {currency(item.importe ?? item.Importe)}
      </td>
      <td className="px-3 py-3 text-right">
        {canDelete ? (
          <button
            type="button"
            onClick={() => onRemove(sourceId)}
            className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"
            aria-label="Eliminar movimiento"
          >
            <Trash2 size={16} />
          </button>
        ) : (
          <span className="text-xs font-semibold text-slate-400">Auto</span>
        )}
      </td>
    </tr>
  );
}

function MobileMovement({ item, onRemove }) {
  const id = item.id ?? item.Id;
  const sourceId = item.sourceId ?? item.SourceId;
  const type = item.tipoMovimiento ?? item.TipoMovimiento;
  const source = item.source ?? item.Source ?? "Mayor";
  const account = item.cuenta ?? item.Cuenta;
  const bankName = item.bankAccountName ?? item.BankAccountName;
  const canDelete = source === "Mayor";
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">{accountLabel(account)}</p>
          <p className="text-sm text-slate-500">
            {dateOnly(item.fecha ?? item.Fecha)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <TypeBadge type={type} />
          <SourceBadge source={source} />
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm">
        <p className="font-semibold text-slate-800">
          {item.referencia ?? item.Referencia}
        </p>
        {account === "Banco" && (
          <p className="text-xs font-semibold text-slate-500">
            Banco: {bankName || "Sin banco asignado"}
          </p>
        )}
        <p className="text-slate-600">
          {item.descripcion ?? item.Descripcion ?? "-"}
        </p>
        <p
          className={`text-lg font-extrabold ${type === "Ingreso" ? "text-emerald-700" : "text-rose-700"}`}
        >
          {currency(item.importe ?? item.Importe)}
        </p>
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={() => onRemove(sourceId)}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"
        >
          <Trash2 size={16} />
          Eliminar
        </button>
      )}
    </article>
  );
}

function SourceBadge({ source }) {
  const classes =
    source === "Ingreso"
      ? "bg-sky-50 text-sky-700 ring-sky-200"
      : source === "Egreso"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${classes}`}
    >
      {source}
    </span>
  );
}
