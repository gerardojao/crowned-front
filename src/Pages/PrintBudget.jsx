import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api, { resolveApiAssetUrl } from "../Components/api";
import PrintActions from "../Components/PrintActions";
import logoTaller from "../assets/LogoTallerCrowned.png";
import { usesZagaInvoiceTemplate } from "../Components/ZagaInvoiceDocument";
import { useBusinessTerminology } from "../utils/businessTerminology";

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

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export default function PrintBudget() {
  const { id } = useParams();
  const labels = useBusinessTerminology();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [taller, setTaller] = useState(DEFAULT_TALLER);
  const [budget, setBudget] = useState(null);

  const ivaPct = 21;

  useEffect(() => {
    loadWorkshopSettings();
    loadBudget();
  }, [id]);

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

  const loadBudget = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/Presupuesto/${id}`);
      const p = res?.data?.data?.[0];

      if (!p) {
        setError("No se encontro el presupuesto.");
        return;
      }

      setBudget({
        id: p.id ?? p.Id,
        numeroPresupuesto: p.numeroPresupuesto ?? p.NumeroPresupuesto ?? "",
        cliente: p.cliente ?? p.Cliente ?? "",
        dni: p.dni ?? p.Dni ?? "",
        telefono: p.telefono ?? p.Telefono ?? "",
        direccion: p.direccion ?? p.Direccion ?? "",
        codigoPostal: p.codigoPostal ?? p.CodigoPostal ?? "",
        poblacion: p.poblacion ?? p.Poblacion ?? "",
        provincia: p.provincia ?? p.Provincia ?? "",
        matricula: p.matricula ?? p.Matricula ?? "",
        marca: p.marca ?? p.Marca ?? "",
        modelo: p.modelo ?? p.Modelo ?? "",
        bastidor: p.bastidor ?? p.Bastidor ?? "",
        motor: p.motor ?? p.Motor ?? "",
        fechaMatriculacion: p.fechaMatriculacion ?? p.FechaMatriculacion ?? "",
        kilometraje: p.kilometraje ?? p.Kilometraje ?? "",
        fecha: p.fecha ?? p.Fecha,
        tipoOperacion: p.tipoOperacion ?? p.TipoOperacion ?? "Mecanica",
        trabajo: p.trabajo ?? p.Trabajo ?? "",
        itemsJson: p.itemsJson ?? p.ItemsJson ?? null,
        repuestos: Number(p.repuestos ?? p.Repuestos ?? 0),
        cantidad: Number(p.cantidad ?? p.Cantidad ?? 1),
        manoObra: Number(p.manoObra ?? p.ManoObra ?? 0),
        estado: p.estado ?? p.Estado ?? "",
        observaciones: p.observaciones ?? p.Observaciones ?? "",
        acceptanceSignatureBase64:
        p.acceptanceSignatureBase64 ?? p.AcceptanceSignatureBase64 ?? "",

        acceptanceSignatureDate:
          p.acceptanceSignatureDate ?? p.AcceptanceSignatureDate ?? null,

        isAccepted:
          p.isAccepted ?? p.IsAccepted ?? false,
      });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar el presupuesto.",
      );
    } finally {
      setLoading(false);
    }
  };

  const items = useMemo(() => {
    if (!budget) return [];

    const storedItems = parseBudgetItems(budget.itemsJson);
    if (storedItems.length > 0) return storedItems;

    return [
      {
        descripcion: budget.trabajo || "Trabajo presupuestado",
        cantidad: budget.cantidad || 1,
        precioUnitario: budget.repuestos,
      },
      {
        descripcion: "Mano de obra",
        cantidad: 1,
        precioUnitario: budget.manoObra,
      },
    ].filter((item) => Number(item.precioUnitario || 0) > 0);
  }, [budget]);

  const subtotal = useMemo(() => {
    return round2(
      items.reduce(
        (sum, item) => sum + getBudgetPrintLineTotal(item),
        0,
      ),
    );
  }, [items]);

  const iva = useMemo(() => {
    return round2(subtotal * (ivaPct / 100));
  }, [subtotal]);

  const total = useMemo(() => {
    return round2(subtotal + iva);
  }, [subtotal, iva]);

  if (loading) {
    return (
      <section className="rounded-2xl bg-white/80 p-6 ring-1 ring-slate-200">
        Cargando presupuesto...
      </section>
    );
  }

  if (error || !budget) {
    return (
      <section className="rounded-2xl bg-rose-50 p-6 text-rose-700 ring-1 ring-rose-200">
        {error || "No se encontro el presupuesto."}
      </section>
    );
  }

  const useMasterTouchTemplate = usesZagaInvoiceTemplate(taller);
  const logoSrc = resolveApiAssetUrl(taller.logoUrl) || logoTaller;
  const documentNumber = budget.numeroPresupuesto || String(budget.id || "");
  const operationType = String(
    budget.tipoOperacion || "Mecanica",
  ).toUpperCase();

  const acceptanceSignatureSrc = getSignatureSrc(
  budget.acceptanceSignatureBase64,
  );

  if (useMasterTouchTemplate) {
    return (
      <main className="print-page -mx-4 min-h-screen bg-sky-50/70 px-4 py-6 text-black sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <PrintActions
          title="Presupuesto"
          subtitle={`Presupuesto ${documentNumber}`}
          backTo="/presupuestos"
          printLabel="Imprimir"
        />

        <style>{`
          .budget-mt-sheet {
            width: 190mm;
            min-height: 255mm;
            margin: 0 auto;
            padding: 3mm 5mm;
            background: #fff;
            border: 1px solid rgba(148, 163, 184, 0.35);
            border-radius: 16px;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.2px;
            line-height: 1.18;
            color: #111;
          }
          .budget-mt-header {
            display: grid;
            grid-template-columns: 56% 1fr;
            align-items: start;
            gap: 5mm;
            margin-bottom: 3mm;
          }
          .budget-mt-logo {
            width: 72mm;
            max-height: 24mm;
            object-fit: contain;
            object-position: left center;
          }
          .budget-mt-company {
            width: 60mm;
            justify-self: end;
            margin-top: 3mm;
            font-size: 8px;
            line-height: 1.22;
            text-transform: uppercase;
          }
          .budget-mt-title-row {
            display: grid;
            grid-template-columns: 72mm 1fr;
            gap: 4mm;
            align-items: start;
            margin-bottom: 1mm;
          }
          .budget-mt-title {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: .2px;
            margin: 0 0 2mm;
            text-align: left;
            text-transform: uppercase;
          }
          .budget-mt-meta {
            width: 52mm;
            border-collapse: collapse;
            font-size: 8px;
          }
          .budget-mt-meta th {
            width: 28mm;
            background: #b7b7b7;
            border-bottom: 1px solid #fff;
            padding: 1.1mm 1.2mm;
            text-align: left;
            font-weight: 800;
          }
          .budget-mt-meta td {
            border-bottom: 1px solid #fff;
            padding: 1.1mm 1.2mm;
            font-weight: 700;
            text-align: left;
            font-size: 8px;
          }
          .budget-mt-client-box {
            position: relative;
            width: 68mm;
            min-height: 20mm;
            padding: 4mm 7mm 3mm;
            font-size: 8px;
            line-height: 1.25;
            text-transform: uppercase;
            margin-top: 8mm;
            margin-left: 34mm;
          }
          .budget-mt-client-box:before,
          .budget-mt-client-box:after,
          .budget-mt-client-corners:before,
          .budget-mt-client-corners:after {
            content: "";
            position: absolute;
            width: 13mm;
            height: 9mm;
            border-color: #111;
          }
          .budget-mt-client-box:before { top: 0; left: 0; border-top: 1px solid; border-left: 1px solid; }
          .budget-mt-client-box:after { top: 0; right: 0; border-top: 1px solid; border-right: 1px solid; }
          .budget-mt-client-corners:before { bottom: 0; left: 0; border-bottom: 1px solid; border-left: 1px solid; }
          .budget-mt-client-corners:after { bottom: 0; right: 0; border-bottom: 1px solid; border-right: 1px solid; }
          .budget-mt-page-label {
            text-align: right;
            font-size: 8px;
            margin-top: 1mm;
          }
          .budget-mt-grid {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 1mm;
            font-size: 8px;
          }
          .budget-mt-grid th {
            background: #b7b7b7;
            border: 1px solid #fff;
            padding: .8mm 1mm;
            text-align: center;
            font-weight: 800;
            text-transform: uppercase;
          }
          .budget-mt-grid td {
            padding: .8mm 1mm;
            text-align: center;
            border: 1px solid #fff;
            font-size: 8px;
          }
          .budget-mt-body {
            margin-top: 1mm;
            position: relative;
            min-height: 104mm;
            border: 1px solid #111;
            padding: 0 0 3mm;
          }
          .budget-mt-watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(100, 116, 139, 0.12);
            font-size: 28px;
            letter-spacing: 1px;
            pointer-events: none;
          }
          .budget-mt-group-head {
            display: grid;
            grid-template-columns: 28mm 1fr 22mm 18mm 18mm 18mm 26mm;
            font-weight: 800;
            text-transform: uppercase;
            align-items: end;
            padding-top: 1mm;
          }
          .budget-mt-group-title {
            background: #c9c9c9;
            padding: .7mm 1mm;
            font-size: 8px;
          }
          .budget-mt-description-title {
            padding: .7mm 1mm;
            font-size: 8px;
            text-align: center;
          }
          .budget-mt-group-head span {
            padding: .7mm 1mm;
            font-size: 8px;
            text-align: right;
          }
          .budget-mt-line {
            display: grid;
            grid-template-columns: 28mm 1fr 22mm 18mm 18mm 18mm 26mm;
            min-height: 4mm;
            align-items: start;
            font-size: 9px;
          }
          .budget-mt-line div {
            padding: .45mm 1mm;
          }
          .budget-mt-money {
            text-align: right;
          }
          .budget-mt-notes {
            padding: 2mm;
            min-height: 18mm;
            font-size: 8px;
          }
          .budget-mt-summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr) 1.3fr 1.3fr 1.35fr;
            border: 1px solid #111;
            text-align: center;
            font-size: 9px;
          }
          .budget-mt-summary-cell {
            border-right: 1px solid #111;
            padding: .8mm 1mm;
          }
          .budget-mt-summary-cell:last-child {
            border-right: 0;
          }
          .budget-mt-summary-label {
            font-size: 8px;
            text-transform: uppercase;
          }
          .budget-mt-summary-value {
            margin-top: .5mm;
            font-weight: 800;
          }
          .budget-mt-footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid #111;
            border-bottom: 0;
            font-size: 8px;
            text-transform: uppercase;
          }
          .budget-mt-sign {
            min-height: 8mm;
            border-right: 1px solid #111;
            padding: 1mm;
            font-weight: 800;
          }
          .budget-mt-sign:last-child {
            border-right: 0;
          }
          .budget-mt-validity {
            margin-top: 1mm;
            border: 1px solid #111;
            border-bottom: 0;
            padding: 2mm 3mm;
            font-size: 8px;
            text-transform: uppercase;
          }
          .budget-mt-pending {
            border: 1px solid #111;
            border-bottom: 0;
            min-height: 8mm;
            padding: 1.2mm 2mm;
            font-size: 8px;
            text-transform: uppercase;
          }
          .budget-mt-tax {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border: 1px solid #111;
            border-bottom: 0;
            text-align: center;
            font-size: 8px;
          }
          .budget-mt-tax > div {
            padding: .6mm 1mm;
            border-right: 1px solid #111;
          }
          .budget-mt-tax > div:last-child {
            border-right: 0;
          }
          @media print {
            @page { size: letter portrait; margin: 5mm; }
            .budget-mt-sheet {
              width: 100%;
              min-height: auto;
              max-height: 266mm;
              margin: 0;
              padding: 0;
              border: 0;
              border-radius: 0;
              box-shadow: none;
              overflow: hidden;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .budget-mt-body,
            .budget-mt-validity,
            .budget-mt-pending,
            .budget-mt-footer,
            .budget-mt-tax,
            .budget-mt-summary {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}</style>

        <section className="budget-mt-sheet">
          <header className="budget-mt-header">
            <div>
              <img src={logoSrc} alt="Logo taller" className="budget-mt-logo" />
            </div>
            <div className="budget-mt-company text-left">
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

          <section className="budget-mt-title-row">
            <div>
              <h1 className="budget-mt-title">Presupuesto</h1>
              <table className="budget-mt-meta">
                <tbody>
                  <tr>
                    <th>Nº Documento</th>
                    <td>{documentNumber}</td>
                  </tr>
                  <tr>
                    <th>Fecha</th>
                    <td>{formatDateShort(budget.fecha)}</td>
                  </tr>
                  <tr>
                    <th>NIF</th>
                    <td>{budget.dni || "-"}</td>
                  </tr>
                  <tr>
                    <th>Estado</th>
                    <td>{budget.estado || "PENDIENTE"}</td>
                  </tr>
                  <tr>
                    <th>Tipo Operación</th>
                    <td>{operationType}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="budget-mt-client-box text-left">
                <div className="budget-mt-client-corners" />
                <strong>{budget.cliente || "-"}</strong>
                <br />
                {budget.direccion && (
                  <>
                    {budget.direccion}
                    <br />
                  </>
                )}
                {(budget.codigoPostal || budget.poblacion) && (
                  <>
                    {[budget.codigoPostal, budget.poblacion]
                      .filter(Boolean)
                      .join(" - ")}
                    <br />
                  </>
                )}
                {budget.provincia && (
                  <>
                    {budget.provincia}
                    <br />
                  </>
                )}
                {budget.telefono && (
                  <>
                    {budget.telefono}
                    <br />
                  </>
                )}
              </div>
              <div className="budget-mt-page-label">Pag. 1</div>
            </div>
          </section>

          <table className="budget-mt-grid">
            <thead>
              <tr>
                <th>Bloque</th>
                <th>F. presupuesto</th>
                <th>Validez</th>
                <th>Kms</th>
                <th>Cod color</th>
                <th>Marca y modelo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>-</td>
                <td>{formatDateShort(budget.fecha)}</td>
                <td>12 días</td>
                <td>{budget.kilometraje || "-"}</td>
                <td>-</td>
                <td>{[budget.marca, budget.modelo].filter(Boolean).join(" ") || "-"}</td>
              </tr>
            </tbody>
          </table>

          <table className="budget-mt-grid">
            <thead>
              <tr>
                <th>Matricula</th>
                <th>Nº peritacion</th>
                <th>F. matriculación</th>
                <th>Nº de chasis</th>
                <th>Nº motor</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{budget.matricula || "-"}</td>
                <td>-</td>
                <td>{formatDateShort(budget.fechaMatriculacion) || "-"}</td>
                <td>{budget.bastidor || "-"}</td>
                <td>{budget.motor || "-"}</td>
                <td>{budget.estado || "-"}</td>
              </tr>
            </tbody>
          </table>

          <section className="budget-mt-body">
            <div className="budget-mt-watermark">SIN VALIDEZ FISCAL</div>
            <BudgetLineGroup
              title="MANO DE OBRA"
              quantityLabel="TIEM"
              items={items.filter((item) => normalizeLineKind(item) === "labor")}
            />
            <BudgetLineGroup
              title="PIEZAS"
              quantityLabel="CANT"
              items={items.filter((item) => normalizeLineKind(item) === "parts")}
            />
            <BudgetLineGroup
              title="PINTURA"
              quantityLabel="CANT"
              items={items.filter((item) => normalizeLineKind(item) === "paint")}
            />
          </section>

          <div className="budget-mt-validity">
            Este presupuesto tiene una validez de 12 días hábiles a partir del
            día siguiente en el que es entregado al cliente.
          </div>
          <div className="budget-mt-pending">
            {budget.observaciones || "Pendiente configurar"}
          </div>
          <section className="budget-mt-footer">
            <div className="budget-mt-sign">
              Resguardo de deposito
              <br />
              Fecha y firma del taller
            </div>
            <div className="budget-mt-sign">
              Acepto presupuesto con fecha {formatDateShort(budget.fecha)}
              <br />
              {acceptanceSignatureSrc ? (
              <img
                src={acceptanceSignatureSrc}
                alt="Firma cliente"
                className="mx-auto mt-1 h-8 max-w-[120px] object-contain"
              />
            ) : (
              "Firma cliente"
            )}
            </div>
          </section>
          <section className="budget-mt-tax">
            <div>
              % I.V.A.
              <br />
              <strong>{ivaPct}</strong>
            </div>
            <div>
              Base I.V.A.
              <br />
              <strong>{formatPlain(subtotal)}</strong>
            </div>
            <div>
              Cuota I.V.A.
              <br />
              <strong>{formatPlain(iva)}</strong>
            </div>
          </section>
          <section className="budget-mt-summary">
            <SummaryCell label="Mano de Obra" value={formatMoney(sumBudgetItems(items, "labor"))} />
            <SummaryCell label="Piezas" value={formatMoney(sumBudgetItems(items, "parts"))} />
            <SummaryCell label="Pintura" value={formatMoney(sumBudgetItems(items, "paint"))} />
            <SummaryCell label="Otros" value={formatMoney(0)} />
            <SummaryCell label="Base Imponible" value={formatMoney(subtotal)} />
            <SummaryCell label="Impuestos" value={formatMoney(iva)} />
            <SummaryCell label="Total Importe" value={formatMoney(total)} strong />
          </section>
        </section>
      </main>
    );
  }

  return (
    <>
      <PrintActions
        title={labels.budgetTitle}
        subtitle={`Presupuesto ${budget.numeroPresupuesto}`}
        backTo="/presupuestos"
        printLabel="Imprimir"
      />

      <section className="invoice-print bg-white text-black">
        <div className="invoice-sheet mx-auto max-w-5xl">
          <div className="grid grid-cols-[150px_1fr_310px] items-start gap-6 border-b-2 border-black pb-4">
            <div className="flex h-32 items-center justify-center">
              <img
                src={logoSrc}
                alt="Logo taller"
                className="max-h-28 max-w-36 object-contain"
              />
            </div>

            <div className="min-w-0 text-center">
              <h1 className="mt-3 text-3xl font-extrabold tracking-wide uppercase leading-tight">
                {taller.nombre}
              </h1>

              <div className="mt-3 text-sm leading-5">
                <p className="font-semibold">{taller.razonSocial}</p>
                <p>{taller.nif && `NIF/CIF: ${taller.nif}`}</p>
                <p>{taller.direccion}</p>
                <p>{taller.telefono}</p>
                <p>{taller.email}</p>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-right mb-4">
                <h2 className="text-2xl font-extrabold uppercase">
                  PRESUPUESTO
                </h2>
              </div>

              <div className="grid grid-cols-[118px_1fr] gap-x-2 gap-y-1">
                <p className="font-bold">FECHA:</p>
                <p>{formatDate(budget.fecha)}</p>

                <p className="font-bold">N. PRESUPUESTO:</p>
                <p className="text-xl font-extrabold">
                  {budget.numeroPresupuesto}
                </p>

                <p className="font-bold">CLIENTE:</p>
                <p className="font-bold">{budget.cliente}</p>

                <p className="font-bold">DNI/NIE/NIF:</p>
                <p>{budget.dni}</p>

                <p className="font-bold">TELEFONO:</p>
                <p>{budget.telefono}</p>

                <p className="font-bold">{labels.referenceLabel.toUpperCase()}:</p>
                <p className="font-bold">{budget.matricula}</p>

                <p className="font-bold">{labels.assetHeader.toUpperCase()}:</p>
                <p>
                  {budget.marca} {budget.modelo}
                </p>

                <p className="font-bold">{labels.metricLabel.toUpperCase()}:</p>
                <p>{budget.kilometraje}</p>
              </div>
            </div>
          </div>

          <table className="w-full border-collapse text-sm mt-4">
            <thead>
              <tr style={{ backgroundColor: "#e2e8f0" }}>
                <th
                  className="border border-black px-2 py-2 w-24 text-center"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  CANTIDAD
                </th>
                <th
                  className="border border-black px-2 py-2 text-center"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  DESCRIPCION
                </th>
                <th
                  className="border border-black px-2 py-2 w-36 text-right"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  PRECIO UNITARIO
                </th>
                <th
                  className="border border-black px-2 py-2 w-36 text-right"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  IMPORTE
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black px-2 py-2 text-center align-top">
                    {formatQty(getBudgetPrintLineQuantity(item))}
                  </td>
                  <td className="whitespace-pre-line border border-black px-2 py-2 align-top leading-5">
                    {item.descripcion}
                  </td>
                  <td className="border border-black px-2 py-2 text-right align-top">
                    {formatMoney(Number(item.precioUnitario || 0))}
                  </td>
                  <td className="border border-black px-2 py-2 text-right align-top">
                    {formatMoney(
                      getBudgetPrintLineTotal(item),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 grid grid-cols-[1fr_280px] gap-6 items-start">
            <div className="text-sm">
              <p className="font-extrabold">CONDICIONES DEL PRESUPUESTO</p>

              <p className="mt-2 italic font-semibold leading-5">
                Este presupuesto tiene validez de 15 días desde su fecha de
                emision. La aceptacion del presupuesto autoriza el inicio de los
                trabajos indicados.
              </p>

              <div className="mt-4">
                <p className="text-left text-lg font-extrabold underline">
                  OBSERVACIONES:
                </p>

                <p className="mt-2 whitespace-pre-line">{budget.observaciones}</p>
              </div>
            </div>

            <div className="text-sm">
              <Row label="BASE IMPONIBLE" value={formatMoney(subtotal)} />
              <Row label="TASA IVA" value={`${ivaPct}%`} />
              <Row label="IVA" value={formatMoney(iva)} />
              <Row label="TOTAL" value={formatMoney(total)} strong />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-12 text-sm">
            <div className="border-t border-black pt-2 text-center">
              Firma {labels.businessSingular}
            </div>

            {/* <div className="border-t border-black pt-2 text-center">
              Firma cliente / aceptacion
            </div> */}
            <div className="pt-2 text-center">
              {acceptanceSignatureSrc ? (
                <>
                  <img
                    src={acceptanceSignatureSrc}
                    alt="Firma cliente"
                    className="mx-auto h-20 max-w-xs object-contain"
                  />
                  <div className="mt-1 border-t border-black pt-2">
                    Firma cliente / aceptación
                  </div>
                  {budget.acceptanceSignatureDate && (
                    <p className="mt-1 text-xs">
                      Firmado el {formatDateShort(budget.acceptanceSignatureDate)}
                    </p>
                  )}
                    </>
                  ) : (
                    <div className="border-t border-black pt-2">
                      Firma cliente / aceptación
                    </div>
                  )}
                </div>
          </div>

          <div className="mt-8 border-t border-black pt-2 text-xs">
            <p>
              RAZON SOCIAL: {taller.razonSocial}
              {taller.nif ? ` / NIF: ${taller.nif}` : ""}
              {taller.direccion
                ? ` / DOMICILIO FISCAL: ${taller.direccion}`
                : ""}
            </p>
          </div>
        </div>
      </section>
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

function SummaryCell({ label, value, strong = false }) {
  return (
    <div className="budget-mt-summary-cell">
      <div className="budget-mt-summary-label">{label}</div>
      <div
        className={`budget-mt-summary-value ${strong ? "font-extrabold" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function BudgetLineGroup({ title, quantityLabel, items }) {
  if (!items.length) return null;

  return (
    <div>
      <div className="budget-mt-group-head">
        <div className="budget-mt-group-title">{title}</div>
        <div className="budget-mt-description-title">DESCRIPCION</div>
        <span>Precio</span>
        <span>{quantityLabel}</span>
        <span>%DTO</span>
        <span>%IVA</span>
        <span>Importe</span>
      </div>
      {items.map((item, index) => (
        <div className="budget-mt-line" key={`${title}-${item.descripcion}-${index}`}>
          <div>{item.codigo || getBudgetLineCode(item)}</div>
          <div>{item.descripcion}</div>
          <div className="budget-mt-money">{formatPlain(item.precioUnitario)}</div>
          <div className="budget-mt-money">
            {formatQty(getBudgetPrintLineQuantity(item))}
          </div>
          <div className="budget-mt-money">{formatPlain(item.descuentoPct || 0)}</div>
          <div className="budget-mt-money">{formatPlain(item.ivaPct || 21)}</div>
          <div className="budget-mt-money">
            {formatPlain(getBudgetPrintLineTotal(item))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatMoney(value) {
  return eur.format(Number(value || 0));
}

function formatPlain(value) {
  return Number(value || 0).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQty(value) {
  return Number(value || 0).toLocaleString("es-ES", {
    minimumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function formatDateShort(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-ES");
}

function normalizeLineKind(item) {
  const raw = String(
    item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? item.section ?? item.Section ?? "",
  )
    .trim()
    .toLowerCase();
  if (raw.includes("pintura")) return "paint";
  if (
    raw.includes("repuesto") ||
    raw.includes("pieza") ||
    raw.includes("material") ||
    raw.includes("part")
  ) {
    return "parts";
  }
  return "labor";
}

function getBudgetLineCode(item) {
  const kind = normalizeLineKind(item);
  if (kind === "paint") return "PINTURA";
  return kind === "parts" ? "PIEZAS" : "MO";
}

function sumBudgetItems(items, kind) {
  return items
    .filter((item) => normalizeLineKind(item) === kind)
    .reduce((sum, item) => sum + getBudgetPrintLineTotal(item), 0);
}

function getBudgetPrintLineQuantity(item) {
  const value =
    normalizeLineKind(item) === "parts"
      || normalizeLineKind(item) === "paint"
      ? (item.cantidad ?? item.Cantidad)
      : (item.tiempo ?? item.Tiempo ?? item.cantidad ?? item.Cantidad);
  const number = Number(value || 0);
  return number > 0 ? number : 1;
}

function getBudgetPrintLineTotal(item) {
  const discount = Math.min(
    100,
    Math.max(0, Number(item.descuentoPct ?? item.DescuentoPct ?? 0)),
  );
  return (
    getBudgetPrintLineQuantity(item) *
    Number(item.precioUnitario || 0) *
    (1 - discount / 100)
  );
}

function parseBudgetItems(itemsJson) {
  if (!itemsJson) return [];

  try {
    const parsed = JSON.parse(itemsJson);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        codigo: item.codigo || item.Codigo || "",
        kind: item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? item.section ?? item.Section ?? "",
        descripcion: item.descripcion || item.Descripcion || "",
        cantidad: Number(item.cantidad ?? item.Cantidad ?? 1),
        tiempo: item.tiempo ?? item.Tiempo ?? item.cantidad ?? item.Cantidad ?? 1,
        descuentoPct: item.descuentoPct ?? item.DescuentoPct ?? 0,
        precioUnitario: Number(
          item.precioUnitario ??
            item.PrecioUnitario ??
            item.importe ??
            item.Importe ??
            0,
        ),
      }))
      .filter(
        (item) =>
          item.descripcion.trim() &&
          item.cantidad > 0 &&
          item.precioUnitario >= 0,
      );
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getSignatureSrc(value) {
  if (!value) return "";
  const signature = String(value).trim();

  if (signature.startsWith("data:image")) {
    return signature;
  }

  return `data:image/png;base64,${signature}`;
}
