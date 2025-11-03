import { Router } from "express";
import {
    getUserConversations,
    getOrCreateConversation,
    getConversationMessages,
    sendMessage,
    getAvailableUsers,
    markMessagesAsRead
} from "../controllers/chatController.js";
import { verifyFirebaseToken } from "../middleware/authMiddleware.js";

const chatRouter = Router();

// Ruta de prueba para verificar que el router funciona
chatRouter.get("/test", (req, res) => {
    res.json({ message: "Chat router funcionando correctamente" });
});

// Todas las rutas requieren autenticación
chatRouter.use(verifyFirebaseToken);

// Obtener todas las conversaciones del usuario
chatRouter.get("/conversations", getUserConversations);

// Obtener usuarios disponibles para chatear
chatRouter.get("/users", getAvailableUsers);

// Crear o obtener conversación entre dos usuarios
chatRouter.post("/conversations", getOrCreateConversation);

// Obtener mensajes de una conversación
chatRouter.get("/conversations/:conversationId/messages", getConversationMessages);

// Enviar mensaje en una conversación
chatRouter.post("/conversations/:conversationId/messages", sendMessage);

// Marcar mensajes como leídos
chatRouter.put("/conversations/:conversationId/read", markMessagesAsRead);

export default chatRouter;

