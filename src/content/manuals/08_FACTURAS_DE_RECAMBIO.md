# Manual de usuario: facturas de recambio

**Aplicación:** ZagaPro / MasterTouch  
**Módulo:** Facturas de recambio  
**Versión:** 1.0  
**Última revisión:** 6 de octubre de 2026

## 1. ¿Para qué sirve esta modalidad?

La **Factura especial de recambio** permite registrar la venta directa de piezas sin crear previamente una orden de trabajo.

Sus características principales son:

- Numeración independiente de las facturas ordinarias del taller.
- Selección de piezas existentes en stock.
- Posibilidad de crear o añadir líneas manuales.
- IVA configurado inicialmente al 21 %.
- Registro del método de pago.
- Relación con inventario y rentabilidad cuando se selecciona un artículo de stock.

La serie predeterminada es **RC**, salvo que el taller tenga otra configurada.

## 2. Cuándo utilizarla

Utiliza esta modalidad cuando el taller vende directamente un recambio o material y no existe una reparación asociada.

Para trabajos realizados sobre un vehículo, utiliza el flujo de orden de trabajo y facturación ordinaria, porque conserva mejor la trazabilidad del servicio.

## 3. Acceder al módulo

1. Abre el menú principal.
2. Entra en **Facturas de recambio**.
3. Si la opción no está disponible, solicita que se revise la configuración del taller.

## 4. Seleccionar o registrar al cliente

### Cliente existente

1. Busca en **Buscar cliente registrado**.
2. Selecciona el cliente correcto.
3. Revisa nombre, NIF/DNI y teléfono.
4. Pulsa **Editar datos** si necesitas completar la información mostrada.

### Cliente nuevo

1. Pulsa **Nuevo cliente**.
2. Completa nombre, NIF/DNI, teléfono y dirección fiscal.
3. Selecciona su clasificación.
4. Si lo necesitas, agrega también su vehículo.
5. Pulsa **Guardar cliente**.

El nombre y el teléfono son obligatorios para guardar un cliente nuevo desde esta pantalla.

## 5. Añadir un recambio desde stock

1. Utiliza **Buscar recambio en stock**.
2. Busca por nombre o referencia.
3. Selecciona el artículo correcto.
4. Pulsa **Agregar**.
5. Revisa la descripción, cantidad y precio unitario.

Esta es la opción recomendada porque conserva la asociación con el artículo, el proveedor y los datos utilizados para stock y rentabilidad.

Antes de emitir, verifica que la cantidad vendida coincide con la entrega real.

## 6. Crear o añadir un recambio manualmente

El selector de stock permite crear un artículo cuando la función está disponible. También puedes pulsar **Agregar línea manual**.

Para cada línea completa:

- Descripción del recambio.
- Cantidad mayor que cero.
- Precio unitario positivo.

Una línea manual puede no conservar toda la relación con proveedor, coste e inventario. Si el artículo debe controlarse habitualmente, regístralo primero en stock.

## 7. Datos y totales

En **Datos de factura** revisa:

- Número provisional de la serie de recambio.
- Fecha.
- Tipo de pago, cuando esté habilitado.
- Observaciones.

El resumen muestra:

- Base imponible.
- IVA aplicado, inicialmente 21 %.
- Total.

Comprueba que el precio mostrado sea el precio de venta, no el coste de compra del taller.

## 8. Registrar el pago

Para una venta al contado:

1. Selecciona Efectivo, Transferencia, TPV o Bizum.
2. Introduce el importe correspondiente.
3. Si combinas varios métodos, reparte el total entre ellos.
4. Selecciona una cuenta bancaria para Transferencia, TPV y Bizum.
5. Comprueba que la diferencia sea 0,00 €.

Si las cuentas por cobrar están activadas, puedes seleccionar **A plazos**, indicar días de crédito, vencimiento, cuenta bancaria y abono inicial.

## 9. Cliente de compañía de seguro

Si la clasificación es **Compañía de seguro**, aparecerá **Franquicia**.

- Introduce el importe correspondiente.
- No puede superar el total.
- Revisa el importe mostrado como **Paga compañía**.

## 10. Emitir e imprimir

1. Confirma el cliente.
2. Revisa cada pieza, cantidad y precio.
3. Comprueba base, IVA y total.
4. Confirma el método de pago.
5. Pulsa **Emitir e imprimir** una sola vez.

El sistema emite la factura con la serie de recambio, guarda los datos y abre la impresión.

## 11. Revisar stock y rentabilidad

Después de la emisión:

1. Abre **Stock / Rentabilidad**.
2. Revisa la existencia del artículo en **Inventario**.
3. Abre **Facturados** para comprobar venta, coste y margen.

Si el margen no es correcto, comprueba el precio de compra y el proveedor de la línea facturada. No modifiques costes históricos sin un documento que justifique la corrección.

## 12. Consultar la factura

1. Entra en **Listado de facturas**.
2. Selecciona **Recambio** en el filtro **Origen**.
3. Filtra por fechas, número o cliente.
4. Abre el detalle para consultar o reimprimir.

También puedes enviar la factura por email y exportar el historial filtrado.

## 13. Devoluciones y rectificativas

Si se devuelve una pieza después de emitir:

1. Abre la factura original desde el historial.
2. Pulsa **Crear rectificativa**.
3. Selecciona una rectificación parcial o total.
4. Si la pieza ha regresado físicamente, activa **Devolver recambios al stock**.
5. Introduce la cantidad realmente devuelta.
6. Escribe el motivo y confirma.

No incrementes el inventario por una devolución que todavía no se haya recibido físicamente. La cantidad devuelta no puede superar la facturada.

## 14. Errores frecuentes

### No encuentro el recambio

- Revisa la búsqueda y la referencia.
- Comprueba que el artículo exista en inventario.
- Créalo desde el selector o regístralo previamente en stock.

### El importe de rentabilidad no es correcto

Comprueba que la pieza seleccionada tenga precio de compra, precio de venta y proveedor correctos.

### La suma de pagos no coincide

La suma de los métodos debe ser igual al importe que paga el cliente.

### No puedo emitir

Debe existir un cliente y al menos una línea con descripción, cantidad mayor que cero y precio válido.

### La franquicia es rechazada

No puede ser superior al total de la factura.

## 15. Buenas prácticas

- Selecciona el recambio desde stock siempre que exista.
- Revisa la referencia para no vender una pieza similar por error.
- Confirma físicamente las unidades entregadas.
- Mantén actualizados coste, precio de venta y proveedor.
- Usa facturación ordinaria si existe una reparación asociada.
- Gestiona devoluciones mediante rectificativas.

## 16. Resumen rápido

1. Abre **Facturas de recambio**.
2. Selecciona o registra al cliente.
3. Busca y agrega las piezas de stock.
4. Revisa cantidades, precios, IVA y total.
5. Registra el pago.
6. Pulsa **Emitir e imprimir**.
7. Consulta la factura con origen **Recambio**.
8. Usa una rectificativa para devoluciones o correcciones.

