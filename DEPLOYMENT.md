# Deployment Guide

## Local Container Verification

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000/health
- API docs: http://localhost:8000/docs

Docker Compose starts:

- `db`: PostgreSQL 16 with the `postgres_data` volume.
- `backend`: FastAPI on port `8000`, using `DATABASE_URL` pointed at `db`.
- `frontend`: Nginx on port `5173`, serving the Vite build and proxying `/api` to `backend`.

## Required Production Environment

Backend:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database
PORT=8000
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=720
CORS_ORIGINS=https://your-frontend.example.com
UPLOAD_DIR=/app/uploads
SEED_DEMO_USERS=false
```

Frontend container:

```env
API_URL=https://your-backend.example.com/api
```

## Render Strategy

Use `render.yaml` as a Blueprint. It defines:

- A Docker backend web service.
- A Docker frontend web service.
- A managed PostgreSQL database.
- A persistent disk mounted at `/app/uploads` for uploaded resumes.
- Health checks for both containers.

After the Blueprint is created, set:

- Backend `OPENAI_API_KEY`.
- Backend `CORS_ORIGINS` to the final frontend URL.
- Frontend `API_URL` to the final backend URL plus `/api`.

## Railway Strategy

Railway can deploy the backend from `railway.json` and a PostgreSQL plugin. Set:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
SECRET_KEY=replace-with-a-long-random-secret
CORS_ORIGINS=https://your-frontend.example.com
UPLOAD_DIR=/app/uploads
SEED_DEMO_USERS=false
ENVIRONMENT=production
```

Deploy the frontend as a second Docker service from `frontend/Dockerfile`, with:

```env
API_URL=https://your-railway-backend.up.railway.app/api
```

Use a Railway volume for `/app/uploads` if resume files must persist.

## EC2/GCP/Azure VM Strategy

1. Install Docker and Docker Compose.
2. Copy `.env.example` to `.env` and set production secrets.
3. Set `VITE_API_URL=/api` for same-host reverse-proxy usage, or an absolute backend URL for split services.
4. Run `docker compose up -d --build`.
5. Put a TLS reverse proxy or cloud load balancer in front of the frontend service.
6. Back up the `postgres_data` volume and monitor `/health`.

## Build Commands

```bash
docker compose build
docker compose up -d
docker compose ps
```

Backend-only:

```bash
docker build -t resume-parser-api ./backend
docker run --env-file backend/.env.example -p 8000:8000 resume-parser-api
```

Frontend-only:

```bash
docker build -t resume-parser-web ./frontend
docker run -e API_URL=http://localhost:8000/api -p 5173:80 resume-parser-web
```
