from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import authenticate
from django.conf import settings
from .models import User, Book, UserBook

class UserSerializer(serializers.ModelSerializer):
    joined = serializers.SerializerMethodField()
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all())]
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'joined', 'bio', 'points', 'avatar')
        read_only_fields = ('joined', 'points', 'role')

    def get_joined(self, obj):
        return obj.date_joined.strftime('%b %d, %Y')

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        
        def format_static_url(url_val):
            if not url_val:
                return url_val
            if url_val.startswith('http://') or url_val.startswith('https://') or url_val.startswith('data:'):
                return url_val
            if url_val.startswith('assets/') or url_val.startswith('p'):
                return f"{settings.STATIC_URL.rstrip('/')}/{url_val}"
            return url_val

        ret['image'] = format_static_url(ret.get('image'))
        ret['background'] = format_static_url(ret.get('background'))
        ret['pdf'] = format_static_url(ret.get('pdf'))
                
        return ret

class UserBookSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    
    class Meta:
        model = UserBook
        fields = ('id', 'book', 'date_acquired')

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all())]
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'user')
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = User.objects.get(email=data.get('email'))
            username = user.username
        except User.DoesNotExist:
            username = None

        if username and data.get('password'):
            user = authenticate(username=username, password=data.get('password'))
            if user:
                return user
        raise serializers.ValidationError("Invalid email or password.")
