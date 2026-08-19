/**
 * Persistencia opcional en Firestore.
 *
 * La partida vive en memoria: esto es solo para guardar estadísticas de partidas
 * terminadas sin bloquear el tiempo real. Está desactivado por defecto.
 *
 * Para activarlo:
 *   1. npm i firebase-admin -w @party-draw/server
 *   2. Definir FIREBASE_SERVICE_ACCOUNT_KEY con el JSON de la service account
 *   3. Descomentar el bloque de initFirebase
 */
let db = null;
export function initFirebase() {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log('ℹ️  [Firebase] Modo memoria (sin service account configurada)');
        return;
    }
    try {
        // const admin = await import('firebase-admin');
        // admin.initializeApp({
        //   credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
        // });
        // db = admin.firestore();
        console.log('🔥 [Firebase] Credenciales detectadas, pero el módulo está desactivado en el código');
    }
    catch (err) {
        console.warn('⚠️  [Firebase] Error de inicialización (sigue en memoria):', err);
    }
}
export async function persistFinishedGame(gameSummary) {
    if (!db)
        return;
    try {
        await db.collection('finished_games').add({
            ...gameSummary,
            savedAt: new Date()
        });
    }
    catch (err) {
        console.error('Error guardando estadísticas en Firestore:', err);
    }
}
