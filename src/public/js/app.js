// Usar Firebase desde el objeto global (compat mode)
// Esperar a que Firebase esté inicializado
let auth = null;
const API_URL = window.location.origin;
let currentUser = null;

// Función para inicializar cuando Firebase esté listo
function initializeApp() {
    auth = window.firebaseAuth;
    
    if (auth) {
        // Observar cambios en el estado de autenticación
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            updateUI(user);
            
            // Solo redirigir si estamos en una página protegida y no hay usuario
            // pero esperar un momento para evitar redirecciones prematuras
            setTimeout(() => {
                const path = window.location.pathname;
                const protectedPaths = ['/dashboard', '/profile', '/documents', '/users'];
                
                if (protectedPaths.includes(path) && !user && auth.currentUser === null) {
                    window.location.href = '/';
                }
            }, 500);
        });
        
        // Verificar usuario actual inmediatamente
        if (auth.currentUser) {
            currentUser = auth.currentUser;
            updateUI(auth.currentUser);
        }
    }
}

// Escuchar evento de Firebase listo
window.addEventListener('firebaseReady', initializeApp);

// También intentar inicializar inmediatamente si ya está listo
if (window.firebaseAuth) {
    initializeApp();
}

// Reintentar cada 100ms hasta que Firebase esté listo (máximo 5 segundos)
let initAttempts = 0;
const maxAttempts = 50;
const initInterval = setInterval(() => {
    if (window.firebaseAuth && !auth) {
        clearInterval(initInterval);
        initializeApp();
    } else if (initAttempts >= maxAttempts) {
        clearInterval(initInterval);
        console.warn('Firebase no se cargó después de varios intentos');
    }
    initAttempts++;
}, 100);

// Variable global para el rol del usuario actual
let currentUserRole = null;

// Actualizar UI según el estado de autenticación
async function updateUI(user) {
    const nav = document.getElementById('nav');
    if (!nav) return;
    
    if (user) {
        // Obtener rol del usuario para mostrar enlace de usuarios si es admin
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                currentUserRole = userData.role || 'user';
            }
        } catch (error) {
            console.error('Error obteniendo rol del usuario:', error);
            currentUserRole = 'user';
        }
        
        // Usuario autenticado - mostrar enlaces según rol
        let navHTML = `
            <a href="/dashboard" class="nav-link">Dashboard</a>
            <a href="/documents" class="nav-link">Documentos</a>
            <a href="/profile" class="nav-link">Perfil</a>
        `;
        
        // Verificar si hay admins para decidir si mostrar enlace de usuarios
        try {
            const token = await user.getIdToken();
            const usersResponse = await fetch(`${API_URL}/auth/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (usersResponse.ok) {
                const allUsers = await usersResponse.json();
                const hasAnyAdmin = allUsers.some(u => u.role === 'admin');
                
                // Mostrar enlace de usuarios si es admin O si no hay ningún admin (para crear el primero)
                if (currentUserRole === 'admin' || !hasAnyAdmin) {
                    navHTML += `<a href="/users" class="nav-link">Usuarios</a>`;
                }
            } else if (currentUserRole === 'admin') {
                // Fallback: mostrar si ya sabemos que es admin
                navHTML += `<a href="/users" class="nav-link">Usuarios</a>`;
            }
        } catch (error) {
            console.error('Error verificando usuarios:', error);
            // Si es admin conocido, mostrar enlace de todas formas
            if (currentUserRole === 'admin') {
                navHTML += `<a href="/users" class="nav-link">Usuarios</a>`;
            }
        }
        
        navHTML += `<button id="logout-btn" class="btn btn-outline">Cerrar Sesión</button>`;
        
        nav.innerHTML = navHTML;
        
        // Agregar listener al botón de logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    } else {
        // Usuario no autenticado
        nav.innerHTML = `
            <a href="/" class="nav-link">Iniciar Sesión</a>
            <a href="/register" class="nav-link">Registrarse</a>
        `;
        currentUserRole = null;
    }
}

// Manejar logout
async function handleLogout() {
    try {
        if (!auth) auth = window.firebaseAuth;
        await auth.signOut();
        window.location.href = '/';
    } catch (error) {
        showError('Error al cerrar sesión: ' + error.message);
    }
}

// Inicializar formulario de login
function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    const googleBtn = document.getElementById('google-login-btn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                if (!auth) auth = window.firebaseAuth;
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const token = await userCredential.user.getIdToken();
                
                // Opcional: enviar token al backend para verificación
                await verifyTokenWithBackend(token);
                
                showSuccess('¡Inicio de sesión exitoso!');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } catch (error) {
                showError(getErrorMessage(error.code));
            }
        });
    }
    
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }
}

// Inicializar formulario de registro
function initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const googleBtn = document.getElementById('google-register-btn');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const displayName = document.getElementById('reg-name').value;
            
            try {
                // Registrar con Firebase Auth
                if (!auth) auth = window.firebaseAuth;
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                
                // Registrar también en el backend
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password, displayName })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Error al registrar');
                }
                
                showSuccess('¡Registro exitoso!');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } catch (error) {
                showError(getErrorMessage(error.code) || error.message);
            }
        });
    }
    
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }
}

// Manejar login con Google
async function handleGoogleLogin() {
    try {
        if (!auth) auth = window.firebaseAuth;
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const token = await result.user.getIdToken();
        
        // Verificar token con el backend
        const response = await fetch(`${API_URL}/auth/verify-google`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showSuccess('¡Autenticación exitosa!');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            throw new Error('Error al verificar token');
        }
    } catch (error) {
        showError(getErrorMessage(error.code) || error.message);
    }
}

// Verificar token con el backend
async function verifyTokenWithBackend(token) {
    try {
        const response = await fetch(`${API_URL}/auth/verify-google`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Error verificando token:', error);
        return false;
    }
}

// Inicializar dashboard
function initDashboard() {
    // Esperar a que Firebase esté listo
    let attempts = 0;
    const maxAttempts = 30; // 3 segundos máximo
    
    function checkAndInit() {
        attempts++;
        
        if (!auth) auth = window.firebaseAuth;
        
        if (auth && auth.currentUser) {
            currentUser = auth.currentUser;
            loadUserInfo();
            loadStats();
        } else if (!auth && attempts < maxAttempts) {
            // Reintentar si Firebase aún no está cargado
            setTimeout(checkAndInit, 100);
        } else if (auth && !auth.currentUser && attempts >= 5) {
            // Firebase está cargado pero no hay usuario autenticado
            // Esperar al menos 5 intentos para dar tiempo a Firebase de verificar la sesión
            console.log('No hay usuario autenticado, redirigiendo...');
            window.location.href = '/';
        } else if (attempts < maxAttempts) {
            // Seguir intentando
            setTimeout(checkAndInit, 100);
        }
    }
    
    checkAndInit();
}

// Cargar información del usuario
async function loadUserInfo() {
    try {
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser) {
            if (auth && auth.currentUser) {
                currentUser = auth.currentUser;
            } else {
                return;
            }
        }
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
                userNameEl.textContent = userData.displayName || userData.email || 'Usuario';
            }
        }
    } catch (error) {
        console.error('Error cargando info del usuario:', error);
    }
}

// Cargar estadísticas
async function loadStats() {
    if (!auth) auth = window.firebaseAuth;
    if (!currentUser && auth) currentUser = auth.currentUser;
    
    if (!currentUser) {
        return;
    }
    
    try {
        const token = await currentUser.getIdToken();
        
        // Colecciones comunes a verificar
        const commonCollections = ['users', 'products', 'orders', 'categories', 'posts', 'documents'];
        let totalDocs = 0;
        let foundCollections = new Set();
        
        // Contar documentos en cada colección conocida
        const collectionPromises = commonCollections.map(async (collection) => {
            try {
                const response = await fetch(`${API_URL}/api/${collection}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const docs = await response.json();
                    if (docs && Array.isArray(docs)) {
                        foundCollections.add(collection);
                        return { collection, count: docs.length };
                    }
                }
                return { collection, count: 0 };
            } catch (error) {
                // Silenciar errores de colecciones que no existen
                return { collection, count: 0 };
            }
        });
        
        // Esperar todas las promesas
        const results = await Promise.all(collectionPromises);
        
        // Sumar todos los documentos
        results.forEach(result => {
            if (result.count > 0) {
                totalDocs += result.count;
            }
        });
        
        // Actualizar UI
        const totalDocsEl = document.getElementById('total-docs');
        const totalCollectionsEl = document.getElementById('total-collections');
        
        if (totalDocsEl) {
            totalDocsEl.textContent = totalDocs.toLocaleString();
        }
        
        if (totalCollectionsEl) {
            // Contar colecciones únicas encontradas
            totalCollectionsEl.textContent = foundCollections.size;
        }
        
        // Mostrar estado del usuario
        const userStatusEl = document.getElementById('user-status');
        if (userStatusEl) {
            userStatusEl.textContent = 'Activo';
        }
        
        console.log(`Estadísticas cargadas: ${totalDocs} documentos en ${foundCollections.size} colecciones`);
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // Mostrar valores por defecto si hay error
        const totalDocsEl = document.getElementById('total-docs');
        const totalCollectionsEl = document.getElementById('total-collections');
        
        if (totalDocsEl) {
            totalDocsEl.textContent = 'N/A';
        }
        
        if (totalCollectionsEl) {
            totalCollectionsEl.textContent = 'N/A';
        }
    }
}

