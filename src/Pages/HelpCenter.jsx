import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Library, Printer, Search, ShieldCheck, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SafeMarkdown from "../Components/SafeMarkdown";
import { useAuth } from "../Components/AuthContext";
import api, { getCurrentWorkshopId } from "../Components/api";
import { manualCatalog } from "../content/manualCatalog";

function featureState(workshop) {
  return {
    preOrders: workshop?.enablePreOrders ?? workshop?.EnablePreOrders ?? false,
    specialInvoices: workshop?.enableSpecialInvoices ?? workshop?.EnableSpecialInvoices ?? true,
    rapelInvoices: workshop?.enableRapelInvoices ?? workshop?.EnableRapelInvoices ?? false,
    noVatInvoices: workshop?.enableNoVatInvoices ?? workshop?.EnableNoVatInvoices ?? false,
    purchases: workshop?.enableStockPayments ?? workshop?.EnableStockPayments ?? false,
  };
}

export default function HelpCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [workshop, setWorkshop] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    api.get("/WorkshopSettings/mine").then((response) => {
      if (!alive) return;
      const list = Array.isArray(response?.data) ? response.data : [];
      const activeId = getCurrentWorkshopId();
      setWorkshop(list.find((item) => String(item.id ?? item.Id) === String(activeId)) || list[0] || null);
    }).catch(() => alive && setWorkshop(null));
    return () => { alive = false; };
  }, []);

  const role = String(workshop?.workshopRole ?? workshop?.WorkshopRole ?? user?.role ?? "user").toLowerCase();
  const features = featureState(workshop);
  const manuals = useMemo(() => manualCatalog.filter((manual) => {
    if (!manual.roles.includes(role) && role !== "superadmin") return false;
    return !manual.feature || features[manual.feature];
  }), [role, workshop]);

  const visibleManuals = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    if (!query) return manuals;
    return manuals.filter((manual) => `${manual.title} ${manual.category} ${manual.content}`.toLocaleLowerCase("es").includes(query));
  }, [manuals, search]);

  const requestedId = params.get("manual");
  const selected = manuals.find((manual) => manual.id === requestedId) || visibleManuals[0] || manuals[0];
  const choose = (id) => setParams(id ? { manual: id } : {});

  return (
    <div className="mx-auto w-full max-w-screen-2xl pb-12">
      <section className="mb-6 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
        <div className="relative px-6 py-7 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30"><Library size={28} /></span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">Centro de ayuda</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">Manuales de usuario</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Procedimientos claros y actualizados para trabajar con seguridad en cada módulo de MasterTouch.</p>
              </div>
            </div>
            <div className="no-print flex shrink-0 gap-2">
          {selected && <button type="button" onClick={() => window.print()} className="no-print inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><Printer size={17} /> Imprimir</button>}
              <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/20"><ArrowLeft size={17} /> Volver</button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="no-print self-start overflow-hidden rounded-2xl bg-white shadow-md shadow-slate-900/5 ring-1 ring-slate-200 lg:sticky lg:top-32">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Biblioteca</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{manuals.length} manuales disponibles</p>
          </div>
          <div className="p-4">
          <label className="relative block">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en los manuales..." className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-9 text-sm" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"><X size={15} /></button>}
          </label>
          <div className="mt-4 max-h-[58vh] space-y-1 overflow-y-auto pr-1">
            {visibleManuals.map((manual) => (
              <button key={manual.id} type="button" onClick={() => choose(manual.id)} className={`group w-full rounded-xl px-3 py-3 text-left transition ${selected?.id === manual.id ? "bg-orange-50 text-orange-950 ring-1 ring-orange-200" : "text-slate-700 hover:bg-slate-50"}`}>
                <span className="flex items-start gap-3"><span className={`mt-0.5 rounded-lg p-1.5 ${selected?.id === manual.id ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white"}`}><BookOpen size={15} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-5">{manual.title}</span><span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{manual.category}</span></span><ChevronRight size={15} className="mt-2 shrink-0 text-slate-300" /></span>
              </button>
            ))}
            {visibleManuals.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No se encontraron manuales.</p>}
          </div>
          </div>
        </aside>

        <main className="help-print-page print-page min-w-0 overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/5 ring-1 ring-slate-200">
          {selected && (
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-8 lg:px-10">
              <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500"><BookOpen size={15} className="text-orange-500" /> {selected.category}</div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"><ShieldCheck size={14} /> Contenido interno verificado</div>
              </div>
            </div>
          )}
          <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-11">
            {selected ? <SafeMarkdown content={selected.content} /> : <p className="text-slate-500">No hay manuales disponibles para esta cuenta.</p>}
          </div>
        </main>
      </div>
    </div>
  );
}
