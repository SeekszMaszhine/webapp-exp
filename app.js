// 1) Pega aquí la configuración de tu proyecto Firebase (ver LEEME.txt)
  const firebaseConfig = {
    apiKey: "AIzaSyCUgQdNjvUAhDx7oPKPZE6FEnUMUuC4l70",
    authDomain: "hmivg-exp-35057.firebaseapp.com",
    projectId: "hmivg-exp-35057",
    storageBucket: "hmivg-exp-35057.firebasestorage.app",
    messagingSenderId: "882677479294",
    appId: "1:882677479294:web:af21c735f53d8153aa252f",
    measurementId: "G-9Y54VE2T85"
};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth(),db=firebase.firestore(),TS=firebase.firestore.FieldValue.serverTimestamp;
const VERSION='20261018d';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const show=id=>$$('.view').forEach(v=>v.hidden=v.id!==id);
$$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
$('#ver').textContent='Versión del sitio: '+VERSION;
let editando=null,lista=[],seccion='EXP-GN',modo='login',perfil=null,unsub=null;
const esAdmin=()=>!!perfil&&perfil.rol==='admin';

/* ---------- Reloj / apertura automática ---------- */
const fmt=d=>d.toLocaleString('es-MX',{dateStyle:'long',timeStyle:'medium'});
function tick(){const t=fmt(new Date()),a=$('#apertura');$('#reloj').textContent=t;if(a.type==='datetime-local')return;a.value=editando&&editando.fechaApertura?fmt(editando.fechaApertura.toDate()):t}
setInterval(tick,1000);tick();

/* ---------- Validaciones ---------- */
const RX_NUM=/^\d{2}-\d{5}$/;
const RX_CURP=/^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;
const carnetN=v=>{const t=String(v||'').trim();return/^d/i.test(t)?'Duplicado':/^(e|s|x|t|v|1)/i.test(t)?'Entregado':'Ninguno'};
const edadDe=x=>x.fechaNacimiento?edad(x.fechaNacimiento):(x.edad||'');
const edad=f=>{if(!f)return'';const n=new Date(f+'T00:00'),h=new Date();let a=h.getFullYear()-n.getFullYear();if(h<new Date(h.getFullYear(),n.getMonth(),n.getDate()))a--;return a};
function validar(d,estricto){
 if(!RX_NUM.test(d.numero))return'El número de expediente debe tener el formato XX-XXXXX.';
 if(!d.nombre)return'Escribe el nombre del paciente.';
 for(const k of['fechaNacimiento','fechaMovimiento','fechaIngreso','fechaEgreso'])if(d[k]&&!/^\d{4}-\d\d-\d\d$/.test(d[k]))return`Fecha no válida: "${d[k]}".`;
 if(estricto){
  if(!d.fechaNacimiento)return'Indica la fecha de nacimiento.';
  if(!d.sexo)return'El sexo debe ser Masculino o Femenino.';
  if(!d.domicilio)return'Escribe el domicilio.';
  if(!/^(\d{8}|\d{10})$/.test(String(d.telefono).replace(/\D/g,'')))return'El número de contacto debe tener 8 o 10 dígitos.'}
 if(d.sexo&&!['Masculino','Femenino'].includes(d.sexo))return'El sexo debe ser Masculino o Femenino.';
 if(d.curp){
  if(!RX_CURP.test(d.curp))return'La CURP no tiene un formato válido.';
  if(d.fechaNacimiento&&d.curp.slice(4,10)!==d.fechaNacimiento.slice(2).replace(/-/g,''))return'La fecha de nacimiento no coincide con la CURP.';
  if(d.sexo&&d.curp[10]!==(d.sexo==='Masculino'?'H':'M'))return'El sexo no coincide con la CURP.'}
 return null}
