from datetime import date

from django.db.models import Q, Count
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project, ProjectMember
from projects.permissions import IsProjectAdmin
from projects.serializers import ProjectSerializer
from accounts.serializers import UserSerializer
from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # ── Staff sees ALL tasks ──────────────────────────────────────────────
        if user.is_staff:
            qs = Task.objects.all().select_related(
                'assigned_to', 'created_by', 'project'
            )
        else:
            project_ids = ProjectMember.objects.filter(user=user).values_list(
                'project_id', flat=True
            )
            qs = Task.objects.filter(
                Q(project__owner=user) | Q(project_id__in=project_ids)
            ).distinct().select_related('assigned_to', 'created_by', 'project')

        # ── Filters ──────────────────────────────────────────────────────────
        params = self.request.query_params

        project_id = params.get('project')
        if project_id:
            qs = qs.filter(project_id=project_id)

        status_filter = params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        priority = params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)

        assigned_to = params.get('assigned_to')
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)

        overdue = params.get('overdue')
        if overdue and overdue.lower() == 'true':
            qs = qs.filter(
                due_date__lt=date.today(),
                status__in=['todo', 'in_progress']
            )

        return qs

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return TaskCreateSerializer
        return TaskSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAuthenticated(), IsProjectAdmin()]
        return [IsAuthenticated()]

    def get_object(self):
        obj = super().get_object()
        if self.action == 'destroy':
            self.check_object_permissions(self.request, obj)
        elif self.action in ('update', 'partial_update'):
            user = self.request.user
            # Staff can update anything
            if user.is_staff:
                return obj
            is_assigned = obj.assigned_to == user
            is_owner = obj.project.owner == user
            is_admin = ProjectMember.objects.filter(
                project=obj.project, user=user, role='admin'
            ).exists()
            if not (is_assigned or is_owner or is_admin):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    'You do not have permission to update this task.'
                )
        return obj

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ─────────────────────────────────────────────────────────────
# USER DASHBOARD
# ─────────────────────────────────────────────────────────────

class DashboardView(APIView):
    """
    GET /api/dashboard/
    Returns stats for the logged-in user across all their projects.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        project_ids = ProjectMember.objects.filter(user=user).values_list(
            'project_id', flat=True
        )

        tasks_qs = Task.objects.filter(
            Q(project__owner=user) | Q(project_id__in=project_ids)
        ).distinct()

        recent_tasks = tasks_qs.order_by('-created_at')[:5]

        return Response({
            'total_tasks':    tasks_qs.count(),
            'todo':           tasks_qs.filter(status='todo').count(),
            'in_progress':    tasks_qs.filter(status='in_progress').count(),
            'done':           tasks_qs.filter(status='done').count(),
            'overdue':        tasks_qs.filter(
                                  due_date__lt=date.today(),
                                  status__in=['todo', 'in_progress']
                              ).count(),
            'my_tasks':       tasks_qs.filter(assigned_to=user).count(),
            'total_projects': project_ids.count(),
            'recent_tasks':   TaskSerializer(recent_tasks, many=True).data,
        })


# ─────────────────────────────────────────────────────────────
# ADMIN-ONLY VIEWS  (is_staff=True required)
# ─────────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    """
    GET /api/admin/dashboard/
    System-wide stats. Staff only.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        all_tasks    = Task.objects.all()
        all_projects = Project.objects.all()
        all_users    = User.objects.filter(is_active=True)

        # Per-status breakdown
        status_breakdown = {
            'todo':        all_tasks.filter(status='todo').count(),
            'in_progress': all_tasks.filter(status='in_progress').count(),
            'done':        all_tasks.filter(status='done').count(),
        }

        # Top 5 most recent projects
        recent_projects = ProjectSerializer(
            all_projects.order_by('-created_at')[:5],
            many=True
        ).data

        # Recent tasks (system-wide)
        recent_tasks = TaskSerializer(
            all_tasks.order_by('-created_at')[:10],
            many=True
        ).data

        # Per-user task counts
        user_stats = []
        for u in all_users.order_by('username'):
            assigned = all_tasks.filter(assigned_to=u).count()
            overdue  = all_tasks.filter(
                assigned_to=u,
                due_date__lt=date.today(),
                status__in=['todo', 'in_progress']
            ).count()
            user_stats.append({
                'user':     UserSerializer(u).data,
                'assigned': assigned,
                'overdue':  overdue,
                'projects': ProjectMember.objects.filter(user=u).count(),
            })

        return Response({
            'total_users':    all_users.count(),
            'total_projects': all_projects.count(),
            'total_tasks':    all_tasks.count(),
            'status_breakdown': status_breakdown,
            'overdue_total':  all_tasks.filter(
                                  due_date__lt=date.today(),
                                  status__in=['todo', 'in_progress']
                              ).count(),
            'recent_projects': recent_projects,
            'recent_tasks':    recent_tasks,
            'user_stats':      user_stats,
        })


class AdminUsersView(APIView):
    """
    GET  /api/admin/users/          — list all users
    POST /api/admin/users/<id>/toggle-staff/  — promote/demote staff (superuser only)
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('date_joined')
        data = []
        for u in users:
            member_count   = ProjectMember.objects.filter(user=u).count()
            assigned_count = Task.objects.filter(assigned_to=u).count()
            owned_count    = Project.objects.filter(owner=u).count()
            data.append({
                **UserSerializer(u).data,
                'date_joined':  u.date_joined.isoformat(),
                'last_login':   u.last_login.isoformat() if u.last_login else None,
                'is_active':    u.is_active,
                'projects_owned':   owned_count,
                'memberships':      member_count,
                'tasks_assigned':   assigned_count,
            })
        return Response(data)


class AdminToggleStaffView(APIView):
    """
    POST /api/admin/users/<user_id>/toggle-staff/
    Superuser can promote/demote staff.  Staff cannot self-modify.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        # Only superusers can change staff status
        if not request.user.is_superuser:
            return Response(
                {'detail': 'Only superusers can promote or demote staff members.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if target == request.user:
            return Response(
                {'detail': 'You cannot change your own staff status.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        target.is_staff = not target.is_staff
        target.save(update_fields=['is_staff'])
        return Response({
            **UserSerializer(target).data,
            'message': f"{'Promoted to' if target.is_staff else 'Removed from'} staff."
        })


class AdminProjectsView(APIView):
    """
    GET /api/admin/projects/  — all projects in the system
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        projects = Project.objects.all().order_by('-created_at')
        return Response(ProjectSerializer(projects, many=True).data)
