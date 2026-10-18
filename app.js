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
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const show=id=>$$('.view').forEach(v=>v.hidden=v.id!==id);
$$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
let editando=null,lista=[],seccion='EXP-GN',modo='login',perfil=null,unsub=null;
const esAdmin=()=>!!perfil&&perfil.rol==='admin';

/* ---------- Reloj / apertura automática ---------- */
const fmt=d=>d.toLocaleString('es-MX',{dateStyle:'long',timeStyle:'medium'});
function tick(){const t=fmt(new Date()),a=$('#apertura');$('#reloj').textContent=t;if(a.type==='datetime-local')return;a.value=editando&&editando.fechaApertura?fmt(editando.fechaApertura.toDate()):t}
setInterval(tick,1000);tick();

/* ---------- Validaciones ---------- */
const RX_NUM=/^\d{2}-\d{5}$/;
const RX_CURP=/^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;
const carnetN=v=>/^dup/i.test(String(v||''))?'Duplicado':/^(ent|s)/i.test(String(v||''))?'Entregado':'Ninguno';
const edad=f=>{if(!f)return'';const n=new Date(f+'T00:00'),h=new Date();let a=h.getFullYear()-n.getFullYear();if(h<new Date(h.getFullYear(),n.getMonth(),n.getDate()))a--;return a};
function validar(d){
 if(!RX_NUM.test(d.numero))return'El número de expediente debe tener el formato XX-XXXXX.';
 if(!d.nombre)return'Escribe el nombre del paciente.';
 if(!d.fechaNacimiento)return'Indica la fecha de nacimiento.';
 if(!['Masculino','Femenino'].includes(d.sexo))return'El sexo debe ser Masculino o Femenino.';
 if(d.curp&&!RX_CURP.test(d.curp))return'La CURP no tiene un formato válido.';
 if(d.curp&&d.curp.slice(4,10)!==d.fechaNacimiento.slice(2).replace(/-/g,''))return'La fecha de nacimiento no coincide con la CURP.';
 if(d.curp&&d.curp[10]!==(d.sexo==='Masculino'?'H':'M'))return'El sexo no coincide con la CURP.';
 if(!d.domicilio)return'Escribe el domicilio.';
 if(!/^\d{10}$/.test(d.telefono))return'El número de contacto debe tener 10 dígitos.';
 return null}
function limpiar(d){d.nombre=String(d.nombre||'').trim().toUpperCase();d.curp=String(d.curp||'').trim().toUpperCase();d.telefono=String(d.telefono||'').replace(/\D/g,'');
 d.numero=String(d.numero||'').trim();d.domicilio=String(d.domicilio||'').trim();d.nombreLower=d.nombre.toLowerCase();d.edad=edad(d.fechaNacimiento);
 d.tipo=/est/i.test(String(d.tipo||''))?'EXP-EST':'EXP-GN';d.codigoMater=/^s/i.test(String(d.codigoMater||''))?'Sí':'No';d.defuncion=/^s/i.test(String(d.defuncion||''))?'Sí':'No';d.carnet=carnetN(d.carnet);
 let c=String(d.caso||'').trim().toUpperCase();if(c==='46')c='046';d.caso=['046','Z21','ILE'].includes(c)?c:'';
 d.casoCodigo=d.codigoMater==='Sí'?String(d.casoCodigo||'').trim():'';return d}

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
  $('#rows').innerHTML=lista.length?lista.map((x,i)=>`<tr data-i="${i}"><td>${esc(x.numero)}<td><span class="tag t${x.tipo==='EXP-EST'?' e':''}">${esc(x.tipo||'EXP-GN')}</span><td>${esc(x.nombre)}<td>${esc(x.curp)}<td>${edad(x.fechaNacimiento)}<td>${ultimo(x)||'—'}<td>${esc(x.caso||'')}<td>${x.codigoMater==='Sí'?esc(x.casoCodigo||'Sí'):'—'}<td><span class="tag ${pasivo(x)?'p':'a'}">${pasivo(x)?'Pasivo':'Activo'}</span>${x.defuncion==='Sí'?' <span class="tag d">Defunción</span>':''}`).join(''):'<tr><td colspan="9" class="vacio">Sin resultados. Prueba con otro dato o crea un nuevo expediente.'}
 catch(err){$('#rows').innerHTML='<tr><td colspan="8" class="vacio">'+esc(err.message)}}
$('#busq').onsubmit=buscar;
function irA(t){seccion=t;$$('.stab').forEach(b=>b.classList.toggle('on',b.dataset.s===t));buscar()}
$$('.stab').forEach(b=>b.onclick=()=>irA(b.dataset.s));
$('#rows').onclick=e=>{const tr=e.target.closest('tr[data-i]');if(tr)abrir(lista[tr.dataset.i])};

/* ---------- Formulario de expediente ---------- */
const F=$('#expForm');
F.curp.oninput=()=>{F.curp.value=F.curp.value.toUpperCase();F.curp.setCustomValidity((!F.curp.value||RX_CURP.test(F.curp.value))?'':'La CURP no tiene un formato válido.')};
F.fechaNacimiento.oninput=()=>$('#edadV').value=F.fechaNacimiento.value?edad(F.fechaNacimiento.value)+' años':'';
F.codigoMater.onchange=()=>$('#caso').hidden=F.codigoMater.value!=='Sí';
function abrir(x){editando=x||null;F.reset();if(x)for(const[k,v]of Object.entries(x))if(F.elements[k]&&typeof v==='string')F.elements[k].value=v;
 F.carnet.value=carnetN(x&&x.carnet);F.tipo.value=x?(x.tipo||'EXP-GN'):seccion;F.numero.readOnly=!!x&&!esAdmin();const A=$('#apertura'),ed=!!x&&esAdmin()&&!!x.fechaApertura;A.readOnly=!ed;A.type=ed?'datetime-local':'text';A.step=1;
 if(ed){const d=x.fechaApertura.toDate();A.value=new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,19)}$('#borrar').hidden=!(x&&esAdmin());F.curp.oninput();F.fechaNacimiento.oninput();F.codigoMater.onchange();$('#fmsg').textContent='';tick();
 $('#dlgT').textContent=x?'Editar expediente':'Nuevo expediente';$('#dlg').showModal()}
