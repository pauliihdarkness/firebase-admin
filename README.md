# Firebase Admin - API con Autenticación

Proyecto de API REST construido con Express.js y Firebase Admin SDK que incluye autenticación con Google y Firebase.

## 🚀 Características

- ✅ Autenticación con Firebase
- ✅ Autenticación con Google
- ✅ CRUD completo para Firestore
- ✅ Middleware de verificación de tokens
- ✅ Roles de administrador
- ✅ API RESTful

## 📋 Requisitos Previos

- Node.js 14 o superior
- Cuenta de Firebase
- Credenciales de Firebase Admin (archivo JSON de credenciales)

## 🔧 Instalación

1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd firebase-admin
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
# Crear archivo .env en la raíz del proyecto
GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/tu/firebaseKeys.json
```

4. Configurar Firebase Admin
- Descarga tu archivo de credenciales de Firebase Admin Console
- Colócalo en la raíz del proyecto como `firebaseKeys.json`
- O configura la variable de entorno `GOOGLE_APPLICATION_CREDENTIALS`

## 🏃‍♂️ Ejecución

### Modo desarrollo (con auto-reload)
```bash
npm run dev
```

### Modo producción
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto configurado).

## 📡 Endpoints

### Autenticación (`/auth`)

#### Registrar Usuario
```http
POST /auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123",
  "displayName": "Nombre Usuario"
}
```

#### Verificar Token de Google
```http
POST /auth/verify-google
Authorization: Bearer <token_de_google>
```

#### Obtener Usuario Actual
```http
GET /auth/me
Authorization: Bearer <token_de_firebase>
```

#### Actualizar Usuario
```http
PUT /auth/me
Authorization: Bearer <token_de_firebase>
Content-Type: application/json

{
  "displayName": "Nuevo Nombre",
  "phoneNumber": "+1234567890"
}
```

#### Eliminar Usuario
```http
DELETE /auth/me
Authorization: Bearer <token_de_firebase>
```

#### Listar Todos los Usuarios (Admin)
```http
GET /auth/users
Authorization: Bearer <token_de_admin>
```

### CRUD API (`/api`)

#### Crear Documento
```http
POST /api/:collection
Content-Type: application/json

{
  "collection": "usuarios",
  "docId": "opcional-id-custom",
  "data": {
    "nombre": "Juan",
    "edad": 25
  }
}
```

#### Obtener Todos los Documentos
```http
GET /api/:collection
```

#### Obtener Documento Específico
```http
GET /api/:collection/:docId
```

#### Actualizar Documento
```http
PUT /api/:collection/:docId
Content-Type: application/json

{
  "nombre": "Juan Actualizado",
  "edad": 26
}
```

#### Eliminar Documento
```http
DELETE /api/:collection/:docId
```

## 🔐 Autenticación con Google

Para usar autenticación con Google en el frontend:

1. Configura Firebase Authentication en la consola de Firebase
2. Habilita el proveedor de Google
3. Obtén el token ID del cliente
4. Envía el token en el header Authorization:
   ```
   Authorization: Bearer <token_de_google>
   ```

Ejemplo con JavaScript:
```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
const token = await result.user.getIdToken();

fetch('http://localhost:3000/auth/verify-google', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📁 Estructura del Proyecto

```
firebase-admin/
├── src/
│   ├── app.js                  # Configuración de Express
│   ├── index.js                # Punto de entrada
│   ├── firebaseConfig.js       # Configuración de Firebase Admin
│   ├── controllers/
│   │   ├── authController.js   # Controlador de autenticación
│   │   └── collectionFirebase.js  # Controlador de CRUD
│   ├── middleware/
│   │   └── authMiddleware.js   # Middleware de autenticación
│   └── routes/
│       ├── index.js            # Rutas principales
│       ├── authRouter.js       # Rutas de autenticación
│       └── crudRouter.js       # Rutas CRUD
├── firebaseKeys.json           # Credenciales de Firebase (no subir a git)
├── package.json
└── README.md
```

## 🔒 Seguridad

- Las rutas protegidas requieren un token válido de Firebase
- Los tokens se verifican usando Firebase Admin SDK
- Los passwords se almacenan de forma segura usando Firebase Auth
- Se recomienda usar HTTPS en producción
- No compartir `firebaseKeys.json` en el repositorio

## 📝 Variables de Entorno

Crea un archivo `.env` con:

```env
PORT=3000
GOOGLE_APPLICATION_CREDENTIALS=./firebaseKeys.json
```

## 🧪 Pruebas

Para probar los endpoints, puedes usar:
- Postman
- cURL
- Thunder Client (VS Code)
- tu cliente HTTP preferido

Ejemplo con cURL:
```bash
# Obtener usuario actual
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📦 Dependencias Principales

- `express` - Framework web
- `firebase-admin` - SDK de Firebase para backend
- `jsonwebtoken` - Manejo de tokens JWT
- `cookie-parser` - Manejo de cookies
- `bcryptjs` - Hashing de contraseñas
- `morgan` - Logger de HTTP
- `dotenv` - Variables de entorno

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC

## 👨‍💻 Autor

Tu Nombre

