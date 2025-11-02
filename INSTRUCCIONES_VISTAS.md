# 🎨 Instrucciones para Vistas Funcionales

## ✅ Lo que se ha Implementado

Tu aplicación ahora tiene **vistas funcionales** que se ejecutan en el navegador con:

### 📄 Páginas Disponibles

1. **Login** (`/`) - Inicio de sesión
2. **Registro** (`/register`) - Crear nueva cuenta
3. **Dashboard** (`/dashboard`) - Panel principal
4. **Perfil** (`/profile`) - Gestión de perfil de usuario
5. **Documentos** (`/documents`) - Gestión de documentos Firestore

### 🎯 Funcionalidades Implementadas

#### Autenticación
- ✅ Login con email/password
- ✅ Registro de nuevos usuarios
- ✅ Login con Google
- ✅ Logout
- ✅ Protección de rutas (redirección si no estás autenticado)

#### Interfaz
- ✅ Diseño responsive y moderno
- ✅ Navegación dinámica según estado de autenticación
- ✅ Mensajes de error y éxito
- ✅ Modales para crear documentos
- ✅ Formularios validados

## 🚀 Cómo Empezar

### 1. Configurar Firebase Cliente

**IMPORTANTE**: Necesitas configurar Firebase Web SDK:

1. Lee el archivo: `CONFIGURACION_FIREBASE_CLIENTE.md`
2. Edita: `src/public/js/firebase-config.js`
3. Reemplaza los valores con tu configuración real de Firebase

### 2. Iniciar el Servidor

```bash
npm run dev
```

### 3. Abrir en el Navegador

```
http://localhost:3000
```

## 📁 Estructura de Archivos Creados

```
src/
├── view/
│   ├── layouts/
│   │   └── main.hbs          # Layout principal
│   ├── partials/
│   │   ├── header.hbs        # Header con navegación
│   │   └── footer.hbs       # Footer
│   ├── login.hbs             # Página de login
│   ├── register.hbs          # Página de registro
│   ├── dashboard.hbs         # Dashboard principal
│   ├── profile.hbs           # Perfil de usuario
│   └── documents.hbs         # Gestión de documentos
├── public/
│   ├── css/
│   │   └── style.css         # Estilos principales
│   ├── js/
│   │   ├── firebase-config.js  # Configuración Firebase
│   │   └── app.js            # Lógica del frontend
│   └── img/
│       └── default-avatar.png # Avatar por defecto
└── routes/
    └── viewRouter.js         # Rutas de vistas
```

## 🎨 Personalización

### Cambiar Colores

Edita `src/public/css/style.css` en la sección `:root`:

```css
:root {
    --primary-color: #4285f4;  /* Cambia este color */
    --primary-dark: #357ae8;
    /* ... */
}
```

### Modificar Vistas

Las vistas están en `src/view/` como archivos `.hbs` (Handlebars).

Puedes:
- Agregar más campos a los formularios
- Cambiar el diseño
- Agregar nuevas secciones

### Agregar Nuevas Páginas

1. Crea el archivo `.hbs` en `src/view/`
2. Agrega la ruta en `src/routes/viewRouter.js`
3. Actualiza la navegación en `src/view/partials/header.hbs`

## 🔧 Flujo de Autenticación

### Registro
1. Usuario llena formulario
2. Se crea cuenta en Firebase Auth
3. Se guarda info adicional en Firestore
4. Redirección a dashboard

### Login
1. Usuario ingresa email/password
2. Firebase Auth valida credenciales
3. Se obtiene token JWT
4. Token se usa para requests al backend
5. Redirección a dashboard

### Login con Google
1. Usuario hace clic en "Continuar con Google"
2. Se abre popup de Google
3. Usuario autoriza
4. Firebase obtiene token
5. Backend verifica token
6. Redirección a dashboard

## 📱 Responsive Design

La aplicación es completamente responsive:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

Los estilos se adaptan automáticamente según el tamaño de pantalla.

## 🐛 Debugging

### Ver Errores en Consola

Abre las herramientas de desarrollador (F12):
- **Console**: Ver errores de JavaScript
- **Network**: Ver requests HTTP
- **Application**: Ver almacenamiento local

### Errores Comunes

1. **"Firebase not initialized"**
   - Verifica que `firebase-config.js` tenga la configuración correcta

2. **"Token no proporcionado"**
   - El usuario no está autenticado
   - Verifica que el login haya funcionado

3. **"Popup blocked"**
   - Permite ventanas emergentes en el navegador

## 📝 Próximos Pasos Sugeridos

1. ✅ Configurar Firebase Cliente (obligatorio)
2. Agregar más validaciones en formularios
3. Implementar recuperación de contraseña
4. Agregar notificaciones push
5. Crear más funcionalidades en documentos
6. Agregar búsqueda y filtros avanzados
7. Implementar paginación
8. Agregar gráficos y estadísticas

## 🎉 ¡Listo!

Tu aplicación ya tiene vistas funcionales. Solo falta configurar Firebase Cliente para que todo funcione completamente.

**¿Necesitas ayuda?** Revisa:
- `CONFIGURACION_FIREBASE_CLIENTE.md` - Configuración de Firebase
- `README.md` - Documentación general
- `GUIA_AUTENTICACION.md` - Guía de autenticación

