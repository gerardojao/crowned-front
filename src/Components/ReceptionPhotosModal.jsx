import React, { useEffect, useMemo, useRef, useState } from "react";
import { Images, Printer, Trash2, Upload, X } from "lucide-react";
import api, { resolveApiAssetUrl } from "./api";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

export default function ReceptionPhotosModal({
  open,
  onClose,
  preOrderId,
  orderId,
  title = "Fotos de recepcion",
  subtitle = "",
  canUpload = false,
  context = {},
}) {
  const inputRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [maxPhotos, setMaxPhotos] = useState(5);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, photoId: null, loading: false });

  const endpoint = useMemo(() => {
    if (preOrderId) return `/preordentrabajo/${preOrderId}/photos`;
    if (orderId) return `/ordentrabajo/${orderId}/reception-photos`;
    return "";
  }, [orderId, preOrderId]);

  const remainingSlots = Math.max(0, maxPhotos - photos.length);

  useEffect(() => {
    if (!open || !endpoint) return;
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, endpoint]);

  if (!open) return null;

  async function loadPhotos() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(endpoint);
      const data = res?.data || {};
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
      setMaxPhotos(Number(data.maxPhotos || 5));
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudieron cargar las fotos.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadPhotos(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || !preOrderId || uploading) return;

    if (files.length > remainingSlots) {
      setError(`Solo puedes agregar ${remainingSlots} foto(s) mas.`);
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      setUploading(true);
      setError("");
      const res = await api.post(`/preordentrabajo/${preOrderId}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res?.data || {};
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
      setMaxPhotos(Number(data.maxPhotos || 5));
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudieron subir las fotos.",
      );
    } finally {
      setUploading(false);
    }
  }

  function openDeletePhotoModal(photoId) {
    if (!preOrderId || !photoId) return;
    setDeleteModal({ open: true, photoId, loading: false });
  }

  function closeDeletePhotoModal() {
    if (deleteModal.loading) return;
    setDeleteModal({ open: false, photoId: null, loading: false });
  }

  async function confirmDeletePhoto() {
    if (!preOrderId || !deleteModal.photoId) return;

    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      setError("");
      const res = await api.delete(`/preordentrabajo/${preOrderId}/photos/${deleteModal.photoId}`);
      const data = res?.data || {};
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
      setMaxPhotos(Number(data.maxPhotos || 5));
      setDeleteModal({ open: false, photoId: null, loading: false });
    } catch (err) {
      console.error(err);
      setDeleteModal((prev) => ({ ...prev, loading: false }));
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo eliminar la foto.",
      );
    }
  }

  function printPhotos() {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 120);
  }

  return (
    <>
      <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
        <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Images size={20} />
                {title}
              </h3>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
              <p className="mt-1 text-xs text-slate-400">
                {photos.length}/{maxPhotos} fotos guardadas
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[calc(90vh-86px)] overflow-y-auto px-5 py-4">
            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {error}
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                Respaldo interno para reclamos o consulta. No aparece en el PDF de pre-orden.
              </div>
              <div className="flex flex-wrap gap-2">
                {canUpload && preOrderId && (
                  <>
                    <input
                      ref={inputRef}
                      type="file"
                      accept={ACCEPTED_TYPES}
                      multiple
                      onChange={uploadPhotos}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploading || remainingSlots <= 0}
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      <Upload size={17} />
                      {uploading ? "Subiendo..." : "Agregar fotos"}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={!photos.length}
                  onClick={printPhotos}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  <Printer size={17} />
                  Imprimir fotos
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                Cargando fotos...
              </div>
            ) : photos.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo, index) => (
                  <figure key={photo.id ?? photo.Id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <img
                        src={resolveApiAssetUrl(photo.url ?? photo.Url)}
                        alt={`Foto ${index + 1}`}
                        className="h-56 w-full object-cover cursor-zoom-in transition hover:scale-[1.02]"
                        onClick={() =>
                          setSelectedPhoto(resolveApiAssetUrl(photo.url ?? photo.Url))
                        }
                      />
                    <figcaption className="space-y-1 p-3 text-xs text-slate-500">
                      <div className="font-semibold text-slate-700">
                        Foto {index + 1}
                      </div>
                      <div>{formatDate(photo.createdAt ?? photo.CreatedAt)}</div>
                      
                      {canUpload && preOrderId && (
                        <button
                          type="button"
                          onClick={() => openDeletePhotoModal(photo.id ?? photo.Id)}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                No hay fotos guardadas.
              </div>
            )}
          </div>
        </div>
      </div>

      {printing && (
        <section className="print-page bg-white p-6 text-black">
          <h1 className="text-xl font-bold uppercase">Fotos de recepcion</h1>
          <div className="mt-2 text-sm">
            {context.preOrderId && <div>Pre-orden: {context.preOrderId}</div>}
            {context.orderId && <div>Orden: {context.orderId}</div>}
            {context.cliente && <div>Cliente: {context.cliente}</div>}
            {context.matricula && <div>Matricula: {context.matricula}</div>}
            <div>Fecha impresion: {new Date().toLocaleString("es-ES")}</div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id ?? photo.Id} className="break-inside-avoid border border-black p-2">
                <img
                  src={resolveApiAssetUrl(photo.url ?? photo.Url)}
                  alt={`Foto ${index + 1}`}
                  className="h-[250px] w-full object-contain"
                />
                <div className="mt-1 text-xs">
                  Foto {index + 1} - {formatDate(photo.createdAt ?? photo.CreatedAt)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {deleteModal.open && (
        <div
          className="no-print fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Trash2 size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Eliminar foto</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Esta foto se eliminara definitivamente del respaldo de la pre-orden.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteModal.loading}
                onClick={closeDeletePhotoModal}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteModal.loading}
                onClick={confirmDeletePhoto}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deleteModal.loading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={28} />
          </button>

          <img
            src={selectedPhoto}
            alt="Foto ampliada"
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-ES");
}


