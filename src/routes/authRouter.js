import { Router } from "express";
import {
    registerUser,
    getCurrentUser,
    updateUser,
    deleteUser,
    getAllUsers,
    verifyGoogleToken,
    updateUserRole
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

// Rutas de administrador (o primer usuario si no hay admins)
authRouter.get("/users", verifyFirebaseToken, getAllUsers);
authRouter.put("/users/role", verifyFirebaseToken, updateUserRole);

export default authRouter;