function limpiar(d){d.nombre=String(d.nombre||'').trim().toUpperCase();d.curp=String(d.curp||'').trim().toUpperCase();d.telefono=String(d.telefono??'').trim();
 d.numero=String(d.numero||'').trim();d.domicilio=String(d.domicilio||'').trim();d.nombreLower=d.nombre.toLowerCase();
 d.edad=d.fechaNacimiento?edad(d.fechaNacimiento):String(d.edad??'').replace(/\D/g,'');
 d.tipo=/est/i.test(String(d.tipo||''))?'EXP-EST':'EXP-GN';
 d.codigoMater=/^s[ií]$/i.test(String(d.codigoMater||'').trim())?'Sí':'No';d.codigoDefuncion=String(d.codigoDefuncion??'').trim();d.defuncion=/^(s|x|1)/i.test(String(d.defuncion||''))?'Sí':'No';d.carnet=carnetN(d.carnet);
 let c=String(d.caso||'').trim().toUpperCase();if(c==='46')c='046';d.caso=['046','Z21','ILE','CML'].includes(c)?c:'';
 d.casoCodigo=d.codigoMater==='Sí'?String(d.casoCodigo??'').trim():'';
 if(d.tipo==='EXP-EST'){d.codigoMater='No';d.casoCodigo='';d.defuncion='No';d.codigoDefuncion='';d.fechaIngreso='';d.fechaEgreso='';if(d.caso!=='Z21')d.caso=''}
 return d}

/* ---------- Estado activo / pasivo (5 años sin movimiento) ---------- */
const ultimo=x=>[x.fechaMovimiento,x.fechaIngreso,x.fechaEgreso].filter(Boolean).sort().pop()||(x.fechaApertura?x.fechaApertura.toDate().toISOString().slice(0,10):'');
const pasivo=x=>{const u=ultimo(x);if(!u)return false;const l=new Date();l.setFullYear(l.getFullYear()-5);return new Date(u+'T00:00')<l};

/* ---------- Acceso y registro ---------- */
const errTxt=e=>({'auth/invalid-credential':'Correo o contraseña incorrectos.','auth/email-already-in-use':'Ese correo ya está registrado.','auth/weak-password':'La contraseña debe tener al menos 6 caracteres.','auth/invalid-email':'Escribe un correo válido.'}[e.code]||e.message);
$$('.tab').forEach(t=>t.onclick=()=>{modo=t.dataset.m;$$('.tab').forEach(x=>x.classList.toggle('on',x===t));$('#authBtn').textContent=modo==='login'?'Ingresar':'Crear cuenta'});
$('#authForm').onsubmit=async e=>{e.preventDefault();$('#amsg').textContent='';const em=$('#email').value.trim(),pw=$('#pw').value;
 try{if(modo==='login')await auth.signInWithEmailAndPassword(em,pw);
  else{const c=await auth.createUserWithEmailAndPassword(em,pw);await db.doc('users/'+c.user.uid).set({email:em,aprobado:false,rol:'capturista'})}}
 catch(err){$('#amsg').textContent=errTxt(err)}};
$$('.salir').forEach(b=>b.onclick=()=>auth.signOut());
auth.onAuthStateChanged(u=>{unsub&&unsub();
 if(!u){perfil=null;$('#authForm').hidden=false;$('#pend').hidden=true;return show('landing')}
 unsub=db.doc('users/'+u.uid).onSnapshot(s=>{perfil=s.data()||{};
  if(perfil.aprobado){show('app');$('#quien').textContent=u.email;$('#adm').hidden=$('#hint').hidden=perfil.rol!=='admin';buscar()}
  else{show('auth');$('#authForm').hidden=true;$('#pend').hidden=false}})});

/* ---------- Búsqueda ---------- */
async function buscar(e){e&&e.preventDefault();const t=$('#q').value.trim(),C=db.collection('expedientes');let q;
 if(!t)q=C.orderBy('fechaApertura','desc');
 else if(/^[\d-]+$/.test(t))q=C.orderBy(firebase.firestore.FieldPath.documentId()).startAt(t).endAt(t+'\uf8ff');
 else if(/^[A-Za-z]{4}\d{6}/.test(t))q=C.where('curp','==',t.toUpperCase());
 else{const l=t.toLowerCase();q=C.orderBy('nombreLower').startAt(l).endAt(l+'\uf8ff')}
 try{const s=await q.limit(300).get();lista=s.docs.map(d=>d.data()).filter(x=>(x.tipo||'EXP-GN')===seccion).slice(0,50);
  $('#rows').innerHTML=lista.length?lista.map((x,i)=>`<tr data-i="${i}"><td>${esc(x.numero)}<td><span class="tag t${x.tipo==='EXP-EST'?' e':''}">${esc(x.tipo||'EXP-GN')}</span><td>${esc(x.nombre)}<td>${esc(x.curp)}<td>${esc(edadDe(x))}<td>${ultimo(x)||'—'}<td>${esc(x.caso||'')}<td class="cm">${x.codigoMater==='Sí'?esc(x.casoCodigo||'Sí'):'—'}<td><span class="tag ${pasivo(x)?'p':'a'}">${pasivo(x)?'Pasivo':'Activo'}</span>${x.defuncion==='Sí'?' <span class="tag d">Defunción</span>':''}`).join(''):'<tr><td colspan="9" class="vacio">Sin resultados. Prueba con otro dato o crea un nuevo expediente.'}
 catch(err){$('#rows').innerHTML='<tr><td colspan="8" class="vacio">'+esc(err.message)}}
