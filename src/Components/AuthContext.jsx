import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";

const AuthCtx = createContext({
  user: null,
  token: null,
  isAuthed: false,
  isTrial: false,
  trialEndsAt: null,
  login: async () => { throw new Error("AuthProvider no montado"); },
  logout: () => {},
  adoptToken: (_tok, _usr = null, _trialExp = null) => {
    localStorage.setItem("fa_token", _tok);
    setToken(_tok);

    if (_usr) {
      localStorage.setItem("fa_user", JSON.stringify(_usr));
      setUser(_usr);
    } else {
      // Sesion temporal sin user en localStorage.
      localStorage.removeItem("fa_user");
      setUser(null);
    }

    const expFromJwt = decodeJwtExp(_tok);
    const finalExp = _trialExp ? new Date(_trialExp) : expFromJwt || null;

    if (finalExp) {
      setTrialEndsAt(finalExp);
      localStorage.setItem("fa_trial_exp", finalExp.toISOString());
    } else {
      setTrialEndsAt(null);
      localStorage.removeItem("fa_trial_exp");
    }
  },
});

export const useAuth = () => useContext(AuthCtx);

function decodeJwtExp(token) {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json?.exp === "number" ? new Date(json.exp * 1000) : null;
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fa_user")) || null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("fa_token") || null);
  const [trialEndsAt, setTrialEndsAt] = useState(() => {
    const raw = localStorage.getItem("fa_trial_exp");
    return raw ? new Date(raw) : null;
  });

  const isAuthed = !!token;
  const roleLower = user?.role?.toLowerCase?.();
  // Consideramos trial cuando hay fecha de fin de trial.
  const isTrial = !!trialEndsAt;

  // Aplica/quita Authorization cuando cambie el token.
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      if (!trialEndsAt) {
        const exp = decodeJwtExp(token);
        if (exp) {
          setTrialEndsAt(exp);
          localStorage.setItem("fa_trial_exp", exp.toISOString());
        }
      }
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Si hay usuario y no es trial, apaga el rastro de prueba.
  useEffect(() => {
    if (user && roleLower !== "trial") {
      setTrialEndsAt(null);
      localStorage.removeItem("fa_trial_exp");
    }
  }, [user, roleLower]);

  // Listener global para 401.
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setUser(null);
      setTrialEndsAt(null);
      localStorage.removeItem("fa_trial_exp");
    };
    window.addEventListener("fa:unauthorized", onUnauthorized);
    return () => window.removeEventListener("fa:unauthorized", onUnauthorized);
  }, []);

  // Listener para adoptar token via evento global.
  useEffect(() => {
    const onTokenSet = (e) => {
      const { token: tok, user: usr, trialExp } = e.detail || {};
      if (!tok) return;
      adoptToken(tok, usr ?? null, trialExp ?? null);
    };
    const onTokenClear = () => {
      localStorage.removeItem("fa_token");
      localStorage.removeItem("fa_user");
      localStorage.removeItem("fa_trial_exp");
      localStorage.removeItem("tc_workshop_id");
      setToken(null);
      setUser(null);
      setTrialEndsAt(null);
      delete api.defaults.headers.common["Authorization"];
    };

    window.addEventListener("fa:token:set", onTokenSet);
    window.addEventListener("fa:token:clear", onTokenClear);
    return () => {
      window.removeEventListener("fa:token:set", onTokenSet);
      window.removeEventListener("fa:token:clear", onTokenClear);
    };
  }, []); // una vez

  // Permite inyectar token y user/exp.
  const adoptToken = (tok, usr = null, trialExp = null) => {
    localStorage.setItem("fa_token", tok);
    setToken(tok);

    if (usr) {
      localStorage.setItem("fa_user", JSON.stringify(usr));
      setUser(usr);
    } else {
      // Sesion temporal sin user en localStorage.
      localStorage.removeItem("fa_user");
      setUser(null);
    }

    const expFromJwt = decodeJwtExp(tok);
    const finalExp = trialExp ? new Date(trialExp) : expFromJwt || null;

    if (finalExp) {
      setTrialEndsAt(finalExp);
      localStorage.setItem("fa_trial_exp", finalExp.toISOString());
    } else {
      setTrialEndsAt(null);
      localStorage.removeItem("fa_trial_exp");
    }
  };

  // Login normal => no trial.
  const login = async (email, password) => {
    const res = await api.post("/Auth/login", { email, password });

    const tok = res.data?.token ?? res.data?.Token;
    const usr = res.data?.user  ?? res.data?.User;
    if (!tok) throw new Error(res?.data?.message || "No se recibio token.");

    localStorage.setItem("fa_token", tok);
    if (usr) localStorage.setItem("fa_user", JSON.stringify(usr));
    setToken(tok);
    setUser(usr ?? null);

    if (!usr) {
      try {
        const who = await api.get("/Auth/whoami");
        const u = { id: Number(who.data?.sub), email: who.data?.email, role: who.data?.role ?? "user" };
        localStorage.setItem("fa_user", JSON.stringify(u));
        setUser(u);
      } catch { /* ignore */ }
    }

    // Apagar trial en login normal.
    setTrialEndsAt(null);
    localStorage.removeItem("fa_trial_exp");

    return { token: tok, user: usr };
  };

  const logout = async () => {
    try { await api.post("/Auth/logout"); } catch { /* ignora */ }
    localStorage.removeItem("fa_token");
    localStorage.removeItem("fa_user");
    localStorage.removeItem("fa_trial_exp");
    localStorage.removeItem("tc_workshop_id");
    setToken(null);
    setUser(null);
    setTrialEndsAt(null);
    delete api.defaults.headers.common["Authorization"];
  };

  const value = useMemo(
    () => ({ user, token, isAuthed, isTrial, trialEndsAt, login, logout, adoptToken }),
    [user, token, isAuthed, isTrial, trialEndsAt]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

