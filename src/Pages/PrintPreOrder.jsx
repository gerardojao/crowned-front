import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api, { resolveApiAssetUrl } from "../Components/api";
import logoTaller from "../assets/LogoTallerCrowned.png";
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
  enablePreOrders: true,
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

function lines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function PrintPreOrder() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [taller, setTaller] = useState(DEFAULT_TALLER);
  const [preOrder, setPreOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const shouldAutoPrint = params.get("print") === "1";

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useAutoPrint({
    enabled: shouldAutoPrint,
    ready: !loading && !error && Boolean(preOrder),
    resetKey: id,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [settingsRes, preOrderRes] = await Promise.all([
        api.get("/WorkshopSettings").catch(() => null),
        api.get(`/PreOrdenTrabajo/${id}`),
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
        enablePreOrders:
          settings.enablePreOrders ?? settings.EnablePreOrders ?? true,
      });

      const data = preOrderRes?.data?.data?.[0];
      if (!data) {
        setError("No se encontro la pre-orden.");
        return;
      }

      setPreOrder({
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
        motivoRecepcion: valueOf(data, "motivoRecepcion"),
        diagnosticoMecanico: valueOf(data, "diagnosticoMecanico"),
        repuestosNecesarios: valueOf(data, "repuestosNecesarios"),
        observaciones: valueOf(data, "observaciones"),
        bastidor: valueOf(data, "bastidor"),
      });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar la pre-orden.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500">
        Cargando pre-orden...
      </div>
    );
  if (error || !preOrder)
    return (
      <div className="p-10 text-center text-rose-600">
        {error || "No se encontro la pre-orden."}
      </div>
    );

  const useZaga = usesZagaInvoiceTemplate(taller);
  const preOrderModuleEnabled =
    taller.enablePreOrders ?? taller.EnablePreOrders ?? true;
  const logoSrc = resolveApiAssetUrl(taller.logoUrl) || logoTaller;
  const actionTitle = "Pre-orden";
  const actionSubtitle =
    "Revisa la recepcion inicial del vehiculo antes de convertirla en orden.";

  if (!preOrderModuleEnabled) {
    return (
      <div className="p-10 text-center text-slate-600">
        <p className="mb-4 font-semibold">
          La pre-orden no esta habilitada para este taller.
        </p>
        <Link
          to="/pre-ordenes"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
        >
          Volver
        </Link>
      </div>
    );
  }

  if (!useZaga) {
    return (
      <main className="print-page -mx-4 min-h-screen bg-sky-50/70 px-4 py-6 text-black sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <PrintActions
          title={actionTitle}
          subtitle={actionSubtitle}
          backTo="/pre-ordenes"
        />
        <section className="mx-auto max-w-2xl border border-black p-8">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <img
                src={logoSrc}
                alt="Logo taller"
                className="mb-4 h-16 max-w-64 object-contain object-left"
              />
              <h1 className="text-2xl font-bold uppercase">PRE-ORDEN</h1>
              <p className="mt-1 text-lg">Pre-orden #{preOrder.id}</p>
            </div>
            <div className="text-right text-xs uppercase leading-tight">
              <strong>{taller.razonSocial || taller.nombre}</strong>
              <br />
              {taller.nif}
              <br />
              {taller.direccion}
            </div>
          </div>
          <SimpleBlock
            label="Cliente"
            value={`${preOrder.cliente} - ${preOrder.telefono || ""}`}
          />
          <SimpleBlock label="Direccion" value={preOrder.direccion || "-"} />
          <SimpleBlock
            label="Vehiculo"
            value={`${preOrder.matricula} - ${preOrder.marca || ""} ${preOrder.modelo || ""}`}
          />
          <SimpleBlock
            label="Motivo recibido"
            value={preOrder.motivoRecepcion}
            large
          />
          <SimpleBlock
            label="Trabajo a realizar por mecanico"
            value={preOrder.diagnosticoMecanico}
            large
            blank
          />
          <SimpleBlock
            label="Repuestos necesarios"
            value={preOrder.repuestosNecesarios}
            large
            blank
          />
        </section>
      </main>
    );
  }

  const documentNumber = String(preOrder.id || "").padStart(9, "0");
  const customerNumber = preOrder.numeroCliente || preOrder.idCliente || "-";
  const operationType = String(
    preOrder.tipoOperacion || "Mecanica",
  ).toUpperCase();
  const motivoLines = lines(preOrder.motivoRecepcion);
  const diagLines = lines(preOrder.diagnosticoMecanico);
  const partsLines = lines(preOrder.repuestosNecesarios);

  return (
    <main className="print-page -mx-4 min-h-screen bg-sky-50/70 px-4 py-6 text-black sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <PrintActions
        title={actionTitle}
        subtitle={actionSubtitle}
        backTo="/pre-ordenes"
      />
<style>{`
  .preorder-sheet {
    width: 190mm;
    /* Cambiado a max-height y controlado para evitar desbordes */
    max-height: 260mm; 
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
    /* Evita que toda la estructura se rompa a la mitad en impresión */
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .po-header {
    display: grid;
    grid-template-columns: 56% 1fr;
    align-items: start;
    gap: 5mm;
    margin-bottom: 4mm; /* Reducido un poco para ganar espacio */
  }
  .po-logo { width: 72mm;
    max-height: 24mm;
    object-fit: contain;
    object-position: left center; }
  .po-company {  width: 60mm;
    justify-self: end;
    margin-top: 7mm;
    font-size: 9px;
    line-height: 1.22;
    text-transform: uppercase; }
  .po-title-row {
    display: grid;
    grid-template-columns: 72mm 1fr;
    gap: 4mm;
    align-items: start;
    margin-bottom: 2mm;
  }
  .po-title {  font-size: 15px;
    font-weight: 800;
    letter-spacing: .2px;
    margin: 0 0 3mm;
    text-align: left; }
  .po-meta {  width: 52mm;
    border-collapse: collapse;
    font-size: 11px; }
  .po-meta th {  width: 32mm;
    background: #b7b7b7;
    border-bottom: 1px solid #fff;
    padding: 1.7mm 1.6mm;
    text-align: left;
    font-weight: 800; }
  .po-meta td { border: 1px solid transparent; padding: 2.1mm 1.4mm; font-weight: 700; }

  .po-client-box {
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

  .po-client-box:before,
  .po-client-box:after,
  .po-client-corners:before,
  .po-client-corners:after {
    content: "";
    position: absolute;
    width: 13mm;
    height: 9mm;
    border-color: #111;
  }
  .po-client-box:before { top: 0; left: 0; border-top: 1px solid; border-left: 1px solid; }
  .po-client-box:after { top: 0; right: 0; border-top: 1px solid; border-right: 1px solid; }
  .po-client-corners:before { bottom: 0; left: 0; border-bottom: 1px solid; border-left: 1px solid; }
  .po-client-corners:after { bottom: 0; right: 0; border-bottom: 1px solid; border-right: 1px solid; }
  .po-page-label {
    text-align: right;
    font-size: 8px;
    margin-top: 1mm;
  }
  .po-grid {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-top: 1mm;
    font-size: 8px;
  }
  .po-grid th {
    background: #b7b7b7;
    border: 1px solid #fff;
    padding: 1.3mm 1mm;
    text-align: center;
    font-weight: 800;
    text-transform: uppercase;
  }
  .po-grid td {
    padding: 1.4mm 1mm;
    text-align: center;
    border: 1px solid #fff;
    font-size: 10px;
  }
  .po-body {
    margin-top: 2mm;
    min-height: 80mm; /* Reducido de 94mm a 80mm para dar un respiro al alto total */
    border: 1px solid #111;
  }
  .po-block {
    padding: 1.7mm 1.5mm 1mm;
    font-size: 11px;
  }

  .po-code {
    width: 26mm;
    text-transform: uppercase;
  }
  .po-qty {
    width: 18mm;
    text-align: right;
  }
 
  .po-sign {
    margin-top: 6mm;
    font-size: 7px;
    text-transform: uppercase;
  }
  .po-car-box {
    height: 38mm;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5mm 0 0;
  }
  .po-car-diagram {
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
    min-height: 46mm; /* Ajustado sutilmente */
    padding: 2mm;
    font-size: 7px;
    /* Asegura que el footer no se rompa ni se mueva solo a otra página */
    page-break-inside: avoid;
    break-inside: avoid; 
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
    /* Forzar que los márgenes del navegador sean cero y controlar el tamaño real */
    @page { 
      size: A4 portrait; 
      margin: 0; 
    }
    body {
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Esconder componentes de la app que no correspondan a la hoja */
    .print-actions, nav, button {
      display: none !important;
    }
    .preorder-sheet { 
      width: 100%;
      max-height: 100vh;
      margin: 0;
      padding: 6mm 8mm; /* Ajuste limpio para el folio físico */
      border: 0;
      border-radius: 0;
      box-shadow: none;
      page-break-after: avoid;
    }
  }
`}</style>

      <section className="preorder-sheet">
        <header className="po-header">
          <div>
            <img src={logoSrc} alt="Logo taller" className="po-logo" />
          </div>
          <div className="po-company text-left">
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

        <section className="po-title-row">
          <div>
            <h1 className="po-title text-left">PRE-ORDEN</h1>
            <table className="po-meta text-left">
              <tbody>
                <tr>
                  <th>Nº Documento</th>
                  <td>
                    <strong>{documentNumber}</strong>
                  </td>
                </tr>
                <tr>
                  <th>Fecha</th>
                  <td>{formatDate(preOrder.fecha)}</td>
                </tr>
                <tr>
                  <th>Nº Cliente</th>
                  <td>{customerNumber}</td>
                </tr>
                <tr>
                  <th>NIF</th>
                  <td>{preOrder.dni || "-"}</td>
                </tr>
                <tr>
                  <th>Estado</th>
                  <td>PENDIENTE</td>
                </tr>
                <tr>
                  <th>Tipo de Operacion</th>
                  <td>{operationType}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <div className="po-client-box text-left">
              <div className="po-client-corners" />
              <>
                  <div className="po-client-info">
                    <strong>
                      {[preOrder.marca, preOrder.modelo].filter(Boolean).join(" ") ||
                        "-"}{" "}
                    </strong>
                    <br />
                    <span>Matricula:</span>
                    <strong>{preOrder.matricula || "-"} </strong>
                    <br />
                    <span>CHASIS: </span>
                    <strong>{preOrder.bastidor || "123456789"}</strong>
                    <br />
                  </div>
                </>
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
              <td>
                {preOrder.tiempoEstimadoHoras
                  ? `${preOrder.tiempoEstimadoHoras} h`
                  : "-"}
              </td>
              <td>
                {[preOrder.marca, preOrder.modelo].filter(Boolean).join(" ") ||
                  "-"}
              </td>
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
              <td>{operationType}</td>
            </tr>
          </tbody>
        </table>

        <section className="po-body">
          <section className="wo-body">
            <div className="po-section-head">
              <span>CÓDIGO OPERACIÓN</span>
              <span>DESCRIPCIÓN</span>
              <span>operario</span>
              <span>responsable</span>
              <span>tiempo</span>
            </div>
            <div className="po-block ">
              {(motivoLines.length
                ? motivoLines
                : ["Sin motivo indicado."]
              ).map((line, index) => (
                <p key={`${line}-${index}`} className="po-line">
              <strong style={{ fontSize: '14px',textTransform: 'uppercase' }}> *MOTIVO: {line}</strong>
                </p>
              ))}
            </div>
            <div className="wo-block large"></div>
          </section>
          <div className="po-block large">
            {partsLines.map((line, index) => (
              <p key={`${line}-${index}`} className="po-line">
                * {line}
              </p>
            ))}
            {!partsLines.length && <BlankLines count={5} />}
          </div>

          {preOrder.observaciones && (
            <div className="po-block">
              <p className="po-line">
                * OBSERVACIONES: {preOrder.observaciones}
              </p>
            </div>
          )}
        </section>

        <footer className="po-footer">
          <div className="po-footer-topbar" />
          <div className="po-departments">
            {["CHAPA", "PINTURA", "MONTAJE", "MECÁNICA", "LAVADO"].map(
              (item) => (
                <div className="po-department" key={item}>
                  <div className="po-department-head">{item}</div>
                  <div className="po-sign-line" />
                </div>
              ),
            )}
          </div>

          <div className="po-checks">
            {[
              "Test de Entrada",
              "Pre-ITV",
              "Verificación de Reparación",
              "Control de Calidad",
            ].map((item) => (
              <div className="po-check" key={item}>
                <div className="po-check-head">{item}</div>

                {item !== "Control de Calidad" ? (
                  <div className="po-options">
                    <span className="po-box" />
                    <span>Sí</span>
                    <span className="po-box" />
                    <span>No</span>
                  </div>
                ) : (
                  <div className="po-final-line" />
                )}
              </div>
            ))}
          </div>
        </footer>
      </section>
    </main>
  );
}

function BlankLines({ count }) {
  return (
    <div className="po-blank-lines">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} />
      ))}
    </div>
  );
}

function SimpleBlock({ label, value, large = false, blank = false }) {
  return (
    <div className={`mb-5 border border-black p-4 ${large ? "min-h-32" : ""}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide">{label}</p>
      {value ? (
        <p className="whitespace-pre-line text-base">{value}</p>
      ) : blank ? (
        <div className="space-y-5 pt-4">
          <div className="border-b border-black" />
          <div className="border-b border-black" />
          <div className="border-b border-black" />
        </div>
      ) : (
        <p>-</p>
      )}
    </div>
  );
}
