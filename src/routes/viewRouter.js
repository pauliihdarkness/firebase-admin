import { Router } from "express";

const viewRouter = Router();

// Página principal / Login
viewRouter.get("/", (req, res) => {
    res.render("login", { 
        title: "Iniciar Sesión",
        page: "login"
    });
});

// Página de registro
viewRouter.get("/register", (req, res) => {
    res.render("register", { 
        title: "Registrarse",
        page: "register"
    });
});

// Dashboard (requiere autenticación)
viewRouter.get("/dashboard", (req, res) => {
    res.render("dashboard", { 
        title: "Dashboard",
        page: "dashboard"
    });
});

// Perfil de usuario
viewRouter.get("/profile", (req, res) => {
    res.render("profile", { 
        title: "Mi Perfil",
        page: "profile"
    });
});

// Gestión de documentos (CRUD)
viewRouter.get("/documents", (req, res) => {
    res.render("documents", { 
        title: "Documentos",
        page: "documents"
    });
});

// Gestión de usuarios (solo admin - la verificación se hace en el frontend)
viewRouter.get("/users", (req, res) => {
    res.render("users", { 
        title: "Usuarios",
        page: "users"
    });
});

// Chat con otros usuarios
viewRouter.get("/chat", (req, res) => {
    res.render("chat", { 
        title: "Chat",
        page: "chat"
    });
});

export default viewRouter;

