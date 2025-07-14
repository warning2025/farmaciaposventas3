// Importa las funciones necesarias del SDK de Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de Firebase para la aplicación web
const firebaseConfig = {
  apiKey: "AIzaSyCb0B5JydjbAifwHaqTkEvxoP956ReG4wY",
  authDomain: "sistemafarmaciapos1.firebaseapp.com",
  projectId: "sistemafarmaciapos1",
  storageBucket: "sistemafarmaciapos1.firebasestorage.app",
  messagingSenderId: "228678641939",
  appId: "1:228678641939:web:458f71d15da5f8ea9c12e6"
};

// Inicializa Firebase
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Firebase está inicializado y listo para usar
  console.log('Firebase inicializado correctamente');
} catch (error) {
  console.error("Error inicializando Firebase:", error);
}

export { auth, db, storage };
