# Manual de usuario: órdenes de trabajo

**Aplicación:** ZagaPro / MasterTouch  
**Módulo:** Órdenes de trabajo  
**Versión:** 1.0  
**Última revisión:** 5 de octubre de 2026

## 1. ¿Para qué sirve una orden?

La orden de trabajo controla la ejecución de una reparación o servicio. Reúne:

- Cliente y vehículo.
- Recepción y entrega prevista.
- Trabajo solicitado o realizado.
- Servicios, mano de obra y repuestos.
- Coste estimado.
- Estado operativo.
- Fotos de recepción.
- Documentos, valoración y factura.

La orden puede crearse directamente o a partir de una preorden.

## 2. Crear desde una preorden

Esta es la opción recomendada cuando el vehículo ya fue recibido mediante preorden:

1. Entra en **Preórdenes**.
2. Localiza la recepción.
3. Pulsa **Convertir en orden**.
4. Revisa los datos cargados.
5. Añade trabajos y costes.
6. Pulsa **Crear orden**.

El sistema relacionará ambos documentos y marcará la preorden como convertida.

## 3. Crear una orden directamente

1. Entra en **Órdenes de trabajo**.
2. Utiliza **Buscar cliente registrado**.
3. Selecciona el cliente y su vehículo.
4. Si no existen, utiliza el alta rápida.
5. Completa recepción, trabajo y costes.
6. Pulsa **Crear orden**.

## 4. Seleccionar o registrar cliente

- Busca por nombre, teléfono, matrícula o modelo.
- Si el cliente tiene varios vehículos, selecciona el correcto.
- Para un cliente nuevo, pulsa **Registrar nuevo** y después **Guardar cliente nuevo**.
- Para añadir otro vehículo a un cliente existente, pulsa **Agregar otro vehículo** y después **Guardar vehículo en cliente**.

No crees un cliente nuevo sin comprobar antes si ya existe.

## 5. Datos principales

### Cliente y vehículo

Los campos fundamentales son:

- Cliente: obligatorio.
- Matrícula: obligatoria.
- Modelo: obligatorio.
- Teléfono: recomendado para avisos.
- DNI/NIE, dirección y clasificación: opcionales.
- Marca, bastidor, matriculación, kilometraje, combustible, motor, CV y KW: opcionales.

### Recepción

- Fecha de recepción.
- Fecha prevista de entrega.
- Tiempo estimado en horas.
- Tipo de operación.
- Estado inicial.

Las órdenes nuevas se crean con estado **Recibido**.

## 6. Añadir trabajo y costes

### Servicios frecuentes

1. Abre **Agregar servicio frecuente**.
2. Selecciona el servicio.
3. Se añadirá una línea de trabajo.
4. Indica tiempo o cantidad y precio.

También puedes escribir un nuevo servicio frecuente y pulsar **Guardar servicio** para incorporarlo al catálogo.

### Líneas manuales

Si está disponible, pulsa **Agregar línea** y completa:

- Código.
- Sección.
- Descripción.
- Tiempo o cantidad.
- Precio unitario.
- Descuento e IVA, cuando estén habilitados.

### Repuestos

1. Busca la pieza en el apartado **Repuesto**.
2. Selecciona el artículo correcto.
3. Pulsa **Agregar**.
4. Revisa cantidad, precio y descripción.

El total estimado se recalcula automáticamente. Utiliza el icono de papelera de una línea para retirarla.

### Observaciones

Utiliza **Observaciones internas** para información operativa que no forme parte de la descripción principal del trabajo.

## 7. Guardar y editar

- Pulsa **Crear orden** para registrar una orden nueva.
- Pulsa **Actualizar orden** cuando estés editando.
- Pulsa **Limpiar** para abandonar el formulario sin guardar.

Una orden facturada queda bloqueada para edición. Si necesitas corregir una factura, utiliza el procedimiento correspondiente de facturación o rectificación.

## 8. Estados de la orden

