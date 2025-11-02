import express from 'express';
import morgan from 'morgan';
import router from './routes/index.js';
import cookieParser from 'cookie-parser';
import { create } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Configurar Handlebars
const hbs = create({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: join(__dirname, 'view', 'layouts'),
    partialsDir: join(__dirname, 'view', 'partials')
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'view'));

// Middleware para pasar variables de entorno a las vistas
app.use((req, res, next) => {
    res.locals.firebaseConfig = {
        apiKey: process.env.API_KEY || '',
        authDomain: process.env.AUTH_DOMAIN || '',
        databaseURL: process.env.DATABASE_URL || '',
        projectId: process.env.PROJECT_ID || '',
        storageBucket: process.env.STORAGE_BUCKET || '',
        messagingSenderId: process.env.MESSAGING_SENDER_ID || '',
        appId: process.env.APP_ID || ''
    };
    next();
});

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Archivos estáticos
app.use(express.static(join(__dirname, 'public')));

// Rutas
app.use(router);

export default app;