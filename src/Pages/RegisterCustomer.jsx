import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";
import { soloFecha } from "../utils/date";


const EMPTY_CUSTOMER = {
  Id: "",
  // Cliente
  Nombre: "",
  Telefono: "",
  Email: "",
  Direccion: "",

  // Vehículo
  Matricula: "",
  Marca: "",
  Modelo: "",
  Anio: "",
  Kilometraje: "",

  // Extra
  Observaciones: "",
};

const Banner = ({ type = "success", text, onClose, actionLabel, onAction }) => {
  if (!text) return null;
  const map = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    error: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <div role="alert" aria-live="polite" className={`mb-4 rounded-xl p-3 text-sm ring-1 ${map[type]}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{text}</span>
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="rounded-lg px-2.5 py-1 text-xs ring-1 ring-current/20 hover:bg-white/60"
            >
              {actionLabel}
            </button>
          )}
          <button type="button" onClick={onClose} className="text-xs underline underline-offset-2">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const workOrderBtn =
  "inline-flex items-center rounded-xl px-4 py-2.5 bg-amber-600 text-white hover:bg-amber-700 transition shadow-md font-semibold";

export default function RegisterCustomer() {

  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (name, value) => {
  setCustomer(prev => ({
    ...prev,
    [name]: value
  }));

  if (errors[name]) {
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  }
};

const handleChange = (e) => {
  setField(e.target.name, e.target.value);
};

const cls = (name) =>
  `w-full rounded-xl border bg-white px-3 py-2 text-sm ${
    errors[name]
      ? "border-rose-400 ring-1 ring-rose-200 focus-visible:ring-rose-400"
      : "border-slate-300"
  }`;

  const loadCustomers = async () => {
    const res = await api.get("/Cliente", {
      params: {
        search,
        page,
        pageSize
      }
    });

    setCustomers(res.data?.data || []);
  };

  useEffect(() => {
    loadCustomers();
  }, [search, page]);

  const onSubmit = async (e) => {
    e.preventDefault();

    await api.post("/Cliente/Create", {
      nombre: customer.Nombre,
      telefono: customer.Telefono,
      email: customer.Email || null,
      direccion: customer.Direccion || null,
      matricula: customer.Matricula,
      marca: customer.Marca || null,
      modelo: customer.Modelo,
      anio: customer.Anio || null,
      kilometraje: customer.Kilometraje || null
    });

    setCustomer(EMPTY_CUSTOMER);
    setNotice({
      type: "success",
      text: "Cliente registrado correctamente."
    });

    await loadCustomers();
  };

 return (
  <>
    <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Registro de cliente
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona clientes y vehículos del taller.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition"
      >
        <ArrowLeft size={18} />
        Volver
      </Link>
    </div>

    {/* Banner */}
    <Banner
      type={notice?.type}
      text={notice?.text}
      onClose={() => setNotice(null)}
    />
    

    {/* FORMULARIO */}
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 space-y-5"
    >

      {/* DATOS CLIENTE */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Datos del cliente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre *
            </label>

            <input
              type="text"
              name="Nombre"
              value={customer.Nombre}
              onChange={handleChange}
              className={cls("Nombre")}
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Teléfono *
            </label>

            <input
              type="text"
              name="Telefono"
              value={customer.Telefono}
              onChange={handleChange}
              className={cls("Telefono")}
              placeholder="Teléfono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>

            <input
              type="email"
              name="Email"
              value={customer.Email}
              onChange={handleChange}
              className={cls("Email")}
              placeholder="correo@email.com"
            />
          </div>

        </div>
      </div>

      {/* VEHÍCULO */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Vehículo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Matrícula *
            </label>

            <input
              type="text"
              name="Matricula"
              value={customer.Matricula}
              onChange={handleChange}
              className={cls("Matricula")}
              placeholder="1234ABC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Marca
            </label>

            <input
              type="text"
              name="Marca"
              value={customer.Marca}
              onChange={handleChange}
              className={cls("Marca")}
              placeholder="Toyota"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Modelo *
            </label>

            <input
              type="text"
              name="Modelo"
              value={customer.Modelo}
              onChange={handleChange}
              className={cls("Modelo")}
              placeholder="Corolla"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Kilometraje
            </label>

            <input
              type="number"
              name="Kilometraje"
              value={customer.Kilometraje}
              onChange={handleChange}
              className={cls("Kilometraje")}
              placeholder="120000"
            />
          </div>

        </div>
      </div>

      {/* BOTONES */}
      <div className="flex items-center gap-3 pt-2">

        <button
          type="submit"
          disabled={submitting}
          className={workOrderBtn}
        >
          {submitting
            ? "Guardando..."
            : "Registrar cliente"}
        </button>

        <button
          type="button"
          onClick={() => setCustomer(EMPTY_CUSTOMER)}
          className="inline-flex items-center rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
        >
          Limpiar
        </button>

      </div>
    </form>

    {/* LISTADO */}
    <div className="mt-8 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

        <h3 className="text-lg font-semibold text-slate-800">
          Clientes registrados
        </h3>

        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="text-left py-3">Cliente</th>
              <th className="text-left py-3">Teléfono</th>
              <th className="text-left py-3">Matrícula</th>
              <th className="text-left py-3">Modelo</th>
              <th className="text-left py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((c) => (
              <tr
                key={c.id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="py-3">{c.nombre}</td>
                <td className="py-3">{c.telefono}</td>
                <td className="py-3">{c.matricula}</td>
                <td className="py-3">{c.modelo}</td>

                <td className="py-3">
                  <button className="text-sky-600 hover:underline">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* PAGINADO */}
      <div className="flex items-center justify-end gap-2 mt-5">

        <button
          className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200"
        >
          Anterior
        </button>

        <button
          className="rounded-lg px-3 py-1.5 bg-slate-700 text-white"
        >
          1
        </button>

        <button
          className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200"
        >
          Siguiente
        </button>

      </div>

    </div>
  </>
);
}