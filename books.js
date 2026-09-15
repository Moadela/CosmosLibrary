let currentCategory = "all";
const searchInput = document.getElementById("search");
const buttons = document.querySelectorAll(".filters button");

if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
}

async function loadBooks() {
    try {
        const res = await Auth.apiFetch('/books/');
        if (res.ok) {
            const books = await res.json();
            displayBooks(books);
        }
    } catch (e) {
        console.error("Failed to load books", e);
    }
}

function displayBooks(books) {
  const container = document.getElementById("booksContainer");
  if (!container) return;
  container.innerHTML = '';

  if (books.length === 0) {
      container.innerHTML = '<p style="color:white;text-align:center;width:100%;">No books found in the library.</p>';
      return;
  }

  books.forEach(book => {
    const card = document.createElement("div");
    card.className = `book-card ${book.category ? book.category.toLowerCase() : 'general'}`;
    card.dataset.id = book.id;

    const coverHtml = book.image
      ? `<img src="${book.image}">`
      : `<div style="width: 250px; height: 220px; border-radius: 10px; background:#334155; display:flex; align-items:center; justify-content:center; margin-bottom: 10px;"><svg width="40" height="40" viewBox="0 0 24 24" stroke="#94A3B8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;

    card.innerHTML = `
      ${coverHtml}
      <span class="category">${book.category}</span>
      <h3>${book.title}</h3>
      <p>by ${book.author}</p>
      <span class="${book.status === "Available" ? "available" : "not-available"}">${book.status}</span>
    `;

    card.addEventListener("click", function () {
        window.location.href = `/book-details/?id=${book.id}`;
    });

    container.appendChild(card);
  });
}

function filterBooks(category) {
  currentCategory = category;

  buttons.forEach(btn => btn.classList.remove("active"));
  if (event && event.target) {
      event.target.classList.add("active");
  }

  const body = document.getElementById("body");
  if (body) {
      body.className = "";
      if (category === "romantic") body.classList.add("romantic-bg");
      else if (category === "historic") body.classList.add("historic-bg");
      else if (category === "programming") body.classList.add("programming-bg");
      else if (category === "religious") body.classList.add("religion-bg");
      else body.classList.add("default");
  }

  applyFilters();
}

function applyFilters() {
  if (!searchInput) return;
  const value = searchInput.value.toLowerCase();
  const books = document.querySelectorAll(".book-card");

  books.forEach(book => {
    const title = book.querySelector("h3").innerText.toLowerCase();
    const author = book.querySelector("p").innerText.toLowerCase();

    const matchesSearch = title.includes(value) || author.includes(value);
    const matchesCategory = currentCategory === "all" || book.classList.contains(currentCategory);

    if (matchesSearch && matchesCategory) {
      book.style.display = "block";
    } else {
      book.style.display = "none";
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Auth !== 'undefined') {
    Auth.renderNavRight('.topbar-right');
    Auth.renderAdminNavLinks('.nav-links');
  }
  loadBooks();

  setInterval(async () => {
    try {
        const res = await Auth.apiFetch('/books/');
        if (res.ok) {
            const books = await res.json();
            books.forEach(book => {
                const card = document.querySelector(`.book-card[data-id="${book.id}"]`);
                if (card) {
                    const statusSpan = card.querySelector("span:last-child");
                    if (statusSpan) {
                        const newClass = book.status === "Available" ? "available" : "not-available";
                        if (statusSpan.className !== newClass) {
                            statusSpan.className = newClass;
                            statusSpan.innerText = book.status;
                        }
                    }
                }
            });
        }
    } catch(e) {}
  }, 5000);
});