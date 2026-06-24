import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api, { resolveApiAssetUrl } from "../Components/api";
import logoTaller from "../assets/LogoTallerCrowned.png";
import { usesZagaInvoiceTemplate } from "../Components/ZagaInvoiceDocument";

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
  const [taller, setTaller] = useState(DEFAULT_TALLER);
  const [preOrder, setPreOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (loading || error || !preOrder || printed) return;
    setPrinted(true);
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, [loading, error, preOrder, printed]);

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
          settings.razonSocial ?? settings.RazonSocial ?? DEFAULT_TALLER.razonSocial,
        nif: settings.nif ?? settings.Nif ?? DEFAULT_TALLER.nif,
        direccion: settings.direccion ?? settings.Direccion ?? DEFAULT_TALLER.direccion,
        telefono: settings.telefono ?? settings.Telefono ?? DEFAULT_TALLER.telefono,
        email: settings.email ?? settings.Email ?? DEFAULT_TALLER.email,
        logoUrl: settings.logoUrl ?? settings.LogoUrl ?? DEFAULT_TALLER.logoUrl,
        documentTemplateKey:
          settings.documentTemplateKey ??
          settings.DocumentTemplateKey ??
          DEFAULT_TALLER.documentTemplateKey,
        enablePreOrders:
          settings.enablePreOrders ??
          settings.EnablePreOrders ??
          true,
      });

      const data = preOrderRes?.data?.data?.[0];
      if (!data) {
        setError("No se encontro la pre-orden.");
        return;
      }

      setPreOrder({
        id: valueOf(data, "id"),
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
        motivoRecepcion: valueOf(data, "motivoRecepcion"),
        diagnosticoMecanico: valueOf(data, "diagnosticoMecanico"),
        repuestosNecesarios: valueOf(data, "repuestosNecesarios"),
        observaciones: valueOf(data, "observaciones"),
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

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando pre-orden...</div>;
  if (error || !preOrder) return <div className="p-10 text-center text-rose-600">{error || "No se encontro la pre-orden."}</div>;

  const useZaga = usesZagaInvoiceTemplate(taller);
  const preOrderModuleEnabled = taller.enablePreOrders ?? taller.EnablePreOrders ?? true;
  const logoSrc = resolveApiAssetUrl(taller.logoUrl) || logoTaller;

  if (!preOrderModuleEnabled) {
    return (
      <div className="p-10 text-center text-slate-600">
        <p className="mb-4 font-semibold">La pre-orden no esta habilitada para este taller.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
      </div>
    );
  }

  if (!useZaga) {
    return (
      <main className="print-page bg-white text-black">
        <PrintActions />
        <section className="mx-auto max-w-2xl border border-black p-8">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <img src={logoSrc} alt="Logo taller" className="mb-4 h-16 max-w-64 object-contain object-left" />
              <h1 className="text-2xl font-bold uppercase">PRE-ORDEN</h1>
              <p className="mt-1 text-lg">Pre-orden #{preOrder.id}</p>
            </div>
            <div className="text-right text-xs uppercase leading-tight">
              <strong>{taller.razonSocial || taller.nombre}</strong><br />
              {taller.nif}<br />
              {taller.direccion}
            </div>
          </div>
          <SimpleBlock label="Cliente" value={`${preOrder.cliente} - ${preOrder.telefono || ""}`} />
          <SimpleBlock label="Direccion" value={preOrder.direccion || "-"} />
          <SimpleBlock label="Vehiculo" value={`${preOrder.matricula} - ${preOrder.marca || ""} ${preOrder.modelo || ""}`} />
          <SimpleBlock label="Motivo recibido" value={preOrder.motivoRecepcion} large />
          <SimpleBlock label="Trabajo a realizar por mecanico" value={preOrder.diagnosticoMecanico} large blank />
          <SimpleBlock label="Repuestos necesarios" value={preOrder.repuestosNecesarios} large blank />
        </section>
      </main>
    );
  }

  const documentNumber = String(preOrder.id || "").padStart(9, "0");
  const motivoLines = lines(preOrder.motivoRecepcion);
  const diagLines = lines(preOrder.diagnosticoMecanico);
  const partsLines = lines(preOrder.repuestosNecesarios);

  return (
    <main className="print-page bg-white text-black">
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
    </main>
  );
}

function PrintActions() {
  return (
    <div className="no-print fixed right-4 top-4 z-50 flex items-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-orange-700"
      >
        Imprimir
      </button>
      <Link
        to="/pre-ordenes"
        className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>
    </div>
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
      {value ? <p className="whitespace-pre-line text-base">{value}</p> : blank ? <div className="space-y-5 pt-4"><div className="border-b border-black" /><div className="border-b border-black" /><div className="border-b border-black" /></div> : <p>-</p>}
    </div>
  );
}
