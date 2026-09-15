let params = new URLSearchParams(window.location.search);
let id = params.get("id");

async function loadBookDetails() {
    try {
        const res = await Auth.apiFetch(`/books/${id}/`);
        if (!res.ok) {
            document.querySelector(".container").innerHTML = "<h1 style='color:white;text-align:center;grid-column: 1 / -1;padding: 50px;'>Book not found.</h1>";
            return;
        }
        const book = await res.json();
        renderBook(book);
    } catch (e) {
        document.querySelector(".container").innerHTML = "<h1 style='color:white;text-align:center;grid-column: 1 / -1;padding: 50px;'>Error loading book details.</h1>";
    }
}

function renderBook(book) {
    document.getElementById("title").innerHTML = book.title || "Unknown Title";
    document.getElementById("author").innerHTML = book.author || "Unknown Author";
    document.getElementById("year").innerHTML = book.year || "N/A";
    document.getElementById("category").innerHTML = book.category || "General";
    document.getElementById("pages").innerHTML = book.pages || "N/A";
    document.getElementById("language").innerHTML = book.language || "English";
    document.getElementById("price").innerHTML = book.price ? book.price + " EGP" : "Free";
    document.getElementById("status").innerHTML = book.status || "Available";
    document.getElementById("description").innerHTML = book.description || "No description available for this book.";

    if (book.image) {
        document.getElementById("image").src = book.image;
        document.getElementById("image").style.objectFit = "cover";
        document.getElementById("image").style.borderRadius = "10px";
    } else {
        document.getElementById("image").style.display = "none";
        const placeholder = document.createElement("div");
        placeholder.innerHTML = `<div style="width: 300px; height: 420px; border-radius: 10px; background:#334155; display:flex; align-items:center; justify-content:center; margin-bottom: 20px;"><svg width="60" height="60" viewBox="0 0 24 24" stroke="#94A3B8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;
        document.getElementById("image").parentNode.insertBefore(placeholder, document.getElementById("image"));
    }

    const categoryBackgrounds = {
        'romantic': '/static/assets/books/backgrounds/romantic.jpg',
        'historic': '/static/assets/books/backgrounds/historc1.jpg',
        'programming': '/static/assets/books/backgrounds/programming.jpg',
        'religious': '/static/assets/books/backgrounds/religion.jpg'
    };

    let bgCategory = (book.category || 'general').toLowerCase();

    let defaultCategoryBg = categoryBackgrounds[bgCategory] || "/static/assets/banner/BackgrounSpace.png";
    let targetBg = book.background || defaultCategoryBg;

    document.body.style.backgroundImage = `url('${targetBg}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";

    let btn = document.getElementById("bookBtn");
    
    if (book.status !== "Available") {
        btn.disabled = true;
        btn.innerText = "Currently Unavailable";
    } else {
        btn.disabled = false;
        btn.innerText = "Borrow / Add to My Library";
    }

    let message = document.getElementById("message");

    // Check if user already owns this book
    async function checkOwnership() {
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
            try {
                const res = await Auth.apiFetch('/users/me/books/');
                if (res.ok) {
                    const ownedBooks = await res.json();
                    const isOwned = ownedBooks.some(ub => ub.book.id === book.id);
                    if (isOwned) {
                        if (book.pdf) {
                            btn.innerText = "Download PDF";
                            btn.style.backgroundColor = "#ef4444"; // Premium Red
                            btn.style.color = "white";
                            btn.disabled = false;
                            btn.onclick = () => {
                                if (book.pdf.startsWith('data:')) {
                                    const link = document.createElement('a');
                                    link.href = book.pdf;
                                    link.download = `${book.title || 'book'}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                } else {
                                    window.open(book.pdf, '_blank');
                                }
                            };
                        } else {
                            btn.disabled = true;
                            btn.innerText = "Borrowed (No PDF Available)";
                            btn.style.backgroundColor = "#475569";
                        }
                        return true;
                    }
                }
            } catch (e) { console.error("Error checking ownership", e); }
        }
        return false;
    }

    checkOwnership().then(isOwned => {
        if (!isOwned) {
            btn.onclick = async function () {
                if (typeof Auth !== 'undefined' && !Auth.isLoggedIn()) {
                    message.innerHTML = "You must be logged in to borrow a book.";
                    message.style.color = "red";
                    setTimeout(() => {
                        window.location.href = '/login/#login';
                    }, 1500);
                    return;
                }

                try {
                    const res = await Auth.apiFetch('/users/me/books/', {
                        method: 'POST',
                        body: JSON.stringify({ book_id: book.id })
                    });
                    const data = await res.json();
                    
                    if (res.ok && data.success) {
                        message.innerHTML = "Book added to your library successfully!";
                        message.style.color = "green";
                        // Re-render button
                        checkOwnership();
                    } else {
                        message.innerHTML = data.message || "Failed to borrow book.";
                        message.style.color = "red";
                    }
                } catch (e) {
                    message.innerHTML = "Error adding to library.";
                    message.style.color = "red";
                }
            };
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth !== 'undefined') {
        Auth.renderNavRight('.topbar-right');
        Auth.renderAdminNavLinks('.nav-links');
    }
    if (id) {
        loadBookDetails();
        
        setInterval(async () => {
            try {
                const res = await Auth.apiFetch(`/books/${id}/`);
                if (res.ok) {
                    const book = await res.json();
                    document.getElementById("status").innerHTML = book.status || "Available";
                    
                    const btn = document.getElementById("bookBtn");
                    if (book.status !== "Available") {
                        btn.disabled = true;
                        btn.innerText = "Currently Unavailable";
                    } else if (btn.disabled) {
                        btn.disabled = false;
                        btn.innerText = "Borrow / Add to My Library";
                        document.getElementById("message").innerHTML = "";
                    }
                }
            } catch(e) {}
        }, 5000);
    }
});
