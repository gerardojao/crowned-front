import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PackageSearch } from "lucide-react";
import api from "./api";

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function getPartValue(part, field, fallback = "") {
  const pascalField = field.charAt(0).toUpperCase() + field.slice(1);
  return part?.[field] ?? part?.[pascalField] ?? fallback;
}

export function getPartDisplayName(part) {
  const name = getPartValue(part, "nombre");
  const brand = getPartValue(part, "marca");
  const ref = getPartValue(part, "codigoReferencia");

  return [name, brand, ref ? `Ref. ${ref}` : ""].filter(Boolean).join(" - ");
}

export function getPartSalePrice(part) {
  return Number(getPartValue(part, "precioVenta", 0) || 0);
}

export default function PartPicker({
  onSelect,
  placeholder = "Buscar repuesto",
  buttonLabel = "Usar repuesto",
  className = "",
  allowCreate = true,
}) {
  const [query, setQuery] = useState("");
  const [parts, setParts] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [providers, setProviders] = useState([]);
  const [createError, setCreateError] = useState("");
  const [newPart, setNewPart] = useState({
    nombre: "",
    precioVenta: "",
    precioCompra: "",
    marca: "",
    codigoReferencia: "",
    idProveedor: "",
  });
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState(null);

  const trimmedQuery = query.trim();

  const updatePanelPosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const gap = 6;
    const margin = 12;
    const spaceBelow = viewportHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const below = spaceBelow >= 240 || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(240, Math.min(560, below ? spaceBelow : spaceAbove));
    const width = Math.min(Math.max(rect.width, 320), viewportWidth - margin * 2);
    const left = Math.min(
      Math.max(rect.left, margin),
      Math.max(margin, viewportWidth - width - margin),
    );
    const top = below
      ? Math.min(rect.bottom + gap, viewportHeight - maxHeight - margin)
      : Math.max(margin, rect.top - gap - maxHeight);

    setPanelStyle({
      position: "fixed",
      left,
      top,
      width,
      maxHeight,
      zIndex: 100000,
    });
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (
        !wrapperRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    updatePanelPosition();
    const onPageScroll = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", onPageScroll, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", onPageScroll, true);
    };
  }, [open, createOpen, parts.length, updatePanelPosition]);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/RepuestoStock", {
          params: {
            search: trimmedQuery || undefined,
            page: 1,
            pageSize: 8,
          },
        });

        if (!alive) return;
        const list = res?.data?.data?.[0]?.items || [];
        setParts(list);
      } catch (err) {
        if (alive) setParts([]);
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    }, trimmedQuery ? 250 : 0);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [trimmedQuery]);

  useEffect(() => {
    if (!createOpen) return;

    let alive = true;
    api
      .get("/Proveedor", { params: { page: 1, pageSize: 100 } })
      .then((res) => {
        if (!alive) return;
        const list = res?.data?.data?.[0]?.items || [];
        setProviders(list);
        setNewPart((prev) => ({
          ...prev,
          idProveedor: prev.idProveedor || String(list[0]?.id ?? list[0]?.Id ?? ""),
          nombre: prev.nombre || query,
        }));
      })
      .catch((err) => {
        console.error(err);
        if (alive) setProviders([]);
      });

    return () => {
      alive = false;
    };
  }, [createOpen, query]);

  const helperText = useMemo(() => {
    if (loading) return "Buscando repuestos...";
    if (!parts.length) return "No hay repuestos para mostrar.";
    return "Selecciona un repuesto para traer su precio de venta.";
  }, [loading, parts.length]);

  const selectPart = (part) => {
    onSelect?.(part);
    setQuery("");
    setOpen(false);
  };

  const setNewPartField = (field, value) => {
    setNewPart((prev) => ({ ...prev, [field]: value }));
  };

  const ensureProvider = async () => {
    if (newPart.idProveedor) return Number(newPart.idProveedor);

    const existing = providers[0];
    if (existing) return Number(existing.id ?? existing.Id);

    const res = await api.post("/Proveedor", {
      nombre: "Proveedor por definir",
      categoria: "Repuestos",
      observaciones: "Proveedor generico creado desde el selector rapido de repuestos.",
    });

    const providerId = res?.data?.data?.[0]?.id ?? res?.data?.data?.[0]?.Id;
    if (!providerId) {
      throw new Error("No se pudo preparar el proveedor para el repuesto.");
    }

    return Number(providerId);
  };

  const createPart = async () => {
    const nombre = newPart.nombre.trim();
    const precioVenta = Number(newPart.precioVenta || 0);

    if (!nombre) {
      setCreateError("Indica el nombre del repuesto.");
      return;
    }

    if (!precioVenta || precioVenta <= 0) {
      setCreateError("Indica un precio de venta mayor que 0.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");
      const idProveedor = await ensureProvider();
      const payload = {
        nombre,
        codigoReferencia: newPart.codigoReferencia.trim() || null,
        marca: newPart.marca.trim() || null,
        categoria: "Repuestos",
        cantidad: 0,
        stockMinimo: 3,
        precioCompra: Number(newPart.precioCompra || 0),
        precioVenta,
        ubicacion: null,
        observaciones: "Registrado desde presupuesto, orden o factura.",
        idProveedor,
      };

      const res = await api.post("/RepuestoStock", payload);
      const createdId = res?.data?.data?.[0]?.id ?? res?.data?.data?.[0]?.Id;
      const createdRes = createdId ? await api.get(`/RepuestoStock/${createdId}`) : null;
      const createdPart = createdRes?.data?.data?.[0] || {
        ...payload,
        id: createdId,
        nombre,
        precioVenta,
      };

      selectPart(createdPart);
      setNewPart({
        nombre: "",
        precioVenta: "",
        precioCompra: "",
        marca: "",
        codigoReferencia: "",
        idProveedor: "",
      });
      setCreateOpen(false);
    } catch (err) {
      console.error(err);
      setCreateError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "No se pudo registrar el repuesto.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <PackageSearch
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700"
        placeholder={placeholder}
      />

      {open && panelStyle && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            {helperText}
          </div>

          {parts.length > 0 && (
            <div className="max-h-64 overflow-auto">
              {parts.map((part) => {
                const id = getPartValue(part, "id");
                const name = getPartDisplayName(part);
                const price = getPartSalePrice(part);
                const stock = getPartValue(part, "cantidad", 0);
                const provider = getPartValue(part, "nombreProveedor");

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectPart(part)}
                    className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left hover:bg-orange-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800">
                        {name || "Repuesto sin nombre"}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {provider ? `${provider} · ` : ""}Stock: {stock}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-extrabold text-emerald-700">
                        {money.format(price)}
                      </span>
                      <span className="text-[11px] font-semibold text-orange-700">
                        {buttonLabel}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {allowCreate && (
            <div className="border-t border-slate-200 bg-slate-50 p-3">
              {!createOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(true);
                    setNewPart((prev) => ({ ...prev, nombre: prev.nombre || query }));
                  }}
                  className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-bold text-white hover:bg-slate-900"
                >
                  Registrar nuevo repuesto
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Nombre del repuesto"
                      value={newPart.nombre}
                      onChange={(e) => setNewPartField("nombre", e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Precio venta."
                      value={newPart.precioVenta}
                      onChange={(e) => setNewPartField("precioVenta", e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Precio compra opcional"
                      value={newPart.precioCompra}
                      onChange={(e) => setNewPartField("precioCompra", e.target.value)}
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Marca opcional"
                      value={newPart.marca}
                      onChange={(e) => setNewPartField("marca", e.target.value)}
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Referencia opcional"
                      value={newPart.codigoReferencia}
                      onChange={(e) => setNewPartField("codigoReferencia", e.target.value)}
                    />
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      value={newPart.idProveedor}
                      onChange={(e) => setNewPartField("idProveedor", e.target.value)}
                    >
                      {providers.length === 0 && (
                        <option value="">Proveedor por definir</option>
                      )}
                      {providers.map((provider) => (
                        <option
                          key={provider.id ?? provider.Id}
                          value={provider.id ?? provider.Id}
                        >
                          {provider.nombre ?? provider.Nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {createError && (
                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                      {createError}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateOpen(false)}
                      className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={createPart}
                      disabled={creating}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {creating ? "Guardando..." : "Guardar y usar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
