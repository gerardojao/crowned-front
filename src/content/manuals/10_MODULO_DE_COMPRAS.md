# Manual de usuario: módulo de compras

**Aplicación:** ZagaPro / MasterTouch  
**Módulo:** Compras  
**Versión:** 1.0  
**Última revisión:** 6 de octubre de 2026

## 1. ¿Para qué sirve el módulo?

El módulo **Compras** centraliza los documentos y pagos relacionados con proveedores. Permite:

- Registrar facturas y facturas simplificadas recibidas.
- Registrar rappels y abonos de proveedor.
- Controlar facturas pendientes, vencimientos y pagos parciales.
- Gestionar saldos a favor y devoluciones bancarias.
- Registrar gastos pagados al contado que no tienen factura ni IVA.
- Registrar entradas de material mediante albaranes.
- Crear una factura agrupando uno o varios albaranes.
- Consultar y exportar el libro de compras.

El módulo debe estar habilitado en la configuración del taller. Algunas operaciones requieren cuentas bancarias activas.

## 2. Acceder al módulo

1. Inicia sesión y comprueba el taller activo.
2. Abre el menú principal.
3. Entra en **Compras**.

La pantalla presenta indicadores generales y seis pestañas:

1. **Dashboard**.
2. **Facturas proveedor**.
3. **Cuentas por pagar**.
4. **Gastos varios**.
5. **Libro de compras**.
6. **Albaranes**.

También existen accesos rápidos para crear una factura, un albarán, un gasto vario o abrir el libro de compras.

## 3. Indicadores principales

En la parte superior aparecen:

- **Pendiente de pago:** importe todavía adeudado a proveedores.
- **Facturas vencidas:** documentos pendientes considerados vencidos.
- **Compras del mes:** total de documentos activos del mes.
- **IVA soportado:** IVA registrado en las compras del mes.

Los abonos, rappels, anulaciones y saldos a favor pueden reducir los totales. Utiliza el libro de compras para revisar el detalle.

## 4. Dashboard

La pestaña **Dashboard** resume los documentos que necesitan atención, especialmente:

- Facturas pendientes de pago.
- Pagos y saldos a favor pendientes.
- Albaranes pendientes de facturar.

Úsala como punto de partida diario, pero consulta cada pestaña para ver todos los datos y realizar operaciones.

## 5. Preparación recomendada

Antes de registrar compras:

- Da de alta a los proveedores habituales.
- Configura las cuentas bancarias del taller.
- Define correctamente los tipos de gasto.
- Conserva la factura, ticket o albarán original.
- Comprueba fechas, números, bases imponibles e IVA en el documento recibido.

Evita registrar dos veces el mismo documento.

# Facturas de proveedor

## 6. Registrar una factura recibida

1. Abre **Facturas proveedor**.
2. Pulsa **Registrar factura**.
3. Completa los datos del documento.
4. Añade una o varias bases de IVA.
5. Revisa el resumen.
6. Pulsa **Guardar factura**.

### Datos principales

| Campo | Uso |
|---|---|
| **Fecha** | Fecha del documento recibido. |
| **Proveedor** | Proveedor que emitió el documento. |
| **N.º factura** | Número asignado por el proveedor. |
| **Referencia** | Referencia interna o adicional, opcional. |
| **Tipo documento** | Factura, factura simplificada, Rappel o Abono. |
| **Tipo de gasto** | Clasificación contable o de gestión. |
| **Descripción** | Concepto general de la compra. |
| **Estado** | Pendiente de pago o Pagada. |
| **Vencimiento** | Fecha prevista de pago si queda pendiente. |
| **Método de pago** | Efectivo o cuenta bancaria si ya está pagada. |

El número es obligatorio para los documentos de tipo **Factura**. Aun cuando otro tipo permita omitirlo, registra siempre el identificador del documento cuando exista.

## 7. Seleccionar o crear un proveedor

Utiliza el buscador del campo **Proveedor**. Si todavía no existe:

1. Pulsa **+ Nuevo**.
2. Completa como mínimo **Nombre** y **NIF/CIF**.
3. Añade teléfono, categoría y email si están disponibles.
4. Pulsa **Crear proveedor**.

El proveedor se crea y queda seleccionado en la factura. Para completar dirección, población, provincia u otros datos, utiliza posteriormente el módulo general de proveedores.

## 8. Tipos de documento recibido

