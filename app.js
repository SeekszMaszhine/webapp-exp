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
let editando=null,lista=[],modo='login',perfil=null,unsub=null;

/* ---------- Reloj / apertura automática ---------- */
const fmt=d=>d.toLocaleString('es-MX',{dateStyle:'long',timeStyle:'medium'});
function tick(){const t=fmt(new Date());$('#reloj').textContent=t;$('#apertura').value=editando&&editando.fechaApertura?fmt(editando.fechaApertura.toDate()):t}
setInterval(tick,1000);tick();

/* ---------- Validaciones ---------- */
const RX_NUM=/^\d{2}-\d{5}$/;
const RX_CURP=/^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;
const edad=f=>{if(!f)return'';const n=new Date(f+'T00:00'),h=new Date();let a=h.getFullYear()-n.getFullYear();if(h<new Date(h.getFullYear(),n.getMonth(),n.getDate()))a--;return a};
function validar(d){
 if(!RX_NUM.test(d.numero))return'El número de expediente debe tener el formato XX-XXXXX.';
 if(!d.nombre)return'Escribe el nombre del paciente.';
 if(!d.fechaNacimiento)return'Indica la fecha de nacimiento.';
 if(!['Masculino','Femenino'].includes(d.sexo))return'El sexo debe ser Masculino o Femenino.';
 if(!RX_CURP.test(d.curp))return'La CURP no tiene un formato válido.';
 if(d.curp.slice(4,10)!==d.fechaNacimiento.slice(2).replace(/-/g,''))return'La fecha de nacimiento no coincide con la CURP.';
 if(d.curp[10]!==(d.sexo==='Masculino'?'H':'M'))return'El sexo no coincide con la CURP.';
 if(!d.domicilio)return'Escribe el domicilio.';
 if(!/^\d{10}$/.test(d.telefono))return'El número de contacto debe tener 10 dígitos.';
 return null}
function limpiar(d){d.nombre=String(d.nombre||'').trim().toUpperCase();d.curp=String(d.curp||'').trim().toUpperCase();d.telefono=String(d.telefono||'').replace(/\D/g,'');
 d.numero=String(d.numero||'').trim();d.domicilio=String(d.domicilio||'').trim();d.nombreLower=d.nombre.toLowerCase();d.edad=edad(d.fechaNacimiento);
 for(const k of['carnet','codigoMater'])d[k]=/^s/i.test(String(d[k]||'No'))?'Sí':'No';
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
  if(perfil.aprobado){show('app');$('#quien').textContent=u.email;$('#btnSol').hidden=perfil.rol!=='admin';buscar()}
  else{show('auth');$('#authForm').hidden=true;$('#pend').hidden=false}})});

/* ---------- Búsqueda ---------- */
async function buscar(e){e&&e.preventDefault();const t=$('#q').value.trim(),C=db.collection('expedientes');let q;
 if(!t)q=C.orderBy('fechaApertura','desc');
 else if(/^[\d-]+$/.test(t))q=C.orderBy(firebase.firestore.FieldPath.documentId()).startAt(t).endAt(t+'\uf8ff');
 else if(/^[A-Za-z]{4}\d{6}/.test(t))q=C.where('curp','==',t.toUpperCase());
 else{const l=t.toLowerCase();q=C.orderBy('nombreLower').startAt(l).endAt(l+'\uf8ff')}
 try{const s=await q.limit(50).get();lista=s.docs.map(d=>d.data());
  $('#rows').innerHTML=lista.length?lista.map((x,i)=>`<tr data-i="${i}"><td>${esc(x.numero)}<td>${esc(x.nombre)}<td>${esc(x.curp)}<td>${edad(x.fechaNacimiento)}<td>${ultimo(x)||'—'}<td><span class="tag ${pasivo(x)?'p':'a'}">${pasivo(x)?'Pasivo':'Activo'}</span>`).join(''):'<tr><td colspan="6" class="vacio">Sin resultados. Prueba con otro dato o crea un nuevo expediente.'}
 catch(err){$('#rows').innerHTML='<tr><td colspan="6" class="vacio">'+esc(err.message)}}
$('#busq').onsubmit=buscar;
$('#rows').onclick=e=>{const tr=e.target.closest('tr[data-i]');if(tr)abrir(lista[tr.dataset.i])};

