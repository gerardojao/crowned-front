import clientes from "./manuals/01_CLIENTES_Y_VEHICULOS.md?raw";
import preordenes from "./manuals/02_PREORDENES.md?raw";
import ordenes from "./manuals/03_ORDENES_DE_TRABAJO.md?raw";
import presupuestos from "./manuals/04_PRESUPUESTOS.md?raw";
import proveedores from "./manuals/05_PROVEEDORES_STOCK_Y_RENTABILIDAD.md?raw";
import facturacion from "./manuals/06_FACTURACION.md?raw";
import sinIva from "./manuals/07_FACTURAS_SIN_IVA.md?raw";
import recambios from "./manuals/08_FACTURAS_DE_RECAMBIO.md?raw";
import rapel from "./manuals/09_FACTURAS_RAPEL.md?raw";
import compras from "./manuals/10_MODULO_DE_COMPRAS.md?raw";

const operationalRoles = ["superadmin", "manager", "user", "viewer", "mechanic"];
const administrationRoles = ["superadmin", "manager", "user", "viewer"];

export const manualCatalog = [
  { id: "clientes", title: "Clientes y vehículos", category: "Operaciones", content: clientes, roles: operationalRoles, paths: ["/register-customer"] },
  { id: "preordenes", title: "Preórdenes", category: "Operaciones", content: preordenes, roles: operationalRoles, feature: "preOrders", paths: ["/pre-ordenes", "/print-pre-order"] },
  { id: "ordenes", title: "Órdenes de trabajo", category: "Operaciones", content: ordenes, roles: operationalRoles, paths: ["/register-work-order", "/print-order"] },
  { id: "presupuestos", title: "Presupuestos", category: "Operaciones", content: presupuestos, roles: operationalRoles, paths: ["/presupuestos", "/print-budget", "/print-valuation"] },
  { id: "proveedores", title: "Proveedores, stock y rentabilidad", category: "Proveedores", content: proveedores, roles: administrationRoles, paths: ["/register-supplier", "/stock-parts"] },
  { id: "facturacion", title: "Facturación", category: "Facturación", content: facturacion, roles: administrationRoles, paths: ["/workshop-invoice", "/invoices-history", "/reprint-invoice", "/accounts-receivable"] },
  { id: "sin-iva", title: "Facturas sin IVA", category: "Facturación especial", content: sinIva, roles: administrationRoles, feature: "noVatInvoices", paths: ["/special-invoices/no-vat"] },
  { id: "recambios", title: "Facturas de recambio", category: "Facturación especial", content: recambios, roles: administrationRoles, feature: "specialInvoices", paths: ["/special-invoices/parts"] },
  { id: "rapel", title: "Facturas Rapel", category: "Facturación especial", content: rapel, roles: administrationRoles, feature: "rapelInvoices", paths: ["/special-invoices/rapel"] },
  { id: "compras", title: "Módulo de compras", category: "Compras", content: compras, roles: administrationRoles, feature: "purchases", paths: ["/purchases"] },
];

export function manualForPath(pathname, manuals = manualCatalog) {
  return manuals.find((manual) => manual.paths.some((path) => pathname.startsWith(path)))?.id || "";
}

