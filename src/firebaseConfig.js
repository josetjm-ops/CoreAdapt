import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCxt7rOulp5bbKFW8PkNhU2SU-5Tl3CPbo",
  authDomain: "coreadapt-d7f0d.firebaseapp.com",
  projectId: "coreadapt-d7f0d",
  storageBucket: "coreadapt-d7f0d.firebasestorage.app",
  messagingSenderId: "593393226897",
  appId: "1:593393226897:web:79adc6af76bfed5f761b30",
  measurementId: "G-ZMDSSJXL97"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
