import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "../../../Components/api";
import Loader from "../../../Components/Loader";
import ProviderSearchInput from "./ProviderSearchInput";
import { useExpenseTypes } from "../hooks/useExpenseTypes";
import { useProviders } from "../hooks/useProviders";
import {
  calcInvoiceLine,
  sumInvoiceLines,
} from "../utils/purchaseCalculations";
import { formatCurrency, formatDate } from "../utils/purchaseFormatters";
import {
  buildQuickProviderPayload,
  emptyQuickProviderForm,
  getCreatedProviderId,
  validateQuickProviderForm,
} from "../utils/supplierQuickCreate";

const createEmptyLine = () => ({
  id: crypto.randomUUID(),
  base: "",
  ivaPct: "21",
});

const initialForm = {
  fecha: "",
  fechaVencimiento: "",
  proveedor: "",
  proveedorId: "",
  numeroFactura: "",
  referencia: "",
  descripcion: "",
  tipoDocumento: "Factura",
  tipoGastoId: "",
  estado: "Pendiente de pago",
  bankAccountId: "",
  facturaOriginalId: "",
};

const CASH_PAYMENT_VALUE = "cash";

function normalizeState(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function SupplierInvoicesPanel({
  loadingInvoices,
  supplierInvoices,
  setSupplierInvoices,
  bankAccounts,
  loadSupplierInvoices,
}) {
  const [showForm, setShowForm] = useState(false);
  const [invoiceLines, setInvoiceLines] = useState([createEmptyLine()]);
  const [form, setForm] = useState(initialForm);
  const [showQuickProvider, setShowQuickProvider] = useState(false);
  const [quickProvider, setQuickProvider] = useState(emptyQuickProviderForm);
  const [quickProviderErrors, setQuickProviderErrors] = useState({});
  const [savingQuickProvider, setSavingQuickProvider] = useState(false);
  const { providers, reloadProviders } = useProviders();
  const { expenseTypes } = useExpenseTypes();

  const invoiceTotals = sumInvoiceLines(invoiceLines);

  useEffect(() => {
    if (!form.tipoGastoId && expenseTypes.length > 0) {
      const firstId = expenseTypes[0].id ?? expenseTypes[0].Id;
      setForm((prev) => ({ ...prev, tipoGastoId: String(firstId || "") }));
    }
  }, [expenseTypes, form.tipoGastoId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setQuickProviderField = (name, value) => {
    setQuickProvider((prev) => ({ ...prev, [name]: value }));
    if (quickProviderErrors[name]) {
      setQuickProviderErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const resetQuickProvider = () => {
    setQuickProvider(emptyQuickProviderForm);
    setQuickProviderErrors({});
  };

  const handleQuickProviderCreate = async () => {
    if (savingQuickProvider) return;

    const errors = validateQuickProviderForm(quickProvider);
    setQuickProviderErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = buildQuickProviderPayload(quickProvider);

    try {
      setSavingQuickProvider(true);
      const res = await api.post("/Proveedor", payload);

      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo registrar el proveedor.",
        );
      }

      const createdId = getCreatedProviderId(res?.data);
      const updatedProviders = await reloadProviders();
      const createdProvider =
        updatedProviders.find((provider) => {
          const id = provider.id ?? provider.Id;
          return String(id) === String(createdId);
        }) || null;

      setForm((prev) => ({
        ...prev,
        proveedorId: createdId ? String(createdId) : prev.proveedorId,
        proveedor:
          createdProvider?.nombre ??
          createdProvider?.Nombre ??
          payload.nombre,
      }));
      resetQuickProvider();
      setShowQuickProvider(false);
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo registrar el proveedor.",
      );
    } finally {
      setSavingQuickProvider(false);
    }
  };

  const setInvoiceLineField = (id, field, value) => {
    setInvoiceLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  };

  const addInvoiceLine = () => {
    setInvoiceLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeInvoiceLine = (id) => {
    setInvoiceLines((prev) =>
      prev.length === 1 ? prev : prev.filter((line) => line.id !== id),
    );
  };

  const resetForm = () => {
    setForm(initialForm);
    setInvoiceLines([createEmptyLine()]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const proveedorNombre = String(form.proveedor || "").trim();
    const numeroFactura = String(form.numeroFactura || "").trim();

    if (!form.fecha || !form.proveedorId || !proveedorNombre) {
      alert("Fecha y proveedor son obligatorios.");
      return;
    }

    if (!numeroFactura) {
      alert("El nº factura es obligatorio para documentos tipo Factura.");
      return;
    }

    if (!form.tipoGastoId) {
      alert("Selecciona el tipo de gasto.");
      return;
    }

    if (!form.estado) {
      alert("Selecciona el estado de la factura.");
      return;
    }

    const isCredit = form.tipoDocumento === "Rappel" || form.tipoDocumento === "Abono";
    const requiresOriginalInvoice = form.tipoDocumento === "Abono";
    if (requiresOriginalInvoice && !form.facturaOriginalId) {
      alert("Selecciona la factura original del abono.");
      return;
    }
    if (!isCredit && (invoiceTotals.base <= 0 || invoiceTotals.total <= 0)) {
      alert("Base y total deben ser mayores que 0.");
      return;
    }

    if (isCredit && (invoiceTotals.base >= 0 || invoiceTotals.total >= 0)) {
      alert("Base y total deben ser negativos para rappels o abonos.");
      return;
    }

    const estadoFactura = normalizeState(form.estado);

    if (estadoFactura.includes("pagad") && !form.bankAccountId) {
      alert("Selecciona el metodo de pago de la factura.");
      return;
    }

    const base = Math.round(invoiceTotals.base * 100) / 100;
    const iva = Math.round(invoiceTotals.iva * 100) / 100;
    const total = Math.round(invoiceTotals.total * 100) / 100;
    const lineasIva = invoiceLines
      .map((line) => {
        const calculated = calcInvoiceLine(line);

        return {
          base: calculated.base,
          ivaPct: calculated.ivaPct,
          iva: calculated.iva,
          total: calculated.total,
        };
      })
      .filter((line) => line.base !== 0);

    try {
      const payload = {
        fecha: form.fecha,
        fechaVencimiento: estadoFactura.includes("pagad")
          ? null
          : form.fechaVencimiento || null,
        proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
        proveedorNombre,
        numeroFactura: numeroFactura || null,
        referencia: form.referencia || null,
        descripcion: form.descripcion || null,
        tipoDocumento: form.tipoDocumento,
        tipoGastoId: Number(form.tipoGastoId),
        base,
        iva,
        total,
        estado: estadoFactura.includes("pagad") ? "Pagada" : "Pendiente de pago",
        bankAccountId:
          form.bankAccountId && form.bankAccountId !== CASH_PAYMENT_VALUE
            ? Number(form.bankAccountId)
            : null,
        facturaOriginalId: requiresOriginalInvoice && form.facturaOriginalId
          ? Number(form.facturaOriginalId)
          : null,
        lineasIva,
      };

      const res = await api.post("/FacturaRecibida", payload);

      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo registrar la factura recibida.",
        );
      }

      await loadSupplierInvoices();
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.response?.data?.detail ||
          err?.message ||
          "No se pudo registrar la factura recibida.",
      );
    }
  };

  const totals = supplierInvoices.reduce(
    (acc, item) => {
      acc.base += Number(item.base) || 0;
      acc.iva += Number(item.iva) || 0;
      acc.total += Number(item.total) || 0;
      return acc;
    },
    { base: 0, iva: 0, total: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Facturas recibidas
            </h3>
            <p className="text-sm text-slate-500">
              Registro inicial de compras. 
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus size={17} />
            {showForm ? "Ocultar formulario" : "Registrar factura"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="relative md:col-span-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Proveedor
              </label>

              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <ProviderSearchInput
                    providers={providers}
                    valueId={form.proveedorId}
                    valueName={form.proveedor}
                    onSelect={({ id, name }) =>
                      setForm((prev) => ({
                        ...prev,
                        proveedorId: id ? String(id) : "",
                        proveedor: name || "",
                        facturaOriginalId: "",
                      }))
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowQuickProvider(true)}
                  className="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
                >
                  + Nuevo
                </button>
              </div>

              {showQuickProvider && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar alta rapida de proveedor"
                    onClick={() => {
                      resetQuickProvider();
                      setShowQuickProvider(false);
                    }}
                    className="fixed inset-0 z-20 cursor-default bg-black/35"
                  />

                  <div className="absolute left-0 right-0 top-0 z-30 -mt-1 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Alta rapida de proveedor
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Crea el proveedor y seleccionalo en esta factura.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        resetQuickProvider();
                        setShowQuickProvider(false);
                      }}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={quickProvider.nombre}
                        onChange={(e) =>
                          setQuickProviderField("nombre", e.target.value)
                        }
                        className={`w-full rounded-xl border px-3 py-2 text-sm ${
                          quickProviderErrors.nombre
                            ? "border-rose-400 ring-1 ring-rose-200"
                            : "border-slate-300"
                        }`}
                        placeholder="Nombre del proveedor"
                      />
                      {quickProviderErrors.nombre && (
                        <p className="mt-1 text-xs text-rose-600">
                          {quickProviderErrors.nombre}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Telefono
                      </label>
                      <input
                        type="text"
                        value={quickProvider.telefono}
                        onChange={(e) =>
                          setQuickProviderField("telefono", e.target.value)
                        }
                        className={`w-full rounded-xl border px-3 py-2 text-sm ${
                          "border-slate-300"
                        }`}
                        placeholder="Telefono"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        NIF/CIF *
                      </label>
                      <input
                        type="text"
                        value={quickProvider.nifCif}
                        onChange={(e) =>
                          setQuickProviderField("nifCif", e.target.value)
                        }
                        className={`w-full rounded-xl border px-3 py-2 text-sm ${
                          quickProviderErrors.nifCif
                            ? "border-rose-400 ring-1 ring-rose-200"
                            : "border-slate-300"
                        }`}
                        placeholder="B12345678"
                      />
                      {quickProviderErrors.nifCif && (
                        <p className="mt-1 text-xs text-rose-600">
                          {quickProviderErrors.nifCif}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Categoria
                      </label>
                      <input
                        type="text"
                        value={quickProvider.categoria}
                        onChange={(e) =>
                          setQuickProviderField("categoria", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Repuestos, pintura, servicios..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={quickProvider.email}
                        onChange={(e) =>
                          setQuickProviderField("email", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        placeholder="correo@email.com"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={savingQuickProvider}
                      onClick={() => {
                        resetQuickProvider();
                        setShowQuickProvider(false);
                      }}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={savingQuickProvider}
                      onClick={handleQuickProviderCreate}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                    >
                      {savingQuickProvider ? "Guardando..." : "Crear proveedor"}
                    </button>
                  </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nº Factura
              </label>
              <input
                type="text"
                name="numeroFactura"
                value={form.numeroFactura}
                onChange={handleChange}
                placeholder="FRA-2026-001"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Referencia
              </label>
              <input
                type="text"
                name="referencia"
                value={form.referencia}
                onChange={handleChange}
                placeholder="Opcional"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tipo documento
              </label>
              <select
                name="tipoDocumento"
                value={form.tipoDocumento}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Factura">Factura</option>
                <option value="Ticket">Factura simplificada</option>
                <option value="Rappel">Rappel</option>
                <option value="Abono">Abono</option>
              </select>
            </div>

            {form.tipoDocumento === "Abono" && (
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Factura original
                </label>
                <select
                  name="facturaOriginalId"
                  value={form.facturaOriginalId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Selecciona la factura que se corrige</option>
                  {supplierInvoices
                    .filter(
                      (invoice) =>
                        String(invoice.proveedorId) ===
                          String(form.proveedorId) &&
                        invoice.estado !== "Anulada" &&
                        invoice.tipoDocumento !== "Abono" &&
                        invoice.tipoDocumento !== "Rappel",
                    )
                    .map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.numeroFactura} · {formatCurrency(invoice.total)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tipo de gasto
              </label>
              <select
                name="tipoGastoId"
                value={form.tipoGastoId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
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
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Descripción
              </label>
              <input
                type="text"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Compra de recambios, pintura, material..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Estado
              </label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Pendiente de pago">Pendiente de pago</option>
                <option value="Pagada">Pagada</option>
              </select>
            </div>

            {form.estado !== "Pagada" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Vencimiento
                </label>
                <input
                  type="date"
                  name="fechaVencimiento"
                  value={form.fechaVencimiento}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )}

            {form.estado === "Pagada" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Metodo de pago
                </label>
                <select
                  name="bankAccountId"
                  value={form.bankAccountId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Selecciona metodo</option>
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
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white md:col-span-4">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                <h4 className="text-sm font-bold text-slate-800">
                  Bases de la factura
                </h4>

                <button
                  type="button"
                  onClick={addInvoiceLine}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
                >
                  + Agregar línea
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Base imponible</th>
                      <th className="px-3 py-2 text-right">IVA</th>
                      <th className="px-3 py-2 text-right">Importe IVA</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {invoiceLines.map((line) => {
                      const total = calcInvoiceLine(line);

                      return (
                        <tr key={line.id}>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={line.base}
                              onChange={(e) =>
                                setInvoiceLineField(
                                  line.id,
                                  "base",
                                  e.target.value,
                                )
                              }
                              placeholder="0.00"
                              className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>

                          <td className="px-3 py-2 text-right">
                            <select
                              value={line.ivaPct}
                              onChange={(e) =>
                                setInvoiceLineField(
                                  line.id,
                                  "ivaPct",
                                  e.target.value,
                                )
                              }
                              className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
                            >
                              <option value="0">0%</option>
                              <option value="4">4%</option>
                              <option value="10">10%</option>
                              <option value="21">21%</option>
                            </select>
                          </td>

                          <td className="px-3 py-2 text-right font-semibold">
                            {formatCurrency(total.iva)}
                          </td>

                          <td className="px-3 py-2 text-right font-bold text-slate-900">
                            {formatCurrency(total.total)}
                          </td>

                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeInvoiceLine(line.id)}
                              className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot className="bg-slate-50">
                    <tr>
                      <th colSpan={2} className="px-3 py-2 text-right">
                        Totales
                      </th>
                      <th className="px-3 py-2 text-right font-bold">
                        {formatCurrency(invoiceTotals.iva)}
                      </th>
                      <th className="px-3 py-2 text-right font-bold">
                        {formatCurrency(invoiceTotals.total)}
                      </th>
                      <th></th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-semibold">Resumen:</span> Base{" "}
            {formatCurrency(invoiceTotals.base)} · IVA{" "}
            {formatCurrency(invoiceTotals.iva)} · Total{" "}
            <span className="font-bold text-slate-900">
              {formatCurrency(invoiceTotals.total)}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Guardar factura
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
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
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-left">Nº Factura</th>
                <th className="px-4 py-3 text-left">Referencia</th>
                <th className="px-4 py-3 text-right">Base</th>
                <th className="px-4 py-3 text-right">IVA</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loadingInvoices ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <Loader />
                  </td>
                </tr>
              ) : supplierInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Todavía no hay facturas recibidas registradas.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Registra la primera factura para empezar a construir el
                      módulo.
                    </p>
                  </td>
                </tr>
              ) : (
                supplierInvoices.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">{formatDate(item.fecha)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.proveedor}
                    </td>
                    <td className="px-4 py-3">{item.numeroFactura}</td>
                    <td className="px-4 py-3">{item.referencia || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.base)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.iva)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                          item.estado === "Pagada"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {item.estado}
                      </span>
                      {item.estado !== "Pagada" && item.fechaVencimiento ? (
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          Vence {formatDate(item.fechaVencimiento)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.estado === "Pagada" ? (
                        <span className="text-xs font-bold text-emerald-700">
                          Registrada
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700">
                         Por pagar 
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot className="bg-slate-50">
              <tr>
                <th
                  colSpan={3}
                  className="px-4 py-3 text-right font-bold text-slate-700"
                >
                  Totales
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(totals.base)}
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(totals.iva)}
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(totals.total)}
                </th>
                <th></th>
                <th></th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

