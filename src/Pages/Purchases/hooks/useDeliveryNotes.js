import { useCallback, useEffect, useState } from "react";
import api from "../../../Components/api";
import {
  extractDeliveryNoteResponse,
  normalizeDeliveryNote,
} from "../utils/deliveryNotes";

export function useDeliveryNotes() {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      setLoadingNotes(true);
      const res = await api.get("/Albaran", {
        params: { page: 1, pageSize: 100 },
      });
      const items = res?.data?.data?.[0]?.items || [];
      setNotes(items.map(normalizeDeliveryNote));
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  const loadNoteDetail = useCallback(async (id) => {
    const res = await api.get(`/Albaran/${id}`);
    return normalizeDeliveryNote(extractDeliveryNoteResponse(res));
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return { notes, loadingNotes, loadNotes, loadNoteDetail };
}
