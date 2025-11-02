import { Router } from "express";
import {
  createDoc,
  getDoc,
  getAllDocs,
  updateDoc,
  deleteDoc,
  getSubcollections,
  getSubcollectionDocs,
  createSubcollectionDoc,
  getSubcollectionDoc,
  updateSubcollectionDoc,
  deleteSubcollectionDoc
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

// ========== SUBCOLECCIONES ==========

// Listar subcolecciones de un documento
crudRouter.get("/:collection/:docId/subcollections", getSubcollections);

// Obtener todos los documentos de una subcolección
crudRouter.get("/:collection/:docId/:subcollection", getSubcollectionDocs);

// Obtener un documento específico de una subcolección
crudRouter.get("/:collection/:docId/:subcollection/:subDocId", getSubcollectionDoc);

// Crear documento en subcolección
crudRouter.post("/:collection/:docId/:subcollection", createSubcollectionDoc);

// Actualizar documento en subcolección
crudRouter.put("/:collection/:docId/:subcollection/:subDocId", updateSubcollectionDoc);

// Eliminar documento de subcolección
crudRouter.delete("/:collection/:docId/:subcollection/:subDocId", deleteSubcollectionDoc);

export default crudRouter;

