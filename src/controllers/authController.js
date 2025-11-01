import { admin } from "../firebaseConfig.js";
import db from "../firebaseConfig.js";

// Registrar usuario
export const registerUser = async (req, res) => {
    try {
        const { email, password, displayName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Crear usuario en Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
            emailVerified: false
        });

        // Guardar información adicional en Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email: userRecord.email,
            displayName: userRecord.displayName,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            uid: userRecord.uid,
            email: userRecord.email
        });
    } catch (error) {
        console.error('Error registrando usuario:', error);
        
        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({ error: 'Este email ya está registrado' });
        }
        
        res.status(500).json({ error: error.message });
    }
};

// Obtener información del usuario autenticado
export const getCurrentUser = async (req, res) => {
    try {
        const { uid } = req.user;

        // Obtener datos del usuario desde Firestore
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            uid,
            ...userDoc.data()
        });
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar información del usuario
export const updateUser = async (req, res) => {
    try {
        const { uid } = req.user;
        const { displayName, phoneNumber } = req.body;

        const updateData = {};
        if (displayName) updateData.displayName = displayName;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        // Actualizar en Firestore
        await db.collection('users').doc(uid).update({
            ...updateData,
            updatedAt: new Date().toISOString()
        });

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
    try {
        const { uid } = req.user;

        // Eliminar de Firestore
        await db.collection('users').doc(uid).delete();

        // Eliminar de Firebase Auth
        await admin.auth().deleteUser(uid);

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

// Listar todos los usuarios (solo admin)
export const getAllUsers = async (req, res) => {
    try {
        const { uid } = req.user;

        // Verificar si el usuario tiene permisos de admin
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            return res.status(403).json({ error: 'No tienes permisos para ver usuarios' });
        }

        // Obtener todos los usuarios de Firestore
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));

        res.json(users);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: error.message });
    }
};

// Verificar token de Google
export const verifyGoogleToken = async (req, res) => {
    try {
        // El token ya fue verificado por el middleware
        const { uid, email, name, picture } = req.user;

        // Verificar si el usuario existe en Firestore
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            // Crear usuario si no existe
            await db.collection('users').doc(uid).set({
                email,
                displayName: name,
                picture,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                provider: 'google'
            });
        } else {
            // Actualizar lastLogin
            await db.collection('users').doc(uid).update({
                lastLogin: new Date().toISOString()
            });
        }

        res.json({
            message: 'Autenticación exitosa',
            user: {
                uid,
                email,
                name,
                picture
            }
        });
    } catch (error) {
        console.error('Error verificando token de Google:', error);
        res.status(500).json({ error: error.message });
    }
};