El estado se cambia desde la tarjeta de la orden. El flujo disponible es controlado por el sistema:

1. **Recibido**.
2. **Diagnóstico** o **Reparando**.
3. **Esperando repuesto**, cuando corresponda.
4. **Repuesto recibido**.
5. **Reparando**.
6. **Terminado**.
7. **Entregado**.

Consideraciones:

- Al marcar **Terminado**, el sistema solicita confirmación.
- El botón **Facturar** aparece cuando la orden está terminada.
- Una orden solo puede marcarse como **Entregado** después de estar facturada.
- Al marcarla como terminada puede aparecer la opción de avisar al cliente por WhatsApp, si el módulo está habilitado.

## 9. Buscar y filtrar órdenes

Pulsa **Ver órdenes** para abrir el listado. Puedes buscar o filtrar por:

- Matrícula.
- Cliente o empresa.
- Número de orden usando `#` o el número.
- Estado.
- Facturada o sin facturar.
- Activa, archivada o todas.
- Fecha inicial y final.

Utiliza **Limpiar** para retirar todos los filtros. El botón **Exportar Excel** descarga el resultado correspondiente a los filtros aplicados.

## 10. Acciones disponibles

Según el estado y configuración, una orden puede ofrecer:

- **Imprimir:** documento de la orden.
- **Valoración:** documento de valoración.
- **Ver preorden:** recepción vinculada, si existe.
- **Fotos:** consultar o gestionar fotos de recepción.
- **Editar:** disponible mientras no esté facturada ni archivada.
- **Facturar:** disponible cuando está terminada y aún no está facturada.
- **Archivar:** retira una orden activa del listado habitual sin perderla.
- **Reimprimir factura:** disponible después de facturar.

## 11. Facturar una orden

1. Completa todos los trabajos y costes.
2. Cambia el estado a **Terminado**.
3. Pulsa **Facturar**.
4. Revisa datos fiscales, líneas, base imponible, IVA y total.
5. Emite la factura.
6. Regresa al listado para comprobar que la orden aparece como facturada.

Después de facturar:

- La edición de la orden queda bloqueada.
- Aparece **Reimprimir factura**.
- Podrá avanzarse a **Entregado**.

## 12. Archivar una orden

Utiliza **Archivar** para retirar una orden no facturada del listado activo conservando su historial.

Para consultarla después:

1. Abre **Ver órdenes**.
2. En el filtro de archivo, selecciona **Archivadas** o **Todas**.

No confundas archivar con eliminar definitivamente.

## 13. Errores frecuentes

- **No aparece el formulario:** selecciona cliente y vehículo o utiliza el alta rápida.
- **No aparece Facturar:** la orden debe estar en estado Terminado y no estar facturada.
- **No se puede editar:** comprueba si está facturada o archivada.
- **No se puede entregar:** primero debe facturarse.
- **No aparece Ver preorden:** la orden se creó directamente y no tiene preorden asociada.
- **El total no es correcto:** revisa cantidades, tiempos, precios, descuentos e IVA de cada línea.
- **No encuentro una orden:** limpia filtros y comprueba Activas, Archivadas o Todas.

## 14. Buenas prácticas

- Registrar el kilometraje de entrada.
- Mantener actualizada la entrega prevista.
- Cambiar el estado conforme avanza el trabajo.
- Separar mano de obra y repuestos en líneas claras.
- Revisar el total antes de marcar Terminado.
- No facturar hasta verificar cliente, vehículo, trabajos, impuestos y precios.
- Archivar solo cuando realmente se quiera retirar la orden del trabajo activo.

## 15. Resumen rápido

1. Selecciona cliente y vehículo.
2. Completa recepción y tipo de operación.
3. Añade servicios, mano de obra y repuestos.
4. Revisa el total.
5. Pulsa **Crear orden**.
6. Actualiza su estado durante el trabajo.
7. Al finalizar, marca **Terminado**.
8. Pulsa **Facturar**.
9. Después de la entrega, marca **Entregado**.

