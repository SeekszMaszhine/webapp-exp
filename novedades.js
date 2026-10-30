/* Historial de cambios. La versión más nueva va primero y debe coincidir con VERSION de app.js.
   Al publicar una versión nueva, agrega arriba una entrada: { v, fecha, cambios:[...], requiere:'...' } */
const NOVEDADES=[
{v:'20261029b',fecha:'29 oct 2026',cambios:[
 'Guía de uso: tutorial paso a paso la primera vez que entra cada persona (capturistas y administradores).',
 'Botón "Ayuda" para consultarla cuando se necesite, y glosario de campos con buscador.',
 'Botón "?" junto a cada campo del formulario que abre la explicación de ese campo.'],
 requiere:'Publicar las reglas de Firestore (LEEME.txt) para que el tutorial se marque como visto.'},
{v:'20261029a',fecha:'29 oct 2026',cambios:[
 'Aviso de novedades para administradores: aparece una vez por sesión y también con el botón "Novedades".',
 'Puedes comparar los cambios de esta versión con los de otra anterior (por defecto, la de hace dos versiones).']},
{v:'20261028a',fecha:'28 oct 2026',cambios:[
 'Importación: las fechas de movimiento, ingreso y egreso se cargan tal cual; las que no se puedan leer se marcan con "!" para corregirlas.',
 'Nuevo diseño en blanco, rojo vino y verde bosque, al estilo Apple.',
 'La lista muestra primero el último expediente creado o importado.',
 'Registro de actividad (quién creó, abrió, editó, borró, importó o descargó) y cierre de sesión a los 15 minutos de inactividad.',
 'Mensajes de error genéricos; la importación solo acepta .xlsx, .xls o .csv de hasta 15 MB.'],
 requiere:'Publicar las reglas nuevas de Firestore (LEEME.txt) y pulsar una vez "Ordenar anteriores".'},
{v:'20261018g',fecha:'18 oct 2026',cambios:[
 'La CURP ya no se verifica al importar; las que tengan formato inválido se ven en rojo en la lista para corregirlas.']},
{v:'20261018f',fecha:'18 oct 2026',cambios:[
 'App Check con reCAPTCHA v3 (se activa al pegar la clave pública en app.js).'],
 requiere:'Opcional: configurar reCAPTCHA y App Check (LEEME.txt).'},
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
