from django.shortcuts import render

def index(request):
    return render(request, 'index.html')

def login_page(request):
    return render(request, 'login.html')

def dashboard(request):
    return render(request, 'Dashboard.html')

def books(request):
    return render(request, 'books.html')

def book_details(request, book_id=None):
    return render(request, 'book-details.html')

def profile(request):
    return render(request, 'profile.html')

def manage_books(request):
    return render(request, 'manage-books.html')

def add_book(request):
    return render(request, 'Add_book.html')

def edit_book(request, book_id=None):
    return render(request, 'Edit_book.html')

def manage_users(request):
    return render(request, 'manage-users.html')

def search(request):
    return render(request, 'search.html')

def forgot_password(request):
    return render(request, 'forgot-password.html')

def reset_password(request, uidb64, token):
    return render(request, 'reset-password.html', {'uidb64': uidb64, 'token': token})
