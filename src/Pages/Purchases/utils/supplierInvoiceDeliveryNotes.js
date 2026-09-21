export function buildGroupedDeliveryNoteDescription(notes) {
  const count = Array.isArray(notes) ? notes.length : 0;
  return count === 1
    ? "Factura agrupada de 1 albarán"
    : `Factura agrupada de ${count} albaranes`;
}

export function normalizeLinkedDeliveryNotes(invoice) {
  const notes = invoice?.albaranes ?? invoice?.Albaranes ?? [];
  if (!Array.isArray(notes)) return [];

  return notes
    .map((note) => ({
      id: note?.id ?? note?.Id,
      numeroAlbaran:
        note?.numeroAlbaran ?? note?.NumeroAlbaran ?? "Sin número",
      fecha: note?.fecha ?? note?.Fecha ?? null,
      total: Number(note?.total ?? note?.Total ?? 0) || 0,
    }))
    .filter((note) => note.id != null);
}
