import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Save, Search, X } from "lucide-react";
import api from "../Components/api";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const pct = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getValue(row, field, fallback = "") {
  const pascal = field.charAt(0).toUpperCase() + field.slice(1);
  return row?.[field] ?? row?.[pascal] ?? fallback;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-ES");
}

function getLineTotals(row) {
  const cantidad = Number(getValue(row, "cantidad", 0));
  const compra = Number(getValue(row, "precioCompra", 0));
  const venta = Number(getValue(row, "precioVenta", 0));
  const totalCompra = compra * cantidad;
  const totalVenta = venta * cantidad;
  const ganancia = totalVenta - totalCompra;

  return {
    cantidad,
    compra,
    venta,
    totalCompra,
    totalVenta,
    ganancia,
    utilidad: totalCompra > 0 ? (ganancia / totalCompra) * 100 : null,
  };
}

export default function StockParts() {
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [providers, setProviders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    idProveedor: "",
    precioCompra: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const pageSize = 20;

  const loadParts = async () => {
    try {
      setLoading(true);
      setNotice(null);

      const res = await api.get("/RepuestoStock", {
        params: {
          search: search || undefined,
          esFacturado: true,
          fechaInicio: dateFrom || undefined,
          fechaFin: dateTo || undefined,
          page,
          pageSize,
        },
      });

      const pack = res?.data?.data?.[0];
      setParts(pack?.items || []);
      setTotal(pack?.total || 0);
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: "No se pudo cargar la rentabilidad de repuestos facturados.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFrom, dateTo, page]);

  useEffect(() => {
    api
      .get("/Proveedor", { params: { page: 1, pageSize: 100 } })
      .then((res) => setProviders(res?.data?.data?.[0]?.items || []))
      .catch((err) => {
        console.error(err);
        setProviders([]);
      });
  }, []);

  const summary = useMemo(() => {
    return parts.reduce(
      (acc, row) => {
        const totals = getLineTotals(row);

        acc.cantidad += totals.cantidad;
        acc.compra += totals.totalCompra;
        acc.venta += totals.totalVenta;
        acc.ganancia += totals.ganancia;
        return acc;
      },
      { cantidad: 0, compra: 0, venta: 0, ganancia: 0 },
    );
  }, [parts]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const invoiceGroups = useMemo(() => {
    const map = new Map();

    for (const row of parts) {
      const invoiceNumber = getValue(row, "numeroFactura", "Sin factura") || "Sin factura";
      const existing = map.get(invoiceNumber) || {
        numeroFactura: invoiceNumber,
        fechaFactura: getValue(row, "fechaFactura"),
        cliente: getValue(row, "cliente", "-"),
        matricula: getValue(row, "matricula", "-"),
        rows: [],
        compra: 0,
        venta: 0,
        ganancia: 0,
      };

      const totals = getLineTotals(row);
      existing.rows.push(row);
      existing.compra += totals.totalCompra;
      existing.venta += totals.totalVenta;
      existing.ganancia += totals.ganancia;
      map.set(invoiceNumber, existing);
    }

    return Array.from(map.values());
  }, [parts]);

  const startEdit = (row) => {
    setNotice(null);
    setEditingId(getValue(row, "id"));
    setEditForm({
      idProveedor: String(getValue(row, "idProveedor", "") || ""),
      precioCompra: String(getValue(row, "precioCompra", 0) || ""),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      idProveedor: "",
      precioCompra: "",
    });
  };

  const saveEdit = async () => {
    if (!editingId || savingEdit) return;

    try {
      setSavingEdit(true);
      setNotice(null);

      const payload = {
        idProveedor: editForm.idProveedor ? Number(editForm.idProveedor) : 0,
        precioCompra: Number(editForm.precioCompra || 0),
      };

      const res = await api.patch(`/RepuestoStock/${editingId}/rentabilidad`, payload);
      const updated = res?.data?.data?.[0];

      if (updated) {
        setParts((current) =>
          current.map((row) =>
            String(getValue(row, "id")) === String(editingId) ? updated : row,
          ),
        );
      } else {
        await loadParts();
      }

      cancelEdit();
      setNotice({
        type: "success",
        text: "Linea de rentabilidad actualizada correctamente.",
      });
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: err?.response?.data?.message || err?.message || "No se pudo actualizar la linea.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <div className="mt-2 mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Rentabilidad de lineas facturadas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Margen real por concepto vendido desde facturas emitidas.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
      </div>

      {notice && (
        <div className={`mb-4 rounded-xl p-3 text-sm ring-1 ${
          notice.type === "success"
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-rose-50 text-rose-700 ring-rose-200"
        }`}>
          {notice.text}
        </div>
      )}

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total venta
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {eur.format(summary.venta)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total compra
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {eur.format(summary.compra)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ganancia
          </p>
          <p className={`mt-2 text-xl font-bold ${summary.ganancia >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {eur.format(summary.ganancia)}
          </p>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Lineas facturadas
          </h3>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[160px_160px_minmax(260px,1fr)_auto]">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setPage(1);
                setDateFrom(e.target.value);
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              aria-label="Fecha inicio"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setPage(1);
                setDateTo(e.target.value);
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              aria-label="Fecha fin"
            />
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="Buscar factura, cliente, matricula o concepto..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            {(dateFrom || dateTo || search) && (
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setDateFrom("");
                  setDateTo("");
                  setSearch("");
                }}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-3 text-center">Fecha</th>
                <th className="px-3 py-3 text-center">Factura</th>
                <th className="px-3 py-3 text-center">Cliente</th>
                <th className="px-3 py-3 text-center">Matricula</th>
                <th className="px-3 py-3 text-center">Concepto</th>
                <th className="px-3 py-3 text-center">Proveedor</th>
                <th className="px-3 py-3 text-center">Cant.</th>
                <th className="px-3 py-3 text-center">Compra</th>
                <th className="px-3 py-3 text-center">Venta</th>
                <th className="px-3 py-3 text-center">Ganancia</th>
                <th className="px-3 py-3 text-center">% utilidad</th>
                <th className="px-3 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {invoiceGroups.map((group) => (
                <React.Fragment key={group.numeroFactura}>
                  <tr className="border-t border-slate-200 bg-slate-100/80">
                    <td colSpan={12} className="px-4 py-3">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="font-bold text-slate-900">
                            {group.numeroFactura}
                          </span>
                          <span className="text-slate-600">
                            {formatDate(group.fechaFactura)}
                          </span>
                          <span className="text-slate-700">
                            {group.cliente}
                          </span>
                          <span className="text-slate-500">
                            {group.matricula}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span>Venta: <strong>{eur.format(group.venta)}</strong></span>
                          <span>Compra: <strong>{eur.format(group.compra)}</strong></span>
                          <span className={group.ganancia >= 0 ? "text-emerald-700" : "text-rose-700"}>
                            Ganancia: <strong>{eur.format(group.ganancia)}</strong>
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {group.rows.map((row) => {
                    const id = getValue(row, "id");
                    const totals = getLineTotals(row);
                    const isEditing = String(editingId) === String(id);

                    return (
                      <tr key={id} className="hover:bg-slate-50">
                        <td className="px-3 py-3 text-center text-slate-400">-</td>
                        <td className="px-3 py-3 text-center text-slate-400">-</td>
                        <td className="px-3 py-3 text-center text-slate-400">-</td>
                        <td className="px-3 py-3 text-center text-slate-400">-</td>
                        <td className="px-3 py-3 text-center font-semibold">
                          {getValue(row, "nombre", "-")}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isEditing ? (
                            <select
                              value={editForm.idProveedor}
                              onChange={(e) => setEditForm((current) => ({ ...current, idProveedor: e.target.value }))}
                              className="w-48 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                              aria-label="Proveedor"
                            >
                              <option value="">Sin proveedor</option>
                              {providers.map((provider) => {
                                const providerId = provider.id ?? provider.Id;
                                return (
                                  <option key={providerId} value={providerId}>
                                    {provider.nombre ?? provider.Nombre}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            getValue(row, "nombreProveedor", "-") || "-"
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold">
                          {pct.format(totals.cantidad)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editForm.precioCompra}
                              onChange={(e) => setEditForm((current) => ({ ...current, precioCompra: e.target.value }))}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                              aria-label="Precio compra"
                            />
                          ) : (
                            eur.format(totals.compra)
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {eur.format(totals.venta)}
                        </td>
                        <td className={`px-3 py-3 text-center font-semibold ${totals.ganancia >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {eur.format(totals.ganancia)}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold">
                          {totals.utilidad == null ? "-" : `${pct.format(totals.utilidad)}%`}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isEditing ? (
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                disabled={savingEdit}
                                onClick={saveEdit}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                <Save size={14} />
                                Guardar
                              </button>
                              <button
                                type="button"
                                disabled={savingEdit}
                                onClick={cancelEdit}
                                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
                              >
                                <X size={14} />
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(row)}
                              className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

              {!loading && parts.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    No hay lineas facturadas para mostrar.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    Cargando rentabilidad...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </section>
    </>
  );
}
