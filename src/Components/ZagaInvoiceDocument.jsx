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
}) {
  const logoSrc = resolveApiAssetUrl(taller.logoUrl) || logoZaga;
  const ivaPct = Number(invoice.ivaPct || 21);
  const laborTotal = sumItems(items.filter((item) => isLaborItem(item)));
  const partsTotal = sumItems(items.filter((item) => !isLaborItem(item)));
  const paymentText =
    invoice.tipoPago ||
    (selectedPaymentMethods.length > 0
      ? selectedPaymentMethods.map((x) => x.label).join(" / ")
      : "CONTADO");
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
    ? 
      "Factura rectificativa"    
    : isDuplicate
      ? "Factura duplicada"
      : "Factura";

  return (
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

        <div className="grid grid-cols-[50%_46%] gap-2 text-[11px] leading-tight">
          <div>
            <img
              src={logoSrc}
              alt="Logo taller"
              className="h-20 max-w-80 object-contain"
            />
            <h1 className="mt-4 text-xl font-bold uppercase text-left">
              {documentTitle}
            </h1>
            <div className="mt-1 grid w-[360px] grid-cols-[125px_1fr] text-[11px]">
              <InfoLabel>Nº Documento</InfoLabel>
              <InfoValue strong>{invoice.numero}</InfoValue>
              <InfoLabel>Fecha</InfoLabel>
              <InfoValue>{formatDateShort(invoice.fecha)}</InfoValue>
              <InfoLabel>Nº de cliente</InfoLabel>
              <InfoValue>{invoice.Id}</InfoValue>
              <InfoLabel>NIF</InfoLabel>
              <InfoValue>{invoice.dni}</InfoValue>
              <InfoLabel>Nº de Orden</InfoLabel>
              <InfoValue>{invoice.idOrdenTrabajo || ""}</InfoValue>
              <InfoLabel>Nº Siniestro</InfoLabel>
              <InfoValue>
                {isRectificativa ? invoice.numeroFacturaRectificada : ""}
              </InfoValue>
              <InfoLabel>Cuenta Banco</InfoLabel>
              <InfoValue>
                {isCredit
                  ? ""
                  : maskIban(invoice.bankAccountIban || taller.iban)}
              </InfoValue>
            </div>
          </div>

          <div className="-ml-6 pr-5 text-left">
            <div className="mt-1 font-bold uppercase">
              {taller.razonSocial || taller.nombre}
            </div>
            <div>{taller.nif}</div>
            <div>{taller.direccion}</div>
            <div>Tel: {taller.telefono}</div>
            <div>E-mail: {taller.email}</div>

            <div className="relative mt-[118px] ml-auto mr-6 min-h-[132px] w-[425px] px-10 py-5 text-[11px] leading-[1.15] uppercase">
              <Corner className="left-0 top-0 border-l-2 border-t-2 border-black" />
              <Corner className="right-0 top-0 border-r-2 border-t-2 border-black" />
              <Corner className="bottom-0 left-0 border-b-2 border-l-2 border-black" />
              <Corner className="bottom-0 right-0 border-b-2 border-r-2 border-black" />

              <div>{invoice.cliente}</div>
              <div>{invoice.direccionCliente}</div>
              <div>{invoice.telefonoCliente}</div>
            </div>

            <div className="mt-4 pr-3 text-right text-[12px]">Pág. 1</div>
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

          <LineItems items={items} ivaPct={ivaPct} />

          <div className="min-h-[260px]" />

          {paymentLegend && <div className="px-1 py-2">* {paymentLegend}</div>}
        </div>

        <div className="border-x border-b border-black text-[10px]">
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
        <div>{invoice.marcaModelo || ""}</div>
      </div>
      <div className="mt-1 grid grid-cols-5 bg-[#a7a7a7] text-center font-bold">
        <div>Núm. de Chasis</div>
        <div>Núm. de Motor</div>
        <div>F. Recepción</div>
        <div>F. Entrega</div>
        <div>Recepción</div>
      </div>
      <div className="grid grid-cols-5 text-center">
        <div>{invoice.chasis || ""}</div>
        <div>{invoice.motor || ""}</div>
        <div>{formatDateShort(invoice.fecha)}</div>
        <div>{formatDateShort(invoice.fecha)}</div>
        <div>MECÁNICA</div>
      </div>
    </div>
  );
}

