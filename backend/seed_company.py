"""
Ethara.AI Company Seed Script
Run: python seed_company.py
Creates: 1 CEO + 3 Leads + 6 Developers = 10 users
         5 Projects + 25 Tasks with realistic assignments
"""
import os, sys, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth.models import User
from accounts.models import UserProfile
from projects.models import Project, ProjectMember
from tasks.models import Task
from django.utils import timezone
from datetime import timedelta

# ── Helpers ──────────────────────────────────────────────────────────────────
def make_user(username, first, last, email, password, designation, is_staff=False, is_superuser=False, color='#7c3aed', bio=''):
    user, created = User.objects.get_or_create(username=username)
    user.first_name    = first
    user.last_name     = last
    user.email         = email
    user.is_staff      = is_staff
    user.is_superuser  = is_superuser
    user.set_password(password)
    user.save()
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.designation  = designation
    profile.avatar_color = color
    profile.bio          = bio
    profile.save()
    tag = '🌟 CEO' if is_superuser else ('🔷 Lead' if is_staff else '👤 Dev')
    action = 'Created' if created else 'Updated'
    print(f"  {tag} {action}: {username} ({first} {last}) — {designation}")
    return user

def make_project(name, desc, owner, members, status='in_progress'):
    proj, created = Project.objects.get_or_create(name=name, defaults={'owner': owner})
    proj.description = desc
    proj.status      = status
    proj.owner       = owner
    proj.save()
    # Add members via ProjectMember intermediary
    for user in members:
        ProjectMember.objects.get_or_create(project=proj, user=user)
    action = 'Created' if created else 'Updated'
    print(f"  📁 {action}: {name} ({len(members)} members)")
    return proj

def make_task(title, project, assigned_to, created_by, status='todo', priority='medium', due_days=7, desc=''):
    due = timezone.now().date() + timedelta(days=due_days)
    task, created = Task.objects.get_or_create(
        title=title, project=project,
        defaults={'assigned_to': assigned_to, 'created_by': created_by}
    )
    task.status      = status
    task.priority    = priority
    task.due_date    = due
    task.description = desc
    task.assigned_to = assigned_to
    task.created_by  = created_by
    task.save()
    tag = '✅' if status == 'done' else ('⚡' if status == 'in_progress' else '🔵')
    action = 'Created' if created else 'Updated'
    print(f"    {tag} {action}: {title} → {assigned_to.username}")
    return task

# ─────────────────────────────────────────────────────────────────────────────
print("\n╔══════════════════════════════════════════════╗")
print("║   Ethara.AI Company Seed  |  Akash Pandey   ║")
print("╚══════════════════════════════════════════════╝\n")

# ── 1. CEO ────────────────────────────────────────────────────────────────────
print("👑  CEO")
ceo = make_user(
    'Pakash7', 'Akash', 'Pandey',
    'ceo@ethara.ai', 'Reset@1873',
    designation='ceo',
    is_staff=True, is_superuser=True,
    color='#7c3aed',
    bio='Chief Executive Officer at Ethara.AI — driving vision, strategy, and team excellence.'
)

# ── 2. Leads ──────────────────────────────────────────────────────────────────
print("\n🔷  Leads")
tech_lead = make_user(
    'Rajan_TL', 'Rajan', 'Sharma',
    'rajan@ethara.ai', 'Lead@1234',
    designation='technical_lead',
    is_staff=True, color='#2563eb',
    bio='Technical Lead overseeing frontend & backend architecture at Ethara.AI.'
)
quality_lead = make_user(
    'Priya_QL', 'Priya', 'Mehta',
    'priya@ethara.ai', 'Lead@1234',
    designation='quality_lead',
    is_staff=True, color='#059669',
    bio='Quality Lead responsible for test strategy, QA processes, and release sign-off.'
)
product_lead = make_user(
    'Nikhil_PM', 'Nikhil', 'Verma',
    'nikhil@ethara.ai', 'Lead@1234',
    designation='product_manager',
    is_staff=True, color='#d97706',
    bio='Product Manager bridging client requirements and technical execution.'
)

