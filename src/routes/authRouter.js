import { Router } from "express";
import {
    registerUser,
    getCurrentUser,
    updateUser,
    deleteUser,
    getAllUsers,
    verifyGoogleToken
} from "../controllers/authController.js";
import { verifyFirebaseToken, isAdmin } from "../middleware/authMiddleware.js";

const authRouter = Router();

// Rutas públicas
authRouter.post("/register", registerUser);
authRouter.post("/verify-google", verifyFirebaseToken, verifyGoogleToken);

// Rutas protegidas (requieren autenticación)
authRouter.get("/me", verifyFirebaseToken, getCurrentUser);
authRouter.put("/me", verifyFirebaseToken, updateUser);
authRouter.delete("/me", verifyFirebaseToken, deleteUser);

// Rutas de administrador
authRouter.get("/users", verifyFirebaseToken, isAdmin, getAllUsers);

export default authRouter;

