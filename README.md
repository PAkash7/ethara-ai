# ProjectFlow — Team Project Management App

A full-stack project management application built with **Django REST Framework** (backend) and **React + Vite** (frontend). Features JWT authentication, role-based access control, task management with priority/status tracking, and a real-time analytics dashboard.

## 🔗 Live URL

> **Backend:** https://your-backend-domain.railway.app  
> **Frontend:** https://your-frontend-domain.railway.app

## 📦 GitHub Repository

> [https://github.com/PAkash7/ethara-ai]

---

## 🛠 Tech Stack

| Layer       | Technology                                |
|-------------|-------------------------------------------|
| Backend     | Django 6, Django REST Framework           |
| Auth        | JWT via `djangorestframework-simplejwt`   |
| Frontend    | React 18, Vite, TanStack Query, Zustand   |
| Database    | SQLite (dev) / PostgreSQL (production)    |
| Deployment  | Railway (Backend + Frontend services)     |
| HTTP Client | Axios with request/response interceptors  |
| Styling     | Vanilla CSS — Dark mode design system     |

---

## ✨ Features

- **JWT Authentication** — Register/login with access (1-day) + refresh (7-day) tokens
- **Project Management** — Create projects, invite members, assign admin or member roles
- **Task Management** — Full CRUD with status, priority, due date, and assignee
- **Role-Based Access Control:**
  - 🔑 **Admin/Owner:** Full create, update, delete; add/remove members
  - 👤 **Member:** View and update status of assigned tasks
- **Dashboard Analytics** — Total tasks, by status, overdue count, my tasks, recent activity
- **Task Filters** — Filter by `?status`, `?priority`, `?assigned_to`, `?overdue=true`
- **Django Admin Panel** — Full admin panel at `/admin/`
- **CORS-safe** — Configured for Railway deployment with proper `ALLOWED_HOSTS`
- **WhiteNoise** — Static file serving in production

---

## 📡 API Endpoints

| Method | Endpoint                                     | Auth     | Description                          |
|--------|----------------------------------------------|----------|--------------------------------------|
| POST   | `/api/auth/register/`                        | Public   | Create user, returns JWT tokens      |
| POST   | `/api/auth/login/`                           | Public   | Login, returns access + refresh      |
| POST   | `/api/auth/refresh/`                         | Public   | Refresh access token                 |
| GET    | `/api/auth/me/`                              | Required | Get current user info                |
| GET    | `/api/projects/`                             | Required | List projects (member or owner)      |
| POST   | `/api/projects/`                             | Required | Create new project                   |
| GET    | `/api/projects/:id/`                         | Required | Get project details                  |
| PUT    | `/api/projects/:id/`                         | Admin    | Update project                       |
| DELETE | `/api/projects/:id/`                         | Admin    | Delete project                       |
| GET    | `/api/projects/:id/members/`                 | Required | List project members                 |
| POST   | `/api/projects/:id/add_member/`              | Admin    | Add member to project                |
| DELETE | `/api/projects/:id/remove_member/:user_id/`  | Admin    | Remove member from project           |
| GET    | `/api/tasks/`                                | Required | List tasks (with optional filters)   |
| POST   | `/api/tasks/`                                | Required | Create task in a project             |
| GET    | `/api/tasks/:id/`                            | Required | Get task details                     |
| PATCH  | `/api/tasks/:id/`                            | Member+  | Update task (status by member, all by admin) |
| DELETE | `/api/tasks/:id/`                            | Admin    | Delete task                          |
| GET    | `/api/dashboard/`                            | Required | Get user dashboard stats             |

### Task Query Params
- `?project=<id>` — Filter by project
- `?status=todo|in_progress|done`
- `?priority=low|medium|high`
- `?assigned_to=<user_id>`
- `?overdue=true` — Tasks past due date with non-done status

---

## 🚀 Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/project-manager-app.git
cd project-manager-app
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set SECRET_KEY (generate with: python3 -c "import secrets; print(secrets.token_urlsafe(50))")

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

# Start the dev server
python manage.py runserver
```
Backend runs at: `http://localhost:8000`  
Admin panel: `http://localhost:8000/admin/`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 🔒 Role-Based Access

| Action                         | Owner | Admin | Member |
|-------------------------------|-------|-------|--------|
| View project & tasks          | ✅    | ✅    | ✅     |
| Create project                | ✅    | ✅    | ✅     |
| Update/delete project         | ✅    | ✅    | ❌     |
| Add/remove members            | ✅    | ✅    | ❌     |
| Create task                   | ✅    | ✅    | ✅     |
| Update any task field         | ✅    | ✅    | ❌     |
| Update own task status        | ✅    | ✅    | ✅*    |
| Delete task                   | ✅    | ✅    | ❌     |

*Members can only update status of tasks assigned to them.

---

## 🚂 Deployment Notes (Railway)

### Backend Service
- **Root directory:** `backend/`
- **Build command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **Start command:** `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
- **Environment variables:**
  ```
  SECRET_KEY=<strong-random-key>
  DEBUG=False
  DATABASE_URL=<auto-set by Railway PostgreSQL plugin>
  CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app
  ALLOWED_HOSTS=your-backend.railway.app
  ```

### Frontend Service
- **Root directory:** `frontend/`
- **Build command:** `npm run build`
- **Start command:** `npx serve dist -p $PORT`
- **Environment variable:** `VITE_API_URL=https://your-backend.railway.app`

### ☑ Validation Checklist
- [x] POST `/api/auth/register/` creates user and returns JWT tokens
- [x] POST `/api/auth/login/` returns access + refresh tokens
- [x] Unauthenticated requests return 401
- [x] Non-admin member cannot delete a project (returns 403)
- [x] Project owner auto-added as admin on create
- [x] Assigning task to non-member returns validation error
- [x] GET `/api/dashboard/` returns accurate counts
- [x] `?overdue=true` filter returns only overdue tasks
- [x] Django admin panel accessible at `/admin/`
- [x] CORS configured (no browser errors on API calls)
- [x] WhiteNoise serves static files in production
