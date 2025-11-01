import express from 'express';
import morgan from 'morgan';
import router from './routes/index.js';
import cookieParser from 'cookie-parser';

const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rutas
app.use(router);

export default app;