import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";
import { useBusinessTerminology } from "../utils/businessTerminology";

const EMPTY_CUSTOMER = {
  Id: "",
  // Cliente
  Nombre: "",
  Dni: "",
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
    <div
      role="alert"
      aria-live="polite"
      className={`mb-4 rounded-xl p-3 text-sm ring-1 ${map[type]}`}
    >
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
          <button
            type="button"
            onClick={onClose}
            className="text-xs underline underline-offset-2"
          >
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
  const labels = useBusinessTerminology();
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    customer: null,
  });
  const [deleting, setDeleting] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const setField = (name, value) => {
    setCustomer((prev) => ({
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

  const loadCustomers = async () => {
    try {
      const res = await api.get("/Cliente", {
        params: {
          search,
          page,
          pageSize,
        },
      });

      const pack = res?.data?.data?.[0];
      setCustomers(pack?.items || []);
    } catch (err) {
      console.error(err);
      setCustomers([]);
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudieron cargar los clientes.",
      });
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, page]);

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const payload = {
        nombre: customer.Nombre,
        dni: customer.Dni || null,
        telefono: customer.Telefono,
        email: customer.Email || null,
        direccion: customer.Direccion || null,
        matricula: customer.Matricula,
        marca: customer.Marca || null,
        modelo: customer.Modelo,
        anio: customer.Anio ? Number(customer.Anio) : null,
        kilometraje: customer.Kilometraje ? Number(customer.Kilometraje) : null,
        observaciones: customer.Observaciones || null,
      };

      if (editingId) {
        await api.put(`/Cliente/${editingId}`, payload);

        setNotice({
          type: "success",
          text: "Cliente actualizado correctamente.",
        });
      } else {
        await api.post("/Cliente", payload);

        setNotice({
          type: "success",
          text: "Cliente registrado correctamente.",
        });
      }
      setCustomer(EMPTY_CUSTOMER);
      setEditingId(null);
      await loadCustomers();
    } catch (err) {
      console.error(err);

      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo registrar el cliente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteCustomer = async () => {
    if (!deleteModal.customer) return;

    const id = deleteModal.customer.id ?? deleteModal.customer.Id;

    try {
      setDeleting(true);

      await api.delete(`/Cliente/${id}`);

      setNotice({
        type: "success",
        text: "Cliente eliminado correctamente.",
      });

      setDeleteModal({
        open: false,
        customer: null,
      });

      await loadCustomers();
    } catch (err) {
      console.error(err);

      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo eliminar el cliente.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const startEditCustomer = (c) => {
    const id = c.id ?? c.Id;
    setEditingId(c.id);
    setCustomer({
      Id: id,
      Nombre: c.nombre ?? c.Nombre ?? "",
      Dni: c.dni ?? c.Dni ?? "",
      Telefono: c.telefono ?? c.Telefono ?? "",
      Email: c.email ?? c.Email ?? "",
      Direccion: c.direccion ?? c.Direccion ?? "",
      Matricula: c.matricula ?? c.Matricula ?? "",
      Marca: c.marca ?? c.Marca ?? "",
      Modelo: c.modelo ?? c.Modelo ?? "",
      Anio: c.anio ?? c.Anio ?? "",
      Kilometraje:
        (c.kilometraje ?? c.Kilometraje)
          ? String(c.kilometraje ?? c.Kilometraje)
          : "",
      Observaciones: c.observaciones ?? c.Observaciones ?? "",
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Registro de cliente
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {labels.customerPageSubtitle}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                DNI/NIE
              </label>

              <input
                type="text"
                name="Dni"
                value={customer.Dni}
                onChange={handleChange}
                className={cls("Dni")}
                placeholder="DNI/NIE"
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
            {labels.assetHeader}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {labels.referenceLabel} *
              </label>

              <input
                type="text"
                name="Matricula"
                value={customer.Matricula}
                onChange={handleChange}
                className={cls("Matricula")}
                placeholder={labels.kind === "service" ? "CH-AC-001" : "1234ABC"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {labels.makeLabel}
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
                {labels.modelLabel} *
              </label>

              <input
                type="text"
                name="Modelo"
                value={customer.Modelo}
                onChange={handleChange}
                className={cls("Modelo")}
                placeholder={labels.kind === "service" ? "Split, termo, caldera..." : "Corolla"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {labels.metricLabel}
              </label>

              <input
                type="number"
                name="Kilometraje"
                value={customer.Kilometraje}
                onChange={handleChange}
                className={cls("Kilometraje")}
                placeholder={labels.kind === "service" ? "4" : "120000"}
              />
            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={submitting} className={workOrderBtn}>
            {submitting
              ? "Guardando..."
              : editingId
                ? "Actualizar cliente"
                : "Registrar cliente"}
          </button>

          <button
            type="button"
            onClick={() => {
              setCustomer(EMPTY_CUSTOMER);
              setEditingId(null);
            }}
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
                <th className="text-left py-3">DNI/NIE</th>
                <th className="text-left py-3">Teléfono</th>
                <th className="text-left py-3">{labels.referenceLabel}</th>
                <th className="text-left py-3">{labels.modelLabel}</th>
                <th className="text-left py-3">{labels.metricLabel}</th>
                <th className="text-left py-3"></th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c) => {
                const id = c.id ?? c.Id;
                const nombre = c.nombre ?? c.Nombre;
                const dni = c.dni ?? c.Dni;
                const telefono = c.telefono ?? c.Telefono;
                const matricula = c.matricula ?? c.Matricula;
                const modelo = c.modelo ?? c.Modelo;
                const kilometraje = c.kilometraje ?? c.Kilometraje;

                return (
                  <tr
                    key={id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3">{nombre}</td>
                    <td className="py-3">{dni}</td>
                    <td className="py-3">{telefono}</td>
                    <td className="py-3">{matricula}</td>
                    <td className="py-3">{modelo}</td>
                    <td className="py-3">{kilometraje}</td>

                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => startEditCustomer(c)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-sky-600 text-white hover:bg-sky-700"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteModal({
                              open: true,
                              customer: {
                                id,
                                nombre,
                              },
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINADO */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200">
            Anterior
          </button>

          <button className="rounded-lg px-3 py-1.5 bg-slate-700 text-white">
            1
          </button>

          <button className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200">
            Siguiente
          </button>
        </div>
      </div>
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Eliminar cliente
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              ¿Seguro que deseas eliminar a{" "}
              <span className="font-semibold text-slate-900">
                {deleteModal.customer?.nombre ??
                  deleteModal.customer?.Nombre ??
                  "este cliente"}
              </span>
              ?
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Esta acción ocultará el cliente del sistema, pero no borrará
              físicamente el registro de la base de datos.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    customer: null,
                  })
                }
                className="rounded-xl px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteCustomer}
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
