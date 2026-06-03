import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react";
import api from "../Components/api";

const EMPTY_PART = {
  Id: "",
  Nombre: "",
  CodigoReferencia: "",
  Marca: "",
  Categoria: "",
  Cantidad: "",
  StockMinimo: 3,
  PrecioCompra: "",
  PrecioVenta: "",
  UtilidadPct: "",
  Ubicacion: "",
  Observaciones: "",
  IdProveedor: "",
};

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export default function StockParts() {
  const [part, setPart] = useState(EMPTY_PART);
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const [lowStockModal, setLowStockModal] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);

  const setField = (name, value) => {
    setPart((prev) => ({ ...prev, [name]: value }));
  };

  const calculateSalePrice = (purchase, utilityPct) => {
    const precioCompra = Number(purchase || 0);
    const pct = Number(utilityPct || 0);
    if (precioCompra <= 0) return "";
    return ((precioCompra * (1 + pct / 100))).toFixed(2);
  };

  const calculateUtilityPct = (purchase, sale) => {
    const precioCompra = Number(purchase || 0);
    const precioVenta = Number(sale || 0);
    if (precioCompra <= 0 || precioVenta <= 0) return "";
    return (((precioVenta - precioCompra) / precioCompra) * 100).toFixed(2);
  };

  const handlePurchaseChange = (value) => {
    setPart((prev) => {
      const nextSale = prev.UtilidadPct !== ""
        ? calculateSalePrice(value, prev.UtilidadPct)
        : prev.PrecioVenta;
      return { ...prev, PrecioCompra: value, PrecioVenta: nextSale };
    });
  };

  const handleUtilityChange = (value) => {
    setPart((prev) => ({
      ...prev,
      UtilidadPct: value,
      PrecioVenta: calculateSalePrice(prev.PrecioCompra, value),
    }));
  };

  const loadSuppliers = async () => {
    const res = await api.get("/Proveedor", {
      params: { page: 1, pageSize: 100 },
    });

    const pack = res?.data?.data?.[0];
    setSuppliers(pack?.items || []);
  };

  const loadParts = async () => {
    try {
      const res = await api.get("/RepuestoStock", {
        params: { search, page, pageSize },
      });

      const pack = res?.data?.data?.[0];
      setParts(pack?.items || []);
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: "No se pudo cargar el stock de repuestos.",
      });
    }
  };

  const loadLowStock = async () => {
    try {
      const res = await api.get("/RepuestoStock/stock-bajo");
      const list = res?.data?.data?.[0] || [];

      setLowStockItems(list);

      if (list.length > 0) {
        setLowStockModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSuppliers();
    loadLowStock();
  }, []);

  useEffect(() => {
    loadParts();
  }, [search, page]);

  const stockSummary = useMemo(() => {
    const total = parts.length;
    const bajos = parts.filter(
      (x) =>
        Number(x.cantidad ?? x.Cantidad) <=
        Number(x.stockMinimo ?? x.StockMinimo),
    ).length;

    return { total, bajos };
  }, [parts]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);

      const payload = {
        nombre: part.Nombre,
        codigoReferencia: part.CodigoReferencia || null,
        marca: part.Marca || null,
        categoria: part.Categoria || null,
        cantidad: Number(part.Cantidad || 0),
        stockMinimo: Number(part.StockMinimo || 3),
        precioCompra: Number(part.PrecioCompra || 0),
        precioVenta: part.PrecioVenta ? Number(part.PrecioVenta) : null,
        ubicacion: part.Ubicacion || null,
        observaciones: part.Observaciones || null,
        idProveedor: Number(part.IdProveedor),
      };

      if (editingId) {
        await api.put(`/RepuestoStock/${editingId}`, payload);
        setNotice({
          type: "success",
          text: "Repuesto actualizado correctamente.",
        });
      } else {
        await api.post("/RepuestoStock", payload);
        setNotice({
          type: "success",
          text: "Repuesto registrado correctamente.",
        });
      }

      setPart(EMPTY_PART);
      setEditingId(null);
      await loadParts();
      await loadLowStock();
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar el repuesto.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (x) => {
    const id = x.id ?? x.Id;

    setEditingId(id);

    setPart({
      Id: id,
      Nombre: x.nombre ?? x.Nombre ?? "",
      CodigoReferencia: x.codigoReferencia ?? x.CodigoReferencia ?? "",
      Marca: x.marca ?? x.Marca ?? "",
      Categoria: x.categoria ?? x.Categoria ?? "",
      Cantidad: x.cantidad ?? x.Cantidad ?? "",
      StockMinimo: x.stockMinimo ?? x.StockMinimo ?? 3,
      PrecioCompra: x.precioCompra ?? x.PrecioCompra ?? "",
      PrecioVenta: x.precioVenta ?? x.PrecioVenta ?? "",
      UtilidadPct: calculateUtilityPct(
        x.precioCompra ?? x.PrecioCompra ?? "",
        x.precioVenta ?? x.PrecioVenta ?? "",
      ),
      Ubicacion: x.ubicacion ?? x.Ubicacion ?? "",
      Observaciones: x.observaciones ?? x.Observaciones ?? "",
      IdProveedor: x.idProveedor ?? x.IdProveedor ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removePart = async (x) => {
    const id = x.id ?? x.Id;
    const nombre = x.nombre ?? x.Nombre;

    const ok = window.confirm(`¿Eliminar el repuesto ${nombre}?`);
    if (!ok) return;

    await api.delete(`/RepuestoStock/${id}`);
    await loadParts();
    await loadLowStock();
  };

  const cls =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-2 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Rentabilidad de repuestos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Controla piezas, proveedores, costos, utilidad y alertas de stock bajo.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-xl p-3 text-sm ring-1 ${
            notice.type === "error"
              ? "bg-rose-50 text-rose-700 ring-rose-200"
              : "bg-emerald-50 text-emerald-700 ring-emerald-200"
          }`}
        >
          {notice.text}
        </div>
      )}

      {stockSummary.bajos > 0 && (
        <button
          type="button"
          onClick={() => setLowStockModal(true)}
          className="mb-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 transition"
        >
          <AlertTriangle size={18} />
          Hay {stockSummary.bajos} repuesto(s) con stock bajo
        </button>
      )}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 space-y-5"
      >
        <h3 className="text-lg font-semibold text-slate-800">
          {editingId ? "Actualizar repuesto" : "Registrar repuesto"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            className={cls}
            placeholder="Nombre del repuesto *"
            value={part.Nombre}
            onChange={(e) => setField("Nombre", e.target.value)}
            required
          />

          <input
            className={cls}
            placeholder="Referencia / código"
            value={part.CodigoReferencia}
            onChange={(e) => setField("CodigoReferencia", e.target.value)}
          />

          <input
            className={cls}
            placeholder="Marca"
            value={part.Marca}
            onChange={(e) => setField("Marca", e.target.value)}
          />

          <input
            className={cls}
            placeholder="Categoría"
            value={part.Categoria}
            onChange={(e) => setField("Categoria", e.target.value)}
          />

          <input
            type="number"
            className={cls}
            placeholder="Cantidad *"
            value={part.Cantidad}
            onChange={(e) => setField("Cantidad", e.target.value)}
            required
          />

          <input
            type="number"
            className={cls}
            placeholder="Stock mínimo"
            value={part.StockMinimo}
            onChange={(e) => setField("StockMinimo", e.target.value)}
          />

          <input
            type="number"
            step="0.01"
            className={cls}
            placeholder="Precio compra"
            value={part.PrecioCompra}
            onChange={(e) => handlePurchaseChange(e.target.value)}
          />

          <input
            type="number"
            step="0.01"
            className={cls}
            placeholder="% utilidad"
            value={part.UtilidadPct}
            onChange={(e) => handleUtilityChange(e.target.value)}
          />

          <input
            type="number"
            step="0.01"
            className={cls}
            placeholder="Precio venta calculado"
            value={part.PrecioVenta}
            onChange={(e) =>
              setPart((prev) => ({
                ...prev,
                PrecioVenta: e.target.value,
                UtilidadPct: calculateUtilityPct(prev.PrecioCompra, e.target.value),
              }))
            }
          />

          <select
            className={cls}
            value={part.IdProveedor}
            onChange={(e) => setField("IdProveedor", e.target.value)}
            required
          >
            <option value="">Selecciona proveedor *</option>
            {suppliers.map((s) => (
              <option key={s.id ?? s.Id} value={s.id ?? s.Id}>
                {s.nombre ?? s.Nombre}
              </option>
            ))}
          </select>

          <input
            className={cls}
            placeholder="Ubicación"
            value={part.Ubicacion}
            onChange={(e) => setField("Ubicacion", e.target.value)}
          />

          <textarea
            className={`${cls} md:col-span-2`}
            rows={2}
            placeholder="Observaciones"
            value={part.Observaciones}
            onChange={(e) => setField("Observaciones", e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center rounded-xl px-5 py-3 bg-teal-700 text-white hover:bg-teal-800 transition shadow-sm font-semibold disabled:opacity-60"
          >
            {submitting
              ? "Guardando..."
              : editingId
                ? "Actualizar repuesto"
                : "Registrar repuesto"}
          </button>

          <button
            type="button"
            onClick={() => {
              setPart(EMPTY_PART);
              setEditingId(null);
            }}
            className="inline-flex items-center rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
          >
            Limpiar
          </button>
        </div>
      </form>

      <section className="mt-8 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Rentabilidad registrada
          </h3>

          <input
            type="text"
            placeholder="Buscar por repuesto, proveedor, marca o referencia..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full md:w-96 rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-center py-3 px-3">Repuesto</th>
                <th className="text-center py-3 px-3">Proveedor</th>
                <th className="text-center py-3 px-3">Categoría</th>
                <th className="text-center py-3 px-3">Cantidad</th>
                <th className="text-center py-3 px-3">Compra</th>
                <th className="text-center py-3 px-3">% utilidad</th>
                <th className="text-center py-3 px-3">Venta</th>
                <th className="text-center py-3 px-3">Ganancia</th>
                <th className="text-center py-3 px-3">Estado</th>
                <th className="text-center py-3 px-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {parts.map((x) => {
                const id = x.id ?? x.Id;
                const cantidad = Number(x.cantidad ?? x.Cantidad ?? 0);
                const stockMinimo = Number(x.stockMinimo ?? x.StockMinimo ?? 3);
                const precioCompra = Number(x.precioCompra ?? x.PrecioCompra ?? 0);
                const precioVenta = Number(x.precioVenta ?? x.PrecioVenta ?? 0);
                const ganancia = precioVenta - precioCompra;
                const utilidadPct = precioCompra > 0
                  ? (ganancia / precioCompra) * 100
                  : 0;
                const bajo = cantidad <= stockMinimo;

                return (
                  <tr key={id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-center font-semibold">
                      {x.nombre ?? x.Nombre}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {x.nombreProveedor ?? x.NombreProveedor ?? "—"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {x.categoria ?? x.Categoria ?? "—"}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {cantidad}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {eur.format(
                        precioCompra,
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">
                      {utilidadPct.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      {eur.format(precioVenta)}
                    </td>
                    <td className={`py-3 px-3 text-center font-semibold ${ganancia >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {eur.format(ganancia)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                          bajo
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        }`}
                      >
                        {bajo ? "Stock bajo" : "Disponible"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(x)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-sky-600 text-white hover:bg-sky-700"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => removePart(x)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {parts.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-500">
                    No hay repuestos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {lowStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-600" />
              Alerta de stock bajo
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Estos repuestos tienen pocas unidades disponibles.
            </p>

            <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {lowStockItems.map((x) => (
                <div
                  key={x.id ?? x.Id}
                  className="py-3 flex justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {x.nombre ?? x.Nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      Proveedor: {x.nombreProveedor ?? x.NombreProveedor ?? "—"}
                    </p>
                  </div>

                  <span className="text-sm font-bold text-amber-700">
                    {x.cantidad ?? x.Cantidad} uds.
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setLowStockModal(false)}
                className="rounded-xl px-4 py-2 bg-slate-700 text-white hover:bg-slate-800"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