### Factura

Documento ordinario del proveedor. Su total debe ser distinto de cero y puede ser positivo o negativo. Una factura con total negativo genera un saldo a favor del taller.

### Factura simplificada

Utilízala para tickets o facturas simplificadas que cumplan los requisitos correspondientes.

### Rappel

Registra una bonificación comercial recibida del proveedor. El total debe introducirse en negativo.

### Abono

Corrige total o parcialmente una factura de proveedor ya registrada:

1. Selecciona **Abono**.
2. Elige la **Factura original** del mismo proveedor.
3. Introduce las bases en negativo.
4. Guarda el documento.

El total de un abono debe ser negativo. No uses un abono sin vincularlo a la factura que corrige.

## 9. Introducir bases e IVA

En **Bases de la factura**:

1. Introduce la base imponible.
2. Selecciona el IVA aplicable: 0 %, 4 %, 10 % o 21 %.
3. Comprueba el IVA y el total calculados.
4. Pulsa **+ Agregar línea** si el documento tiene varios tipos de IVA.
5. Usa **Quitar** para eliminar una base incorrecta.

El resumen muestra:

- Base total.
- IVA total.
- Total del documento.

Las bases negativas se utilizan para abonos, rappels o documentos que generan saldo a favor. Copia el desglose del documento original y no mezcles tipos de IVA.

## 10. Registrar una factura ya pagada

1. Selecciona el estado **Pagada**.
2. Elige **Efectivo** o una cuenta bancaria.
3. Guarda la factura.

El sistema registra el documento y su pago. Si no hay una cuenta adecuada, no selecciones otra como sustitución; configura la cuenta correcta o registra el pago en efectivo solo si fue realmente así.

## 11. Registrar una factura pendiente

1. Selecciona **Pendiente de pago**.
2. Introduce la fecha de vencimiento.
3. Guarda la factura.

El documento aparecerá en **Cuentas por pagar**, desde donde podrás registrar abonos parciales o liquidarlo.

## 12. Buscar facturas recibidas

La lista de facturas permite:

- Buscar por número, proveedor, referencia o descripción.
- Filtrar por estado: pendiente, pagada parcialmente, pagada o anulada.
- Elegir 10, 20 o 50 resultados por página.
- Consultar los albaranes vinculados.

Revisa el listado después de guardar para confirmar que el documento quedó registrado una sola vez.

# Cuentas por pagar

## 13. Consultar deudas con proveedores

Abre **Cuentas por pagar** para ver documentos con saldo pendiente. La tabla muestra:

- Fecha y proveedor.
- Tipo y número de documento.
- Referencia.
- Base, IVA y total.
- Importe pagado.
- Saldo.
- Estado y vencimiento.

Puedes buscar por documento, referencia, proveedor o descripción, además de filtrar por fechas de factura y vencimiento.

## 14. Registrar un pago parcial

1. Localiza la factura.
2. Pulsa **Pago parcial**.
3. Introduce el importe abonado.
4. Selecciona la fecha de pago.
5. Selecciona Efectivo o la cuenta bancaria utilizada.
6. Pulsa **Registrar abono**.

El importe debe ser mayor que cero y no puede superar el saldo pendiente. Después del registro, el documento quedará como pagado parcialmente y mostrará el nuevo saldo.

## 15. Liquidar una factura

1. Localiza la factura.
2. Pulsa **Liquidar**.
3. Revisa la fecha.
4. Selecciona el método de pago real.
5. Confirma con **Liquidar**.

El sistema aplica el saldo completo pendiente. Comprueba que la factura desaparece de la lista de deudas o figura como pagada en los demás listados.

## 16. Saldos a favor del taller

Un abono, rappel o factura negativa puede generar crédito a favor del taller. En **Cuentas por pagar** se identifica de forma separada y no debe tratarse como una deuda.

Si el proveedor devuelve el dinero:

1. Pulsa **Registrar devolución**.
2. Selecciona la cuenta bancaria en la que entró el dinero.
3. Introduce la fecha e importe.
4. Añade la referencia del ingreso bancario.
5. Confirma **Registrar devolución**.

Registra únicamente devoluciones que realmente hayan sido recibidas. Si el proveedor compensa el saldo en otra factura, conserva la documentación y sigue el procedimiento administrativo establecido por el taller.

## 17. Exportar cuentas por pagar

