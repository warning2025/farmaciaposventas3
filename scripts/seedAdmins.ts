import { db } from "../firebaseConfig";
import { setDoc, doc } from "firebase/firestore";

// Reemplaza estos valores por los UID nuevos que te dio Firebase
const adminUsers = [
  {
    uid: "NUEVO_UID_ADMIN", // UID nuevo de admin@sistemafarmacia.com
    email: "admin@sistemafarmacia.com",
    displayName: "Administrador",
    role: "admin",
    activo: true
  },
  {
    uid: "NUEVO_UID_CREADOR", // UID nuevo de elcreadorweb@gmail.com
    email: "elcreadorweb@gmail.com",
    displayName: "Creador Web",
    role: "admin",
    activo: true
  }
];

async function seedUsers() {
  for (const user of adminUsers) {
    await setDoc(doc(db, "users", user.uid), user);
    console.log(`Usuario ${user.email} creado con UID ${user.uid}`);
  }
}

seedUsers().then(() => {
  console.log("Usuarios administradores creados correctamente.");
  process.exit(0);
}).catch((err) => {
  console.error("Error creando usuarios:", err);
  process.exit(1);
});