// Inicializar perfil
function initProfile() {
    // Esperar a que Firebase esté listo
    let attempts = 0;
    const maxAttempts = 30; // 3 segundos máximo
    
    function checkAndInit() {
        attempts++;
        
        if (!auth) auth = window.firebaseAuth;
        
        if (auth && auth.currentUser) {
            currentUser = auth.currentUser;
            loadProfile();
            initProfileForm();
        } else if (!auth && attempts < maxAttempts) {
            // Reintentar si Firebase aún no está cargado
            setTimeout(checkAndInit, 100);
        } else if (auth && !auth.currentUser && attempts >= 5) {
            // Firebase está cargado pero no hay usuario autenticado
            // Esperar al menos 5 intentos para dar tiempo a Firebase de verificar la sesión
            console.log('No hay usuario autenticado, redirigiendo...');
            window.location.href = '/';
            return;
        } else if (attempts < maxAttempts) {
            // Seguir intentando
            setTimeout(checkAndInit, 100);
        }
    }
    
    checkAndInit();
}

// Cargar datos del perfil
async function loadProfile() {
    try {
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser) {
            if (auth && auth.currentUser) {
                currentUser = auth.currentUser;
            } else {
                window.location.href = '/';
                return;
            }
        }
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            document.getElementById('profile-name').textContent = userData.displayName || 'Sin nombre';
            document.getElementById('profile-email').textContent = userData.email || '';
            document.getElementById('profile-display-name').value = userData.displayName || '';
            document.getElementById('profile-phone').value = userData.phoneNumber || '';
            document.getElementById('profile-created').value = userData.createdAt || 'N/A';
            document.getElementById('profile-last-login').value = userData.lastLogin || 'N/A';
            
            // Mostrar rol con traducción al español
            const roleElement = document.getElementById('profile-role');
            if (roleElement) {
                const role = userData.role || 'user';
                const roleTranslations = {
                    'admin': 'Administrador',
                    'moderador': 'Moderador',
                    'user': 'Usuario'
                };
                roleElement.value = roleTranslations[role] || role;
            }
            
            if (userData.picture) {
                document.getElementById('user-avatar').src = userData.picture;
            }
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
        showError('Error al cargar el perfil');
    }
}

// Inicializar formulario de perfil
function initProfileForm() {
    const form = document.getElementById('profile-form');
    const deleteBtn = document.getElementById('delete-account-btn');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const displayName = document.getElementById('profile-display-name').value;
            const phoneNumber = document.getElementById('profile-phone').value;
            
            try {
                if (!auth) auth = window.firebaseAuth;
                if (!currentUser && auth) currentUser = auth.currentUser;
                if (!currentUser) {
                    window.location.href = '/';
                    return;
                }
                const token = await currentUser.getIdToken();
                const response = await fetch(`${API_URL}/auth/me`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ displayName, phoneNumber })
                });
                
                if (response.ok) {
                    showSuccess('Perfil actualizado exitosamente');
                } else {
                    const error = await response.json();
                    throw new Error(error.error);
                }
            } catch (error) {
                showError(error.message);
            }
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                try {
                    if (!auth) auth = window.firebaseAuth;
                    if (!currentUser && auth) currentUser = auth.currentUser;
                    if (!currentUser) {
                        window.location.href = '/';
                        return;
                    }
                    const token = await currentUser.getIdToken();
                    const response = await fetch(`${API_URL}/auth/me`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        await auth.signOut();
                        window.location.href = '/';
                    } else {
                        throw new Error('Error al eliminar cuenta');
                    }
                } catch (error) {
                    showError(error.message);
                }
            }
        });
    }
}

// Inicializar documentos
function initDocuments() {
    // Esperar a que Firebase esté listo
    let attempts = 0;
    const maxAttempts = 30; // 3 segundos máximo
    
    function checkAndInit() {
        attempts++;
        
        if (!auth) auth = window.firebaseAuth;
        
        if (auth && auth.currentUser) {
            currentUser = auth.currentUser;
            // Inicializar funcionalidades de documentos
            initDocumentModal();
            initCollectionSelector();
            initSearch();
        } else if (!auth && attempts < maxAttempts) {
            // Reintentar si Firebase aún no está cargado
            setTimeout(checkAndInit, 100);
        } else if (auth && !auth.currentUser && attempts >= 5) {
            // Firebase está cargado pero no hay usuario autenticado
            // Esperar al menos 5 intentos para dar tiempo a Firebase de verificar la sesión
            console.log('No hay usuario autenticado, redirigiendo...');
            window.location.href = '/';
            return;
        } else if (attempts < maxAttempts) {
            // Seguir intentando
            setTimeout(checkAndInit, 100);
        }
    }
    
    checkAndInit();
}