function LineItems({ items, ivaPct }) {
  const groups = [
    {
      title: "Mano obra",
      items: items.filter((item) => isLaborItem(item)),
      codePrefix: "MO",
    },
    {
      title: "Recambios",
      items: items.filter((item) => !isLaborItem(item)),
      codePrefix: "RC",
    },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="px-1 py-1">
      {groups.map((group) => (
        <div key={group.title} className="mb-2">
          <div className="grid grid-cols-[90px_1fr_70px_45px_45px_45px_70px] font-bold uppercase">
            <div>{group.title}</div>
            <div />
            <div className="text-right">Precio</div>
            <div className="text-right">Tiem</div>
            <div className="text-right">%Dto</div>
            <div className="text-right">%IVA</div>
            <div className="text-right">Importe</div>
          </div>
          {group.items.map((item, index) => {
            const quantity = Number(item.cantidad ?? item.Cantidad ?? 1);
            const price = Number(item.importe ?? item.Importe ?? 0);
            const amount = quantity * price;
            return (
              <div
                key={`${group.title}-${index}`}
                className="grid grid-cols-[90px_1fr_70px_45px_45px_45px_70px] py-0.5"
              >
                <div>
                  {item.codigo ||
                    `${group.codePrefix}${String(index + 1).padStart(2, "0")}`}
                </div>
                <div>{item.descripcion ?? item.Descripcion}</div>
                <div className="text-right">{formatPlain(price)}</div>
                <div className="text-right">{formatPlain(quantity)}</div>
                <div className="text-right">0,00</div>
                <div className="text-right">{formatPlain(ivaPct)}</div>
                <div className="text-right">{formatPlain(amount)}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function InfoLabel({ children }) {
  return <div className="bg-[#a7a7a7] px-2 py-1 text-centerfont-bold">{children}</div>;
}

function InfoValue({ children, strong = false }) {
  return (
    <div className={`px-2 py-1 text-center ${strong ? "font-bold" : ""}`}>{children}</div>
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

function isLaborItem(item) {
  const raw = `${item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? ""} ${
    item.descripcion ?? item.Descripcion ?? ""
  }`.toLowerCase();
  return (
    raw.includes("mano") || raw.includes("servicio") || raw.includes("labor")
  );
}

function sumItems(items) {
  return items.reduce((sum, item) => {
    return (
      sum +
      Number(item.cantidad ?? item.Cantidad ?? 1) *
        Number(item.importe ?? item.Importe ?? 0)
    );
  }, 0);
}

function getPaymentLegend(invoice, taller, selectedPaymentMethods) {
  const explicit = invoice.leyendaPago ?? invoice.LeyendaPago;
  if (explicit) return explicit.replace(/^\*\s*/, "");

  const tipo = String(invoice.tipoPago || "")
    .trim()
    .toLowerCase();
  if (tipo === "credito") return "";
  if (tipo === "transferencia") {
    const iban = invoice.bankAccountIban || taller.iban;
    return iban ? `TRANSFERENCIA EN IBAN ${iban}` : "PAGO POR TRANSFERENCIA";
  }
  if (tipo === "tpv" || tipo === "tdc" || tipo === "tarjeta")
    return "PAGO POR TPV";
  if (tipo === "efectivo") return "PAGO EN EFECTIVO";
  if (tipo === "contado") return "PAGO AL CONTADO";

  const labels = selectedPaymentMethods
    .map((method) => method.label)
    .filter(Boolean)
    .join(" / ");
  return labels ? `PAGO ${labels.toUpperCase()}` : "";
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
