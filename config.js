/* Configuración del proyecto Firebase. Se pega UNA sola vez aquí (ya no va dentro de app.js) y la usan el sitio y la agenda.
   Este archivo no contiene datos de pacientes; si usas GitHub, puedes dejarlo fuera del repositorio (.gitignore). */
const firebaseConfig = {
  apiKey: "AIzaSyCUgQdNjvUAhDx7oPKPZE6FEnUMUuC4l70",
  authDomain: "hmivg-exp-35057.firebaseapp.com",
  projectId: "hmivg-exp-35057",
  storageBucket: "hmivg-exp-35057.firebasestorage.app",
  messagingSenderId: "882677479294",
  appId: "1:882677479294:web:af21c735f53d8153aa252f",
  measurementId: "G-9Y54VE2T85"
};
/* Clave PÚBLICA (site key) de reCAPTCHA v3 para App Check. Déjala con "TU_..." mientras no lo configures. */
const RECAPTCHA_SITE_KEY="TU_CLAVE_RECAPTCHA_V3";
