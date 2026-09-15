const Auth = (function () {
    const API_URL = '/api';
    const TOKEN_KEY = 'cosmoslib_token';
    const REFRESH_TOKEN_KEY = 'cosmoslib_refresh_token';
    const CURRENT_USER_KEY = 'cosmoslib_current_user';

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setToken(token) {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    }

    function getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    function setRefreshToken(token) {
        if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
        else localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    function getCurrentUser() {
        const data = localStorage.getItem(CURRENT_USER_KEY);
        return data ? JSON.parse(data) : null;
    }

    function setCurrentUser(user) {
        if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        else localStorage.removeItem(CURRENT_USER_KEY);
    }

    function isLoggedIn() {
        return getToken() !== null && getCurrentUser() !== null;
    }

    function isAdmin() {
        const user = getCurrentUser();
        return user && user.role === 'admin';
    }

    async function login(email, password) {
        try {
            const res = await fetch(`${API_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setToken(data.token);
                if (data.refresh) setRefreshToken(data.refresh);
                setCurrentUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: data.message || 'Login failed' };
        } catch (err) {
            return { success: false, message: 'Server error' };
        }
    }

    async function register(username, email, password, role) {
        try {
            const res = await fetch(`${API_URL}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setToken(data.token);
                if (data.refresh) setRefreshToken(data.refresh);
                setCurrentUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: data.message || 'Registration failed' };
        } catch (err) {
            return { success: false, message: 'Server error' };
        }
    }

    function logout() {
        setToken(null);
        setRefreshToken(null);
        setCurrentUser(null);
        window.location.href = '/';
    }

    async function updateCurrentUser(updates) {
        try {
            const res = await apiFetch('/users/me/', {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updatedUser = await res.json();
                setCurrentUser(updatedUser);
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    }

    function requireAuth() {
        if (!isLoggedIn()) {
            window.location.href = '/login/#login';
            return false;
        }
        return true;
    }

    function requireAdmin() {
        if (!isLoggedIn()) {
            window.location.href = '/login/#login';
            return false;
        }
        if (!isAdmin()) {
            alert('Access denied. Admin privileges required.');
            window.location.href = '/books/';
            return false;
        }
        return true;
    }

    function getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    function renderNavRight(containerSelector) {
        const container = document.querySelector(containerSelector || '.topbar-right');
        if (!container) return;

        const user = getCurrentUser();

        if (!user) {
            container.innerHTML = `
                <div class="nav-auth-buttons">
                    <a href="/login/#login" class="nav-login-btn">Login</a>
                    <a href="/login/#register" class="btn-primary nav-signup-btn">Sign Up</a>
                </div>
            `;
            return;
        }

        const initials = getInitials(user.username);
        const avatarHtml = user.avatar ? `<img src="${user.avatar}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : initials;
        const dashboardLink = user.role === 'admin'
            ? `<a href="/dashboard/" class="profile-menu-dashboard">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>
                    Dashboard
               </a>`
            : '';

        container.innerHTML = `
            <div class="profile-container">
                <div class="profile-trigger">
                    <div class="profile-avatar">${avatarHtml}</div>
                    <span class="profile-name">${user.username}</span>
                    <span class="nav-role-badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">${user.role}</span>
                    <svg class="profile-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div class="profile-menu">
                    ${dashboardLink}
                    <a href="/profile/">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        My Profile
                    </a>
                    <a href="#" class="logout" id="logout-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Logout
                    </a>
                </div>
            </div>
        `;

        setupProfileDropdown();
        setupLogoutButton();
    }

    function renderAdminNavLinks(containerSelector) {
        const container = document.querySelector(containerSelector || '.nav-links');
        if (!container) return;
        if (isAdmin()) {
            const existing = container.querySelector('.admin-dashboard-link');
            if (!existing) {
                const link = document.createElement('a');
                link.href = '/dashboard/';
                link.className = 'admin-dashboard-link';
                link.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg> Dashboard';
                container.appendChild(link);
            }
        }
    }

    function setupProfileDropdown() {
        const trigger = document.querySelector('.profile-trigger');
        const container = document.querySelector('.profile-container');
        if (trigger && container) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                container.classList.toggle('active');
            });
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    container.classList.remove('active');
                }
            });
        }
    }

    function setupLogoutButton() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }

    async function getUsers() {
        try {
            const res = await apiFetch('/users/');
            if (res.ok) return await res.json();
            return [];
        } catch(e) { return []; }
    }

    let refreshPromise = null;

    async function handleRefresh() {
        try {
            const refreshRes = await fetch(`${API_URL}/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: getRefreshToken() })
            });
            const refreshData = await refreshRes.json();
            
            if (refreshRes.ok && refreshData.access) {
                setToken(refreshData.access);
                if (refreshData.refresh) {
                    setRefreshToken(refreshData.refresh);
                }
                return refreshData.access;
            } else {
                logout();
                throw new Error('Refresh failed');
            }
        } finally {
            refreshPromise = null;
        }
    }

    async function apiFetch(endpoint, options = {}) {
        const getHeaders = () => {
            const headers = { 'Content-Type': 'application/json' };
            if (getToken()) headers['Authorization'] = `Bearer ${getToken()}`;
            return { ...headers, ...options.headers };
        };
        
        let res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: getHeaders()
        });

        if (res.status === 401 && getRefreshToken() && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
            if (!refreshPromise) {
                refreshPromise = handleRefresh();
            }
            try {
                await refreshPromise;
                return await fetch(`${API_URL}${endpoint}`, {
                    ...options,
                    headers: getHeaders()
                });
            } catch (e) {
                return res;
            }
        }
        
        return res;
    }

    return {
        API_URL,
        apiFetch,
        login,
        register,
        logout,
        getCurrentUser,
        isLoggedIn,
        isAdmin,
        requireAuth,
        requireAdmin,
        updateCurrentUser,
        renderNavRight,
        renderAdminNavLinks,
        setupProfileDropdown,
        setupLogoutButton,
        getInitials,
        getUsers
    };

})();
