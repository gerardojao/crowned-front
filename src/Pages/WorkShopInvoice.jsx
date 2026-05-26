import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Printer } from "lucide-react";
import api from "../Components/api";

const EMPTY_ITEM = {
  descripcion: "",
  cantidad: 1,
  importe: 0,
};

const DEFAULT_TALLER = {
  nombre: "TALLER CROWNED",
  razonSocial: "JUAN CARLOS FERNÁNDEZ SILVA",
  nif: " 61407055E",
  direccion: "CALLE ALCÁCER 63 D, Albal, 46470",
  telefono: "960057935/655042253",
  email: "multiservicioscrower@gmail.com",
  iban: "ES69 2100 4014 9122 0012 3843",
};

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export default function WorkshopInvoice() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [order, setOrder] = useState(null);

  const [invoice, setInvoice] = useState({
    numero: "",
    fecha: new Date().toISOString().slice(0, 10),
    cliente: "",
    dni: "",
    direccionCliente: "",
    telefonoCliente: "",
    matricula: "",
    km: "",
    observaciones: "",
    ivaPct: 21,
  });

  const [taller, setTaller] = useState(DEFAULT_TALLER);

  const [items, setItems] = useState([
    { descripcion: "Repuestos", cantidad: 1, importe: 0 },
    { descripcion: "Mano de obra", cantidad: 1, importe: 0 },
  ]);

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const normalizeOrder = (o) => ({
    id: o.id ?? o.Id,
    cliente: o.cliente ?? o.Cliente ?? "",
    telefono: o.telefono ?? o.Telefono ?? "",
    matricula: o.matricula ?? o.Matricula ?? "",
    marca: o.marca ?? o.Marca ?? "",
    modelo: o.modelo ?? o.Modelo ?? "",
    kilometraje: o.kilometraje ?? o.Kilometraje ?? "",
    trabajo: o.trabajo ?? o.Trabajo ?? "",
    repuestos: Number(o.repuestos ?? o.Repuestos ?? 0),
    manoObra: Number(o.manoObra ?? o.ManoObra ?? 0),
    estado: o.estado ?? o.Estado ?? "",
    observaciones: o.observaciones ?? o.Observaciones ?? "",
  });

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/OrdenTrabajo/${id}`);
      const raw = res?.data?.data?.[0];

      const o = normalizeOrder(raw);
      setOrder(o);

      setInvoice((prev) => ({
        ...prev,
        numero: `${o.id}-${new Date().getFullYear()}`,
        cliente: o.cliente,
        telefonoCliente: o.telefono,
        matricula: o.matricula,
        km: o.kilometraje || "",
        observaciones: o.observaciones || "",
      }));

      setItems([
        {
          descripcion: o.trabajo || "Trabajo realizado",
          cantidad: 1,
          importe: Number(o.manoObra || 0),
        },
        {
          descripcion: "Repuestos",
          cantidad: 1,
          importe: Number(o.repuestos || 0),
        },
      ]);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar la orden.",
      );
    } finally {
      setLoading(false);
    }
  };

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Number(item.cantidad || 0) * Number(item.importe || 0),
        0,
      ),
    [items],
  );

  // 2. El subtotal (base imponible) se calcula quitándole el IVA al total
  const subtotal = useMemo(() => {
    const porcentajeIva = Number(invoice.ivaPct || 0) / 100;
    return total / (1 + porcentajeIva);
  }, [total, invoice.ivaPct]);

  // 3. El IVA es simplemente la diferencia entre el total y el subtotal
  const iva = useMemo(() => {
    return total - subtotal;
  }, [total, subtotal]);

  const setInvoiceField = (name, value) => {
    setInvoice((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setTallerField = (name, value) => {
    setTaller((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setItemField = (index, name, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [name]: value,
            }
          : item,
      ),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
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
            Factura de taller
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Genera una factura a partir de la orden de trabajo #{id}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printInvoice}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-orange-600 text-white hover:bg-orange-700 transition"
          >
            <Printer size={18} />
            Imprimir
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

      {notice && (
        <div className="no-print mb-4 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 p-3 text-sm">
          {notice}
        </div>
      )}

      {error && (
        <div className="no-print mb-4 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 p-3 text-sm">
          {error}
        </div>
      )}

      <section className="no-print grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Datos del taller
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nombre comercial"
              value={taller.nombre}
              onChange={(e) => setTallerField("nombre", e.target.value)}
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Razón social"
              value={taller.razonSocial}
              onChange={(e) => setTallerField("razonSocial", e.target.value)}
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="NIF/CIF"
              value={taller.nif}
              onChange={(e) => setTallerField("nif", e.target.value)}
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Teléfono"
              value={taller.telefono}
              onChange={(e) => setTallerField("telefono", e.target.value)}
            />

            <input
              className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Dirección"
              value={taller.direccion}
              onChange={(e) => setTallerField("direccion", e.target.value)}
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Email"
              value={taller.email}
              onChange={(e) => setTallerField("email", e.target.value)}
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="IBAN"
              value={taller.iban}
              onChange={(e) => setTallerField("iban", e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Datos de factura
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Número factura"
              value={invoice.numero}
              onChange={(e) => setInvoiceField("numero", e.target.value)}
            />

            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              value={invoice.fecha}
              onChange={(e) => setInvoiceField("fecha", e.target.value)}
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Cliente"
              value={invoice.cliente}
              onChange={(e) => setInvoiceField("cliente", e.target.value)}
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="DNI/NIE/NIF"
              value={invoice.dni}
              onChange={(e) => setInvoiceField("dni", e.target.value)}
            />

            <input
              className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Dirección cliente"
              value={invoice.direccionCliente}
              onChange={(e) =>
                setInvoiceField("direccionCliente", e.target.value)
              }
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Teléfono cliente"
              value={invoice.telefonoCliente}
              onChange={(e) =>
                setInvoiceField("telefonoCliente", e.target.value)
              }
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Matrícula"
              value={invoice.matricula}
              onChange={(e) =>
                setInvoiceField("matricula", e.target.value.toUpperCase())
              }
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Kilometraje"
              value={invoice.km}
              onChange={(e) => setInvoiceField("km", e.target.value)}
            />

            <input
              type="number"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="IVA %"
              value={invoice.ivaPct}
              onChange={(e) => setInvoiceField("ivaPct", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="no-print rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 shadow-sm mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Conceptos</h3>

          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-slate-700 text-white hover:bg-slate-800 transition text-sm"
          >
            <Plus size={16} />
            Añadir línea
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[1fr_120px_160px_40px] gap-3"
            >
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Descripción"
                value={item.descripcion}
                onChange={(e) =>
                  setItemField(index, "descripcion", e.target.value)
                }
              />

              <input
                type="number"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Cantidad"
                value={item.cantidad}
                onChange={(e) =>
                  setItemField(index, "cantidad", e.target.value)
                }
              />

              <input
                type="number"
                step="0.01"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Importe"
                value={item.importe}
                onChange={(e) => setItemField(index, "importe", e.target.value)}
              />

              <button
                type="button"
                onClick={() => removeItem(index)}
                className="inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="invoice-print bg-white text-black">
        <div className="invoice-sheet mx-auto max-w-5xl">
          <div className="flex items-start justify-between gap-8 border-b-2 border-black pb-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-wide">
                {taller.nombre}
              </h1>

              <div className="mt-3 text-sm leading-5">
                <p>{taller.razonSocial}</p>
                <p>{taller.nif && `NIF/CIF: ${taller.nif}`}</p>
                <p>{taller.direccion}</p>
                <p>{taller.telefono}</p>
                <p>{taller.email}</p>
              </div>
            </div>

            <div className="text-sm min-w-[320px]">
              <div className="grid grid-cols-[120px_1fr] gap-y-1">
                <p className="font-bold">FECHA:</p>
                <p>{formatDate(invoice.fecha)}</p>

                <p className="font-bold">N.º FACTURA:</p>
                <p className="text-xl font-extrabold">{invoice.numero}</p>

                <p className="font-bold">FACTURAR A:</p>
                <p className="font-bold">{invoice.cliente}</p>

                <p className="font-bold">DNI/NIE/NIF:</p>
                <p>{invoice.dni}</p>

                <p className="font-bold">DIRECCIÓN:</p>
                <p>{invoice.direccionCliente}</p>

                <p className="font-bold">TELÉFONO:</p>
                <p>{invoice.telefonoCliente}</p>

                <p className="font-bold">MATRÍCULA:</p>
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
              <tr className="bg-slate-200">
                <th className="border border-black px-2 py-2 text-left">
                  DESCRIPCIÓN
                </th>
                <th className="border border-black px-2 py-2 w-28 text-center">
                  CANTIDAD
                </th>
                <th className="border border-black px-2 py-2 w-36 text-right">
                  IMPORTE
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black px-2 py-2">
                    {item.descripcion}
                  </td>
                  <td className="border border-black px-2 py-2 text-center">
                    {item.cantidad}
                  </td>
                  <td className="border border-black px-2 py-2 text-right">
                    {formatMoney(Number(item.importe || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
            <div className="text-sm">
              <p className="font-extrabold">GARANTÍA DE 60 DÍAS O 2000KM</p>

              <p className="mt-2 italic font-semibold leading-5">
                Todo repuesto usado o nuevo suministrado e instalado a solicitud
                del cliente, NO SE LE BRINDARÁ GARANTÍA. Las reparaciones tienen
                garantía cuando sean repuestos nuevos suministrados por el
                taller.
              </p>

              <p className="mt-4">
                Si tiene cualquier tipo de pregunta sobre esta factura, póngase
                en contacto con nosotros.
              </p>

              <p className="mt-4 text-center font-extrabold italic">
                GRACIAS POR SU CONFIANZA
              </p>

              <div className="mt-4">
                <p className="text-lg font-extrabold underline">
                  OBSERVACIONES:
                </p>

                <p className="mt-2">{invoice.observaciones}</p>
              </div>
            </div>

            <div className="border border-black text-sm">
              <Row label="SUBTOTAL" value={formatMoney(subtotal)} />
              <Row label="TASA IVA" value={`${invoice.ivaPct || 0}%`} />
              <Row label="IVA" value={formatMoney(iva)} />
              <Row label="OTROS" value="-" />
              <Row label="TOTAL" value={formatMoney(total)} strong />
            </div>
          </div>

          <div className="mt-8 border-t border-black pt-2 text-xs">
            <p>
              RAZÓN SOCIAL: {taller.razonSocial}
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
    <div className="grid grid-cols-2 border-b border-black last:border-b-0">
      <div className="px-3 py-2 font-bold italic bg-slate-50">{label}</div>
      <div className={`px-3 py-2 text-right ${strong ? "font-extrabold" : ""}`}>
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
