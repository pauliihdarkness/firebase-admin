import db from "../firebaseConfig.js";

export const createDoc = async (req, res) => {
    const { collection, docId, data } = req.body;

    try {
        const ref = docId
            ? db.collection(collection).doc(docId)
            : db.collection(collection).doc();

        await ref.set(data);
        res.status(201).json({ message: "Documento creado correctamente", id: ref.id });
    } catch (error) {
        console.error("Error creando documento:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getDoc = async (req, res) => {
    const { collection, docId } = req.params;

    try {
        const ref = db.collection(collection).doc(docId);
        const doc = await ref.get();

        if (!doc.exists) return res.status(404).json({ error: "Documento no encontrado" });

        res.json({ id: doc.id, data: doc.data() });
    } catch (error) {
        console.error("Error leyendo documento:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getAllDocs = async (req, res) => {
    const { collection } = req.params;

    try {
        const snapshot = await db.collection(collection).get();
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        res.json(docs);
    } catch (error) {
        console.error("Error leyendo colección:", error);
        res.status(500).json({ error: error.message });
    }
};

export const updateDoc = async (req, res) => {
    const { collection, docId } = req.params;
    const data = req.body;

    try {
        await db.collection(collection).doc(docId).update(data);
        res.json({ message: "Documento actualizado correctamente" });
    } catch (error) {
        console.error("Error actualizando documento:", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteDoc = async (req, res) => {
    const { collection, docId } = req.params;

    try {
        await db.collection(collection).doc(docId).delete();
        res.json({ message: "Documento eliminado correctamente" });
    } catch (error) {
        console.error("Error eliminando documento:", error);
        res.status(500).json({ error: error.message });
    }
};

// ========== SUBCOLECCIONES ==========

// Listar todas las subcolecciones de un documento
export const getSubcollections = async (req, res) => {
    const { collection, docId } = req.params;

    try {
        const docRef = db.collection(collection).doc(docId);
        
        // Obtener todas las subcolecciones
        const collections = await docRef.listCollections();
        const subcollections = collections.map(col => ({
            id: col.id,
            path: `${collection}/${docId}/${col.id}`
        }));

        res.json(subcollections);
    } catch (error) {
        console.error("Error listando subcolecciones:", error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener todos los documentos de una subcolección
export const getSubcollectionDocs = async (req, res) => {
    const { collection, docId, subcollection } = req.params;

    try {
        const docRef = db.collection(collection).doc(docId);
        const subcollectionRef = docRef.collection(subcollection);
        
        const snapshot = await subcollectionRef.get();
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        res.json(docs);
    } catch (error) {
        console.error("Error leyendo subcolección:", error);
        res.status(500).json({ error: error.message });
    }
};

// Crear documento en una subcolección
export const createSubcollectionDoc = async (req, res) => {
    const { collection, docId, subcollection } = req.params;
    const { docId: subDocId, data } = req.body;

    try {
        const docRef = db.collection(collection).doc(docId);
        const subcollectionRef = docRef.collection(subcollection);
        
        const ref = subDocId
            ? subcollectionRef.doc(subDocId)
            : subcollectionRef.doc();

        await ref.set(data);
        res.status(201).json({ 
            message: "Documento creado correctamente en subcolección", 
            id: ref.id,
            path: `${collection}/${docId}/${subcollection}/${ref.id}`
        });
    } catch (error) {
        console.error("Error creando documento en subcolección:", error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener un documento específico de una subcolección
export const getSubcollectionDoc = async (req, res) => {
    const { collection, docId, subcollection, subDocId } = req.params;

    try {
        const docRef = db.collection(collection).doc(docId);
        const subcollectionRef = docRef.collection(subcollection);
        const subDocRef = subcollectionRef.doc(subDocId);
        
        const doc = await subDocRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }

        res.json({ id: doc.id, data: doc.data() });
    } catch (error) {
        console.error("Error leyendo documento de subcolección:", error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar documento en subcolección
export const updateSubcollectionDoc = async (req, res) => {
    const { collection, docId, subcollection, subDocId } = req.params;
    const data = req.body;

    try {
        const docRef = db.collection(collection).doc(docId);
        const subcollectionRef = docRef.collection(subcollection);
        
        await subcollectionRef.doc(subDocId).update(data);
        res.json({ message: "Documento actualizado correctamente" });
    } catch (error) {
        console.error("Error actualizando documento en subcolección:", error);
        res.status(500).json({ error: error.message });
    }
};

// Eliminar documento de subcolección
export const deleteSubcollectionDoc = async (req, res) => {
    const { collection, docId, subcollection, subDocId } = req.params;

    try {
        const docRef = db.collection(collection).doc(docId);
        const subcollectionRef = docRef.collection(subcollection);
        
        await subcollectionRef.doc(subDocId).delete();
        res.json({ message: "Documento eliminado correctamente" });
    } catch (error) {
        console.error("Error eliminando documento de subcolección:", error);
        res.status(500).json({ error: error.message });
    }
};