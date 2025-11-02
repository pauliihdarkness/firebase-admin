// Esperar a que Firebase esté cargado desde CDN
(function() {
    // Simular process.env usando variables inyectadas desde el servidor
    // Las variables vienen de process.env en el servidor, inyectadas como window.FIREBASE_CONFIG
    if (!window.process) {
        window.process = {};
    }
    if (!window.process.env) {
        window.process.env = window.FIREBASE_CONFIG ? {
            API_KEY: window.FIREBASE_CONFIG.apiKey || "",
            AUTH_DOMAIN: window.FIREBASE_CONFIG.authDomain || "",
            DATABASE_URL: window.FIREBASE_CONFIG.databaseURL || "",
            PROJECT_ID: window.FIREBASE_CONFIG.projectId || "",
            STORAGE_BUCKET: window.FIREBASE_CONFIG.storageBucket || "",
            MESSAGING_SENDER_ID: window.FIREBASE_CONFIG.messagingSenderId || "",
            APP_ID: window.FIREBASE_CONFIG.appId || ""
        } : {};
    }
    
    function initFirebase() {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
            // Configuración de Firebase desde process.env (simulado desde variables de entorno del servidor)
            if (!window.process || !window.process.env || !window.process.env.API_KEY) {
                console.error('Error: Configuración de Firebase no encontrada. Verifica que las variables de entorno estén en .env');
                return;
            }
            
            const firebaseConfig = {
                apiKey: window.process.env.API_KEY || "",
                authDomain: window.process.env.AUTH_DOMAIN || "",
                databaseURL: window.process.env.DATABASE_URL || "",
                projectId: window.process.env.PROJECT_ID || "",
                storageBucket: window.process.env.STORAGE_BUCKET || "",
                messagingSenderId: window.process.env.MESSAGING_SENDER_ID || "",
                appId: window.process.env.APP_ID || ""
            };
            
            // Validar que la configuración esté completa
            if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
                console.error('Error: Configuración de Firebase incompleta. Verifica las variables de entorno en .env');
                console.error('Configuración recibida:', firebaseConfig);
                return;
            }

            try {
                // Inicializar Firebase (usando compat mode)
                const app = firebase.initializeApp(firebaseConfig);
                const auth = firebase.auth();

                // Exportar para uso en otros archivos
                window.firebaseAuth = auth;
                window.firebaseApp = app;
                
                console.log('Firebase inicializado correctamente');
                
                // Disparar evento para indicar que Firebase está listo
                window.dispatchEvent(new Event('firebaseReady'));
            } catch (error) {
                console.error('Error inicializando Firebase:', error);
            }
        } else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            // Firebase ya está inicializado
            const auth = firebase.auth();
            window.firebaseAuth = auth;
            window.firebaseApp = firebase.apps[0];
            window.dispatchEvent(new Event('firebaseReady'));
            console.log('Firebase ya estaba inicializado');
        } else {
            // Reintentar si Firebase aún no está cargado
            setTimeout(initFirebase, 50);
        }
    }
    
    // Esperar a que los scripts de Firebase estén cargados
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initFirebase, 100);
        });
    } else {
        setTimeout(initFirebase, 100);
    }
})();

