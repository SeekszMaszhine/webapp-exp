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
// 2) App Check con reCAPTCHA v3: pega aquí la CLAVE PÚBLICA (site key) de reCAPTCHA v3 (ver LEEME.txt)
const RECAPTCHA_SITE_KEY="TU_CLAVE_RECAPTCHA_V3";
if(['localhost','127.0.0.1'].includes(location.hostname))self.FIREBASE_APPCHECK_DEBUG_TOKEN=true;
if(!RECAPTCHA_SITE_KEY.startsWith('TU_'))firebase.appCheck().activate(RECAPTCHA_SITE_KEY,true);
const auth=firebase.auth(),db=firebase.firestore(),TS=firebase.firestore.FieldValue.serverTimestamp;
const VERSION='20261031a';
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(()=>{});
const falla=e=>{console.error('Error:',e&&e.code||'desconocido');return e&&e.code==='permission-denied'?'No tienes permiso para realizar esta acción.':'No se pudo completar la operación. Intenta de nuevo.'};
/* Registro de actividad (solo se escribe; las reglas impiden modificarlo o borrarlo) */
const audit=(accion,id,extra)=>{const u=auth.currentUser;if(!u)return;db.collection('audit_log').add({timestamp:TS(),user_id:u.uid,user_email:u.email,action:accion,resource_type:'expediente',resource_id:id||'',...extra}).catch(e=>console.error('Auditoría:',e.code))};
/* Cierre de sesión por inactividad (15 min) */
let idle;const reiniciar=()=>{clearTimeout(idle);if(auth.currentUser)idle=setTimeout(()=>auth.signOut(),15*60*1000)};
['click','keydown','mousemove','touchstart'].forEach(ev=>addEventListener(ev,reiniciar,{passive:true}));
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
function validar(d,estricto,sinCurp){
 if(!RX_NUM.test(d.numero))return'El número de expediente debe tener el formato XX-XXXXX.';
 if(!d.nombre)return'Escribe el nombre del paciente.';
 for(const k of['fechaNacimiento','fechaMovimiento','fechaIngreso','fechaEgreso'])if(d[k]&&!ISO.test(d[k])&&(k==='fechaNacimiento'||!sinCurp))return`Fecha no válida: "${d[k]}".`;
 if(estricto){
  if(!d.fechaNacimiento)return'Indica la fecha de nacimiento.';
  if(!d.sexo)return'El sexo debe ser Masculino o Femenino.';
  if(!d.domicilio)return'Escribe el domicilio.';
  if(!/^(\d{8}|\d{10})$/.test(String(d.telefono).replace(/\D/g,'')))return'El número de contacto debe tener 8 o 10 dígitos.'}
 if(d.sexo&&!['Masculino','Femenino'].includes(d.sexo))return'El sexo debe ser Masculino o Femenino.';
 if(d.curp&&!sinCurp){
  if(!RX_CURP.test(d.curp))return'La CURP no tiene un formato válido.';
  if(d.fechaNacimiento&&d.curp.slice(4,10)!==d.fechaNacimiento.slice(2).replace(/-/g,''))return'La fecha de nacimiento no coincide con la CURP.';
  if(d.sexo&&d.curp[10]!==(d.sexo==='Masculino'?'H':'M'))return'El sexo no coincide con la CURP.'}
 return null}
function limpiar(d){d.nombre=String(d.nombre||'').trim().toUpperCase().slice(0,150);d.curp=String(d.curp||'').trim().toUpperCase().slice(0,30);d.telefono=String(d.telefono??'').trim().slice(0,40);
 d.numero=String(d.numero||'').trim();d.domicilio=String(d.domicilio||'').trim().slice(0,300);d.nombreLower=d.nombre.toLowerCase();
 d.edad=d.fechaNacimiento?edad(d.fechaNacimiento):String(d.edad??'').replace(/\D/g,'');
 d.tipo=/est/i.test(String(d.tipo||''))?'EXP-EST':'EXP-GN';
 d.codigoMater=/^s[ií]$/i.test(String(d.codigoMater||'').trim())?'Sí':'No';d.codigoDefuncion=String(d.codigoDefuncion??'').trim().slice(0,40);d.defuncion=/^(s|x|1)/i.test(String(d.defuncion||''))?'Sí':'No';d.carnet=carnetN(d.carnet);
 let c=String(d.caso||'').trim().toUpperCase();if(c==='46')c='046';d.caso=['046','Z21','ILE','CML'].includes(c)?c:'';
 d.casoCodigo=d.codigoMater==='Sí'?String(d.casoCodigo??'').trim().slice(0,40):'';
 if(d.tipo==='EXP-EST'){d.codigoMater='No';d.casoCodigo='';d.defuncion='No';d.codigoDefuncion='';d.fechaIngreso='';d.fechaEgreso='';if(d.caso!=='Z21')d.caso=''}
 return d}

