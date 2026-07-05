import { useCallback, useEffect, useState } from "react";
import api from "../../../Components/api";

export function useExpenseTypes() {
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loadingExpenseTypes, setLoadingExpenseTypes] = useState(false);

  const reloadExpenseTypes = useCallback(async () => {
    try {
      setLoadingExpenseTypes(true);
      const res = await api.get("/Egreso");
      setExpenseTypes(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch {
      setExpenseTypes([]);
    } finally {
      setLoadingExpenseTypes(false);
    }
  }, []);

  useEffect(() => {
    reloadExpenseTypes();
  }, [reloadExpenseTypes]);

  return { expenseTypes, loadingExpenseTypes, reloadExpenseTypes };
}
