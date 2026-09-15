from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'books', views.BookViewSet)

urlpatterns = [
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/forgot-password/', views.forgot_password_view, name='forgot-password'),
    path('auth/reset-password/<str:uidb64>/<str:token>/', views.reset_password_view, name='reset-password'),
    path('users/me/', views.current_user_view, name='current-user'),
    path('users/me/books/', views.user_books_view, name='user-books'),
    path('users/me/books/<int:book_id>/', views.remove_user_book_view, name='remove-user-book'),
    path('', include(router.urls)),
]
