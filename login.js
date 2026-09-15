function showForm(name) {
    const track = document.querySelector('.slider-track');

    if (name === 'login') {
        document.body.classList.remove('show-signup');
        if (track) track.style.transform = 'translateX(0)';
    } else {
        document.body.classList.add('show-signup');
        if (track) track.style.transform = 'translateX(-50%)';
    }

    const tabL = document.getElementById('tabLogin');
    const tabR = document.getElementById('tabRegister');

    if (tabL) tabL.classList.toggle('active', name === 'login');
    if (tabR) tabR.classList.toggle('active', name === 'register');

    clearAllErrors();
}

window.addEventListener('load', () => {

    const hash = window.location.hash;

    if (hash === '#register') {
        showForm('register');
    } else if (hash === '#login') {
        showForm('login');
    }

    if (Auth.isLoggedIn()) {

        if (Auth.isAdmin()) {
            window.location.href = '/dashboard/';
        } else {
            window.location.href = '/books/';
        }

        return;
    }

    setupLoginForm();
    setupRegisterForm();
    setupForgotPassword();
});

function showToast(message, type) {

    const container = document.getElementById('toast-container');

    if (!container) return;

    const toast = document.createElement('div');

    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2">

            ${type === 'success'
                ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
                : '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
            }

        </svg>

        ${message}
    `;

    container.appendChild(toast);

    setTimeout(() => {

        toast.classList.add('toast-out');

        setTimeout(() => toast.remove(), 300);

    }, 3000);
}

function setError(groupId, message) {

    const group = document.getElementById(groupId);

    const errorSpan = document.getElementById(
        groupId.replace('-group', '-error')
    );

    if (group) group.classList.add('error');

    if (errorSpan) errorSpan.textContent = message;
}

function clearError(groupId) {

    const group = document.getElementById(groupId);

    const errorSpan = document.getElementById(
        groupId.replace('-group', '-error')
    );

    if (group) group.classList.remove('error');

    if (errorSpan) errorSpan.textContent = '';
}

function clearAllErrors() {

    document
        .querySelectorAll('.form-group')
        .forEach(g => g.classList.remove('error'));

    document
        .querySelectorAll('.error-message')
        .forEach(s => s.textContent = '');
}

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setupLoginForm() {

    const loginBtn = document.getElementById('login-btn');

    if (!loginBtn) return;

    loginBtn.addEventListener('click', async (e) => {

        e.preventDefault();

        clearAllErrors();

        const email = document
            .getElementById('login-email')
            .value
            .trim();

        const password = document
            .getElementById('login-password')
            .value;

        let valid = true;

        if (!email) {

            setError(
                'login-email-group',
                'Email is required.'
            );

            valid = false;

        } else if (!isValidEmail(email)) {

            setError(
                'login-email-group',
                'Please enter a valid email.'
            );

            valid = false;
        }

        if (!password) {

            setError(
                'login-password-group',
                'Password is required.'
            );

            valid = false;
        }

        if (!valid) return;

        const result = await Auth.login(email, password);

        if (!result.success) {

            showToast(result.message, 'error');

            setError('login-email-group', '');

            setError(
                'login-password-group',
                result.message
            );

            return;
        }

        showToast(
            'Login successful! Redirecting...',
            'success'
        );

        setTimeout(() => {

            if (result.user.role === 'admin') {
                window.location.href = '/dashboard/';
            } else {
                window.location.href = '/books/';
            }

        }, 800);
    });

    document
        .getElementById('login-email')
        .addEventListener(
            'input',
            () => clearError('login-email-group')
        );

    document
        .getElementById('login-password')
        .addEventListener(
            'input',
            () => clearError('login-password-group')
        );
}

function setupRegisterForm() {

    const registerBtn = document.getElementById('register-btn');

    if (!registerBtn) return;

    registerBtn.addEventListener('click', async (e) => {

        e.preventDefault();

        clearAllErrors();

        const username = document
            .getElementById('reg-username')
            .value
            .trim();

        const email = document
            .getElementById('reg-email')
            .value
            .trim();

        const password = document
            .getElementById('reg-password')
            .value;

        const role = document
            .getElementById('reg-role')
            .value;

        let valid = true;

        if (!username) {

            setError(
                'reg-username-group',
                'Username is required.'
            );

            valid = false;

        } else if (username.length < 3) {

            setError(
                'reg-username-group',
                'Username must be at least 3 characters.'
            );

            valid = false;
        }

        if (!email) {

            setError(
                'reg-email-group',
                'Email is required.'
            );

            valid = false;

        } else if (!isValidEmail(email)) {

            setError(
                'reg-email-group',
                'Please enter a valid email.'
            );

            valid = false;
        }

        if (!password) {

            setError(
                'reg-password-group',
                'Password is required.'
            );

            valid = false;

        } else if (password.length < 6) {

            setError(
                'reg-password-group',
                'Password must be at least 6 characters.'
            );

            valid = false;
        }

        if (!role) {

            setError(
                'reg-role-group',
                'Please select a role.'
            );

            valid = false;
        }

        if (!valid) return;

        const result = await Auth.register(
            username,
            email,
            password,
            role
        );

        if (!result.success) {

            showToast(result.message, 'error');

            setError(
                'reg-email-group',
                result.message
            );

            return;
        }

        showToast(
            'Account created successfully!',
            'success'
        );

        setTimeout(() => {

            if (result.user.role === 'admin') {
                window.location.href = '/dashboard/';
            } else {
                window.location.href = '/books/';
            }

        }, 800);
    });

    document
        .getElementById('reg-username')
        .addEventListener(
            'input',
            () => clearError('reg-username-group')
        );

    document
        .getElementById('reg-email')
        .addEventListener(
            'input',
            () => clearError('reg-email-group')
        );

    document
        .getElementById('reg-password')
        .addEventListener(
            'input',
            () => clearError('reg-password-group')
        );

    document
        .getElementById('reg-role')
        .addEventListener(
            'change',
            () => clearError('reg-role-group')
        );
}

function setupForgotPassword() {

    const forgotBtn = document.getElementById(
        'forgot-password-btn'
    );

    if (!forgotBtn) return;

    forgotBtn.addEventListener('click', async (e) => {

        e.preventDefault();

        const email = document
            .getElementById('login-email')
            .value
            .trim();

        if (!email) {

            showToast(
                'Please enter your email first.',
                'error'
            );

            return;
        }

        try {

            const response = await fetch(
                '/api/auth/forgot-password/',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        email: email
                    })
                }
            );

            const data = await response.json();

            if (data.success) {

                showToast(
                    'Reset link sent successfully!',
                    'success'
                );

            } else {

                showToast(
                    data.message || 'Something went wrong.',
                    'error'
                );
            }

        } catch (error) {

            showToast(
                'Server error.',
                'error'
            );
        }
    });
}
