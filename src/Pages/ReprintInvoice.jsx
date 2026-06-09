import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import api, { resolveApiAssetUrl } from "../Components/api";
import logoTaller from "../assets/LogoTallerCrowned.png";

const DEFAULT_TALLER = {
  nombre: "Multiservicios Crower",
  razonSocial: "JUAN CARLOS FERNANDEZ SILVA",
  nif: "61407055E",
  direccion: "CALLE ALCACER 63 D, Albal, 46470",
  telefono: "960057935/655042253",
  email: "multiservicioscrower@gmail.com",
  iban: "ES69 2100 4014 9122 0012 3843",
  logoUrl: "",
};

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export default function ReprintInvoice() {
  const { idOrden, numeroFactura } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [taller, setTaller] = useState(DEFAULT_TALLER);

  const [invoice, setInvoice] = useState({
    numero: "",
    fecha: "",
    cliente: "",
    dni: "",
    direccionCliente: "",
    telefonoCliente: "",
    matricula: "",
    km: "",
    observaciones: "",
    ivaPct: 21,
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

      setInvoice({
        numero: f.numeroFactura ?? f.NumeroFactura ?? "",
        fecha: String(f.fecha ?? f.Fecha ?? "").slice(0, 10),
        cliente: f.cliente ?? f.Cliente ?? "",
        dni: f.dni ?? f.Dni ?? "",
        direccionCliente: f.direccionCliente ?? f.DireccionCliente ?? "",
        telefonoCliente: f.telefonoCliente ?? f.TelefonoCliente ?? "",
        matricula: f.matricula ?? f.Matricula ?? "",
        km: f.km ?? f.Km ?? "",
        observaciones: f.observaciones ?? f.Observaciones ?? "",
        ivaPct,
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
            Reimprimir factura
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Factura {invoice.numero}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {!error && (
        <section className="invoice-print bg-white text-black">
          <div className="invoice-sheet mx-auto max-w-5xl">
            <div className="grid grid-cols-[150px_1fr_310px] items-start gap-6 border-b-2 border-black pb-4">
              <div className="flex h-32 items-center justify-center">
                <img
                  src={resolveApiAssetUrl(taller.logoUrl) || logoTaller}
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
                <div className="grid grid-cols-[112px_1fr] gap-x-2 gap-y-1">
                  <p className="font-bold">FECHA:</p>
                  <p>{formatDate(invoice.fecha)}</p>

                  <p className="font-bold">N. FACTURA:</p>
                  <p className="text-xl font-extrabold">{invoice.numero}</p>

                  <p className="font-bold">FACTURAR A:</p>
                  <p className="font-bold">{invoice.cliente}</p>

                  <p className="font-bold">DNI/NIE/NIF:</p>
                  <p>{invoice.dni}</p>

                  <p className="font-bold">DIRECCION:</p>
                  <p>{invoice.direccionCliente}</p>

                  <p className="font-bold">TELEFONO:</p>
                  <p>{invoice.telefonoCliente}</p>

                  <p className="font-bold">MATRICULA:</p>
                  <p className="font-bold">{invoice.matricula}</p>

                  <p className="font-bold">KM.:</p>
                  <p>{invoice.km}</p>
                </div>
              </div>
            </div>

            {taller.iban && (
              <div className="text-center text-sm font-bold italic border-b border-black py-2">
                Transferencias a la cuenta {taller.iban} a nombre de{" "}
                {taller.razonSocial}
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
                </div>
              </div>

              <div className="text-sm">
                <Row label="BASE IMPONIBLE" value={formatMoney(totals.subtotal)} />
                <Row label="TASA IVA" value={`${invoice.ivaPct || 0}%`} />
                <Row label="IVA" value={formatMoney(totals.iva)} />
                <Row label="OTROS" value={`- ${formatMoney(totals.otros)}`} />
                <Row label="TOTAL" value={formatMoney(totals.total)} strong />
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

function formatMoney(value) {
  return eur.format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
