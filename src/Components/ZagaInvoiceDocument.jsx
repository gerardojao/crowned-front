import React from "react";
import { resolveApiAssetUrl } from "./api";
import logoZaga from "../assets/logozagapro.png";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export default function ZagaInvoiceDocument({
  taller,
  invoice,
  items,
  totals,
  selectedPaymentMethods = [],
  isRectificativa = false,
  isDuplicate = false,
  warrantyTitle = "",
  warrantyText = "",
}) {
  const logoSrc = resolveApiAssetUrl(taller.logoUrl) || logoZaga;
  const ivaPct = Number(invoice.ivaPct || 21);
  const laborTotal = sumItems(items.filter((item) => isLaborItem(item)));
  const partsTotal = sumItems(items.filter((item) => !isLaborItem(item)));
  const paymentText = getPaymentDisplayText(invoice, selectedPaymentMethods);
  const paymentLegend = getPaymentLegend(
    invoice,
    taller,
    selectedPaymentMethods,
  );
  const isCredit =
    String(invoice.tipoPago || "")
      .trim()
      .toLowerCase() === "credito";
  const documentTitle = isRectificativa
    ? "Factura rectificativa"
    : isDuplicate
      ? "Factura duplicada"
      : "Factura";
  const customerNumber =
    invoice.numeroCliente ??
    invoice.NumeroCliente ??
    invoice.idCliente ??
    invoice.IdCliente ??
    "";
  const franchiseAmount = Math.max(
    0,
    Number(invoice.franquiciaImporte ?? invoice.FranquiciaImporte ?? 0),
  );
  const isInsuranceInvoice =
    franchiseAmount > 0 ||
    String(invoice.clasificacionCliente ?? invoice.ClasificacionCliente ?? invoice.clasificacion ?? "")
      .trim()
      .toLowerCase()
      .includes("seguro");
  const companyPayable = Math.max(0, Number(totals.total || 0) - franchiseAmount);
  const detailsSpacerClass = isInsuranceInvoice ? "min-h-[105px]" : "min-h-[220px]";
  const insuranceBoxClass = isInsuranceInvoice ? "min-h-[17mm]" : "min-h-[28mm]";

  return (
    <>

      <section className="invoice-print bg-white text-black">
        <div className="invoice-sheet mx-auto max-w-5xl">
          {isRectificativa && (
            <div className="mb-2 border border-black px-2 py-1 text-left text-[13px] font-bold uppercase">
              {documentTitle}
              {invoice.numeroFacturaRectificada
                ? ` - Rectifica ${invoice.numeroFacturaRectificada}`
                : ""}
            </div>
          )}

          <div className="grid grid-cols-[45%_45%] gap-4 text-[11px] leading-tight">
            <div>
              <img
                src={logoSrc}
                alt="Logo taller"
                className="h-24 max-w-[310px] object-contain"
              />
            </div>

<div className="pt-1 text-left w-[320px] ml-auto">
              <div className="text-[13px] font-bold uppercase ">
                {taller.razonSocial || taller.nombre}
              </div>
              <div>{taller.nif}</div>
              <div>{taller.direccion}</div>
              <div>Tel: {taller.telefono}</div>
              <div>E-mail: {taller.email}</div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[45%_50%] gap-6 text-[11px] leading-tight">
            <div>
              <h1 className="mb-5 text-[22px] font-extrabold uppercase text-left">
                {documentTitle}
              </h1>

              <div className="grid w-[330px] grid-cols-[128px_1fr] text-[11px]">
                <InfoLabel>Nº Documento</InfoLabel>
                <InfoValue strong>{invoice.numero}</InfoValue>

                <InfoLabel>Fecha</InfoLabel>
                <InfoValue>{formatDateShort(invoice.fecha)}</InfoValue>

                <InfoLabel>Nº Cliente</InfoLabel>
                <InfoValue>{customerNumber}</InfoValue>

                <InfoLabel>NIF</InfoLabel>
                <InfoValue>{invoice.dni}</InfoValue>

                <InfoLabel>Nº Orden</InfoLabel>
                <InfoValue>{invoice.idOrdenTrabajo || ""}</InfoValue>

                <InfoLabel>Nº Siniestro</InfoLabel>
                <InfoValue>
                  {isRectificativa ? invoice.numeroFacturaRectificada : ""}
                </InfoValue>

                <InfoLabel>Cuenta Banco</InfoLabel>
                <InfoValue>
                  {invoice.bankAccountIban || taller.iban}
                </InfoValue>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="relative mt-11 min-h-[116px] w-[360px] px-10 py-5 text-left uppercase">
                <Corner className="left-0 top-0 border-l-2 border-t-2 border-black" />
                <Corner className="right-0 top-0 border-r-2 border-t-2 border-black" />
                <Corner className="bottom-0 left-0 border-b-2 border-l-2 border-black" />
                <Corner className="bottom-0 right-0 border-b-2 border-r-2 border-black" />

                <InvoiceCustomerBlock invoice={invoice} />
              </div>

              <div className="mt-5 pr-1 text-right text-[12px]">Pág. 1</div>
            </div>
          </div>

          <VehicleTable invoice={invoice} paymentText={paymentText} />

          <div className="mt-2 border border-black text-[10px]">
            <div className="grid grid-cols-[90px_1fr] bg-[#a7a7a7] font-bold uppercase">
              <div className="px-1 py-1">Cód.Operación</div>
              <div className="px-1 py-1">Descripción</div>
            </div>

            {invoice.observaciones && (
              <div className="px-1 py-2">* {invoice.observaciones}</div>
            )}
            {isRectificativa && invoice.motivoRectificacion && (
              <div className="px-1 py-1">
                * Motivo de rectificación: {invoice.motivoRectificacion}
              </div>
            )}

            <LineItems
              items={items}
              ivaPct={ivaPct}
              invoiceType={invoice.tipoFactura || invoice.TipoFactura}
              operationType={invoice.tipoOperacion || invoice.TipoOperacion}
            />

            <div className={detailsSpacerClass} />

            {(warrantyTitle || warrantyText) && (
            <div className="px-1 py-2">
              {warrantyTitle && (
                <div className="font-bold uppercase">* {warrantyTitle}</div>
              )}
              {warrantyText && (
                <div className="mt-1 italic leading-tight">{warrantyText}</div>
              )}
            </div>
          )}

            {paymentLegend && (
              <div className="px-1 py-2">* {paymentLegend}</div>
            )}
          </div>

          <div className="border-x border-b border-black text-[10px]">
            {isInsuranceInvoice && (
              <div className="grid grid-cols-2 border-b border-black text-left text-[11px]">
                <div className={`${insuranceBoxClass} border-r border-black px-2 py-1`}>
                  <div>
                    <strong>A pagar por :</strong> {invoice.cliente || ""}
                  </div>
                  <div className="mt-4">
                    Importe : <strong>{eur.format(companyPayable)}</strong>
                  </div>
                </div>
                <div className={`${insuranceBoxClass} px-2 py-1`}>
                  <div>
                    <strong>Franquicia (a pagar por el asegurado)</strong>
                  </div>
                  <div className="mt-4">
                    Importe : <strong>{eur.format(franchiseAmount)}</strong>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 border-b border-black text-center">
              <div className="py-1">
                <div>% I.V.A.</div>
                <strong>{formatPlain(ivaPct)}</strong>
              </div>
              <div className="py-1">
                <div>Base I.V.A.</div>
                <strong>{formatPlain(totals.subtotal)}</strong>
              </div>
              <div className="py-1">
                <div>Cuota I.V.A.</div>
                <strong>{formatPlain(totals.iva)}</strong>
              </div>
            </div>

            <div className="grid grid-cols-[repeat(4,1fr)_1.3fr_1.3fr_1.35fr] text-center">
              <SummaryCell
                label="Mano de Obra"
                value={laborTotal || totals.subtotal}
              />
              <SummaryCell label="Piezas" value={partsTotal} />
              <SummaryCell label="Pintura" value={0} />
              <SummaryCell label="Otros" value={totals.otros} />
              <SummaryCell label="Base Imponible" value={totals.subtotal} />
              <SummaryCell label="Impuestos" value={totals.iva} />
              <SummaryCell label="TOTAL IMPORTE" value={totals.total} strong />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function usesZagaInvoiceTemplate(taller) {
  const explicitKey = String(
    taller?.documentTemplateKey ?? taller?.DocumentTemplateKey ?? "",
  )
    .trim()
    .toLowerCase();
  if (explicitKey === "zaga" || explicitKey === "mastertouch") return true;

  const haystack = `${taller?.nombre ?? ""} ${taller?.razonSocial ?? ""} ${
    taller?.logoUrl ?? ""
  }`.toLowerCase();
  const compact = haystack.replace(/[\s_-]/g, "");
  return haystack.includes("zaga") || compact.includes("mastertouch");
}

function VehicleTable({ invoice, paymentText }) {
  const operationType = String(invoice.tipoOperacion || "Mecanica").toUpperCase();
  const marcaModelo =
    invoice.marcaModelo || [invoice.marca, invoice.modelo].filter(Boolean).join(" ");
  const chasis = invoice.chasis || invoice.bastidor || "";

  return (
    <div className="mt-2 text-[10px] uppercase">
      <div className="grid grid-cols-6 bg-[#a7a7a7] text-center font-bold">
        <div>Forma de pago</div>
        <div>Fecha Vto.</div>
        <div>Matrícula</div>
        <div>Nº Peritación</div>
        <div>Kms</div>
        <div>Marca y Modelo</div>
      </div>
      <div className="grid grid-cols-6 text-center">
        <div>{paymentText}</div>
        <div>{formatDateShort(invoice.fechaVencimiento)}</div>
        <div>{invoice.matricula}</div>
        <div />
        <div>{invoice.km}</div>
        <div>{marcaModelo}</div>
      </div>
      <div className="mt-1 grid grid-cols-5 bg-[#a7a7a7] text-center font-bold">
        <div>Núm. de Chasis</div>
        <div>Núm. de Motor</div>
        <div>F. Recepción</div>
        <div>F. Entrega</div>
        <div>Recepción</div>
      </div>
      <div className="grid grid-cols-5 text-center">
        <div>{chasis}</div>
        <div>{invoice.motor || ""}</div>
        <div>{formatDateShort(invoice.fecha)}</div>
        <div>{formatDateShort(invoice.fecha)}</div>
        <div>{operationType}</div>
      </div>
    </div>
  );
}

function LineItems({ items, ivaPct, invoiceType, operationType }) {
  const isBodyPaint = String(operationType || "")
    .toLowerCase()
    .includes("chapa");
  const specialInvoice = getSpecialInvoiceOperation(invoiceType);
  const groupDefinitions = isBodyPaint
    ? [
        { key: "ManoObra", title: "Mano obra", codePrefix: "MO" },
        { key: "Pintura", title: "Pintura", codePrefix: "PT", includeMaterials: true },
      ]
    : [
        { key: "ManoObra", title: "Mano obra", codePrefix: "MO" },
        { key: "Piezas", title: "Piezas", codePrefix: "PI" },
      ];
  const groups = groupDefinitions
    .map((group) => ({
      ...group,
      items: items.filter((item) => {
        const section = getLineSection(item);
        return group.includeMaterials
          ? section === "Pintura" || section === "Piezas"
          : section === group.key;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="px-1 py-1">
      {groups.map((group) => (
        <div key={group.title} className="mb-2">
          <div className="grid grid-cols-[90px_1fr_70px_45px_45px_45px_70px] font-bold uppercase">
            <div>{specialInvoice.hideGroupTitle ? "" : group.title}</div>
            <div />
            <div className="text-right">Precio</div>
            <div className="text-right">Tiem</div>
            <div className="text-right">%Dto</div>
            <div className="text-right">%IVA</div>
            <div className="text-right">Importe</div>
          </div>
          {group.items.map((item, index) => {
            const section = getLineSection(item);
            const quantity = getLineQuantity(item);
            const price = Number(
              item.precioUnitario ??
                item.PrecioUnitario ??
                item.precio ??
                item.Precio ??
                item.importe ??
                item.Importe ??
                0,
            );
            const discount = Number(item.descuentoPct ?? item.DescuentoPct ?? 0);
            const lineIva = Number(item.ivaPct ?? item.IvaPct ?? ivaPct);
            const amount = quantity * price * (1 - Math.min(100, Math.max(0, discount)) / 100);
            return (
              <div
                key={`${group.title}-${index}`}
                className="grid grid-cols-[90px_1fr_70px_45px_45px_45px_70px] py-0.5"
              >
                <div>
                  {item.codigo ||
                    item.Codigo ||
                    specialInvoice.code ||
                    (section === "Piezas" && group.includeMaterials
                      ? "MAT."
                      : `${group.codePrefix}${String(index + 1).padStart(2, "0")}`)}
                </div>
                <div>{item.descripcion ?? item.Descripcion ?? ""}</div>
                <div className="text-right">{formatPlain(price)}</div>
                <div className="text-right">{formatPlain(quantity)}</div>
                <div className="text-right">{formatPlain(discount)}</div>
                <div className="text-right">{formatPlain(lineIva)}</div>
                <div className="text-right">{formatPlain(amount)}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function getSpecialInvoiceOperation(invoiceType) {
  const value = String(invoiceType || "").trim().toLowerCase();
  if (value === "rapel") return { hideGroupTitle: true, code: "RAPPEL" };
  if (value === "siniva" || value === "sin iva" || value === "novat") {
    return { hideGroupTitle: true, code: "S-IVA" };
  }
  return { hideGroupTitle: false, code: "" };
}

function InfoLabel({ children }) {
  return (
    <div className="border-b border-white bg-[#b7b7b7] px-2 py-1 text-left font-bold leading-tight">
      {children}
    </div>
  );
}

function InfoValue({ children, strong = false }) {
  return (
    <div className={`px-2 py-1 text-left leading-tight ${strong ? "font-bold" : ""}`}>
      {children}
    </div>
  );
}

function SummaryCell({ label, value, strong = false }) {
  return (
    <div className="border-r border-black py-1 last:border-r-0">
      <div>{label}</div>
      <strong className={strong ? "font-extrabold" : ""}>
        {formatPlain(value)}
      </strong>
    </div>
  );
}

function Corner({ className }) {
  return <span className={`absolute h-8 w-8 ${className}`} />;
}

function InvoiceCustomerBlock({ invoice }) {
  const cityLine = [invoice.codigoPostalCliente, invoice.poblacionCliente]
    .filter(Boolean)
    .join("-");

  return (
    <div className="text-[12px] leading-[1.18] uppercase">
      <div className="font-extrabold">{invoice.cliente || ""}</div>
      {invoice.direccionCliente && <div>{invoice.direccionCliente}</div>}
      {cityLine && <div>{cityLine}</div>}
      {invoice.provinciaCliente && <div>{invoice.provinciaCliente}</div>}
      {invoice.telefonoCliente && <div>{invoice.telefonoCliente}</div>}
    </div>
  );
}

function getLineSection(item) {
  const raw = `${item.section ?? item.Section ?? item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? ""} ${
    item.descripcion ?? item.Descripcion ?? ""
  }`.toLowerCase();
  if (
    raw.includes("pieza") ||
    raw.includes("recambio") ||
    raw.includes("repuesto") ||
    raw.includes("material")
  )
    return "Piezas";
  if (raw.includes("pintura")) return "Pintura";
  return "ManoObra";
}

function getLineQuantity(item) {
  const section = getLineSection(item);
  const value =
    section === "Piezas"
      ? item.cantidad ?? item.Cantidad
      : item.tiempo ?? item.Tiempo ?? item.cantidad ?? item.Cantidad;
  const number = Number(value || 0);
  return number > 0 ? number : 1;
}

function getLineTotal(item) {
  const quantity = getLineQuantity(item);
  const price = Number(
    item.precioUnitario ??
      item.PrecioUnitario ??
      item.precio ??
      item.Precio ??
      item.importe ??
      item.Importe ??
      0,
  );
  const discount = Math.min(100, Math.max(0, Number(item.descuentoPct ?? item.DescuentoPct ?? 0)));
  return quantity * price * (1 - discount / 100);
}

function isLaborItem(item) {
  const section = getLineSection(item);
  if (section === "ManoObra" || section === "Pintura") return true;

  const raw = `${item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? ""} ${
    item.descripcion ?? item.Descripcion ?? ""
  }`.toLowerCase();
  return (
    raw.includes("mano") || raw.includes("servicio") || raw.includes("labor")
  );
}

function sumItems(items) {
  return items.reduce((sum, item) => {
    return sum + getLineTotal(item);
  }, 0);
}

function getPaymentLegend(invoice, taller, selectedPaymentMethods) {
  const tipo = String(invoice.tipoPago || "")
    .trim()
    .toLowerCase();
  if (tipo === "credito") return getCreditPaymentLegend(invoice, selectedPaymentMethods);

  const explicit = invoice.leyendaPago ?? invoice.LeyendaPago;
  if (explicit) return explicit.replace(/^\*\s*/, "");

  const labels = selectedPaymentMethods
    .map((method) => {
      const label = method.label;
      const amount = Number(method.amount || 0);
      return label && amount > 0 ? `${label} ${eur.format(amount)}` : label;
    })
    .filter(Boolean)
    .join(" / ");

  const detail = invoice.metodoPagoDetalle ?? invoice.MetodoPagoDetalle ?? labels;
  if (detail) {
    const iban = invoice.bankAccountIban || taller.iban;
    const bankName = invoice.bankAccountName || "";
    return iban
      ? `PAGO ${String(detail).toUpperCase()}. CUENTA ${bankName} ${iban}`.trim()
      : `PAGO ${String(detail).toUpperCase()}`;
  }

  if (tipo === "transferencia") {
    const iban = invoice.bankAccountIban || taller.iban;
    return iban ? `TRANSFERENCIA EN IBAN ${iban}` : "PAGO POR TRANSFERENCIA";
  }
  if (tipo === "tpv" || tipo === "tdc" || tipo === "tarjeta")
    return "PAGO POR TPV";
  if (tipo === "efectivo") return "PAGO EN EFECTIVO";
  if (tipo === "bizum") return "PAGO POR BIZUM";
  if (tipo === "contado") return "PAGO DE CONTADO";

  return labels ? `PAGO ${labels.toUpperCase()}` : "";
}

function getPaymentDisplayText(invoice, selectedPaymentMethods) {
  const tipo = String(invoice.tipoPago || "").trim().toLowerCase();
  if (tipo === "credito") {
    const totalAbonado = Number(invoice.totalAbonado ?? invoice.TotalAbonado ?? 0);
    return totalAbonado > 0
      ? `Pago a credito - cliente abono ${eur.format(totalAbonado)}`
      : "Pago a credito";
  }

  const labels = selectedPaymentMethods
    .map((method) => {
      const label = method.label;
      const amount = Number(method.amount || 0);
      return label && amount > 0 ? `${label} ${eur.format(amount)}` : label;
    })
    .filter(Boolean)
    .join(" / ");
  if (labels) return labels;

  const detail = invoice.metodoPagoDetalle ?? invoice.MetodoPagoDetalle;
  if (detail) return detail;

  if (tipo === "transferencia") return "Transferencia";
  if (tipo === "tpv" || tipo === "tdc" || tipo === "tarjeta") return "TPV";
  if (tipo === "efectivo") return "Efectivo";
  if (tipo === "bizum") return "Bizum";
  return tipo === "contado" ? "Efectivo" : "Contado";
}

function formatInitialPaymentDetail(method) {
  const label = method.label;
  const amount = Number(method.amount || 0);
  const bankName = method.bankAccountName ?? method.BankAccountName ?? "";
  const bankIban = method.bankAccountIban ?? method.BankAccountIban ?? "";
  const bankDetail = [bankName, bankIban].filter(Boolean).join(" ");
  const payment = label && amount > 0 ? `${label} ${eur.format(amount)}` : label;

  return bankDetail ? `${payment} - ${bankDetail}` : payment;
}

function getCreditPaymentLegend(invoice, selectedPaymentMethods = []) {
  const totalAbonado = Number(invoice.totalAbonado ?? invoice.TotalAbonado ?? 0);
  const saldoPendiente = Number(invoice.saldoPendiente ?? invoice.SaldoPendiente ?? 0);
  const fechaVencimiento = invoice.fechaVencimiento ?? invoice.FechaVencimiento;
  const bankName = invoice.bankAccountName ?? invoice.BankAccountName ?? "";
  const bankIban = invoice.bankAccountIban ?? invoice.BankAccountIban ?? "";
  const bankDetail = [bankName, bankIban].filter(Boolean).join(" ");
  const parts = ["PAGO A CREDITO"];
  const initialPaymentDetail = selectedPaymentMethods
    .filter((method) => Number(method.amount || 0) > 0)
    .map(formatInitialPaymentDetail)
    .filter(Boolean)
    .join(" / ");

  if (initialPaymentDetail) {
    parts.push(`ABONO INICIAL ${initialPaymentDetail.toUpperCase()}`);
  } else if (totalAbonado > 0) {
    parts.push(`CLIENTE ABONO ${eur.format(totalAbonado)}`);
  }
  if (saldoPendiente > 0) {
    const saldoText = `SALDO PENDIENTE ${eur.format(saldoPendiente)}`;
    parts.push(bankDetail ? `${saldoText} A LA CUENTA ${bankDetail}` : saldoText);
  }
  if (fechaVencimiento) parts.push(`VENCIMIENTO ${formatDateShort(fechaVencimiento)}`);

  return parts.join(". ");
}

function maskIban(iban) {
  if (!iban) return "";
  const clean = String(iban).replace(/\s+/g, "");
  return clean.length > 4 ? `** ${clean.slice(-4)}` : clean;
}

function formatPlain(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateShort(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES");
}