/* ---------- Estado activo / pasivo (5 años sin movimiento) ---------- */
const ISO=/^\d{4}-\d\d-\d\d$/;
const malas=x=>[['fechaMovimiento','movimiento'],['fechaIngreso','ingreso'],['fechaEgreso','egreso']].filter(([k])=>x[k]&&!ISO.test(x[k]));
const avisoFechas=x=>{const m=malas(x);return m.length?'Fechas por corregir (valor original): '+m.map(([k,n])=>n+' "'+x[k]+'"').join(', ')+'.':''};
const ultimo=x=>[x.fechaMovimiento,x.fechaIngreso,x.fechaEgreso].filter(v=>ISO.test(v||'')).sort().pop()||(x.fechaApertura?x.fechaApertura.toDate().toISOString().slice(0,10):'');
const pasivo=x=>{const u=ultimo(x);if(!u)return false;const l=new Date();l.setFullYear(l.getFullYear()-5);return new Date(u+'T00:00')<l};

/* ---------- Acceso y registro ---------- */
const errTxt=e=>({'auth/invalid-credential':'Correo o contraseña incorrectos.','auth/email-already-in-use':'Ese correo ya está registrado.','auth/weak-password':'La contraseña debe tener al menos 6 caracteres.','auth/invalid-email':'Escribe un correo válido.'}[e.code]||'No se pudo iniciar sesión. Intenta de nuevo.');
$$('.tab').forEach(t=>t.onclick=()=>{modo=t.dataset.m;$$('.tab').forEach(x=>x.classList.toggle('on',x===t));$('#authBtn').textContent=modo==='login'?'Ingresar':'Crear cuenta'});
$('#authForm').onsubmit=async e=>{e.preventDefault();$('#amsg').textContent='';const em=$('#email').value.trim(),pw=$('#pw').value;
 try{if(modo==='login')await auth.signInWithEmailAndPassword(em,pw);
  else{const c=await auth.createUserWithEmailAndPassword(em,pw);await db.doc('users/'+c.user.uid).set({email:em,aprobado:false,rol:'capturista'})}}
 catch(err){$('#amsg').textContent=errTxt(err)}};
$$('.salir').forEach(b=>b.onclick=()=>auth.signOut());
auth.onAuthStateChanged(u=>{unsub&&unsub();
 if(!u){perfil=null;lista=[];editando=null;clearTimeout(idle);$('#rows').innerHTML='';$$('dialog').forEach(d=>d.open&&d.close());F.reset();$('#authForm').hidden=false;$('#pend').hidden=true;return show('landing')}
 unsub=db.doc('users/'+u.uid).onSnapshot(s=>{perfil=s.data()||{};
  if(perfil.aprobado){reiniciar();show('app');$('#quien').textContent=u.email;$('#adm').hidden=$('#hint').hidden=perfil.rol!=='admin';$('#btnMis').hidden=esAdmin();badgeCorr();buscar();tutorialInicial()}
  else{show('auth');$('#authForm').hidden=true;$('#pend').hidden=false}})});

/* ---------- Búsqueda ---------- */
/* Una colección de Firestore por sección: exp-gen (EXP-GN) y exp-den (EXP-EST). El número de expediente es el ID del documento. */
const COL={'EXP-GN':'exp-gen','EXP-EST':'exp-den'},col=t=>db.collection(COL[t]||COL['EXP-GN']);
async function buscar(e){e&&e.preventDefault();const t=$('#q').value.trim(),C=col(seccion),con=s=>s.docs.map(d=>({...d.data(),_id:d.id}));
 try{if(!t){lista=con(await C.orderBy('listaKey','desc').limit(50).get())}
  else{let q;if(/^[\d-]+$/.test(t))q=C.orderBy('numero').startAt(t).endAt(t+'\uf8ff');
   else if(/^[A-Za-z]{4}\d{6}/.test(t))q=C.where('curp','==',t.toUpperCase());
   else{const l=t.toLowerCase();q=C.orderBy('nombreLower').startAt(l).endAt(l+'\uf8ff')}
   lista=con(await q.limit(50).get())}
  $('#rows').innerHTML=lista.length?lista.map((x,i)=>`<tr data-i="${i}"><td>${esc(x.numero)}<td><span class="tag t${x.tipo==='EXP-EST'?' e':''}">${esc(x.tipo||'EXP-GN')}</span><td>${esc(x.nombre)}<td class="${x.curp&&!RX_CURP.test(x.curp)?'mal':''}">${esc(x.curp)}<td>${esc(edadDe(x))}<td>${ultimo(x)||'—'}${malas(x).length?' <span class="mal" title="Fecha por corregir">!</span>':''}<td>${esc(x.caso||'')}<td class="cm">${x.codigoMater==='Sí'?esc(x.casoCodigo||'Sí'):'—'}<td><span class="tag ${pasivo(x)?'p':'a'}">${pasivo(x)?'Pasivo':'Activo'}</span>${x.defuncion==='Sí'?' <span class="tag d">Defunción</span>':''}`).join(''):'<tr><td colspan="9" class="vacio">Sin resultados. Prueba con otro dato o crea un nuevo expediente.'}
 catch(err){$('#rows').innerHTML='<tr><td colspan="9" class="vacio">'+esc(falla(err))}}
