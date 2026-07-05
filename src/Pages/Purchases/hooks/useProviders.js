import { useCallback, useEffect, useState } from "react";
import api from "../../../Components/api";

export function useProviders() {
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const reloadProviders = useCallback(async () => {
    try {
      setLoadingProviders(true);
      const res = await api.get("/Proveedor", {
        params: { page: 1, pageSize: 100 },
      });
      setProviders(res?.data?.data?.[0]?.items || []);
    } catch {
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    reloadProviders();
  }, [reloadProviders]);

  return { providers, loadingProviders, reloadProviders };
}