// Inicializar modal de documentos
function initDocumentModal() {
    const modal = document.getElementById('doc-modal');
    const newDocBtn = document.getElementById('new-doc-btn');
    const closeBtn = document.querySelector('.close');
    const closeModalBtn = document.querySelector('.close-modal');
    const form = document.getElementById('doc-form');
    const modalTitle = document.getElementById('modal-title');
    
    if (newDocBtn) {
        newDocBtn.addEventListener('click', () => {
            // Limpiar formulario y restaurar estado
            if (form) {
                form.reset();
                form.onsubmit = null; // Remover cualquier handler de edición
            }
            if (modalTitle) modalTitle.textContent = 'Nuevo Documento';
            const collectionInput = document.getElementById('modal-collection');
            const docIdInput = document.getElementById('modal-doc-id');
            if (collectionInput) {
                collectionInput.value = document.getElementById('collection-select').value || '';
            }
            if (docIdInput) {
                docIdInput.disabled = false; // Habilitar input de ID para crear nuevo
            }
            modal.style.display = 'block';
        });
    }
    
    const closeModal = () => {
        modal.style.display = 'none';
        if (form) {
            form.reset();
            form.onsubmit = null; // Remover cualquier handler de edición
            const docIdInput = document.getElementById('modal-doc-id');
            if (docIdInput) {
                docIdInput.disabled = false;
            }
        }
    };
    
    if (closeBtn || closeModalBtn) {
        [closeBtn, closeModalBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', closeModal);
            }
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!auth) auth = window.firebaseAuth;
            if (!currentUser && auth) currentUser = auth.currentUser;
            
            if (!currentUser) {
                showError('Debes iniciar sesión para crear documentos');
                return;
            }
            
            const collection = document.getElementById('modal-collection').value.trim();
            const docId = document.getElementById('modal-doc-id').value.trim();
            const dataText = document.getElementById('modal-data').value.trim();
            
            if (!collection) {
                showError('La colección es requerida');
                return;
            }
            
            let data;
            try {
                data = JSON.parse(dataText);
            } catch (error) {
                showError('El formato JSON no es válido: ' + error.message);
                return;
            }
            
            try {
                const token = await currentUser.getIdToken();
                
                const requestBody = {
                    collection: collection,
                    data: data
                };
                
                if (docId) {
                    requestBody.docId = docId;
                }
                
                const response = await fetch(`${API_URL}/api/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    showSuccess('Documento creado exitosamente');
                    modal.style.display = 'none';
                    if (form) form.reset();
                    
                    // Recargar documentos si estamos viendo esa colección
                    const selectedCollection = document.getElementById('collection-select').value;
                    if (selectedCollection === collection) {
                        loadDocuments(collection);
                    }
                    
                    // Seleccionar la colección si no estaba seleccionada
                    if (!selectedCollection) {
                        document.getElementById('collection-select').value = collection;
                    }
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Error al crear documento');
                }
            } catch (error) {
                console.error('Error creando documento:', error);
                showError('Error al crear documento: ' + error.message);
            }
        });
    }
}

// Inicializar selector de colecciones
function initCollectionSelector() {
    const collectionSelect = document.getElementById('collection-select');
    
    if (!collectionSelect) return;
    
    // Colecciones comunes predefinidas (puedes expandir esto)
    const commonCollections = ['users', 'conversaciones', 'likes', 'posts'];
    
    commonCollections.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        collectionSelect.appendChild(option);
    });
    
    // Permitir agregar colección personalizada
    collectionSelect.addEventListener('change', (e) => {
        const selectedCollection = e.target.value;
        if (selectedCollection) {
            loadDocuments(selectedCollection);
        } else {
            clearDocumentsList();
        }
    });
    
    // Input para nueva colección
    const newCollectionInput = document.createElement('input');
    newCollectionInput.type = 'text';
    newCollectionInput.className = 'form-control';
    newCollectionInput.placeholder = 'Escribir nueva colección...';
    newCollectionInput.style.marginTop = '0.5rem';
    
    newCollectionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const newCollection = e.target.value.trim();
            if (newCollection) {
                // Agregar a la lista
                const option = document.createElement('option');
                option.value = newCollection;
                option.textContent = newCollection;
                collectionSelect.appendChild(option);
                collectionSelect.value = newCollection;
                e.target.value = '';
                loadDocuments(newCollection);
            }
        }
    });
    
    collectionSelect.parentElement.appendChild(newCollectionInput);
}

// Inicializar búsqueda
function initSearch() {
    const searchInput = document.getElementById('search-input');
    
    if (!searchInput) return;
    
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.toLowerCase();
        
        searchTimeout = setTimeout(() => {
            filterDocuments(searchTerm);
        }, 300);
    });
}

// Cargar documentos de una colección
async function loadDocuments(collection) {
    if (!collection) return;
    
    // Resetear navegación
    currentCollection = collection;
    currentDocId = null;
    currentSubcollection = null;
    currentNavigationPath = [{ type: 'collection', name: collection }];
    updateBreadcrumb();
    
    if (!auth) auth = window.firebaseAuth;
    if (!currentUser && auth) currentUser = auth.currentUser;
    
    if (!currentUser) {
        showError('Debes iniciar sesión para ver documentos');
        return;
    }
    
    const documentsList = document.getElementById('documents-list');
    if (!documentsList) return;
    
    documentsList.innerHTML = '<p class="empty-state">Cargando documentos...</p>';
    
    try {
        const token = await currentUser.getIdToken();
        
        const response = await fetch(`${API_URL}/api/${collection}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const documents = await response.json();
            displayDocuments(documents, collection);
        } else if (response.status === 404) {
            documentsList.innerHTML = '<p class="empty-state">La colección no existe o está vacía.</p>';
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al cargar documentos');
        }
    } catch (error) {
        console.error('Error cargando documentos:', error);
        documentsList.innerHTML = `<p class="empty-state" style="color: var(--danger-color);">Error: ${error.message}</p>`;
    }
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Crear input según el tipo de dato
function createInputForField(fieldName, value, docId, collection) {
    const safeFieldName = escapeHtml(fieldName);
    const safeDocId = escapeHtml(docId);
    const safeCollection = escapeHtml(collection);
    const fieldId = `field_${safeDocId}_${fieldName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const inputId = `input_${safeDocId}_${fieldName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    let inputHTML = '';
    const valueType = typeof value;
    
    if (valueType === 'boolean') {
        inputHTML = `
            <select id="${inputId}" class="form-control field-input" data-doc-id="${safeDocId}" data-collection="${safeCollection}" data-field="${safeFieldName}">
                <option value="true" ${value === true ? 'selected' : ''}>true</option>
                <option value="false" ${value === false ? 'selected' : ''}>false</option>
            </select>
        `;
    } else if (valueType === 'number') {
        inputHTML = `
            <input type="number" id="${inputId}" class="form-control field-input" 
                   data-doc-id="${safeDocId}" data-collection="${safeCollection}" data-field="${safeFieldName}"
                   value="${escapeHtml(value)}" step="${Number.isInteger(value) ? '1' : 'any'}">
        `;
    } else if (valueType === 'object' && value !== null) {
        // Para objetos y arrays, mostrar como textarea JSON
        const jsonValue = JSON.stringify(value, null, 2);
        inputHTML = `
            <textarea id="${inputId}" class="form-control field-input json-field" 
                      data-doc-id="${safeDocId}" data-collection="${safeCollection}" data-field="${safeFieldName}"
                      rows="4">${escapeHtml(jsonValue)}</textarea>
        `;
    } else {
        // String, null o undefined
        const stringValue = value !== null && value !== undefined ? escapeHtml(String(value)) : '';
        const placeholder = value === null || value === undefined ? '(vacío)' : '';
        inputHTML = `
            <input type="text" id="${inputId}" class="form-control field-input" 
                   data-doc-id="${safeDocId}" data-collection="${safeCollection}" data-field="${safeFieldName}"
                   value="${stringValue}" placeholder="${placeholder}">
        `;
    }
    
    return `
        <div class="form-group field-group" id="${fieldId}">
            <label for="${inputId}">${safeFieldName}</label>
            ${inputHTML}
        </div>
    `;
}

// Crear formulario editable desde un objeto
function createEditableForm(docData, docId, collection) {
    let formHTML = '';
    
    // Ordenar campos: id primero si existe
    const fields = Object.keys(docData);
    
    fields.forEach(fieldName => {
        const value = docData[fieldName];
        formHTML += createInputForField(fieldName, value, docId, collection);
    });
    
    return formHTML;
}

// Mostrar documentos en la lista con inputs editables
function displayDocuments(documents, collection) {
    const documentsList = document.getElementById('documents-list');
    if (!documentsList) return;
    
    if (!documents || documents.length === 0) {
        documentsList.innerHTML = '<p class="empty-state">No hay documentos en esta colección.</p>';
        return;
    }
    
    documentsList.innerHTML = '';
    
    documents.forEach((doc, index) => {
        const docCard = document.createElement('div');
        docCard.className = 'document-card';
        docCard.setAttribute('data-doc-id', doc.id || `doc-${index}`);
        docCard.style.cssText = `
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow);
            margin-bottom: 1rem;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
        `;
        
        const docId = doc.id || `doc-${index}`;
        const docData = { ...doc };
        delete docData.id;
        
        const formHTML = createEditableForm(docData, docId, collection);
        
        docCard.innerHTML = `
            <div class="doc-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="margin: 0 0 0.5rem 0; color: var(--primary-color); word-break: break-word;">ID: ${docId}</h3>
                    <p style="margin: 0; color: var(--text-light); font-size: 0.9rem;">Colección: ${collection}</p>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-secondary btn-sm subcollections-btn" 
                            data-doc-id="${docId}" 
                            data-collection="${collection}"
                            onclick="viewSubcollections('${collection}', '${docId}')"
                            title="Ver subcolecciones">
                        📁 Subcolecciones
                    </button>
                    <button class="btn btn-primary btn-sm save-doc-btn" 
                            data-doc-id="${docId}" 
                            data-collection="${collection}"
                            onclick="saveDocumentFields('${collection}', '${docId}')">
                        💾 Guardar
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="deleteDocument('${collection}', '${docId}')">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
            <form class="doc-fields-form" data-doc-id="${docId}" data-collection="${collection}">
                ${formHTML}
            </form>
        `;
        
        documentsList.appendChild(docCard);
    });
    
    // Agregar listeners para cambios en tiempo real (opcional)
    setupFieldChangeListeners();
}

// Variables globales para navegación de subcolecciones
let currentNavigationPath = [];
let currentCollection = null;
let currentDocId = null;
let currentSubcollection = null;

// Ver subcolecciones de un documento
window.viewSubcollections = async function(collection, docId) {
    try {
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser && auth) currentUser = auth.currentUser;
        if (!currentUser) {
            showError('Debes iniciar sesión');
            return;
        }
        
        // Actualizar navegación actual
        currentCollection = collection;
        currentDocId = docId;
        currentSubcollection = null;
        currentNavigationPath = [
            { type: 'collection', name: collection },
            { type: 'document', name: docId, collection, docId }
        ];
        
        // Mostrar breadcrumb
        updateBreadcrumb();
        
        // Cargar subcolecciones
        await loadSubcollections(collection, docId);
    } catch (error) {
        console.error('Error cargando subcolecciones:', error);
        showError('Error al cargar subcolecciones: ' + error.message);
    }
};

// Cargar subcolecciones de un documento
async function loadSubcollections(collection, docId) {
    const documentsList = document.getElementById('documents-list');
    if (!documentsList) return;
    
    documentsList.innerHTML = '<p class="empty-state">Cargando subcolecciones...</p>';
    
    try {
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser && auth) currentUser = auth.currentUser;
        if (!currentUser) {
            showError('Debes iniciar sesión');
            return;
        }
        
        const token = await currentUser.getIdToken();
        
        // Obtener lista de subcolecciones
        const response = await fetch(`${API_URL}/api/${collection}/${docId}/subcollections`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const subcollections = await response.json();
            displaySubcollections(subcollections, collection, docId);
        } else if (response.status === 404) {
            // No hay subcolecciones, mostrar opción para crear
            displaySubcollections([], collection, docId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al cargar subcolecciones');
        }
    } catch (error) {
        console.error('Error cargando subcolecciones:', error);
        documentsList.innerHTML = `<p class="empty-state" style="color: var(--danger-color);">Error: ${error.message}</p>`;
    }
}

// Mostrar subcolecciones
function displaySubcollections(subcollections, collection, docId) {
    const documentsList = document.getElementById('documents-list');
    if (!documentsList) return;
    
    documentsList.innerHTML = '';
    
    // Botón para crear nueva subcolección
    const createBtn = document.createElement('button');
    createBtn.className = 'btn btn-primary';
    createBtn.textContent = '+ Nueva Subcolección';
    createBtn.onclick = () => createNewSubcollection(collection, docId);
    createBtn.style.marginBottom = '1rem';
    documentsList.appendChild(createBtn);
    
    if (!subcollections || subcollections.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = 'No hay subcolecciones. Crea una nueva para comenzar.';
        documentsList.appendChild(emptyMsg);
        return;
    }
    
    // Mostrar lista de subcolecciones
    subcollections.forEach(subcol => {
        const subcolCard = document.createElement('div');
        subcolCard.className = 'document-card';
        subcolCard.style.cssText = `
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow);
            margin-bottom: 1rem;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            cursor: pointer;
            transition: transform 0.2s;
        `;
        
        subcolCard.onmouseenter = () => subcolCard.style.transform = 'translateY(-2px)';
        subcolCard.onmouseleave = () => subcolCard.style.transform = 'translateY(0)';
        subcolCard.onclick = () => openSubcollection(collection, docId, subcol.id);
        
        subcolCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0 0 0.5rem 0; color: var(--primary-color);">
                        📁 ${escapeHtml(subcol.id)}
                    </h3>
                    <p style="margin: 0; color: var(--text-light); font-size: 0.9rem;">
                        Ruta: ${escapeHtml(subcol.path)}
                    </p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary btn-sm" 
                            onclick="event.stopPropagation(); openSubcollection('${collection}', '${docId}', '${escapeHtml(subcol.id)}')">
                        Abrir
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="event.stopPropagation(); deleteSubcollection('${collection}', '${docId}', '${escapeHtml(subcol.id)}')">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
        
        documentsList.appendChild(subcolCard);
    });
}

// Abrir una subcolección y mostrar sus documentos
window.openSubcollection = async function(collection, docId, subcollection) {
    try {
        currentCollection = collection;
        currentDocId = docId;
        currentSubcollection = subcollection;
        currentNavigationPath = [
            { type: 'collection', name: collection },
            { type: 'document', name: docId, collection, docId },
            { type: 'subcollection', name: subcollection, collection, docId, subcollection }
        ];
        
        updateBreadcrumb();
        await loadSubcollectionDocuments(collection, docId, subcollection);
    } catch (error) {
        console.error('Error abriendo subcolección:', error);
        showError('Error al abrir subcolección: ' + error.message);
    }
};

// Cargar documentos de una subcolección
async function loadSubcollectionDocuments(collection, docId, subcollection) {
    const documentsList = document.getElementById('documents-list');
    if (!documentsList) return;
    
    documentsList.innerHTML = '<p class="empty-state">Cargando documentos...</p>';
    
    try {
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser && auth) currentUser = auth.currentUser;
        if (!currentUser) {
            showError('Debes iniciar sesión');
            return;
        }
        
        const token = await currentUser.getIdToken();
        
        const response = await fetch(`${API_URL}/api/${collection}/${docId}/${subcollection}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const documents = await response.json();
            displaySubcollectionDocuments(documents, collection, docId, subcollection);
        } else if (response.status === 404) {
            documentsList.innerHTML = '<p class="empty-state">La subcolección no existe o está vacía.</p>';
            // Mostrar opción para crear documento
            const createBtn = document.createElement('button');
            createBtn.className = 'btn btn-primary';
            createBtn.textContent = '+ Crear Primer Documento';
            createBtn.onclick = () => createSubcollectionDocument(collection, docId, subcollection);
            documentsList.appendChild(createBtn);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al cargar documentos');
        }
    } catch (error) {
        console.error('Error cargando documentos de subcolección:', error);
        documentsList.innerHTML = `<p class="empty-state" style="color: var(--danger-color);">Error: ${error.message}</p>`;
    }
}

// Mostrar documentos de una subcolección
function displaySubcollectionDocuments(documents, collection, docId, subcollection) {
    const documentsList = document.getElementById('documents-list');
    if (!documentsList) return;
    
    documentsList.innerHTML = '';
    
    // Botón para crear nuevo documento en subcolección
    const createBtn = document.createElement('button');
    createBtn.className = 'btn btn-primary';
    createBtn.textContent = '+ Nuevo Documento';
    createBtn.onclick = () => createSubcollectionDocument(collection, docId, subcollection);
    createBtn.style.marginBottom = '1rem';
    documentsList.appendChild(createBtn);
    
    if (!documents || documents.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = 'No hay documentos en esta subcolección.';
        documentsList.appendChild(emptyMsg);
        return;
    }
    
    // Mostrar documentos con la misma funcionalidad que documentos principales
    documents.forEach((doc, index) => {
        const docCard = document.createElement('div');
        docCard.className = 'document-card';
        docCard.setAttribute('data-doc-id', doc.id || `doc-${index}`);
        docCard.style.cssText = `
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow);
            margin-bottom: 1rem;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
        `;
        
        const subDocId = doc.id || `doc-${index}`;
        const docData = { ...doc };
        delete docData.id;
        
        const formHTML = createEditableForm(docData, subDocId, collection);
        
        docCard.innerHTML = `
            <div class="doc-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="margin: 0 0 0.5rem 0; color: var(--primary-color); word-break: break-word;">ID: ${subDocId}</h3>
                    <p style="margin: 0; color: var(--text-light); font-size: 0.9rem;">
                        Subcolección: ${subcollection}
                    </p>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-sm" 
                            onclick="saveSubcollectionDocumentFields('${collection}', '${docId}', '${subcollection}', '${subDocId}')">
                        💾 Guardar
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="deleteSubcollectionDocument('${collection}', '${docId}', '${subcollection}', '${subDocId}')">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
            <form class="doc-fields-form" data-doc-id="${subDocId}" data-collection="${collection}">
                ${formHTML}
            </form>
        `;
        
        documentsList.appendChild(docCard);
    });
}

// Actualizar breadcrumb
function updateBreadcrumb() {
    const breadcrumbContainer = document.getElementById('breadcrumb-container');
    const breadcrumb = document.getElementById('breadcrumb');
    
    if (!breadcrumbContainer || !breadcrumb) return;
    
    if (currentNavigationPath.length <= 1) {
        breadcrumbContainer.style.display = 'none';
        return;
    }
    
    breadcrumbContainer.style.display = 'block';
    breadcrumb.innerHTML = '';
    
    currentNavigationPath.forEach((item, index) => {
        const span = document.createElement('span');
        
        if (index < currentNavigationPath.length - 1) {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = item.name;
            link.onclick = (e) => {
                e.preventDefault();
                navigateToBreadcrumb(index);
            };
            span.appendChild(link);
            span.appendChild(document.createTextNode(' / '));
        } else {
            span.textContent = item.name;
            span.style.fontWeight = 'bold';
        }
        
        breadcrumb.appendChild(span);
    });
}

// Navegar a un punto del breadcrumb
function navigateToBreadcrumb(index) {
    const item = currentNavigationPath[index];
    
    if (item.type === 'collection') {
        // Volver a la colección principal
        currentCollection = item.name;
        currentDocId = null;
        currentSubcollection = null;
        currentNavigationPath = [{ type: 'collection', name: item.name }];
        updateBreadcrumb();
        loadDocuments(item.name);
    } else if (item.type === 'document') {
        // Volver al documento
        currentCollection = item.collection;
        currentDocId = item.docId;
        currentSubcollection = null;
        currentNavigationPath = [
            { type: 'collection', name: item.collection },
            { type: 'document', name: item.docId, collection: item.collection, docId: item.docId }
        ];
        updateBreadcrumb();
        loadSubcollections(item.collection, item.docId);
    } else if (item.type === 'subcollection') {
        // Volver a la subcolección
        currentCollection = item.collection;
        currentDocId = item.docId;
        currentSubcollection = item.subcollection;
        currentNavigationPath = [
            { type: 'collection', name: item.collection },
            { type: 'document', name: item.docId, collection: item.collection, docId: item.docId },
            { type: 'subcollection', name: item.subcollection, collection: item.collection, docId: item.docId, subcollection: item.subcollection }
        ];
        updateBreadcrumb();
        loadSubcollectionDocuments(item.collection, item.docId, item.subcollection);
    }
}

// Crear nueva subcolección
async function createNewSubcollection(collection, docId) {
    const subcollectionName = prompt('Ingresa el nombre de la nueva subcolección:');
    
    if (!subcollectionName || !subcollectionName.trim()) {
        return;
    }
    
    // Crear un documento vacío en la subcolección para crearla
    try {
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser && auth) currentUser = auth.currentUser;
        if (!currentUser) {
            showError('Debes iniciar sesión');
            return;
        }
        
        const token = await currentUser.getIdToken();
        
        // Crear un documento inicial en la subcolección
        const response = await fetch(`${API_URL}/api/${collection}/${docId}/${subcollectionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                data: {
                    _created: new Date().toISOString(),
                    _message: 'Subcolección creada. Este documento inicial puede ser eliminado.'
                }
            })
        });
        
        if (response.ok) {
            showSuccess('Subcolección creada exitosamente');
            await loadSubcollections(collection, docId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear subcolección');
        }
    } catch (error) {
        console.error('Error creando subcolección:', error);
        showError('Error al crear subcolección: ' + error.message);
    }
}

