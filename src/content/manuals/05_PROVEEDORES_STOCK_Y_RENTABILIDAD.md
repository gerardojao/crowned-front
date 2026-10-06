# Manual de usuario: proveedores, stock y rentabilidad

**Aplicación:** ZagaPro / MasterTouch  
**Módulo:** Proveedores  
**Versión:** 1.0  
**Última revisión:** 5 de octubre de 2026

## 1. ¿Para qué sirve este módulo?

El módulo **Proveedores** permite:

- Registrar y consultar proveedores de repuestos, materiales y servicios.
- Editar o eliminar proveedores registrados.
- Dar de alta repuestos y controlar sus existencias.
- Detectar artículos con stock bajo.
- Consultar el coste y el valor de venta de los repuestos.
- Analizar la ganancia obtenida en las líneas de facturas emitidas.

El acceso disponible puede variar según la configuración del taller y los permisos del usuario.

## 2. Acceder al módulo

1. Inicia sesión y comprueba que estás trabajando en el taller correcto.
2. En la pantalla principal, entra en **Proveedores**.
3. Selecciona la opción que necesites:
   - **Registrar proveedor**.
   - **Ver proveedores**.
   - **Stock / Rentabilidad**.

## 3. Registrar un proveedor

1. Entra en **Proveedores** y pulsa **Registrar proveedor**.
2. Completa los datos del formulario.
3. Revisa especialmente el nombre y el NIF/CIF.
4. Pulsa **Registrar proveedor**.
5. Comprueba que aparece el mensaje de confirmación.

### Datos del proveedor

| Campo | Uso |
|---|---|
| **Nombre** | Nombre comercial o razón social. Es obligatorio. |
| **Teléfono** | Número de contacto del proveedor. |
| **Email** | Correo electrónico para comunicaciones. |
| **NIF/CIF** | Identificación fiscal. Es obligatoria. |
| **Categoría** | Tipo de suministro, por ejemplo: repuestos, pintura o neumáticos. |
| **Dirección** | Dirección postal. |
| **Código postal** | Código postal de la dirección. |
| **Población** | Municipio o localidad. |
| **Provincia** | Provincia correspondiente. |
| **Clasificación** | Selecciona **Particular** o **Empresa**. |
| **Observaciones** | Información adicional útil para el taller. |

Si necesitas cancelar la introducción de datos y empezar de nuevo, pulsa **Limpiar**.

## 4. Ver y buscar proveedores

La sección **Proveedores registrados** muestra los proveedores existentes y sus datos principales:

- Nombre del proveedor.
- Teléfono.
- Email.
- Categoría.

Para localizar uno:

1. Escribe un dato en **Buscar proveedor**.
2. Revisa los resultados filtrados.
3. Utiliza **Anterior** o **Siguiente** si existen varias páginas.

Mantener una categoría coherente facilita distinguir rápidamente proveedores de recambios, pintura, neumáticos u otros servicios.

## 5. Editar un proveedor

1. Localiza el proveedor en **Proveedores registrados**.
2. Pulsa **Editar**.
3. Modifica los datos necesarios en el formulario.
4. Pulsa **Actualizar proveedor**.
5. Comprueba el mensaje **Proveedor actualizado correctamente**.

Pulsa **Limpiar** si deseas salir de la edición sin guardar los cambios introducidos.

## 6. Eliminar un proveedor

1. Busca el proveedor que deseas eliminar.
2. Pulsa **Eliminar**.
3. Lee el aviso de confirmación.
4. Confirma solamente si has seleccionado el proveedor correcto.

Antes de eliminarlo, comprueba si se utiliza en repuestos o registros históricos. La información de documentos ya emitidos puede ser necesaria para conservar la trazabilidad del taller.

## 7. Abrir Stock / Rentabilidad

Desde **Proveedores**, entra en **Stock / Rentabilidad**. La pantalla contiene dos pestañas:

