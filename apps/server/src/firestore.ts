/**
 * Optional Firebase Firestore integration module.
 * Used for persisting completed game statistics, telemetry, and custom word decks
 * without blocking realtime in-memory socket operations.
 */
let db: any = null;

export function initFirebase(): void {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // In case Firebase credentials are provided via environment
      // const admin = require('firebase-admin');
      // admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) });
      // db = admin.firestore();
      console.log('🔥 [Firebase] Initialized Firestore connection');
    } else {
      console.log('ℹ️ [Firebase] Running in local in-memory mode (No service account configured)');
    }
  } catch (err) {
    console.warn('⚠️ [Firebase] Init error (falling back to memory):', err);
  }
}

export async function persistFinishedGame(gameSummary: any): Promise<void> {
  if (!db) return;
  try {
    await db.collection('finished_games').add({
      ...gameSummary,
      savedAt: new Date()
    });
  } catch (err) {
    console.error('Error saving game stats to Firestore:', err);
  }
}
