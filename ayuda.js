/* Contenido de la guía de uso. Si cambias el funcionamiento del sitio, actualiza estos textos. */
const AYUDA={
pasosCap:[
 {t:'Bienvenido/a',x:'Aquí capturas y consultas los expedientes del hospital. Hay dos secciones: Generales (EXP-GN) y Estomatología (EXP-EST). Cambia entre ellas con las pestañas sobre la lista; cada una tiene sus propios expedientes.'},
 {t:'Buscar un expediente',x:'Escribe en la barra y pulsa Buscar:',l:['Número de expediente, completo o su inicio (por ejemplo, 11-00).','Nombre: empieza por el primer apellido, tal como se capturó.','CURP: debe escribirse completa.','Sin escribir nada, la lista muestra los últimos expedientes creados o importados, el más reciente arriba.','Toca una fila para abrir y editar el expediente.']},
 {t:'Crear un expediente',x:'Pulsa "Nuevo expediente" (verde) y llena el formulario.',l:['Obligatorios: número, nombre, fecha de nacimiento, sexo, domicilio y número de contacto.','El número lo asignas tú, con el formato XX-XXXXX, y no puede repetirse dentro de la sección.','La fecha y hora de apertura se asignan solas y no se pueden cambiar.','Si dudas de un campo, toca la "?" junto a su nombre.']},
 {t:'Campos según la sección',x:'Los expedientes de Estomatología (EXP-EST) no tienen código mater, defunción, fecha de ingreso ni fecha de egreso, y en Caso solo se puede elegir Z21. Los generales (EXP-GN) tienen todos los campos. El tipo se elige al crear el expediente.'},
 {t:'Corregir y editar',x:'Abre el expediente, cambia lo necesario y pulsa Guardar.',l:['El número, la apertura y el tipo no se modifican; si hay un error ahí, avisa a un administrador.','Una CURP con formato inválido se ve en rojo en la lista: corrígela o déjala vacía.','Una "!" roja junto al último movimiento indica una fecha por corregir; el formulario muestra el valor original.','La edad se calcula sola con la fecha de nacimiento.']},
 {t:'Activo o pasivo',x:'Lo calcula el sitio: un expediente pasa a pasivo si no tiene movimiento, ingreso ni egreso en 5 años. No hay que marcarlo a mano.'},
 {t:'Cuida los datos',x:'Son datos de salud de pacientes.',l:['No compartas tu contraseña. La sesión se cierra sola tras 15 minutos sin actividad.','Cierra sesión con "Salir" al terminar.','No copies expedientes a otros archivos, chats o correos.','Esta guía siempre está en el botón "Ayuda".']}
],
pasosAdm:[
 {adm:1,t:'Aprobar capturistas',x:'Quien se registra queda pendiente. Pulsa "Solicitudes" para ver los registros nuevos y "Aprobar" a quien corresponda.'},
 {adm:1,t:'Importar desde Excel o CSV',x:'Abre primero la sección correcta (Generales o Estomatología) y pulsa "Importar Excel/CSV".',l:['Los encabezados deben estar en la fila 1 de la primera hoja.','La CURP y las fechas de movimiento, ingreso y egreso se cargan tal cual, sin verificar; los capturistas las corrigen después.','Se omiten las filas sin número o nombre, o con un número que ya existe en la sección; el resumen indica cuáles.','Access: expórtalo antes a Excel o CSV.']},
 {adm:1,t:'Descargar información',x:'"Descargar sección" baja en Excel o CSV los registros de la sección abierta. Para bajar la otra, cambia de pestaña.'},
 {adm:1,t:'Editar y borrar sin límites',x:'Los administradores pueden cambiar cualquier campo, incluidos número, tipo y apertura. "Borrar registro" está dentro del expediente, pide confirmación y no se puede deshacer.'},
 {adm:1,t:'Mantenimiento',x:'',l:['"Ordenar anteriores": púlsalo una vez cuando una actualización lo indique.','"Novedades": muestra los cambios de cada versión y los compara con versiones anteriores.','El registro de actividad se consulta en Firebase, en la colección audit_log.','Revisa de vez en cuando la lista de usuarios y las copias de seguridad.']}
],
campos:[
 {k:'numero',t:'Número de expediente',x:'Formato XX-XXXXX (dos dígitos, guion, cinco dígitos). Lo asigna quien captura. Es único dentro de cada sección. Después de guardar solo un administrador puede cambiarlo.'},
 {k:'apertura',t:'Apertura (automática)',x:'Fecha y hora en que se creó el expediente. Se asigna sola y no se puede modificar; en expedientes importados es la fecha del archivo. Solo un administrador puede ajustarla.'},
 {k:'tipo',t:'Tipo de expediente',x:'EXP-GN para expedientes generales y EXP-EST para los del servicio de estomatología. Define en qué sección aparece. Solo un administrador puede cambiarlo después.'},
 {k:'nombre',t:'Nombre del paciente',x:'Apellido paterno, apellido materno y nombre(s). Se guarda en mayúsculas. La búsqueda por nombre funciona desde el primer apellido.'},
 {k:'nacimiento',t:'Fecha de nacimiento',x:'Fecha completa. De aquí se calcula la edad y, si hay CURP, se comprueba que coincida.'},
 {k:'edad',t:'Edad',x:'Se calcula sola con la fecha de nacimiento. Si un expediente importado no tiene fecha de nacimiento, se conserva la edad del archivo.'},
 {k:'sexo',t:'Sexo',x:'Masculino o Femenino. Si capturas la CURP, debe coincidir con el sexo (la letra H o M en la posición 11).'},
 {k:'curp',t:'CURP (opcional)',x:'18 caracteres. Si la escribes, se verifica el formato y que coincida con la fecha de nacimiento y el sexo. Al importar no se verifica: si queda inválida, se ve en rojo en la lista para corregirla o dejarla vacía.'},
 {k:'domicilio',t:'Domicilio',x:'Calle, número, colonia y municipio del paciente. Obligatorio al crear un expediente.'},
 {k:'telefono',t:'Número de contacto',x:'8 o 10 dígitos; puedes incluir guiones o espacios. Obligatorio al crear un expediente.'},
 {k:'carnet',t:'Carnet de citas',x:'Ninguno: no tiene carnet. Entregado: ya se le dio. Duplicado: se le entregó una reposición.'},
 {k:'caso',t:'Caso (opcional)',x:'Clasificación del caso: 046, Z21, ILE o CML. En Estomatología solo se puede elegir Z21.'},
 {k:'defuncion',t:'Defunción',x:'Sí o No. Solo existe en expedientes generales.'},
 {k:'codigoDefuncion',t:'Código de defunción (opcional)',x:'Número de código asignado a la defunción. Solo existe en expedientes generales.'},
 {k:'codigoMater',t:'Código mater',x:'Sí o No. Si eliges Sí aparece el número de caso. Solo existe en expedientes generales.'},
 {k:'casoCodigo',t:'Número de caso (opcional)',x:'Número de caso del código mater. Solo aparece cuando Código mater es Sí.'},
 {k:'ingreso',t:'Fecha de ingreso',x:'Fecha en que el paciente ingresó al hospital. Solo en expedientes generales (en estomatología no hay hospitalización). Cuenta para saber si el expediente está activo.'},
 {k:'egreso',t:'Fecha de egreso',x:'Fecha en que el paciente salió del hospital. Solo en expedientes generales. Cuenta para saber si el expediente está activo.'},
 {k:'movimiento',t:'Fecha de movimiento',x:'Fecha de la última actividad del expediente. Junto con ingreso y egreso decide si es activo o pasivo (pasivo: 5 años sin ninguno de los tres).'}
]};
