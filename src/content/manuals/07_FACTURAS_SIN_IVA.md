# Manual de usuario: facturas sin IVA

**Aplicación:** ZagaPro / MasterTouch  
**Módulo:** Facturas sin IVA  
**Versión:** 1.0  
**Última revisión:** 6 de octubre de 2026

## 1. ¿Para qué sirve esta modalidad?

La **Factura sin IVA** permite emitir una factura especial con:

- Una serie de numeración independiente.
- Tasa de IVA fija del 0 %.
- Conceptos introducidos manualmente.
- Pago al contado o a plazos, si esta última opción está habilitada.
- Consulta posterior desde el historial general de facturas.

Utiliza esta modalidad únicamente cuando la operación pueda facturarse legalmente sin IVA. Que el sistema permita emitirla no determina por sí mismo que exista una exención o no sujeción fiscal.

## 2. Acceder al módulo

1. Abre el menú principal.
2. Entra en **Facturas sin IVA**.
3. Si la opción no aparece o la pantalla indica que está desactivada, solicita a un administrador que revise la configuración del taller.

El sistema utiliza la serie específica configurada para estas facturas; si no se ha personalizado, la referencia predeterminada es **SI**.

## 3. Comprobar la justificación fiscal

Antes de crear la factura:

1. Confirma que la operación corresponde realmente a IVA 0 %.
2. Reúne la documentación que justifique el tratamiento fiscal.
3. Escribe en **Observaciones** la referencia o explicación necesaria.
4. Consulta con la asesoría fiscal si existe cualquier duda.

No utilices esta modalidad únicamente para aplicar un descuento o reducir el total de una factura ordinaria.

## 4. Seleccionar o registrar al cliente

### Cliente existente

1. Escribe un nombre, NIF/DNI o teléfono en **Buscar cliente registrado**.
2. Selecciona el resultado correcto.
3. Revisa la información mostrada.

### Cliente nuevo

1. Pulsa **Nuevo cliente**.
2. Completa nombre, NIF/DNI, teléfono, dirección, código postal, población y provincia.
3. Selecciona la clasificación: Particular, Empresa o Compañía de seguro.
4. Opcionalmente pulsa **Agregar vehículo** y completa sus datos.
5. Pulsa **Guardar cliente**.

El nombre y el teléfono son necesarios para guardar un cliente nuevo desde esta pantalla.

## 5. Añadir conceptos

1. En **Conceptos**, escribe la descripción de la operación.
2. Introduce la cantidad.
3. Introduce el precio unitario positivo.
4. Pulsa **Agregar línea manual** para añadir más conceptos.
5. Utiliza el icono de papelera para retirar una línea.

Cada línea válida necesita descripción, cantidad mayor que cero e importe válido. El sistema calcula la base imponible multiplicando cantidad por precio.

## 6. Datos de la factura

Revisa:

- **Número:** vista previa de la serie especial; el número definitivo se confirma al emitir.
- **Fecha:** debe pertenecer al ejercicio vigente y no puede ser futura.
- **Observaciones:** indica la justificación o información complementaria.
- **IVA:** permanece en 0 %.

El resumen muestra:

- Base imponible.
- IVA 0 %, cuyo importe será 0,00 €.
- Total, que coincidirá con la base imponible.

## 7. Registrar el pago

En una factura al contado:

1. Selecciona uno o varios métodos: Efectivo, Transferencia, TPV o Bizum.
2. Introduce el importe asignado a cada uno.
3. Selecciona una cuenta bancaria para todos los métodos excepto Efectivo.
4. Comprueba que la diferencia sea 0,00 €.

Si las cuentas por cobrar están habilitadas, puedes seleccionar **A plazos**, indicar plazo, vencimiento, cuenta bancaria y un posible abono inicial.

## 8. Emitir e imprimir

1. Revisa cliente, fecha, conceptos y total.
2. Confirma que el tratamiento IVA 0 % es correcto.
3. Comprueba los métodos de pago.
4. Pulsa **Emitir e imprimir** una sola vez.

El sistema guarda la factura, asigna su número definitivo y abre el documento para imprimir. Espera a que termine el proceso para evitar duplicidades.

## 9. Consultar la factura

1. Entra en **Listado de facturas**.
2. Selecciona **Sin IVA** en el filtro **Origen**.
3. Filtra por fecha, factura o cliente.
4. Pulsa el icono de visualización para abrirla.

Desde el historial también puedes enviarla por email, exportar los resultados a Excel o incluirla en la impresión del libro de ventas.

## 10. Corregir una factura emitida

No edites ni elimines directamente una factura emitida. Ábrela desde el historial y utiliza **Crear rectificativa** cuando sea necesario. Indica el tipo, fecha, importe —si es parcial— y motivo de la corrección.

## 11. Errores frecuentes

### No aparece Facturas sin IVA

El módulo no está habilitado para el taller o tu cuenta no tiene acceso.

### Falta un método de pago

En una operación al contado con total positivo debes seleccionar al menos uno y asignar el importe completo.

### El sistema solicita una cuenta bancaria

Transferencia, TPV y Bizum necesitan una cuenta bancaria activa.

### El IVA no se puede modificar

Es el comportamiento previsto: esta modalidad fuerza una tasa del 0 %.

### No se puede emitir

Comprueba que exista un cliente y al menos una línea con descripción, cantidad mayor que cero y precio válido.

## 12. Buenas prácticas

- Verifica la causa fiscal antes de emitir.
- Conserva la documentación que respalda el IVA 0 %.
- Explica el motivo en observaciones cuando corresponda.
- No confundas una factura sin IVA con una factura ordinaria bonificada.
- Usa siempre la modalidad especial para conservar su serie independiente.
- Corrige errores mediante una factura rectificativa.

## 13. Resumen rápido

1. Abre **Facturas sin IVA**.
2. Selecciona o registra al cliente.
3. Añade los conceptos manuales.
4. Comprueba que IVA sea 0 %.
5. Registra el pago.
6. Pulsa **Emitir e imprimir**.
7. Consulta el documento en el historial con origen **Sin IVA**.

