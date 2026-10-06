# Manual de usuario: facturación

**Aplicación:** ZagaPro / MasterTouch  
**Módulo:** Facturación  
**Versión:** 1.0  
**Última revisión:** 5 de octubre de 2026

## 1. ¿Para qué sirve este módulo?

El módulo de **Facturación** permite:

- Emitir una factura a partir de una orden de trabajo.
- Incorporar mano de obra, servicios, piezas y otros conceptos.
- Aplicar descuentos e IVA.
- Registrar uno o varios métodos de pago.
- Emitir facturas a plazos cuando las cuentas por cobrar están habilitadas.
- Imprimir, consultar y enviar facturas por correo electrónico.
- Exportar e imprimir el libro de ventas.
- Crear facturas rectificativas cuando una factura emitida debe corregirse.

Las opciones visibles pueden variar según la configuración del taller y los permisos del usuario.

## 2. Antes de facturar

Comprueba que:

- La orden de trabajo corresponde al cliente y vehículo correctos.
- Los trabajos y repuestos utilizados están registrados.
- Los datos fiscales del cliente están completos.
- El taller tiene correctamente configurados sus datos fiscales.
- Existen cuentas bancarias activas si vas a cobrar por transferencia, TPV o Bizum.

Una factura es un documento fiscal. Revisa toda la información antes de emitirla.

## 3. Crear una factura

El flujo habitual comienza desde una orden de trabajo:

1. Abre la orden que deseas facturar.
2. Accede a la opción de facturación.
3. Revisa los datos cargados desde la orden.
4. Completa conceptos, impuestos y forma de pago.
5. Pulsa **Imprimir** para emitir la factura.

> **Importante:** al pulsar **Imprimir**, el sistema primero guarda y emite la factura, le asigna su número definitivo y después abre la impresión. No pulses varias veces mientras se está procesando.

## 4. Datos del taller

La factura muestra los datos de la empresa o taller activo:

- Nombre comercial.
- Razón social.
- NIF/CIF.
- Teléfono.
- Dirección.
- Email.
- IBAN.

Estos datos son de solo lectura y no se modifican desde la factura. Si son incorrectos, un administrador debe corregir la configuración del taller antes de emitirla.

## 5. Datos de la factura

### Número y fecha

- **Número de factura:** aparece como vista previa y el sistema confirma el número definitivo al emitirla.
- **Fecha:** selecciona la fecha fiscal correcta. El sistema limita las fechas permitidas al ejercicio vigente y no admite fechas futuras.

No cambies manualmente la numeración ni intentes reutilizar un número anterior.

### Cliente

Revisa los siguientes campos:

- Nombre o razón social.
- DNI/NIE/NIF.
- Dirección.
- Código postal.
- Población.
- Provincia.
- Teléfono.
- Clasificación: **Particular**, **Empresa** o **Compañía de seguro**.

Cuando la factura procede de una orden, estos datos pueden aparecer bloqueados. Su edición solo estará disponible si el taller tiene habilitada la opción correspondiente.

Si los datos son incorrectos y están bloqueados, vuelve a la ficha del cliente o solicita la corrección antes de emitir la factura.

### Vehículo o referencia

Según el tipo de negocio, la factura puede mostrar:

- Matrícula o referencia.
- Kilometraje u otra métrica configurada.

Comprueba que identifica correctamente el trabajo facturado.

## 6. Clientes de compañía de seguro

Al seleccionar **Compañía de seguro**, puede aparecer el campo **Franquicia**.

- Introduce el importe que corresponde asumir según la operación.
- La franquicia no puede superar el total de la factura.
- La pantalla mostrará el total de la factura y el importe asignado a la compañía.

Verifica el acuerdo con la aseguradora y el cliente antes de emitir.

## 7. Añadir conceptos

La sección **Conceptos** permite incorporar las líneas que formarán la factura.

### Añadir un repuesto del inventario

1. Utiliza **Buscar repuesto**.
2. Selecciona el artículo correcto.
3. Pulsa la opción para agregarlo.
4. Revisa la cantidad, descripción y precio.

Seleccionar el repuesto correcto permite mantener la relación con el inventario y la rentabilidad.

### Añadir un servicio frecuente

1. Abre **Agregar servicio frecuente**.
2. Selecciona el servicio.
3. Revisa el tiempo o cantidad y el precio.

Para crear un servicio reutilizable:

1. Escribe su nombre en **Nuevo servicio frecuente**.
2. Pulsa **Guardar servicio**.
3. El servicio quedará disponible para futuras operaciones.

### Añadir una línea manual

1. Pulsa **Añadir línea**.
2. Completa los datos disponibles:
   - Código.
   - Sección.
   - Descripción.
   - Tiempo o cantidad.
   - Precio unitario.
   - Descuento de línea.
   - IVA de línea.