$('#busq').onsubmit=buscar;
function irA(t){seccion=t;$('.tw').classList.toggle('est',t==='EXP-EST');$$('.stab').forEach(b=>b.classList.toggle('on',b.dataset.s===t));buscar()}
$$('.stab').forEach(b=>b.onclick=()=>irA(b.dataset.s));
$('#rows').onclick=e=>{const tr=e.target.closest('tr[data-i]');if(tr)abrir(lista[tr.dataset.i])};

/* ---------- Número único por sección ---------- */
const lk=(t,v)=>t+'|'+String(v).padStart(15,'0');
const tiempo=x=>x.listaKey?x.listaKey.split('|')[1]:String(x.fechaApertura?x.fechaApertura.toMillis():0).padStart(15,'0');
async function existe(t,n){return (await col(t).doc(n).get()).exists}

/* ---------- Formulario de expediente ---------- */
const F=$('#expForm');
F.curp.oninput=()=>{F.curp.value=F.curp.value.toUpperCase();F.curp.setCustomValidity((!F.curp.value||RX_CURP.test(F.curp.value))?'':'La CURP no tiene un formato válido.')};
F.fechaNacimiento.oninput=()=>$('#edadV').value=F.fechaNacimiento.value?edad(F.fechaNacimiento.value)+' años':'';
F.codigoMater.onchange=()=>$('#caso').hidden=F.tipo.value==='EXP-EST'||F.codigoMater.value!=='Sí';
function aplicarTipo(){const est=F.tipo.value==='EXP-EST',C=F.elements.caso;$$('.gn').forEach(l=>l.hidden=est);F.codigoMater.onchange();
 [...C.options].forEach(o=>{const no=est&&o.value&&o.value!=='Z21';o.hidden=o.disabled=!!no});if(est&&C.value&&C.value!=='Z21')C.value=''}
F.tipo.onchange=aplicarTipo;
function abrir(x){editando=x||null;F.reset();if(x)for(const[k,v]of Object.entries(x))if(F.elements[k]&&typeof v==='string')F.elements[k].value=v;
 F.carnet.value=carnetN(x&&x.carnet);F.tipo.value=x?(x.tipo||'EXP-GN'):seccion;F.tipo.disabled=!!x&&!esAdmin();F.numero.readOnly=!!x&&!esAdmin();const A=$('#apertura'),ed=!!x&&esAdmin()&&!!x.fechaApertura;A.readOnly=!ed;A.type=ed?'datetime-local':'text';A.step=1;
 if(ed){const d=x.fechaApertura.toDate();A.value=new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,19)}$('#borrar').hidden=!(x&&esAdmin());$('#solCorr').hidden=!(x&&!esAdmin());F.curp.oninput();F.fechaNacimiento.oninput();aplicarTipo();for(const n of['fechaNacimiento','sexo','domicilio','telefono'])F[n].required=!x;if(x&&!x.fechaNacimiento&&x.edad)$('#edadV').value=x.edad+' años';$('#fmsg').textContent=x?avisoFechas(x):'';tick();if(x)audit('read',COL[x.tipo||'EXP-GN']+'/'+x._id,{seccion:x.tipo||'EXP-GN'});
 $('#dlgT').textContent=x?'Editar expediente':'Nuevo expediente';$('#dlg').showModal()}