$('#busq').onsubmit=buscar;
function irA(t){seccion=t;$('.tw').classList.toggle('est',t==='EXP-EST');$$('.stab').forEach(b=>b.classList.toggle('on',b.dataset.s===t));buscar()}
$$('.stab').forEach(b=>b.onclick=()=>irA(b.dataset.s));
$('#rows').onclick=e=>{const tr=e.target.closest('tr[data-i]');if(tr)abrir(lista[tr.dataset.i])};

/* ---------- Formulario de expediente ---------- */
const F=$('#expForm');
F.curp.oninput=()=>{F.curp.value=F.curp.value.toUpperCase();F.curp.setCustomValidity((!F.curp.value||RX_CURP.test(F.curp.value))?'':'La CURP no tiene un formato válido.')};
F.fechaNacimiento.oninput=()=>$('#edadV').value=F.fechaNacimiento.value?edad(F.fechaNacimiento.value)+' años':'';
F.codigoMater.onchange=()=>$('#caso').hidden=F.tipo.value==='EXP-EST'||F.codigoMater.value!=='Sí';
function aplicarTipo(){const est=F.tipo.value==='EXP-EST',C=F.elements.caso;$$('.gn').forEach(l=>l.hidden=est);F.codigoMater.onchange();
 [...C.options].forEach(o=>{const no=est&&o.value&&o.value!=='Z21';o.hidden=o.disabled=!!no});if(est&&C.value&&C.value!=='Z21')C.value=''}
F.tipo.onchange=aplicarTipo;
function abrir(x){editando=x||null;F.reset();if(x)for(const[k,v]of Object.entries(x))if(F.elements[k]&&typeof v==='string')F.elements[k].value=v;
 F.carnet.value=carnetN(x&&x.carnet);F.tipo.value=x?(x.tipo||'EXP-GN'):seccion;F.numero.readOnly=!!x&&!esAdmin();const A=$('#apertura'),ed=!!x&&esAdmin()&&!!x.fechaApertura;A.readOnly=!ed;A.type=ed?'datetime-local':'text';A.step=1;
 if(ed){const d=x.fechaApertura.toDate();A.value=new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,19)}$('#borrar').hidden=!(x&&esAdmin());F.curp.oninput();F.fechaNacimiento.oninput();aplicarTipo();for(const n of['fechaNacimiento','sexo','domicilio','telefono'])F[n].required=!x;if(x&&!x.fechaNacimiento&&x.edad)$('#edadV').value=x.edad+' años';$('#fmsg').textContent='';tick();
 $('#dlgT').textContent=x?'Editar expediente':'Nuevo expediente';$('#dlg').showModal()}
$('#nuevo').onclick=()=>abrir();$('#cerrar').onclick=()=>$('#dlg').close();
F.onsubmit=async e=>{e.preventDefault();const d=limpiar(Object.fromEntries(new FormData(F)));if(editando&&!d.fechaNacimiento&&editando.edad)d.edad=editando.edad;const er=validar(d,!editando);if(er)return $('#fmsg').textContent=er;
 const ref=db.doc('expedientes/'+d.numero),yo=auth.currentUser.email;
 try{if(editando){const A=$('#apertura'),data={...d,actualizado:TS(),editor:yo};
   if(esAdmin()&&A.type==='datetime-local'&&A.value)data.fechaApertura=firebase.firestore.Timestamp.fromDate(new Date(A.value));
   if(esAdmin()&&d.numero!==editando.numero){if((await ref.get()).exists)return $('#fmsg').textContent='Ya existe un expediente con ese número.';
    const b=db.batch();b.set(ref,{...editando,...data});b.delete(db.doc('expedientes/'+editando.numero));await b.commit()}
   else await ref.update(data)}
  else{if((await ref.get()).exists)return $('#fmsg').textContent='Ya existe un expediente con ese número.';await ref.set({...d,fechaApertura:TS(),creador:yo})}
  $('#dlg').close();irA(d.tipo)}catch(err){$('#fmsg').textContent=err.message}};