- **Inventario:** altas, existencias, costes y precios de repuestos.
- **Facturados:** rentabilidad de conceptos incluidos en facturas emitidas.

## 8. Resumen del inventario

En la parte superior de **Inventario** aparecen tres indicadores:

- **Unidades:** suma de las unidades actualmente registradas.
- **Valor compra:** suma del precio de compra por la cantidad existente de cada artículo.
- **Stock bajo:** número de artículos cuya cantidad es igual o inferior al stock mínimo indicado.

Estos indicadores se actualizan según los datos guardados en el inventario.

## 9. Registrar un repuesto en stock

1. Abre la pestaña **Inventario**.
2. Completa los datos del repuesto.
3. Selecciona el proveedor correspondiente, si se conoce.
4. Pulsa **Registrar repuesto**.
5. Comprueba que el artículo aparece en **Inventario actual**.

### Datos del repuesto

| Campo | Uso |
|---|---|
| **Referencia** | Código interno o referencia del fabricante. |
| **Factura / albarán** | Documento con el que entró el material. |
| **Nombre** | Descripción del repuesto. Es obligatorio. |
| **Marca** | Fabricante o marca comercial. |
| **Categoría** | Familia del artículo. |
| **Cantidad** | Unidades disponibles. |
| **Stock mínimo** | Nivel a partir del cual el sistema avisará de stock bajo. |
| **Precio compra** | Coste unitario para el taller. |
| **Precio venta** | Precio unitario previsto para el cliente. |
| **Proveedor** | Empresa o persona que suministró el artículo. |

Registra los importes unitarios, no el total de la factura. La cantidad será la que permita calcular el valor agregado del inventario.

Si el proveedor todavía no existe y la pantalla ofrece el alta rápida, puedes registrarlo desde allí. Para completar todos sus datos, es preferible utilizar **Registrar proveedor**.

## 10. Consultar el inventario

La sección **Inventario actual** permite consultar, entre otros datos:

- Fecha de registro.
- Referencia.
- Factura o albarán.
- Nombre y marca del repuesto.
- Proveedor.
- Stock actual y mínimo.
- Precio de compra y precio de venta.

Utiliza el buscador para localizar información por factura, albarán, referencia, nombre, marca, categoría o proveedor.

Activa el filtro **Stock bajo** para ver únicamente los artículos que necesitan revisión o reposición.

## 11. Editar un repuesto

1. Localiza el artículo en **Inventario actual**.
2. Pulsa el icono de edición.
3. Modifica la referencia, descripción, proveedor, precios u otros datos.
4. Pulsa **Guardar cambios**.

Cambiar el precio de compra del artículo ayuda a mantener actualizado el valor del inventario, pero no debe utilizarse para alterar sin justificación el coste histórico de operaciones ya facturadas.

## 12. Ajustar la cantidad de stock

1. Busca el artículo.
2. Pulsa **Stock**.
3. Introduce la nueva cantidad disponible.
4. Guarda el ajuste.

La cantidad no puede ser negativa. Antes de confirmar, verifica físicamente las existencias cuando el ajuste se deba a una diferencia de inventario.

## 13. Eliminar un repuesto

1. Localiza el artículo.
2. Pulsa el icono de eliminación.
3. Confirma en la ventana **Eliminar repuesto**.

No elimines un artículo únicamente porque su cantidad sea cero. Conservarlo puede ser útil si volverá a comprarse o si se necesita consultar su referencia y proveedor.

## 14. Exportar el inventario

Utiliza la opción de exportación a Excel para obtener un archivo con la información del inventario, incluyendo:

- Fecha.
- Referencia.
- Factura o albarán.
- Repuesto y marca.
- Proveedor.
- Stock actual y mínimo.
- Precios de compra y venta.

El archivo puede utilizarse para recuentos, compras y revisiones internas.

## 15. Consultar la rentabilidad de artículos facturados

1. Abre **Stock / Rentabilidad**.
2. Selecciona la pestaña **Facturados**.
3. Filtra por fechas o utiliza el buscador.
4. Revisa los totales y el detalle de cada factura.

