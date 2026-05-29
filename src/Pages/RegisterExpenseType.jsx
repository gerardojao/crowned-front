import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../Components/api";

const EMPTY_EGRESO = {
  Id: "",
  Nombre: "",
};

export default function RegisterExpenseType() {
  const [egreso, setEgreso] = useState(EMPTY_EGRESO);
  const [egresos, setEgresos] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    item: null,
  });

  const [deleting, setDeleting] = useState(false);

  const confirmDeleteEgreso = async () => {
    if (!deleteModal.item) return;

    try {
      setDeleting(true);

      await api.delete(`/Egreso/${deleteModal.item.Id}`);

      setNotice({
        type: "success",
        text: "Tipo de gasto eliminado correctamente.",
      });

      setDeleteModal({
        open: false,
        item: null,
      });

      await loadEgresos();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo eliminar el tipo de gasto.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const loadEgresos = async () => {
    try {
      setError("");

      const res = await api.get("/Egreso");
      const data = res?.data?.data || [];

      setEgresos(
        data.map((x) => ({
          Id: x.id ?? x.Id,
          Nombre: x.nombre ?? x.Nombre,
        })),
      );
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los egresos.");
    }
  };

  useEffect(() => {
    loadEgresos();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (!egreso.Nombre.trim()) {
      setError("El nombre del egreso es requerido.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setNotice(null);

      const payload = {
        nombre: egreso.Nombre.trim(),
      };

      if (editingId) {
        await api.put(`/Egreso/${editingId}`, payload);

        setNotice({
          type: "success",
          text: "Egreso actualizado correctamente.",
        });
      } else {
        await api.post("/Egreso", payload);

        setNotice({
          type: "success",
          text: "Egreso registrado correctamente.",
        });
      }

      setEgreso(EMPTY_EGRESO);
      setEditingId(null);

      await loadEgresos();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar el egreso.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.Id);

    setEgreso({
      Id: item.Id,
      Nombre: item.Nombre || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteEgreso = async (item) => {
    const ok = window.confirm(`¿Eliminar el tipo de gasto "${item.Nombre}"?`);

    if (!ok) return;

    try {
      await api.delete(`/Egreso/${item.Id}`);

      setNotice({
        type: "success",
        text: "Tipo de gasto eliminado correctamente.",
      });

      await loadEgresos();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo eliminar el tipo de gasto.",
      );
    }
  };

  const clearForm = () => {
    setEgreso(EMPTY_EGRESO);
    setEditingId(null);
    setError("");
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-2 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Egresos</h2>

          <p className="text-sm text-slate-500 mt-1">
            Crea, actualiza o eliminalas cuentas/categorías de gastos del
            taller.
          </p>
        </div>

        <Link
          to="/statement"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-700 text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 p-3 text-sm">
          {notice.text}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 p-3 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5 space-y-5"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingId ? "Actualizar egreso" : "Nuevo egreso"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
            <input
              type="text"
              value={egreso.Nombre}
              onChange={(e) =>
                setEgreso((prev) => ({
                  ...prev,
                  Nombre: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="Ejemplo: Repuestos, alquiler, herramientas..."
            />

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm font-semibold disabled:opacity-60"
            >
              {submitting
                ? "Guardando..."
                : editingId
                  ? "Actualizar"
                  : "Registrar"}
            </button>

            <button
              type="button"
              onClick={clearForm}
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
            >
              Limpiar
            </button>
          </div>
        </div>
      </form>

      <section className="mt-8 rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-4 md:p-5">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Egresos registrados
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-center text-lg py-3 px-4">Cuenta / Categoría</th>
                <th className="text-center py-3 px-4 w-40"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {egresos.map((item) => (
                <tr key={item.Id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {item.Nombre}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-5">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="text-sky-600 hover:underline font-medium"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            item,
                          })
                        }
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {egresos.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-slate-500">
                    No hay egresos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Eliminar tipo de gasto
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              ¿Seguro que deseas eliminar{" "}
              <span className="font-semibold text-slate-900">
                {deleteModal.item?.Nombre}
              </span>
              ?
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Solo se podrá eliminar si no tiene movimientos registrados.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    item: null,
                  })
                }
                className="rounded-xl px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteEgreso}
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
