import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp  } from "lucide-react";
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
  CodigoPostal: "",
  Poblacion: "",
  Provincia: "",
  Clasificacion: "Particular",

  // coche
  Matricula: "",
  Bastidor: "",
  Marca: "",
  Modelo: "",
  Anio: "",
  FechaMatriculacion: "",
  Motor: "",
  Kw: "",
  Cv: "",
  Combustible: "",
  Kilometraje: "",

  // Extra
  Observaciones: "",
};

const EMPTY_VEHICLE = {
  Id: "",
  Matricula: "",
  Bastidor: "",
  Marca: "",
  Modelo: "",
  FechaMatriculacion: "",
  Motor: "",
  Kw: "",
  Cv: "",
  Combustible: "",
  Kilometraje: "",
  UltimaVisita: "",
  ProximaItv: "",
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
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  
  const [showVehicleExtra, setShowVehicleExtra] = useState(false);
  const [vehicleModal, setVehicleModal] = useState({
    open: false,
    mode: "create",
    form: EMPTY_VEHICLE,
    saving: false,
  });

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

  const loadVehicles = async (clienteId) => {
    if (!clienteId) {
      setVehicles([]);
      return;
    }

    try {
      setVehiclesLoading(true);
      const res = await api.get(`/Vehiculo/cliente/${clienteId}`);
      setVehicles(res?.data?.data?.[0] || []);
    } catch (err) {
      console.error(err);
      setVehicles([]);
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudieron cargar los vehiculos del cliente.",
      });
    } finally {
      setVehiclesLoading(false);
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
        codigoPostal: customer.CodigoPostal || null,
        poblacion: customer.Poblacion || null,
        provincia: customer.Provincia || null,
        clasificacion: customer.Clasificacion || "Particular",
        matricula: customer.Matricula,
        bastidor: customer.Bastidor || null,
        marca: customer.Marca || null,
        modelo: customer.Modelo,
        anio: customer.Anio ? Number(customer.Anio) : null,
        fechaMatriculacion: customer.FechaMatriculacion || null,
        motor: customer.Motor || null,
        kw: customer.Kw ? Number(customer.Kw) : null,
        cv: customer.Cv ? Number(customer.Cv) : null,
        combustible: customer.Combustible || null,
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
      setVehicles([]);
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
    setEditingId(id);
    setCustomer({
      Id: id,
      Nombre: c.nombre ?? c.Nombre ?? "",
      Dni: c.dni ?? c.Dni ?? "",
      Telefono: c.telefono ?? c.Telefono ?? "",
      Email: c.email ?? c.Email ?? "",
      Direccion: c.direccion ?? c.Direccion ?? "",
      CodigoPostal: c.codigoPostal ?? c.CodigoPostal ?? "",
      Poblacion: c.poblacion ?? c.Poblacion ?? "",
      Provincia: c.provincia ?? c.Provincia ?? "",
      Clasificacion: c.clasificacion ?? c.Clasificacion ?? "Particular",
      Matricula: c.matricula ?? c.Matricula ?? "",
      Bastidor: c.bastidor ?? c.Bastidor ?? "",
      Marca: c.marca ?? c.Marca ?? "",
      Modelo: c.modelo ?? c.Modelo ?? "",
      Anio: c.anio ?? c.Anio ?? "",
      FechaMatriculacion: String(
        c.fechaMatriculacion ?? c.FechaMatriculacion ?? "",
      ).slice(0, 10),
      Motor: c.motor ?? c.Motor ?? "",
      Kw: c.kw ?? c.Kw ?? "",
      Cv: c.cv ?? c.Cv ?? "",
      Combustible: c.combustible ?? c.Combustible ?? "",
      Kilometraje:
        (c.kilometraje ?? c.Kilometraje)
          ? String(c.kilometraje ?? c.Kilometraje)
          : "",
      Observaciones: c.observaciones ?? c.Observaciones ?? "",
    });
    loadVehicles(id);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openVehicleCreate = () => {
    setVehicleModal({
      open: true,
      mode: "create",
      form: EMPTY_VEHICLE,
      saving: false,
    });
  };

  const openVehicleEdit = (vehicle) => {
    setVehicleModal({
      open: true,
      mode: "edit",
      form: {
        Id: vehicle.id ?? vehicle.Id ?? "",
        Matricula: vehicle.matricula ?? vehicle.Matricula ?? "",
        Bastidor: vehicle.bastidor ?? vehicle.Bastidor ?? "",
        Marca: vehicle.marca ?? vehicle.Marca ?? "",
        Modelo: vehicle.modelo ?? vehicle.Modelo ?? "",
        FechaMatriculacion: String(
          vehicle.fechaMatriculacion ?? vehicle.FechaMatriculacion ?? "",
        ).slice(0, 10),
        Motor: vehicle.motor ?? vehicle.Motor ?? "",
        Kw: vehicle.kw ?? vehicle.Kw ?? "",
        Cv: vehicle.cv ?? vehicle.Cv ?? "",
        Combustible: vehicle.combustible ?? vehicle.Combustible ?? "",
        Kilometraje:
          (vehicle.kilometraje ?? vehicle.Kilometraje)
            ? String(vehicle.kilometraje ?? vehicle.Kilometraje)
            : "",
        UltimaVisita: String(
          vehicle.ultimaVisita ?? vehicle.UltimaVisita ?? "",
        ).slice(0, 10),
        ProximaItv: String(
          vehicle.proximaItv ?? vehicle.ProximaItv ?? "",
        ).slice(0, 10),
        Observaciones: vehicle.observaciones ?? vehicle.Observaciones ?? "",
      },
      saving: false,
    });
  };

  const closeVehicleModal = () => {
    if (vehicleModal.saving) return;
    setVehicleModal({
      open: false,
      mode: "create",
      form: EMPTY_VEHICLE,
      saving: false,
    });
  };

  const setVehicleField = (name, value) => {
    setVehicleModal((current) => ({
      ...current,
      form: {
        ...current.form,
        [name]: value,
      },
    }));
  };

  const saveVehicle = async () => {
    if (!editingId || vehicleModal.saving) return;
    const form = vehicleModal.form;

    if (
      !String(form.Matricula || "").trim() ||
      !String(form.Modelo || "").trim()
    ) {
      setNotice({
        type: "error",
        text: "La matricula y el modelo del vehiculo son requeridos.",
      });
      return;
    }

    const payload = {
      matricula: form.Matricula,
      marca: form.Marca || null,
      modelo: form.Modelo,
      bastidor: form.Bastidor || null,
      motor: form.Motor || null,
      kw: form.Kw ? Number(form.Kw) : null,
      cv: form.Cv ? Number(form.Cv) : null,
      combustible: form.Combustible || null,
      kilometraje: form.Kilometraje ? Number(form.Kilometraje) : null,
      fechaMatriculacion: form.FechaMatriculacion || null,
      ultimaVisita: form.UltimaVisita || null,
      proximaItv: form.ProximaItv || null,
      observaciones: form.Observaciones || null,
    };

    try {
      setVehicleModal((current) => ({ ...current, saving: true }));
      if (vehicleModal.mode === "edit") {
        await api.put(`/Vehiculo/${form.Id}`, payload);
      } else {
        await api.post(`/Vehiculo/cliente/${editingId}`, payload);
      }

      await loadVehicles(editingId);
      setVehicleModal({
        open: false,
        mode: "create",
        form: EMPTY_VEHICLE,
        saving: false,
      });
      setNotice({
        type: "success",
        text:
          vehicleModal.mode === "edit"
            ? "Vehiculo actualizado correctamente."
            : "Vehiculo agregado correctamente.",
      });
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar el vehiculo.",
      });
      setVehicleModal((current) => ({ ...current, saving: false }));
    }
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dirección
              </label>

              <input
                type="text"
                name="Direccion"
                value={customer.Direccion}
                onChange={handleChange}
                className={cls("Direccion")}
                placeholder="Dirección del cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Codigo postal
              </label>
              <input
                type="text"
                name="CodigoPostal"
                value={customer.CodigoPostal}
                onChange={handleChange}
                className={cls("CodigoPostal")}
                placeholder="46001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Poblacion
              </label>
              <input
                type="text"
                name="Poblacion"
                value={customer.Poblacion}
                onChange={handleChange}
                className={cls("Poblacion")}
                placeholder="Valencia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Provincia
              </label>
              <input
                type="text"
                name="Provincia"
                value={customer.Provincia}
                onChange={handleChange}
                className={cls("Provincia")}
                placeholder="Valencia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Clasificacion
              </label>
              <select
                name="Clasificacion"
                value={customer.Clasificacion}
                onChange={handleChange}
                className={cls("Clasificacion")}
              >
                <option value="Particular">Particular</option>
                <option value="Empresa">Empresa</option>
                <option value="Compania de seguro">Compania de seguro</option>
              </select>
            </div>
          </div>
        </div>

        {/* coche */}
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
                placeholder={
                  labels.kind === "service" ? "CH-AC-001" : "1234ABC"
                }
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
                Bastidor
              </label>
              <input
                type="text"
                name="Bastidor"
                value={customer.Bastidor}
                onChange={handleChange}
                className={cls("Bastidor")}
                placeholder="VF1..."
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
                placeholder={
                  labels.kind === "service"
                    ? "Split, termo, caldera..."
                    : "Corolla"
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha matriculacion
              </label>
              <input
                type="date"
                name="FechaMatriculacion"
                value={customer.FechaMatriculacion}
                onChange={handleChange}
                className={cls("FechaMatriculacion")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Motor
              </label>
              <input
                type="text"
                name="Motor"
                value={customer.Motor}
                onChange={handleChange}
                className={cls("Motor")}
                placeholder="1.6 TDI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                KW
              </label>
              <input
                type="number"
                step="0.01"
                name="Kw"
                value={customer.Kw}
                onChange={handleChange}
                className={cls("Kw")}
                placeholder="85"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CV
              </label>
              <input
                type="number"
                step="0.01"
                name="Cv"
                value={customer.Cv}
                onChange={handleChange}
                className={cls("Cv")}
                placeholder="115"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Combustible
              </label>
              <input
                type="text"
                name="Combustible"
                value={customer.Combustible}
                onChange={handleChange}
                className={cls("Combustible")}
                placeholder="Gasolina, diesel, hibrido..."
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
              setVehicles([]);
            }}
            className="inline-flex items-center rounded-xl px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
          >
            Limpiar
          </button>
        </div>
      </form>

      {editingId && (
        <section className="mt-6 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Vehiculos del cliente
              </h3>
              <p className="text-sm text-slate-500">
                Agrega o edita coches asociados a este cliente.
              </p>
            </div>
            <button
              type="button"
              onClick={openVehicleCreate}
              className="inline-flex items-center rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
            >
              Agregar vehiculo
            </button>
          </div>

          {vehiclesLoading ? (
            <p className="text-sm text-slate-500">Cargando vehiculos...</p>
          ) : vehicles.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
              Este cliente no tiene vehiculos asociados todavia.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-3 text-left">Matricula</th>
                    <th className="py-3 text-left">Marca</th>
                    <th className="py-3 text-left">Modelo</th>
                    <th className="py-3 text-left">Bastidor</th>
                    <th className="py-3 text-left">{labels.metricLabel}</th>
                    <th className="py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => {
                    const id = vehicle.id ?? vehicle.Id;
                    return (
                      <tr
                        key={id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-3 font-semibold text-slate-900">
                          {vehicle.matricula ?? vehicle.Matricula}
                        </td>
                        <td className="py-3">
                          {vehicle.marca ?? vehicle.Marca ?? "-"}
                        </td>
                        <td className="py-3">
                          {vehicle.modelo ?? vehicle.Modelo ?? "-"}
                        </td>
                        <td className="py-3">
                          {vehicle.bastidor ?? vehicle.Bastidor ?? "-"}
                        </td>
                        <td className="py-3">
                          {vehicle.kilometraje ?? vehicle.Kilometraje ?? "-"}
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => openVehicleEdit(vehicle)}
                            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-white hover:bg-sky-700"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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

      {vehicleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {vehicleModal.mode === "edit"
                    ? "Editar coche"
                    : "Agregar coche"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Este coche quedará asociado al cliente seleccionado.
                </p>
              </div>

              <button
                type="button"
                onClick={closeVehicleModal}
                disabled={vehicleModal.saving}
                className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                Cerrar
              </button>
            </div>

            {/* <div className="space-y-6 px-6 py-5">
              <section className="rounded-2xl border border-slate-200 p-5">
                <h4 className="mb-5 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Datos principales
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <VehicleInput
                    label={`${labels.referenceLabel} *`}
                    value={vehicleModal.form.Matricula}
                    onChange={(v) => setVehicleField("Matricula", v)}
                    placeholder="1234 ABC"
                  />

                                    <VehicleInput
                    label="Marca *"
                    value={vehicleModal.form.Marca}
                    onChange={(v) => setVehicleField("Marca", v)}
                    placeholder="Toyota"
                    required
                  />

                  <VehicleInput
                    label={`${labels.modelLabel} *`}
                    value={vehicleModal.form.Modelo}
                    onChange={(v) => setVehicleField("Modelo", v)}
                    placeholder="Corolla"
                    required
                  />



                  <VehicleInput
                    label="Bastidor"
                    value={vehicleModal.form.Bastidor}
                    onChange={(v) => setVehicleField("Bastidor", v)}
                    placeholder="VF1..."
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <h4 className="mb-5 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Datos técnicos
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <VehicleInput
                    label="Motor"
                    value={vehicleModal.form.Motor}
                    onChange={(v) => setVehicleField("Motor", v)}
                    placeholder="1.6 TDI"
                  />

                  <VehicleInput
                    label="Combustible"
                    value={vehicleModal.form.Combustible}
                    onChange={(v) => setVehicleField("Combustible", v)}
                    placeholder="Diésel"
                  />

                  <VehicleInput
                    type="number"
                    label="Kilometraje"
                    value={vehicleModal.form.Kilometraje}
                    onChange={(v) => setVehicleField("Kilometraje", v)}
                    placeholder="120000"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <VehicleInput
                      type="number"
                      step="0.01"
                      label="KW"
                      value={vehicleModal.form.Kw}
                      onChange={(v) => setVehicleField("Kw", v)}
                    />

                    <VehicleInput
                      type="number"
                      step="0.01"
                      label="CV"
                      value={vehicleModal.form.Cv}
                      onChange={(v) => setVehicleField("Cv", v)}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <h4 className="mb-5 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Fechas y seguimiento
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <VehicleInput
                    type="date"
                    label="Fecha matriculación"
                    value={vehicleModal.form.FechaMatriculacion}
                    onChange={(v) => setVehicleField("FechaMatriculacion", v)}
                  />

                  <VehicleInput
                    type="date"
                    label="Última visita"
                    value={vehicleModal.form.UltimaVisita}
                    onChange={(v) => setVehicleField("UltimaVisita", v)}
                  />

                  <VehicleInput
                    type="date"
                    label="Próxima ITV"
                    value={vehicleModal.form.ProximaItv}
                    onChange={(v) => setVehicleField("ProximaItv", v)}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Observaciones
                  </span>

                  <textarea
                    rows={3}
                    value={vehicleModal.form.Observaciones}
                    onChange={(e) =>
                      setVehicleField("Observaciones", e.target.value)
                    }
                    placeholder="Notas internas del vehículo..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </section>
            </div> */}

            <div className="space-y-5 px-6 py-5">
  <section className="rounded-2xl border border-slate-200 p-5">
    <h4 className="mb-5 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
      Datos básicos
    </h4>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <VehicleInput
        label={`${labels.referenceLabel} *`}
        value={vehicleModal.form.Matricula}
        onChange={(v) => setVehicleField("Matricula", v)}
        placeholder="1234 ABC"
      />

      <VehicleInput
        label={labels.makeLabel}
        value={vehicleModal.form.Marca}
        onChange={(v) => setVehicleField("Marca", v)}
        placeholder="Toyota"
      />

      <VehicleInput
        label={`${labels.modelLabel} *`}
        value={vehicleModal.form.Modelo}
        onChange={(v) => setVehicleField("Modelo", v)}
        placeholder="Corolla"
      />

      <VehicleInput
        type="number"
        label="Kilometraje"
        value={vehicleModal.form.Kilometraje}
        onChange={(v) => setVehicleField("Kilometraje", v)}
        placeholder="120000"
      />

      <VehicleInput
        label="Motor"
        value={vehicleModal.form.Motor}
        onChange={(v) => setVehicleField("Motor", v)}
        placeholder="1.6 TDI"
      />

      <VehicleInput
        label="Combustible"
        value={vehicleModal.form.Combustible}
        onChange={(v) => setVehicleField("Combustible", v)}
        placeholder="Diésel"
      />
    </div>
  </section>

  <section className="rounded-2xl border border-slate-200 p-5">
    <button
      type="button"
      onClick={() => setShowVehicleExtra((prev) => !prev)}
      className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
    >
      <span>
        {showVehicleExtra
          ? "Ocultar información adicional"
          : "Más información opcional"}
      </span>

      {showVehicleExtra ? (
        <ChevronUp size={18} />
      ) : (
        <ChevronDown size={18} />
      )}
    </button>

    {showVehicleExtra && (
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <VehicleInput
          label="Bastidor"
          value={vehicleModal.form.Bastidor}
          onChange={(v) => setVehicleField("Bastidor", v)}
          placeholder="VF1..."
        />

        <div className="grid grid-cols-2 gap-4">
          <VehicleInput
            type="number"
            step="0.01"
            label="KW"
            value={vehicleModal.form.Kw}
            onChange={(v) => setVehicleField("Kw", v)}
          />

          <VehicleInput
            type="number"
            step="0.01"
            label="CV"
            value={vehicleModal.form.Cv}
            onChange={(v) => setVehicleField("Cv", v)}
          />
        </div>

        <VehicleInput
          type="date"
          label="Fecha matriculación"
          value={vehicleModal.form.FechaMatriculacion}
          onChange={(v) => setVehicleField("FechaMatriculacion", v)}
        />

        <VehicleInput
          type="date"
          label="Última visita"
          value={vehicleModal.form.UltimaVisita}
          onChange={(v) => setVehicleField("UltimaVisita", v)}
        />

        <VehicleInput
          type="date"
          label="Próxima ITV"
          value={vehicleModal.form.ProximaItv}
          onChange={(v) => setVehicleField("ProximaItv", v)}
        />
      </div>
    )}
  </section>

  <section className="rounded-2xl border border-slate-200 p-5">
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        Observaciones
      </span>

      <textarea
        rows={3}
        value={vehicleModal.form.Observaciones}
        onChange={(e) => setVehicleField("Observaciones", e.target.value)}
        placeholder="Notas internas del vehículo..."
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  </section>
</div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                disabled={vehicleModal.saving}
                onClick={closeVehicleModal}
                className="rounded-xl bg-white px-5 py-2.5 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={vehicleModal.saving}
                onClick={saveVehicle}
                className="rounded-xl bg-slate-800 px-5 py-2.5 font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
              >
                {vehicleModal.saving ? "Guardando..." : "Guardar coche"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function VehicleInput({
  label,
  value,
  onChange,
  type = "text",
  step,
  placeholder = "",
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}
