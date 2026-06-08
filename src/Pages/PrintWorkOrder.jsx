import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../Components/api";

export default function PrintWorkOrder() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [workshopName, setWorkshopName] = useState("Multiservicios Crower");

  useEffect(() => {
    loadWorkshopSettings();
    loadOrder();
  }, []);

  const loadWorkshopSettings = async () => {
    try {
      const res = await api.get("/WorkshopSettings");
      setWorkshopName(res?.data?.nombre ?? res?.data?.Nombre ?? "Multiservicios Crower");
    } catch {
      setWorkshopName("Multiservicios Crower");
    }
  };

  const loadOrder = async () => {
    try {
      const res = await api.get(`/OrdenTrabajo/${id}`);

      const data = res?.data?.data?.[0];

      setOrder(data);

      setTimeout(() => {
        window.print();
      }, 500);
    } catch (err) {
      console.error(err);
    }
  };

  if (!order) {
    return (
      <div className="p-10 text-center text-slate-500">Cargando orden...</div>
    );
  }

  return (
    <div className="bg-white text-black print-page">
      <div className="max-w-2xl mx-auto border border-black p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{workshopName}</h1>

          <p className="text-lg mt-2">Orden #{order.id || order.Id}</p>
        </div>

        <div className="space-y-5">

          <div>
            <p className="font-bold">Vehiculo</p>
            <p>
              {order.marca || order.Marca} {order.modelo || order.Modelo}
            </p>
          </div>

          <div className="text-center border-2 border-black py-4 px-6">
            <p className="text-sm font-bold uppercase tracking-widest">
              Matricula
            </p>

            <p className="text-2xl font-extrabold tracking-wider mt-2">
              {order.matricula || order.Matricula}
            </p>
          </div>

          <div className="border-2 border-black p-5">
            <p className="text-sm font-bold uppercase tracking-widest mb-3">
              Trabajo a realizar
            </p>

            <p className="text-2xl font-bold leading-relaxed text-center">
              {order.trabajo || order.Trabajo}
            </p>
          </div>

          <div>
            <p className="font-bold">Estado</p>
            <p>{order.estado || order.Estado}</p>
          </div>

          <div>
            <p className="font-bold">Fecha</p>
            <p>
              {new Date(order.fecha || order.Fecha).toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

