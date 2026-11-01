/* Agenda de citas. Servicios, turnos y horarios se configuran en SERV y TURNO (abajo). */
firebase.initializeApp(firebaseConfig);
if(['localhost','127.0.0.1'].includes(location.hostname))self.FIREBASE_APPCHECK_DEBUG_TOKEN=true;
if(!RECAPTCHA_SITE_KEY.startsWith('TU_'))firebase.appCheck().activate(RECAPTCHA_SITE_KEY,true);
const auth=firebase.auth(),db=firebase.firestore(),TS=firebase.firestore.FieldValue.serverTimestamp;
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(()=>{});
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const falla=e=>{console.error('Error:',e&&e.code||'desconocido');return e&&e.code==='permission-denied'?'No tienes permiso para realizar esta acción.':'No se pudo completar la operación. Intenta de nuevo.'};
const audit=(accion,id,extra)=>{const u=auth.currentUser;if(!u)return;db.collection('audit_log').add({timestamp:TS(),user_id:u.uid,user_email:u.email,action:accion,resource_type:'agenda',resource_id:id||'',...extra}).catch(e=>console.error('Auditoría:',e.code))};
let idle;const reiniciar=()=>{clearTimeout(idle);if(auth.currentUser)idle=setTimeout(()=>auth.signOut(),15*60*1000)};
['click','keydown','mousemove','touchstart'].forEach(ev=>addEventListener(ev,reiniciar,{passive:true}));

/* ---------- Configuración: servicios, turnos y horarios ---------- */
const PASO=20; /* minutos entre una cita y la siguiente; la primera cita de cada turno matutino es a las 08:00 */
const TURNO={matutino:{n:'Matutino',i:'08:00',f:'14:00'},vespertino:{n:'Vespertino',i:'14:00',f:'20:00'},'diurno-especial':{n:'Diurno especial',i:'08:00',f:'20:00'}};
const SERV={estomatologia:{n:'Estomatología',t:['matutino','vespertino']},'mujer-salud':{n:'Mujer Salud',t:['matutino','vespertino','diurno-especial']},
 'medicina-interna':{n:'Medicina Interna',t:['matutino','vespertino']},nutricion:{n:'Nutrición',t:['matutino','vespertino']},
 'planificacion-familiar':{n:'Planificación Familiar',t:['matutino']},pediatria:{n:'Pediatría',t:['matutino']},otb:{n:'OTB',t:['matutino']},ginecologia:{n:'Ginecología',t:['matutino']}};
const RX_NUM=/^\d{2}-\d{5}$/;
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const hhmm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const aMin=h=>{const[a,b]=h.split(':').map(Number);return a*60+b};
const horas=t=>{const r=[];for(let m=aMin(TURNO[t].i);m<aMin(TURNO[t].f);m+=PASO)r.push(hhmm(m));return r};
const idCita=(s,f,t,h)=>`${s}_${f}_${t}_${h.replace(':','')}`;
const diaTxt=f=>new Date(f+'T00:00').toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const aviso=t=>{const a=$('#aviso');a.textContent=t;a.classList.add('on');setTimeout(()=>a.classList.remove('on'),3200)};

let perfil=null,unPerfil,unCitas,citas=[],fecha=iso(new Date()),svc=Object.keys(SERV)[0],turno=SERV[svc].t[0],modo='nueva',actual=null,slot=null,autoNom=false;
const esAdmin=()=>!!perfil&&perfil.rol==='admin';
const svcDlg=()=>modo==='nueva'?(slot&&slot.servicio):(actual&&actual.servicio); /* servicio de la cita del diálogo abierto */
const show=id=>$$('.view').forEach(v=>v.hidden=v.id!==id);

/* ---------- Acceso ---------- */
auth.onAuthStateChanged(u=>{unPerfil&&unPerfil();unCitas&&unCitas();clearTimeout(idle);
 if(!u){perfil=null;citas=[];$$('dialog').forEach(d=>d.open&&d.close());return show('sinAcceso')}
 unPerfil=db.doc('users/'+u.uid).onSnapshot(s=>{perfil=s.data()||{};
  if(!perfil.aprobado)return show('sinAcceso');
  show('ag');$('#quien').textContent=u.email;$('#fecha').value=fecha;reiniciar();badgeSol();cargarDia()},e=>{console.error('Error:',e.code);show('sinAcceso')})});
$('#btnSalir').onclick=()=>auth.signOut();

