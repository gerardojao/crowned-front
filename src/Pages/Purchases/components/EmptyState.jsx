export default function EmptyState({ text }) {
  return (
    <div className="p-6 text-center">
      <p className="text-sm font-semibold text-slate-700">{text}</p>
      <p className="mt-1 text-xs text-slate-500">
        Cuando registres movimientos, aparecerán aquí.
      </p>
    </div>
  );
}
