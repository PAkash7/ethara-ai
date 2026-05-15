from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from tasks.views import (
    DashboardView,
    AdminDashboardView,
    AdminUsersView,
    AdminToggleStaffView,
    AdminProjectsView,
)


def health_check(request):
    """Public endpoint for Railway/Docker health checks."""
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('health/',        health_check,                   name='health'),
    path('api/auth/',      include('accounts.urls')),
    path('api/',           include('projects.urls')),
    path('api/',           include('tasks.urls')),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),

    # ── Admin-only API ─────────────────────────────────────────────────────
    path('api/admin/dashboard/',                             AdminDashboardView.as_view(),  name='admin-dashboard'),
    path('api/admin/users/',                                 AdminUsersView.as_view(),       name='admin-users'),
    path('api/admin/users/<int:user_id>/toggle-staff/',      AdminToggleStaffView.as_view(), name='admin-toggle-staff'),
    path('api/admin/projects/',                              AdminProjectsView.as_view(),    name='admin-projects'),

    # ── Django admin panel (staff/superuser only) ───────────────────────────
    path('admin/', admin.site.urls),
]