/* ---------- Importar Excel / CSV ---------- */
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const MAP={numerodeexpediente:'numero',noexpediente:'numero',expediente:'numero',numero:'numero',folio:'numero',tipodeexpediente:'tipo',tipo:'tipo',seccion:'tipo',
nombre:'nombre',paciente:'nombre',nombredelpaciente:'nombre',apellidopaternomaternonombres:'nombre',
fapertura:'fechaApertura',fechadeapertura:'fechaApertura',hora:'hora',horadeapertura:'hora',
fechadenacimiento:'fechaNacimiento',fdenacimiento:'fechaNacimiento',edad:'edad',domicilio:'domicilio',
fmovimiento:'fechaMovimiento',fechademov:'fechaMovimiento',fechadenac:'fechaNacimiento',fechademovimiento:'fechaMovimiento',ingreso:'fechaIngreso',fechadeingreso:'fechaIngreso',egreso:'fechaEgreso',fechadeegreso:'fechaEgreso',
curp:'curp',carnet:'carnet',carnetdecitas:'carnet',telefono:'telefono',numerodecontacto:'telefono',contacto:'telefono',sexo:'sexo',genero:'sexo',
codigomater:'codigoMater',cm:'codigoMater',caso:'casoCodigo',numerodecaso:'casoCodigo',casocodigo:'casoCodigo',caso046z21ile:'caso',caso046z21ilecml:'caso',clave:'caso',caso3:'codigoDefuncion',codigodedefuncion:'codigoDefuncion',defuncion:'defuncion'};
const horaT=v=>{let h,m;if(v instanceof Date){const d=new Date(v.getTime()+3e4);h=d.getHours();m=d.getMinutes()}else if(typeof v==='number'&&v>=0&&v<1){const t=Math.round(v*1440);h=Math.floor(t/60);m=t%60}else{const t=String(v||''),x=t.match(/(\d{1,2})[:.](\d{2})/);if(!x)return'00:00';h=+x[1];m=+x[2];if(/p\.?\s*m/i.test(t)&&h<12)h+=12;else if(/a\.?\s*m/i.test(t)&&h===12)h=0}return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')};
const campo=k=>{const n=norm(k);return MAP[n]||(/apellido/.test(n)?'nombre':/^telefono/.test(n)?'telefono':((/expediente/.test(n)&&!/tipo|fecha|estado/.test(n))||n==='folio'||n==='exp')?'numero':null)};
const numExp=v=>{let s=String(v??'').trim().replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\s+/g,'');if(/^\d{7}$/.test(s))s=s.slice(0,2)+'-'+s.slice(2);const m=s.match(/^(\d{2})-(\d{1,5})$/);return m?m[1]+'-'+m[2].padStart(5,'0'):s};
function iso(v){if(!v)return'';if(v instanceof Date){const d=new Date(v.getTime()+432e5);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
 const s=String(v).trim(),m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:s.slice(0,10)}
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f||!esAdmin())return;const out=$('#res');out.hidden=false;out.textContent='Importando…';
 try{const wb=XLSX.read(await f.arrayBuffer(),{cellDates:true}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});let ok=0,omit=[];
  const cols=Object.keys(rows[0]||{});if(!cols.some(k=>campo(k)==='numero')){out.textContent='No encontré la columna del número de expediente. Columnas leídas: '+(cols.join(', ')||'ninguna')+'. Revisa que los encabezados estén en la fila 1 de la primera hoja.';e.target.value='';return}
  for(const[i,r]of rows.entries()){const d={};for(const[k,v]of Object.entries(r)){const c=campo(k);if(c&&(v!==''||!(c in d)))d[c]=v}
   if(!String(d.numero??'').trim()&&!String(d.nombre??'').trim())continue;
   for(const k of['fechaNacimiento','fechaMovimiento','fechaIngreso','fechaEgreso'])d[k]=iso(d[k]);
   const ap=iso(d.fechaApertura),hh=horaT(d.hora);delete d.fechaApertura;delete d.hora;
   const s=norm(d.sexo||'');d.sexo=/^(f|femenino|mujer)/.test(s)?'Femenino':/^(m|h|masculino|hombre)/.test(s)?'Masculino':'';
   d.numero=numExp(d.numero);d.tipo=d.tipo||seccion;limpiar(d);const er=validar(d);if(er){omit.push(`Fila ${i+2}: ${er}`+(/^El número de exp/.test(er)?` (valor leído: "${d.numero}")`:''));continue}
   const ref=db.doc('expedientes/'+d.numero);if((await ref.get()).exists){omit.push(`Fila ${i+2}: el expediente ${d.numero} ya existe.`);continue}
   const dt=new Date(ap+'T'+hh+':00'),apT=/^\d{4}-\d\d-\d\d$/.test(ap)&&!isNaN(dt)?firebase.firestore.Timestamp.fromDate(dt):TS();
   await ref.set({...d,fechaApertura:apT,creador:auth.currentUser.email,origen:'importación'});ok++}
  out.textContent=`Importados: ${ok}. Omitidos: ${omit.length}.`+(omit.length?'\n'+omit.slice(0,15).join('\n')+(omit.length>15?'\n…':''):'');buscar()}
 catch(err){out.textContent='No se pudo importar: '+err.message}e.target.value=''};

