/**
 * Configuración del proyecto de Firebase.
 *
 * La partida NO usa Firebase: todo el tiempo real pasa por Socket.IO y el estado
 * vive en el servidor. Firebase solo se usa como hosting estático del frontend.
 *
 * Este archivo queda como referencia de los datos del proyecto. Si más adelante
 * se quiere Analytics o Firestore desde el cliente:
 *   1. npm i firebase -w @party-draw/web
 *   2. Inicializar acá con initializeApp(firebaseConfig)
 *
 * Nota: estas claves son públicas por diseño en apps web de Firebase; la
 * protección real va en las reglas de seguridad de Firestore/Storage.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyAnQv74uGNG4TldVb1yWwLGVjB3WvPsHTE',
  authDomain: 'juegos-tv.firebaseapp.com',
  projectId: 'juegos-tv',
  storageBucket: 'juegos-tv.firebasestorage.app',
  messagingSenderId: '623910131650',
  appId: '1:623910131650:web:50005f595ee8e7fcc8685b',
  measurementId: 'G-S0BJFN8C84'
};
