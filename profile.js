document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth !== 'undefined' && !Auth.requireAuth()) return;

    loadProfileData();
    setupForm();
    loadMyBooks();

    if (typeof Auth !== 'undefined') {
        Auth.renderNavRight('.topbar-right');
        Auth.renderAdminNavLinks('.nav-links');
    }
});

async function loadProfileData() {
    try {
        const res = await Auth.apiFetch('/users/me/');
        if (res.ok) {
            const user = await res.json();
            Auth.updateCurrentUser(user);
        }
    } catch(e) {}

    const user = Auth.getCurrentUser();
    if (!user) return;

    window.currentAvatarBase64 = user.avatar || null;

    if (user.avatar) {
        document.getElementById('main-avatar').innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
        const initials = Auth.getInitials(user.username);
        document.getElementById('main-avatar').textContent = initials;
    }

    document.getElementById('stat-joined').textContent = user.joined || '2026';
    document.getElementById('stat-points').textContent = user.points || 0;

    document.getElementById('fullName').value = user.username || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('bio').value = user.bio || '';

    const badgeContainer = document.getElementById('profile-role-badge');
    if (badgeContainer) {
        const badgeClass = user.role === 'admin' ? 'badge-admin' : 'badge-user';
        badgeContainer.innerHTML = `<span class="nav-role-badge ${badgeClass}" style="font-size:12px; padding:4px 14px;">${user.role.toUpperCase()}</span>`;
    }
}

async function loadMyBooks() {
    try {
        const res = await Auth.apiFetch('/users/me/books/');
        if (res.ok) {
            const ownedBooks = await res.json();
            document.getElementById('stat-borrowed').textContent = ownedBooks.length;
            renderMyBooks(ownedBooks);
        }
    } catch(e) {
        console.error("Failed to load user books", e);
    }
}

function renderMyBooks(ownedBooks) {
    const container = document.getElementById('my-books-container');
    if (!container) return;
    container.innerHTML = '';

    if (ownedBooks.length === 0) {
        container.innerHTML = '<p style="color:#64748b; grid-column: 1 / -1;">You have not added any books to your library yet.</p>';
        return;
    }

    ownedBooks.forEach(item => {
        const book = item.book;
        const card = document.createElement('div');
        card.style.background = 'rgba(30, 41, 59, 0.7)';
        card.style.borderRadius = '10px';
        card.style.padding = '10px';
        card.style.cursor = 'pointer';
        card.style.border = '1px solid rgba(255, 255, 255, 0.1)';

        const coverHtml = book.image
            ? `<img src="${book.image}" style="width:100%; height:180px; object-fit:cover; border-radius:6px; margin-bottom:10px;">`
            : `<div style="width:100%; height:180px; background:#334155; border-radius:6px; margin-bottom:10px; display:flex; align-items:center; justify-content:center;"><svg width="30" height="30" stroke="#94A3B8" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;

        card.innerHTML = `
            ${coverHtml}
            <h4 style="font-size: 14px; margin-bottom: 5px; color: white;">${book.title}</h4>
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 5px;">${book.author}</p>
            <p style="font-size: 10px; color: #cbd5e1;">Added: ${new Date(item.date_acquired).toLocaleDateString()}</p>
        `;

        card.addEventListener('click', () => {
            window.location.href = `/book-details/?id=${book.id}`;
        });

        container.appendChild(card);
    });
}

function setupForm() {
    const form = document.getElementById('profile-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        await saveProfileData();

        const btn = document.querySelector('.btn-save');
        const originalText = btn.textContent;
        btn.textContent = 'Saved!';
        btn.style.background = '#4ade80';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    });

    const avatarBtn = document.getElementById('btn-change-avatar');
    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarBtn && avatarUpload) {
        avatarBtn.addEventListener('click', () => avatarUpload.click());
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    window.currentAvatarBase64 = event.target.result;
                    document.getElementById('main-avatar').innerHTML = `<img src="${window.currentAvatarBase64}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

async function saveProfileData() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const bio = document.getElementById('bio').value;
    const newPassword = document.getElementById('newPassword').value;

    const updates = {
        username: fullName,
        email: email,
        bio: bio
    };

    if (window.currentAvatarBase64) {
        updates.avatar = window.currentAvatarBase64;
    }

    if (newPassword && newPassword.length >= 6) {
        updates.password = newPassword;
    }

    const success = await Auth.updateCurrentUser(updates);

    if (success) {
        loadProfileData();
    }
}
