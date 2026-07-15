import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../Components/api";

function providerId(provider) {
  return provider?.id ?? provider?.Id;
}

function providerName(provider) {
  return (
    provider?.nombre ??
    provider?.Nombre ??
    provider?.razonSocial ??
    provider?.RazonSocial ??
    provider?.contacto ??
    provider?.Contacto ??
    ""
  );
}

function providerDetail(provider) {
  return [
    provider?.nifCif ?? provider?.NifCif,
    provider?.telefono ?? provider?.Telefono,
    provider?.email ?? provider?.Email,
  ]
    .filter(Boolean)
    .join(" - ");
}

export default function ProviderSearchInput({
  providers = [],
  valueId,
  valueName = "",
  onSelect,
  placeholder = "Buscar proveedor...",
}) {
  const [query, setQuery] = useState(valueName);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (open) return;

    const selected = providers.find(
      (provider) => String(providerId(provider)) === String(valueId || ""),
    );
    setQuery(valueName || providerName(selected) || "");
  }, [open, providers, valueId, valueName]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    let alive = true;
    const search = query.trim();

    const localMatches = providers
      .filter((provider) =>
        [providerName(provider), providerDetail(provider)]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .slice(0, 8);

    if (!search) {
      setResults(providers.slice(0, 8));
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/Proveedor", {
          params: { search, page: 1, pageSize: 8 },
        });
        if (!alive) return;
        const items = res?.data?.data?.[0]?.items || [];
        setResults(items.length ? items : localMatches);
      } catch {
        if (alive) setResults(localMatches);
      } finally {
        if (alive) setLoading(false);
      }
    }, 220);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [providers, query]);

  const exactSelection = useMemo(
    () =>
      results.find(
        (provider) => String(providerId(provider)) === String(valueId || ""),
      ),
    [results, valueId],
  );

  const selectProvider = (provider) => {
    const id = providerId(provider);
    const name = providerName(provider);
    setQuery(name);
    setOpen(false);
    onSelect?.({ id, name, provider });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="search"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (valueId) onSelect?.({ id: "", name: "", provider: null });
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            {loading
              ? "Buscando proveedores..."
              : exactSelection
                ? "Proveedor seleccionado"
                : "Selecciona un proveedor"}
          </div>

          {results.length === 0 ? (
            <div className="px-3 py-3 text-sm font-semibold text-slate-500">
              No hay proveedores coincidentes.
            </div>
          ) : (
            results.map((provider) => {
              const id = providerId(provider);
              const name = providerName(provider);
              const detail = providerDetail(provider);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectProvider(provider)}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-sky-50"
                >
                  <span className="block text-sm font-bold text-slate-800">
                    {name || "Proveedor sin nombre"}
                  </span>
                  {detail && (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {detail}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
