// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4mDDPY6JrAXK1PM45_wfTVJZUrgmUh64",
  authDomain: "muvimax-71128.firebaseapp.com",
  projectId: "muvimax-71128",
  storageBucket: "muvimax-71128.firebasestorage.app",
  messagingSenderId: "1012683941727",
  appId: "1:1012683941727:web:1f41e85acc40b5db75f8ea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, db, storage, analytics };
