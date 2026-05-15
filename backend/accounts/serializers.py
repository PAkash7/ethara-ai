from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, DESIGNATION_CHOICES


class RegisterSerializer(serializers.ModelSerializer):
    password    = serializers.CharField(write_only=True, min_length=8)
    password2   = serializers.CharField(write_only=True, label='Confirm Password')
    designation = serializers.ChoiceField(choices=DESIGNATION_CHOICES, required=False, allow_blank=True)

    class Meta:
        model  = User
        fields = ('username', 'email', 'password', 'password2', 'designation')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        designation = validated_data.pop('designation', '')
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        # Profile is auto-created by signal — just update designation
        if designation:
            user.profile.designation = designation
            user.profile.save(update_fields=['designation'])
        return user


class LoginSerializer(serializers.Serializer):
    """Informational only — actual auth done by simplejwt TokenObtainPairView."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ('designation', 'bio', 'phone', 'location', 'avatar_color')


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model  = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email',
                  'is_staff', 'is_superuser', 'date_joined', 'profile')
        read_only_fields = ('id', 'username', 'is_staff', 'is_superuser', 'date_joined')

    def to_representation(self, instance):
        # Ensure UserProfile always exists — safe for pre-signal users
        UserProfile.objects.get_or_create(user=instance)
        return super().to_representation(instance)

class UserUpdateSerializer(serializers.ModelSerializer):
    """Allows updating email, name + profile fields in one PATCH call."""
    # Profile fields — flat, no source nesting (avoids DRF nested source issues)
    designation  = serializers.CharField(required=False, allow_blank=True)
    bio          = serializers.CharField(required=False, allow_blank=True)
    phone        = serializers.CharField(required=False, allow_blank=True)
    location     = serializers.CharField(required=False, allow_blank=True)
    avatar_color = serializers.CharField(required=False)

    PROFILE_FIELDS = ('designation', 'bio', 'phone', 'location', 'avatar_color')

    class Meta:
        model  = User
        fields = ('email', 'first_name', 'last_name', 'designation', 'bio', 'phone', 'location', 'avatar_color')

    def update(self, instance, validated_data):
        # Split out profile fields
        profile_data = {}
        for field in self.PROFILE_FIELDS:
            if field in validated_data:
                profile_data[field] = validated_data.pop(field)

        # Update User model fields
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        # Update (or create) UserProfile — handles users created before the signal
        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for attr, val in profile_data.items():
                setattr(profile, attr, val)
            profile.save()

        return instance