1. Aplica los filtros necesarios.
2. Pulsa **Exportar Excel**.
3. Revisa el archivo generado.

La exportación sirve para planificación de tesorería y conciliación. Confirma que el periodo y los filtros sean correctos.

# Gastos varios

## 18. Cuándo utilizar Gastos varios

Esta pestaña está destinada a gastos:

- Sin factura.
- Sin IVA deducible.
- Pagados al contado en el momento del registro.

No registres aquí una factura de proveedor ni un documento con IVA. Utiliza **Facturas proveedor**.

## 19. Registrar un gasto vario

1. Abre **Gastos varios**.
2. Pulsa **Registrar gasto**.
3. Completa:
   - Número de comprobante.
   - Fecha.
   - Importe.
   - Nombre del proveedor.
   - Tipo de gasto.
   - Método de pago.
   - Descripción opcional.
4. Pulsa **Guardar gasto**.

El movimiento aumenta los gastos por el importe indicado, registra el pago y utiliza IVA 0.

## 20. Consultar, editar o eliminar gastos varios

Puedes buscar por comprobante, proveedor, descripción o tipo, filtrar por fechas y exportar a Excel.

- Pulsa **Editar gasto** para corregirlo.
- Pulsa **Eliminar gasto** y confirma solamente si el registro es incorrecto.

Conserva el comprobante físico o digital que justifique el movimiento.

# Albaranes de proveedor

## 21. ¿Para qué sirve un albarán?

El albarán registra una entrada de material antes de recibir o registrar la factura definitiva. Puede quedar:

- Pendiente de factura.
- Vinculado a una factura.
- Anulado.

Al guardar sus líneas, se registra la entrada de los artículos y se conserva la trazabilidad con el proveedor.

## 22. Registrar un albarán

1. Abre **Albaranes**.
2. Pulsa **Nuevo albarán**.
3. Selecciona el proveedor.
4. Introduce número, fecha y observaciones.
5. Añade las líneas recibidas.
6. Revisa el total de compra.
7. Pulsa **Guardar albarán**.

Proveedor y número de albarán son necesarios. Copia el número exactamente como aparece en el documento.

## 23. Completar las líneas del albarán

Cada línea incluye:

- Referencia.
- Nombre del artículo.
- Marca.
- Cantidad.
- PVP o precio indicado en la entrada.
- Descuento porcentual.
- Precio de compra neto calculado.

Puedes buscar una referencia existente para asociar la entrada con un artículo de stock. Si es una pieza nueva, completa cuidadosamente referencia, nombre, marca y precios.

El precio de compra neto se calcula después del descuento. Revisa las cantidades y los importes antes de guardar, ya que afectan al inventario y a la rentabilidad.

## 24. Editar, consultar o anular un albarán

La lista permite:

- Buscar por número, proveedor, referencia o nombre.
- Filtrar por estado.
- Abrir el detalle.
- Editar albaranes permitidos.
- Exportar los resultados a Excel.

Si un albarán no debe conservarse como entrada válida, utiliza la opción de anulación e indica el motivo. No anules un albarán solo porque ya fue facturado: su estado debe pasar a **Facturado** al vincularse.

## 25. Crear una factura desde albaranes

1. Filtra los albaranes en estado **Pendiente factura**.
2. Selecciona uno o varios albaranes del mismo proveedor.
3. Pulsa **Crear factura desde selección**.
4. Introduce número y fecha de factura.
5. Selecciona **Pendiente de pago** o **Pagada**.
6. Añade vencimiento o método de pago según el estado.
7. Completa referencia y descripción.
8. Distribuye la base entre los tipos de IVA.
9. Comprueba que la diferencia sea 0,00 €.
10. Pulsa **Crear factura**.

No se pueden agrupar albaranes de proveedores diferentes.

## 26. Desglose de IVA al facturar albaranes

La base total de los albaranes debe distribuirse entre:

- Base 21 %.
- Base 10 %.
- Base 4 %.
- Base 0 % o exenta.

Si la factura incluye descuento, penalización o redondeo:

1. Escribe el **Concepto ajuste**.
2. Introduce el **Importe ajuste** con su signo correcto.
3. Selecciona el IVA del ajuste.
4. Revisa base ajustada, IVA, total y diferencia.

No podrás crear correctamente la factura si la suma del desglose no coincide con la base ajustada. La diferencia debe ser 0,00 €.

