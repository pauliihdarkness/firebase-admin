import db from "../firebaseConfig.js";

// Obtener todas las conversaciones de un usuario
export const getUserConversations = async (req, res) => {
    try {
        console.log('🔍 getUserConversations llamado');
        console.log('🔑 Usuario:', req.user);
        
        if (!req.user || !req.user.uid) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        
        const { uid } = req.user;

        // Obtener conversaciones donde el usuario es participante
        // Intentar con orderBy, si falla (por falta de índice), hacer sin orderBy
        let conversationsSnapshot;
        try {
            conversationsSnapshot = await db
                .collection('conversation')
                .where('participants', 'array-contains', uid)
                .orderBy('lastMessageAt', 'desc')
                .get();
        } catch (orderError) {
            // Si falla el orderBy, obtener sin ordenar y ordenar manualmente
            console.warn('No se pudo ordenar por lastMessageAt, obteniendo sin orden:', orderError.message);
            conversationsSnapshot = await db
                .collection('conversation')
                .where('participants', 'array-contains', uid)
                .get();
        }

        const conversations = [];
        
        for (const doc of conversationsSnapshot.docs) {
            const data = doc.data();
            const otherUserId = data.participants.find(p => p !== uid);
            
            // Obtener información del otro usuario
            let otherUser = null;
            if (otherUserId) {
                const otherUserDoc = await db.collection('users').doc(otherUserId).get();
                if (otherUserDoc.exists) {
                    otherUser = {
                        uid: otherUserDoc.id,
                        ...otherUserDoc.data()
                    };
                }
            }

            // Obtener último mensaje y conteo de no leídos
            let lastMessage = null;
            let unreadCount = 0;
            
            try {
                // Intentar obtener último mensaje ordenado
                let lastMessageSnapshot;
                try {
                    lastMessageSnapshot = await db
                        .collection('conversation')
                        .doc(doc.id)
                        .collection('messages')
                        .orderBy('timestamp', 'desc')
                        .limit(1)
                        .get();
                } catch (orderError) {
                    // Si falla el orderBy, obtener todos y ordenar manualmente
                    console.warn(`No se pudo ordenar mensajes de conversación ${doc.id}:`, orderError.message);
                    const allMessages = await db
                        .collection('conversation')
                        .doc(doc.id)
                        .collection('messages')
                        .get();
                    
                    if (!allMessages.empty) {
                        const sortedMessages = allMessages.docs
                            .map(msgDoc => ({ id: msgDoc.id, ...msgDoc.data() }))
                            .sort((a, b) => {
                                const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                                const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                                return dateB - dateA;
                            });
                        
                        if (sortedMessages.length > 0) {
                            lastMessage = sortedMessages[0].text || null;
                        }
                    }
                }
                
                if (!lastMessage && lastMessageSnapshot && !lastMessageSnapshot.empty) {
                    const lastMsg = lastMessageSnapshot.docs[0].data();
                    lastMessage = lastMsg.text;
                }
            } catch (msgError) {
                console.warn(`Error obteniendo último mensaje de conversación ${doc.id}:`, msgError.message);
            }

            // Contar mensajes no leídos
            try {
                const unreadSnapshot = await db
                    .collection('conversation')
                    .doc(doc.id)
                    .collection('messages')
                    .where('senderId', '!=', uid)
                    .where('read', '==', false)
                    .get();
                
                unreadCount = unreadSnapshot.size;
            } catch (unreadError) {
                console.warn(`Error contando mensajes no leídos de conversación ${doc.id}:`, unreadError.message);
                unreadCount = 0;
            }

            conversations.push({
                id: doc.id,
                ...data,
                otherUser,
                lastMessage: lastMessage || 'Sin mensajes',
                unreadCount
            });
        }

        // Ordenar manualmente si no se pudo ordenar en la consulta
        conversations.sort((a, b) => {
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return dateB - dateA; // Orden descendente
        });

        res.json(conversations);
    } catch (error) {
        console.error('Error obteniendo conversaciones:', error);
        res.status(500).json({ error: error.message });
    }
};

