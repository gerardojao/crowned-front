# Manual de usuario: facturas Rapel

**Aplicación:** ZagaPro / MasterTouch  
**Módulo:** Facturas Rapel  
**Última revisión:** 19 de octubre de 2026

## 1. ¿Para qué sirve esta modalidad?

La **Factura Rapel** registra una regularización comercial cuyo importe reduce la facturación acumulada. Por esta razón, el sistema genera:

- Base imponible negativa.
- IVA negativo.
- Total negativo.
- Numeración independiente.

Aunque el usuario introduce cantidades y precios como valores positivos, el sistema convierte las cantidades de las líneas a signo negativo al emitir.

La serie predeterminada es **RP**, salvo que el taller tenga otra configurada.

## 2. Cuándo utilizarla

Utiliza una factura Rapel solamente cuando exista una bonificación, descuento por volumen u otra regularización comercial documentada que deba registrarse con importes negativos.

No la utilices para:

- Anular un error de una factura concreta; utiliza una factura rectificativa.
- Registrar una devolución de recambios; rectifica la factura original.
- Emitir una venta normal con descuento.
- Sustituir una nota interna o un ajuste sin respaldo documental.

Consulta con la asesoría fiscal si no está claro qué documento corresponde.

## 3. Acceder al módulo

1. Abre el menú principal.
2. Entra en **Facturas Rapel**.
3. Si no aparece, el módulo puede estar desactivado para el taller.

## 4. Seleccionar o registrar al cliente

### Cliente registrado

1. Utiliza **Buscar cliente registrado**.
2. Selecciona el cliente o empresa beneficiaria del Rapel.
3. Revisa NIF/DNI, teléfono y dirección fiscal.

### Cliente nuevo

1. Pulsa **Nuevo cliente**.
2. Completa los datos fiscales y de contacto.
3. Selecciona la clasificación adecuada.
4. Pulsa **Guardar cliente**.

Aunque la pantalla permite asociar un vehículo, normalmente un Rapel corresponde a una relación comercial y no a una reparación concreta. Añade vehículo solo si realmente resulta necesario.

## 5. Añadir conceptos Rapel

1. En **Conceptos Rapel**, escribe una descripción clara.
2. Introduce la cantidad como número positivo.
3. Introduce el importe unitario como número positivo.
4. Pulsa **Agregar línea manual** para incluir otros conceptos.

Ejemplos de descripción:

- Rapel comercial correspondiente al tercer trimestre.
- Bonificación anual por volumen de operaciones.
- Regularización comercial según acuerdo de fecha indicada.

No introduzcas manualmente el signo menos. El sistema aplica el signo negativo automáticamente.

## 6. Cómo calcula los importes

Para cada línea:

- Cantidad introducida: positiva.
- Precio introducido: positivo.
- Cantidad emitida: negativa.
- Base de línea: cantidad negativa × precio positivo.

El resumen mostrará:

- Base imponible negativa.
- IVA, normalmente al 21 %, calculado en negativo.
- Total negativo.

Ejemplo: cantidad 1 y precio 100,00 € producen una base de −100,00 €, IVA de −21,00 € y total de −121,00 €.

## 7. Datos de la factura

Revisa:

- Número provisional de la serie Rapel.
- Fecha dentro del ejercicio vigente.
- Cliente y NIF/DNI.
- Observaciones.
- Base, IVA y total negativos.

Utiliza **Observaciones** para identificar el periodo, acuerdo, contrato o documento que justifica el Rapel.

## 8. Dejar el Rapel pendiente

Una factura Rapel representa un **saldo a favor del cliente**, no un cobro. Puedes emitirla a crédito para dejar su importe pendiente de aplicación.

Cuando queda pendiente:

- No entra ni sale dinero de caja.
- No se registra ningún movimiento bancario.
- El saldo permanece disponible en **Facturas pendiente de cobro**.
- Puede aplicarse más adelante, total o parcialmente.

Los Rappels no admiten cobros mediante Efectivo, Transferencia, TPV o Bizum. Su aplicación es una compensación entre el saldo a favor y la deuda del cliente.

## 9. Aplicar un Rapel a varias facturas

1. Entra en **Facturas pendiente de cobro**.
2. Localiza el bloque **Rappels pendientes de aplicar**.
3. Pulsa **Ver** para desplegar los saldos disponibles.
4. En el Rapel correspondiente, pulsa **Aplicar a facturas**.
5. Introduce cuánto quieres aplicar en cada factura pendiente.
6. Comprueba el total aplicado y el saldo restante del Rapel.
7. Confirma la aplicación.

