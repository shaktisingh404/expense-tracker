import os
import urllib.parse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny 
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from .serializers import UserSerializer, LoginSerializer
from .models import ActiveTokens, User
from authlib.integrations.django_client import OAuth
from django.shortcuts import redirect
from django.urls import reverse
from django.conf import settings
from asgiref.sync import sync_to_async
from dotenv import load_dotenv
load_dotenv()


from category.models import Category
from django.contrib.auth import authenticate

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
OKTA_DOMAIN = os.getenv("OKTA_DOMAIN", "integrator-9568283.okta.com")
if not CLIENT_ID or not CLIENT_SECRET:
    raise ValueError("CLIENT_ID and CLIENT_SECRET must be set in environment variables")


oauth = OAuth()
oauth.register(
    name='okta',
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    server_metadata_url=f'https://{OKTA_DOMAIN}/oauth2/default/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid profile email',
    }
)

class UserCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Create a new user after validating the incoming data.
        """
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "User created successfully.",
                    "user": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {
                "status": "error",
                "message": "User creation failed.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class GetUpdateUserView(APIView):

    def get(self, request):
        """
        Get the authenticated user's details.
        """
        user = request.user
        if user.is_deleted:
            return Response(
                {"detail": "User is marked as deleted. Access denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        """
        Soft-delete the authenticated user and invalidate all their tokens.
        """
        user = request.user

        if user.is_deleted:
            return Response(
                {"detail": "User is already deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_staff:
            Category.objects.filter(user=user).update(user=None)
        # else:
        #     Category.objects.filter(user=user).update(is_deleted=True)

        TokenHandeling.invalidate_user_tokens(user)
        refresh_token = request.data.get("refresh_token")
        TokenHandeling.blacklist_refresh_token(refresh_token)

        user.is_deleted = True
        user.save()

        return Response(
            {"detail": "User deleted (soft-deleted) successfully."},
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        """
        Update user details after validating the password.
        """
        # Check if the password is provided in the request data
        password = request.data.get("password")
        if password:
            return Response(
                {"detail": "Do not Enter Password in this field "},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Authenticate user with the provided password
        user = request.user

        # Now proceed to update the user details
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "User details updated successfully.",
                    "user": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "status": "error",
                "message": "User update failed.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class UpdatePasswordUserView(APIView):
    def patch(self, request):
        current_password = request.data.get("password")
        new_password = request.data.get("new_password")

        if not current_password or not new_password:
            return Response(
                {"message": "Enter both fields"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not request.user.check_password(current_password):
            return Response(
                {"message": "wrong password"}, status=status.HTTP_400_BAD_REQUEST
            )

        if current_password == new_password:
            return Response(
                {"message": "New Password Can't same as old password"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(new_password)
        request.user.save()
        TokenHandeling.invalidate_user_tokens(request.user)
        return Response(
            {"detail": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )


class LoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Log in a user by validating credentials and generating JWT tokens.
        """
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            access_token = str(AccessToken.for_user(user))
            refresh_token = str(RefreshToken.for_user(user))

            ActiveTokens.objects.create(user=user, token=access_token)

            return Response(
                {
                    "status": "success",
                    "message": f"Login successful for {user.username}.",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "status": "error",
                "message": "Invalid credentials.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )



class LoginViewOkta(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # We use request._request because DRF wraps the standard Django request
        redirect_uri = request.build_absolute_uri(reverse('auth_callback'))
        print("REDIRECT URI --->", redirect_uri)
        return oauth.okta.authorize_redirect(request._request, redirect_uri)

class OktaCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            token = oauth.okta.authorize_access_token(request._request)
            user_info = token.get('userinfo')
            
            if not user_info:
                return Response({"error": "No user info"}, status=status.HTTP_400_BAD_REQUEST)

            email = user_info.get('email')
            
            # Mapping Okta info to your User model fields
            full_name = user_info.get('name', '').split(' ')
            f_name = full_name[0] if len(full_name) > 0 else ""
            l_name = full_name[1] if len(full_name) > 1 else ""

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': user_info.get('preferred_username', email),
                    'first_name': f_name,
                    'last_name': l_name,
                    'is_active': True
                }
            )

            access_token = str(AccessToken.for_user(user))
            refresh_token = str(RefreshToken.for_user(user))

            ActiveTokens.objects.create(user=user, token=access_token)

            # ---------------------------------------------------------
            # CHANGE IS HERE: REDIRECT TO FRONTEND INSTEAD OF RETURNING JSON
            # ---------------------------------------------------------
            
            # 1. Define your React frontend URL (The "Catcher" page)
            frontend_url = "http://localhost:5173/auth/callback"

            # 2. Encode tokens into the URL safely
            query_params = urllib.parse.urlencode({
                "access": access_token,
                "refresh": refresh_token
            })

            # 3. Redirect the browser to React
            response = redirect(f"{frontend_url}?{query_params}")
            return response
            
        except Exception as e:
            return Response({"error": f"Auth failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
class LogoutView(APIView):

    def post(self, request):
        """
        Log out the user.
        """
        try:
            access_token = request.headers.get("Authorization")

            access_token = access_token.split(" ")[1]

            TokenHandeling.invalidate_last_active_token(access_token)

            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response(
                    {"message": "Provide refresh token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            TokenHandeling.blacklist_refresh_token(refresh_token)
            return Response(
                {"message": "Logged out successfully."}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Error during logout: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class TokenHandeling:
    """
    TokenHandeling class for handling token-related operations.
    """

    @staticmethod
    def invalidate_user_tokens(user):
        """
        Invalidate all active tokens for a given user.
        """
        active_tokens = ActiveTokens.objects.filter(user=user)
        for token_obj in active_tokens:
            token_obj.delete()

    @staticmethod
    def invalidate_last_active_token(access_token):
        ActiveTokens.objects.filter(token=access_token).delete()

    @staticmethod
    def blacklist_refresh_token(refresh_token):
        """Blacklist a given refresh token."""
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as e:
            raise Exception(f"Error blacklisting refresh token: {str(e)}")

