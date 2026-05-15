from rest_framework import serializers
from django.contrib.auth.models import User
from accounts.serializers import UserSerializer
from projects.models import ProjectMember
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'project',
            'assigned_to', 'created_by',
            'status', 'priority', 'due_date',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')


class TaskCreateSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'project',
            'assigned_to', 'status', 'priority', 'due_date',
        )

    def validate(self, attrs):
        project = attrs.get('project')
        assigned_to = attrs.get('assigned_to')

        if assigned_to and project:
            is_owner = project.owner == assigned_to
            is_member = ProjectMember.objects.filter(
                project=project, user=assigned_to
            ).exists()
            if not is_owner and not is_member:
                raise serializers.ValidationError(
                    {'assigned_to': 'Assigned user is not a member of this project.'}
                )
        return attrs
