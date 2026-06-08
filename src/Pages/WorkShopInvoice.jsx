import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Printer, Wrench } from "lucide-react";
import api, { resolveApiAssetUrl } from "../Components/api";
import logoTaller from "../assets/LogoTallerCrowned.png";
import { useBusinessTerminology } from "../utils/businessTerminology";
import PartPicker, {
  getPartDisplayName,
  getPartId,
  getPartProviderId,
  getPartProviderName,
  getPartPurchasePrice,
  getPartSalePrice,
} from "../Components/PartPicker";
import { amountInput } from "../utils/currency";

const EMPTY_ITEM = {
  descripcion: "",
  cantidad: 1,
  importe: 0,
};

const FREQUENT_SERVICES = [
  "Servicio cambio de aceite y filtro",
  "Cambio de pastillas de frenos",
  "Cambio de rodamientos delanteros",
  "Cambio de amortiguadores",
  "Mano de obra",
  "Repuestos",
];

const DEFAULT_TALLER = {
  nombre: "Multiservicios Crower",
  razonSocial: "JUAN CARLOS FERNANDEZ SILVA",
  nif: " 61407055E",
  direccion: "CALLE ALCACER 63 D, Albal, 46470",
  telefono: "960057935/655042253",
  email: "multiservicioscrower@gmail.com",
  iban: "ES69 2100 4014 9122 0012 3843",
  serieFactura: "A",
  logoUrl: "",
};

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const inputCls = "rounded-xl border border-slate-300 px-3 py-2 text-sm";
const lockedInputCls =
  "rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600";