/* ---------- Día: resumen, turnos y horarios ---------- */
function cargarDia(){unCitas&&unCitas();unCitas=db.collection('citas').where('fecha','==',fecha).onSnapshot(s=>{citas=s.docs.map(d=>({id:d.id,...d.data()}));pintar()},e=>{$('#slots').textContent=falla(e)})}
function pintar(){$('#fechaTxt').textContent=diaTxt(fecha);
 $('#resumen').innerHTML=Object.entries(SERV).map(([k,s])=>{const por=s.t.map(t=>citas.filter(c=>c.servicio===k&&c.turno===t).length),tot=por.reduce((a,b)=>a+b,0);
  return `<button type="button" class="svc${k===svc?' on':''}${tot?'':' vacio0'}" data-k="${k}"><b>${esc(s.n)}</b><span>${tot?tot+(tot===1?' cita':' citas'):'Sin citas'}</span><small>${s.t.map((t,i)=>esc(TURNO[t].n.slice(0,3))+' '+por[i]+'/'+horas(t).length).join(' · ')}</small></button>`}).join('');
 $('#turnos').innerHTML=SERV[svc].t.map(t=>`<button type="button" class="stab${t===turno?' on':''}" data-t="${t}">${esc(TURNO[t].n)} · ${TURNO[t].i}–${TURNO[t].f}</button>`).join('');
 $('#slots').innerHTML=horas(turno).map(h=>{const c=citas.find(x=>x.servicio===svc&&x.turno===turno&&x.hora===h);
  return c?`<div class="slot oc"><span class="h">${h}</span><span class="n"><b>${esc(c.nombre)}</b> · ${esc(c.numero)}</span><button type="button" class="btn ghost sm" data-a="g" data-h="${h}">${esAdmin()?'Gestionar':'Solicitar cambio'}</button></div>`
   :`<div class="slot"><span class="h">${h}</span><span class="n lib">Disponible</span><button type="button" class="btn sm" data-a="n" data-h="${h}">Agendar</button></div>`}).join('')}
$('#resumen').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;svc=b.dataset.k;turno=SERV[svc].t.find(t=>citas.some(c=>c.servicio===svc&&c.turno===t))||SERV[svc].t[0];pintar()};
$('#turnos').onclick=e=>{const b=e.target.closest('[data-t]');if(b){turno=b.dataset.t;pintar()}};
$('#slots').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const h=b.dataset.h;
 if(b.dataset.a==='n')abrirNueva(h);else{const c=citas.find(x=>x.servicio===svc&&x.turno===turno&&x.hora===h);if(c)abrirGestion(c)}};
