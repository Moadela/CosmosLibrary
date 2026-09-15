from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    bio = models.TextField(blank=True, null=True)
    points = models.IntegerField(default=0)
    avatar = models.TextField(blank=True, null=True)

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='Available')
    image = models.TextField(blank=True, null=True)
    year = models.IntegerField(null=True, blank=True)
    pages = models.IntegerField(null=True, blank=True)
    language = models.CharField(max_length=50, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    background = models.TextField(null=True, blank=True)
    pdf = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.title

class UserBook(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_books')
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    date_acquired = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book')
