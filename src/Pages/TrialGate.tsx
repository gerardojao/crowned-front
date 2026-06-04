// import React from "react";
// import { useNavigate } from "react-router-dom";


// const API_BASE =
//   ["localhost", "127.0.0.1"].includes(window.location.hostname)
//     ? "https://localhost:7288"  // API en dev (tu Swagger)
//     : "";                        // en prod, ruta relativa

// export default function TrialGate() {
//   const nav = useNavigate();
  
//   const [msg, setMsg] = React.useState("Validando acceso…");

//   React.useEffect(() => {
//     (async () => {
//       try {
//         const params = new URLSearchParams(window.location.search);
//         const email = (params.get("email") || "").trim();
//         const token = (params.get("token") || "").trim();

//         if (!email || !token) {
//           setMsg("Enlace inválido: faltan parámetros (email/token).");
//           return;
//         }

//         const res = await fetch(`${API_BASE}/api/Trials/redeem`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ email, token }),
//         });

//         if (!res.ok) {
//           let txt = `Error ${res.status}`;
//           try {
//             const j = await res.json();
//             if (j?.message) txt = j.message;
//           } catch {}
//           setMsg(`No se pudo canjear el enlace: ${txt}`);
//           return;
//         }

//         const data = await res.json(); // { token, expiresAt, user }
//         const jwt = data?.token;
//         const usr = data?.user ?? null;

//         if (!jwt) {
//           setMsg("Respuesta inválida del servidor: falta token.");
//           return;
//         }

//         // Guarda credenciales para el resto de la app
//         localStorage.setItem("fa_token", jwt);
//         if (usr) localStorage.setItem("fa_user", JSON.stringify(usr));

//         // Guarda fin del trial
//         if (data?.expiresAt) {
//         localStorage.setItem("fa_trial_exp", data.expiresAt);
//         }

//         // Notifica al AuthProvider para que adopte el token sin recarga
//         window.dispatchEvent(
//           new CustomEvent("fa:token:set", { detail: { token: jwt, user: usr } })
//         );

//         // Limpia la URL (quita email/token) y navega al home
//         window.history.replaceState({}, "", "/");
//         nav("/", { replace: true });
//       } catch (e: any) {
//         setMsg(`Error canjeando enlace: ${e?.message || "desconocido"}`);
//       }
//     })();
//   }, [nav]);

//   return (
//     <div className="flex min-h-screen items-center justify-center">
//       <div className="rounded-xl border p-6 text-slate-700">
//         {msg}
//       </div>
//     </div>
//   );
// }

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Components/AuthContext";
import { API_BASE_URL } from "../Components/api";
 // ajusta la ruta si difiere

const API_BASE = API_BASE_URL.replace(/\/$/, "");

export default function TrialGate() {

  const nav = useNavigate();
  const auth = useAuth(); // puede ser el objeto del provider (con adoptToken)
  const adoptToken = auth?.adoptToken;
  const [msg, setMsg] = React.useState("Validando acceso…");
    const ranRef = React.useRef(false);

  React.useEffect(() => {
    
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const email = (params.get("email") || "").trim();
        const token = (params.get("token") || "").trim();

        if (!email || !token) {
          setMsg("Enlace inválido: faltan parámetros (email/token).");
          return;
        }

        const res = await fetch(`${API_BASE}/Trials/redeem`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });

        if (!res.ok) {
          let txt = `Error ${res.status}`;
          try {
            const j = await res.json();
            if (j?.message) txt = j.message;
          } catch {}
          setMsg(`No se pudo canjear el enlace: ${txt}`);
          return;
        }

        const data = await res.json(); // { token, expiresAt, user }
        const jwt = data?.token;
        const usr = data?.user ?? null;
        const exp = data?.expiresAt ?? undefined; 

        if (!jwt) {
          setMsg("Respuesta inválida del servidor: falta token.");
          return;
        }

        // Preferido: avisar al AuthProvider (sin recarga)
        if (typeof adoptToken === "function") {
          adoptToken(jwt, usr, exp);
        } else {
          // Plan B: setear localStorage y avisar por evento global (AuthProvider lo escucha)
          localStorage.setItem("fa_token", jwt);
          if (usr) localStorage.setItem("fa_user", JSON.stringify(usr));
          if (exp) localStorage.setItem("fa_trial_exp", exp);
          //window.dispatchEvent(new CustomEvent("fa:token:set", { detail: { token: jwt, user: usr, trialExp: exp } }));
          window.location.replace("/");
          return
        }

        // Limpia la URL y navega al home
        window.history.replaceState({}, "", "/");
        nav("/", { replace: true });
      } catch (e) {
        const err = e as Error;
        setMsg(`Error canjeando magicLink: ${err.message || "desconocido"}`);
      }
    })();
  }, [nav, adoptToken]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl border p-6 text-slate-700">{msg}</div>
    </div>
  );
}