const irDia=f=>{if(!f)return;fecha=f;$('#fecha').value=f;cargarDia()};
$('#fecha').onchange=()=>irDia($('#fecha').value);
const mover=n=>{const d=new Date(fecha+'T00:00');d.setDate(d.getDate()+n);irDia(iso(d))};
$('#diaAnt').onclick=()=>mover(-1);$('#diaSig').onclick=()=>mover(1);$('#hoy').onclick=()=>irDia(iso(new Date()));
$$('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());

/* ---------- Agendar / gestionar ---------- */
async function agendar(d){const u=auth.currentUser,ref=db.doc('citas/'+idCita(d.servicio,d.fecha,d.turno,d.hora));
 await db.runTransaction(async tx=>{if((await tx.get(ref)).exists)throw{code:'ocupado'};tx.set(ref,{...d,creadoPor:u.uid,creadoPorEmail:u.email,creadaEn:TS()})});
 audit('create','citas/'+ref.id,{servicio:d.servicio})}
async function guardarCita(c,n){const u=auth.currentUser,idN=idCita(c.servicio,n.fecha,n.turno,n.hora),rOld=db.doc('citas/'+c.id),rNew=db.doc('citas/'+idN);
 await db.runTransaction(async tx=>{const so=await tx.get(rOld);if(!so.exists)throw{code:'falta'};const nuevo={...so.data(),turno:n.turno,fecha:n.fecha,hora:n.hora,numero:n.numero,nombre:n.nombre,editadoPor:u.uid,editadoPorEmail:u.email,editadoEn:TS()};
  if(idN===c.id)tx.update(rOld,nuevo);else{if((await tx.get(rNew)).exists)throw{code:'ocupado'};tx.set(rNew,nuevo);tx.delete(rOld)}});
 audit('update','citas/'+idN,{servicio:c.servicio,campos:['turno','fecha','hora','numero','nombre'].filter(k=>n[k]!==c[k])})}
async function cancelarCita(c){await db.runTransaction(async tx=>{const r=db.doc('citas/'+c.id);if(!(await tx.get(r)).exists)throw{code:'falta'};tx.delete(r)});audit('delete','citas/'+c.id,{servicio:c.servicio})}
const llenarHoras=(t,sel)=>{$('#cHora').innerHTML=horas(t).map(h=>`<option>${h}</option>`).join('');if(sel&&horas(t).includes(sel))$('#cHora').value=sel};
$('#cTurno').onchange=()=>llenarHoras($('#cTurno').value,$('#cHora').value);
function dlg(m,tit,ok,fijo){modo=m;autoNom=false;$('#cTit').textContent=tit;$('#cOk').textContent=ok;$('#cMsg').textContent='';$('#cSug').textContent='';
 ['#cFL','#cTL','#cHL'].forEach(s=>$(s).hidden=fijo);$('#cML').hidden=m!=='solicitud';$('#cMot').value='';$('#cDel').hidden=m==='nueva';$('#cDel').textContent=m==='admin'?'Cancelar cita':'Solicitar cancelación'}
function abrirNueva(h){slot={servicio:svc,turno,fecha,hora:h};actual=null;dlg('nueva','Agendar cita','Agendar',true);
 $('#cInfo').textContent=`${SERV[svc].n} · ${TURNO[turno].n} · ${diaTxt(fecha)} · ${h}`+(svc==='estomatologia'?' · Solo expedientes de Estomatología (EXP-EST)':'');$('#cNum').value='';$('#cNom').value='';$('#dlgCita').showModal();$('#cNum').focus()}
function abrirGestion(c){actual=c;dlg(esAdmin()?'admin':'solicitud',esAdmin()?'Gestionar cita':'Solicitar cambio en la cita',esAdmin()?'Guardar cambios':'Enviar solicitud',false);
 $('#cInfo').textContent=`${SERV[c.servicio].n} · ${diaTxt(c.fecha)} · ${c.hora}`+(c.servicio==='estomatologia'?' · Solo expedientes de Estomatología (EXP-EST)':'')+(esAdmin()?'':' · Solo un administrador puede modificarla: describe el cambio y el motivo.');
 $('#cFecha').value=c.fecha;$('#cTurno').innerHTML=SERV[c.servicio].t.map(t=>`<option value="${t}">${esc(TURNO[t].n)}</option>`).join('');$('#cTurno').value=c.turno;llenarHoras(c.turno,c.hora);
 $('#cNum').value=c.numero;$('#cNom').value=c.nombre;$('#dlgCita').showModal()}

/* Completar el nombre al escribir el número de expediente (también se puede escribir a mano) */
$('#cNom').oninput=()=>{autoNom=false};
$('#cNum').oninput=async()=>{const n=$('#cNum').value.trim(),sug=$('#cSug');sug.textContent='';if(!RX_NUM.test(n))return;
 try{const est=svcDlg()==='estomatologia',[g,e]=await Promise.all([est?Promise.resolve({exists:false}):db.doc('exp-gen/'+n).get(),db.doc('exp-den/'+n).get()]);if($('#cNum').value.trim()!==n)return;
  const r=[[g,'EXP-GN'],[e,'EXP-EST']].filter(([s])=>s.exists).map(([s,t])=>({t,nombre:s.data().nombre||''}));
  if(!r.length){sug.textContent=est?'No existe un expediente de Estomatología (EXP-EST) con ese número. En esta agenda solo se pueden agendar expedientes de esa sección.':'No se encontró el expediente; captura el nombre a mano.';return}
  audit('read','agenda/consulta-expediente',{secciones:r.map(x=>x.t)});
  const poner=nom=>{$('#cNom').value=nom;autoNom=true};
  if(r.length===1){if(!$('#cNom').value.trim()||autoNom||modo==='nueva')poner(r[0].nombre);sug.textContent='Nombre completado desde '+r[0].t+'. Puedes corregirlo.'}
  else{sug.innerHTML='El número existe en ambas secciones. Elige: '+r.map((x,i)=>`<button type="button" class="btn ghost sm" data-i="${i}">${esc(x.t)} · ${esc(x.nombre)}</button>`).join(' ');
   sug.onclick=ev=>{const b=ev.target.closest('[data-i]');if(b){poner(r[b.dataset.i].nombre);sug.textContent='Nombre completado. Puedes corregirlo.'}}}}
 catch(err){sug.textContent='No se pudo consultar el expediente; captura el nombre a mano.';console.error('Error:',err.code)}};

const COL_S=()=>db.collection('citas_solicitudes');
async function crearSolicitud(accion,c,n,motivo){const u=auth.currentUser;
 const prev=(await COL_S().where('solicitante','==',u.uid).get()).docs.some(d=>d.data().citaId===c.id&&d.data().estado==='pendiente');if(prev)throw{code:'dup'};
 const r=await COL_S().add({accion,citaId:c.id,servicio:c.servicio,turno:c.turno,fecha:c.fecha,hora:c.hora,numero:c.numero,nombre:c.nombre,
  nTurno:n?n.turno:'',nFecha:n?n.fecha:'',nHora:n?n.hora:'',nNumero:n?n.numero:'',nNombre:n?n.nombre:'',motivo,estado:'pendiente',solicitante:u.uid,solicitanteEmail:u.email,creadaEn:TS()});
 audit('create','citas_solicitudes/'+r.id,{servicio:c.servicio,accion})}
const ERR={noEst:'Ese número no corresponde a un expediente de Estomatología (EXP-EST). En la agenda de Estomatología solo se pueden agendar expedientes de esa sección.',ocupado:'Ese horario ya está ocupado.',falta:'La cita ya no existe.',dup:'Ya tienes una solicitud pendiente para esta cita.',estado:'Esta solicitud ya fue resuelta.',cambio:'La cita cambió desde que se hizo la solicitud. Recházala y pide que se envíe de nuevo.'};
const bloquear=on=>$$('#fCita button').forEach(b=>b.disabled=on);
$('#fCita').onsubmit=async e=>{e.preventDefault();const m=$('#cMsg');m.textContent='';
 const numero=$('#cNum').value.trim(),nombre=$('#cNom').value.trim().replace(/\s+/g,' ').toUpperCase().slice(0,150);
 if(!RX_NUM.test(numero))return m.textContent='El número debe tener el formato XX-XXXXX.';
 if(nombre.length<3)return m.textContent='Escribe el nombre del paciente.';
 bloquear(true);
 try{if(svcDlg()==='estomatologia'&&(modo==='nueva'||numero!==actual.numero)&&!(await db.doc('exp-den/'+numero).get()).exists)throw{code:'noEst'};
  if(modo==='nueva'){await agendar({...slot,numero,nombre});$('#dlgCita').close();aviso('Cita agendada')}
  else{const n={turno:$('#cTurno').value,fecha:$('#cFecha').value,hora:$('#cHora').value,numero,nombre};
   if(!n.fecha)return m.textContent='Indica la fecha.';
   const cambios=['turno','fecha','hora','numero','nombre'].some(k=>n[k]!==actual[k]);
   if(modo==='admin'){if(!cambios)return m.textContent='No hay cambios que guardar.';await guardarCita(actual,n);$('#dlgCita').close();aviso('Cita actualizada')}
   else{const motivo=$('#cMot').value.trim();if(!cambios)return m.textContent='No hay cambios que solicitar.';if(motivo.length<5)return m.textContent='Explica brevemente el motivo.';
    const idN=idCita(actual.servicio,n.fecha,n.turno,n.hora);if(idN!==actual.id&&(await db.doc('citas/'+idN).get()).exists)return m.textContent='Ese horario ya está ocupado.';
    await crearSolicitud('modificar',actual,n,motivo.slice(0,300));$('#dlgCita').close();aviso('Solicitud enviada a los administradores')}}}
 catch(err){m.textContent=ERR[err&&err.code]||falla(err)}finally{bloquear(false)}};
$('#cDel').onclick=async()=>{const m=$('#cMsg');m.textContent='';if(!actual)return;bloquear(true);
 try{if(modo==='admin'){if(!confirm('¿Cancelar esta cita? El horario quedará disponible.'))return;await cancelarCita(actual);$('#dlgCita').close();aviso('Cita cancelada')}
  else{const motivo=$('#cMot').value.trim();if(motivo.length<5)return m.textContent='Explica brevemente el motivo de la cancelación.';await crearSolicitud('cancelar',actual,null,motivo.slice(0,300));$('#dlgCita').close();aviso('Solicitud enviada a los administradores')}}
 catch(err){m.textContent=ERR[err&&err.code]||falla(err)}finally{bloquear(false)}};

/* ---------- Solicitudes de cambio: las pide un capturista, las decide un administrador ---------- */
const CAMPOS_SOL=[['nTurno','turno','Turno'],['nFecha','fecha','Fecha'],['nHora','hora','Hora'],['nNumero','numero','Número'],['nNombre','nombre','Nombre']];
const tSol=(s,adm)=>{const est={pendiente:['Pendiente','t'],aprobada:['Aprobada','a'],rechazada:['Rechazada','p']}[s.estado]||['',''];
 const cambios=s.accion==='cancelar'?'<p><b>Cancelar la cita</b></p>':CAMPOS_SOL.filter(([n,o])=>s[n]&&s[n]!==s[o]).map(([n,o,l])=>`<p>${l}: <s>${esc(s[o])}</s> → <b>${esc(s[n])}</b></p>`).join('');
 return `<section class="nov"><h3>${esc((SERV[s.servicio]||{}).n||s.servicio)} · ${esc(s.fecha)} ${esc(s.hora)}<span class="tag ${est[1]}">${est[0]}</span></h3><p class="hint">${esc(s.nombre)} · ${esc(s.numero)}${adm?' · '+esc(s.solicitanteEmail||''):''}</p>${cambios}<p class="hint">Motivo: ${esc(s.motivo)}</p>${s.notaAdmin?`<p class="hint">Respuesta del administrador: ${esc(s.notaAdmin)}</p>`:''}${adm&&s.estado==='pendiente'?`<div class="corr-acc" data-id="${esc(s._id)}"><input class="nota" placeholder="Nota (opcional)" maxlength="200"><button type="button" class="btn sm" data-a="ap">Aplicar</button><button type="button" class="btn ghost sm" data-a="re">Rechazar</button></div>`:''}</section>`};
const porFecha=(a,b)=>(b.creadaEn?b.creadaEn.toMillis():0)-(a.creadaEn?a.creadaEn.toMillis():0);
async function cargarSol(){const L=$('#sLista');L.textContent='Cargando…';
 try{let q=COL_S();q=esAdmin()?($('#sVer').value==='pendiente'?q.where('estado','==','pendiente'):q.where('estado','in',['aprobada','rechazada'])):q.where('solicitante','==',auth.currentUser.uid);
  const r=(await q.limit(50).get()).docs.map(d=>({...d.data(),_id:d.id})).sort(porFecha);L.innerHTML=r.length?r.map(x=>tSol(x,esAdmin())).join(''):'<p class="hint">No hay solicitudes.</p>'}
 catch(err){L.textContent=falla(err)}}
async function badgeSol(){const b=$('#btnSolAg'),p=$('#solPunto');b.firstChild.textContent=esAdmin()?'Solicitudes':'Mis solicitudes';p.hidden=true;if(!esAdmin())return;
 try{const n=(await COL_S().where('estado','==','pendiente').get()).size;p.hidden=!n;p.textContent=n>9?'9+':String(n)}catch(e){console.error('Error:',e.code)}}
$('#btnSolAg').onclick=()=>{$('#sVerL').hidden=!esAdmin();$('#sVer').value='pendiente';$('#sTit').textContent=esAdmin()?'Solicitudes de cambio':'Mis solicitudes de cambio';$('#sMsg').textContent='';cargarSol();$('#dlgSol').showModal()};
$('#sVer').onchange=cargarSol;$('#dlgSol').addEventListener('close',badgeSol);
async function resolverSol(id,aplicar,nota){const u=auth.currentUser,rs=db.doc('citas_solicitudes/'+id);
 await db.runTransaction(async tx=>{const ss=await tx.get(rs);if(!ss.exists||ss.data().estado!=='pendiente')throw{code:'estado'};const s=ss.data();
  if(aplicar){const rc=db.doc('citas/'+s.citaId),sc=await tx.get(rc);if(!sc.exists)throw{code:'falta'};const c=sc.data();
   if(c.numero!==s.numero||c.fecha!==s.fecha||c.hora!==s.hora||c.turno!==s.turno)throw{code:'cambio'};
   if(s.accion==='modificar'&&c.servicio==='estomatologia'&&s.nNumero!==c.numero&&!(await tx.get(db.doc('exp-den/'+s.nNumero))).exists)throw{code:'noEst'};
   if(s.accion==='cancelar')tx.delete(rc);
   else{const n={...c,turno:s.nTurno,fecha:s.nFecha,hora:s.nHora,numero:s.nNumero,nombre:s.nNombre,editadoPor:u.uid,editadoPorEmail:u.email,editadoEn:TS()},idN=idCita(c.servicio,n.fecha,n.turno,n.hora);
    if(idN===s.citaId)tx.update(rc,n);else{const rn=db.doc('citas/'+idN);if((await tx.get(rn)).exists)throw{code:'ocupado'};tx.set(rn,n);tx.delete(rc)}}}
  tx.update(rs,{estado:aplicar?'aprobada':'rechazada',resueltaPor:u.uid,resueltaPorEmail:u.email,resueltaEn:TS(),notaAdmin:nota})});
 audit('update','citas_solicitudes/'+id,{campos:['estado'],resultado:aplicar?'aprobada':'rechazada'})}
$('#sLista').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b||!esAdmin())return;const w=b.closest('.corr-acc'),nota=w.querySelector('.nota').value.trim().slice(0,200),msg=$('#sMsg');msg.textContent='';
 w.querySelectorAll('button').forEach(x=>x.disabled=true);
 try{await resolverSol(w.dataset.id,b.dataset.a==='ap',nota);aviso(b.dataset.a==='ap'?'Cambio aplicado':'Solicitud rechazada');await cargarSol();badgeSol()}
 catch(err){msg.textContent=ERR[err&&err.code]||falla(err);w.querySelectorAll('button').forEach(x=>x.disabled=false)}};

