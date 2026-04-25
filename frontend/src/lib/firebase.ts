import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAEtT0dbjTKRayKTYpvOuV6hFhjEAjIo-M",
  authDomain: "trex-ai-8eb81.firebaseapp.com",
  projectId: "trex-ai-8eb81",
  storageBucket: "trex-ai-8eb81.firebasestorage.app",
  messagingSenderId: "922123469227",
  appId: "1:922123469227:web:247f3c35cf0315dce892ee",
  measurementId: "G-VH3TQTT2XS"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Analytics is only supported in browser
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, analytics };
