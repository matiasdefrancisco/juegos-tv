import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAnQv74uGNG4TldVb1yWwLGVjB3WvPsHTE",
  authDomain: "juegos-tv.firebaseapp.com",
  projectId: "juegos-tv",
  storageBucket: "juegos-tv.firebasestorage.app",
  messagingSenderId: "623910131650",
  appId: "1:623910131650:web:50005f595ee8e7fcc8685b",
  measurementId: "G-S0BJFN8C84"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Analytics if supported in browser environment
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
