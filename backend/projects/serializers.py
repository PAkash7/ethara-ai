from datetime import date
from rest_framework import serializers
from django.contrib.auth.models import User
from accounts.serializers import UserSerializer
from .models import Project, ProjectMember, CATEGORY_CHOICES, PROJECT_STATUS_CHOICES, PRIORITY_CHOICES


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model  = ProjectMember
        fields = ('id', 'user', 'role', 'joined_at')


class ProjectSerializer(serializers.ModelSerializer):
    owner       = UserSerializer(read_only=True)
    members     = ProjectMemberSerializer(many=True, read_only=True)
    task_count  = serializers.SerializerMethodField()
    done_count  = serializers.SerializerMethodField()
    is_overdue  = serializers.SerializerMethodField()
    tech_tags   = serializers.SerializerMethodField()

    class Meta:
        model  = Project
        fields = (
            'id', 'name', 'description', 'owner', 'members',
            'category', 'status', 'priority',
            'client_name', 'client_email', 'deadline', 'budget', 'tech_stack',
            'created_at', 'updated_at',
            'task_count', 'done_count', 'is_overdue', 'tech_tags',
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_done_count(self, obj):
        return obj.tasks.filter(status='done').count()

    def get_is_overdue(self, obj):
        if obj.deadline and obj.status not in ('completed', 'archived'):
            return obj.deadline < date.today()
        return False

    def get_tech_tags(self, obj):
        if not obj.tech_stack:
            return []
        return [t.strip() for t in obj.tech_stack.split(',') if t.strip()]


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Write serializer — accepts all editable fields."""
    class Meta:
        model  = Project
        fields = (
            'name', 'description',
            'category', 'status', 'priority',
            'client_name', 'client_email', 'deadline', 'budget', 'tech_stack',
        )


class AddMemberSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role    = serializers.ChoiceField(choices=['admin', 'member'], default='member')

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError('User with this ID does not exist.')
        return value
