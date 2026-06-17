# AI Resume Parser

Production-ready full-stack resume parsing and candidate ranking application.

## Project Structure

```text
.
├── backend/                 FastAPI API, SQLAlchemy models, parsing/ranking services
│   ├── app/api/             Auth, candidates, jobs, analytics, export endpoints
│   ├── app/core/            Runtime configuration and security helpers
│   ├── app/services/        PDF/DOCX extraction, OpenAI parsing, scoring, ranking
│   ├── Dockerfile           Production backend image
│   ├── requirements.txt     Python dependencies
│   └── .env.example         Backend environment template
├── frontend/                React, Vite, Tailwind UI
│   ├── src/                 Application source
│   ├── Dockerfile           Production Nginx image
│   ├── nginx.conf           SPA routing and static caching
│   ├── vercel.json          Vercel frontend deployment config
│   └── .env.example         Frontend environment template
├── docker-compose.yml       Local production-like stack
├── render.yaml              Render backend and PostgreSQL blueprint
├── railway.json             Railway backend deployment config
└── .env.example             Docker Compose environment template
```

## Services

- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts
- Backend: FastAPI, SQLAlchemy, PostgreSQL, JWT auth
- AI parsing: OpenAI API with heuristic fallback when no API key is configured
- Database: PostgreSQL with JSONB fields for parsed resume data

## Environment Variables

Backend:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database
PORT=8000
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=720
CORS_ORIGINS=https://your-frontend.vercel.app
```

Frontend:

```env
VITE_API_URL=https://your-backend-host.com/api
```

For Docker Compose, copy the root template:

```bash
cp .env.example .env
```

For backend-only local development:

```bash
cp backend/.env.example backend/.env
```

## Run With Docker Compose

Start Docker Desktop first, then run:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

Demo users are created on backend startup:

- Admin: `admin@example.com` / `admin123`
- Recruiter: `recruiter@example.com` / `recruiter123`

Change these before real production use.

## Local Development

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Production Docker Build

Backend:

```bash
docker build -t resume-parser-api ./backend
docker run --env-file backend/.env -p 8000:8000 resume-parser-api
```

Frontend:

```bash
docker build --build-arg VITE_API_URL=https://your-api.example.com/api -t resume-parser-web ./frontend
docker run -p 5173:80 resume-parser-web
```

## Vercel Frontend Deployment

1. Push this repository to GitHub.
2. Create a Vercel project.
3. Set the Vercel root directory to `frontend`.
4. Add this environment variable:

```env
VITE_API_URL=https://your-backend-host.com/api
```

5. Deploy. Vercel uses [frontend/vercel.json](frontend/vercel.json) for the Vite build and SPA rewrites.

## Render Backend And PostgreSQL

Option A, blueprint:

1. Push the repo to GitHub.
2. In Render, create a new Blueprint from the repo.
3. Render will read [render.yaml](render.yaml), create PostgreSQL, and deploy the backend Docker service.
4. Set `OPENAI_API_KEY`.
5. Set `CORS_ORIGINS` to your deployed frontend URL, for example:

```env
CORS_ORIGINS=https://your-frontend.vercel.app
```

Option B, manual web service:

1. Create a Render PostgreSQL database.
2. Create a Render Web Service using Docker.
3. Set root directory to `backend`.
4. Health check path: `/health`.
5. Add environment variables from `backend/.env.example`.
6. Use Render's PostgreSQL internal connection string as `DATABASE_URL`.

The backend automatically normalizes `postgres://` and `postgresql://` URLs to the installed `psycopg` driver.

## Railway Backend And PostgreSQL

1. Create a Railway project from the GitHub repo.
2. Add a PostgreSQL service.
3. Deploy the backend service using [railway.json](railway.json).
4. Add variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
SECRET_KEY=replace-with-a-long-random-secret
CORS_ORIGINS=https://your-frontend.vercel.app
ENVIRONMENT=production
```

5. Use the Railway backend domain plus `/api` as `VITE_API_URL` in Vercel.

## API Health Checks

- `GET /health`
- `GET /api/health`

These return service status and environment without requiring authentication.

## Main API Endpoints

- `POST /api/auth/login`
- `GET /api/candidates`
- `POST /api/candidates/upload`
- `GET /api/candidates/{id}`
- `DELETE /api/candidates/{id}`
- `POST /api/jobs`
- `GET /api/jobs/{id}/rankings`
- `GET /api/analytics/summary`
- `GET /api/export/candidates.csv`
- `GET /api/export/candidates.pdf`

## Production Notes

- Replace demo users/passwords with a managed user creation flow before public launch.
- Set a strong `SECRET_KEY`.
- Restrict `CORS_ORIGINS` to exact frontend domains.
- Use persistent storage or object storage for uploaded resumes on platforms with ephemeral disks.
- Add Alembic migrations before long-lived production use.
- Add antivirus scanning for uploaded resume files.
