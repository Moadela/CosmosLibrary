from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny,
    IsAdminUser
)

from django.contrib.auth import logout
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode
)
from django.utils.encoding import force_bytes, force_str

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Book, UserBook

from .serializers import (
    UserSerializer,
    BookSerializer,
    UserBookSerializer,
    RegisterSerializer,
    LoginSerializer
)


def _flatten_errors(errors):
    """Flatten DRF nested error dicts into a single readable string."""
    messages = []

    for field, errs in errors.items():

        if isinstance(errs, list):
            messages.append(
                f"{field}: {' '.join(str(e) for e in errs)}"
            )

        else:
            messages.append(f"{field}: {errs}")

    return ' | '.join(messages)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):

    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():

        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'token': str(refresh.access_token),
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    return Response({
        'success': False,
        'message': _flatten_errors(serializer.errors)
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):

    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():

        user = serializer.validated_data

        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'token': str(refresh.access_token),
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })

    return Response({
        'success': False,
        'message': 'Invalid email or password.'
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def logout_view(request):

    logout(request)

    return Response({
        'success': True
    })


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def current_user_view(request):

    if request.method == 'GET':

        return Response(
            UserSerializer(request.user).data
        )

    elif request.method == 'PUT':

        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class UserViewSet(viewsets.ModelViewSet):

    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):

        if (
            self.request.user.is_authenticated and
            self.request.user.role == 'admin'
        ):
            return [IsAuthenticated()]

        return [IsAuthenticated()]


class BookViewSet(viewsets.ModelViewSet):

    queryset = Book.objects.all()
    serializer_class = BookSerializer

    def get_permissions(self):

        if self.action in ['list', 'retrieve']:
            return [AllowAny()]

        return [IsAuthenticated(), IsAdminUser()]


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_books_view(request):

    if request.method == 'GET':

        owned = UserBook.objects.filter(
            user=request.user
        )

        return Response(
            UserBookSerializer(
                owned,
                many=True
            ).data
        )

    elif request.method == 'POST':

        book_id = request.data.get('book_id')

        try:

            book = Book.objects.get(id=book_id)

            if not UserBook.objects.filter(
                user=request.user,
                book=book
            ).exists():

                ub = UserBook.objects.create(
                    user=request.user,
                    book=book
                )

                return Response({
                    'success': True,
                    'data': UserBookSerializer(ub).data
                }, status=status.HTTP_201_CREATED)

            return Response({
                'success': False,
                'message': 'Book already owned'
            }, status=status.HTTP_400_BAD_REQUEST)

        except Book.DoesNotExist:

            return Response({
                'success': False,
                'message': 'Book not found'
            }, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_user_book_view(request, book_id):

    try:

        ub = UserBook.objects.get(
            user=request.user,
            book_id=book_id
        )

        ub.delete()

        return Response({
            'success': True
        }, status=status.HTTP_204_NO_CONTENT)

    except UserBook.DoesNotExist:

        return Response({
            'success': False,
            'message': 'Not owned'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):

    email = request.data.get('email')

    try:

        user = User.objects.get(email=email)

        token_generator = PasswordResetTokenGenerator()

        uid = urlsafe_base64_encode(
            force_bytes(user.pk)
        )

        token = token_generator.make_token(user)

        reset_url = f"/reset-password/{uid}/{token}/"
        reset_link = request.build_absolute_uri(reset_url)

        print("\n" + "!"*60)
        print("PASSWORD RESET LINK (COPY ENTIRE LINE):")
        print(reset_link)
        print("!"*60 + "\n")

        send_mail(
            subject='Password Reset',
            message=(
                f'Use this link to reset your password:\n'
                f'{reset_link}'
            ),
            from_email='noreply@cosmoslibrary.com',
            recipient_list=[email],
        )

        return Response({
            'success': True,
            'message': 'Reset link sent successfully.'
        })

    except User.DoesNotExist:

        return Response({
            'success': False,
            'message': 'User not found.'
        }, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request, uidb64, token):
    uidb64 = uidb64.strip()
    token = token.strip('= \n\r')

    try:

        uid = force_str(
            urlsafe_base64_decode(uidb64)
        )
        print(f"DEBUG: Decoding uidb64={uidb64} -> uid={uid}")

        user = User.objects.get(pk=uid)
        print(f"DEBUG: Found user={user.email} (pk={user.pk})")

        token_generator = PasswordResetTokenGenerator()
        is_valid = token_generator.check_token(user, token)
        print(f"DEBUG: Token check for {token}: {is_valid}")

        if not is_valid:

            return Response({
                'success': False,
                'message': 'Invalid or expired token.'
            }, status=400)

        new_password = request.data.get('password')

        user.password = make_password(new_password)

        user.save()

        return Response({
            'success': True,
            'message': 'Password reset successfully.'
        })

    except Exception:

        return Response({
            'success': False,
            'message': 'Something went wrong.'
        }, status=400)
