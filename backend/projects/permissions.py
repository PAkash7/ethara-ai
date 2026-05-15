from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Project, ProjectMember


class IsProjectAdmin(BasePermission):
    """Allow only project admins or the project owner to perform write actions."""

    def has_object_permission(self, request, view, obj):
        # Safe methods (GET, HEAD, OPTIONS) are allowed to any project member
        if request.method in SAFE_METHODS:
            return True

        # Determine the project from the object
        project = obj if isinstance(obj, Project) else obj.project

        # Owner always has full access
        if project.owner == request.user:
            return True

        # Check if user is an admin member
        return ProjectMember.objects.filter(
            project=project, user=request.user, role='admin'
        ).exists()
