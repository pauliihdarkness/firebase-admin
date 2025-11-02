# 🔐 Guía de Autenticación - Firebase Admin

Esta guía te ayudará a configurar y usar la autenticación con Google y Firebase en este proyecto.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Autenticación con Firebase](#autenticación-con-firebase)
3. [Autenticación con Google](#autenticación-con-google)
4. [Uso de Middleware](#uso-de-middleware)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Configuración Inicial

### 1. Configurar Firebase Admin

Necesitas tener un archivo de credenciales de Firebase Admin:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Configuración del proyecto** > **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Descarga el archivo JSON
6. Renómbralo a `firebaseKeys.json`
7. Colócalo en la raíz del proyecto

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
PORT=3000
GOOGLE_APPLICATION_CREDENTIALS=./firebaseKeys.json
```

### 3. Configurar Firebase Authentication

1. En Firebase Console, ve a **Authentication**
2. Haz clic en **Comenzar**
3. Habilita los proveedores que quieras usar:
   - **Correo electrónico/Contraseña**: Para registro manual
   - **Google**: Para autenticación con Google

---

## 🔥 Autenticación con Firebase

### Registrar un Usuario

```http
POST /auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "passwordSeguro123",
  "displayName": "Juan Pérez"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Usuario creado exitosamente",
  "uid": "abc123def456",
  "email": "usuario@example.com"
}
```

### Obtener Token de Firebase (Cliente)

Para obtener un token desde el frontend:

```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase-config.js';

const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    console.log('Token:', token);
    return token;
  } catch (error) {
    console.error('Error de autenticación:', error);
  }
};
```

### Usar el Token en Requests

```http
GET /auth/me
Authorization: Bearer <tu_token_aqui>
```

---

## 🌐 Autenticación con Google

### Configuración en el Cliente

```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase-config.js';

const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    
    // Enviar token al backend
    const response = await fetch('http://localhost:3000/auth/verify-google', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Usuario autenticado:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Verificar Token de Google (Backend)

```http
POST /auth/verify-google
Authorization: Bearer <token_de_google>
```

**Respuesta:**
```json
{
  "message": "Autenticación exitosa",
  "user": {
    "uid": "google-user-id",
    "email": "usuario@gmail.com",
    "name": "Nombre Usuario",
    "picture": "https://..."
  }
}
```

---

## 🛡️ Uso de Middleware

### Proteger Rutas con Token

```javascript
import { verifyFirebaseToken } from './middleware/authMiddleware.js';

router.get('/recurso-protegido', verifyFirebaseToken, (req, res) => {
  // req.user contiene la información del usuario autenticado
  res.json({ user: req.user });
});
```

### Proteger Rutas con Rol de Admin

```javascript
import { verifyFirebaseToken, isAdmin } from './middleware/authMiddleware.js';

router.get('/admin-only', verifyFirebaseToken, isAdmin, (req, res) => {
  res.json({ message: 'Eres admin!' });
});
```

### Configurar Usuario como Admin

En Firestore, agrega el campo `isAdmin: true` al documento del usuario:

```javascript
// En Firestore Console o desde tu código
db.collection('users').doc('userId').update({
  isAdmin: true
});
```

---

## 💡 Ejemplos Prácticos

### Ejemplo Completo con React

```javascript
import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase-config';

function Login() {
  const [user, setUser] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      
      // Guardar token
      localStorage.setItem('token', token);
      
      // Obtener datos del usuario
      const response = await fetch('http://localhost:3000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <div>
          <h2>Bienvenido, {user.displayName}</h2>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      ) : (
        <button onClick={handleGoogleLogin}>
          Iniciar Sesión con Google
        </button>
      )}
    </div>
  );
}
```

### Ejemplo con Axios

```javascript
import axios from 'axios';

// Configurar interceptor para agregar token automáticamente
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Usar en componentes
const fetchUserData = async () => {
  try {
    const response = await axios.get('http://localhost:3000/auth/me');
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

### Ejemplo con Fetch

```javascript
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await fetch(url, config);
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Usar
const userData = await makeAuthenticatedRequest('http://localhost:3000/auth/me');
```

---

## 🔍 Solución de Problemas

### Error: "Token no proporcionado"

**Problema:** No estás enviando el header Authorization.

**Solución:** Asegúrate de incluir el header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Error: "Token inválido o expirado"

**Problema:** El token ha expirado o no es válido.

**Solución:** Obtén un nuevo token:
```javascript
const user = auth.currentUser;
const newToken = await user.getIdToken(true); // true fuerza un refresh
```

### Error: "Firebase Admin SDK not initialized"

**Problema:** No has configurado las credenciales correctamente.

**Solución:**
1. Verifica que `firebaseKeys.json` existe
2. Verifica la variable `GOOGLE_APPLICATION_CREDENTIALS`
3. Revisa que el archivo JSON sea válido

### Error: "Email already exists"

**Problema:** Intentas registrar un email que ya existe.

**Solución:** Usa login en lugar de registro:
```http
POST /auth/login
```

### Los tokens expiran rápido

**Problema:** Los tokens de Firebase expiran después de 1 hora.

**Solución:** Implementa refresh de tokens:
```javascript
const refreshToken = async () => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(true);
    localStorage.setItem('token', token);
  }
};

// Ejecutar cada 50 minutos
setInterval(refreshToken, 50 * 60 * 1000);
```

---

## 📚 Recursos Adicionales

- [Documentación Firebase Auth](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del servidor
2. Verifica la configuración de Firebase
3. Asegúrate de que las dependencias están instaladas
4. Consulta la documentación oficial de Firebase

---

**¡Listo para autenticar usuarios!** 🎉