/* ---------- Formulario de expediente ---------- */
const F=$('#expForm');
F.curp.oninput=()=>{F.curp.value=F.curp.value.toUpperCase();F.curp.setCustomValidity(RX_CURP.test(F.curp.value)?'':'La CURP no tiene un formato válido.')};
F.fechaNacimiento.oninput=()=>$('#edadV').value=F.fechaNacimiento.value?edad(F.fechaNacimiento.value)+' años':'';
F.codigoMater.onchange=()=>$('#caso').hidden=F.codigoMater.value!=='Sí';
function abrir(x){editando=x||null;F.reset();if(x)for(const[k,v]of Object.entries(x))if(F.elements[k]&&typeof v==='string')F.elements[k].value=v;
 F.numero.readOnly=!!x;F.curp.oninput();F.fechaNacimiento.oninput();F.codigoMater.onchange();$('#fmsg').textContent='';tick();
 $('#dlgT').textContent=x?'Editar expediente':'Nuevo expediente';$('#dlg').showModal()}
$('#nuevo').onclick=()=>abrir();$('#cerrar').onclick=()=>$('#dlg').close();
F.onsubmit=async e=>{e.preventDefault();const d=limpiar(Object.fromEntries(new FormData(F))),er=validar(d);if(er)return $('#fmsg').textContent=er;
 const ref=db.doc('expedientes/'+d.numero),yo=auth.currentUser.email;
 try{if(editando)await ref.update({...d,actualizado:TS(),editor:yo});
  else{if((await ref.get()).exists)return $('#fmsg').textContent='Ya existe un expediente con ese número.';await ref.set({...d,fechaApertura:TS(),creador:yo})}
  $('#dlg').close();buscar()}catch(err){$('#fmsg').textContent=err.message}};

/* ---------- Importar Excel / CSV ---------- */
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
const MAP={numerodeexpediente:'numero',expediente:'numero',numero:'numero',nombre:'nombre',paciente:'nombre',nombredelpaciente:'nombre',fechadenacimiento:'fechaNacimiento',domicilio:'domicilio',fechademovimiento:'fechaMovimiento',fechadeingreso:'fechaIngreso',fechadeegreso:'fechaEgreso',curp:'curp',carnet:'carnet',carnetdecitas:'carnet',telefono:'telefono',numerodecontacto:'telefono',contacto:'telefono',sexo:'sexo',codigomater:'codigoMater',numerodecaso:'casoCodigo',casocodigo:'casoCodigo'};
function iso(v){if(!v)return'';if(v instanceof Date){const d=new Date(v.getTime()+432e5);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
 const s=String(v).trim(),m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:s.slice(0,10)}
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;const out=$('#res');out.hidden=false;out.textContent='Importando…';
 try{const wb=XLSX.read(await f.arrayBuffer(),{cellDates:true}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});let ok=0,omit=[];
  for(const[i,r]of rows.entries()){const d={};for(const[k,v]of Object.entries(r))if(MAP[norm(k)])d[MAP[norm(k)]]=v;
   for(const k of['fechaNacimiento','fechaMovimiento','fechaIngreso','fechaEgreso'])d[k]=iso(d[k]);
   const s=norm(d.sexo||'');d.sexo=/^(masculino|hombre)/.test(s)?'Masculino':/^(femenino|mujer)/.test(s)?'Femenino':'';
   limpiar(d);const er=validar(d);if(er){omit.push(`Fila ${i+2}: ${er}`);continue}
   const ref=db.doc('expedientes/'+d.numero);if((await ref.get()).exists){omit.push(`Fila ${i+2}: el expediente ${d.numero} ya existe.`);continue}
   await ref.set({...d,fechaApertura:TS(),creador:auth.currentUser.email,origen:'importación'});ok++}
  out.textContent=`Importados: ${ok}. Omitidos: ${omit.length}.`+(omit.length?'\n'+omit.slice(0,15).join('\n')+(omit.length>15?'\n…':''):'');buscar()}
 catch(err){out.textContent='No se pudo importar: '+err.message}e.target.value=''};

/* ---------- Solicitudes (administrador) ---------- */
$('#btnSol').onclick=async()=>{const s=await db.collection('users').where('aprobado','==',false).get();
 $('#solList').innerHTML=s.empty?'<p>No hay solicitudes pendientes.</p>':s.docs.map(d=>`<div class="sol"><span>${esc(d.data().email)}</span><button class="btn sm" data-u="${d.id}">Aprobar</button></div>`).join('');$('#dlgS').showModal()};
$('#solList').onclick=async e=>{const id=e.target.dataset.u;if(id){await db.doc('users/'+id).update({aprobado:true});e.target.closest('.sol').remove()}};
