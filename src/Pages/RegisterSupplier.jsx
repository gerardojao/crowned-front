import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";

const EMPTY_SUPPLIER = {
  Id: "",
  Nombre: "",
  Contacto: "",
  Telefono: "",
  Email: "",
  Direccion: "",
  NifCif: "",
  Categoria: "",
  Observaciones: "",
};

const Banner = ({ type = "success", text, onClose }) => {
  if (!text) return null;

  const map = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    error: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mb-4 rounded-xl p-3 text-sm ring-1 ${map[type]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span>{text}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs underline underline-offset-2"
        >
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

  const [editingId, setEditingId] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    supplier: null,
  });

  const [deleting, setDeleting] = useState(false);

  const setField = (name, value) => {
    setSupplier((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
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
          pageSize,
        },
      });
      const pack = res?.data?.data?.[0];
      console.log(pack);
      setSuppliers(pack?.items || []);
    } catch (err) {
      console.error(err);
      setSuppliers([]);
      setNotice({
        type: "error",
        text: "No se pudieron cargar los proveedores.",
      });
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

      const payload = {
        nombre: supplier.Nombre,
        contacto: supplier.Contacto || null,
        telefono: supplier.Telefono || null,
        email: supplier.Email || null,
        direccion: supplier.Direccion || null,
        categoria: supplier.Categoria || null,
        nifCif: supplier.NifCif || null,
        observaciones: supplier.Observaciones || null,
      };

      if (editingId) {
        await api.put(`/Proveedor/${editingId}`, payload);

        setNotice({
          type: "success",
          text: "Proveedor actualizado correctamente.",
        });
      } else {
        await api.post("/Proveedor", payload);

        setNotice({
          type: "success",
          text: "Proveedor registrado correctamente.",
        });
      }

      setSupplier(EMPTY_SUPPLIER);

      setEditingId(null);

      await loadSuppliers();
    } catch (err) {
      console.error(err);

      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar el proveedor.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditSupplier = (s) => {
    const id = s.id ?? s.Id;

    setEditingId(id);

    setSupplier({
      Id: id,
      Nombre: s.nombre ?? s.Nombre ?? "",
      Contacto: s.contacto ?? s.Contacto ?? "",
      Telefono: s.telefono ?? s.Telefono ?? "",
      Email: s.email ?? s.Email ?? "",
      Direccion: s.direccion ?? s.Direccion ?? "",
      NifCif: s.nifCif ?? s.NifCif ?? "",
      Categoria: s.categoria ?? s.Categoria ?? "",
      Observaciones: s.observaciones ?? s.Observaciones ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const confirmDeleteSupplier = async () => {
    if (!deleteModal.supplier) return;

    const id = deleteModal.supplier.id;

    try {
      setDeleting(true);

      await api.delete(`/Proveedor/${id}`);

      setNotice({
        type: "success",
        text: "Proveedor eliminado correctamente.",
      });

      setDeleteModal({
        open: false,
        supplier: null,
      });

      await loadSuppliers();
    } catch (err) {
      console.error(err);

      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo eliminar el proveedor.",
      });
    } finally {
      setDeleting(false);
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
              {errors.Nombre && (
                <p className="mt-1 text-xs text-rose-600">{errors.Nombre}</p>
              )}
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
              {errors.Telefono && (
                <p className="mt-1 text-xs text-rose-600">{errors.Telefono}</p>
              )}
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
                name="NifCif"
                value={supplier.NifCif}
                className={cls("NifCif")}
                onChange={handleChange}
                placeholder="B12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Categoria
              </label>
              <input
                type="text"
                name="Categoria"
                value={supplier.Categoria}
                onChange={handleChange}
                className={cls("Categoria")}
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
          <button type="submit" disabled={submitting} className={supplierBtn}>
            {submitting
              ? "Guardando..."
              : editingId
                ? "Actualizar proveedor"
                : "Registrar proveedor"}
          </button>

          <button
            type="button"
            onClick={() => {
              setSupplier(EMPTY_SUPPLIER);
              setEditingId(null);
            }}
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
                <th className="text-center py-3">Proveedor</th>
                <th className="text-center py-3">Teléfono</th>
                <th className="text-center py-3">Email</th>
                <th className="text-center py-3">Categoria</th>
                <th className="text-center py-3">-</th>
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
                  <td className="py-3">{s.categoria ?? s.Categoria ?? "—"}</td>

                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEditSupplier(s)}
                        className="text-sky-600 hover:underline"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            supplier: {
                              id: s.id ?? s.Id,
                              nombre: s.nombre ?? s.Nombre,
                            },
                          })
                        }
                        className="text-rose-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
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
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="rounded-lg px-3 py-1.5 bg-slate-700 text-white">
            {page}
          </span>

          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200"
          >
            Siguiente
          </button>
        </div>
      </div>

      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Eliminar proveedor
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              ¿Seguro que deseas eliminar a{" "}
              <span className="font-semibold text-slate-900">
                {deleteModal.supplier?.nombre ?? "este proveedor"}
              </span>
              ?
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Esta acción ocultará el proveedor del sistema, pero no borrará
              físicamente el registro de la base de datos.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    supplier: null,
                  })
                }
                className="rounded-xl px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteSupplier}
                className="rounded-xl px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-60"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