# ── 3. Team Members (7) ───────────────────────────────────────────────────────
print("\n👤  Team Members")
fe1 = make_user(
    'Arjun_FE', 'Arjun', 'Singh',
    'arjun@ethara.ai', 'Dev@1234',
    designation='frontend_developer', color='#6366f1',
    bio='Frontend Developer specialising in React, animations and responsive UI.'
)
fe2 = make_user(
    'Sneha_FE', 'Sneha', 'Kapoor',
    'sneha@ethara.ai', 'Dev@1234',
    designation='frontend_developer', color='#db2777',
    bio='Frontend Developer focused on component libraries and accessibility.'
)
be1 = make_user(
    'Rahul_BE', 'Rahul', 'Gupta',
    'rahul@ethara.ai', 'Dev@1234',
    designation='backend_developer', color='#0891b2',
    bio='Backend Developer building REST APIs, database schemas, and microservices.'
)
be2 = make_user(
    'Kavya_BE', 'Kavya', 'Nair',
    'kavya@ethara.ai', 'Dev@1234',
    designation='backend_developer', color='#4f46e5',
    bio='Backend Developer focused on Django, PostgreSQL, and API optimisation.'
)
fs = make_user(
    'Amit_FS', 'Amit', 'Joshi',
    'amit@ethara.ai', 'Dev@1234',
    designation='fullstack_developer', color='#9333ea',
    bio='Full Stack Developer handling end-to-end feature delivery.'
)
qa = make_user(
    'Divya_QA', 'Divya', 'Rao',
    'divya@ethara.ai', 'Dev@1234',
    designation='qa_engineer', color='#059669',
    bio='QA Engineer writing test cases, running regression suites and reporting bugs.'
)
designer = make_user(
    'Karan_UI', 'Karan', 'Malhotra',
    'karan@ethara.ai', 'Dev@1234',
    designation='ui_ux_designer', color='#dc2626',
    bio='UI/UX Designer crafting wireframes, design systems, and user flows.'
)

all_members = [ceo, tech_lead, quality_lead, product_lead, fe1, fe2, be1, be2, fs, qa, designer]

# ── 4. Projects ───────────────────────────────────────────────────────────────
print("\n📁  Projects")
p_web = make_project(
    'Ethara.AI Web Platform',
    'Core web application dashboard — React frontend with role-based access, project management, and real-time analytics.',
    owner=tech_lead,
    members=[ceo, tech_lead, product_lead, fe1, fe2, fs, designer, quality_lead, qa],
    status='in_progress'
)
p_api = make_project(
    'Ethara.AI REST API',
    'Django REST Framework backend — JWT auth, project/task CRUD, serializers, admin endpoints.',
    owner=tech_lead,
    members=[ceo, tech_lead, be1, be2, fs, quality_lead, qa],
    status='in_progress'
)
p_qa = make_project(
    'QA Automation Suite',
    'End-to-end test automation framework covering all critical user flows — login, project creation, task management.',
    owner=quality_lead,
    members=[quality_lead, qa, tech_lead, ceo],
    status='in_progress'
)
p_design = make_project(
    'Design System & UI Kit',
    'Component library, typography guide, icon set, colour tokens, and accessibility standards for Ethara.AI.',
    owner=product_lead,
    members=[product_lead, designer, fe1, fe2, ceo, tech_lead],
    status='in_progress'
)
p_infra = make_project(
    'Cloud Infrastructure & DevOps',
    'Docker, CI/CD pipelines, Railway deployment, environment management, and monitoring setup.',
    owner=ceo,
    members=[ceo, tech_lead, be1, fs],
    status='todo'
)

# ── 5. Tasks ──────────────────────────────────────────────────────────────────
print("\n📋  Tasks")

# — Web Platform Tasks
make_task('Build Navigation Bar with Dark/Light toggle',    p_web, fe1,      tech_lead, 'done',        'high',   -5, 'Navbar with Ethara.AI branding, theme toggle, user avatar')
make_task('Implement Dashboard stats grid',                 p_web, fe2,      tech_lead, 'done',        'high',   -3, 'Stat cards: total tasks, projects, in-progress, completed')
make_task('Build ProjectsPage with category filters',       p_web, fs,       tech_lead, 'in_progress', 'high',    3, 'Category tabs, search bar, status filters, project cards')
make_task('Profile page hero banner & edit form',           p_web, fe1,      tech_lead, 'in_progress', 'medium',  5, 'Avatar colour picker, designation dropdown, bio field')
make_task('Page transition animations',                     p_web, fe2,      tech_lead, 'done',        'low',    -1, 'Slide-up, fade-in keyframes for all route changes')
make_task('Design Ethara.AI login & register pages',        p_web, designer, product_lead, 'done',     'high',   -7, 'Cinematic purple theme, orbs, particle field, shimmer brand')
make_task('Responsive layout for mobile viewports',         p_web, fe2,      tech_lead, 'todo',        'medium', 10, 'Grid collapses, drawer nav, fluid type scale')