/* ---------- Solicitudes (administrador) ---------- */
$('#btnSol').onclick=async()=>{const s=await db.collection('users').where('aprobado','==',false).get();
 $('#solList').innerHTML=s.empty?'<p>No hay solicitudes pendientes.</p>':s.docs.map(d=>`<div class="sol"><span>${esc(d.data().email)}</span><button class="btn sm" data-u="${d.id}">Aprobar</button></div>`).join('');$('#dlgS').showModal()};
$('#solList').onclick=async e=>{const id=e.target.dataset.u;if(id){await db.doc('users/'+id).update({aprobado:true});e.target.closest('.sol').remove()}};

/* ---------- Borrar registro (administrador) ---------- */
$('#borrar').onclick=async()=>{if(!esAdmin()||!editando)return;
 if(!confirm(`¿Borrar definitivamente el expediente ${editando.numero} de ${editando.nombre}? Esta acción no se puede deshacer.`))return;
 try{await db.doc('expedientes/'+editando.numero).delete();$('#dlg').close();buscar()}catch(err){$('#fmsg').textContent=err.message}};

/* ---------- Descargar todo (administrador) ---------- */
const san=v=>typeof v==='string'&&/^[=+\-@]/.test(v)?"'"+v:v;
const ts=t=>{if(!t)return'';const d=t.toDate();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,19).replace('T',' ')};
$('#btnDesc').onclick=()=>{$('#dmsg').textContent='';$('#dlgD').showModal()};
async function descargar(tipo){if(!esAdmin())return;const m=$('#dmsg');m.textContent='Preparando…';
 try{const s=await db.collection('expedientes').orderBy(firebase.firestore.FieldPath.documentId()).get();
  const rows=s.docs.map(d=>{const x=d.data(),o={'Número de expediente':x.numero,'Tipo de expediente':x.tipo||'EXP-GN','Nombre':x.nombre,'Fecha de apertura':ts(x.fechaApertura),'Fecha de nacimiento':x.fechaNacimiento,'Edad':edadDe(x),'Sexo':x.sexo,'CURP':x.curp,'Domicilio':x.domicilio,'Número de contacto':x.telefono,'Carnet de citas':carnetN(x.carnet),'Caso 046/Z21/ILE/CML':x.caso,'Código de defunción':x.codigoDefuncion,'Defunción':x.defuncion||'No','Código mater':x.codigoMater||'No','Número de caso':x.casoCodigo,'Fecha de ingreso':x.fechaIngreso,'Fecha de egreso':x.fechaEgreso,'Fecha de movimiento':x.fechaMovimiento,'Estado':pasivo(x)?'Pasivo':'Activo'};
   for(const k in o)o[k]=san(o[k]??'');return o});
  const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new(),fn='expedientes_'+new Date().toISOString().slice(0,10);
  XLSX.utils.book_append_sheet(wb,ws,'Expedientes');
  if(tipo==='xlsx')XLSX.writeFile(wb,fn+'.xlsx');
  else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+XLSX.utils.sheet_to_csv(ws)],{type:'text/csv;charset=utf-8'}));a.download=fn+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
  m.textContent=`Se descargaron ${rows.length} expedientes.`}catch(err){m.textContent=err.message}}
$('#dXlsx').onclick=()=>descargar('xlsx');$('#dCsv').onclick=()=>descargar('csv');
