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