# — API Tasks
make_task('JWT Auth endpoints (login/register/refresh)',    p_api, be1,      tech_lead, 'done',        'high',  -10, 'SimpleJWT, custom RegisterView, MeView PATCH')
make_task('UserProfile model & signal auto-create',         p_api, be2,      tech_lead, 'done',        'high',   -8, 'OneToOne with User, designation choices, post_save signal')
make_task('Projects CRUD API with member management',       p_api, be1,      tech_lead, 'done',        'high',   -6, 'ViewSets, permission checks, member assignment')
make_task('Tasks CRUD with assignment & due dates',         p_api, be2,      tech_lead, 'in_progress', 'high',    2, 'Task model, priority/status choices, due_date field')
make_task('Designations grouped endpoint',                  p_api, fs,       tech_lead, 'done',        'medium', -4, 'Returns [{group, options}] for optgroup dropdowns')
make_task('Admin dashboard aggregation API',                p_api, be1,      tech_lead, 'in_progress', 'medium',  4, 'System-wide stats: users, projects, tasks, overdue count')

# — QA Tasks
make_task('Write login/register test cases',                p_qa,  qa,       quality_lead, 'done',        'high',  -3, 'Valid/invalid credentials, empty fields, duplicate user')
make_task('Test profile PATCH endpoint',                    p_qa,  qa,       quality_lead, 'done',        'high',  -2, 'All 7 fields, partial update, missing profile edge case')
make_task('API regression test suite',                      p_qa,  qa,       quality_lead, 'in_progress', 'high',   5, 'Automated tests for all /api/ endpoints')
make_task('Cross-browser UI testing',                       p_qa,  qa, quality_lead, 'todo', 'medium', 12, 'Chrome, Firefox, Safari — auth, projects, admin panel')
make_task('Performance & load testing',                     p_qa,  qa,       quality_lead, 'todo',        'low',   20, 'Simulate 50 concurrent users on key endpoints')

# — Design Tasks
make_task('Colour palette & typography tokens',             p_design, designer, product_lead, 'done',        'high',  -5, 'Purple-primary gradients, Playfair Display, Lato, Inter')
make_task('Project card component design',                  p_design, designer, product_lead, 'done',        'high',  -3, 'Data-rich card: category icon, progress bar, priority chip')
make_task('Icon set for project categories',                p_design, designer, product_lead, 'in_progress', 'medium', 4, '14 category icons: Web, Mobile, Data, DevOps, Security...')
make_task('Admin panel wireframes',                         p_design, designer, product_lead, 'todo',        'medium', 8, 'User table, stats grid, project list, task overview')

# — Infra Tasks
make_task('Dockerfile & docker-compose setup',              p_infra, fs,      ceo, 'done',        'high',  -6, 'Multi-stage build: backend (gunicorn) + frontend (nginx)')
make_task('Railway deployment configuration',               p_infra, be2,     ceo, 'done',        'high',  -4, 'railway.toml, environment variables, health checks')
make_task('CI/CD pipeline with GitHub Actions',             p_infra, be1,     ceo, 'todo',        'medium', 14, 'Auto-build on push, run tests, deploy to Railway on main')

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n╔══════════════════════════════════════════════╗")
print("║               ✅  SEED COMPLETE              ║")
print("╚══════════════════════════════════════════════╝")
print(f"  Users    : {User.objects.count()}")
print(f"  Projects : {Project.objects.count()}")
print(f"  Tasks    : {Task.objects.count()}")
print("\n  Login credentials:")
print("  ┌─────────────────┬──────────────┬──────────────┐")
print("  │ Username        │ Password     │ Role         │")
print("  ├─────────────────┼──────────────┼──────────────┤")
print("  │ Pakash7         │ Reset@1873   │ 🌟 CEO       │")
print("  │ Rajan_TL        │ Lead@1234    │ 🔷 Tech Lead │")
print("  │ Priya_QL        │ Lead@1234    │ 🔷 Qual Lead │")
print("  │ Nikhil_PM       │ Lead@1234    │ 🔷 Product   │")
print("  │ Arjun_FE        │ Dev@1234     │ 👤 FE Dev    │")
print("  │ Sneha_FE        │ Dev@1234     │ 👤 FE Dev    │")
print("  │ Rahul_BE        │ Dev@1234     │ 👤 BE Dev    │")
print("  │ Kavya_BE        │ Dev@1234     │ 👤 BE Dev    │")
print("  │ Amit_FS         │ Dev@1234     │ 👤 FS Dev    │")
print("  │ Divya_QA        │ Dev@1234     │ 👤 QA Eng    │")
print("  │ Karan_UI        │ Dev@1234     │ 👤 Designer  │")
print("  └─────────────────┴──────────────┴──────────────┘")
