
document.addEventListener("DOMContentLoaded", () => {
    if (typeof Auth !== 'undefined' && !Auth.requireAdmin()) return;

    console.log("Dashboard JS loaded.");

    updateStats();
    loadAllBooks();
    loadUsers();

    if (typeof Auth !== 'undefined') {
        Auth.renderNavRight('.topbar-right');

        const user = Auth.getCurrentUser();
        if (user) {
            const navName = document.querySelector('.profile-name');
            const navAvatar = document.querySelector('.profile-avatar');
            if (navName) navName.textContent = user.username;
            if (navAvatar) {
                if (user.avatar) {
                    navAvatar.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                } else {
                    navAvatar.textContent = Auth.getInitials(user.username);
                }
            }
        }
    }
});

async function updateStats() {
    try {
        const booksRes = await Auth.apiFetch('/books/');
        let books = [];
        if (booksRes.ok) {
            books = await booksRes.json();
        }

        const total = books.length;
        const available = books.filter(b => b.status.toLowerCase() === "available").length;
        const borrowed = total - available;

        const elTotal = document.getElementById("stat-total-books");
        const elAvail = document.getElementById("stat-available-books");
        const elBorrow = document.getElementById("stat-borrowed-books");

        if (elTotal) elTotal.textContent = total;
        if (elAvail) elAvail.textContent = available;
        if (elBorrow) elBorrow.textContent = borrowed;

        const elUsers = document.getElementById("stat-total-users");
        if (elUsers && typeof Auth !== 'undefined') {
            const users = await Auth.getUsers();
            elUsers.textContent = users.length || 0;
        }
    } catch(e) {
        console.error("Error updating stats", e);
    }
}

async function loadAllBooks() {
    const tbody = document.querySelector("#all-books-table tbody");
    const recentTbody = document.querySelector("#recent-books-table tbody");
    
    if (!tbody && !recentTbody) return;

    try {
        const booksRes = await Auth.apiFetch('/books/');
        if (!booksRes.ok) return;
        const books = await booksRes.json();

        if (tbody) {
            tbody.innerHTML = "";
            if (books.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">No books found in the library.</td></tr>';
            } else {
                books.forEach(book => {
                    tbody.appendChild(createBookRow(book));
                });
            }
        }

        if (recentTbody) {
            recentTbody.innerHTML = "";
            [...books].reverse().slice(0, 4).forEach(book => {
                recentTbody.appendChild(createBookRow(book, true));
            });
        }

    } catch(e) {
        console.error("Error loading books", e);
    }
}

async function loadUsers() {
    const tbody = document.getElementById("users-tbody");
    if (!tbody) return;

    try {
        const users = await Auth.getUsers();
        tbody.innerHTML = "";

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement("tr");
            const initials = Auth.getInitials(user.username);
            const avatarHtml = user.avatar 
                ? `<img src="${user.avatar}" style="width:30px; height:30px; object-fit:cover; border-radius:50%;">`
                : `<div style="width:30px; height:30px; border-radius:50%; background:#334155; display:flex; align-items:center; justify-content:center; font-size:10px;">${initials}</div>`;

            tr.innerHTML = `
                <td>#${user.id}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${avatarHtml}
                        <strong>${user.username}</strong>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="nav-role-badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">${user.role}</span></td>
                <td>${user.joined || 'N/A'}</td>
                <td class="action-btns">
                    <button class="delete" title="Delete User" onclick="deleteUser(${user.id})" ${user.role === 'admin' ? 'disabled' : ''}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error loading users", e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">Error loading users.</td></tr>';
    }
}

window.deleteUser = async function(id) {
    if (confirm("Are you sure you want to delete this user?")) {
        try {
            const res = await Auth.apiFetch(`/users/${id}/`, { method: 'DELETE' });
            if (res.ok) {
                loadUsers();
                updateStats();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete user.");
            }
        } catch(e) {
            console.error("Error deleting user", e);
        }
    }
}

function createBookRow(book, isRecent = false) {
    const badgeClass = book.status.toLowerCase() === "available" ? "badge-available" : "badge-borrowed";
    const coverHtml = book.image
        ? `<img src="${book.image}" style="width:40px; height:50px; object-fit:cover; border-radius:4px;">`
        : `<div style="width:40px; height:50px; border-radius:4px; background:#334155; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" stroke="#94A3B8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;

    const tr = document.createElement("tr");
    
    let idCol = isRecent ? '' : `<td>#${book.id}</td>`;

    tr.innerHTML = `
        ${idCol}
        <td>
            <div style="display:flex; align-items:center; gap:10px;">
                ${coverHtml}
                <strong>${book.title}</strong>
            </div>
        </td>
        <td>${book.author}</td>
        <td>${book.category}</td>
        <td><span class="badge ${badgeClass}">${book.status}</span></td>
        <td class="action-btns">
            <a href="/edit-book/?id=${book.id}" class="edit" title="Edit Book">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </a>
            <button class="delete" title="Delete Book" onclick="deleteBook(${book.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </td>
    `;
    return tr;
}

window.deleteBook = async function (id) {
    if (confirm("Are you sure you want to delete this book?")) {
        try {
            const res = await Auth.apiFetch(`/books/${id}/`, { method: 'DELETE' });
            if (res.ok) {
                updateStats();
                loadAllBooks();
            } else {
                alert("Failed to delete book.");
            }
        } catch(e) {
            console.error("Error deleting book", e);
        }
    }
}