Puedes buscar por número de factura, cliente, matrícula o concepto. Las líneas aparecen agrupadas por factura y muestran datos como proveedor, cantidad, compra, venta, ganancia y porcentaje de utilidad.

### Indicadores principales

- **Total venta:** importe vendido de las líneas incluidas en el resultado.
- **Total compra:** coste registrado para esas líneas.
- **Ganancia:** diferencia entre venta y compra.

### Cálculos utilizados

- **Total compra de una línea** = precio de compra unitario × cantidad.
- **Total venta de una línea** = precio de venta unitario × cantidad.
- **Ganancia** = total de venta − total de compra.
- **% utilidad** = ganancia ÷ total de compra × 100.

Si una línea no tiene precio de compra, el porcentaje de utilidad no puede calcularse correctamente y puede mostrarse sin valor.

> **Importante:** esta pantalla muestra el margen bruto de los conceptos facturados. No representa el beneficio neto del taller, porque no descuenta nóminas, alquiler, impuestos, suministros ni otros gastos generales.

## 16. Corregir una línea de rentabilidad

Si una línea facturada no tiene proveedor o coste correcto:

1. Localiza la factura en **Facturados**.
2. Pulsa la acción de edición de la línea.
3. Selecciona el proveedor correcto.
4. Introduce o corrige el precio de compra.
5. Guarda los cambios.
6. Comprueba el mensaje **Línea de rentabilidad actualizada correctamente**.

Realiza esta corrección con respaldo documental, por ejemplo la factura o el albarán del proveedor.

## 17. Flujo recomendado de trabajo

1. Registra al proveedor con sus datos fiscales y de contacto.
2. Registra el repuesto recibido, indicando factura o albarán, coste, precio de venta y cantidad.
3. Define un stock mínimo adecuado.
4. Utiliza el repuesto en el proceso de trabajo y facturación correspondiente.
5. Revisa la pestaña **Facturados** para comprobar el margen obtenido.
6. Corrige proveedor o coste solamente cuando falte información o exista un error verificable.

## 18. Errores frecuentes

### No puedo guardar el proveedor

- Comprueba que **Nombre** y **NIF/CIF** están informados.
- Revisa que el formato del email sea correcto.
- Evita registrar dos veces al mismo proveedor.

### El repuesto aparece como stock bajo

- Comprueba la cantidad actual.
- Revisa si el stock mínimo definido es correcto.
- Actualiza la cantidad después de recibir o contar mercancía.

### La rentabilidad parece demasiado alta

- Verifica que existe un precio de compra.
- Comprueba que el coste introducido es unitario.
- Revisa la cantidad facturada y el proveedor asociado.

### La ganancia es negativa

Significa que el coste registrado supera el importe de venta de la línea. Revisa los datos antes de concluir que existe una pérdida real.

### No veo Stock / Rentabilidad

La función puede depender de la configuración del taller o de los permisos de tu cuenta. Consulta con un administrador.

## 19. Buenas prácticas

- Utiliza siempre el mismo proveedor existente; evita duplicados con nombres ligeramente diferentes.
- Registra la factura o el albarán de entrada para mantener la trazabilidad.
- Introduce precios de compra reales y unitarios.
- Revisa periódicamente el filtro **Stock bajo**.
- Realiza recuentos físicos y corrige las diferencias justificadas.
- No confundas margen bruto de repuestos con beneficio neto del negocio.
- Conserva la documentación del proveedor que respalda cada coste.

## 20. Resumen rápido

1. **Proveedores → Registrar proveedor** para crear la ficha.
2. **Proveedores → Ver proveedores** para buscar, editar o eliminar.
3. **Stock / Rentabilidad → Inventario** para registrar y controlar repuestos.
4. Usa **Stock bajo** para planificar reposiciones.
5. Abre **Facturados** para revisar venta, compra, ganancia y porcentaje de utilidad.

