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

  return (
    <>
      {/* <main className="print-page bg-white text-black">
      <PrintActions />
      <style>{`
        .preorder-sheet {
          width: 190mm;
          min-height: 255mm;
          margin: 0 auto;
          padding: 4mm 5mm;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.4px;
          line-height: 1.18;
          color: #111;
        }
        .po-header {
          display: grid;
          grid-template-columns: 48% 52%;
          gap: 8mm;
          margin-bottom: 5mm;
        }
        .po-logo { width: 72mm; max-height: 24mm; object-fit: contain; object-position: left center; }
        .po-company { font-size: 10px; line-height: 1.22; text-transform: uppercase; }
        .po-title-row {
          display: grid;
          grid-template-columns: 47mm 1fr;
          gap: 6mm;
          align-items: start;
          margin-bottom: 2mm;
        }
        .po-title { font-size: 17px; font-weight: 800; margin: 0 0 5mm; }
        .po-meta { width: 38mm; border-collapse: collapse; font-size: 9px; }
        .po-meta th { width: 21mm; background: #b7b7b7; border: 1px solid #b7b7b7; padding: 2.1mm 1.4mm; text-align: left; font-weight: 800; }
        .po-meta td { border: 1px solid transparent; padding: 2.1mm 1.4mm; font-weight: 700; }

        .po-client-box {
          position: relative;
          min-height: 24mm;
          padding: 5mm 10mm 4mm;
          font-size: 10px;
          line-height: 1.25;
          text-transform: uppercase;
          margin-top:25mm;
          margin-left: 55mm;
        }

        .po-client-box:before, .po-client-box:after, .po-client-corners:before, .po-client-corners:after {
          content: ""; position: absolute; width: 13mm; height: 9mm; border-color: #111;
        }
        .po-client-box:before { top: 0; left: 0; border-top: 1px solid; border-left: 1px solid; }
        .po-client-box:after { top: 0; right: 0; border-top: 1px solid; border-right: 1px solid; }
        .po-client-corners:before { bottom: 0; left: 0; border-bottom: 1px solid; border-left: 1px solid; }
        .po-client-corners:after { bottom: 0; right: 0; border-bottom: 1px solid; border-right: 1px solid; }
        .po-page-label { text-align: right; font-size: 8px; margin-top: 1mm; }
        .po-grid { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 1mm; font-size: 9px; }
        .po-grid th { background: #b7b7b7; border: 1px solid #fff; padding: 1.3mm 1mm; text-align: center; font-weight: 800; text-transform: uppercase; }
        .po-grid td { padding: 1.4mm 1mm; text-align: center; border: 1px solid #fff; }
        .po-body { margin-top: 2mm; min-height: 108mm; border: 1px solid #111; }
        .po-section-head { display: grid; grid-template-columns: 38mm 1fr 22mm; background: #b7b7b7; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #fff; }
        .po-section-head span { padding: 1.5mm; }
        .po-block { padding: 1.6mm 1.5mm; min-height: 20mm; border-bottom: 1px solid #ddd; }
        .po-block.large { min-height: 36mm; }
        .po-line { margin: 0 0 1mm; text-transform: uppercase; }
        .po-blank-lines { margin-top: 2mm; }
        .po-blank-lines div { height: 5.8mm; border-bottom: 1px solid #999; }
        .po-footer {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border: 1px solid #111;
          border-top: 0;
          min-height: 28mm;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .po-footer-cell { border-right: 1px solid #111; padding: 1.5mm; font-size: 7.2px; }
        .po-footer-cell:last-child { border-right: 0; }
        .po-sign { margin-top: 12mm; font-size: 7px; text-transform: uppercase; border-top: 1px solid #111; padding-top: 1mm; }
        @media print {
          @page { size: letter portrait; margin: 8mm; }
          .preorder-sheet { width: 100%; min-height: auto; margin: 0; padding: 0; }
        }
      `}</style>

      <section className="preorder-sheet">
        <header className="po-header">
          <div><img src={logoSrc} alt="Logo taller" className="po-logo" /></div>
          <div className="po-company text-left">
            <strong>{taller.razonSocial || taller.nombre}</strong><br />
            {taller.nif && <>{taller.nif}<br /></>}
            {taller.direccion && <>{taller.direccion}<br /></>}
            {taller.telefono && <>Tel: {taller.telefono}<br /></>}
            {taller.email && <>E-mail: {taller.email}</>}
          </div>
        </header>

        <section className="po-title-row">
          <div>
            <h1 className="po-title text-left">PRE-ORDEN</h1>
            <table className="po-meta">
              <tbody>
                <tr><th>Nº Documento</th><td><strong>{documentNumber}</strong></td></tr>
                <tr><th>Fecha</th><td>{formatDate(preOrder.fecha)}</td></tr>
                <tr><th>Nº Cliente</th><td>{preOrder.id || "-"}</td></tr>
                <tr><th>NIF</th><td>{preOrder.dni || "-"}</td></tr>
                <tr><th>Estado</th><td>PENDIENTE</td></tr>
                <tr><th>Tipo de Operacion</th><td>MECANICA</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <div className="po-client-box">
              <div className="po-client-corners" />
              <strong>{preOrder.cliente || "-"}</strong><br />
              {preOrder.direccion && <>{preOrder.direccion}<br /></>}
              {preOrder.telefono && <>{preOrder.telefono}<br /></>}
              {preOrder.dni && <>{preOrder.dni}</>}
            </div>
            <div className="po-page-label text-right">Pag. 1</div>
          </div>
        </section>

        <table className="po-grid">
          <thead>
            <tr>
              <th>Bloque</th>
              <th>F. recepcion</th>
              <th>F. prevista entrega</th>
              <th>Kms</th>
              <th>Tiempo est.</th>
              <th>Marca y modelo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>-</td>
              <td>{formatDate(preOrder.fecha)}</td>
              <td>{formatDate(preOrder.fechaPrevistaEntrega) || "-"}</td>
              <td>{preOrder.kilometraje || "-"}</td>
              <td>{preOrder.tiempoEstimadoHoras ? `${preOrder.tiempoEstimadoHoras} h` : "-"}</td>
              <td>{[preOrder.marca, preOrder.modelo].filter(Boolean).join(" ") || "-"}</td>
            </tr>
          </tbody>
        </table>

        <table className="po-grid">
          <thead>
            <tr>
              <th>Matricula</th>
              <th>Nº peritacion</th>
              <th>F. matriculacion</th>
              <th>Nº de chasis</th>
              <th>Nº motor</th>
              <th>Recepcion</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{preOrder.matricula || "-"}</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>MECANICA</td>
            </tr>
          </tbody>
        </table>

        <section className="po-body">
          <div className="po-section-head"><span>Recepcion</span><span>Motivo indicado por cliente</span><span /></div>
          <div className="po-block">
            {(motivoLines.length ? motivoLines : ["Sin motivo indicado."]).map((line, index) => (
              <p key={`${line}-${index}`} className="po-line">* {line}</p>
            ))}
          </div>

          <div className="po-section-head"><span>Mecanico</span><span>Trabajo que debe realizarse</span><span /></div>
          <div className="po-block large">
            {diagLines.map((line, index) => <p key={`${line}-${index}`} className="po-line">* {line}</p>)}
            {!diagLines.length && <BlankLines count={5} />}
          </div>

          <div className="po-section-head"><span>Materiales</span><span>Repuestos necesarios</span><span>Cantidad</span></div>
          <div className="po-block large">
            {partsLines.map((line, index) => <p key={`${line}-${index}`} className="po-line">* {line}</p>)}
            {!partsLines.length && <BlankLines count={5} />}
          </div>

          {preOrder.observaciones && (
            <div className="po-block">
              <p className="po-line">* OBSERVACIONES: {preOrder.observaciones}</p>
            </div>
          )}
        </section>

        <footer className="po-footer">
          <div className="po-footer-cell">
            <div>RECIBIDO POR TALLER</div>
            <div className="po-sign">Firma recepcion</div>
          </div>
          <div className="po-footer-cell">
            <div>REVISION MECANICO</div>
            <div className="po-sign">Firma mecanico</div>
          </div>
          <div className="po-footer-cell">
            <div>CONFORMIDAD CLIENTE</div>
            <div className="po-sign">Firma cliente</div>
          </div>
        </footer>
      </section>
    </main> */}

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

          {/* <div className="grid grid-cols-[50%_46%] gap-2 text-[11px] leading-tight">
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
              <div>
                {[invoice.codigoPostalCliente, invoice.poblacionCliente, invoice.provinciaCliente]
                  .filter(Boolean)
                  .join(" ")}
              </div>
              <div>{invoice.telefonoCliente}</div>
            </div>

            <div className="mt-4 pr-3 text-right text-[12px]">Pág. 1</div>
          </div>
        </div> */}

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
                  {isCredit
                    ? ""
                    : maskIban(invoice.bankAccountIban || taller.iban)}
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

            <LineItems items={items} ivaPct={ivaPct} />

            <div className="min-h-[260px]" />

            {paymentLegend && (
              <div className="px-1 py-2">* {paymentLegend}</div>
            )}
          </div>

          <div className="border-x border-b border-black text-[10px]">
            {isInsuranceInvoice && (
              <div className="grid grid-cols-2 border-b border-black text-left text-[12px]">
                <div className="min-h-[28mm] border-r border-black px-2 py-1">
                  <div>
                    <strong>A pagar por :</strong> {invoice.cliente || ""}
                  </div>
                  <div className="mt-10">
                    Importe : <strong>{eur.format(companyPayable)}</strong>
                  </div>
                </div>
                <div className="min-h-[28mm] px-2 py-1">
                  <div>
                    <strong>Franquicia (a pagar por el asegurado)</strong>
                  </div>
                  <div className="mt-10">
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
        <div>{operationType}</div>
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
  if (tipo === "credito") return "PAGO A CREDITO";

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
  if (tipo === "contado") return "PAGO EN EFECTIVO";

  return labels ? `PAGO ${labels.toUpperCase()}` : "";
}

function getPaymentDisplayText(invoice, selectedPaymentMethods) {
  const tipo = String(invoice.tipoPago || "").trim().toLowerCase();
  if (tipo === "credito") return "Pago a credito";

  const labels = selectedPaymentMethods
    .map((method) => method.label)
    .filter(Boolean)
    .join(" / ");
  if (labels) return labels;

  const detail = invoice.metodoPagoDetalle ?? invoice.MetodoPagoDetalle;
  if (detail) return detail;

  if (tipo === "transferencia") return "Transferencia";
  if (tipo === "tpv" || tipo === "tdc" || tipo === "tarjeta") return "TDC";
  if (tipo === "efectivo") return "Efectivo";
  if (tipo === "bizum") return "Bizum";
  return tipo === "contado" ? "Efectivo" : "Contado";
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
