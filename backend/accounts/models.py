from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


DESIGNATION_CHOICES = [
    # ── Leadership & C-Suite ──────────────────────────────────────
    ('ceo',                  'Chief Executive Officer (CEO)'),
    ('cto',                  'Chief Technology Officer (CTO)'),
    ('coo',                  'Chief Operating Officer (COO)'),
    ('cfo',                  'Chief Financial Officer (CFO)'),

    # ── Management ───────────────────────────────────────────────
    ('engineering_manager',  'Engineering Manager'),
    ('project_manager',      'Project Manager'),
    ('product_manager',      'Product Manager'),
    ('delivery_manager',     'Delivery Manager'),
    ('operations_manager',   'Operations Manager'),
    ('hr_manager',           'HR Manager'),
    ('sales_manager',        'Sales Manager'),

    # ── Engineering ──────────────────────────────────────────────
    ('fullstack_developer',  'Full Stack Developer'),
    ('frontend_developer',   'Frontend Developer'),
    ('backend_developer',    'Backend Developer'),
    ('mobile_developer',     'Mobile Developer'),
    ('software_engineer',    'Software Engineer'),

    # ── Database & Infrastructure ─────────────────────────────────
    ('db_handler',           'Database Handler / DBA'),
    ('db_architect',         'Database Architect'),
    ('devops_engineer',      'DevOps Engineer'),
    ('cloud_engineer',       'Cloud Engineer'),
    ('network_engineer',     'Network Engineer'),
    ('security_engineer',    'Security Engineer'),

    # ── Quality & Testing ─────────────────────────────────────────
    ('quality_lead',         'Quality Lead'),
    ('qa_engineer',          'QA Engineer / Tester'),
    ('automation_tester',    'Automation Tester'),
    ('manual_tester',        'Manual Tester'),
    ('performance_tester',   'Performance Tester'),

    # ── Design & Product ─────────────────────────────────────────
    ('ui_ux_designer',       'UI/UX Designer'),
    ('product_designer',     'Product Designer'),
    ('graphic_designer',     'Graphic Designer'),

    # ── Data & Analytics ──────────────────────────────────────────
    ('data_scientist',       'Data Scientist'),
    ('data_analyst',         'Data Analyst'),
    ('data_engineer',        'Data Engineer'),
    ('ml_engineer',          'ML / AI Engineer'),

    # ── Business & Support ────────────────────────────────────────
    ('business_analyst',     'Business Analyst'),
    ('scrum_master',         'Scrum Master'),
    ('technical_lead',       'Technical Lead'),
    ('consultant',           'Consultant'),
    ('support_engineer',     'Support Engineer'),
    ('intern',               'Intern'),
    ('student',              'Student'),
    ('other',                'Other'),
]


class UserProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    designation = models.CharField(max_length=50, choices=DESIGNATION_CHOICES, blank=True, default='')
    bio         = models.TextField(blank=True, max_length=300)
    phone       = models.CharField(max_length=20, blank=True)
    location    = models.CharField(max_length=100, blank=True)
    avatar_color = models.CharField(max_length=7, default='#7c3aed')  # hex colour

    def __str__(self):
        return f"Profile({self.user.username})"


# Auto-create profile on User creation
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