Tras crearla, los albaranes quedan vinculados y pasan a estado **Facturado**.

# Libro de compras

## 27. Consultar el libro de compras

El **Libro de compras** reúne:

- Facturas recibidas.
- Facturas simplificadas.
- Rappels.
- Abonos.

Puedes filtrar por:

- Fecha desde y hasta.
- Estado.
- Tipo de documento.
- Proveedor, número o referencia.

## 28. Interpretar el libro

Los indicadores muestran:

- Base.
- IVA.
- Total.
- Pagado.
- Saldo.

La tabla separa las bases e IVA al 0 %, 4 %, 10 % y 21 %. Cuando un documento contiene más de un tipo, se identifica como IVA **Mixto**.

Los documentos negativos reducen los totales. Revisa abonos y rappels cuando las cifras no coincidan con una suma simple de facturas positivas.

## 29. Exportar el libro de compras

1. Define el periodo.
2. Aplica estado, tipo o búsqueda si corresponde.
3. Revisa los totales en pantalla.
4. Pulsa **Exportar Excel**.

Entrega la exportación a administración o asesoría junto con los documentos originales cuando sea necesario. La exportación no sustituye la comprobación fiscal.

# Flujo recomendado y control

## 30. Flujo recomendado con factura directa

1. Recibe la factura del proveedor.
2. Comprueba proveedor, número, fecha, bases e IVA.
3. Regístrala como pagada o pendiente.
4. Si queda pendiente, registra posteriormente cada pago desde **Cuentas por pagar**.
5. Revisa el documento en **Libro de compras**.

## 31. Flujo recomendado con albaranes

1. Recibe el material y su albarán.
2. Registra las líneas y verifica físicamente las cantidades.
3. Mantén el albarán pendiente hasta recibir la factura.
4. Selecciona todos los albaranes incluidos en esa factura.
5. Crea la factura y distribuye correctamente el IVA.
6. Gestiona el pago desde **Cuentas por pagar**.
7. Comprueba que los albaranes figuran como facturados.

## 32. Errores frecuentes

### No encuentro al proveedor

Utiliza **+ Nuevo** para el alta rápida o regístralo en el módulo de proveedores.

### No puedo registrar una factura pagada

Selecciona Efectivo o una cuenta bancaria activa.

### La factura no aparece en Cuentas por pagar

Comprueba que su estado sea pendiente y que tenga saldo positivo. Los saldos a favor se muestran con tratamiento diferente.

### No puedo agrupar albaranes

Todos deben estar pendientes de facturar y pertenecer al mismo proveedor.

### El desglose de IVA no coincide

Reparte toda la base ajustada entre 0 %, 4 %, 10 % y 21 %. Revisa también el signo y el IVA de cualquier ajuste.

### El abono o Rappel es rechazado

Debe tener total negativo. Para un abono, selecciona además la factura original.

### El stock o coste parece incorrecto

Revisa referencia, cantidad, precio y descuento del albarán. Comprueba si se seleccionó el artículo de inventario correcto.

### No hay bancos disponibles

Puedes registrar Efectivo solamente si ese fue el método real. En otro caso, un administrador debe crear o activar la cuenta bancaria.

## 33. Buenas prácticas

- Registra cada documento una sola vez.
- Copia exactamente el número del proveedor.
- Conserva factura, ticket, albarán y justificante de pago.
- No marques una factura como pagada antes del movimiento real.
- Registra pagos parciales por separado y con su fecha efectiva.
- Vincula los abonos con su factura original.
- No mezcles albaranes de proveedores distintos.
- Comprueba físicamente el material antes de registrar la entrada.
- Revisa el desglose de IVA contra el documento recibido.
- Concilia periódicamente cuentas por pagar con bancos y caja.
- Exporta el libro de compras por periodos cerrados y revísalo con administración.

## 34. Resumen rápido

1. **Dashboard:** revisa pendientes y albaranes sin facturar.
2. **Facturas proveedor:** registra facturas, tickets, rappels y abonos.
3. **Cuentas por pagar:** registra pagos parciales, liquidaciones y devoluciones.
4. **Gastos varios:** registra gastos sin factura, sin IVA y pagados al contado.
5. **Albaranes:** registra entradas y conviértelas en factura al recibirla.
6. **Libro de compras:** revisa bases, IVA, totales, pagos y saldos.

