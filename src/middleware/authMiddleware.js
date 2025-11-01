import { admin } from '../firebaseConfig.js';

// Middleware para verificar el token de Firebase
export const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const token = authHeader.split('Bearer ')[1];
        
        // Verificar el token con Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Agregar la información del usuario a la request
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware para verificar rol de administrador
export const isAdmin = async (req, res, next) => {
    try {
        // Verificar si el token es válido primero
        await verifyFirebaseToken(req, res, () => {
            // Aquí puedes agregar lógica adicional para verificar roles
            // Por ejemplo, verificar claims personalizados
            if (!req.user.admin) {
                return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
            }
            next();
        });
    } catch (error) {
        console.error('Error verificando rol:', error);
        res.status(403).json({ error: 'Error verificando permisos' });
    }
};