// Crear o obtener una conversación entre dos usuarios
export const getOrCreateConversation = async (req, res) => {
    try {
        const { uid } = req.user;
        const { otherUserId } = req.body;

        if (!otherUserId) {
            return res.status(400).json({ error: 'otherUserId es requerido' });
        }

        if (uid === otherUserId) {
            return res.status(400).json({ error: 'No puedes chatear contigo mismo' });
        }

        // Verificar que el otro usuario existe
        const otherUserDoc = await db.collection('users').doc(otherUserId).get();
        if (!otherUserDoc.exists) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Buscar conversación existente
        const existingConvs = await db
            .collection('conversation')
            .where('participants', 'array-contains', uid)
            .get();

        let conversationId = null;
        for (const doc of existingConvs.docs) {
            const data = doc.data();
            if (data.participants.includes(otherUserId) && data.participants.length === 2) {
                conversationId = doc.id;
                break;
            }
        }

        // Si existe, retornarla
        if (conversationId) {
            const convDoc = await db.collection('conversation').doc(conversationId).get();
            const convData = convDoc.data();
            
            const otherUser = {
                uid: otherUserDoc.id,
                ...otherUserDoc.data()
            };

            return res.json({
                id: convDoc.id,
                ...convData,
                otherUser
            });
        }

        // Si no existe, crear nueva conversación
        const newConversation = {
            participants: [uid, otherUserId],
            createdAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            messages: []
        };

        const docRef = await db.collection('conversation').add(newConversation);

        const otherUser = {
            uid: otherUserDoc.id,
            ...otherUserDoc.data()
        };

        res.status(201).json({
            id: docRef.id,
            ...newConversation,
            otherUser
        });
    } catch (error) {
        console.error('Error creando/obteniendo conversación:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener mensajes de una conversación
export const getConversationMessages = async (req, res) => {
    try {
        const { uid } = req.user;
        const { conversationId } = req.params;

        // Verificar que el usuario es participante
        const convDoc = await db.collection('conversation').doc(conversationId).get();
        
        if (!convDoc.exists) {
            return res.status(404).json({ error: 'Conversación no encontrada' });
        }

        const convData = convDoc.data();
        if (!convData.participants.includes(uid)) {
            return res.status(403).json({ error: 'No tienes acceso a esta conversación' });
        }

        // Obtener mensajes de la subcolección messages
        const messagesSnapshot = await db
            .collection('conversation')
            .doc(conversationId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();

        const messages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(messages);
    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ error: error.message });
    }
};

// Enviar un mensaje
export const sendMessage = async (req, res) => {
    try {
        const { uid } = req.user;
        const { conversationId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
        }

        // Verificar que el usuario es participante
        const convDoc = await db.collection('conversation').doc(conversationId).get();
        
        if (!convDoc.exists) {
            return res.status(404).json({ error: 'Conversación no encontrada' });
        }

        const convData = convDoc.data();
        if (!convData.participants.includes(uid)) {
            return res.status(403).json({ error: 'No tienes acceso a esta conversación' });
        }

        // Obtener información del usuario
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // Crear mensaje
        const message = {
            senderId: uid,
            senderName: userData.displayName || userData.email || 'Usuario',
            text: text.trim(),
            timestamp: new Date().toISOString(),
            read: false
        };

        // Guardar mensaje en la subcolección
        const messageRef = await db
            .collection('conversation')
            .doc(conversationId)
            .collection('messages')
            .add(message);

        // Actualizar lastMessageAt de la conversación
        await db.collection('conversation').doc(conversationId).update({
            lastMessageAt: message.timestamp
        });

        res.status(201).json({
            id: messageRef.id,
            ...message
        });
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener lista de usuarios disponibles para chatear
export const getAvailableUsers = async (req, res) => {
    try {
        const { uid } = req.user;

        // Obtener todos los usuarios excepto el actual
        const usersSnapshot = await db.collection('users').get();
        
        const users = usersSnapshot.docs
            .filter(doc => doc.id !== uid)
            .map(doc => ({
                uid: doc.id,
                displayName: doc.data().displayName || doc.data().email || 'Usuario',
                email: doc.data().email || null,
                picture: doc.data().picture || null,
                role: doc.data().role || 'user'
            }));

        res.json(users);
    } catch (error) {
        console.error('Error obteniendo usuarios disponibles:', error);
        res.status(500).json({ error: error.message });
    }
};

// Marcar mensajes como leídos
export const markMessagesAsRead = async (req, res) => {
    try {
        const { uid } = req.user;
        const { conversationId } = req.params;

        // Verificar que el usuario es participante
        const convDoc = await db.collection('conversation').doc(conversationId).get();
        
        if (!convDoc.exists) {
            return res.status(404).json({ error: 'Conversación no encontrada' });
        }

        const convData = convDoc.data();
        if (!convData.participants.includes(uid)) {
            return res.status(403).json({ error: 'No tienes acceso a esta conversación' });
        }

        // Obtener mensajes no leídos del otro usuario
        const messagesSnapshot = await db
            .collection('conversation')
            .doc(conversationId)
            .collection('messages')
            .where('senderId', '!=', uid)
            .where('read', '==', false)
            .get();

        // Marcar como leídos
        const batch = db.batch();
        messagesSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();

        res.json({ message: 'Mensajes marcados como leídos', count: messagesSnapshot.docs.length });
    } catch (error) {
        console.error('Error marcando mensajes como leídos:', error);
        res.status(500).json({ error: error.message });
    }
};

