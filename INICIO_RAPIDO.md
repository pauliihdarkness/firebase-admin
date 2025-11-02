# 🚀 Inicio Rápido - Autenticación Firebase

## Instalación en 3 Pasos

### 1️⃣ Instalar Dependencias
```bash
npm install
```

### 2️⃣ Configurar Firebase
- Descarga tu archivo de credenciales de Firebase Console
- Colócalo como `firebaseKeys.json` en la raíz del proyecto

### 3️⃣ Iniciar Servidor
```bash
npm run dev
```

---

## Endpoints Principales

### Autenticación
```
POST   /auth/register          → Registrar usuario
POST   /auth/verify-google     → Login con Google
GET    /auth/me                → Info del usuario (requiere token)
PUT    /auth/me                → Actualizar usuario (requiere token)
DELETE /auth/me                → Eliminar usuario (requiere token)
GET    /auth/users             → Listar usuarios (solo admin)
```

### CRUD
```
POST   /api/:collection        → Crear documento
GET    /api/:collection        → Obtener todos
GET    /api/:collection/:docId → Obtener uno
PUT    /api/:collection/:docId → Actualizar
DELETE /api/:collection/:docId → Eliminar
```

---

## Ejemplo de Uso

### Registrar Usuario
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","displayName":"Test"}'
```

### Obtener Info de Usuario
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## Documentación Completa

- **README.md** - Documentación general
- **GUIA_AUTENTICACION.md** - Guía detallada de autenticación
- **RESUMEN_AUTENTICACION.md** - Resumen de implementación
- **estructura_carpetas.txt** - Estructura del proyecto

---

## Soporte

¿Problemas? Revisa:
1. Que `firebaseKeys.json` esté en la raíz
2. Que Firebase Auth esté habilitado en la consola
3. Los logs del servidor para errores

¡Listo para usar! 🎉

