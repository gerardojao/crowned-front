import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api, { resolveApiAssetUrl } from "../Components/api";
import logoTaller from "../assets/LogoTallerCrowned.png";
import vehicleDamageDiagram from "../assets/vehicle-damage-diagram.png";
import PrintActions from "../Components/PrintActions";
import { usesZagaInvoiceTemplate } from "../Components/ZagaInvoiceDocument";
import useAutoPrint from "../hooks/useAutoPrint";

const DEFAULT_TALLER = {
  nombre: "Multiservicios Crower",
  razonSocial: "JUAN CARLOS FERNANDEZ SILVA",
  nif: "61407055E",
  direccion: "CALLE ALCACER 63 D, Albal, 46470",
  telefono: "960057935/655042253",
  email: "multiservicioscrower@gmail.com",
  logoUrl: "",
  documentTemplateKey: "",
};

function valueOf(row, field, fallback = "") {
  const pascal = field.charAt(0).toUpperCase() + field.slice(1);
  return row?.[field] ?? row?.[pascal] ?? fallback;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-ES");
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function parseItems(itemsJson) {
  if (!itemsJson) return [];

  try {
    const parsed = JSON.parse(itemsJson);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => ({
        id: item.id || item.Id || `item-${index}`,
        codigo: item.codigo ?? item.Codigo ?? "",
        section: normalizeLineSection(item),
        descripcion:
          item.descripcion ||
          item.Descripcion ||
          item.nombre ||
          item.Nombre ||
          "",
        cantidad: Number(item.cantidad ?? item.Cantidad ?? 1),
        tiempo: Number(
          item.tiempo ?? item.Tiempo ?? item.cantidad ?? item.Cantidad ?? 1,
        ),
        kind: String(
          item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? "",
        ).toLowerCase(),
      }))
      .filter(
        (item) => normalizeText(item.descripcion) || normalizeText(item.codigo),
      );
  } catch {
    return [];
  }
}

