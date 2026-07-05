import { useCallback, useEffect, useState } from "react";
import api from "../../../Components/api";

export function useBankAccounts() {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

  const reloadBankAccounts = useCallback(async () => {
    try {
      setLoadingBankAccounts(true);
      const res = await api.get("/WorkshopBankAccounts");
      setBankAccounts(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setBankAccounts([]);
    } finally {
      setLoadingBankAccounts(false);
    }
  }, []);

  useEffect(() => {
    reloadBankAccounts();
  }, [reloadBankAccounts]);

  return { bankAccounts, loadingBankAccounts, reloadBankAccounts };
}
