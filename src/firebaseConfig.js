import { getFirestore } from "firebase-admin/firestore";
import { config } from "dotenv";
config();

import { initializeApp, applicationDefault } from "firebase-admin/app";
import admin from "firebase-admin";

// Inicializar Firebase Admin
initializeApp({
    credential: applicationDefault()
});

const db = getFirestore();

// Exportar admin para uso en autenticación
export { admin };
export default db;
