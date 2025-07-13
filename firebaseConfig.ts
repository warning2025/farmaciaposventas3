// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCoEyWsHGIIRNpMuby8Fb1aikt1pJtTTTQ",
  authDomain: "farmasantiagochijmuni.firebaseapp.com",
  projectId: "farmasantiagochijmuni",
  storageBucket: "farmasantiagochijmuni.firebasestorage.app",
  messagingSenderId: "1062467969345",
  appId: "1:1062467969345:web:0ba75921f60c74fbe3c1c0"
};

// Initialize Firebase
import { initializeApp } from "firebase/app";
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
