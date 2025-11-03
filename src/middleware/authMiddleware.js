import { admin } from '../firebaseConfig.js';
import db from '../firebaseConfig.js';

// Middleware para verificar el token de Firebase
export const verifyFirebaseToken = async (req, res, next) => {
    try {
        console.log('🔐 verifyFirebaseToken llamado para:', req.method, req.path);
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Token no proporcionado');
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const token = authHeader.split('Bearer ')[1];
        
        // Verificar el token con Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Agregar la información del usuario a la request
        req.user = decodedToken;
        console.log('✅ Token verificado, usuario:', decodedToken.uid);
        next();
    } catch (error) {
        console.error('❌ Error verificando token:', error);
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware para verificar rol desde Firestore
export const checkRole = async (req, res, next) => {
    try {
        const { uid } = req.user;
        
        // Obtener datos del usuario desde Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Usuario no encontrado en Firestore' });
        }

        const userData = userDoc.data();
        req.userRole = userData.role || 'user'; // Rol por defecto: user
        req.userData = userData;
        next();
    } catch (error) {
        console.error('Error verificando rol:', error);
        res.status(500).json({ error: 'Error verificando permisos' });
    }
};

// Middleware para verificar rol de administrador
export const isAdmin = async (req, res, next) => {
    try {
        // Verificar token primero
        await verifyFirebaseToken(req, res, async () => {
            // Verificar rol desde Firestore
            await checkRole(req, res, () => {
                if (req.userRole !== 'admin') {
                    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
                }
                next();
            });
        });
    } catch (error) {
        console.error('Error verificando rol de admin:', error);
        res.status(403).json({ error: 'Error verificando permisos' });
    }
};

// Middleware para verificar rol de moderador o admin
export const isModerator = async (req, res, next) => {
    try {
        await verifyFirebaseToken(req, res, async () => {
            await checkRole(req, res, () => {
                if (req.userRole !== 'admin' && req.userRole !== 'moderador') {
                    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de moderador o administrador' });
                }
                next();
            });
        });
    } catch (error) {
        console.error('Error verificando rol de moderador:', error);
        res.status(403).json({ error: 'Error verificando permisos' });
    }
};