$('#nuevo').onclick=()=>abrir();$('#cerrar').onclick=()=>$('#dlg').close();
F.onsubmit=async e=>{e.preventDefault();const d=limpiar(Object.fromEntries(new FormData(F))),er=validar(d);if(er)return $('#fmsg').textContent=er;
 const ref=db.doc('expedientes/'+d.numero),yo=auth.currentUser.email;
 try{if(editando){const A=$('#apertura'),data={...d,actualizado:TS(),editor:yo};
   if(esAdmin()&&A.type==='datetime-local'&&A.value)data.fechaApertura=firebase.firestore.Timestamp.fromDate(new Date(A.value));
   if(esAdmin()&&d.numero!==editando.numero){if((await ref.get()).exists)return $('#fmsg').textContent='Ya existe un expediente con ese número.';
    const b=db.batch();b.set(ref,{...editando,...data});b.delete(db.doc('expedientes/'+editando.numero));await b.commit()}
   else await ref.update(data)}
  else{if((await ref.get()).exists)return $('#fmsg').textContent='Ya existe un expediente con ese número.';await ref.set({...d,fechaApertura:TS(),creador:yo})}
  $('#dlg').close();irA(d.tipo)}catch(err){$('#fmsg').textContent=err.message}};

/* ---------- Importar Excel / CSV ---------- */
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
const MAP={numerodeexpediente:'numero',expediente:'numero',numero:'numero',nombre:'nombre',paciente:'nombre',nombredelpaciente:'nombre',fechadenacimiento:'fechaNacimiento',domicilio:'domicilio',fechademovimiento:'fechaMovimiento',fechadeingreso:'fechaIngreso',fechadeegreso:'fechaEgreso',curp:'curp',carnet:'carnet',carnetdecitas:'carnet',telefono:'telefono',numerodecontacto:'telefono',contacto:'telefono',sexo:'sexo',codigomater:'codigoMater',numerodecaso:'casoCodigo',casocodigo:'casoCodigo',tipodeexpediente:'tipo',tipo:'tipo',seccion:'tipo',servicio:'tipo',caso:'caso',defuncion:'defuncion'};
function iso(v){if(!v)return'';if(v instanceof Date){const d=new Date(v.getTime()+432e5);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
 const s=String(v).trim(),m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:s.slice(0,10)}
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f||!esAdmin())return;const out=$('#res');out.hidden=false;out.textContent='Importando…';
 try{const wb=XLSX.read(await f.arrayBuffer(),{cellDates:true}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});let ok=0,omit=[];
  for(const[i,r]of rows.entries()){const d={};for(const[k,v]of Object.entries(r))if(MAP[norm(k)])d[MAP[norm(k)]]=v;
   for(const k of['fechaNacimiento','fechaMovimiento','fechaIngreso','fechaEgreso'])d[k]=iso(d[k]);
   const s=norm(d.sexo||'');d.sexo=/^(masculino|hombre)/.test(s)?'Masculino':/^(femenino|mujer)/.test(s)?'Femenino':'';
   d.tipo=d.tipo||seccion;limpiar(d);const er=validar(d);if(er){omit.push(`Fila ${i+2}: ${er}`);continue}
   const ref=db.doc('expedientes/'+d.numero);if((await ref.get()).exists){omit.push(`Fila ${i+2}: el expediente ${d.numero} ya existe.`);continue}
   await ref.set({...d,fechaApertura:TS(),creador:auth.currentUser.email,origen:'importación'});ok++}
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
  const rows=s.docs.map(d=>{const x=d.data(),o={'Número de expediente':x.numero,'Tipo de expediente':x.tipo||'EXP-GN','Nombre':x.nombre,'Fecha de apertura':ts(x.fechaApertura),'Fecha de nacimiento':x.fechaNacimiento,'Edad':edad(x.fechaNacimiento),'Sexo':x.sexo,'CURP':x.curp,'Domicilio':x.domicilio,'Número de contacto':x.telefono,'Carnet de citas':carnetN(x.carnet),'Caso':x.caso,'Defunción':x.defuncion||'No','Código mater':x.codigoMater||'No','Número de caso':x.casoCodigo,'Fecha de ingreso':x.fechaIngreso,'Fecha de egreso':x.fechaEgreso,'Fecha de movimiento':x.fechaMovimiento,'Estado':pasivo(x)?'Pasivo':'Activo'};
   for(const k in o)o[k]=san(o[k]??'');return o});
  const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new(),fn='expedientes_'+new Date().toISOString().slice(0,10);
  XLSX.utils.book_append_sheet(wb,ws,'Expedientes');
  if(tipo==='xlsx')XLSX.writeFile(wb,fn+'.xlsx');
  else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+XLSX.utils.sheet_to_csv(ws)],{type:'text/csv;charset=utf-8'}));a.download=fn+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
  m.textContent=`Se descargaron ${rows.length} expedientes.`}catch(err){m.textContent=err.message}}
$('#dXlsx').onclick=()=>descargar('xlsx');$('#dCsv').onclick=()=>descargar('csv');
