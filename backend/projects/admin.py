from django.contrib import admin
from .models import Project, ProjectMember


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'owner__username')


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'project', 'role', 'joined_at')
    list_filter = ('role',)
    search_fields = ('user__username', 'project__name')
