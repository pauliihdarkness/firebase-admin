import { Router } from "express";
import crudRouter from "./crudRouter.js";
import authRouter from "./authRouter.js";

const router = Router();

// Montar subrouters
router.use("/api", crudRouter);
router.use("/auth", authRouter);

export default router;

