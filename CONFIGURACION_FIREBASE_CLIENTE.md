# 🔥 Configuración de Firebase para el Cliente (Frontend)

## ⚠️ IMPORTANTE

Para que la autenticación funcione en el navegador, necesitas configurar Firebase Web SDK.

## 📋 Pasos para Configurar

### 1. Obtener Configuración de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Haz clic en el ícono de engranaje ⚙️ > **Configuración del proyecto**
4. Ve a la sección **Tus aplicaciones**
5. Si no tienes una aplicación web, haz clic en **Agregar app** > **Web** (`</>`)
6. Registra tu app con un nombre (ej: "Firebase Admin Web")
7. Copia la configuración que aparece

### 2. Configurar Variables de Entorno

Ya no necesitas editar `firebase-config.js` manualmente. Las variables se cargan desde `.env`:

1. Crea/edita el archivo `.env` en la raíz del proyecto
2. Agrega tus valores:

```env
API_KEY=tu_api_key_aqui
AUTH_DOMAIN=tu_proyecto.firebaseapp.com
DATABASE_URL=https://tu_proyecto-default-rtdb.firebaseio.com
PROJECT_ID=tu_proyecto_id
STORAGE_BUCKET=tu_proyecto.appspot.com
MESSAGING_SENDER_ID=tu_messaging_sender_id
APP_ID=tu_app_id_aqui
```

Las variables se inyectan automáticamente en el HTML desde el servidor.

### 3. Habilitar Métodos de Autenticación

En Firebase Console:

1. Ve a **Authentication** > **Sign-in method**
2. Habilita los proveedores que quieras usar:
   - ✅ **Correo electrónico/Contraseña** (para registro/login)
   - ✅ **Google** (para login con Google)

#### Configurar Google:
1. Haz clic en **Google**
2. Activa el interruptor
3. Ingresa el **Email de soporte del proyecto**
4. Guarda

### 4. Configurar Dominios Autorizados

1. En **Authentication** > **Settings** > **Authorized domains**
2. Asegúrate de que estén:
   - `localhost` (para desarrollo)
   - Tu dominio de producción (si aplica)

## ✅ Verificación

Después de configurar:

1. Inicia el servidor: `npm run dev`
2. Abre `http://localhost:3000`
3. Deberías poder:
   - Registrarte con email/password
   - Iniciar sesión con Google
   - Navegar por las páginas

## 🐛 Solución de Problemas

### Error: "Firebase: Error (auth/api-key-not-valid)"
- Verifica que la `apiKey` sea correcta
- Asegúrate de haber copiado la configuración completa

### Error: "Firebase: Error (auth/domain-not-authorized)"
- Verifica que `localhost` esté en los dominios autorizados
- En desarrollo, Firebase permite `localhost` por defecto

### Error: "Popup blocked"
- Asegúrate de que el navegador permita ventanas emergentes
- Prueba con otro navegador

### No se muestra el botón de Google
- Verifica que hayas habilitado Google como método de autenticación
- Revisa la consola del navegador para errores

## 📝 Nota Importante

El archivo `firebaseKeys.json` es para el **servidor** (Firebase Admin SDK).
La configuración en `firebase-config.js` es para el **cliente** (Firebase Web SDK).

**No confundas ambos**. Son diferentes:
- **Admin SDK**: Para operaciones del servidor (crear usuarios, verificar tokens)
- **Web SDK**: Para autenticación en el navegador (login, registro)

## 🚀 Listo!

Una vez configurado, tu aplicación funcionará completamente en el navegador con autenticación funcional.

