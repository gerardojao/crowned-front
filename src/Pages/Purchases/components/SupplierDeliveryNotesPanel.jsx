import { useMemo, useState } from "react";
import { Eye, Plus, X } from "lucide-react";
import api from "../../../Components/api";
import Loader from "../../../Components/Loader";
import { useBankAccounts } from "../hooks/useBankAccounts";
import { useDeliveryNotes } from "../hooks/useDeliveryNotes";
import { useProviders } from "../hooks/useProviders";
import {
  calcDeliveryLine,
  sumDeliveryLines,
} from "../utils/purchaseCalculations";
import { formatCurrency, formatDate } from "../utils/purchaseFormatters";

const createEmptyLine = () => ({
  id: crypto.randomUUID(),
  repuestoStockId: "",
  codigoReferencia: "",
  nombre: "",
  marca: "",
  cantidad: "1",
  precioCompra: "",
  ivaPct: "21",
});

const initialHeader = {
  idProveedor: "",
  numeroAlbaran: "",
  fecha: new Date().toISOString().slice(0, 10),
  observaciones: "",
};

function isPendingInvoice(note) {
  const estado = String(note?.estado || "").toLowerCase();
  if (note?.facturaRecibidaId || estado.includes("facturado")) return false;
  return estado.includes("pendiente") || estado.includes("factura");
}

// function isPendingInvoice(note) {
//   const estado = String(note?.estado || "").toLowerCase();

//   if (note?.facturaRecibidaId) return false;

//   return estado === "pendiente de facturar";
// }

function buildVatBuckets(notes) {
  const buckets = {
    base0: 0,
    base4: 0,
    iva4: 0,
    base10: 0,
    iva10: 0,
    base21: 0,
    iva21: 0,
    baseMixta: 0,
    ivaMixta: 0,
  };

  notes.forEach((note) => {
    const lines = Array.isArray(note.lineas) ? note.lineas : [];

    if (lines.length === 0) {
      buckets.baseMixta += Number(note.base) || 0;
      buckets.ivaMixta += Number(note.iva) || 0;
      return;
    }

    lines.forEach((line) => {
      const rate = Number(line.ivaPct) || 0;
      const base = Number(line.base) || 0;
      const iva = Number(line.iva) || 0;

      if (rate === 0) {
        buckets.base0 += base;
      } else if (rate === 4) {
        buckets.base4 += base;
        buckets.iva4 += iva;
      } else if (rate === 10) {
        buckets.base10 += base;
        buckets.iva10 += iva;
      } else if (rate === 21) {
        buckets.base21 += base;
        buckets.iva21 += iva;
      } else {
        buckets.baseMixta += base;
        buckets.ivaMixta += iva;
      }
    });
  });

  return buckets;
}

