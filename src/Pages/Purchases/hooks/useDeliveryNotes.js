import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../Components/api";
import {
  extractDeliveryNoteResponse,
  normalizeDeliveryNote,
} from "../utils/deliveryNotes";

export function useDeliveryNotes(initialFilters = {}) {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    estado: "",
    fechaInicio: "",
    fechaFin: "",
    page: 1,
    pageSize: 10,
    ...initialFilters,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
  });

  const loadNotes = useCallback(async (overrides = {}) => {
    const nextFilters = { ...filters, ...overrides };

    try {
      setLoadingNotes(true);
      const res = await api.get("/Albaran", {
        params: {
          search: nextFilters.search || undefined,
          estado: nextFilters.estado || undefined,
          fechaInicio: nextFilters.fechaInicio || undefined,
          fechaFin: nextFilters.fechaFin || undefined,
          page: nextFilters.page,
          pageSize: nextFilters.pageSize,
        },
      });
      const pack = res?.data?.data?.[0] || {};
      const items = pack.items || [];
      setNotes(items.map(normalizeDeliveryNote));
      setPagination({
        total: Number(pack.total || 0),
        page: Number(pack.page || nextFilters.page || 1),
        pageSize: Number(pack.pageSize || nextFilters.pageSize || 10),
      });
    } catch {
      setNotes([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoadingNotes(false);
    }
  }, [filters]);

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const loadNoteDetail = useCallback(async (id) => {
    const res = await api.get(`/Albaran/${id}`);
    return normalizeDeliveryNote(extractDeliveryNoteResponse(res));
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
    [pagination.pageSize, pagination.total],
  );

  return {
    notes,
    loadingNotes,
    loadNotes,
    loadNoteDetail,
    filters,
    updateFilters,
    pagination,
    totalPages,
  };
}
