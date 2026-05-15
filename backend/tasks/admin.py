from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'assigned_to', 'status', 'priority', 'due_date', 'created_at')
    list_filter = ('status', 'priority', 'project')
    search_fields = ('title', 'project__name', 'assigned_to__username')
    date_hierarchy = 'created_at'
