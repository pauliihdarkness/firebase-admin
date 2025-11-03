import { Router } from "express";
import crudRouter from "./crudRouter.js";
import authRouter from "./authRouter.js";
import viewRouter from "./viewRouter.js";
import chatRouter from "./chatRouter.js";

const router = Router();

// Montar subrouters
// IMPORTANTE: Rutas API primero (más específicas), luego rutas de vista (más generales)
// para evitar que rutas como /chat sean interceptadas por el middleware de autenticación
router.use("/api/chat", chatRouter); // Rutas API de chat primero (más específicas)
router.use("/api", crudRouter);
router.use("/auth", authRouter);
router.use("/", viewRouter); // Rutas de vista al final (catch-all)

export default router;

