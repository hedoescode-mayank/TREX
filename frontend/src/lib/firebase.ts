import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCRI0Oie0FMoh2cHBY3z42JW8LUmCqbuJM",
  authDomain: "trex-ddaab.firebaseapp.com",
  databaseURL: "https://trex-ddaab-default-rtdb.firebaseio.com",
  projectId: "trex-ddaab",
  storageBucket: "trex-ddaab.firebasestorage.app",
  messagingSenderId: "250665471560",
  appId: "1:250665471560:web:683b15cb1763371a24527d",
  measurementId: "G-LF1PRNC8JF"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { app, auth, analytics, db, rtdb, storage };
