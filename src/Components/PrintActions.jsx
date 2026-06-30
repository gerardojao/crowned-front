import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";

export default function PrintActions({
  title,
  subtitle,
  backTo,
  backLabel = "Volver",
  printLabel = "Emitir e Imprimir",
}) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 text-slate-900">
      <div>
        {title && (
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        )}
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-white transition hover:bg-orange-700"
        >
          <Printer size={18} />
          {printLabel}
        </button>
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-white transition hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
