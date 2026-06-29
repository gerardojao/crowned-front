import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileMinus2, Printer, X } from "lucide-react";
import api, { resolveApiAssetUrl } from "../Components/api";
import logoTaller from "../assets/LogoTallerCrowned.png";
import ZagaInvoiceDocument, {
  usesZagaInvoiceTemplate,
} from "../Components/ZagaInvoiceDocument";

const DEFAULT_TALLER = {
  nombre: "Multiservicios Crower",
  razonSocial: "JUAN CARLOS FERNANDEZ SILVA",
  nif: "61407055E",
  direccion: "CALLE ALCACER 63 D, Albal, 46470",
  telefono: "960057935/655042253",
  email: "multiservicioscrower@gmail.com",
  iban: "ES69 2100 4014 9122 0012 3843",
  logoUrl: "",
  documentTemplateKey: "",
};

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export default function ReprintInvoice() {
  const { idOrden, numeroFactura } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rectError, setRectError] = useState("");
  const [rectSaving, setRectSaving] = useState(false);
  const [showRectModal, setShowRectModal] = useState(false);
  const [rectForm, setRectForm] = useState({
    tipo: "Total",
    fecha: new Date().toISOString().slice(0, 10),
    motivo: "",
    importe: "",
    descripcion: "",
  });

  const [taller, setTaller] = useState(DEFAULT_TALLER);

  const [invoice, setInvoice] = useState({
    id: null,
    idCliente: "",
    numeroCliente: "",
    numero: "",
    fecha: "",
    cliente: "",
    dni: "",
    direccionCliente: "",
    codigoPostalCliente: "",
    poblacionCliente: "",
    provinciaCliente: "",
    telefonoCliente: "",
    clasificacionCliente: "Particular",
    franquiciaImporte: 0,
    matricula: "",
    km: "",
    observaciones: "",
    tipoOperacion: "Mecanica",
    ivaPct: 21,
    tipoPago: "",
    metodoPagoDetalle: "",
    tipoFactura: "Normal",
    numeroFacturaRectificada: "",
    motivoRectificacion: "",
    rectificativas: [],
    bankAccountName: "",
    bankAccountIban: "",
  });

  const [items, setItems] = useState([]);

  const [totals, setTotals] = useState({
    subtotal: 0,
    iva: 0,
    otros: 0,
    total: 0,
  });

  useEffect(() => {
    loadWorkshopSettings();
    loadInvoice();
  }, [idOrden, numeroFactura]);

  const loadWorkshopSettings = async () => {
    try {
      const res = await api.get("/WorkshopSettings");
      const data = res?.data || {};

      setTaller({
        nombre: data.nombre ?? data.Nombre ?? DEFAULT_TALLER.nombre,
        razonSocial: data.razonSocial ?? data.RazonSocial ?? DEFAULT_TALLER.razonSocial,
        nif: data.nif ?? data.Nif ?? DEFAULT_TALLER.nif,
        direccion: data.direccion ?? data.Direccion ?? DEFAULT_TALLER.direccion,
        telefono: data.telefono ?? data.Telefono ?? DEFAULT_TALLER.telefono,
        email: data.email ?? data.Email ?? DEFAULT_TALLER.email,
        iban: data.iban ?? data.Iban ?? DEFAULT_TALLER.iban,
        logoUrl: data.logoUrl ?? data.LogoUrl ?? DEFAULT_TALLER.logoUrl,
        documentTemplateKey:
          data.documentTemplateKey ??
          data.DocumentTemplateKey ??
          DEFAULT_TALLER.documentTemplateKey,
      });
    } catch {
      setTaller(DEFAULT_TALLER);
    }
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError("");

      const res = idOrden
        ? await api.get(`/FacturaEmitida/orden/${idOrden}`)
        : await api.get(`/FacturaEmitida/numero/${numeroFactura}`);

      const f = res?.data?.data?.[0];

      if (!f) {
        setError("No se encontro la factura.");
        return;
      }

      const parsedItems = f.itemsJson
        ? JSON.parse(f.itemsJson)
        : f.ItemsJson
          ? JSON.parse(f.ItemsJson)
          : [];

      const subtotal = Number(f.subtotal ?? f.Subtotal ?? 0);
      const iva = Number(f.iva ?? f.Iva ?? 0);
      const otros = Number(f.otros ?? f.Otros ?? 0);
      const total = Number(f.total ?? f.Total ?? 0);

      const ivaPct = subtotal > 0 ? Math.round((iva / subtotal) * 100) : 21;
      const tipoFactura = f.tipoFactura ?? f.TipoFactura ?? "Normal";
      const rectificativas = f.rectificativas ?? f.Rectificativas ?? [];

      setInvoice({
        id: f.id ?? f.Id ?? null,
        idCliente: f.idCliente ?? f.IdCliente ?? "",
        numeroCliente: f.numeroCliente ?? f.NumeroCliente ?? f.idCliente ?? f.IdCliente ?? "",
        numero: f.numeroFactura ?? f.NumeroFactura ?? "",
        fecha: String(f.fecha ?? f.Fecha ?? "").slice(0, 10),
        cliente: f.cliente ?? f.Cliente ?? "",
        dni: f.dni ?? f.Dni ?? "",
        direccionCliente: f.direccionCliente ?? f.DireccionCliente ?? "",
        codigoPostalCliente: f.codigoPostalCliente ?? f.CodigoPostalCliente ?? "",
        poblacionCliente: f.poblacionCliente ?? f.PoblacionCliente ?? "",
        provinciaCliente: f.provinciaCliente ?? f.ProvinciaCliente ?? "",
        telefonoCliente: f.telefonoCliente ?? f.TelefonoCliente ?? "",
        clasificacionCliente: f.clasificacionCliente ?? f.ClasificacionCliente ?? "Particular",
        franquiciaImporte: f.franquiciaImporte ?? f.FranquiciaImporte ?? 0,
        matricula: f.matricula ?? f.Matricula ?? "",
        km: f.km ?? f.Km ?? "",
        observaciones: f.observaciones ?? f.Observaciones ?? "",
        tipoOperacion:
          f.tipoOperacion ??
          f.TipoOperacion ??
          (tipoFactura === "Recambio" ? "Recambio" : "Mecanica"),
        ivaPct,
        tipoPago: f.tipoPago ?? f.TipoPago ?? "",
        metodoPagoDetalle: f.metodoPagoDetalle ?? f.MetodoPagoDetalle ?? "",
        totalAbonado: f.totalAbonado ?? f.TotalAbonado ?? 0,
        saldoPendiente: f.saldoPendiente ?? f.SaldoPendiente ?? 0,
        fechaVencimiento: f.fechaVencimiento ?? f.FechaVencimiento ?? null,
        leyendaPago: f.leyendaPago ?? f.LeyendaPago ?? "",
        tipoFactura,
        numeroFacturaRectificada: f.numeroFacturaRectificada ?? f.NumeroFacturaRectificada ?? "",
        motivoRectificacion: f.motivoRectificacion ?? f.MotivoRectificacion ?? "",
        rectificativas,
        bankAccountName: f.bankAccountName ?? f.BankAccountName ?? "",
        bankAccountIban: f.bankAccountIban ?? f.BankAccountIban ?? "",
      });

      setItems(parsedItems);

      setTotals({
        subtotal,
        iva,
        otros,
        total,
      });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar la factura.",
      );
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const isRectificativa = invoice.tipoFactura === "Rectificativa";
  const useZagaTemplate = usesZagaInvoiceTemplate(taller);
  const documentTaller = {
    ...taller,
    iban: invoice.bankAccountIban || taller.iban,
  };
  const reprintDocumentTitle = isRectificativa
    ? "Factura rectificativa"
    : "Factura duplicada";
  const franchiseAmount = Math.max(0, Number(invoice.franquiciaImporte || 0));
  const isInsuranceInvoice =
    franchiseAmount > 0 ||
    String(invoice.clasificacionCliente || "").toLowerCase().includes("seguro");
  const companyPayable = Math.max(0, Number(totals.total || 0) - franchiseAmount);
  const paymentText = getPaymentText(invoice);
  const hasTransferPayment = paymentText.toLowerCase().includes("transferencia");
  const linkedRectificativas = Array.isArray(invoice.rectificativas)
    ? invoice.rectificativas
    : [];

  const handleRectFormChange = (field, value) => {
    setRectForm((prev) => ({ ...prev, [field]: value }));
  };

  const openRectModal = () => {
    setRectError("");
    setRectForm({
      tipo: "Total",
      fecha: new Date().toISOString().slice(0, 10),
      motivo: "",
      importe: "",
      descripcion: "",
    });
    setShowRectModal(true);
  };

  const createRectificativa = async (event) => {
    event.preventDefault();
    setRectError("");

    if (!invoice.id) {
      setRectError("No se pudo identificar la factura original.");
      return;
    }

    if (!rectForm.motivo.trim()) {
      setRectError("El motivo es requerido.");
      return;
    }

    if (rectForm.tipo === "Parcial" && Number(rectForm.importe || 0) <= 0) {
      setRectError("El importe parcial debe ser mayor que 0.");
      return;
    }

    try {
      setRectSaving(true);
      const payload = {
        tipo: rectForm.tipo,
        fecha: rectForm.fecha || null,
        motivo: rectForm.motivo.trim(),
        descripcion: rectForm.descripcion.trim() || null,
        importe: rectForm.tipo === "Parcial" ? Number(rectForm.importe) : null,
      };

      const res = await api.post(`/FacturaEmitida/${invoice.id}/rectificativa`, payload);
      if ((res?.data?.ok ?? res?.data?.Ok) === 0) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo crear la rectificativa.",
        );
      }

      const created = res?.data?.data?.[0] ?? res?.data?.Data?.[0];
      const nextNumero = created?.numeroFactura ?? created?.NumeroFactura;

      if (!nextNumero) {
        throw new Error(
          res?.data?.message ||
            res?.data?.Message ||
            "No se pudo obtener la rectificativa creada.",
        );
      }

      setShowRectModal(false);
      navigate(`/reprint-invoice/number/${encodeURIComponent(nextNumero)}`);
    } catch (err) {
      console.error(err);
      setRectError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo crear la factura rectificativa.",
      );
    } finally {
      setRectSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl bg-white/80 p-6 ring-1 ring-slate-200">
        Cargando factura...
      </section>
    );
  }

  return (
    <>
      <div className="no-print flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {isRectificativa ? "Reimprimir factura rectificativa" : "Reimprimir factura"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Factura {invoice.numero}
            {isRectificativa && invoice.numeroFacturaRectificada
              ? ` - rectifica ${invoice.numeroFacturaRectificada}`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRectificativa && invoice.numeroFacturaRectificada && (
            <Link
              to={`/reprint-invoice/number/${encodeURIComponent(invoice.numeroFacturaRectificada)}`}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition"
            >
              <ArrowLeft size={18} />
              Ver factura original
            </Link>
          )}

          {!isRectificativa &&
            linkedRectificativas.map((rect) => {
              const numero =
                rect.numeroFactura ?? rect.NumeroFactura ?? rect.numero ?? rect.Numero;
              if (!numero) return null;

              return (
                <Link
                  key={numero}
                  to={`/reprint-invoice/number/${encodeURIComponent(numero)}`}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 transition"
                >
                  <FileMinus2 size={18} />
                  Ver rectificativa {numero}
                </Link>
              );
            })}

          {!isRectificativa && (
            <button
              type="button"
              onClick={openRectModal}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-rose-600 text-white hover:bg-rose-700 transition"
            >
              <FileMinus2 size={18} />
              Crear rectificativa
            </button>
          )}

          <button
            type="button"
            onClick={printInvoice}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-orange-600 text-white hover:bg-orange-700 transition"
          >
            <Printer size={18} />
            Reimprimir
          </button>

          <Link
            to="/register-work-order#ordenes-recientes"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
        </div>
      </div>

      {error && (
        <div className="no-print mb-4 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 p-3 text-sm">
          {error}
        </div>
      )}

      {!error && useZagaTemplate && (
          <ZagaInvoiceDocument
            taller={documentTaller}
          invoice={invoice}
          items={items}
          totals={totals}
          isRectificativa={isRectificativa}
          isDuplicate
        />
      )}

      {!error && !useZagaTemplate && (
        <section className="invoice-print bg-white text-black">
          <div className="invoice-sheet mx-auto max-w-5xl">
            <div className="mb-3 border-2 border-black px-4 py-2 text-center text-xl font-extrabold uppercase tracking-wide">
              {reprintDocumentTitle}
            </div>

            <div className="grid grid-cols-[150px_1fr_310px] items-start gap-6 border-b-2 border-black pb-4">
              <div className="flex h-32 items-center justify-center">
                <img
                src={resolveApiAssetUrl(documentTaller.logoUrl) || logoTaller}
                  alt="Logo taller"
                  className="max-h-28 max-w-36 object-contain"
                />
              </div>

              <div className="min-w-0 text-center">
                <h1 className="mt-3 text-3xl font-extrabold tracking-wide uppercase leading-tight">
                {documentTaller.nombre}
                </h1>

                <div className="mt-3 text-sm leading-5">
                <p className="font-semibold">{documentTaller.razonSocial}</p>
                <p>{documentTaller.nif && `NIF/CIF: ${documentTaller.nif}`}</p>
                <p>{documentTaller.direccion}</p>
                <p>{documentTaller.telefono}</p>
                <p>{documentTaller.email}</p>
                </div>
              </div>

              <div className="text-sm">
                <div className="grid grid-cols-[112px_1fr] gap-x-2 gap-y-1">
                  <p className="font-bold">FECHA:</p>
                  <p>{formatDate(invoice.fecha)}</p>

                  <p className="font-bold">Nº FACTURA:</p>
                  <p className="text-xl font-extrabold">{invoice.numero}</p>

                  {paymentText && (
                    <>
                      <p className="font-bold">PAGO:</p>
                      <p className="font-bold">{paymentText}</p>
                    </>
                  )}

                  {isRectificativa && (
                    <>
                      <p className="font-bold">RECTIFICA:</p>
                      <p className="font-bold">{invoice.numeroFacturaRectificada}</p>
                    </>
                  )}

                  <p className="font-bold">FACTURAR A:</p>
                  <p className="font-bold">{invoice.cliente}</p>

                  <p className="font-bold">DNI/NIE/NIF:</p>
                  <p>{invoice.dni}</p>

                  <p className="font-bold">DIRECCION:</p>
                  <p>{formatCustomerAddress(invoice)}</p>

                  <p className="font-bold">TELEFONO:</p>
                  <p>{invoice.telefonoCliente}</p>

                  <p className="font-bold">MATRICULA:</p>
                  <p className="font-bold">{invoice.matricula}</p>

                  <p className="font-bold">KM.:</p>
                  <p>{invoice.km}</p>
                </div>
              </div>
            </div>

          {documentTaller.iban && hasTransferPayment && (
            <div className="text-center text-sm font-bold italic border-b border-black py-2">
              Transferencias a la cuenta {documentTaller.iban} a nombre de{" "}
              {documentTaller.razonSocial}
            </div>
          )}

            <table className="w-full border-collapse text-sm mt-2">
              <thead>
                <tr style={{ backgroundColor: "#e2e8f0" }}>
                  <th className="border border-black px-2 py-2 w-24 text-center">
                    CANTIDAD
                  </th>
                  <th className="border border-black px-2 py-2 text-center">
                    DESCRIPCION
                  </th>
                  <th className="border border-black px-2 py-2 w-36 text-right">
                    PRECIO UNITARIO
                  </th>
                  <th className="border border-black px-2 py-2 w-36 text-right">
                    IMPORTE
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black px-2 py-2 text-center">
                      {item.cantidad}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {item.descripcion}
                    </td>
                    <td className="border border-black px-2 py-2 text-right">
                      {formatMoney(Number(item.importe || 0))}
                    </td>
                    <td className="border border-black px-2 py-2 text-right">
                      {formatMoney(
                        Number(item.cantidad || 0) * Number(item.importe || 0),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-2 grid grid-cols-[1fr_280px] gap-6 items-start">
              <div className="text-sm">
                <p className="font-extrabold">GARANTIA DE 90 DIAS O 2000KM</p>

                <p className="mt-2 italic font-semibold leading-5">
                  Todo repuesto usado o nuevo suministrado e instalado a
                  solicitud del cliente, NO SE LE BRINDARA GARANTIA. Las
                  reparaciones tienen garantia cuando sean repuestos nuevos
                  suministrados por el taller.
                </p>

                <p className="mt-4">
                  Si tiene cualquier tipo de pregunta sobre esta factura,
                  pongase en contacto con nosotros.
                </p>

                <p className="mt-4 text-center font-extrabold italic">
                  COPIA DE FACTURA
                </p>

                <div className="mt-4">
                  <p className="text-left text-lg font-extrabold underline">
                    OBSERVACIONES:
                  </p>

                  <p className="mt-2">{invoice.observaciones}</p>
                  {isRectificativa && invoice.motivoRectificacion && (
                    <p className="mt-2">
                      <span className="font-bold">Motivo de rectificacion: </span>
                      {invoice.motivoRectificacion}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <Row label="BASE IMPONIBLE" value={formatMoney(totals.subtotal)} />
                <Row label="TASA IVA" value={`${invoice.ivaPct || 0}%`} />
                <Row label="IVA" value={formatMoney(totals.iva)} />
                <Row label="OTROS" value={`- ${formatMoney(totals.otros)}`} />
                {isInsuranceInvoice && (
                  <>
                    <Row label="FRANQUICIA" value={`- ${formatMoney(franchiseAmount)}`} />
                    <Row label="PAGA COMPANIA" value={formatMoney(companyPayable)} strong />
                  </>
                )}
                <Row label="TOTAL" value={formatMoney(totals.total)} strong />
              </div>
            </div>

            <div className="mt-8 border-t border-black pt-2 text-xs">
              <p>
                RAZON SOCIAL: {documentTaller.razonSocial}
                {documentTaller.nif ? ` / NIF: ${documentTaller.nif}` : ""}
                {documentTaller.direccion
                  ? ` / DOMICILIO FISCAL: ${documentTaller.direccion}`
                  : ""}
              </p>
            </div>
          </div>
        </section>
      )}

      {showRectModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={createRectificativa}
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Crear factura rectificativa
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Factura original {invoice.numero}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRectModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {rectError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {rectError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Tipo
                <select
                  value={rectForm.tipo}
                  onChange={(e) => handleRectFormChange("tipo", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                >
                  <option value="Total">Total</option>
                  <option value="Parcial">Parcial</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Fecha
                <input
                  type="date"
                  value={rectForm.fecha}
                  onChange={(e) => handleRectFormChange("fecha", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                />
              </label>

              {rectForm.tipo === "Parcial" && (
                <label className="block text-sm font-medium text-slate-700">
                  Base imponible a rectificar
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rectForm.importe}
                    onChange={(e) => handleRectFormChange("importe", e.target.value)}
                    placeholder="0,00"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  />
                </label>
              )}

              {rectForm.tipo === "Parcial" && (
                <label className="block text-sm font-medium text-slate-700">
                  Concepto
                  <input
                    type="text"
                    value={rectForm.descripcion}
                    onChange={(e) => handleRectFormChange("descripcion", e.target.value)}
                    placeholder="Ajuste parcial de factura"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  />
                </label>
              )}
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Motivo
              <textarea
                value={rectForm.motivo}
                onChange={(e) => handleRectFormChange("motivo", e.target.value)}
                rows={3}
                placeholder="Error en factura, devolucion, ajuste acordado..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                required
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRectModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={rectSaving}
                className="rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {rectSaving ? "Creando..." : "Crear rectificativa"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="grid grid-cols-[1fr_140px] items-stretch">
      <div className="px-3 py-2 text-right text-xs font-bold italic text-slate-700">
        {label}
      </div>
      <div className={`border border-black bg-slate-50 px-3 py-2 text-right ${strong ? "font-extrabold" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function InvoiceCustomerBox({ invoice }) {
  const cityLine = [invoice.codigoPostalCliente, invoice.poblacionCliente]
    .filter(Boolean)
    .join("-");

  return (
    <div className="relative min-h-[96px] px-9 py-5 text-left text-[12px] uppercase leading-[1.18]">
      <InvoiceCustomerCorner className="left-0 top-0 border-l-2 border-t-2 border-black" />
      <InvoiceCustomerCorner className="right-0 top-0 border-r-2 border-t-2 border-black" />
      <InvoiceCustomerCorner className="bottom-0 left-0 border-b-2 border-l-2 border-black" />
      <InvoiceCustomerCorner className="bottom-0 right-0 border-b-2 border-r-2 border-black" />
      <div className="font-extrabold">{invoice.cliente || ""}</div>
      {invoice.direccionCliente && <div>{invoice.direccionCliente}</div>}
      {cityLine && <div>{cityLine}</div>}
      {invoice.provinciaCliente && <div>{invoice.provinciaCliente}</div>}
      {invoice.telefonoCliente && <div>{invoice.telefonoCliente}</div>}
    </div>
  );
}

function InvoiceCustomerCorner({ className }) {
  return <span className={`absolute h-8 w-8 ${className}`} />;
}

function formatMoney(value) {
  return eur.format(Number(value || 0));
}

function formatCustomerAddress(invoice) {
  return [
    invoice.direccionCliente,
    [invoice.codigoPostalCliente, invoice.poblacionCliente].filter(Boolean).join(" "),
    invoice.provinciaCliente,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPaymentText(invoice) {
  const tipo = String(invoice.tipoPago || "").trim().toLowerCase();
  if (tipo === "credito") {
    const totalAbonado = Number(invoice.totalAbonado ?? invoice.TotalAbonado ?? 0);
    return totalAbonado > 0
      ? `Pago a credito - cliente abono ${formatMoney(totalAbonado)}`
      : "Pago a credito";
  }

  const detail = String(invoice.metodoPagoDetalle || "").trim();
  if (detail) return detail;

  if (tipo === "transferencia") return "Transferencia";
  if (tipo === "tpv" || tipo === "tdc" || tipo === "tarjeta") return "TDC";
  if (tipo === "efectivo") return "Efectivo";
  if (tipo === "bizum") return "Bizum";
  if (tipo === "contado") return "Efectivo";
  return invoice.tipoPago || "";
}