export default function SupplierDeliveryNotesPanel({ onNotesChanged }) {
  const { notes, loadingNotes, loadNotes, loadNoteDetail } = useDeliveryNotes();
  const { bankAccounts } = useBankAccounts();
  const { providers } = useProviders();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingNoteId, setCancellingNoteId] = useState(null);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [header, setHeader] = useState(initialHeader);
  const [lines, setLines] = useState([createEmptyLine()]);
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [detailNote, setDetailNote] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [invoiceForm, setInvoiceForm] = useState({
    open: false,
    numeroFactura: "",
    fecha: new Date().toISOString().slice(0, 10),
    referencia: "",
    descripcion: "",
    estado: "Pendiente de pago",
    bankAccountId: "",
  });

  const deliveryTotals = sumDeliveryLines(lines);
  const selectedNotes = useMemo(
    () => notes.filter((note) => selectedNoteIds.includes(note.id)),
    [notes, selectedNoteIds],
  );
  const selectedTotals = selectedNotes.reduce(
    (acc, note) => {
      acc.base += Number(note.base) || 0;
      acc.iva += Number(note.iva) || 0;
      acc.total += Number(note.total) || 0;
      return acc;
    },
    { base: 0, iva: 0, total: 0 },
  );
  const selectedVatBuckets = useMemo(
    () => buildVatBuckets(selectedNotes),
    [selectedNotes],
  );

  const resetForm = () => {
    setHeader(initialHeader);
    setLines([createEmptyLine()]);
  };

  const setLineField = (id, field, value) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (id) => {
    setLines((prev) =>
      prev.length === 1 ? prev : prev.filter((line) => line.id !== id),
    );
  };

  const toggleNote = (noteId) => {
    setSelectedNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId],
    );
  };

  const openInvoiceForm = () => {
    if (selectedNotes.length === 0) return;

    const providerId = selectedNotes[0]?.idProveedor;
    if (selectedNotes.some((note) => note.idProveedor !== providerId)) {
      alert("Selecciona albaranes del mismo proveedor.");
      return;
    }

    const mainBank =
      bankAccounts.find((bank) => bank.esPrincipal ?? bank.EsPrincipal) ||
      bankAccounts[0];

    setInvoiceForm((prev) => ({
      ...prev,
      open: true,
      fecha: new Date().toISOString().slice(0, 10),
      descripcion:
        prev.descripcion ||
        `Factura de albaranes ${selectedNotes
          .map((note) => note.numeroAlbaran)
          .filter(Boolean)
          .join(", ")}`,
      bankAccountId: String(mainBank?.id ?? mainBank?.Id ?? ""),
    }));
  };

  const closeInvoiceForm = () => {
    if (invoiceSubmitting) return;
    setInvoiceForm((prev) => ({ ...prev, open: false }));
  };

  const openDetail = async (note) => {
    setDetailNote(note);
    setDetailError("");
    setDetailLoading(true);

    try {
      const detail = await loadNoteDetail(note.id);
      setDetailNote(detail);
    } catch (err) {
      setDetailError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          "No se pudo cargar el detalle del albaran.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (detailLoading) return;
    setDetailNote(null);
    setDetailError("");
  };

  const setInvoiceField = (field, value) => {
    setInvoiceForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitInvoiceFromNotes = async (e) => {
    e.preventDefault();
    if (invoiceSubmitting) return;

    if (selectedNotes.length === 0) {
      alert("Selecciona al menos un albarán.");
      return;
    }

    if (!invoiceForm.numeroFactura.trim()) {
      alert("Indica el numero de factura.");
      return;
    }

    if (invoiceForm.estado === "Pagada" && !invoiceForm.bankAccountId) {
      alert("Selecciona el banco para registrar la factura pagada.");
      return;
    }

    const payload = {
      albaranIds: selectedNoteIds,
      fecha: invoiceForm.fecha,
      numeroFactura: invoiceForm.numeroFactura.trim(),
      referencia: invoiceForm.referencia.trim() || null,
      descripcion: invoiceForm.descripcion.trim() || null,
      estado: invoiceForm.estado,
      bankAccountId:
        invoiceForm.estado === "Pagada"
          ? Number(invoiceForm.bankAccountId)
          : null,
    };

    try {
      setInvoiceSubmitting(true);
      const res = await api.post("/FacturaRecibida/desde-albaranes", payload);

      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo crear la factura desde albaranes.",
        );
      }

      await loadNotes();
      await onNotesChanged?.();
      setSelectedNoteIds([]);
      setInvoiceForm((prev) => ({
        ...prev,
        open: false,
        numeroFactura: "",
        referencia: "",
        descripcion: "",
        estado: "Pendiente de pago",
      }));
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.response?.data?.detail ||
          err?.message ||
          "No se pudo crear la factura desde albaranes.",
      );
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (!header.idProveedor) {
      alert("Selecciona un proveedor.");
      return;
    }

    if (!header.numeroAlbaran.trim()) {
      alert("Indica el número de albarán.");
      return;
    }

    const validLines = lines.filter((line) => line.nombre.trim());

    if (validLines.length === 0) {
      alert("Agrega al menos una línea válida.");
      return;
    }

    const invalidLine = validLines.find(
      (line) =>
        Number(line.cantidad) <= 0 ||
        Number(line.precioCompra) < 0 ||
        Number.isNaN(Number(line.precioCompra)),
    );

    if (invalidLine) {
      alert("Revisa cantidades y precios de las líneas.");
      return;
    }

    const payload = {
      idProveedor: Number(header.idProveedor),
      numeroAlbaran: header.numeroAlbaran.trim(),
      fecha: header.fecha,
      observaciones: header.observaciones?.trim() || null,
      lineas: validLines.map((line) => ({
        repuestoStockId: line.repuestoStockId
          ? Number(line.repuestoStockId)
          : null,
        codigoReferencia: line.codigoReferencia?.trim() || null,
        nombre: line.nombre.trim(),
        marca: line.marca?.trim() || null,
        cantidad: Number(line.cantidad),
        precioCompra: Number(line.precioCompra),
        ivaPct: Number(line.ivaPct),
      })),
    };

    try {
      setSubmitting(true);
      const res = await api.post("/Albaran", payload);

      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo guardar el albarán.",
        );
      }

      await loadNotes();
      await onNotesChanged?.();
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.response?.data?.detail ||
          err?.message ||
          "No se pudo guardar el albarán.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cancelDeliveryNote = async (note) => {
    if (!isPendingInvoice(note) || cancellingNoteId) return;

    const reason = window.prompt(
      `Motivo de anulación del albarán ${note.numeroAlbaran}:`,
    );
    if (!reason?.trim()) return;

    try {
      setCancellingNoteId(note.id);
      await api.post(`/Albaran/${note.id}/anular`, {
        motivo: reason.trim(),
      });
      setSelectedNoteIds((prev) => prev.filter((id) => id !== note.id));
      await loadNotes();
      await onNotesChanged?.();
    } catch (err) {
      alert(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          "No se pudo anular el albarán.",
      );
    } finally {
      setCancellingNoteId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Albaranes de proveedor
            </h3>
            <p className="text-sm text-slate-500">
              Entradas de material pendientes de facturar o ya vinculadas a una
              factura.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus size={17} />
            {showForm ? "Ocultar formulario" : "Nuevo albarán"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Proveedor
              </label>
              <select
                value={header.idProveedor}
                onChange={(e) =>
                  setHeader((prev) => ({
                    ...prev,
                    idProveedor: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecciona</option>
                {providers.map((provider) => {
                  const id = provider.id ?? provider.Id;
                  const nombre = provider.nombre ?? provider.Nombre;

                  return (
                    <option key={id} value={id}>
                      {nombre}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Número albarán
              </label>
              <input
                type="text"
                value={header.numeroAlbaran}
                onChange={(e) =>
                  setHeader((prev) => ({
                    ...prev,
                    numeroAlbaran: e.target.value,
                  }))
                }
                placeholder="ALB-2026-001"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha
              </label>
              <input
                type="date"
                value={header.fecha}
                onChange={(e) =>
                  setHeader((prev) => ({ ...prev, fecha: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Observaciones
              </label>
              <input
                type="text"
                value={header.observaciones}
                onChange={(e) =>
                  setHeader((prev) => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
                placeholder="Opcional"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
              <h4 className="text-sm font-bold text-slate-800">
                Líneas del albarán
              </h4>
              <button
                type="button"
                onClick={addLine}
                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
              >
                + Agregar línea
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Referencia</th>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Marca</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Precio</th>
                    <th className="px-3 py-2 text-right">IVA</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {lines.map((line) => {
                    const total = calcDeliveryLine(line);

                    return (
                      <tr key={line.id}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={line.codigoReferencia}
                            onChange={(e) =>
                              setLineField(
                                line.id,
                                "codigoReferencia",
                                e.target.value,
                              )
                            }
                            className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={line.nombre}
                            onChange={(e) =>
                              setLineField(line.id, "nombre", e.target.value)
                            }
                            className="w-56 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={line.marca}
                            onChange={(e) =>
                              setLineField(line.id, "marca", e.target.value)
                            }
                            className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={line.cantidad}
                            onChange={(e) =>
                              setLineField(line.id, "cantidad", e.target.value)
                            }
                            className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.precioCompra}
                            onChange={(e) =>
                              setLineField(
                                line.id,
                                "precioCompra",
                                e.target.value,
                              )
                            }
                            className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <select
                            value={line.ivaPct}
                            onChange={(e) =>
                              setLineField(line.id, "ivaPct", e.target.value)
                            }
                            className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
                          >
                            <option value="0">0%</option>
                            <option value="4">4%</option>
                            <option value="10">10%</option>
                            <option value="21">21%</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {formatCurrency(total.total)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
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
                    <th colSpan={5} className="px-3 py-2 text-right">
                      Totales
                    </th>
                    <th className="px-3 py-2 text-right font-bold">
                      {formatCurrency(deliveryTotals.iva)}
                    </th>
                    <th className="px-3 py-2 text-right font-bold">
                      {formatCurrency(deliveryTotals.total)}
                    </th>
                    <th></th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {submitting ? "Guardando..." : "Guardar albarán"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {selectedNotes.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">
                {selectedNotes.length} albarán(es) seleccionados · Total{" "}
                {formatCurrency(selectedTotals.total)}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-sky-800">
                <span>IVA 0: {formatCurrency(selectedVatBuckets.base0)}</span>
                <span>
                  IVA 4: {formatCurrency(selectedVatBuckets.base4)} +{" "}
                  {formatCurrency(selectedVatBuckets.iva4)}
                </span>
                <span>
                  IVA 10: {formatCurrency(selectedVatBuckets.base10)} +{" "}
                  {formatCurrency(selectedVatBuckets.iva10)}
                </span>
                <span>
                  IVA 21: {formatCurrency(selectedVatBuckets.base21)} +{" "}
                  {formatCurrency(selectedVatBuckets.iva21)}
                </span>
                {(selectedVatBuckets.baseMixta !== 0 ||
                  selectedVatBuckets.ivaMixta !== 0) && (
                  <span>
                    Mixto: {formatCurrency(selectedVatBuckets.baseMixta)} +{" "}
                    {formatCurrency(selectedVatBuckets.ivaMixta)}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={openInvoiceForm}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100"
            >
              Crear factura desde seleccion
            </button>
          </div>
        </div>
      )}

      {invoiceForm.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-slate-900/45"
            onClick={invoiceSubmitting ? undefined : closeInvoiceForm}
          />

          <form
            onSubmit={submitInvoiceFromNotes}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Crear factura desde albaranes
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {selectedNotes.length} albarán(es) · Total{" "}
                {formatCurrency(selectedTotals.total)}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700 sm:grid-cols-4">
                <span>IVA 0: {formatCurrency(selectedVatBuckets.base0)}</span>
                <span>
                  IVA 4: {formatCurrency(selectedVatBuckets.base4)} +{" "}
                  {formatCurrency(selectedVatBuckets.iva4)}
                </span>
                <span>
                  IVA 10: {formatCurrency(selectedVatBuckets.base10)} +{" "}
                  {formatCurrency(selectedVatBuckets.iva10)}
                </span>
                <span>
                  IVA 21: {formatCurrency(selectedVatBuckets.base21)} +{" "}
                  {formatCurrency(selectedVatBuckets.iva21)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Numero de factura *
                <input
                  type="text"
                  value={invoiceForm.numeroFactura}
                  onChange={(e) =>
                    setInvoiceField("numeroFactura", e.target.value)
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Fecha *
                <input
                  type="date"
                  value={invoiceForm.fecha}
                  onChange={(e) => setInvoiceField("fecha", e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Estado *
                <select
                  value={invoiceForm.estado}
                  onChange={(e) => setInvoiceField("estado", e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="Pendiente de pago">Pendiente de pago</option>
                  <option value="Pagada">Pagada</option>
                </select>
              </label>

              {invoiceForm.estado === "Pagada" && (
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
                  Banco *
                  <select
                    value={invoiceForm.bankAccountId}
                    onChange={(e) =>
                      setInvoiceField("bankAccountId", e.target.value)
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona banco</option>
                    {bankAccounts.map((bank) => {
                      const id = bank.id ?? bank.Id;
                      const name =
                        bank.nombre ?? bank.Nombre ?? "Cuenta bancaria";
                      const iban = bank.iban ?? bank.Iban ?? "";
                      return (
                        <option key={id} value={id}>
                          {iban ? `${name} - ${iban}` : name}
                        </option>
                      );
                    })}
                  </select>
                </label>
              )}

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
                Referencia
                <input
                  type="text"
                  value={invoiceForm.referencia}
                  onChange={(e) =>
                    setInvoiceField("referencia", e.target.value)
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
                Descripcion
                <textarea
                  rows={3}
                  value={invoiceForm.descripcion}
                  onChange={(e) =>
                    setInvoiceField("descripcion", e.target.value)
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={invoiceSubmitting}
                onClick={closeInvoiceForm}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={invoiceSubmitting}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {invoiceSubmitting ? "Creando..." : "Crear factura"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detailNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-slate-900/45"
            onClick={closeDetail}
          />

          <div className="relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Detalle del albaran
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {detailNote.proveedor} - {detailNote.numeroAlbaran || "-"} -{" "}
                  {formatDate(detailNote.fecha)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                disabled={detailLoading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
                aria-label="Cerrar detalle"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {detailLoading ? (
                <div className="py-12 text-center">
                  <Loader />
                </div>
              ) : detailError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                  {detailError}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Estado
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {detailNote.estado}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Base
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {formatCurrency(detailNote.base)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        IVA
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {formatCurrency(detailNote.iva)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Total
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {formatCurrency(detailNote.total)}
                      </p>
                    </div>
                  </div>

                  {detailNote.observaciones && (
                    <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      <span className="font-bold">Observaciones: </span>
                      {detailNote.observaciones}
                    </div>
                  )}

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3 text-left">Referencia</th>
                            <th className="px-4 py-3 text-left">Concepto</th>
                            <th className="px-4 py-3 text-left">Marca</th>
                            <th className="px-4 py-3 text-right">Cant.</th>
                            <th className="px-4 py-3 text-right">Precio</th>
                            <th className="px-4 py-3 text-right">IVA %</th>
                            <th className="px-4 py-3 text-right">Base</th>
                            <th className="px-4 py-3 text-right">IVA</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailNote.lineas.length === 0 ? (
                            <tr>
                              <td
                                colSpan={9}
                                className="px-4 py-8 text-center text-sm font-semibold text-slate-600"
                              >
                                Este albaran no tiene lineas registradas.
                              </td>
                            </tr>
                          ) : (
                            detailNote.lineas.map((line) => (
                              <tr
                                key={line.id}
                                className="border-t border-slate-100"
                              >
                                <td className="px-4 py-3">
                                  {line.codigoReferencia || "-"}
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  {line.nombre || "-"}
                                </td>
                                <td className="px-4 py-3">
                                  {line.marca || "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {line.cantidad}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {formatCurrency(line.precioCompra)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {line.ivaPct}%
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {formatCurrency(line.base)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {formatCurrency(line.iva)}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                  {formatCurrency(line.total)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-center">Sel.</th>
                <th className="px-4 py-3 text-center">Fecha</th>
                <th className="px-4 py-3 text-center">Proveedor</th>
                <th className="px-4 py-3 text-center">Número albarán</th>
                <th className="px-4 py-3 text-center">Base</th>
                <th className="px-4 py-3 text-center">IVA</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loadingNotes ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <Loader />
                  </td>
                </tr>
              ) : notes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Todavía no hay albaranes registrados.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Registra el primer albarán para controlar entradas de
                      material.
                    </p>
                  </td>
                </tr>
              ) : (
                notes.map((note) => {
                  const selectable = isPendingInvoice(note);

                  return (
                    <tr
                      key={note.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          disabled={!selectable}
                          checked={selectedNoteIds.includes(note.id)}
                          onChange={() => toggleNote(note.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3">{formatDate(note.fecha)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {note.proveedor}
                      </td>
                      <td className="px-4 py-3">{note.numeroAlbaran}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(note.base)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(note.iva)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(note.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                            selectable
                              ? "bg-amber-50 text-amber-700 ring-amber-200"
                              : "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {note.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(note)}
                            className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                          >
                            <Eye size={14} className="mr-1.5" />
                            Ver
                          </button>
                        {selectable && (
                          <button
                            type="button"
                            disabled={cancellingNoteId === note.id}
                            onClick={() => cancelDeliveryNote(note)}
                            className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 disabled:opacity-60"
                          >
                            {cancellingNoteId === note.id
                              ? "Anulando..."
                              : "Anular"}
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
