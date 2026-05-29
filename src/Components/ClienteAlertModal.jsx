import React, { useEffect, useState } from "react";
import api from "./api";

export default function ClientAlertModal() {
  const [alertas, setAlertas] = useState([]);
  const [current, setCurrent] = useState(null);

  const loadAlertas = async () => {
    try {
      const res = await api.get("/AlertaCliente/pendientes");
      console.log("alertas pendientes:", res.data);
      const list = res?.data?.data?.[0] || [];

      setAlertas(list);

      if (list.length > 0) {
        setCurrent(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAlertas();

    const interval = setInterval(() => {
      loadAlertas();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const marcarAtendida = async () => {
    if (!current) return;

    try {
      await api.put(`/AlertaCliente/${current.id ?? current.Id}/atendida`);

      const next = alertas.filter(
        (x) => (x.id ?? x.Id) !== (current.id ?? current.Id),
      );

      setAlertas(next);
      setCurrent(next[0] || null);
    } catch (err) {
      console.error(err);
    }
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-4 ring-orange-300 animate-pulse">
        <h3 className="text-2xl font-extrabold text-orange-700">
          Alarma de cliente
        </h3>

        <p className="mt-4 text-lg font-semibold text-slate-900">
          {current.mensaje ?? current.Mensaje}
        </p>

        <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm text-orange-800 ring-1 ring-orange-200">
          <p>
            Cliente:{" "}
            <span className="font-bold">
              {current.cliente ?? current.Cliente}
            </span>
          </p>
          <p>
            Teléfono:{" "}
            <span className="font-bold">
              {current.telefono ?? current.Telefono ?? "Sin teléfono"}
            </span>
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={marcarAtendida}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
          >
            Marcar como atendida
          </button>
        </div>
      </div>
    </div>
  );
}