# 🔐 Configuración de Variables de Entorno para Firebase

## 📋 Pasos para Configurar

### 1. Crear archivo .env

Crea un archivo llamado `.env` en la raíz del proyecto (mismo nivel que `package.json`).

### 2. Agregar Variables

Copia el contenido de `.env.example` y completa con tus valores reales de Firebase:

```env
# Firebase Client Configuration
API_KEY=tu_api_key_aqui
AUTH_DOMAIN=tu_proyecto.firebaseapp.com
DATABASE_URL=https://tu_proyecto-default-rtdb.firebaseio.com
PROJECT_ID=tu_proyecto_id
STORAGE_BUCKET=tu_proyecto.appspot.com
MESSAGING_SENDER_ID=tu_messaging_sender_id
APP_ID=tu_app_id_aqui
```

### 3. Obtener Valores desde Firebase Console

Si no tienes los valores, puedes obtenerlos:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Configuración del proyecto** (⚙️) > **Tus aplicaciones**
4. Si no tienes una app web, haz clic en **Agregar app** > **Web** (`</>`)
5. Copia los valores de la configuración:

```javascript
const firebaseConfig = {
  apiKey: "...",           // → API_KEY
  authDomain: "...",       // → AUTH_DOMAIN
  databaseURL: "...",      // → DATABASE_URL
  projectId: "...",        // → PROJECT_ID
  storageBucket: "...",    // → STORAGE_BUCKET
  messagingSenderId: "...", // → MESSAGING_SENDER_ID
  appId: "..."             // → APP_ID
};
```

### 4. Reiniciar el Servidor

Después de crear/actualizar el archivo `.env`, reinicia el servidor:

```bash
npm run dev
```

## ✅ Verificación

Después de configurar:

1. Inicia el servidor: `npm run dev`
2. Abre `http://localhost:3000`
3. Abre la consola del navegador (F12)
4. Deberías ver: "Firebase inicializado correctamente"

Si ves errores, verifica:
- Que el archivo `.env` existe en la raíz del proyecto
- Que todas las variables están completas
- Que no hay espacios extra alrededor del signo `=`
- Que reiniciaste el servidor después de crear el `.env`

## 🔒 Seguridad

- ⚠️ **NUNCA** subas el archivo `.env` a Git
- El archivo `.env` ya está en `.gitignore`
- Las variables se inyectan en el HTML (son públicas en el cliente)
- Para producción, considera usar variables de entorno del servidor

## 📝 Nota

Las variables de `.env` se inyectan automáticamente en el HTML cuando se renderizan las vistas. El cliente JavaScript las recibe desde `window.FIREBASE_CONFIG`.

