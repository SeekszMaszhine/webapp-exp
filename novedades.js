/* Historial de cambios del sitio (solo cambios visibles en el sitio; las acciones de configuración externa van en LEEME.txt).
   La versión más nueva va primero y debe coincidir con VERSION de app.js.
   Al publicar una versión nueva, agrega arriba una entrada: { v, fecha, cambios:[...] } */
const NOVEDADES=[
{v:'20261101a',fecha:'1 nov 2026',cambios:[
 'La agenda de Estomatología solo acepta expedientes de Estomatología (EXP-EST) y completa los datos desde esa sección; no se pueden agendar expedientes de uso general.',
 'La impresión del historial semanal ya no incluye la leyenda sobre la normativa del hospital.']},
{v:'20261031b',fecha:'31 oct 2026',cambios:[
 'Nueva agenda de citas, en una página aparte (botón "Agenda", arriba): servicios con sus turnos y horarios cada 20 minutos desde las 8:00.',
 'Se agenda con el número de expediente y el nombre; el nombre se completa solo al escribir el número, o se captura a mano.',
 'Capturistas y administradores ven qué servicios tienen citas y qué horarios están ocupados. Los capturistas piden cambios o cancelaciones a un administrador; los administradores los hacen directamente.',
 'Impresión del historial semanal de citas por servicio.']},
{v:'20261031a',fecha:'31 oct 2026',cambios:[
 'Los capturistas pueden solicitar la corrección de los campos que solo cambia un administrador (número de expediente, tipo y fecha de apertura) con el botón "Solicitar corrección", dentro del expediente.',
 'Los administradores revisan las solicitudes en "Correcciones" (con aviso de pendientes) y deciden si aplicarlas o rechazarlas; nada cambia solo.',
 'Los capturistas ven el estado de sus solicitudes en "Mis correcciones".']},
{v:'20261030b',fecha:'30 oct 2026',cambios:[
 'Los expedientes se guardan en dos colecciones separadas de la base de datos, una por sección: exp-gen (generales) y exp-den (estomatología), para revisarlas por separado.',
 'El número de expediente es único por sección de forma nativa: el número es el identificador del documento en su colección.',
 'Botón "Migrar datos" (solo administradores): úsalo una vez tras actualizar para copiar los expedientes existentes a las colecciones nuevas. No borra nada.']},
{v:'20261030a',fecha:'30 oct 2026',cambios:[
 'Las novedades tienen su propio botón, arriba junto a "Ayuda", con un punto de aviso cuando hay una versión nueva por leer.',
 'El aviso de novedades ya no se abre solo: lo consultas cuando quieras.']},
{v:'20261029b',fecha:'29 oct 2026',cambios:[
 'Guía de uso: tutorial paso a paso la primera vez que entra cada persona (capturistas y administradores).',
 'Botón "Ayuda" para consultarla cuando se necesite, y glosario de campos con buscador.',
 'Botón "?" junto a cada campo del formulario que abre la explicación de ese campo.']},
{v:'20261029a',fecha:'29 oct 2026',cambios:[
 'Aviso de novedades para administradores, con comparación entre la versión actual y otra anterior (por defecto, la de hace dos versiones).']},
{v:'20261028a',fecha:'28 oct 2026',cambios:[
 'Importación: las fechas de movimiento, ingreso y egreso se cargan tal cual; las que no se puedan leer se marcan con "!" para corregirlas.',
 'Nuevo diseño en blanco, rojo vino y verde bosque, al estilo Apple.',
 'La lista muestra primero el último expediente creado o importado. Botón "Ordenar anteriores" para acomodar los ya guardados (úsalo una vez tras actualizar).',
 'Registro de actividad (quién creó, abrió, editó, borró, importó o descargó) y cierre de sesión a los 15 minutos de inactividad.',
 'Mensajes de error genéricos; la importación solo acepta .xlsx, .xls o .csv de hasta 15 MB.']},
{v:'20261018g',fecha:'18 oct 2026',cambios:[
 'La CURP ya no se verifica al importar; las que tengan formato inválido se ven en rojo en la lista para corregirlas.']},
{v:'20261018f',fecha:'18 oct 2026',cambios:[
 'Compatibilidad con App Check, que verifica que las solicitudes a la base de datos vienen del sitio.']},
{v:'20261018e',fecha:'18 oct 2026',cambios:[
 'La descarga de información es por sección: cada una baja solo sus registros.',
 'El número de expediente es único por sección (puede repetirse entre EXP-GN y EXP-EST).']},
{v:'20261018d',fecha:'18 oct 2026',cambios:[
 'Importación de estomatología: reconoce sus encabezados, la hora en formato a.m./p.m. y el carnet como True/False.']},
{v:'20261018c',fecha:'18 oct 2026',cambios:[
 'Los expedientes EXP-EST ya no registran código mater, defunción, ingreso ni egreso, y en Caso solo admiten Z21.']},
{v:'20261018b',fecha:'18 oct 2026',cambios:[
 'El pie del sitio muestra el número de versión y se evita que el navegador use archivos viejos.']}
];
