import { Router } from "express";
import {
  createDoc,
  getDoc,
  getAllDocs,
  updateDoc,
  deleteDoc
} from "../controllers/collectionFirebase.js";

const crudRouter = Router();

// 🟢 Crear documento (collection + data en body)
crudRouter.post("/", createDoc);

// 🟡 Obtener todos los documentos de una colección
crudRouter.get("/:collection", getAllDocs);

// 🟠 Obtener un documento específico
crudRouter.get("/:collection/:docId", getDoc);

// 🔵 Actualizar documento
crudRouter.put("/:collection/:docId", updateDoc);

// 🔴 Eliminar documento
crudRouter.delete("/:collection/:docId", deleteDoc);

export default crudRouter;