// Crear documento en subcolección
function createSubcollectionDocument(collection, docId, subcollection) {
    const modal = document.getElementById('doc-modal');
    const form = document.getElementById('doc-form');
    const modalTitle = document.getElementById('modal-title');
    const collectionInput = document.getElementById('modal-collection');
    const docIdInput = document.getElementById('modal-doc-id');
    
    if (modalTitle) modalTitle.textContent = `Nuevo Documento en ${subcollection}`;
    if (collectionInput) {
        collectionInput.value = `${collection}/${docId}/${subcollection}`;
        collectionInput.readOnly = true;
    }
    if (docIdInput) {
        docIdInput.disabled = false;
        docIdInput.placeholder = 'Dejar vacío para auto-generar';
    }
    
    // Configurar submit del formulario
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const dataInput = document.getElementById('modal-data');
            let data = {};
            
            try {
                if (dataInput.value.trim()) {
                    data = JSON.parse(dataInput.value);
                }
            } catch (error) {
                showError('JSON inválido: ' + error.message);
                return;
            }
            
            try {
                if (!auth) auth = window.firebaseAuth;
                if (!currentUser && auth) currentUser = auth.currentUser;
                if (!currentUser) {
                    showError('Debes iniciar sesión');
                    return;
                }
                
                const token = await currentUser.getIdToken();
                const subDocId = docIdInput.value.trim() || undefined;
                
                const response = await fetch(`${API_URL}/api/${collection}/${docId}/${subcollection}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        docId: subDocId,
                        data: data
                    })
                });
                
                if (response.ok) {
                    showSuccess('Documento creado exitosamente');
                    modal.style.display = 'none';
                    if (form) {
                        form.reset();
                        form.onsubmit = null;
                    }
                    await loadSubcollectionDocuments(collection, docId, subcollection);
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Error al crear documento');
                }
            } catch (error) {
                console.error('Error creando documento:', error);
                showError('Error al crear documento: ' + error.message);
            }
        };
    }
    
    if (modal) modal.style.display = 'block';
}

// Guardar campos de documento en subcolección
window.saveSubcollectionDocumentFields = async function(collection, docId, subcollection, subDocId) {
    try {
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser && auth) currentUser = auth.currentUser;
        if (!currentUser) {
            showError('Debes iniciar sesión');
            return;
        }
        
        const form = document.querySelector(`form[data-doc-id="${subDocId}"]`);
        if (!form) {
            showError('Formulario no encontrado');
            return;
        }
        
        const inputs = form.querySelectorAll('.field-input');
        const updateData = {};
        
        inputs.forEach(input => {
            const fieldName = input.getAttribute('data-field');
            let value = input.value;
            
            if (input.type === 'number') {
                value = input.value === '' ? null : parseFloat(value);
            } else if (input.classList.contains('json-field')) {
                try {
                    value = JSON.parse(value || '{}');
                } catch {
                    value = value;
                }
            } else if (input.tagName === 'SELECT') {
                if (input.value === 'true') value = true;
                else if (input.value === 'false') value = false;
                else value = input.value;
            }
            
            if (value === '') value = null;
            updateData[fieldName] = value;
        });
        
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_URL}/api/${collection}/${docId}/${subcollection}/${subDocId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            showSuccess('Documento actualizado exitosamente');
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar documento');
        }
    } catch (error) {
        console.error('Error guardando documento:', error);
        showError('Error al guardar: ' + error.message);
    }
};

// Eliminar documento de subcolección
window.deleteSubcollectionDocument = async function(collection, docId, subcollection, subDocId) {
    if (!confirm(`¿Estás seguro de eliminar el documento "${subDocId}"?`)) {
        return;
    }
    
    try {
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser && auth) currentUser = auth.currentUser;
        if (!currentUser) {
            showError('Debes iniciar sesión');
            return;
        }
        
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_URL}/api/${collection}/${docId}/${subcollection}/${subDocId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showSuccess('Documento eliminado exitosamente');
            await loadSubcollectionDocuments(collection, docId, subcollection);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar documento');
        }
    } catch (error) {
        console.error('Error eliminando documento:', error);
        showError('Error al eliminar: ' + error.message);
    }
};

// Eliminar subcolección completa (eliminar todos sus documentos)
window.deleteSubcollection = async function(collection, docId, subcollection) {
    if (!confirm(`¿Estás seguro de eliminar la subcolección "${subcollection}" y todos sus documentos?`)) {
        return;
    }
    
    try {
        // Primero obtener todos los documentos
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser && auth) currentUser = auth.currentUser;
        if (!currentUser) {
            showError('Debes iniciar sesión');
            return;
        }
        
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_URL}/api/${collection}/${docId}/${subcollection}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const documents = await response.json();
            
            // Eliminar todos los documentos
            for (const doc of documents) {
                await fetch(`${API_URL}/api/${collection}/${docId}/${subcollection}/${doc.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
            
            showSuccess('Subcolección eliminada exitosamente');
            await loadSubcollections(collection, docId);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar subcolección');
        }
    } catch (error) {
        console.error('Error eliminando subcolección:', error);
        showError('Error al eliminar subcolección: ' + error.message);
    }
};

// Configurar listeners para detectar cambios en los campos
function setupFieldChangeListeners() {
    const inputs = document.querySelectorAll('.field-input');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const card = this.closest('.document-card');
            const saveBtn = card.querySelector('.save-doc-btn');
            if (saveBtn) {
                saveBtn.classList.add('changed');
                saveBtn.style.opacity = '1';
            }
        });
    });
}

