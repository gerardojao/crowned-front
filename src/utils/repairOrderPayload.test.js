import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPreOrderPayload,
  buildWorkOrderPayload,
  getWorkOrderOperationTypeBadgeClass,
  getWorkOrderOperationTypeLabel,
} from "./repairOrderPayload.js";

const baseOrder = {
  Cliente: "Cliente Test",
  Dni: "",
  Telefono: "600000000",
  Direccion: "",
  CodigoPostal: "",
  Poblacion: "",
  Provincia: "",
  Clasificacion: "Particular",
  VehiculoId: "",
  Matricula: "1234ABC",
  Bastidor: "",
  Marca: "Seat",
  Modelo: "Leon",
  FechaMatriculacion: "",
  Motor: "",
  Kw: "",
  Cv: "",
  Combustible: "",
  Kilometraje: "100000",
  Fecha: "2026-07-05",
  FechaPrevistaEntrega: "",
  TiempoEstimadoHoras: "",
  TipoOperacion: "Mecanica",
  Trabajo: "",
  Items: [
    {
      descripcion: "Servicio cambio aceite",
      section: "ManoObra",
      sectionLocked: true,
      kind: "labor",
      cantidad: 2,
      tiempo: 2,
      precioUnitario: 50,
      importe: 50,
    },
  ],
  Repuestos: "",
  Cantidad: "1",
  ManoObra: "",
  Estado: "Recibido",
  Observaciones: "",
};

test("buildWorkOrderPayload preserves service and quantity when detailed lines are disabled", () => {
  const payload = buildWorkOrderPayload(baseOrder, false);

  assert.equal(payload.itemsJson, null);
  assert.equal(payload.trabajo, "Servicio cambio aceite");
  assert.equal(payload.cantidad, 2);
  assert.equal(payload.manoObra, 100);
  assert.equal(payload.repuestos, 0);
});

test("buildWorkOrderPayload serializes technical lines when detailed lines are enabled", () => {
  const payload = buildWorkOrderPayload(baseOrder, true);
  const items = JSON.parse(payload.itemsJson);

  assert.equal(payload.trabajo, "Servicio cambio aceite");
  assert.equal(payload.cantidad, 1);
  assert.equal(payload.manoObra, 100);
  assert.equal(payload.repuestos, 0);
  assert.equal(items.length, 1);
  assert.equal(items[0].descripcion, "Servicio cambio aceite");
  assert.equal(items[0].cantidad, 2);
  assert.equal(items[0].tiempo, 2);
  assert.equal(items[0].kind, "labor");
  assert.equal("sectionLocked" in items[0], false);
});

test("buildWorkOrderPayload preserves the explicit work summary with detailed lines", () => {
  const payload = buildWorkOrderPayload(
    { ...baseOrder, Trabajo: "Revisión general solicitada" },
    true,
  );

  assert.equal(payload.trabajo, "Revisión general solicitada");
});

test("buildWorkOrderPayload joins detailed line descriptions when work is empty", () => {
  const payload = buildWorkOrderPayload(
    {
      ...baseOrder,
      Items: [
        ...baseOrder.Items,
        {
          descripcion: "Montaje neumáticos",
          section: "ManoObra",
          cantidad: 1,
          precioUnitario: 25,
        },
      ],
    },
    true,
  );

  assert.equal(
    payload.trabajo,
    "Servicio cambio aceite\nMontaje neumáticos",
  );
});

test("buildPreOrderPayload maps pre-order form to backend DTO contract", () => {
  const payload = buildPreOrderPayload({
    Cliente: "Cliente Test",
    Dni: "",
    Telefono: "600000000",
    Direccion: "",
    CodigoPostal: "",
    Poblacion: "",
    Provincia: "",
    Clasificacion: "",
    VehiculoId: "15",
    Matricula: "1234ABC",
    Bastidor: "",
    Marca: "Seat",
    Modelo: "Leon",
    FechaMatriculacion: "",
    Motor: "",
    Kw: "",
    Cv: "",
    Combustible: "",
    Kilometraje: "100000",
    Fecha: "2026-07-05",
    FechaPrevistaEntrega: "",
    TiempoEstimadoHoras: "",
    TipoOperacion: "",
    MotivoRecepcion: "Ruido al frenar",
    DiagnosticoMecanico: "",
    RepuestosNecesarios: "",
    Observaciones: "",
  });

  assert.equal(payload.cliente, "Cliente Test");
  assert.equal(payload.vehiculoId, 15);
  assert.equal(payload.kilometraje, 100000);
  assert.equal(payload.tipoOperacion, "Mecanica");
  assert.equal(payload.motivoRecepcion, "Ruido al frenar");
  assert.equal(payload.diagnosticoMecanico, null);
});

test("getWorkOrderOperationTypeLabel formats work order operation type", () => {
  assert.equal(getWorkOrderOperationTypeLabel({ TipoOperacion: "Mecanica" }), "Mecánica");
  assert.equal(getWorkOrderOperationTypeLabel({ tipoOperacion: "Chapa y pintura" }), "Chapa y pintura");
});

test("getWorkOrderOperationTypeBadgeClass highlights body and paint orders", () => {
  assert.match(
    getWorkOrderOperationTypeBadgeClass({ TipoOperacion: "Chapa y pintura" }),
    /fuchsia/,
  );
  assert.match(
    getWorkOrderOperationTypeBadgeClass({ TipoOperacion: "Mecanica" }),
    /slate/,
  );
});
