import React from "react";
import { useAuth } from "./AuthContext";

const SHOW_COUNTDOWN_MIN = 60;
const URGENT_MIN = 30;

function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${m}:${pad(ss)}`;
}

export default function TrialBanner() {
  const { isTrial, trialEndsAt } = useAuth();
  const [leftMs, setLeftMs] = React.useState(0);

  React.useEffect(() => {
    if (!isTrial || !trialEndsAt) return;
    const tick = () => setLeftMs(new Date(trialEndsAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isTrial, trialEndsAt]);

  if (!isTrial || !trialEndsAt) return null;

  const minutesLeft = Math.ceil(leftMs / 60000);
  const isExpired = minutesLeft <= 0;
  const showCountdown = minutesLeft > 0 && minutesLeft <= SHOW_COUNTDOWN_MIN;
  const urgent = minutesLeft > 0 && minutesLeft <= URGENT_MIN;

  const barClass = urgent
    ? "bg-amber-50 border-amber-300"
    : "bg-emerald-50 border-emerald-300";

  return (
    <div className={`w-full border-b ${barClass}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-sm">
        <div className="text-slate-800">
          {isExpired ? (
            <span>
              Tu prueba ha caducado.{" "}
              <a className="underline" href="/register">
                Registrate
              </a>{" "}
              para seguir usando TallerCrowned.
            </span>
          ) : (
            <>
              <strong>Estas usando la version de prueba.</strong>{" "}
              {!showCountdown ? (
                <span>
                  Disfruta la app y cuando quieras,{" "}
                  <a className="underline" href="/register">
                    registrate
                  </a>
                  .
                </span>
              ) : urgent ? (
                <span>
                  <strong>Queda poco tiempo</strong> - {fmt(leftMs)} restantes.{" "}
                  <a className="underline" href="/register">
                    Registrate
                  </a>{" "}
                  para no perder el acceso.
                </span>
              ) : (
                <span>
                  Tiempo restante: <strong>{fmt(leftMs)}</strong>.{" "}
                  <a className="underline" href="/register">
                    Registrate
                  </a>{" "}
                  cuando quieras.
                </span>
              )}
            </>
          )}
        </div>

        {!isExpired && (
          <a
            href="/register"
            className={`rounded-lg px-3 py-1 font-medium ${
              urgent
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            Registrate
          </a>
        )}
      </div>
    </div>
  );
}
