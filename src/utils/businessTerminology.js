import { useEffect, useState } from "react";
import api from "../Components/api";

const automotive = {
  kind: "automotive",
  businessSingular: "taller",
  businessPlural: "talleres",
  managementTitle: "Gestion del taller",
  managementSubtitle: "Accede rapido a las operaciones principales del dia.",
  customerAndAssetTitle: "Datos del cliente y vehiculo",
  customerPageSubtitle: "Gestiona clientes y vehiculos del taller.",
  assetSingular: "vehiculo",
  assetHeader: "Vehiculo",
  referenceLabel: "Matricula",
  referencePlaceholder: "Matricula *",
  referenceSearchPlaceholder: "Buscar matricula...",
  referenceRequiredMessage: "Indica la matricula del vehiculo para registrar el cliente.",
  makeLabel: "Marca",
  modelLabel: "Modelo",
  modelRequiredMessage: "Indica el modelo del vehiculo para registrar el cliente.",
  metricLabel: "Kilometraje",
  metricPlaceholder: "Kilometraje",
  partsLabel: "Repuestos",
  partsPlaceholder: "Repuestos €",
  stockTitle: "Stock de repuestos",
  stockEmpty: "No hay repuestos para mostrar.",
  supplierHint: "Repuestos, pintura, neumaticos...",
  orderTitle: "Nueva orden de trabajo",
  orderSubtitle: "Registra trabajos, vehiculo, estado y costes del servicio.",
  orderPrintTitle: "Orden de trabajo",
  invoiceTitle: "Factura de taller",
  invoiceFromOrder: (id) => `Genera una factura a partir de la orden de trabajo #${id}.`,
  budgetTitle: "Presupuesto de taller",
  warrantyTitle: "GARANTIA DE 90 DIAS O 2000KM",
  warrantyText:
    "Todo repuesto usado o nuevo suministrado e instalado a solicitud del cliente, NO SE LE BRINDARA GARANTIA. Las reparaciones tienen garantia cuando sean repuestos nuevos suministrados por el taller.",
};

const serviceBusiness = {
  kind: "service",
  businessSingular: "empresa",
  businessPlural: "empresas",
  managementTitle: "Gestion de servicios tecnicos",
  managementSubtitle: "Coordina visitas, presupuestos, materiales y facturacion.",
  customerAndAssetTitle: "Datos del cliente y equipo",
  customerPageSubtitle: "Gestiona clientes, ubicaciones y equipos de servicio.",
  assetSingular: "equipo",
  assetHeader: "Equipo",
  referenceLabel: "Referencia",
  referencePlaceholder: "Referencia del equipo *",
  referenceSearchPlaceholder: "Buscar referencia...",
  referenceRequiredMessage: "Indica la referencia del equipo para registrar el cliente.",
  makeLabel: "Marca",
  modelLabel: "Equipo / modelo",
  modelRequiredMessage: "Indica el equipo o modelo para registrar el cliente.",
  metricLabel: "Antiguedad/uso",
  metricPlaceholder: "Antiguedad o uso",
  partsLabel: "Materiales",
  partsPlaceholder: "Materiales €",
  stockTitle: "Stock de materiales",
  stockEmpty: "No hay materiales para mostrar.",
  supplierHint: "Climatizacion, electricidad, fontaneria...",
  orderTitle: "Nueva orden de servicio",
  orderSubtitle: "Registra visitas, equipos, estado y costes del servicio.",
  orderPrintTitle: "Orden de servicio",
  invoiceTitle: "Factura de servicio",
  invoiceFromOrder: (id) => `Genera una factura a partir de la orden de servicio #${id}.`,
  budgetTitle: "Presupuesto de servicio",
  warrantyTitle: "CONDICIONES DEL SERVICIO",
  warrantyText:
    "Los materiales instalados y los trabajos realizados quedan sujetos a las condiciones acordadas con el cliente. Cualquier intervencion adicional debe presupuestarse o autorizarse antes de su ejecucion.",
};

export function getBusinessTerminology(settings) {
  const profile = String(settings?.terminologyProfile ?? settings?.TerminologyProfile ?? "").toLowerCase();
  const type = String(settings?.businessType ?? settings?.BusinessType ?? "").toLowerCase();

  if (profile === "equipment_service" || profile === "generic_service") return serviceBusiness;
  if (type === "technical_services" || type === "generic_services") return serviceBusiness;

  return automotive;
}

export function useBusinessTerminology() {
  const [terminology, setTerminology] = useState(automotive);

  useEffect(() => {
    let alive = true;
    api
      .get("/WorkshopSettings")
      .then((res) => {
        if (!alive) return;
        setTerminology(getBusinessTerminology(res?.data));
      })
      .catch(() => {
        if (alive) setTerminology(automotive);
      });

    return () => {
      alive = false;
    };
  }, []);

  return terminology;
}