function splitOperationLines(text) {
  return normalizeText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildFallbackItems(order) {
  const trabajo = splitOperationLines(order.trabajo);
  return trabajo.map((descripcion, index) => ({
    id: `fallback-${index}`,
    descripcion,
    cantidad: 1,
    tiempo: 1,
    section: index === 0 ? "ManoObra" : "ManoObra",
    kind: index === 0 ? "labor" : "",
  }));
}

function normalizeLineSection(item) {
  const raw = String(
    item.section ??
      item.Section ??
      item.kind ??
      item.Kind ??
      item.tipo ??
      item.Tipo ??
      "",
  )
    .trim()
    .toLowerCase();
  if (raw.includes("pintura")) return "Pintura";
  if (
    raw.includes("pieza") ||
    raw.includes("recambio") ||
    raw.includes("repuesto") ||
    raw.includes("material") ||
    raw.includes("part")
  )
    return "Materiales";
  return "ManoObra";
}

function isMaterial(item) {
  if (normalizeLineSection(item) === "Materiales") return true;
  const kind = item.kind.toLowerCase();
  return (
    kind.includes("repuesto") ||
    kind.includes("material") ||
    kind.includes("part")
  );
}

function isLabor(item) {
  if (
    normalizeLineSection(item) === "ManoObra" ||
    normalizeLineSection(item) === "Pintura"
  )
    return true;
  const kind = item.kind.toLowerCase();
  return kind.includes("labor") || kind.includes("mano");
}

function formatLineQuantity(value) {
  if (value === "" || value == null) return "-";
  return Number(value || 0).toLocaleString("es-ES", {
    minimumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export default function PrintWorkOrder() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const documentType = String(
    params.get("type") || params.get("tipo") || "orden",
  ).toLowerCase();
  const isCustody = documentType === "resguardo" || documentType === "deposito";
  const shouldAutoPrint = params.get("print") === "1";

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [taller, setTaller] = useState(DEFAULT_TALLER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, documentType]);

  useAutoPrint({
    enabled: shouldAutoPrint,
    ready: !loading && !error && Boolean(order),
    resetKey: `${id}:${documentType}`,
  });

  useEffect(() => {
    if (!shouldAutoPrint || !order) return;

    const key = `zaga:preorden:motivoRecepcion:${order.matricula}`;

    const timer = setTimeout(() => {
      localStorage.removeItem(key);
    }, 50000);

    return () => clearTimeout(timer);
  }, [shouldAutoPrint, order]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [settingsRes, orderRes] = await Promise.all([
        api.get("/WorkshopSettings").catch(() => null),
        api.get(`/OrdenTrabajo/${id}`).catch(() => null),
      ]);

      const settings = settingsRes?.data || {};
      setTaller({
        nombre: settings.nombre ?? settings.Nombre ?? DEFAULT_TALLER.nombre,
        razonSocial:
          settings.razonSocial ??
          settings.RazonSocial ??
          DEFAULT_TALLER.razonSocial,
        nif: settings.nif ?? settings.Nif ?? DEFAULT_TALLER.nif,
        direccion:
          settings.direccion ?? settings.Direccion ?? DEFAULT_TALLER.direccion,
        telefono:
          settings.telefono ?? settings.Telefono ?? DEFAULT_TALLER.telefono,
        email: settings.email ?? settings.Email ?? DEFAULT_TALLER.email,
        logoUrl: settings.logoUrl ?? settings.LogoUrl ?? DEFAULT_TALLER.logoUrl,
        documentTemplateKey:
          settings.documentTemplateKey ??
          settings.DocumentTemplateKey ??
          DEFAULT_TALLER.documentTemplateKey,
      });

      const data = orderRes?.data?.data?.[0];
      if (!data) {
        setError("No se encontro la orden.");
        return;
      }

      setOrder({
        id: valueOf(data, "id"),
        idCliente: valueOf(data, "idCliente"),
        numeroCliente: valueOf(data, "numeroCliente"),
        cliente: valueOf(data, "cliente"),
        dni: valueOf(data, "dni"),
        telefono: valueOf(data, "telefono"),
        direccion: valueOf(data, "direccion"),
        matricula: valueOf(data, "matricula"),
        marca: valueOf(data, "marca"),
        modelo: valueOf(data, "modelo"),
        kilometraje: valueOf(data, "kilometraje"),
        fecha: valueOf(data, "fecha"),
        fechaPrevistaEntrega: valueOf(data, "fechaPrevistaEntrega"),
        tiempoEstimadoHoras: valueOf(data, "tiempoEstimadoHoras"),
        tipoOperacion: valueOf(data, "tipoOperacion", "Mecanica"),
        trabajo: valueOf(data, "trabajo"),
        itemsJson: valueOf(data, "itemsJson"),
        estado: valueOf(data, "estado"),
        observaciones: valueOf(data, "observaciones"),
        codigoPostal: valueOf(data, "codigoPostal"),
        poblacion: valueOf(data, "poblacion"),
        provincia: valueOf(data, "provincia"),
        clientSignatureBase64: valueOf(data, "clientSignatureBase64"),
        clientSignatureDate: valueOf(data, "clientSignatureDate"),
        workshopSignatureBase64: valueOf(data, "workshopSignatureBase64"),
        workshopSignatureDate: valueOf(data, "workshopSignatureDate"),
      });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar la orden de trabajo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const items = useMemo(() => {
    if (!order) return [];
    const parsed = parseItems(order.itemsJson);
    return parsed.length ? parsed : buildFallbackItems(order);
  }, [order]);

  const laborItems = useMemo(() => {
    const explicit = items.filter(isLabor);
    if (explicit.length) return explicit;
    return items.filter((item) => !isMaterial(item));
  }, [items]);

  const materialItems = useMemo(() => items.filter(isMaterial), [items]);
  const operationLines = useMemo(
    () => splitOperationLines(order?.trabajo),
    [order?.trabajo],
  );

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">Cargando orden...</div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-10 text-center text-rose-600">
        {error || "No se encontro la orden."}
      </div>
    );
  }

  const useZagaTemplate = usesZagaInvoiceTemplate(taller);
  const title = isCustody ? "RESGUARDO DE DEPOSITO" : "ORDEN DE TRABAJO";
  const baseDocumentNumber = String(order.id || "").padStart(9, "0");
  const documentNumber = isCustody
    ? `R-${baseDocumentNumber}`
    : baseDocumentNumber;
  const customerNumber = order.numeroCliente || order.idCliente || "-";
  const pageLabel = "Pag. 1";
  const operationType = String(order.tipoOperacion || "Mecanica").toUpperCase();
  const isBodyPaintOperation =
    operationType.includes("CHAPA") || operationType.includes("PINTURA");
  const materialGroupTitle = isBodyPaintOperation ? "Materiales" : "Piezas";
  const logoSrc = resolveApiAssetUrl(taller.logoUrl) || logoTaller;
  const actionTitle = isCustody ? "Resguardo de deposito" : "Orden de trabajo";
  const actionSubtitle = isCustody
    ? "Emite el resguardo de depósito del vehículo recibido."
    : "Registra trabajos, vehículo, estado y costes del servicio.";

  const clientSignatureSrc = getSignatureSrc(order.clientSignatureBase64);
  const workshopSignatureSrc = getSignatureSrc(order.workshopSignatureBase64);

  if (!useZagaTemplate) {
    return (
      <CrowerWorkOrderDocument
        order={order}
        workshopName={taller.nombre || "Multiservicios Crower"}
      />
    );
  }

  const storageKeyToDelete = `zaga:preorden:motivoRecepcion:${order.matricula}`;

  const motivoRecepcion = localStorage.getItem(storageKeyToDelete) || "";

  return (
    <main className="print-page -mx-4 min-h-screen bg-sky-50/70 px-4 py-6 text-black sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <PrintActions
        title={actionTitle}
        subtitle={actionSubtitle}
        backTo="/register-work-order#ordenes-recientes"
      />
      <style>{`
        .workorder-sheet {
          width: 190mm;
          min-height: 255mm;
          margin: 0 auto;
          padding: 4mm 5mm;
          background: #fff;
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 16px;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8.2px;
          line-height: 1.18;
          color: #111;
        }
        .wo-header {
          display: grid;
          grid-template-columns: 56% 1fr;
          align-items: start;
          gap: 5mm;
          margin-bottom: 6mm;
        }
        .wo-logo {
          width: 72mm;
          max-height: 24mm;
          object-fit: contain;
          object-position: left center;
        }
        .wo-company {
          width: 60mm;
          justify-self: end;
          margin-top: 7mm;
          font-size: 9px;
          line-height: 1.22;
          text-transform: uppercase;
        }
        .wo-title-row {
          display: grid;
          grid-template-columns: 72mm 1fr;
          gap: 4mm;
          align-items: start;
          margin-bottom: 2mm;
        
        }
        .wo-title {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: .2px;
          margin: 0 0 3mm;
          text-align: left;
   
        }
        .wo-meta {
          width: 52mm;
          border-collapse: collapse;
          font-size: 10px;
        }
        .wo-meta th {
          width: 32mm;
          background: #b7b7b7;
          border-bottom: 1px solid #fff;
          padding: 1.7mm 1.6mm;
          text-align: left;
          font-weight: 800;
        }
        .wo-meta td {
          border-bottom: 1px solid #fff;
          padding: 1.7mm 1.5mm;
          font-weight: 700;
          text-align: left;
        }
        .wo-client-box {
          position: relative;
          width: 68mm;
          min-height: 24mm;
          padding: 5mm 8mm 4mm;
          font-size: 10px;
          line-height: 1.25;
          text-transform: uppercase;
          margin-top: 14mm;
          margin-left: 34mm;
        }
        .wo-client-box:before,
        .wo-client-box:after,
        .wo-client-corners:before,
        .wo-client-corners:after {
          content: "";
          position: absolute;
          width: 13mm;
          height: 9mm;
          border-color: #111;
        }
        .wo-client-box:before { top: 0; left: 0; border-top: 1px solid; border-left: 1px solid; }
        .wo-client-box:after { top: 0; right: 0; border-top: 1px solid; border-right: 1px solid; }
        .wo-client-corners:before { bottom: 0; left: 0; border-bottom: 1px solid; border-left: 1px solid; }
        .wo-client-corners:after { bottom: 0; right: 0; border-bottom: 1px solid; border-right: 1px solid; }
        .wo-page-label {
          text-align: right;
          font-size: 8px;
          margin-top: 1mm;
        }
        .wo-grid {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin-top: 1mm;
          font-size: 8px;
        }
        .wo-grid th {
          background: #b7b7b7;
          border: 1px solid #fff;
          padding: 1.3mm 1mm;
          text-align: center;
          font-weight: 800;
          text-transform: uppercase;
        }
        .wo-grid td {
          padding: 1.4mm 1mm;
          text-align: center;
          border: 1px solid #fff;
          font-size: 10px;
        }
        .wo-body {
          margin-top: 2mm;
          min-height: 94mm;
          border: 1px solid #111;
        }
        .wo-section-head {
          display: grid;
          grid-template-columns: 32mm 1fr 18mm;
          background: #b7b7b7;
          font-weight: 800;
          text-transform: uppercase;
          border-bottom: 1px solid #fff;
        }
        .wo-section-head span {
          padding: 1.5mm 1.5mm;
        }       

        .wo-block {
          padding: 1.7mm 1.5mm 1mm;
          font-size: 10px;
        }
        .wo-op-line {
          margin: 0 0 1mm;
          text-transform: uppercase;
        }
        .wo-lines {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 8px;
        }
        .wo-lines td {
          padding: .9mm 1.2mm;
          vertical-align: top;
                 font-size: 11px;
        }
        .wo-code {
          width: 26mm;
          text-transform: uppercase;
        }
        .wo-qty {
          width: 18mm;
          text-align: right;
   
        }
        .wo-footer {
          display: grid;
          grid-template-columns: 1fr 1fr 1.08fr;
          border: 1px solid #111;
          border-top: 0;
          min-height: 46mm;
        }
        .wo-footer-cell {
          border-right: 1px solid #111;
          padding: 1.5mm;
          font-size: 7.2px;
        }
        .wo-footer-cell:last-child {
          border-right: 0;
        }
        .wo-footer-head {
          margin: -1.5mm -1.5mm 1.5mm;
          padding: 1.4mm 1.5mm;
          background: #b7b7b7;
          font-weight: 800;
          text-transform: uppercase;
        }
        .wo-sign {
          margin-top: 6mm;
          font-size: 7px;
          text-transform: uppercase;
        }
        .wo-car-box {
          height: 38mm;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5mm 0 0;
        }
        .wo-car-diagram {
          display: block;
          width: 51mm;
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }

     
      .po-section-head {
          display: grid;
          grid-template-columns: 26mm 1fr 20mm 26mm 16mm;
          background: #b7b7b7;
          font-weight: 800;
          text-transform: uppercase;
          border-bottom: 1px solid #fff;
          align-items: center;
     
        }
        .po-section-head span {
            padding: 1.5mm;
            font-size: 8px;
        }

        .po-client-info {
          padding: 1.5mm 1.5mm 0;
          font-size: 12px;
        }
        .po-footer {
          border: 1px solid #111;
          border-top: 0;
          min-height: 50mm;
          padding: 2mm;
          font-size: 7px;
        }

        .po-footer-topbar {
          height: 3.5mm;
          background: #b7b7b7;
          margin: 0 0 1.5mm;
        }

        .po-departments {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 2.2fr;
          gap: 1.5mm;
          margin-bottom: 2mm;
        }

        .po-department {
          height: 18mm;
          border-left: 1px solid #111;
          border-right: 1px solid #111;
          position: relative;
        }

        .po-department-head,
        .po-check-head {
          background: #d9d9d9;
          text-align: center;
          font-weight: 800;
          padding: 0.8mm 1mm;
        }

        .po-sign-line {
          position: absolute;
          left: 4mm;
          right: 4mm;
          bottom: 3mm;
          border-bottom: 1px solid #111;
        }

        .po-checks {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5mm;
        }

        .po-check {
          min-height: 18mm;
        }

        .po-options {
          display: grid;
          grid-template-columns: 4mm auto 4mm auto;
          align-items: center;
          column-gap: 2.5mm;
          padding: 5mm 8mm 0;
        }

        .po-box {
          width: 3.8mm;
          height: 3.8mm;
          border: 1px solid #111;
          display: inline-block;
        }

        .po-final-line {
          width: 32mm;
          border-bottom: 1px solid #111;
          margin: 13mm auto 0;
        }

        @media print {
          @page { size: letter portrait; margin: 8mm; }
          .workorder-sheet {
            width: 100%;
            min-height: auto;
            margin: 0;
            padding: 0;
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }
        }
          
      `}</style>

      <section className="workorder-sheet">
        <header className="wo-header">
          <div>
            <img src={logoSrc} alt="Logo taller" className="wo-logo" />
          </div>
          <div className="wo-company text-left">
            <strong>{taller.razonSocial || taller.nombre}</strong>
            <br />
            {taller.nif && (
              <>
                {taller.nif}
                <br />
              </>
            )}
            {taller.direccion && (
              <>
                {taller.direccion}
                <br />
              </>
            )}
            {taller.telefono && (
              <>
                Tel: {taller.telefono}
                <br />
              </>
            )}
            {taller.email && <>E-mail: {taller.email}</>}
          </div>
        </header>

        <section className="wo-title-row">
          <div>
            <h1 className="wo-title">{title}</h1>
            <table className="wo-meta">
              <tbody>
                <tr>
                  <th>Nº Documento</th>
                  <td>{documentNumber}</td>
                </tr>
                <tr>
                  <th>Fecha</th>
                  <td>{formatDate(order.fecha)}</td>
                </tr>
                <tr>
                  <th>N. Cliente</th>
                  <td>{customerNumber}</td>
                </tr>
                <tr>
                  <th>NIF</th>
                  <td>{order.dni || "-"}</td>
                </tr>
                <tr>
                  <th>Forma de Pago</th>
                  <td>{isCustody ? "PENDIENTE" : "-"}</td>
                </tr>
                <tr>
                  <th>Tipo de Operacion</th>
                  <td>{operationType}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div className="wo-client-box text-left">
              <div className="wo-client-corners" />
              <strong>{order.cliente || "-"}</strong>
              <br />
              {order.direccion && (
                <>
                  {order.direccion}
                  <br />
                </>
              )}
              {order.codigoPostal && (
                <>
                  {order.codigoPostal}-{order.poblacion}
                  <br />
                </>
              )}
              {order.provincia && (
                <>
                  {order.provincia}
                  <br />
                </>
              )}
              {order.telefono && (
                <>
                  {order.telefono}
                  <br />
                </>
              )}
            </div>

            <div className="wo-page-label">{pageLabel}</div>
          </div>
        </section>

        <table className="wo-grid">
          <thead>
            <tr>
              <th>Bloque</th>
              <th>F. recepcion</th>
              <th>F. prevista entrega</th>
              <th>Kms</th>
              <th>Cod color</th>
              <th>Marca y modelo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>-</td>
              <td>{formatDate(order.fecha)}</td>
              <td>{formatDate(order.fechaPrevistaEntrega || order.fecha)}</td>
              <td>{order.kilometraje || "-"}</td>
              <td>-</td>
              <td>
                {[order.marca, order.modelo].filter(Boolean).join(" ") || "-"}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="wo-grid">
          <thead>
            <tr>
              <th>Matricula</th>
              <th>Nº peritación</th>
              <th>F. matriculación</th>
              <th>Nº de chasis</th>
              <th>Nº motor</th>
              <th>Recepcion</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{order.matricula || "-"}</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>{order.estado || "-"}</td>
            </tr>
          </tbody>
        </table>

        <section className="wo-body">
          <div className="wo-section-head">
            <span>Codigo operacion</span>
            <span>Descripcion</span>
            <span />
          </div>

         <div className="wo-block">
          <p className="wo-op-line">
            * MOTIVO RECEPCION: {motivoRecepcion || "Sin avería descrita por el cliente."}
          </p>
        </div>

          <div className="wo-section-head">
            <span>Mano obra</span>
            <span />
            <span>Tiempo</span>
          </div>
          <div className="wo-block">
            <table className="wo-lines">
              <tbody>
                {(laborItems.length
                  ? laborItems
                  : [
                      {
                        id: "labor-empty",
                        descripcion: "Mano de obra",
                        cantidad: 1,
                      },
                    ]
                ).map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="wo-code">{item.codigo || "MO"}</td>
                    <td>{item.descripcion}</td>
                    <td className="wo-qty">
                      {order.tiempoEstimadoHoras && index === 0
                        ? formatLineQuantity(order.tiempoEstimadoHoras)
                        : formatLineQuantity(item.tiempo ?? item.cantidad ?? 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="wo-section-head">
            <span>{materialGroupTitle}</span>
            <span />
            <span>Cantidad</span>
          </div>
          <div className="wo-block">
            <table className="wo-lines">
              <tbody>
                {(materialItems.length
                  ? materialItems
                  : [
                      {
                        id: "mat-empty",
                        descripcion: "Pendiente de asignar",
                        cantidad: "",
                      },
                    ]
                ).map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="wo-code">{item.codigo || "MAT"}</td>
                    <td>{item.descripcion}</td>
                    <td className="wo-qty">
                      {item.cantidad === ""
                        ? "-"
                        : formatLineQuantity(item.cantidad || 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {order.observaciones && (
            <div className="wo-block mt-40">
              <p className="wo-op-line">
                * OBSERVACIONES: {order.observaciones}
              </p>
            </div>
          )}
        </section>

        <footer className="wo-footer">
          {/* Recepción del vehículo */}
          <div className="wo-footer-cell">
            <div className="font-bold uppercase text-center">
              RECEPCIÓN DEL VEHÍCULO
            </div>

            <div className="wo-sign">
              {clientSignatureSrc ? (
                <>
                  <img
                    src={clientSignatureSrc}
                    alt="Firma recepción cliente"
                    className="mx-auto h-10 max-w-[120px] object-contain"
                  />

                  <div className="mt-1">Firma recepción cliente</div>

                  {order.clientSignatureDate && (
                    <div className="mt-1 text-[6px] normal-case">
                      {formatDateTime(order.clientSignatureDate)}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="h-10" />
                  <div className="mt-1">Pendiente de firma</div>
                </>
              )}
            </div>
          </div>

          {/* Autorización */}
          <div className="wo-footer-cell">
            <div className="text-center">
              AUTORIZO LA REPARACIÓN DESCRITA.
              <br />
              DESEO RECOGER PIEZAS SUSTITUIDAS: ☐ SÍ &nbsp;&nbsp; ☐ NO
            </div>

            <div className="wo-sign">
              {clientSignatureSrc ? (
                <>
                  <img
                    src={clientSignatureSrc}
                    alt="Firma autorización cliente"
                    className="mx-auto h-10 max-w-[120px] object-contain"
                  />
                  <div className="mt-1">Conformidad del cliente</div>
                </>
              ) : (
                "Firma cliente"
              )}
            </div>

            <div className="wo-footer-head" style={{ marginTop: "9mm" }}>
              {isCustody
                ? "RESGUARDO DE DEPÓSITO"
                : "ACEPTO RENUNCIA PRESUPUESTO"}
            </div>

            <div className="wo-sign">
              {workshopSignatureSrc ? (
                <>
                  <img
                    src={workshopSignatureSrc}
                    alt="Firma taller"
                    className="mx-auto h-10 max-w-[120px] object-contain"
                  />
                  <div className="mt-1">Firma taller</div>
                </>
              ) : (
                "Firma taller"
              )}
            </div>
          </div>

          {/* Daños */}
          <div className="wo-footer-cell">
            <div>DAÑOS OBSERVADOS EN LA CARROCERÍA</div>

            <div className="wo-car-box">
              <img
                src={vehicleDamageDiagram}
                alt="Diagrama de daños observados en la carrocería"
                className="wo-car-diagram"
              />
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}

function CrowerWorkOrderDocument({ order, workshopName }) {
  return (
    <div className="bg-white text-black print-page">
      <PrintActions backTo="/register-work-order#ordenes-recientes" />
      <div className="max-w-2xl mx-auto border border-black p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{workshopName}</h1>
          <p className="text-lg mt-2">Orden #{order.id || order.Id}</p>
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-bold">Vehiculo</p>
            <p>
              {order.marca || order.Marca} {order.modelo || order.Modelo}
            </p>
          </div>

          <div className="text-center border-2 border-black py-4 px-6">
            <p className="text-sm font-bold uppercase tracking-widest">
              Matricula
            </p>

            <p className="text-2xl font-extrabold tracking-wider mt-2">
              {order.matricula || order.Matricula}
            </p>
          </div>

          <div className="border-2 border-black p-5">
            <p className="text-sm font-bold uppercase tracking-widest mb-3">
              Trabajo a realizar
            </p>

            <p className="text-2xl font-bold leading-relaxed text-center">
              {order.trabajo || order.Trabajo}
            </p>
          </div>

          <div>
            <p className="font-bold">Estado</p>
            <p>{order.estado || order.Estado}</p>
          </div>

          <div>
            <p className="font-bold">Fecha</p>
            <p>
              {new Date(order.fecha || order.Fecha).toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSignatureSrc(value) {
  if (!value) return "";

  const signature = String(value).trim();

  if (!signature) return "";

  if (signature.startsWith("data:image")) {
    return signature;
  }

  return `data:image/png;base64,${signature}`;
}
