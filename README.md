# Job Portal Backend API

A RESTful backend API for a job portal built with Django and Django REST Framework. Supports three user types — companies, candidates, and admin — handling job posting, applications, status transitions, and async notifications.

## Features

- JWT authentication with role-based access (Company, Candidate, Admin)
- Companies can post jobs and manage applications
- Candidates can apply for jobs and track application status
- Application status transitions with validation (SUBMITTED → UNDER_REVIEW → SHORTLISTED/REJECTED)
- Async notifications via Celery + Redis when application status changes
- API documentation via Swagger UI

## Tech Stack

- Python / Django / Django REST Framework
- PostgreSQL (SQLite for development)
- Celery + Redis (async task queue)
- Docker (Redis container)
- pytest-django (testing)
- drf-spectacular (API docs)

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/bbinita/job-portal.git
cd job-portal
```

### 2. Create and activate virtual environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
```bash
cp .env.example .env
```
Fill in your values in `.env`.

### 5. Run migrations
```bash
python manage.py migrate
```

### 6. Start Redis (Docker required)
```bash
docker run -d -p 6379:6379 --name redis redis
```

### 7. Start Celery worker
```bash
celery -A jobportal worker --loglevel=info --pool=solo
```

### 8. Run the server
```bash
python manage.py runserver
```

### 9. View API docs
Visit `http://127.0.0.1:8000/api/docs/`

## Running Tests
```bash
pytest
```

## API Endpoints

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/accounts/register/candidate/` | Register as candidate |
| POST | `/api/accounts/register/company/` | Register as company |
| POST | `/api/accounts/login/` | Login and get JWT token |
| POST | `/api/accounts/logout/` | Logout |
| GET/PUT | `/api/accounts/profile/` | View or update profile |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/` | List all active jobs |
| POST | `/api/jobs/` | Create a job (company only) |
| GET | `/api/jobs/<id>/` | Job detail |
| PUT/PATCH | `/api/jobs/<id>/` | Update job (company only) |
| DELETE | `/api/jobs/<id>/` | Delete job (company only) |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs/<id>/apply/` | Apply for a job (candidate only) |
| GET | `/api/jobs/<id>/applications/` | View applications for a job (company only) |
| GET | `/api/applications/` | View my applications (candidate only) |
| PATCH | `/api/applications/<id>/status/` | Update application status (company only) |

## Status Transition Rules

Applications can only move forward in this order:
SUBMITTED → UNDER_REVIEW → SHORTLISTED → REJECTED

Skipping steps or going backward raises a validation error.

## Environment Variables

See `.env.example` for all required variables.
