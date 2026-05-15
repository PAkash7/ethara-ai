from django.db import models
from django.contrib.auth.models import User


CATEGORY_CHOICES = [
    ('web_development',     'Web Development'),
    ('mobile_app',          'Mobile App'),
    ('data_science',        'Data Science & ML'),
    ('ui_ux_design',        'UI/UX Design'),
    ('devops',              'DevOps & Infrastructure'),
    ('ecommerce',           'E-Commerce'),
    ('marketing',           'Digital Marketing'),
    ('consulting',          'Business Consulting'),
    ('research',            'Research & Analysis'),
    ('api_integration',     'API & Integrations'),
    ('security',            'Cybersecurity'),
    ('blockchain',          'Blockchain & Web3'),
    ('iot',                 'IoT & Embedded'),
    ('other',               'Other'),
]

PROJECT_STATUS_CHOICES = [
    ('active',      'Active'),
    ('on_hold',     'On Hold'),
    ('completed',   'Completed'),
    ('archived',    'Archived'),
]

PRIORITY_CHOICES = [
    ('low',      'Low'),
    ('medium',   'Medium'),
    ('high',     'High'),
    ('critical', 'Critical'),
]


class Project(models.Model):
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner       = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='owned_projects'
    )
    # Professional fields
    category    = models.CharField(
        max_length=30, choices=CATEGORY_CHOICES, default='other'
    )
    status      = models.CharField(
        max_length=20, choices=PROJECT_STATUS_CHOICES, default='active'
    )
    priority    = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default='medium'
    )
    client_name  = models.CharField(max_length=200, blank=True)
    client_email = models.EmailField(blank=True)
    deadline     = models.DateField(null=True, blank=True)
    budget       = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    tech_stack   = models.CharField(max_length=500, blank=True, help_text='Comma-separated tags')

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    ROLE_CHOICES = [('admin', 'Admin'), ('member', 'Member')]

    project   = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    role      = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.username} — {self.project.name} ({self.role})"