$('#nuevo').onclick=()=>abrir();$('#cerrar').onclick=()=>$('#dlg').close();
F.onsubmit=async e=>{e.preventDefault();const raw=Object.fromEntries(new FormData(F));if(editando&&!esAdmin())raw.tipo=editando.tipo||'EXP-GN';
 const d=limpiar(raw);if(editando&&!d.fechaNacimiento&&editando.edad)d.edad=editando.edad;const er=validar(d,!editando);if(er)return $('#fmsg').textContent=er;
 const yo=auth.currentUser.email,dup='Ya existe un expediente con ese número en la sección '+d.tipo+'.';
 try{if(editando){const A=$('#apertura'),data={...d,actualizado:TS(),editor:yo},viejo=col(editando.tipo||'EXP-GN').doc(editando._id);
   if(esAdmin()&&A.type==='datetime-local'&&A.value)data.fechaApertura=firebase.firestore.Timestamp.fromDate(new Date(A.value));
   if(esAdmin()&&(d.numero!==editando.numero||d.tipo!==(editando.tipo||'EXP-GN'))){if(await existe(d.tipo,d.numero))return $('#fmsg').textContent=dup;
    const{_id,...orig}=editando,b=db.batch();b.set(col(d.tipo).doc(d.numero),{...orig,...data,listaKey:lk(d.tipo,tiempo(editando))});b.delete(viejo);await b.commit();audit('update',COL[d.tipo]+'/'+d.numero,{seccion:d.tipo,campos:['numero/tipo']})}
   else{await viejo.update(data);audit('update',COL[d.tipo]+'/'+editando._id,{seccion:d.tipo,campos:Object.keys(d).filter(k=>!['nombreLower','edad'].includes(k)&&String(d[k]??'')!==String(editando[k]??''))})}}
  else{if(await existe(d.tipo,d.numero))return $('#fmsg').textContent=dup;const id=COL[d.tipo]+'/'+d.numero;await col(d.tipo).doc(d.numero).set({...d,fechaApertura:TS(),creadoEn:TS(),listaKey:lk(d.tipo,Date.now()),creador:yo});audit('create',id,{seccion:d.tipo})}
  $('#dlg').close();irA(d.tipo)}catch(err){$('#fmsg').textContent=falla(err)}};

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
function iso(v,tal){if(!v)return'';if(v instanceof Date){const d=new Date(v.getTime()+432e5);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
 const s=String(v).trim(),m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
 if(m){const r=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;const dt=new Date(Date.UTC(+m[3],+m[2]-1,+m[1]));return tal&&(dt.getUTCMonth()!==+m[2]-1||dt.getUTCDate()!==+m[1])?s.slice(0,60):r}
 const n=s.match(/^\d{4}-\d\d-\d\d/);return n?n[0]:s.slice(0,tal?60:10)}
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f||!esAdmin())return;const out=$('#res');out.hidden=false;if(!/\.(xlsx|xls|csv)$/i.test(f.name)||f.size>15*1024*1024){out.textContent='Archivo no válido: usa .xlsx, .xls o .csv de máximo 15 MB.';e.target.value='';return}
 out.textContent='Importando…';
 try{const wb=XLSX.read(await f.arrayBuffer(),{cellDates:true}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});let ok=0,omit=[];const base=Date.now();
  const cols=Object.keys(rows[0]||{});if(!cols.some(k=>campo(k)==='numero')){out.textContent='No encontré la columna del número de expediente. Columnas leídas: '+(cols.join(', ')||'ninguna')+'. Revisa que los encabezados estén en la fila 1 de la primera hoja.';e.target.value='';return}
  for(const[i,r]of rows.entries()){const d={};for(const[k,v]of Object.entries(r)){const c=campo(k);if(c&&(v!==''||!(c in d)))d[c]=v}
   if(!String(d.numero??'').trim()&&!String(d.nombre??'').trim())continue;
   d.fechaNacimiento=iso(d.fechaNacimiento);for(const k of['fechaMovimiento','fechaIngreso','fechaEgreso'])d[k]=iso(d[k],true);
   const ap=iso(d.fechaApertura),hh=horaT(d.hora);delete d.fechaApertura;delete d.hora;
   const s=norm(d.sexo||'');d.sexo=/^(f|femenino|mujer)/.test(s)?'Femenino':/^(m|h|masculino|hombre)/.test(s)?'Masculino':'';
   d.numero=numExp(d.numero);d.tipo=d.tipo||seccion;limpiar(d);const er=validar(d,false,true);if(er){omit.push(`Fila ${i+2}: ${er}`+(/^El número de exp/.test(er)?` (valor leído: "${d.numero}")`:''));continue}
   if(await existe(d.tipo,d.numero)){omit.push(`Fila ${i+2}: el expediente ${d.numero} ya existe en ${d.tipo}.`);continue}
   const ref=col(d.tipo).doc(d.numero);
   const dt=new Date(ap+'T'+hh+':00'),apT=/^\d{4}-\d\d-\d\d$/.test(ap)&&!isNaN(dt)?firebase.firestore.Timestamp.fromDate(dt):TS();
   await ref.set({...d,fechaApertura:apT,creadoEn:TS(),listaKey:lk(d.tipo,base+(rows.length-i)),creador:auth.currentUser.email,origen:'importación'});ok++}
  out.textContent=`Importados: ${ok}. Omitidos: ${omit.length}.`+(omit.length?'\n'+omit.slice(0,15).join('\n')+(omit.length>15?'\n…':''):'');audit('create','importación',{seccion,registros:ok,omitidos:omit.length});buscar()}
 catch(err){console.error('Error:',err&&err.code||'desconocido');out.textContent='No se pudo importar el archivo. Revisa que sea un Excel o CSV válido y que tengas permiso.'}e.target.value=''};

/* ---------- Solicitudes (administrador) ---------- */
$('#btnSol').onclick=async()=>{const s=await db.collection('users').where('aprobado','==',false).get();
 $('#solList').innerHTML=s.empty?'<p>No hay solicitudes pendientes.</p>':s.docs.map(d=>`<div class="sol"><span>${esc(d.data().email)}</span><button class="btn sm" data-u="${d.id}">Aprobar</button></div>`).join('');$('#dlgS').showModal()};
$('#solList').onclick=async e=>{const id=e.target.dataset.u;if(id){await db.doc('users/'+id).update({aprobado:true});e.target.closest('.sol').remove()}};

/* ---------- Borrar registro (administrador) ---------- */
$('#borrar').onclick=async()=>{if(!esAdmin()||!editando)return;
 if(!confirm(`¿Borrar definitivamente el expediente ${editando.numero} de ${editando.nombre}? Esta acción no se puede deshacer.`))return;
 try{const sec=editando.tipo||'EXP-GN',id=COL[sec]+'/'+editando._id;await col(sec).doc(editando._id).delete();audit('delete',id,{seccion:sec});$('#dlg').close();buscar()}catch(err){$('#fmsg').textContent=falla(err)}};

