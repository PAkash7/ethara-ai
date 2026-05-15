from django.db import models
from django.contrib.auth.models import User
from projects.models import Project


class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name='tasks'
    )
    assigned_to = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='assigned_tasks'
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='created_tasks'
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.status}] {self.title}"
