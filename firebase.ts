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
  apiKey: "AIzaSyB9wkztM81-10whQTgriIIwt47PKqq6w_M",
  authDomain: "afora-c43eb.firebaseapp.com",
  projectId: "afora-c43eb",
  storageBucket: "afora-c43eb.firebasestorage.app",
  messagingSenderId: "49038881968",
  appId: "1:49038881968:web:2ccc7140b5aaced886f775",
  measurementId: "G-VNLNQ2LW5L"
};

const app = getApps().length === 0? initializeApp(firebaseConfig) : getApp();
// NOTE: this db is for client side and all normal operations such as data fetching
const db = getFirestore(app);
const storage = getStorage();
const storageBucket = 'afora-c43eb.firebasestorage.app';

export { db, app, storage, storageBucket }