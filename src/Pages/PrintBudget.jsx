import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import api, { resolveApiAssetUrl } from "../Components/api";
import logoTaller from "../assets/LogoTallerCrowned.png";
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
        telefono: p.telefono ?? p.Telefono ?? "",
        matricula: p.matricula ?? p.Matricula ?? "",
        marca: p.marca ?? p.Marca ?? "",
        modelo: p.modelo ?? p.Modelo ?? "",
        kilometraje: p.kilometraje ?? p.Kilometraje ?? "",
        fecha: p.fecha ?? p.Fecha,
        trabajo: p.trabajo ?? p.Trabajo ?? "",
        repuestos: Number(p.repuestos ?? p.Repuestos ?? 0),
        manoObra: Number(p.manoObra ?? p.ManoObra ?? 0),
        estado: p.estado ?? p.Estado ?? "",
        observaciones: p.observaciones ?? p.Observaciones ?? "",
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

    return [
      {
        descripcion: budget.trabajo || "Trabajo presupuestado",
        cantidad: 1,
        importe: budget.repuestos,
      },
      {
        descripcion: "Mano de obra",
        cantidad: 1,
        importe: budget.manoObra,
      },
    ];
  }, [budget]);

  const subtotal = useMemo(() => {
    return round2(
      items.reduce(
        (sum, item) =>
          sum + Number(item.cantidad || 0) * Number(item.importe || 0),
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

  const printBudget = () => {
    window.print();
  };

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

  return (
    <>
      <div className="no-print flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {labels.budgetTitle}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Presupuesto {budget.numeroPresupuesto}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printBudget}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-violet-600 text-white hover:bg-violet-700 transition"
          >
            <Printer size={18} />
            Imprimir
          </button>

          <Link
            to="/presupuestos"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
        </div>
      </div>

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
                  className="border border-black px-2 py-2 text-center"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  DESCRIPCION
                </th>
                <th
                  className="border border-black px-2 py-2 w-28 text-center"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  CANTIDAD
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
                  <td className="whitespace-pre-line border border-black px-2 py-2 align-top leading-5">
                    {item.descripcion}
                  </td>
                  <td className="border border-black px-2 py-2 text-center align-top">
                    {item.cantidad}
                  </td>
                  <td className="border border-black px-2 py-2 text-right align-top">
                    {formatMoney(Number(item.importe || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 items-start">
            <div className="text-sm">
              <p className="font-extrabold">CONDICIONES DEL PRESUPUESTO</p>

              <p className="mt-2 italic font-semibold leading-5">
                Este presupuesto tiene validez de 15 dias desde su fecha de
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

            <div className="border border-black text-sm">
              <Row label="SUBTOTAL" value={formatMoney(subtotal)} />
              <Row label="TASA IVA" value={`${ivaPct}%`} />
              <Row label="IVA" value={formatMoney(iva)} />
              <Row label="TOTAL" value={formatMoney(total)} strong />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-12 text-sm">
            <div className="border-t border-black pt-2 text-center">
              Firma {labels.businessSingular}
            </div>

            <div className="border-t border-black pt-2 text-center">
              Firma cliente / aceptacion
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

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
