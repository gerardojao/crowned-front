import { useEffect, useMemo, useState } from "react";
import { ACTIONS, EVENTS, Joyride, STATUS } from "react-joyride";

const TOUR_VERSION = "2026-07-workflow-v1";
const STORAGE_PREFIX = "zagapro:tour";

const baseStyles = {
  options: {
    arrowColor: "#ffffff",
    backgroundColor: "#ffffff",
    overlayColor: "rgba(15, 23, 42, 0.38)",
    primaryColor: "#ea580c",
    textColor: "#0f172a",
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 16,
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
    border: "1px solid #e2e8f0",
  },
  tooltipContainer: {
    textAlign: "left",
  },
  buttonBack: {
    color: "#475569",
  },
  buttonClose: {
    color: "#64748b",
  },
  buttonPrimary: {
    backgroundColor: "#ea580c",
    color: "#ffffff",
    borderRadius: 10,
    fontWeight: 700,
  },
  buttonSkip: {
    color: "#64748b",
  },
};

const tourCatalog = {
  menu: {
    match: (_pathname, menuOpen) => menuOpen,
    steps: [
      {
        target: '[data-tour="menu-order"]',
        content:
          "Desde el menu tambien puedes iniciar ordenes o pre-ordenes rapidamente.",
      },
      {
        target: '[data-tour="menu-customers"]',
        content:
          "Este acceso abre la gestion de clientes y vehiculos.",
      },
      {
        target: '[data-tour="menu-suppliers"]',
        content:
          "Aqui puedes registrar o consultar proveedores.",
      },
      {
        target: '[data-tour="menu-balance"]',
        content:
          "Desde Balance revisas ingresos, gastos y resultado del negocio.",
      },
      {
        target: '[data-tour="menu-alerts"]',
        content:
          "Las alertas de clientes tambien estan disponibles desde el menu.",
      },
    ],
  },
  home: {
    match: (pathname) => pathname === "/",
    steps: [
      {
        target: '[data-tour="main-logo"]',
        content:
          "Desde el logo vuelves al inicio del negocio activo en cualquier momento.",
      },
      {
        target: '[data-tour="home-orders"]',
        content:
          "Empieza una orden o pre-orden desde este acceso principal.",
      },
      {
        target: '[data-tour="home-customers"]',
        content:
          "Gestiona clientes y sus vehiculos desde el modulo de clientes.",
      },
      {
        target: '[data-tour="home-suppliers"]',
        content:
          "Accede a proveedores, repuestos o materiales facturados desde este modulo.",
      },
      {
        target: '[data-tour="home-balance"]',
        content:
          "Consulta ingresos, gastos y reportes financieros desde Balance.",
      },
      {
        target: '[data-tour="client-alerts"]',
        content:
          "Aqui veras avisos pendientes para contactar clientes o hacer seguimiento.",
      },
    ],
  },
  workOrder: {
    match: (pathname) => pathname === "/register-work-order",
    steps: [
      {
        target: '[data-tour="work-order-customer-search"]',
        content:
          "Busca un cliente por nombre, telefono, matricula o modelo antes de crear la orden.",
      },
      {
        target: '[data-tour="work-order-form"]',
        content:
          "Cuando selecciones cliente y vehiculo, completa aqui los datos de la orden.",
      },
      {
        target: '[data-tour="work-order-save"]',
        content:
          "Guarda la orden cuando el trabajo, estado e importes esten revisados.",
      },
    ],
  },
  customers: {
    match: (pathname) => pathname === "/register-customer",
    steps: [
      {
        target: '[data-tour="customer-search"]',
        content:
          "Busca clientes existentes antes de crear uno nuevo para evitar duplicados.",
      },
      {
        target: '[data-tour="customer-form"]',
        content:
          "Registra o actualiza los datos fiscales y de contacto del cliente.",
      },
      {
        target: '[data-tour="customer-vehicles"]',
        content:
          "Cuando editas un cliente, aqui puedes agregar o modificar sus vehiculos.",
      },
    ],
  },
};

function getTourForPath(pathname, menuOpen) {
  return Object.entries(tourCatalog).find(([, tour]) =>
    tour.match(pathname, menuOpen),
  );
}

function storageKey(tourId) {
  return `${STORAGE_PREFIX}:${TOUR_VERSION}:${tourId}`;
}

function markTourAsSeen(tourId) {
  if (!tourId) return;
  localStorage.setItem(storageKey(tourId), "done");
}

function getAvailableSteps(steps) {
  return steps
    .filter((step) => document.querySelector(step.target))
    .map((step) => ({
      ...step,
      skipScroll: true,
    }));
}

function scrollTargetIntoView(target) {
  const element = document.querySelector(target);
  if (!element) return;

  window.setTimeout(() => {
    element.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  }, 0);
}

export default function ProductTour({
  isAuthed,
  pathname,
  disabled = false,
  menuOpen = false,
}) {
  const [run, setRun] = useState(false);
  const [readySteps, setReadySteps] = useState([]);
  const activeTour = useMemo(
    () => getTourForPath(pathname, menuOpen),
    [menuOpen, pathname],
  );
  const tourId = activeTour?.[0] ?? "";
  const steps = activeTour?.[1]?.steps ?? [];

  useEffect(() => {
    setRun(false);
    setReadySteps([]);

    if (!isAuthed || disabled || !tourId || steps.length === 0) return;
    if (localStorage.getItem(storageKey(tourId)) === "done") return;

    const timer = window.setTimeout(() => {
      const availableSteps = getAvailableSteps(steps);
      if (availableSteps.length > 0) {
        markTourAsSeen(tourId);
        setReadySteps(availableSteps);
        setRun(true);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [disabled, isAuthed, menuOpen, pathname, steps, tourId]);

  useEffect(() => {
    const restart = () => {
      if (!tourId || steps.length === 0) return;
      localStorage.removeItem(storageKey(tourId));
      const availableSteps = getAvailableSteps(steps);
      if (availableSteps.length > 0) {
        markTourAsSeen(tourId);
        setReadySteps(availableSteps);
        setRun(true);
      }
    };

    window.addEventListener("tc:product-tour:restart", restart);
    return () => window.removeEventListener("tc:product-tour:restart", restart);
  }, [steps, tourId]);

  if (!isAuthed || disabled || readySteps.length === 0) return null;

  return (
    <Joyride
      continuous
      showProgress
      showSkipButton
      disableOverlayClose
      spotlightPadding={8}
      run={run}
      steps={readySteps}
      locale={{
        back: "Atrás",
        close: "Cerrar",
        last: "Finalizar",
        next: "Siguiente",
        skip: "Omitir",
      }}
      styles={baseStyles}
      callback={({ action, status, step, type }) => {
        if (step?.target && [EVENTS.STEP_BEFORE, EVENTS.TOOLTIP].includes(type)) {
          scrollTargetIntoView(step.target);
        }

        if (
          [STATUS.FINISHED, STATUS.SKIPPED].includes(status) ||
          action === ACTIONS.CLOSE
        ) {
          markTourAsSeen(tourId);
          setRun(false);
          setReadySteps([]);
        }
      }}
    />
  );
}