// Guardar cambios de campos individuales
window.saveDocumentFields = async function(collection, docId) {
    if (!auth) auth = window.firebaseAuth;
    if (!currentUser && auth) currentUser = auth.currentUser;
    
    if (!currentUser) {
        showError('Debes iniciar sesión para guardar documentos');
        return;
    }
    
    const card = document.querySelector(`[data-doc-id="${docId}"]`);
    if (!card) return;
    
    const form = card.querySelector('.doc-fields-form');
    if (!form) return;
    
    const saveBtn = card.querySelector('.save-doc-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Guardando...';
    }
    
    try {
        const token = await currentUser.getIdToken();
        const inputs = form.querySelectorAll('.field-input');
        const updateData = {};
        
        inputs.forEach(input => {
            const fieldName = input.dataset.field;
            const value = input.value;
            const originalValue = input.dataset.originalValue;
            
            // Determinar el tipo y convertir el valor
            let convertedValue = value;
            
            if (input.classList.contains('json-field')) {
                // Campo JSON
                try {
                    convertedValue = JSON.parse(value);
                } catch (e) {
                    throw new Error(`Campo ${fieldName}: JSON inválido`);
                }
            } else if (input.type === 'number') {
                convertedValue = value === '' ? null : Number(value);
            } else if (input.tagName === 'SELECT') {
                convertedValue = value === 'true';
            } else {
                convertedValue = value === '' ? null : value;
            }
            
            updateData[fieldName] = convertedValue;
        });
        
        const response = await fetch(`${API_URL}/api/${collection}/${docId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            showSuccess('Documento actualizado exitosamente');
            if (saveBtn) {
                saveBtn.classList.remove('changed');
                saveBtn.textContent = '💾 Guardar';
            }
            // Recargar para mostrar valores actualizados
            loadDocuments(collection);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar documento');
        }
    } catch (error) {
        console.error('Error guardando documento:', error);
        showError('Error al guardar: ' + error.message);
        if (saveBtn) {
            saveBtn.textContent = '💾 Guardar';
            saveBtn.disabled = false;
        }
    }
};

// Limpiar lista de documentos
function clearDocumentsList() {
    const documentsList = document.getElementById('documents-list');
    if (documentsList) {
        documentsList.innerHTML = '<p class="empty-state">Selecciona una colección para ver documentos.</p>';
    }
}

// Filtrar documentos
function filterDocuments(searchTerm) {
    const cards = document.querySelectorAll('.document-card');
    
    if (!searchTerm || searchTerm.trim() === '') {
        // Mostrar todos si no hay término de búsqueda
        cards.forEach(card => {
            card.style.display = 'block';
        });
        return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    cards.forEach(card => {
        // Buscar en el contenido del documento (todos los campos y valores)
        const text = card.textContent.toLowerCase();
        
        // También buscar en valores de inputs
        const inputs = card.querySelectorAll('.field-input');
        let foundInFields = false;
        
        inputs.forEach(input => {
            const fieldName = input.dataset.field || '';
            const fieldValue = input.value || '';
            if (fieldName.toLowerCase().includes(searchLower) || 
                fieldValue.toLowerCase().includes(searchLower)) {
                foundInFields = true;
            }
        });
        
        if (text.includes(searchLower) || foundInFields) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Editar documento (global para que funcione desde onclick)
window.editDocument = async function(collection, docId) {
    if (!auth) auth = window.firebaseAuth;
    if (!currentUser && auth) currentUser = auth.currentUser;
    
    if (!currentUser) {
        showError('Debes iniciar sesión para editar documentos');
        return;
    }
    
    try {
        const token = await currentUser.getIdToken();
        
        const response = await fetch(`${API_URL}/api/${collection}/${docId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const doc = await response.json();
            const modal = document.getElementById('doc-modal');
            const form = document.getElementById('doc-form');
            
            document.getElementById('modal-title').textContent = 'Editar Documento';
            document.getElementById('modal-collection').value = collection;
            document.getElementById('modal-doc-id').value = docId;
            document.getElementById('modal-doc-id').disabled = true; // No permitir cambiar ID
            document.getElementById('modal-data').value = JSON.stringify(doc.data || doc, null, 2);
            
            modal.style.display = 'block';
            
            // Cambiar el submit para actualizar en lugar de crear
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                const dataText = document.getElementById('modal-data').value.trim();
                let data;
                try {
                    data = JSON.parse(dataText);
                } catch (error) {
                    showError('El formato JSON no es válido: ' + error.message);
                    return;
                }
                
                try {
                    const updateResponse = await fetch(`${API_URL}/api/${collection}/${docId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (updateResponse.ok) {
                        showSuccess('Documento actualizado exitosamente');
                        modal.style.display = 'none';
                        if (form) {
                            form.reset();
                            form.onsubmit = null; // Remover handler de edición
                            const docIdInput = document.getElementById('modal-doc-id');
                            if (docIdInput) {
                                docIdInput.disabled = false;
                            }
                        }
                        loadDocuments(collection);
                    } else {
                        const error = await updateResponse.json();
                        throw new Error(error.error || 'Error al actualizar documento');
                    }
                } catch (error) {
                    showError('Error al actualizar documento: ' + error.message);
                }
            };
        }
    } catch (error) {
        console.error('Error cargando documento:', error);
        showError('Error al cargar documento: ' + error.message);
    }
};

// Eliminar documento (global para que funcione desde onclick)
window.deleteDocument = async function(collection, docId) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el documento "${docId}"?`)) {
        return;
    }
    
    if (!auth) auth = window.firebaseAuth;
    if (!currentUser && auth) currentUser = auth.currentUser;
    
    if (!currentUser) {
        showError('Debes iniciar sesión para eliminar documentos');
        return;
    }
    
    try {
        const token = await currentUser.getIdToken();
        
        const response = await fetch(`${API_URL}/api/${collection}/${docId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showSuccess('Documento eliminado exitosamente');
            loadDocuments(collection);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar documento');
        }
    } catch (error) {
        console.error('Error eliminando documento:', error);
        showError('Error al eliminar documento: ' + error.message);
    }
};

// Utilidades
function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    } else {
        alert('Error: ' + message);
    }
}

function showSuccess(message) {
    const successEl = document.getElementById('success-message');
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    }
}

function getErrorMessage(code) {
    const errors = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/email-already-in-use': 'Este email ya está en uso',
        'auth/weak-password': 'La contraseña es muy débil',
        'auth/invalid-email': 'Email inválido',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'auth/popup-closed-by-user': 'Ventana cerrada por el usuario',
        'auth/cancelled-popup-request': 'Solicitud cancelada'
    };
    return errors[code] || 'Error desconocido: ' + code;
}

// Inicializar página de usuarios
function initUsers() {
    // Esperar a que Firebase esté listo
    let attempts = 0;
    const maxAttempts = 30;
    
    function checkAndInit() {
        attempts++;
        
        if (!auth) auth = window.firebaseAuth;
        
        if (auth && auth.currentUser) {
            currentUser = auth.currentUser;
            loadUsers();
            initUsersFilters();
        } else if (!auth && attempts < maxAttempts) {
            setTimeout(checkAndInit, 100);
        } else if (auth && !auth.currentUser && attempts >= 5) {
            console.log('No hay usuario autenticado, redirigiendo...');
            window.location.href = '/';
            return;
        } else if (attempts < maxAttempts) {
            setTimeout(checkAndInit, 100);
        }
    }
    
    checkAndInit();
}

// Cargar lista de usuarios
async function loadUsers() {
    const loadingMsg = document.getElementById('loading-message');
    const usersList = document.getElementById('users-list');
    
    try {
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser && auth) currentUser = auth.currentUser;
        if (!currentUser) {
            window.location.href = '/';
            return;
        }
        
        // Verificar que el usuario sea admin
        const token = await currentUser.getIdToken();
        const userResponse = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!userResponse.ok) {
            throw new Error('Error obteniendo información del usuario');
        }
        
        const userData = await userResponse.json();
        
        // Verificar si hay algún admin en el sistema
        const allUsersResponse = await fetch(`${API_URL}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        let hasAnyAdmin = false;
        if (allUsersResponse.ok) {
            const allUsers = await allUsersResponse.json();
            hasAnyAdmin = allUsers.some(u => u.role === 'admin');
        }
        
        // Si no hay ningún admin, permitir acceso (para crear el primero)
        if (!hasAnyAdmin) {
            console.log('No hay administradores en el sistema. Permitiendo acceso para crear el primero.');
        } else if (userData.role !== 'admin') {
            showError('No tienes permisos para acceder a esta página');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
            return;
        }
        
        if (loadingMsg) loadingMsg.style.display = 'block';
        
        // Obtener lista de usuarios
        const response = await fetch(`${API_URL}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            const hasAnyAdmin = users.some(u => u.role === 'admin');
            
            // Mostrar advertencia si no hay admins
            const noAdminWarning = document.getElementById('no-admin-warning');
            if (noAdminWarning) {
                noAdminWarning.style.display = hasAnyAdmin ? 'none' : 'block';
            }
            
            displayUsers(users);
            updateUsersStats(users);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showError('Error al cargar usuarios: ' + error.message);
    } finally {
        if (loadingMsg) loadingMsg.style.display = 'none';
    }
}

// Mostrar usuarios en la lista
function displayUsers(users) {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;
    
    if (!users || users.length === 0) {
        usersList.innerHTML = '<p class="empty-state">No hay usuarios registrados.</p>';
        return;
    }
    
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.setAttribute('data-user-id', user.uid);
        userCard.setAttribute('data-role', user.role || 'user');
        
        const role = user.role || 'user';
        const roleTranslations = {
            'admin': 'Administrador',
            'moderador': 'Moderador',
            'user': 'Usuario'
        };
        
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'N/A';
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca';
        
        userCard.innerHTML = `
            <div class="user-info">
                <div class="user-name">${escapeHtml(user.displayName || user.email || 'Sin nombre')}</div>
                <div class="user-email">${escapeHtml(user.email || 'Sin email')}</div>
                <div class="user-meta">
                    <span class="user-meta-item">Registrado: ${createdAt}</span>
                    <span class="user-meta-item">Último acceso: ${lastLogin}</span>
                </div>
            </div>
            <div class="user-actions">
                <div class="role-selector">
                    <label>Rol:</label>
                    <select class="role-select" data-user-id="${escapeHtml(user.uid)}" data-current-role="${role}">
                        <option value="user" ${role === 'user' ? 'selected' : ''}>Usuario</option>
                        <option value="moderador" ${role === 'moderador' ? 'selected' : ''}>Moderador</option>
                        <option value="admin" ${role === 'admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                    <button class="btn btn-primary btn-sm save-role-btn" 
                            data-user-id="${escapeHtml(user.uid)}"
                            onclick="updateUserRole('${escapeHtml(user.uid)}', this)">
                        Guardar
                    </button>
                </div>
            </div>
        `;
        
        usersList.appendChild(userCard);
    });
    
    // Agregar listeners para cambio de roles
    const roleSelects = document.querySelectorAll('.role-select');
    roleSelects.forEach(select => {
        select.addEventListener('change', function() {
            const saveBtn = this.nextElementSibling;
            const currentRole = this.getAttribute('data-current-role');
            const newRole = this.value;
            
            // Habilitar botón solo si el rol cambió
            if (currentRole !== newRole) {
                saveBtn.disabled = false;
                saveBtn.style.opacity = '1';
            } else {
                saveBtn.disabled = true;
                saveBtn.style.opacity = '0.5';
            }
        });
    });
}

// Actualizar rol de usuario
window.updateUserRole = async function(userId, buttonElement) {
    try {
        const select = buttonElement.previousElementSibling;
        const newRole = select.value;
        
        if (!auth) auth = window.firebaseAuth;
        if (!currentUser && auth) currentUser = auth.currentUser;
        if (!currentUser) {
            window.location.href = '/';
            return;
        }
        
        // Confirmar cambio
        if (!confirm(`¿Estás seguro de cambiar el rol del usuario a "${newRole}"?`)) {
            return;
        }
        
        buttonElement.disabled = true;
        buttonElement.textContent = 'Guardando...';
        
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_URL}/auth/users/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                uid: userId,
                role: newRole
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccess(`Rol actualizado exitosamente a "${newRole}"`);
            
            // Actualizar atributo current-role
            select.setAttribute('data-current-role', newRole);
            buttonElement.disabled = true;
            buttonElement.style.opacity = '0.5';
            buttonElement.textContent = 'Guardar';
            
            // Actualizar estadísticas
            loadUsers();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar rol');
        }
    } catch (error) {
        console.error('Error actualizando rol:', error);
        showError('Error al actualizar rol: ' + error.message);
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Guardar';
        }
    }
};

// Actualizar estadísticas de usuarios
function updateUsersStats(users) {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const moderatorCount = users.filter(u => u.role === 'moderador').length;
    const userCount = users.filter(u => u.role === 'user' || !u.role).length;
    
    const totalEl = document.getElementById('total-users');
    const adminEl = document.getElementById('admin-count');
    const moderatorEl = document.getElementById('moderator-count');
    const userEl = document.getElementById('user-count');
    
    if (totalEl) totalEl.textContent = totalUsers;
    if (adminEl) adminEl.textContent = adminCount;
    if (moderatorEl) moderatorEl.textContent = moderatorCount;
    if (userEl) userEl.textContent = userCount;
}

// Inicializar filtros de usuarios
function initUsersFilters() {
    const searchInput = document.getElementById('users-search');
    const roleFilter = document.getElementById('role-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }
    
    if (roleFilter) {
        roleFilter.addEventListener('change', filterUsers);
    }
}

// Filtrar usuarios
function filterUsers() {
    const searchTerm = document.getElementById('users-search')?.value.toLowerCase() || '';
    const selectedRole = document.getElementById('role-filter')?.value || '';
    const userCards = document.querySelectorAll('.user-card');
    
    userCards.forEach(card => {
        const userInfo = card.querySelector('.user-info');
        const userName = userInfo?.querySelector('.user-name')?.textContent.toLowerCase() || '';
        const userEmail = userInfo?.querySelector('.user-email')?.textContent.toLowerCase() || '';
        const userRole = card.getAttribute('data-role') || '';
        
        const matchesSearch = !searchTerm || 
            userName.includes(searchTerm) || 
            userEmail.includes(searchTerm) || 
            userRole.includes(searchTerm);
        
        const matchesRole = !selectedRole || userRole === selectedRole;
        
        if (matchesSearch && matchesRole) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Función para inicializar la página cuando Firebase esté listo
function initPage() {
    const path = window.location.pathname;
    
    // Rutas públicas (no requieren autenticación)
    if (path === '/' || path === '/login') {
        initLoginForm();
    } else if (path === '/register') {
        initRegisterForm();
    }
    // Rutas protegidas (requieren autenticación)
    else if (path === '/dashboard') {
        initDashboard();
    } else if (path === '/profile') {
        initProfile();
    } else if (path === '/documents') {
        initDocuments();
    } else if (path === '/users') {
        initUsers();
    }
}

// Inicializar cuando Firebase esté listo
function waitForFirebaseAndInit() {
    if (window.firebaseAuth && auth) {
        // Firebase está listo, inicializar página
        initPage();
    } else {
        // Esperar un poco más
        setTimeout(waitForFirebaseAndInit, 100);
    }
}

// Inicializar cuando la página esté cargada
window.addEventListener('load', () => {
    // Esperar a que Firebase se inicialice
    waitForFirebaseAndInit();
    
    // También inicializar rutas públicas inmediatamente
    const path = window.location.pathname;
    if (path === '/' || path === '/login' || path === '/register') {
        initLoginForm();
        initRegisterForm();
    }
});