Puedes repartir un mismo Rapel entre varias facturas del mismo cliente. También puedes aplicar solamente una parte y conservar el resto para otra operación.

### Ejemplo

Un cliente tiene dos facturas pendientes:

| Factura | Saldo pendiente |
|---|---:|
| F-101 | 300,00 € |
| F-102 | 500,00 € |

Dispone de un Rapel de 600,00 €. Puedes aplicar 300,00 € a F-101 y 250,00 € a F-102.

El resultado será:

- F-101 queda pagada.
- F-102 conserva 250,00 € pendientes.
- El Rapel conserva 50,00 € disponibles.
- No se genera ningún movimiento de caja o banco.

### Controles de seguridad

El sistema impide:

- Aplicar más del saldo disponible del Rapel.
- Superar el saldo pendiente de una factura.
- Aplicarlo a facturas de otro cliente.
- Aplicarlo si no coincide el DNI/NIF.
- Aplicarlo a otro Rapel o a una factura rectificativa.
- Volver a aplicar un Rapel completamente consumido.

## 10. Emitir e imprimir

Antes de emitir:

1. Confirma el cliente correcto.
2. Revisa que cada cantidad y precio se haya escrito en positivo.
3. Comprueba que base, IVA y total aparecen en negativo.
4. Verifica el motivo y periodo en observaciones.
5. Pulsa **Emitir e imprimir** una sola vez.

El sistema asigna la serie Rapel, guarda el documento y abre la impresión.

## 11. Consultar una factura Rapel

1. Entra en **Listado de facturas**.
2. Selecciona **Rapel** en el filtro **Origen**.
3. Define el periodo o busca por factura o cliente.
4. Abre el detalle.

Desde el historial puedes reimprimir, enviar por email y exportar los datos.

Los importes negativos afectarán al total del libro de ventas del periodo correspondiente.

## 12. Corregir un Rapel emitido

No modifiques ni elimines directamente el documento. Ábrelo desde el historial y utiliza el procedimiento de factura rectificativa cuando corresponda. Indica siempre el motivo y conserva la relación documental entre ambos registros.

Antes de rectificar un Rapel, confirma con administración el efecto esperado, porque se está corrigiendo un documento que ya contiene importes negativos.

## 13. Diferencia entre Rapel y rectificativa

| Documento | Uso principal |
|---|---|
| **Factura Rapel** | Bonificación o regularización comercial por volumen u otro acuerdo documentado. |
| **Factura rectificativa** | Corrección total o parcial de una factura concreta ya emitida. |

Si el ajuste identifica directamente una factura errónea, normalmente corresponde una rectificativa, no un Rapel.

## 14. Errores frecuentes

### Los totales aparecen negativos

Es el comportamiento correcto de esta modalidad.

### Introduje precios negativos

Corrige los campos y utiliza valores positivos. El sistema genera el signo negativo automáticamente.

### No aparece Facturas Rapel

El módulo debe ser habilitado en la configuración del taller.

### No se puede emitir

Comprueba que exista cliente y al menos una línea con descripción, cantidad mayor que cero y precio válido.

### No sé si corresponde Rapel o rectificativa

No emitas hasta confirmarlo con administración o la asesoría fiscal.

### No aparecen facturas para aplicar

Comprueba que el cliente y las facturas tengan el mismo DNI/NIF, que exista saldo pendiente y que las facturas no estén rectificadas.

## 15. Buenas prácticas

- Conserva el acuerdo que justifica la bonificación.
- Identifica claramente el periodo en la descripción u observaciones.
- Introduce cantidad y precio en positivo.
- Comprueba los importes negativos antes de emitir.
- No utilices Rapel para corregir una factura concreta.
- Revisa su impacto en el libro de ventas.
- Envía una copia al cliente o empresa correspondiente.
- Déjalo pendiente cuando todavía no sepas a qué facturas aplicarlo.
- Comprueba el saldo restante después de cada aplicación.

## 16. Resumen rápido

1. Abre **Facturas Rapel**.
2. Selecciona al cliente.
3. Añade el concepto y el periodo de la regularización.
4. Introduce cantidad y precio en positivo.
5. Confirma que los totales se muestran en negativo.
6. Emítelo a crédito si quieres dejar el saldo pendiente.
7. Abre **Facturas pendiente de cobro**.
8. Distribuye el Rapel entre una o varias facturas.
9. Comprueba el saldo disponible restante.
