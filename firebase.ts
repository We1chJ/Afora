// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeM_jITuesHwfKKFX4Pqh9aC2srA1fZfs",
  authDomain: "afora-42edb.firebaseapp.com",
  projectId: "afora-42edb",
  storageBucket: "afora-42edb.firebasestorage.app",
  messagingSenderId: "521371419871",
  appId: "1:521371419871:web:1b7ccaebd59ed944bad56a",
  measurementId: "G-V59K1CG4ZE"
};

const app = getApps().length === 0? initializeApp(firebaseConfig) : getApp();
// NOTE: this db is for client side and all normal operations such as data fetching
const db = getFirestore(app);
const storage = getStorage();
const storageBucket = 'afora-42edb.firebasestorage.app';

export { db, app, storage, storageBucket }