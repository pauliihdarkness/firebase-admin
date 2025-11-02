/**
 * Script para asignar rol de administrador a un usuario
 * 
 * Uso:
 * node scripts/asignar-admin.js <uid-del-usuario>
 * 
 * Ejemplo:
 * node scripts/asignar-admin.js abc123xyz789
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

// Inicializar Firebase Admin
initializeApp({
    credential: applicationDefault()
});

const db = getFirestore();

async function asignarAdmin(uid) {
    try {
        if (!uid) {
            console.error('❌ Error: Debes proporcionar el UID del usuario');
            console.log('\nUso: node scripts/asignar-admin.js <uid-del-usuario>');
            process.exit(1);
        }

        console.log(`\n🔄 Verificando usuario con UID: ${uid}...`);

        // Verificar que el usuario existe en Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
            console.error(`❌ Error: No se encontró un usuario con UID: ${uid}`);
            console.log('\n💡 Asegúrate de que el usuario esté registrado en la aplicación.');
            process.exit(1);
        }

        const userData = userDoc.data();
        console.log(`✅ Usuario encontrado: ${userData.email || userData.displayName || 'Sin nombre'}`);

        // Verificar que el usuario existe en Firebase Auth
        try {
            const userRecord = await admin.auth().getUser(uid);
            console.log(`✅ Usuario verificado en Firebase Auth: ${userRecord.email}`);
        } catch (error) {
            console.error(`❌ Error: El usuario no existe en Firebase Auth`);
            process.exit(1);
        }

        // Actualizar rol en Firestore
        console.log('\n🔄 Asignando rol de administrador...');
        await db.collection('users').doc(uid).update({
            role: 'admin',
            updatedAt: new Date().toISOString(),
            adminAssignedBy: 'script',
            adminAssignedAt: new Date().toISOString()
        });

        // Actualizar custom claims en Firebase Auth
        await admin.auth().setCustomUserClaims(uid, { admin: true });

        console.log('✅ Rol de administrador asignado exitosamente!');
        console.log('\n📋 Resumen:');
        console.log(`   - UID: ${uid}`);
        console.log(`   - Email: ${userData.email || 'N/A'}`);
        console.log(`   - Nombre: ${userData.displayName || 'N/A'}`);
        console.log(`   - Rol anterior: ${userData.role || 'user'}`);
        console.log(`   - Nuevo rol: admin`);
        console.log('\n✨ El usuario ahora puede acceder a todas las funciones de administrador.');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error al asignar rol de administrador:');
        console.error(error.message);
        process.exit(1);
    }
}

// Obtener UID del argumento de línea de comandos
const uid = process.argv[2];
asignarAdmin(uid);

