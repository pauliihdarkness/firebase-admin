import { Router } from "express";
import crudRouter from "./crudRouter.js";
import authRouter from "./authRouter.js";
import viewRouter from "./viewRouter.js";

const router = Router();

// Montar subrouters
router.use("/api", crudRouter);
router.use("/auth", authRouter);
router.use("/", viewRouter);

export default router;