export default function WorkshopInvoice() {
  const { id } = useParams();
  const labels = useBusinessTerminology();

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [frequentServices, setFrequentServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [savingService, setSavingService] = useState(false);

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
    otros: "",
  });

  const [taller, setTaller] = useState(DEFAULT_TALLER);

  const [items, setItems] = useState([
    { descripcion: "Repuestos", cantidad: 1, importe: 0 },
    { descripcion: "Mano de obra", cantidad: 1, importe: 0 },
  ]);

  const clientFieldsLocked = Boolean(id);

  const normalizeOrder = (o) => ({
    id: o.id ?? o.Id,
    cliente: o.cliente ?? o.Cliente ?? "",
    dni: o.dni ?? o.Dni ?? "",
    telefono: o.telefono ?? o.Telefono ?? "",
    matricula: o.matricula ?? o.Matricula ?? "",
    marca: o.marca ?? o.Marca ?? "",
    modelo: o.modelo ?? o.Modelo ?? "",
    kilometraje: o.kilometraje ?? o.Kilometraje ?? "",
    trabajo: o.trabajo ?? o.Trabajo ?? "",
    itemsJson: o.itemsJson ?? o.ItemsJson ?? null,
    repuestos: Number(o.repuestos ?? o.Repuestos ?? 0),
    cantidad: Number(o.cantidad ?? o.Cantidad ?? 1),
    manoObra: Number(o.manoObra ?? o.ManoObra ?? 0),
    estado: o.estado ?? o.Estado ?? "",
    observaciones: o.observaciones ?? o.Observaciones ?? "",
    otros: Number(o.otros ?? o.Otros ?? 0),
  });

  // useEffect(() => {
  //   if (id) {
  //     loadOrder();
  //   } else {
  //     setLoading(false);
  //   }
  // }, [id]);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      const settings = await loadWorkshopSettings();
      if (alive) await loadFrequentServices();
      if (alive) await loadInvoice(settings?.serieFactura || "A");
    };
    init();
    return () => {
      alive = false;
    };
  }, [id]);

  const loadFrequentServices = async () => {
    try {
      const res = await api.get("/ServicioFrecuente");
      const list = res?.data?.data?.[0] || [];
      const names = list
        .map((x) => x.nombre ?? x.Nombre)
        .filter(Boolean);
      setFrequentServices(names.length ? names : FREQUENT_SERVICES);
    } catch (err) {
      console.error(err);
      setFrequentServices(FREQUENT_SERVICES);
    }
  };

  const loadWorkshopSettings = async () => {
    try {
      const res = await api.get("/WorkshopSettings");
      const data = res?.data || {};

      const next = {
        nombre: data.nombre ?? data.Nombre ?? DEFAULT_TALLER.nombre,
        razonSocial: data.razonSocial ?? data.RazonSocial ?? DEFAULT_TALLER.razonSocial,
        nif: data.nif ?? data.Nif ?? DEFAULT_TALLER.nif,
        direccion: data.direccion ?? data.Direccion ?? DEFAULT_TALLER.direccion,
        telefono: data.telefono ?? data.Telefono ?? DEFAULT_TALLER.telefono,
        email: data.email ?? data.Email ?? DEFAULT_TALLER.email,
        iban: data.iban ?? data.Iban ?? DEFAULT_TALLER.iban,
        serieFactura: data.serieFactura ?? data.SerieFactura ?? DEFAULT_TALLER.serieFactura,
        logoUrl: data.logoUrl ?? data.LogoUrl ?? DEFAULT_TALLER.logoUrl,
      };
      setTaller(next);
      return next;
    } catch {
      setTaller(DEFAULT_TALLER);
      return DEFAULT_TALLER;
    }
  };

  const loadInvoice = async (serieFactura = taller.serieFactura || "A") => {
    try {
      setLoading(true);
      setError("");

      const previewRes = await api.get("/NumeradorFactura/preview", {
        params: { serie: serieFactura || "A" },
      });

      const numeroFacturaPrev =
        previewRes?.data?.data?.[0]?.numeroFactura || "";

      if (id) {
        await loadOrder(numeroFacturaPrev);
      } else {
        setInvoice((prev) => ({
          ...prev,
          numero: numeroFacturaPrev,
        }));

        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo generar el numero de factura.",
      );
      setLoading(false);
    }
  };

  const loadOrder = async (numeroFacturaPrev) => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/OrdenTrabajo/${id}`);
      const raw = res?.data?.data?.[0];

      const o = normalizeOrder(raw);
      setOrder(o);

      setInvoice((prev) => ({
        ...prev,
        numero: numeroFacturaPrev,
        cliente: o.cliente,
        dni: o.dni,
        telefonoCliente: o.telefono,
        matricula: o.matricula,
        km: o.kilometraje || "",
        observaciones: o.observaciones || "",
        otros: o.otros || "",
      }));

      const orderItems = parseOrderItems(o.itemsJson);
      setItems(
        orderItems.length > 0
          ? orderItems
          : [
              {
                descripcion: o.trabajo || "Trabajo realizado",
                cantidad: Number(o.cantidad || 1),
                importe: Number(o.repuestos || 0),
              },
              {
                descripcion: "Mano de obra",
                cantidad: 1,
                importe: Number(o.manoObra || 0),
              },
            ],
      );
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

  const baseAntesOtros = useMemo(() => {
    return round2(
      items.reduce(
        (sum, item) =>
          sum + Number(item.cantidad || 0) * Number(item.importe || 0),
        0,
      ),
    );
  }, [items]);

  const otros = useMemo(() => {
    return round2(Number(invoice.otros || 0));
  }, [invoice.otros]);

  const subtotal = useMemo(() => {
    return round2(Math.max(0, baseAntesOtros - otros));
  }, [baseAntesOtros, otros]);

  const iva = useMemo(() => {
    return round2(subtotal * (Number(invoice.ivaPct || 0) / 100));
  }, [subtotal, invoice.ivaPct]);

  const totalFinal = useMemo(() => {
    return round2(subtotal + iva);
  }, [subtotal, iva]);

  const setInvoiceField = (name, value) => {
    setInvoice((prev) => ({
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

  const addFrequentService = (descripcion) => {
    if (!descripcion) return;
    setItems((prev) => [
      ...prev,
      {
        descripcion,
        cantidad: 1,
        importe: 0,
      },
    ]);
  };

  const addPartItem = (part) => {
    const descripcion = getPartDisplayName(part);
    if (!descripcion) return;

    setItems((prev) => [
      ...prev,
      {
        descripcion,
        cantidad: 1,
        importe: getPartSalePrice(part).toFixed(2),
        kind: "repuesto",
        repuestoStockId: getPartId(part),
        idProveedor: getPartProviderId(part),
        nombreProveedor: getPartProviderName(part),
        precioCompra: getPartPurchasePrice(part),
      },
    ]);
  };

  const createFrequentService = async () => {
    const nombre = newServiceName.trim();
    if (!nombre) return;

    try {
      setSavingService(true);
      setError("");
      const res = await api.post("/ServicioFrecuente", { nombre });
      if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
        throw new Error(res?.data?.message || res?.data?.Message || "No se pudo registrar el servicio.");
      }

      await loadFrequentServices();
      addFrequentService(nombre);
      setNewServiceName("");
      setNotice("Servicio frecuente agregado.");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo registrar el servicio.",
      );
    } finally {
      setSavingService(false);
    }
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

const saveIssuedInvoice = async () => {
  const billableItems = items.filter(
    (item) =>
      String(item.descripcion || "").trim() &&
      round2(Number(item.cantidad || 0) * Number(item.importe || 0)) > 0,
  );

  if (billableItems.length === 0) {
    throw new Error("La factura debe tener al menos una linea con importe mayor que 0.");
  }

  const payload = {
    idOrdenTrabajo: id ? Number(id) : null,
    fecha: invoice.fecha,
    cliente: invoice.cliente,
    dni: invoice.dni || null,
    direccionCliente: invoice.direccionCliente || null,
    telefonoCliente: invoice.telefonoCliente || null,
    matricula: invoice.matricula || null,
    km: invoice.km ? String(invoice.km) : null,
    otros,
    ivaPct: Number(invoice.ivaPct || 21),
    serie: taller.serieFactura || "A",
    observaciones: invoice.observaciones || null,
    items: billableItems,
  };

  return await api.post("/FacturaEmitida/emitir", payload);
};

const printInvoice = async () => {
  try {
    const res = await saveIssuedInvoice();
    if (res?.data?.ok === 0 || res?.data?.Ok === 0) {
      throw new Error(res?.data?.message || res?.data?.Message || "No se pudo guardar la factura.");
    }

    const numeroFactura =
      res?.data?.data?.[0]?.numeroFactura ||
      res?.data?.data?.[0]?.NumeroFactura ||
      "";

    if (!numeroFactura) {
      throw new Error("No se recibio el numero de factura emitida.");
    }

    const issuedEvent = {
      type: "tc:invoice-issued",
      idOrden: id ? Number(id) : null,
      numeroFactura,
      issuedAt: new Date().toISOString(),
    };

    setInvoice((prev) => ({
      ...prev,
      numero: numeroFactura,
    }));

    localStorage.setItem("tc:invoice-issued", JSON.stringify(issuedEvent));
    window.dispatchEvent(new CustomEvent("tc:invoice-issued", { detail: issuedEvent }));
    window.dispatchEvent(new Event("tc:client-alerts:refresh"));

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(issuedEvent, window.location.origin);
    }

    setTimeout(() => {
      window.print();

    }, 150);
  } catch (err) {
    console.error(err);
    setError(
      err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message ||
        "No se pudo guardar la factura.",
    );
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
            {labels.invoiceTitle}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {id
              ? labels.invoiceFromOrder(id)
              : "Genera una nueva Factura."}
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
            Datos de la {labels.businessSingular}
          </h3>

          <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            Estos datos pertenecen a la {labels.businessSingular} activa y no se editan desde la factura.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className={lockedInputCls}
              placeholder="Nombre comercial"
              value={taller.nombre}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="Razon social"
              value={taller.razonSocial}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="NIF/CIF"
              value={taller.nif}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="Telefono"
              value={taller.telefono}
              readOnly
            />

            <input
              className={`md:col-span-2 ${lockedInputCls}`}
              placeholder="Direccion"
              value={taller.direccion}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="Email"
              value={taller.email}
              readOnly
            />

            <input
              className={lockedInputCls}
              placeholder="IBAN"
              value={taller.iban}
              readOnly
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Datos de factura
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className={inputCls}
              placeholder="Numero factura"
              value={invoice.numero}
              readOnly
            />

            <input
              type="date"
              className={inputCls}
              value={invoice.fecha}
              onChange={(e) => setInvoiceField("fecha", e.target.value)}
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder="Cliente"
              value={invoice.cliente}
              readOnly={clientFieldsLocked}
              onChange={(e) => setInvoiceField("cliente", e.target.value)}
            />

            <input
              className={inputCls}
              placeholder="DNI/NIE/NIF"
              value={invoice.dni}
              onChange={(e) => setInvoiceField("dni", e.target.value)}
            />

            <input
              className={`md:col-span-2 ${inputCls}`}
              placeholder="Direccion cliente"
              value={invoice.direccionCliente}
              onChange={(e) =>
                setInvoiceField("direccionCliente", e.target.value)
              }
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder="Telefono cliente"
              value={invoice.telefonoCliente}
              readOnly={clientFieldsLocked}
              onChange={(e) =>
                setInvoiceField("telefonoCliente", e.target.value)
              }
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder={labels.referenceLabel}
              value={invoice.matricula}
              readOnly={clientFieldsLocked}
              onChange={(e) =>
                setInvoiceField("matricula", e.target.value.toUpperCase())
              }
            />

            <input
              className={clientFieldsLocked ? lockedInputCls : inputCls}
              placeholder={labels.metricLabel}
              value={invoice.km}
              readOnly={clientFieldsLocked}
              onChange={(e) => setInvoiceField("km", e.target.value)}
            />

            <input
              type="number"
              className={inputCls}
              placeholder="IVA %"
              value={invoice.ivaPct}
              onChange={(e) => setInvoiceField("ivaPct", e.target.value)}
            />
            <input
              type="number"
              className={inputCls}
              placeholder="Otros"
              value={invoice.otros}
              onChange={(e) => setInvoiceField("otros", e.target.value)}
              onBlur={(e) => setInvoiceField("otros", amountInput(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className="no-print rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 shadow-sm mb-8">
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Conceptos</h3>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <PartPicker
              onSelect={addPartItem}
              placeholder="Buscar repuesto"
              buttonLabel="Agregar linea"
              className="w-full sm:w-80"
            />

            <div className="relative">
              <Wrench
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                defaultValue=""
                onChange={(e) => {
                  addFrequentService(e.target.value);
                  e.target.value = "";
                }}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 sm:w-72"
                aria-label="Agregar servicio frecuente"
              >
                <option value="" disabled>
                  Agregar servicio frecuente
                </option>
                {frequentServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 bg-slate-700 text-white hover:bg-slate-800 transition text-sm"
            >
              <Plus size={16} />
              Anadir linea
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nuevo servicio frecuente"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createFrequentService();
              }
            }}
          />
          <button
            type="button"
            onClick={createFrequentService}
            disabled={savingService || !newServiceName.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {savingService ? "Guardando..." : "Guardar servicio"}
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[1fr_120px_160px_40px] gap-3"
            >
              <input
                list="frequent-services"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Descripcion"
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
                placeholder="Precio unitario"
                value={item.importe}
                onChange={(e) => setItemField(index, "importe", e.target.value)}
                onBlur={(e) => setItemField(index, "importe", amountInput(e.target.value))}
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
        <datalist id="frequent-services">
          {frequentServices.map((service) => (
            <option key={service} value={service} />
          ))}
        </datalist>
      </section>

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

                <p className="font-bold">{labels.referenceLabel.toUpperCase()}:</p>
                <p className="font-bold">{invoice.matricula}</p>

                <p className="font-bold">{labels.metricLabel.toUpperCase()}:</p>
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 items-start">
            <div className="text-sm">
              <p className="font-extrabold">{labels.warrantyTitle}</p>

              <p className="mt-2 italic font-semibold leading-5">
                {labels.warrantyText}
              </p>

              <p className="mt-4">
                Si tiene cualquier tipo de pregunta sobre esta factura, pongase
                en contacto con nosotros.
              </p>

              <p className="mt-4 text-center font-extrabold italic">
                GRACIAS POR SU CONFIANZA
              </p>

              <div className="mt-4">
                <p className="text-left text-lg font-extrabold underline">
                  OBSERVACIONES:
                </p>

                <p className="mt-2">{invoice.observaciones}</p>
              </div>
            </div>

            <div className="border border-black text-sm">
              <Row label="BASE IMPONIBLE" value={formatMoney(subtotal)} />
              <Row label="TASA IVA" value={`${invoice.ivaPct || 0}%`} />
              <Row label="IVA" value={formatMoney(iva)} />
              <Row label="OTROS" value={`- ${formatMoney(otros)}`} />
              <Row label="TOTAL" value={formatMoney(totalFinal)} strong />
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

function parseOrderItems(itemsJson) {
  if (!itemsJson) return [];

  try {
    const parsed = JSON.parse(itemsJson);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        descripcion: item.descripcion || item.Descripcion || "",
        cantidad: Number(item.cantidad ?? item.Cantidad ?? 1),
        importe: Number(
          item.precioUnitario ??
            item.PrecioUnitario ??
            item.importe ??
            item.Importe ??
            0,
        ),
        kind: item.kind ?? item.Kind ?? item.tipo ?? item.Tipo ?? null,
        repuestoStockId:
          item.repuestoStockId ??
          item.RepuestoStockId ??
          item.idRepuesto ??
          item.IdRepuesto ??
          null,
        idProveedor: item.idProveedor ?? item.IdProveedor ?? null,
        nombreProveedor: item.nombreProveedor ?? item.NombreProveedor ?? null,
        precioCompra: item.precioCompra ?? item.PrecioCompra ?? null,
      }))
      .filter(
        (item) =>
          item.descripcion.trim() &&
          item.cantidad > 0 &&
          item.importe >= 0,
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

