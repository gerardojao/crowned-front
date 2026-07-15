import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus, X } from "lucide-react";
import api from "../../../Components/api";
import Loader from "../../../Components/Loader";
import ProviderSearchInput from "./ProviderSearchInput";
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
  descuentoPct: "",
  ivaPct: "0",
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

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeReference = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const partValue = (part, field, fallback = "") => {
  const pascal = field.charAt(0).toUpperCase() + field.slice(1);
  return part?.[field] ?? part?.[pascal] ?? fallback;
};

function PartReferenceInput({ line, onChange, onSelect }) {
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const query = String(line.codigoReferencia || "");

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    let alive = true;
    const search = query.trim();

    if (!search) {
      setMatches([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/RepuestoStock", {
          params: {
            search,
            esFacturado: false,
            page: 1,
            pageSize: 8,
          },
        });
        if (!alive) return;
        setMatches(res?.data?.data?.[0]?.items || []);
      } catch {
        if (alive) setMatches([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 220);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const exactMatch = matches.find(
    (part) =>
      normalizeReference(partValue(part, "codigoReferencia")) ===
      normalizeReference(query),
  );
  const isExistingUnselected = Boolean(
    query.trim() && exactMatch && !line.repuestoStockId,
  );

  return (
    <div ref={wrapperRef} className="relative w-44">
      <input
        type="text"
        value={line.codigoReferencia}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        className={`w-full rounded-lg border px-2 py-1 text-sm ${
          isExistingUnselected
            ? "border-amber-300 bg-amber-50"
            : "border-slate-300"
        }`}
        placeholder="Buscar referencia"
      />

      {line.repuestoStockId && (
        <p className="mt-1 text-[11px] font-semibold text-emerald-700">
          Stock vinculado #{line.repuestoStockId}
        </p>
      )}

      {isExistingUnselected && (
        <p className="mt-1 text-[11px] font-semibold text-amber-700">
          Esta referencia ya existe. Seleccionala de la lista.
        </p>
      )}

      {!line.repuestoStockId && query.trim() && !exactMatch && (
        <p className="mt-1 text-[11px] font-semibold text-slate-500">
          Si guardas la linea, se creara como repuesto nuevo.
        </p>
      )}

      {open && query.trim() && (
        <div className="absolute left-0 top-full z-40 mt-1 max-h-72 w-80 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            {loading ? "Buscando stock..." : "Coincidencias de stock"}
          </div>

          {matches.length === 0 ? (
            <div className="px-3 py-3 text-sm font-semibold text-slate-500">
              No hay repuestos coincidentes.
            </div>
          ) : (
            matches.map((part) => {
              const id = partValue(part, "id");
              const reference = partValue(part, "codigoReferencia");
              const name = partValue(part, "nombre", "Repuesto sin nombre");
              const brand = partValue(part, "marca");
              const price = Number(partValue(part, "precioCompra", 0) || 0);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onSelect(part);
                    setOpen(false);
                  }}
                  className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left hover:bg-sky-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-800">
                      {[reference, name].filter(Boolean).join(" - ")}
                    </span>
                    {brand && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Marca: {brand}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-emerald-700">
                    {formatCurrency(price)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const createEmptyInvoiceVatBreakdown = () => ({
  base21: "",
  base10: "",
  base4: "",
  base0: "",
});

const getInvoiceVatLines = (breakdown) =>
  [
    { ivaPct: 21, base: Number(breakdown.base21) || 0 },
    { ivaPct: 10, base: Number(breakdown.base10) || 0 },
    { ivaPct: 4, base: Number(breakdown.base4) || 0 },
    { ivaPct: 0, base: Number(breakdown.base0) || 0 },
  ]
    .filter((line) => line.base > 0)
    .map((line) => {
      const iva = roundMoney((line.base * line.ivaPct) / 100);
      return {
        ...line,
        iva,
        total: roundMoney(line.base + iva),
      };
    });

export default function SupplierDeliveryNotesPanel({
  onNotesChanged,
  onInvoicesChanged,
}) {
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
    ivaBreakdown: createEmptyInvoiceVatBreakdown(),
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
  const invoiceVatLines = useMemo(
    () => getInvoiceVatLines(invoiceForm.ivaBreakdown),
    [invoiceForm.ivaBreakdown],
  );
  const invoiceVatTotals = invoiceVatLines.reduce(
    (acc, line) => {
      acc.base = roundMoney(acc.base + line.base);
      acc.iva = roundMoney(acc.iva + line.iva);
      acc.total = roundMoney(acc.total + line.total);
      return acc;
    },
    { base: 0, iva: 0, total: 0 },
  );
  const invoiceBaseDifference = roundMoney(
    selectedTotals.base - invoiceVatTotals.base,
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

  const setLineValues = (id, values) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...values } : line)),
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
      ivaBreakdown: {
        ...createEmptyInvoiceVatBreakdown(),
        base21: selectedTotals.base ? selectedTotals.base.toFixed(2) : "",
      },
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

  const setInvoiceVatBase = (field, value) => {
    setInvoiceForm((prev) => ({
      ...prev,
      ivaBreakdown: {
        ...prev.ivaBreakdown,
        [field]: value,
      },
    }));
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

    if (roundMoney(selectedTotals.base) <= 0) {
      alert("La base imponible de los albaranes debe ser mayor que 0.");
      return;
    }

    if (invoiceVatLines.length === 0) {
      alert("Desglosa la base imponible por tipo de IVA.");
      return;
    }

    if (Math.abs(invoiceBaseDifference) >= 0.01) {
      alert(
        `La suma del desglose de IVA debe coincidir con la base imponible de los albaranes. Diferencia: ${formatCurrency(invoiceBaseDifference)}.`,
      );
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
      lineasIva: invoiceVatLines.map((line) => ({
        base: line.base,
        ivaPct: line.ivaPct,
        iva: line.iva,
        total: line.total,
      })),
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
      await onInvoicesChanged?.();
      setSelectedNoteIds([]);
      setInvoiceForm((prev) => ({
        ...prev,
        open: false,
        numeroFactura: "",
        referencia: "",
        descripcion: "",
        estado: "Pendiente de pago",
        ivaBreakdown: createEmptyInvoiceVatBreakdown(),
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
        Number.isNaN(Number(line.precioCompra)) ||
        Number(line.descuentoPct || 0) < 0 ||
        Number(line.descuentoPct || 0) > 100,
    );

    if (invalidLine) {
      alert("Revisa cantidades y precios de las líneas.");
      return;
    }

    for (const line of validLines) {
      const reference = line.codigoReferencia?.trim();
      if (!reference || line.repuestoStockId) continue;

      try {
        const res = await api.get("/RepuestoStock", {
          params: {
            search: reference,
            esFacturado: false,
            page: 1,
            pageSize: 8,
          },
        });
        const items = res?.data?.data?.[0]?.items || [];
        const existing = items.find(
          (part) =>
            normalizeReference(partValue(part, "codigoReferencia")) ===
            normalizeReference(reference),
        );

        if (existing) {
          alert(
            `La referencia ${reference} ya existe en stock. Selecciona el repuesto de la lista antes de guardar el albaran.`,
          );
          return;
        }
      } catch {
        alert("No se pudo validar la referencia del repuesto en stock.");
        return;
      }
    }

    const payload = {
      idProveedor: Number(header.idProveedor),
      numeroAlbaran: header.numeroAlbaran.trim(),
      fecha: header.fecha,
      observaciones: header.observaciones?.trim() || null,
      lineas: validLines.map((line) => {
        const total = calcDeliveryLine(line);

        return {
          repuestoStockId: line.repuestoStockId
            ? Number(line.repuestoStockId)
            : null,
          codigoReferencia: line.codigoReferencia?.trim() || null,
          nombre: line.nombre.trim(),
          marca: line.marca?.trim() || null,
          cantidad: Number(line.cantidad),
          precioCompra: total.precioCompraNeto,
          ivaPct: 0,
        };
      }),
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
              <ProviderSearchInput
                providers={providers}
                valueId={header.idProveedor}
                onSelect={({ id }) =>
                  setHeader((prev) => ({
                    ...prev,
                    idProveedor: id ? String(id) : "",
                  }))
                }
              />
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
                    <th className="px-3 py-2 text-right">Dcto %</th>
                    <th className="px-3 py-2 text-right">Base imponible</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {lines.map((line) => {
                    const total = calcDeliveryLine(line);

                    return (
                      <tr key={line.id}>
                        <td className="px-3 py-2">
                          <PartReferenceInput
                            line={line}
                            onChange={(value) =>
                              setLineValues(line.id, {
                                codigoReferencia: value,
                                repuestoStockId: "",
                              })
                            }
                            onSelect={(part) =>
                              setLineValues(line.id, {
                                repuestoStockId: String(partValue(part, "id")),
                                codigoReferencia: partValue(
                                  part,
                                  "codigoReferencia",
                                ),
                                nombre: partValue(part, "nombre"),
                                marca: partValue(part, "marca"),
                                precioCompra: String(
                                  partValue(part, "precioCompra", "") ?? "",
                                ),
                              })
                            }
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
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={line.descuentoPct}
                            onChange={(e) =>
                              setLineField(
                                line.id,
                                "descuentoPct",
                                e.target.value,
                              )
                            }
                            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {formatCurrency(total.base)}
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
                    <th colSpan={6} className="px-3 py-2 text-right">
                      Base imponible
                    </th>
                    <th className="px-3 py-2 text-right font-bold">
                      {formatCurrency(deliveryTotals.base)}
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
                {selectedNotes.length} albarán(es) seleccionados · Base imponible{" "}
                {formatCurrency(selectedTotals.base)}
              </p>
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
                {selectedNotes.length} albarán(es) · Base imponible{" "}
                {formatCurrency(selectedTotals.base)}
              </p>
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

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Desglose de IVA de la factura
                  </h4>
                  <p className="text-xs text-slate-600">
                    Reparte la base imponible de los albaranes entre los tipos
                    de IVA que correspondan.
                  </p>
                </div>
                <div className="text-right text-xs font-semibold text-slate-700">
                  Base albaranes: {formatCurrency(selectedTotals.base)}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                {[
                  ["base21", "Base 21%"],
                  ["base10", "Base 10%"],
                  ["base4", "Base 4%"],
                  ["base0", "Base 0% / exenta"],
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className="flex flex-col gap-1 text-xs font-bold text-slate-600"
                  >
                    {label}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceForm.ivaBreakdown[field]}
                      onChange={(e) =>
                        setInvoiceVatBase(field, e.target.value)
                      }
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-right text-sm font-medium text-slate-800"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-white p-3 text-xs font-semibold text-slate-700 sm:grid-cols-4">
                <span>Base: {formatCurrency(invoiceVatTotals.base)}</span>
                <span>IVA: {formatCurrency(invoiceVatTotals.iva)}</span>
                <span>Total factura: {formatCurrency(invoiceVatTotals.total)}</span>
                <span
                  className={
                    Math.abs(invoiceBaseDifference) < 0.01
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }
                >
                  Diferencia: {formatCurrency(invoiceBaseDifference)}
                </span>
              </div>
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
                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
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
                            <th className="px-4 py-3 text-right">Base</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailNote.lineas.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
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
                                  {formatCurrency(line.base)}
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
                <th className="px-4 py-3 text-center">Base imponible</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loadingNotes ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader />
                  </td>
                </tr>
              ) : notes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
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
