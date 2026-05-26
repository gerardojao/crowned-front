import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";

const EMPTY_SUPPLIER = {
  Id: "",
  Nombre: "",
  Telefono: "",
  Email: "",
  Direccion: "",
  Nif: "",
  Rubro: "",
  Observaciones: "",
};

const Banner = ({ type = "success", text, onClose }) => {
  if (!text) return null;

  const map = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    error: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <div role="alert" aria-live="polite" className={`mb-4 rounded-xl p-3 text-sm ring-1 ${map[type]}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{text}</span>
        <button type="button" onClick={onClose} className="text-xs underline underline-offset-2">
          Cerrar
        </button>
      </div>
    </div>
  );
};

const supplierBtn =
  "inline-flex items-center rounded-xl px-4 py-2.5 bg-teal-700 text-white hover:bg-teal-800 transition shadow-sm font-semibold";

export default function RegisterSupplier() {
  const [supplier, setSupplier] = useState(EMPTY_SUPPLIER);
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (name, value) => {
    setSupplier(prev => ({
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

  const loadSuppliers = async () => {
    try {
      const res = await api.get("/Proveedor", {
        params: {
          search,
          page,
          pageSize
        }
      });

      setSuppliers(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setSuppliers([]);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search, page]);

  const validateAll = () => {
    const next = {};

    if (!supplier.Nombre.trim()) next.Nombre = "El nombre es requerido.";
    if (!supplier.Telefono.trim()) next.Telefono = "El teléfono es requerido.";

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateAll()) return;

    try {
      setSubmitting(true);

      await api.post("/Proveedor/Create", {
        nombre: supplier.Nombre,
        telefono: supplier.Telefono,
        email: supplier.Email || null,
        direccion: supplier.Direccion || null,
        nif: supplier.Nif || null,
        rubro: supplier.Rubro || null,
        observaciones: supplier.Observaciones || null
      });

      setSupplier(EMPTY_SUPPLIER);

      setNotice({
        type: "success",
        text: "Proveedor registrado correctamente."
      });

      await loadSuppliers();
    } catch (err) {
      console.error(err);

      setNotice({
        type: "error",
        text: err?.response?.data?.message || err?.message || "No se pudo registrar el proveedor."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Registro de proveedor
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona proveedores de repuestos, servicios y materiales.
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

      <Banner
        type={notice?.type}
        text={notice?.text}
        onClose={() => setNotice(null)}
      />

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 space-y-5"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Datos del proveedor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="Nombre"
                value={supplier.Nombre}
                onChange={handleChange}
                className={cls("Nombre")}
                placeholder="Nombre del proveedor"
              />
              {errors.Nombre && <p className="mt-1 text-xs text-rose-600">{errors.Nombre}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono *
              </label>
              <input
                type="text"
                name="Telefono"
                value={supplier.Telefono}
                onChange={handleChange}
                className={cls("Telefono")}
                placeholder="Teléfono"
              />
              {errors.Telefono && <p className="mt-1 text-xs text-rose-600">{errors.Telefono}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="Email"
                value={supplier.Email}
                onChange={handleChange}
                className={cls("Email")}
                placeholder="correo@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                NIF/CIF
              </label>
              <input
                type="text"
                name="Nif"
                value={supplier.Nif}
                onChange={handleChange}
                className={cls("Nif")}
                placeholder="B12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rubro
              </label>
              <input
                type="text"
                name="Rubro"
                value={supplier.Rubro}
                onChange={handleChange}
                className={cls("Rubro")}
                placeholder="Repuestos, pintura, neumáticos..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="Direccion"
                value={supplier.Direccion}
                onChange={handleChange}
                className={cls("Direccion")}
                placeholder="Dirección"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Observaciones
            </label>
            <textarea
              name="Observaciones"
              value={supplier.Observaciones}
              onChange={handleChange}
              className={cls("Observaciones")}
              rows={3}
              placeholder="Notas internas del proveedor..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className={supplierBtn}
          >
            {submitting ? "Guardando..." : "Registrar proveedor"}
          </button>

          <button
            type="button"
            onClick={() => setSupplier(EMPTY_SUPPLIER)}
            className="inline-flex items-center rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
          >
            Limpiar
          </button>
        </div>
      </form>

      <div className="mt-8 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Proveedores registrados
          </h3>

          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full md:w-80 rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="text-left py-3">Proveedor</th>
                <th className="text-left py-3">Teléfono</th>
                <th className="text-left py-3">Email</th>
                <th className="text-left py-3">Rubro</th>
                <th className="text-left py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-3">{s.nombre}</td>
                  <td className="py-3">{s.telefono}</td>
                  <td className="py-3">{s.email}</td>
                  <td className="py-3">{s.rubro}</td>

                  <td className="py-3">
                    <button className="text-sky-600 hover:underline">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}

              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No hay proveedores para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="rounded-lg px-3 py-1.5 bg-slate-700 text-white">
            {page}
          </span>

          <button
            type="button"
            onClick={() => setPage(prev => prev + 1)}
            className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200"
          >
            Siguiente
          </button>
        </div>
      </div>
    </>
  );
}