3. Revisa el total calculado.

Dependiendo del tipo de trabajo, las secciones pueden incluir:

- **Mano de obra**.
- **Piezas** o **Materiales**.
- **Pintura**, en operaciones de chapa y pintura.

Pulsa el icono de papelera para retirar una línea que no deba facturarse.

## 8. Requisitos de las líneas

La factura debe contener al menos una línea válida con:

- Una descripción.
- Una cantidad o tiempo válido.
- Un importe válido.

Utiliza precios unitarios. El sistema calcula el resultado de cada línea a partir de la cantidad, el precio y, cuando corresponda, el descuento e IVA.

## 9. IVA y descuentos

### IVA

El campo **IVA (%)** establece el porcentaje general de la factura. En las líneas detalladas puede existir también un IVA específico.

Comprueba el tipo aplicable antes de emitir. No utilices un IVA del 0 % salvo que la operación y la configuración fiscal del taller lo permitan.

### Descuento / Otros

El valor introducido se resta de la base antes del IVA.

- No puede ser negativo.
- No puede superar la base imponible disponible.
- Si equivale al 100 % de la base, el IVA resultante también será cero.

Si necesitas aplicar descuentos diferentes por concepto, utiliza el porcentaje de descuento de cada línea cuando esté disponible.

## 10. Totales de la factura

Antes de emitir, revisa:

- **Base imponible:** importe antes del IVA.
- **Tasa IVA:** porcentaje aplicado.
- **IVA:** cuota calculada.
- **Descuento / Otros:** importe restado.
- **Franquicia:** cuando corresponda.
- **Paga compañía:** importe asociado a la aseguradora cuando corresponda.
- **Total:** importe final de la factura.

No continúes si el total no coincide con lo acordado con el cliente.

## 11. Factura al contado

Para una factura de pago inmediato:

1. Selecciona **Contado**, si aparece el selector de tipo de pago.
2. Marca uno o varios métodos de pago.
3. Introduce el importe de cada método.
4. Para los métodos distintos de efectivo, selecciona la cuenta bancaria.
5. Comprueba que el total **Asignado** coincide con el importe a pagar.

Métodos disponibles:

- **Efectivo**.
- **Transferencia**.
- **TPV**.
- **Bizum**.

Es posible dividir el cobro, por ejemplo, entre efectivo y TPV. La suma debe coincidir exactamente con el importe que paga el cliente.

## 12. Factura a plazos

Esta opción aparece solamente cuando el taller tiene habilitado el módulo de cuentas por cobrar.

1. En **Tipo de pago**, selecciona **A plazos**.
2. Elige un plan de crédito:
   - 30 días.
   - 60 días.
   - Personalizado.
3. Revisa o introduce la fecha de vencimiento.
4. Selecciona la cuenta bancaria si corresponde.
5. Si el cliente entrega una cantidad inicial, registra el método y el importe como **Abono inicial**.

La fecha de vencimiento no puede ser anterior a la fecha de la factura y el abono inicial no puede superar el importe pendiente del cliente.

El saldo restante podrá gestionarse posteriormente desde **Facturas por cobrar**.

## 13. Emitir e imprimir

Antes de pulsar **Imprimir**, realiza esta revisión:

1. Cliente y datos fiscales correctos.
2. Matrícula o referencia correcta.
3. Conceptos y cantidades completos.
4. Precios, descuentos e IVA correctos.
5. Total comprobado.
6. Métodos de pago y cuentas bancarias asignados.

Al pulsar **Imprimir**:

1. El sistema valida la información.
2. Guarda la factura emitida.
3. Asigna el número definitivo.
4. Actualiza la orden y los registros relacionados.
5. Abre el documento para imprimirlo.

Después de emitirla, comprueba que aparece la pantalla **Factura emitida** y que el número es visible.

## 14. Consultar el historial de facturas

Entra en **Historial de facturas** para localizar documentos ya emitidos.

Puedes filtrar por:

- Fecha desde y hasta.
- Número de factura.
- Matrícula.
- Cliente.
- Origen.
- Tipo de factura.

También están disponibles los filtros rápidos:

- **Hoy**.
- **Este mes**.
- **Este año**.
- **Limpiar**.

### Orígenes disponibles

Según las funciones habilitadas, pueden aparecer:

- Taller.
- Recambio.
- Rapel.
- Sin IVA.

### Tipos disponibles

- **Normal**.
- **Rectificativa**.

El listado muestra fecha, número, cliente, origen, tipo, base, IVA y total.

## 15. Ver, reimprimir o enviar una factura

Desde el historial:

- Pulsa el icono de visualización para abrir el detalle.
- Utiliza **Reimprimir** para obtener otra copia.
- Utiliza el icono de correo para enviarla por email.

Antes de enviar por correo, comprueba que el cliente tiene una dirección de email válida. Espera el mensaje de confirmación **Factura enviada correctamente por email**.

Las copias posteriores pueden identificarse como **Factura duplicada**, mientras que el documento recién emitido se presenta como **Factura**.

## 16. Exportar e imprimir el libro de ventas

Desde **Historial de facturas**:

1. Selecciona el periodo y los filtros deseados.
2. Pulsa **Buscar**.
3. Usa **Exportar Excel** para descargar los resultados.
4. Usa **Imprimir Ventas** para preparar el libro de ventas imprimible.

La exportación incluye los registros que coinciden con los filtros seleccionados. Revisa siempre el periodo antes de generar informes fiscales o administrativos.

## 17. Corregir una factura emitida

Una factura emitida no debe borrarse ni modificarse directamente. Para corregirla, crea una **factura rectificativa** desde el detalle de la factura original.

1. Busca la factura en el historial.
2. Abre su detalle.
3. Pulsa **Crear rectificativa**.
4. Selecciona el tipo:
   - **Total:** rectifica la factura completa.
   - **Parcial:** rectifica solamente una parte.
5. Indica la fecha.
6. En una rectificación parcial, introduce la base imponible y el concepto.
7. Selecciona el banco cuando el sistema lo solicite.
8. Escribe obligatoriamente el motivo.
9. Pulsa **Crear rectificativa**.

El sistema genera un documento nuevo vinculado a la factura original. Desde ambos documentos pueden consultarse sus relaciones.

## 18. Devolver recambios al stock mediante una rectificativa

Si una rectificación implica la devolución física de piezas:

1. Crea una rectificativa parcial.
2. Activa **Devolver recambios al stock**.
3. Introduce la cantidad devuelta de cada pieza.
4. Revisa la base imponible calculada.
5. Indica el motivo y crea la rectificativa.

Activa esta opción únicamente cuando el material haya regresado físicamente al taller. La cantidad devuelta no puede superar la cantidad facturada.

## 19. Errores frecuentes

### No se puede emitir porque falta un método de pago

- Selecciona al menos un método.
- Introduce un importe mayor que cero.
- Comprueba que la suma coincide con el total a pagar.

### El sistema solicita un banco

Transferencia, TPV y Bizum requieren una cuenta bancaria asociada. Selecciona una cuenta activa o solicita al administrador que la configure.

### La suma de pagos no coincide

Revisa los importes asignados a cada método. En una factura al contado, su suma debe coincidir con el importe que paga el cliente.

### No puedo guardar una factura a plazos

- Comprueba que cuentas por cobrar está habilitado.
- Revisa la fecha de vencimiento.
- Asegúrate de que el abono inicial no supera el total.

### La factura no tiene líneas válidas

Añade al menos un concepto con descripción, cantidad o tiempo e importe válidos.

### El descuento es rechazado

El descuento no puede ser negativo ni superar la base imponible antes del IVA.

### La franquicia es rechazada

Comprueba que no sea superior al total de la factura.

### Los datos del taller no se pueden editar

Es el funcionamiento previsto. Deben corregirse en la configuración del taller antes de emitir.

### Los datos del cliente aparecen bloqueados

La edición desde la factura puede no estar habilitada. Corrige la ficha del cliente o la orden antes de facturar.

### El email no se envía

- Comprueba la dirección del cliente.
- Verifica la conexión.
- Confirma que la factura aparece correctamente en el historial antes de reintentar.

## 20. Buenas prácticas

- Factura siempre desde la orden correcta.
- Comprueba el NIF/CIF y la dirección fiscal antes de emitir.
- Registra cada método de pago por su importe real.
- Asocia transferencia, TPV y Bizum con la cuenta bancaria correcta.
- Revisa las líneas de piezas para conservar stock y rentabilidad fiables.
- No emitas dos veces por no esperar la apertura de la impresión.
- No alteres una factura emitida; utiliza una rectificativa.
- No devuelvas piezas al stock si no han regresado físicamente.
- Revisa periódicamente el historial y el libro de ventas.

## 21. Resumen rápido

1. Abre la orden y entra en facturación.
2. Revisa taller, cliente, vehículo y fecha.
3. Completa los conceptos.
4. Comprueba IVA, descuentos y total.
5. Registra el pago al contado o las condiciones a plazos.
6. Pulsa **Imprimir** para guardar, numerar y emitir.
7. Consulta posteriormente la factura en **Historial de facturas**.
8. Si necesitas corregirla, crea una factura rectificativa.