/* ---------- Descargar la sección abierta (administrador) ---------- */
const san=v=>typeof v==='string'&&/^[=+\-@]/.test(v)?"'"+v:v;
const ts=t=>{if(!t)return'';const d=t.toDate();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,19).replace('T',' ')};
$('#btnDesc').onclick=()=>{$('#dmsg').textContent='';$('#dlgDT').textContent='Descargar '+(seccion==='EXP-EST'?'Estomatología':'Generales')+' ('+seccion+')';$('#dlgD').showModal()};
async function descargar(tipo){if(!esAdmin())return;const m=$('#dmsg'),sec=seccion;m.textContent='Preparando…';
 try{const s=await col(sec).get();
  const rows=s.docs.map(d=>{const x=d.data(),o={'Número de expediente':x.numero,'Tipo de expediente':x.tipo||'EXP-GN','Nombre':x.nombre,'Fecha de apertura':ts(x.fechaApertura),'Fecha de nacimiento':x.fechaNacimiento,'Edad':edadDe(x),'Sexo':x.sexo,'CURP':x.curp,'Domicilio':x.domicilio,'Número de contacto':x.telefono,'Carnet de citas':carnetN(x.carnet),'Caso 046/Z21/ILE/CML':x.caso,'Código de defunción':x.codigoDefuncion,'Defunción':x.defuncion||'No','Código mater':x.codigoMater||'No','Número de caso':x.casoCodigo,'Fecha de ingreso':x.fechaIngreso,'Fecha de egreso':x.fechaEgreso,'Fecha de movimiento':x.fechaMovimiento,'Estado':pasivo(x)?'Pasivo':'Activo'};
   if(sec==='EXP-EST')for(const k of['Defunción','Código de defunción','Código mater','Número de caso','Fecha de ingreso','Fecha de egreso'])delete o[k];
   for(const k in o)o[k]=san(o[k]??'');return o}).sort((a,b)=>String(a['Número de expediente']).localeCompare(String(b['Número de expediente'])));
  const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new(),fn='expedientes_'+sec+'_'+new Date().toISOString().slice(0,10);
  XLSX.utils.book_append_sheet(wb,ws,'Expedientes');
  if(tipo==='xlsx')XLSX.writeFile(wb,fn+'.xlsx');
  else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+XLSX.utils.sheet_to_csv(ws)],{type:'text/csv;charset=utf-8'}));a.download=fn+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
  audit('export','sección',{seccion:sec,registros:rows.length,formato:tipo});m.textContent=`Se descargaron ${rows.length} expedientes de ${sec}.`}catch(err){m.textContent=falla(err)}}
$('#dXlsx').onclick=()=>descargar('xlsx');$('#dCsv').onclick=()=>descargar('csv');

