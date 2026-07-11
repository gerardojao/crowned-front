import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import api from "../../../Components/api";
import Loader from "../../../Components/Loader";
import { useBankAccounts } from "../hooks/useBankAccounts";
import { useExpenseTypes } from "../hooks/useExpenseTypes";
import {
  buildMiscExpensePayload,
  getMiscExpenseItems,
  validateMiscExpenseForm,
} from "../utils/miscExpenses";
import { formatCurrency, formatDate } from "../utils/purchaseFormatters";

const initialForm = {
  numeroComprobante: "",
  fecha: new Date().toISOString().slice(0, 10),
  proveedorNombre: "",
  descripcion: "",
  tipoGastoId: "",
  importe: "",
  bankAccountId: "",
};

export default function MiscExpensesPanel() {
  const { expenseTypes } = useExpenseTypes();
  const { bankAccounts } = useBankAccounts();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const totals = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.importe || 0), 0),
    [items],
  );

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (!next.tipoGastoId && expenseTypes.length > 0) {
        const first = expenseTypes[0];
        next.tipoGastoId = String(first.id ?? first.Id ?? "");
      }
      if (!next.bankAccountId && bankAccounts.length > 0) {
        const main =
          bankAccounts.find((bank) => bank.esPrincipal ?? bank.EsPrincipal) ||
          bankAccounts[0];
        next.bankAccountId = String(main?.id ?? main?.Id ?? "");
      }
      return next;
    });
  }, [bankAccounts, expenseTypes]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/FichaEgreso/gastos-varios");
      setItems(getMiscExpenseItems(res));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    const mainBank =
      bankAccounts.find((bank) => bank.esPrincipal ?? bank.EsPrincipal) ||
      bankAccounts[0];
    const firstExpense = expenseTypes[0];
    setForm({
      ...initialForm,
      fecha: new Date().toISOString().slice(0, 10),
      tipoGastoId: String(firstExpense?.id ?? firstExpense?.Id ?? ""),
      bankAccountId: String(mainBank?.id ?? mainBank?.Id ?? ""),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const errors = validateMiscExpenseForm(form);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      alert(firstError);
      return;
    }

    try {
      setSaving(true);
      const payload = buildMiscExpensePayload(form);
      const res = editingId
        ? await api.put(`/FichaEgreso/gastos-varios/${editingId}`, payload)
        : await api.post("/FichaEgreso/gastos-varios", payload);

      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo registrar el gasto.",
        );
      }

      await loadItems();
      resetForm();
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.response?.data?.detail ||
          err?.message ||
          "No se pudo registrar el gasto.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id ?? item.Id);
    setForm({
      numeroComprobante: item.numeroComprobante ?? item.NumeroComprobante ?? "",
      fecha: String(item.fecha ?? item.Fecha ?? new Date().toISOString()).slice(0, 10),
      proveedorNombre: item.proveedorNombre ?? item.ProveedorNombre ?? "",
      descripcion: item.descripcion ?? item.Descripcion ?? "",
      tipoGastoId: String(item.tipoGastoId ?? item.TipoGastoId ?? ""),
      importe: String(item.importe ?? item.Importe ?? ""),
      bankAccountId: String(item.bankAccountId ?? item.BankAccountId ?? ""),
    });
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    const id = item.id ?? item.Id;
    if (!id) return;
    const label = item.numeroComprobante || item.NumeroComprobante || id;
    if (!window.confirm(`Eliminar el gasto vario ${label}?`)) return;

    try {
      setSaving(true);
      const res = await api.delete(`/FichaEgreso/gastos-varios/${id}`);
      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo eliminar el gasto.",
        );
      }
      await loadItems();
      if (editingId === id) {
        resetForm();
        setEditingId(null);
        setShowForm(false);
      }
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.response?.data?.detail ||
          err?.message ||
          "No se pudo eliminar el gasto.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Gastos varios
            </h3>
            <p className="text-sm text-slate-500">
              Gastos sin factura ni IVA, pagados de contado desde banco.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
                setEditingId(null);
                setShowForm(false);
              } else {
                setShowForm(true);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus size={17} />
            {showForm ? "Ocultar formulario" : "Registrar gasto"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Numero de comprobante *
              <input
                type="text"
                value={form.numeroComprobante}
                onChange={(e) => setField("numeroComprobante", e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Fecha *
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setField("fecha", e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Importe *
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.importe}
                onChange={(e) => setField("importe", e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Nombre del proveedor *
              <input
                type="text"
                value={form.proveedorNombre}
                onChange={(e) => setField("proveedorNombre", e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Tipo de gasto *
              <select
                value={form.tipoGastoId}
                onChange={(e) => setField("tipoGastoId", e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecciona</option>
                {expenseTypes.map((type) => {
                  const id = type.id ?? type.Id;
                  const name = type.nombre ?? type.Nombre ?? "Gasto";
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Banco *
              <select
                value={form.bankAccountId}
                onChange={(e) => setField("bankAccountId", e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecciona banco</option>
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
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-3">
              Descripcion
              <textarea
                rows={3}
                value={form.descripcion}
                onChange={(e) => setField("descripcion", e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Detalle opcional del gasto"
              />
            </label>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-semibold">Movimiento:</span> aumenta gastos
            por {formatCurrency(Number(form.importe) || 0)} y disminuye banco
            por el mismo importe. IVA 0.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "Guardando..." : editingId ? "Actualizar gasto" : "Guardar gasto"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                resetForm();
                setEditingId(null);
                setShowForm(false);
              }}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Comprobante</th>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-left">Descripcion</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Banco</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <Loader />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Todavia no hay gastos varios registrados.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id ?? item.Id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">{formatDate(item.fecha)}</td>
                    <td className="px-4 py-3">
                      {item.numeroComprobante || "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.proveedorNombre || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.descripcion || "-"}
                    </td>
                    <td className="px-4 py-3">{item.tipoGastoNombre || "-"}</td>
                    <td className="px-4 py-3">
                      {item.bankAccountName || "Sin banco"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.importe)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="Editar gasto"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          title="Eliminar gasto"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot className="bg-slate-50">
              <tr>
                <th
                  colSpan={7}
                  className="px-4 py-3 text-right font-bold text-slate-700"
                >
                  Total
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(totals)}
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
