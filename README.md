# JobConnect

A full-stack job portal where candidates can browse and apply for jobs, and companies can post roles and manage applicants, with async notifications and role-based access control.

**Live demo:** [job-portal-eight-teal.vercel.app](https://job-portal-eight-teal.vercel.app)  
**Backend API:** deployed on Render 

---

## Features

**For Candidates**
- Register and build a profile (skills, experience, bio, resume)
- Browse and filter jobs by location (Remote / On-site / Hybrid)
- Apply with a cover letter and resume
- Track application status from a personal dashboard
- Receive async notifications on status updates

**For Companies**
- Register with company details and post jobs
- View and manage applicants per job
- Move applicants through a validated status pipeline
- Company dashboard with active job and applicant counts

**General**
- JWT authentication (SimpleJWT) with role-based access (Candidate / Company / Admin)
- Application status transitions with validation: `SUBMITTED → UNDER_REVIEW → SHORTLISTED / REJECTED`
- Async email/in-app notifications via Celery + Redis
- API documentation via Swagger UI (`/api/docs/`)
- Optimised queries with `select_related` and database indexes on `status` and `applied_at`
- Pytest test suite for status transition logic

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Python, Django, Django REST Framework           |
| Auth     | SimpleJWT                                       |
| Database | PostgreSQL (SQLite for local dev)               |
| Async    | Celery + Redis (Docker container)               |
| Testing  | pytest-django                                   |
| API Docs | drf-spectacular / Swagger UI                    |
| Frontend | HTML, CSS, Vanilla JavaScript                   |
| Hosting  | Render (backend) · Vercel (frontend)            |

---

## Project Structure

```
job-portal/
├── accounts/          # User registration, login, profiles (Candidate & Company)
├── jobs/              # Job post CRUD
├── applications/      # Apply, status transitions, applicant views
├── notifications/     # Celery tasks for async notifications
├── jobportal/         # Django settings and URL config
├── frontend/          # Plain HTML/CSS/JS frontend (deployed on Vercel)
├── requirements.txt
├── pytest.ini
└── .env.example
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/bbinita/job-portal.git
cd job-portal
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Fill in your values in `.env` (see [Environment Variables](#environment-variables) below).

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Start Redis via Docker

```bash
docker run -d -p 6379:6379 --name redis redis
```

### 7. Start Celery worker

```bash
celery -A jobportal worker --loglevel=info --pool=solo
```

### 8. Run the development server

```bash
python manage.py runserver
```

### 9. View API docs

Open `http://127.0.0.1:8000/api/docs/`

---

## Running Tests

```bash
pytest
```

Tests cover application status transition validation and role-based access rules.

---

## API Endpoints

### Accounts

| Method   | Endpoint                            | Description              | Access    |
|----------|-------------------------------------|--------------------------|-----------|
| POST     | `/api/accounts/register/candidate/` | Register as candidate    | Public    |
| POST     | `/api/accounts/register/company/`   | Register as company      | Public    |
| POST     | `/api/accounts/login/`              | Login and get JWT tokens | Public    |
| POST     | `/api/accounts/logout/`             | Logout (blacklist token) | Auth      |
| GET/PUT  | `/api/accounts/profile/`            | View or update profile   | Auth      |

### Jobs

| Method     | Endpoint          | Description                  | Access        |
|------------|-------------------|------------------------------|---------------|
| GET        | `/api/jobs/`      | List all active jobs         | Public        |
| POST       | `/api/jobs/`      | Create a job post            | Company only  |
| GET        | `/api/jobs/<id>/` | Job detail                   | Public        |
| PUT/PATCH  | `/api/jobs/<id>/` | Update a job post            | Company only  |
| DELETE     | `/api/jobs/<id>/` | Delete a job post            | Company only  |

### Applications

| Method | Endpoint                         | Description                                | Access         |
|--------|----------------------------------|--------------------------------------------|----------------|
| POST   | `/api/jobs/<id>/apply/`          | Apply for a job                            | Candidate only |
| GET    | `/api/jobs/<id>/applications/`   | View all applications for a job            | Company only   |
| GET    | `/api/applications/`             | View my applications                       | Candidate only |
| PATCH  | `/api/applications/<id>/status/` | Update application status                  | Company only   |

---

## Status Transition Rules

Applications follow a strict forward-only pipeline:

```
SUBMITTED → UNDER_REVIEW → SHORTLISTED
                         → REJECTED
```

Skipping steps or moving backward raises a validation error.

---

## Environment Variables

See `.env.example` for the full list. Key variables:

```
SECRET_KEY=
DEBUG=
DATABASE_URL=
REDIS_URL=
ALLOWED_HOSTS=
CORS_ALLOWED_ORIGINS=
```

---

## Frontend

The frontend is a plain HTML/CSS/JavaScript single-page app — no frameworks, no build step.

**Live:** [job-portal-eight-teal.vercel.app](https://job-portal-eight-teal.vercel.app)

Pages and views:
- Landing page with job highlights and how-it-works section
- Candidate registration, login, and profile management
- Company registration, login, and profile management
- Job browsing with location filter
- Job detail and application form (cover letter + resume upload)
- Candidate dashboard: application stats and status tracking
- Company dashboard: job posts, applicant list, status updates
- In-app notification panel

---

## Author

**Binita** — Backend Developer · Python · Django · DRF  
[github.com/bbinita](https://github.com/bbinita)