/* ---------- Imprimir el historial semanal de un servicio ---------- */
const lunesDe=f=>{const d=new Date(f+'T00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)};
const sumaDias=(f,n)=>{const d=new Date(f+'T00:00');d.setDate(d.getDate()+n);return iso(d)};
const rango=f=>{const l=lunesDe(f),d=sumaDias(l,6),o={day:'numeric',month:'long',year:'numeric'};return{l,d,txt:'Semana del '+new Date(l+'T00:00').toLocaleDateString('es-MX',o)+' al '+new Date(d+'T00:00').toLocaleDateString('es-MX',o)}};
const rangoTxt=()=>{const f=$('#iFecha').value;$('#iRango').textContent=f?rango(f).txt:''};
$('#iFecha').onchange=rangoTxt;
$('#btnImp').onclick=()=>{$('#iSvc').innerHTML=Object.entries(SERV).map(([k,s])=>`<option value="${k}">${esc(s.n)}</option>`).join('');$('#iSvc').value=svc;$('#iFecha').value=fecha;$('#iMsg').textContent='';rangoTxt();$('#dlgImp').showModal()};
$('#iGo').onclick=async()=>{const k=$('#iSvc').value,f=$('#iFecha').value,m=$('#iMsg');m.textContent='';if(!SERV[k]||!f)return m.textContent='Elige el servicio y la fecha.';
 const{l,d,txt}=rango(f);
 try{const s=await db.collection('citas').orderBy(firebase.firestore.FieldPath.documentId()).startAt(k+'_'+l).endAt(k+'_'+d+'\uf8ff').get();
  const r=s.docs.map(x=>x.data()).sort((a,b)=>(a.fecha+a.hora+a.turno).localeCompare(b.fecha+b.hora+b.turno));
  const dias={};r.forEach(c=>(dias[c.fecha]=dias[c.fecha]||[]).push(c));
  const u=auth.currentUser,ahora=new Date().toLocaleString('es-MX',{dateStyle:'long',timeStyle:'short'});
  $('#imprimible').innerHTML=`<h1>Agenda de ${esc(SERV[k].n)}</h1><p>${esc(txt)} · ${r.length} ${r.length===1?'cita':'citas'}</p>`
   +(r.length?Object.keys(dias).sort().map(f=>`<h3>${esc(diaTxt(f))}</h3><table><thead><tr><th>Hora</th><th>Turno</th><th>Paciente</th><th>No. de expediente</th></tr></thead><tbody>${dias[f].map(c=>`<tr><td>${esc(c.hora)}</td><td>${esc((TURNO[c.turno]||{}).n||c.turno)}</td><td>${esc(c.nombre)}</td><td>${esc(c.numero)}</td></tr>`).join('')}</tbody></table>`).join(''):'<p>No hay citas agendadas esta semana.</p>')
   +`<p style="margin-top:14pt">Impreso por ${esc(u.email)} el ${esc(ahora)}.</p>`;
  audit('print','agenda/'+k,{semana:l,registros:r.length});$('#dlgImp').close();setTimeout(()=>window.print(),150)}
 catch(err){m.textContent=falla(err)}};
