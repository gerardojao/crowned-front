import React, { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle2, Phone, X } from "lucide-react";
import api from "./api";

export default function ClientAlertModal() {
  const [alertas, setAlertas] = useState([]);
  const [current, setCurrent] = useState(null);
  const [dismissedAlertId, setDismissedAlertId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [done, setDone] = useState(null);

  const publishCount = useCallback((list) => {
    window.dispatchEvent(
      new CustomEvent("tc:client-alerts", {
        detail: { count: list.length, alerts: list },
      }),
    );
  }, []);

  const loadAlertas = useCallback(async () => {
    try {
      const res = await api.get("/AlertaCliente/pendientes");
      const list = res?.data?.data?.[0] || [];

      setAlertas(list);
      publishCount(list);
      setCurrent((prev) => {
        if (prev && list.some((x) => (x.id ?? x.Id) === (prev.id ?? prev.Id))) {
          return prev;
        }
        return list[0] || null;
      });
    } catch (err) {
      console.error(err);
    }
  }, [publishCount]);

  useEffect(() => {
    loadAlertas();
    const interval = setInterval(loadAlertas, 30000);
    return () => clearInterval(interval);
  }, [loadAlertas]);

  useEffect(() => {
    const refresh = () => loadAlertas();
    const onMessage = (event) => {
      if (event?.data?.type === "tc:invoice-issued") {
        refresh();
      }
    };
    const onStorage = (event) => {
      if (event.key === "tc:invoice-issued") {
        refresh();
      }
    };

    window.addEventListener("tc:client-alerts:refresh", refresh);
    window.addEventListener("tc:workshop-changed", refresh);
    window.addEventListener("tc:invoice-issued", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("tc:client-alerts:refresh", refresh);
      window.removeEventListener("tc:workshop-changed", refresh);
      window.removeEventListener("tc:invoice-issued", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadAlertas]);

  useEffect(() => {
    const onOpen = () => {
      setPanelOpen(true);
      const active = current || alertas[0] || null;
      if (active) setDismissedAlertId(active.id ?? active.Id);
      setCurrent((prev) => prev || alertas[0] || null);
    };
    window.addEventListener("tc:client-alerts:open", onOpen);
    return () => window.removeEventListener("tc:client-alerts:open", onOpen);
  }, [alertas, current]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(null), 4500);
    return () => clearTimeout(timer);
  }, [done]);

  const marcarAtendida = async (alerta = current) => {
    if (!alerta) return;

    try {
      const id = alerta.id ?? alerta.Id;
      await api.put(`/AlertaCliente/${id}/atendida`);

      const next = alertas.filter(
        (x) => (x.id ?? x.Id) !== id,
      );

      setAlertas(next);
      publishCount(next);
      setDone(alerta);
      setCurrent(next[0] || null);
      setDismissedAlertId(null);
      if (next.length === 0) setPanelOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!current && !done) return null;

  const activeMessage = current?.mensaje ?? current?.Mensaje;
  const activeClient = current?.cliente ?? current?.Cliente;
  const activePhone = current?.telefono ?? current?.Telefono ?? "Sin telefono";
  const activeId = current?.id ?? current?.Id;
  const doneClient = done?.cliente ?? done?.Cliente;

  return (
    <>
      {done && (
        <div className="fixed left-1/2 top-24 z-[10000] w-[min(calc(100vw-2rem),760px)] -translate-x-1/2 rounded-2xl bg-emerald-50 p-4 text-emerald-800 shadow-lg ring-1 ring-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Alerta atendida</p>
              <p className="mt-0.5 text-sm">
                Se registro la llamada pendiente de {doneClient || "cliente"}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDone(null)}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
              aria-label="Cerrar confirmacion"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {panelOpen && (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center bg-black/35 px-4 pt-24">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Bell size={22} />
                  {alertas.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                      {alertas.length > 99 ? "99+" : alertas.length}
                    </span>
                  )}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Notificaciones pendientes
                  </h3>
                  <p className="text-sm text-slate-500">
                    Llamadas a clientes por revisar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Cerrar notificaciones"
              >
                <X size={20} />
              </button>
            </div>

            {alertas.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                No hay notificaciones pendientes.
              </div>
            ) : (
              <div className="max-h-[60vh] space-y-3 overflow-auto pr-1">
                {alertas.map((alerta) => {
                  const id = alerta.id ?? alerta.Id;
                  const cliente = alerta.cliente ?? alerta.Cliente;
                  const telefono = alerta.telefono ?? alerta.Telefono ?? "Sin telefono";
                  const mensaje = alerta.mensaje ?? alerta.Mensaje;

                  return (
                    <div
                      key={id}
                      className="rounded-xl border border-orange-200 bg-orange-50 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {mensaje}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-orange-900">
                          <span>
                            Cliente: <strong>{cliente}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-bold">
                            <Phone size={14} />
                            {telefono}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => marcarAtendida(alerta)}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                        >
                          Aceptar llamada realizada
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {current && activeId !== dismissedAlertId && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/40 px-4 pt-24">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl ring-4 ring-orange-300 animate-pulse">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <Bell size={28} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-extrabold text-orange-700">
                      Alarma de cliente
                    </h3>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      {activeMessage}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedAlertId(activeId)}
                    className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Cerrar alerta"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-orange-50 p-4 text-sm text-orange-900 ring-1 ring-orange-200">
                  <span>
                    Cliente: <strong>{activeClient}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-bold">
                    <Phone size={15} />
                    {activePhone}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDismissedAlertId(activeId)}
                    className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
