# Manual de usuario: crear clientes y vehículos

**Aplicación:** ZagaPro / MasterTouch  
**Módulo:** Clientes  
**Versión del documento:** 1.0  
**Última revisión:** 4 de octubre de 2026

## 1. Objetivo

Este manual explica cómo:

- Comprobar si un cliente ya está registrado.
- Crear un cliente nuevo.
- Registrar su vehículo al mismo tiempo.
- Añadir más vehículos a un cliente existente.
- Editar los datos del cliente o de sus vehículos.

## 2. Acceso al módulo

1. Inicia sesión en ZagaPro.
2. Comprueba que estás trabajando en el taller correcto.
3. En la pantalla principal, pulsa **Clientes**.
4. Se abrirá la pantalla de búsqueda y gestión de clientes.

> Antes de crear un cliente, realiza siempre una búsqueda. Esto ayuda a evitar clientes y vehículos duplicados.

## 3. Buscar un cliente existente

En la parte superior de la pantalla encontrarás el campo **Buscar cliente registrado**.

Puedes buscar utilizando cualquiera de estos datos:

- Nombre del cliente.
- Teléfono.
- DNI o NIE.
- Correo electrónico.
- Matrícula.
- Marca o modelo del vehículo.
- Número de bastidor.

### Procedimiento

1. Escribe uno de los datos conocidos en el buscador.
2. La lista de resultados se actualizará automáticamente.
3. Revisa el nombre, teléfono, clasificación y número de vehículos registrados.
4. Si encuentras al cliente, no crees uno nuevo. Pulsa **Editar** para consultar o actualizar sus datos y vehículos.
5. Si no aparece, continúa con el registro de un cliente nuevo.

## 4. Crear un cliente con su vehículo

### Paso 1. Abrir el formulario

1. Pulsa **Registrar nuevo cliente**.
2. Se mostrará el formulario **Datos del cliente**.

Si vuelves a pulsar **Ocultar registro**, el formulario se cerrará sin guardar.

### Paso 2. Completar los datos del cliente

Los campos disponibles son:

| Campo | Obligatorio | Uso |
|---|:---:|---|
| Nombre | Sí | Nombre completo o razón social del cliente. |
| DNI/NIE | No | Documento identificativo. Para empresas puede utilizarse el NIF/CIF si procede. |
| Teléfono | Sí | Número principal de contacto. |
| Email | No | Correo para comunicaciones y documentación. |
| Dirección | No | Domicilio del cliente o empresa. |
| Código postal | No | Código postal de la dirección. |
| Población | No | Localidad del cliente. |
| Provincia | No | Provincia correspondiente. |
| Clasificación | No | Particular, Empresa o Compañía de seguro. |
| Observaciones | No | Notas internas relevantes sobre el cliente. |

La clasificación predeterminada es **Particular**.

### Paso 3. Activar el registro del vehículo

1. Localiza el bloque **Registrar vehículo ahora**.
2. Pulsa **Agregar vehículo al cliente**.
3. Aparecerá el formulario con los datos del vehículo.

Si decides guardar únicamente al cliente, puedes pulsar **Quitar vehículo del registro**. En ese caso, el botón final cambiará a **Registrar solo cliente**.

### Paso 4. Completar los datos del vehículo

| Campo | Obligatorio | Uso |
|---|:---:|---|
| Matrícula | Sí | Matrícula o referencia principal del vehículo. |
| Marca | No | Fabricante, por ejemplo Toyota, Renault o Volkswagen. |
| Bastidor | No | Número de bastidor o VIN. |
| Modelo | Sí | Modelo del vehículo. |
| Fecha de matriculación | No | Fecha de primera matriculación. |
| Motor | No | Motorización, por ejemplo 1.6 TDI. |
| KW | No | Potencia expresada en kilovatios. |
| CV | No | Potencia expresada en caballos. |
| Combustible | No | Gasolina, diésel, híbrido, eléctrico, etc. |
| Kilometraje | No | Kilómetros actuales del vehículo. |

### Recomendaciones para los datos del vehículo

- Comprueba la matrícula antes de guardar.
- Introduce el kilometraje sin puntos ni separadores; por ejemplo: `120000`.
- Utiliza los campos KW y CV únicamente con valores numéricos.
- Registra el bastidor cuando esté disponible: facilita la identificación si existe un error en la matrícula.
- Evita abreviaturas diferentes para una misma marca o modelo.

### Paso 5. Guardar

1. Revisa los campos obligatorios:
   - Nombre del cliente.
   - Teléfono.
   - Matrícula.
   - Modelo.
2. Pulsa **Registrar cliente con vehículo**.
3. Espera a que termine el proceso. Mientras se guarda aparecerá el texto **Guardando...**.
4. Si todo es correcto, el sistema mostrará el mensaje **Cliente registrado con vehículo correctamente**.
5. El formulario se cerrará y el nuevo cliente aparecerá en el listado.

