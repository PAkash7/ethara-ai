from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project, ProjectMember, CATEGORY_CHOICES, PROJECT_STATUS_CHOICES
from .serializers import (
    ProjectSerializer, ProjectCreateSerializer,
    ProjectMemberSerializer, AddMemberSerializer
)
from .permissions import IsProjectAdmin


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.filter(
            Q(owner=user) | Q(members__user=user)
        ).distinct()

        # ── Filters ──────────────────────────────────────────────
        params = self.request.query_params
        category = params.get('category')
        if category:
            qs = qs.filter(category=category)

        proj_status = params.get('status')
        if proj_status:
            qs = qs.filter(status=proj_status)

        return qs

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ProjectCreateSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        ProjectMember.objects.create(project=project, user=self.request.user, role='admin')

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsProjectAdmin()]
        return [IsAuthenticated()]

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    # ─── Extra Actions ────────────────────────────────────────────────────────

    @action(detail=True, methods=['get'], url_path='members')
    def list_members(self, request, pk=None):
        project = self.get_object()
        members = ProjectMember.objects.filter(project=project)
        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='add_member')
    def add_member(self, request, pk=None):
        project = self.get_object()

        # Only admin can add members
        is_owner = project.owner == request.user
        is_admin = ProjectMember.objects.filter(
            project=project, user=request.user, role='admin'
        ).exists()
        if not is_owner and not is_admin:
            return Response(
                {'detail': 'Only project admins can add members.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['user_id']
        role = serializer.validated_data['role']
        user = User.objects.get(id=user_id)

        member, created = ProjectMember.objects.get_or_create(
            project=project, user=user,
            defaults={'role': role}
        )
        if not created:
            member.role = role
            member.save()

        return Response(
            ProjectMemberSerializer(member).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=True, methods=['delete'], url_path=r'remove_member/(?P<user_id>\d+)')
    def remove_member(self, request, pk=None, user_id=None):
        project = self.get_object()

        is_owner = project.owner == request.user
        is_admin = ProjectMember.objects.filter(
            project=project, user=request.user, role='admin'
        ).exists()
        if not is_owner and not is_admin:
            return Response(
                {'detail': 'Only project admins can remove members.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            member = ProjectMember.objects.get(project=project, user_id=user_id)
        except ProjectMember.DoesNotExist:
            return Response(
                {'detail': 'Member not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent removing the owner
        if member.user == project.owner:
            return Response(
                {'detail': 'Cannot remove the project owner.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
