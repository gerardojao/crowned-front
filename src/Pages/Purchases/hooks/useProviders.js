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
      const items = res?.data?.data?.[0]?.items || [];
      setProviders(items);
      return items;
    } catch {
      setProviders([]);
      return [];
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    reloadProviders();
  }, [reloadProviders]);

  return { providers, loadingProviders, reloadProviders };
}