$$('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());

/* ---------- Migrar datos a una colección por sección (administrador, una sola vez) ---------- */
$('#btnMig').onclick=async()=>{if(!esAdmin())return;
 if(!confirm('Se copiarán los expedientes de la colección anterior a "exp-gen" y "exp-den". No se borra nada y los que ya estén copiados se omiten. ¿Continuar?'))return;
 const out=$('#res');out.hidden=false;out.textContent='Migrando datos…';
 try{const s=await db.collection('expedientes').get(),ya={};
  for(const t of Object.keys(COL))ya[t]=new Set((await col(t).get()).docs.map(d=>d.id));
  let n=0,om=0,c=0,b=db.batch();
  for(const d of s.docs){const x=d.data(),t=x.tipo==='EXP-EST'?'EXP-EST':'EXP-GN',num=String(x.numero||d.id);
   if(!/^\d{2}-\d{5}$/.test(num)||ya[t].has(num)){om++;continue}
   const ms=x.creadoEn?x.creadoEn.toMillis():x.fechaApertura?x.fechaApertura.toMillis():0;
   b.set(col(t).doc(num),{...x,numero:num,tipo:t,listaKey:lk(t,(x.listaKey&&x.listaKey.split('|')[1])||ms)});ya[t].add(num);n++;
   if(++c===400){await b.commit();b=db.batch();c=0}}
  if(c)await b.commit();
  audit('create','migración',{registros:n,omitidos:om});
  out.textContent=`Listo: ${n} expedientes copiados. Omitidos: ${om} (ya copiados o con número inválido). La colección anterior no se borró; revísala en Firebase y bórrala cuando confirmes que todo está bien.`;buscar()}
 catch(err){out.textContent=falla(err)}};

/* ---------- Novedades para administradores (una vez por sesión) ---------- */
const tarjeta=(n,t)=>`<section class="nov"><h3>${esc(t)}</h3><p class="hint">Versión ${esc(n.v)} · ${esc(n.fecha)}</p><ul>${n.cambios.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></section>`;
function pintarNov(){const i=Math.max(0,NOVEDADES.findIndex(n=>n.v===VERSION)),v=NOVEDADES.find(n=>n.v===$('#novSel').value)||NOVEDADES[i];
 $('#novA').innerHTML=tarjeta(NOVEDADES[i],'Esta versión');$('#novB').innerHTML=tarjeta(v,'Para comparar')}
const novKey=()=>'novVista_'+(auth.currentUser?auth.currentUser.uid:'');
function avisoNov(){const b=$('#btnNov');b.hidden=!esAdmin()||typeof NOVEDADES==='undefined';if(b.hidden)return;let v=null;try{v=localStorage.getItem(novKey())}catch(e){}$('#novDot').hidden=v===VERSION}
function novedades(){if(!esAdmin()||typeof NOVEDADES==='undefined')return;
 try{localStorage.setItem(novKey(),VERSION)}catch(e){}$('#novDot').hidden=true;
 const i=Math.max(0,NOVEDADES.findIndex(n=>n.v===VERSION)),otras=NOVEDADES.filter((_,k)=>k!==i),sel=$('#novSel');
 sel.innerHTML=otras.map(n=>`<option value="${esc(n.v)}">${esc(n.v)} · ${esc(n.fecha)}</option>`).join('');
 const dos=NOVEDADES[i+2]||NOVEDADES[NOVEDADES.length-1];if(dos&&dos.v!==VERSION)sel.value=dos.v;
 sel.onchange=pintarNov;pintarNov();if(!$('#dlgN').open)$('#dlgN').showModal()}
$('#btnNov').onclick=novedades;

/* ---------- Guía de uso: tutorial por rol y glosario de campos ---------- */
let ayPaso=0;
const ayPasos=()=>esAdmin()?[...AYUDA.pasosCap,...AYUDA.pasosAdm]:AYUDA.pasosCap;
function ayPintar(){const L=ayPasos(),p=L[Math.min(ayPaso,L.length-1)];
 $('#ayPaso').innerHTML=`<p class="hint">${p.adm?'Para administradores · ':''}Paso ${ayPaso+1} de ${L.length}</p><h3>${esc(p.t)}</h3>${p.x?`<p>${esc(p.x)}</p>`:''}${p.l?`<ul>${p.l.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`:''}`;
 $('#ayAnt').disabled=ayPaso===0;$('#aySig').textContent=ayPaso>=L.length-1?'Listo':'Siguiente'}
function ayCampos(filtro,resaltar){const q=norm(filtro||'');
 $('#ayLista').innerHTML=AYUDA.campos.filter(c=>!q||norm(c.t+c.x).includes(q)).map(c=>`<div class="campo${c.k===resaltar?' hl':''}" id="ay-${esc(c.k)}"><b>${esc(c.t)}</b><p>${esc(c.x)}</p></div>`).join('')||'<p class="hint">Sin resultados.</p>';
 if(resaltar){const e=$('#ay-'+resaltar);e&&e.scrollIntoView({block:'center'})}}
function ayTab(t){$$('.aytab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$('#ayTut').hidden=t!=='tut';$('#ayCam').hidden=t!=='cam'}
function ayuda(tab,campo){ayTab(tab);if(!$('#dlgA').open)$('#dlgA').showModal();
 if(tab==='tut'){ayPaso=0;ayPintar()}else{$('#ayQ').value='';ayCampos('',campo)}}
$$('.aytab').forEach(b=>b.onclick=()=>{b.dataset.t==='tut'?(ayTab('tut'),ayPintar()):(ayTab('cam'),ayCampos($('#ayQ').value))});
$('#ayQ').oninput=()=>ayCampos($('#ayQ').value);
$('#ayAnt').onclick=()=>{ayPaso=Math.max(0,ayPaso-1);ayPintar()};
$('#aySig').onclick=()=>{if(ayPaso>=ayPasos().length-1)$('#dlgA').close();else{ayPaso++;ayPintar()}};
$('#btnAyuda').onclick=()=>ayuda('tut');
function tutorialInicial(){avisoNov();let v=null;try{v=sessionStorage.getItem('ayVisto')}catch(e){}
 if(!perfil||perfil.tutorialVisto||v)return;
 try{sessionStorage.setItem('ayVisto','1')}catch(e){}ayuda('tut')}
$('#dlgA').addEventListener('close',()=>{const u=auth.currentUser;
 if(u&&perfil&&perfil.aprobado&&!perfil.tutorialVisto){perfil.tutorialVisto=true;db.doc('users/'+u.uid).update({tutorialVisto:true}).catch(e=>console.error('Error:',e.code))}
 avisoNov()});
const CAMPOS_AYUDA={numero:'numero',tipo:'tipo',nombre:'nombre',fechaNacimiento:'nacimiento',sexo:'sexo',curp:'curp',domicilio:'domicilio',telefono:'telefono',carnet:'carnet',caso:'caso',defuncion:'defuncion',codigoDefuncion:'codigoDefuncion',codigoMater:'codigoMater',casoCodigo:'casoCodigo',fechaIngreso:'ingreso',fechaEgreso:'egreso',fechaMovimiento:'movimiento'};
const ponerQ=(el,k)=>{const b=document.createElement('button');b.type='button';b.className='q';b.textContent='?';b.title='Ayuda sobre este campo';b.setAttribute('aria-label','Ayuda sobre este campo');b.onclick=()=>ayuda('cam',k);el.closest('label').appendChild(b)};
for(const[n,k]of Object.entries(CAMPOS_AYUDA))ponerQ(F.elements[n],k);
ponerQ($('#apertura'),'apertura');ponerQ($('#edadV'),'edad');

/* ---------- Solicitudes de corrección: el capturista las pide, el administrador decide ---------- */
const CORR_CAMPOS={numero:'Número de expediente',tipo:'Tipo de expediente',apertura:'Fecha y hora de apertura'};
const fechaHora=ms=>{const d=new Date(ms);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,19).replace('T',' ')};
const valorActual=(x,c)=>c==='numero'?x.numero:c==='tipo'?(x.tipo||'EXP-GN'):(x.fechaApertura?fechaHora(x.fechaApertura.toMillis()):'');
const porFecha=(a,b)=>(b.creadaEn?b.creadaEn.toMillis():0)-(a.creadaEn?a.creadaEn.toMillis():0);
const COR=()=>db.collection('correcciones');
const ESTADO={pendiente:['Pendiente','t'],aprobada:['Aprobada','a'],rechazada:['Rechazada','p']};
const tarjetaCorr=(s,adm)=>`<section class="nov"><h3>${esc(s.seccion)} · ${esc(s.numero)}<span class="tag ${(ESTADO[s.estado]||['','t'])[1]}">${esc((ESTADO[s.estado]||[''])[0])}</span></h3><p class="hint">${esc(CORR_CAMPOS[s.campo]||s.campo)}${s.creadaEn?' · '+fechaHora(s.creadaEn.toMillis()):''}${adm?' · '+esc(s.solicitanteEmail||''):''}</p><p><b>${esc(s.valorActual)}</b> → <b>${esc(s.valorNuevo)}</b></p><p class="hint">Motivo: ${esc(s.motivo)}</p>${s.notaAdmin?`<p class="hint">Respuesta del administrador: ${esc(s.notaAdmin)}</p>`:''}${adm&&s.estado==='pendiente'?`<div class="corr-acc" data-id="${esc(s._id)}"><input class="nota" placeholder="Nota (opcional)" maxlength="200"><button type="button" class="btn sm" data-a="aplicar">Aplicar</button><button type="button" class="btn ghost sm" data-a="rechazar">Rechazar</button></div>`:''}</section>`;
const misCorrecciones=async()=>(await COR().where('solicitante','==',auth.currentUser.uid).get()).docs.map(d=>({...d.data(),_id:d.id})).sort(porFecha);
const pendientes=async()=>(await COR().where('estado','==','pendiente').get()).docs.map(d=>({...d.data(),_id:d.id})).sort((a,b)=>-porFecha(a,b));

/* Capturista: crear la solicitud (siempre por acción explícita) */
function corrCampoCambio(){const c=$('#corrCampo').value;$('#corrActual').value=valorActual(editando,c);
 $('#corrNum').hidden=c!=='numero';$('#corrTipo').hidden=c!=='tipo';$('#corrApe').hidden=c!=='apertura';$('#corrNum').value='';$('#corrApe').value='';$('#corrTipo').value=(editando.tipo||'EXP-GN')==='EXP-GN'?'EXP-EST':'EXP-GN'}
$('#solCorr').onclick=()=>{if(!editando||esAdmin())return;$('#corrCampo').value='numero';corrCampoCambio();$('#corrMotivo').value='';$('#corrMsg').textContent='';$('#dlgC').showModal()};
$('#corrCampo').onchange=corrCampoCambio;
$('#corrForm').onsubmit=async e=>{e.preventDefault();const m=$('#corrMsg');m.textContent='';if(!editando||esAdmin())return;
 const c=$('#corrCampo').value,act=valorActual(editando,c),motivo=$('#corrMotivo').value.trim(),sec=editando.tipo||'EXP-GN';
 let nv=c==='numero'?$('#corrNum').value.trim():c==='tipo'?$('#corrTipo').value:$('#corrApe').value;
 if(c==='apertura'&&nv){if(nv.length===16)nv+=':00';nv=nv.replace('T',' ')}
 if(c==='numero'&&!RX_NUM.test(nv))return m.textContent='El número debe tener el formato XX-XXXXX.';
 if(c==='apertura'&&(!nv||isNaN(new Date(nv.replace(' ','T')))))return m.textContent='Indica una fecha y hora válidas.';
 if(nv===act)return m.textContent='El valor solicitado es igual al actual.';
 if(!motivo)return m.textContent='Explica el motivo de la corrección.';
 try{if((await misCorrecciones()).some(r=>r.estado==='pendiente'&&r.numero===editando.numero&&r.seccion===sec&&r.campo===c))return m.textContent='Ya enviaste una solicitud pendiente para este campo.';
  const u=auth.currentUser,ref=await COR().add({solicitante:u.uid,solicitanteEmail:u.email,seccion:sec,numero:editando.numero,campo:c,valorActual:act,valorNuevo:nv,motivo:motivo.slice(0,300),estado:'pendiente',creadaEn:TS()});
  audit('create','correcciones/'+ref.id,{seccion:sec,campos:[c]});$('#dlgC').close();$('#fmsg').textContent='Solicitud enviada. Un administrador la revisará; puedes ver su estado en "Mis correcciones".'}
 catch(err){m.textContent=falla(err)}};
$('#btnMis').onclick=async()=>{const L=$('#misLista');L.innerHTML='<p class="hint">Cargando…</p>';$('#dlgM').showModal();
 try{const r=(await misCorrecciones()).slice(0,30);L.innerHTML=r.length?r.map(x=>tarjetaCorr(x,false)).join(''):'<p class="hint">Aún no has enviado solicitudes.</p>'}catch(err){L.innerHTML='<p class="err">'+esc(falla(err))+'</p>'}};

/* Administrador: revisar, aplicar o rechazar */
async function badgeCorr(){if(!esAdmin())return;try{const n=(await pendientes()).length,p=$('#corrPunto');p.hidden=!n;p.textContent=n>9?'9+':String(n)}catch(e){console.error('Error:',e&&e.code||'desconocido')}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)badgeCorr()});
async function listarCorr(){const L=$('#corrLista');try{const r=await pendientes();L.innerHTML=r.length?r.map(x=>tarjetaCorr(x,true)).join(''):'<p class="hint">No hay solicitudes pendientes.</p>'}catch(err){L.innerHTML='<p class="err">'+esc(falla(err))+'</p>'}badgeCorr()}
$('#btnCorr').onclick=async()=>{if(!esAdmin())return;$('#corrAdmMsg').textContent='';$('#corrLista').innerHTML='<p class="hint">Cargando…</p>';$('#dlgR').showModal();await listarCorr()};
async function aplicarCorreccion(s){const t=s.seccion==='EXP-EST'?'EXP-EST':'EXP-GN',ref=col(t).doc(s.numero),snap=await ref.get();
 if(!snap.exists)return'El expediente ya no existe con ese número en esa sección.';
 const x={...snap.data(),_id:snap.id},base={actualizado:TS(),editor:auth.currentUser.email},{_id,...orig}=x;
 if(valorActual(x,s.campo)!==s.valorActual)return'El valor actual cambió desde que se hizo la solicitud. Recházala y pide que se envíe de nuevo.';
 if(s.campo==='apertura'){const dt=new Date(String(s.valorNuevo).replace(' ','T'));if(isNaN(dt))return'La fecha solicitada no es válida.';
  await ref.update({...base,fechaApertura:firebase.firestore.Timestamp.fromDate(dt)});audit('update',COL[t]+'/'+s.numero,{seccion:t,campos:['fechaApertura'],origen:'solicitud'});return null}
 if(s.campo==='numero'){if(!RX_NUM.test(s.valorNuevo))return'El número solicitado no tiene el formato XX-XXXXX.';if(await existe(t,s.valorNuevo))return'Ya existe ese número en la sección '+t+'.';
  const b=db.batch();b.set(col(t).doc(s.valorNuevo),{...orig,...base,numero:s.valorNuevo});b.delete(ref);await b.commit();audit('update',COL[t]+'/'+s.valorNuevo,{seccion:t,campos:['numero'],origen:'solicitud'});return null}
 if(s.campo==='tipo'){const n=s.valorNuevo;if(!COL[n]||n===t)return'El tipo solicitado no es válido.';if(await existe(n,s.numero))return'Ya existe ese número en la sección '+n+'.';
  if(n==='EXP-EST'&&!confirm('Al pasar a EXP-EST se descartan código mater, defunción, ingreso, egreso y los casos distintos de Z21. ¿Continuar?'))return'Cambio cancelado.';
  const b=db.batch();b.set(col(n).doc(s.numero),{...limpiar({...orig,tipo:n}),...base,listaKey:lk(n,tiempo(x))});b.delete(ref);await b.commit();audit('update',COL[n]+'/'+s.numero,{seccion:n,campos:['tipo'],origen:'solicitud'});return null}
 return'Campo no reconocido.'}
$('#corrLista').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b||!esAdmin())return;const w=b.closest('.corr-acc'),id=w.dataset.id,nota=w.querySelector('.nota').value.trim().slice(0,200),msg=$('#corrAdmMsg');msg.textContent='';
 w.querySelectorAll('button').forEach(x=>x.disabled=true);
 try{const sn=await COR().doc(id).get();if(!sn.exists||sn.data().estado!=='pendiente'){await listarCorr();return}
  const aplicar=b.dataset.a==='aplicar';
  if(aplicar){const er=await aplicarCorreccion({...sn.data(),_id:id});if(er){msg.textContent=er;w.querySelectorAll('button').forEach(x=>x.disabled=false);return}}
  const estado=aplicar?'aprobada':'rechazada',u=auth.currentUser;
  await COR().doc(id).update({estado,resueltaPor:u.uid,resueltaPorEmail:u.email,resueltaEn:TS(),notaAdmin:nota});
  audit('update','correcciones/'+id,{campos:['estado'],resultado:estado});await listarCorr();buscar()}
 catch(err){msg.textContent=falla(err);w.querySelectorAll('button').forEach(x=>x.disabled=false)}};
