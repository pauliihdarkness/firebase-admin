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
            role: 'user', // Rol por defecto: user, admin, moderador
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

// Listar todos los usuarios (solo admin o si no hay admins)
export const getAllUsers = async (req, res) => {
    try {
        const { uid } = req.user;
        
        // Verificar si hay algún admin en el sistema
        const allUsersSnapshot = await db.collection('users').get();
        const hasAnyAdmin = allUsersSnapshot.docs.some(doc => {
            const userData = doc.data();
            return userData.role === 'admin';
        });
        
        // Si hay admins, verificar que el usuario actual sea admin
        if (hasAnyAdmin) {
            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            const userData = userDoc.data();
            if (userData.role !== 'admin') {
                return res.status(403).json({ error: 'No tienes permisos para ver usuarios' });
            }
        }
        // Si no hay admins, permitir acceso a cualquier usuario autenticado
        
        // Obtener todos los usuarios de Firestore
        const users = allUsersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data(),
            role: doc.data().role || 'user' // Asegurar que todos tengan rol
        }));

        res.json(users);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar rol de usuario (solo admin)
export const updateUserRole = async (req, res) => {
    try {
        const { uid: requestingUid } = req.user;
        const { uid: targetUid, role } = req.body;

        // Verificar que el usuario que hace la petición sea admin
        const adminDoc = await db.collection('users').doc(requestingUid).get();
        if (!adminDoc.exists) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const adminData = adminDoc.data();
        
        // Verificar si hay algún admin en el sistema
        const allUsersSnapshot = await db.collection('users').get();
        const hasAnyAdmin = allUsersSnapshot.docs.some(doc => {
            const userData = doc.data();
            return userData.role === 'admin';
        });
        
        // Si no hay ningún admin y se está intentando crear uno, permitirlo
        if (!hasAnyAdmin && role === 'admin') {
            // Permitir que cualquier usuario autenticado se convierta en el primer admin
            console.log(`Primer admin siendo creado: ${targetUid} por ${requestingUid}`);
        } else if (adminData.role !== 'admin') {
            return res.status(403).json({ error: 'Solo los administradores pueden cambiar roles' });
        }

        // Validar rol
        const validRoles = ['admin', 'user', 'moderador'];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ 
                error: 'Rol inválido. Roles válidos: admin, user, moderador' 
            });
        }

        // Verificar que el usuario objetivo existe
        const targetDoc = await db.collection('users').doc(targetUid).get();
        if (!targetDoc.exists) {
            return res.status(404).json({ error: 'Usuario objetivo no encontrado' });
        }

        // Actualizar rol
        await db.collection('users').doc(targetUid).update({
            role,
            updatedAt: new Date().toISOString()
        });

        // Si se actualiza el rol a admin, también actualizar custom claims en Firebase Auth
        if (role === 'admin') {
            await admin.auth().setCustomUserClaims(targetUid, { admin: true });
        } else {
            await admin.auth().setCustomUserClaims(targetUid, { admin: false });
        }

        res.json({ 
            message: 'Rol actualizado exitosamente',
            uid: targetUid,
            role 
        });
    } catch (error) {
        console.error('Error actualizando rol:', error);
        res.status(500).json({ error: error.message });
    }
};

// Verificar token y guardar/actualizar usuario en Firestore
export const verifyAndSaveUser = async (req, res) => {
    try {
        // El token ya fue verificado por el middleware
        const { uid, email, name, picture, firebase } = req.user;
        const displayName = name || req.user.displayName || email?.split('@')[0] || 'Usuario';
        const photoURL = picture || req.user.picture || req.user.photoURL || null;

        // Determinar el proveedor de autenticación
        let provider = 'email'; // Por defecto
        
        // Intentar detectar el proveedor desde diferentes ubicaciones del token
        const firebaseInfo = req.user.firebase || {};
        
        if (firebaseInfo.sign_in_provider) {
            // Formato: "google.com", "github.com", "password"
            const providerName = firebaseInfo.sign_in_provider;
            if (providerName === 'google.com') {
                provider = 'google';
            } else if (providerName === 'github.com') {
                provider = 'github';
            } else if (providerName === 'password') {
                provider = 'email';
            }
        } else if (firebaseInfo.identities) {
            // Detectar proveedor desde las identidades
            const identityKeys = Object.keys(firebaseInfo.identities);
            if (identityKeys.includes('google.com')) {
                provider = 'google';
            } else if (identityKeys.includes('github.com')) {
                provider = 'github';
            } else if (identityKeys.includes('password')) {
                provider = 'email';
            }
        }

        // Verificar si el usuario existe en Firestore
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            // Crear usuario si no existe
            await db.collection('users').doc(uid).set({
                email: email || null,
                displayName: displayName,
                picture: photoURL,
                role: 'user', // Rol por defecto: user, admin, moderador
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                provider: provider,
                emailVerified: req.user.email_verified || false
            });
        } else {
            // Actualizar información existente
            const userData = userDoc.data();
            const updateData = {
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Actualizar campos si han cambiado o no existen
            if (email && (!userData.email || userData.email !== email)) {
                updateData.email = email;
            }
            if (displayName && (!userData.displayName || userData.displayName !== displayName)) {
                updateData.displayName = displayName;
            }
            if (photoURL && (!userData.picture || userData.picture !== photoURL)) {
                updateData.picture = photoURL;
            }
            if (provider && (!userData.provider || userData.provider !== provider)) {
                updateData.provider = provider;
            }
            if (req.user.email_verified !== undefined) {
                updateData.emailVerified = req.user.email_verified;
            }

            await db.collection('users').doc(uid).update(updateData);
        }

        res.json({
            message: 'Autenticación exitosa',
            user: {
                uid,
                email,
                name: displayName,
                picture: photoURL,
                provider
            }
        });
    } catch (error) {
        console.error('Error verificando y guardando usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

// Verificar token de Google (mantener compatibilidad)
export const verifyGoogleToken = async (req, res) => {
    // Redirigir a la función genérica
    return verifyAndSaveUser(req, res);
};

// Verificar token de GitHub
export const verifyGithubToken = async (req, res) => {
    // Redirigir a la función genérica
    return verifyAndSaveUser(req, res);
};