> No pulses varias veces el botón mientras aparece “Guardando...”.

## 5. Crear solamente el cliente

También puedes registrar al cliente sin vehículo:

1. Pulsa **Registrar nuevo cliente**.
2. Completa los datos del cliente.
3. No actives **Agregar vehículo al cliente**.
4. Pulsa **Registrar solo cliente**.

El vehículo podrá añadirse posteriormente desde la opción **Editar** del cliente.

## 6. Añadir otro vehículo a un cliente existente

Un mismo cliente puede tener varios vehículos.

1. Busca al cliente por nombre, teléfono, DNI/NIE o matrícula.
2. Pulsa **Editar** en la fila del cliente.
3. Debajo de sus datos aparecerá la sección **Vehículos del cliente**.
4. Pulsa **Agregar vehículo**.
5. Completa como mínimo:
   - Matrícula.
   - Modelo.
6. Completa los demás datos disponibles.
7. Si necesitas más campos, abre **Más información opcional**. Allí podrás registrar datos como:
   - Bastidor.
   - KW y CV.
   - Fecha de matriculación.
   - Última visita.
   - Próxima ITV.
8. Guarda el vehículo.
9. El sistema actualizará la tabla de vehículos del cliente.

El sistema no permite registrar dos veces la misma matrícula para el mismo cliente.

## 7. Editar un cliente

1. Busca al cliente.
2. Pulsa **Editar**.
3. Modifica los datos necesarios.
4. Pulsa **Actualizar cliente**.
5. Confirma la actualización en la ventana que aparece.
6. Comprueba el mensaje **Cliente actualizado correctamente**.

Al editar un cliente, los vehículos se gestionan por separado en la sección **Vehículos del cliente**.

## 8. Editar un vehículo

1. Busca al cliente y pulsa **Editar**.
2. Localiza el vehículo en la sección **Vehículos del cliente**.
3. Pulsa **Editar** en la fila del vehículo.
4. Actualiza los datos necesarios.
5. Guarda los cambios.
6. Comprueba el mensaje **Vehículo actualizado correctamente**.

## 9. Información mostrada en el listado

El listado de clientes muestra:

- Cliente.
- DNI/NIE.
- Teléfono.
- Clasificación.
- Número de vehículos registrados.
- Acciones disponibles: **Editar** y **Eliminar**.

Los clientes se muestran en páginas de diez registros. Utiliza **Anterior** y **Siguiente** para cambiar de página.

## 10. Errores frecuentes

### “La matrícula es requerida”

Has activado el registro del vehículo, pero no has informado la matrícula.

**Solución:** introduce la matrícula o quita el vehículo del registro para guardar solamente al cliente.

### “El modelo es requerido”

Has activado el registro del vehículo, pero el campo Modelo está vacío.

**Solución:** introduce el modelo del vehículo.

### “Este vehículo ya está registrado para el cliente”

El cliente ya tiene un vehículo activo con esa matrícula.

**Solución:** cierra el formulario, revisa la lista de vehículos y edita el vehículo existente.

### El cliente ya existe

Puede haberse registrado con una variación del nombre.

**Solución:** busca por teléfono, DNI/NIE, email, matrícula, marca, modelo o bastidor antes de crear un registro nuevo.

### No aparecen los clientes esperados

**Solución:**

1. Comprueba que has seleccionado el taller correcto.
2. Borra el texto del buscador.
3. Revisa las páginas con **Anterior** y **Siguiente**.
4. Si el problema continúa, cierra sesión, vuelve a entrar y contacta con el responsable.

### No se puede guardar

**Solución:**

1. Revisa los campos obligatorios.
2. Comprueba los valores numéricos de kilometraje, KW y CV.
3. Verifica la conexión a Internet.
4. Lee el mensaje mostrado en la parte superior de la pantalla.
5. Si continúa el error, copia el mensaje y comunícalo al responsable.

## 11. Buenas prácticas

- Buscar siempre antes de crear.
- Usar el teléfono como dato principal de comprobación del cliente.
- Guardar DNI/NIE o NIF/CIF cuando esté disponible.
- Registrar matrícula, modelo y bastidor con precisión.
- Actualizar el kilometraje cuando el vehículo vuelva al taller.
- Utilizar Observaciones solo para información interna útil.
- No crear un cliente diferente por cada vehículo: añade todos sus vehículos al mismo cliente.
- Confirmar que se está trabajando en el taller correcto antes de guardar.

## 12. Resumen rápido

1. Entra en **Clientes**.
2. Busca al cliente.
3. Si no existe, pulsa **Registrar nuevo cliente**.
4. Completa Nombre y Teléfono.
5. Pulsa **Agregar vehículo al cliente**.
6. Completa Matrícula y Modelo.
7. Añade los demás datos disponibles.
8. Pulsa **Registrar cliente con vehículo**.
9. Comprueba el mensaje de confirmación.

