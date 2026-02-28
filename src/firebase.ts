import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmZMSZEqZbgjY6q9rBp1N4FJDqa20T6WE",
  authDomain: "count-time-7e879.firebaseapp.com",
  projectId: "count-time-7e879",
  storageBucket: "count-time-7e879.firebasestorage.app",
  messagingSenderId: "38354668085",
  appId: "1:38354668085:web:2454db9219b908acbc3f7c",
  measurementId: "G-J12WRP3LEE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
