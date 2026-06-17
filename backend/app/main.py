from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analytics, auth, candidates, export, jobs
from app.core.config import get_settings
from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import User, UserRole

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(candidates.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(export.router, prefix="/api")


def seed_users() -> None:
    db = SessionLocal()
    try:
        users = [
            ("admin@example.com", "Admin User", UserRole.admin, "admin123"),
            ("recruiter@example.com", "Recruiter User", UserRole.recruiter, "recruiter123"),
        ]
        for email, full_name, role, password in users:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(email=email, full_name=full_name, role=role, hashed_password=hash_password(password)))
        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_users()


@app.get("/health", tags=["health"])
@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "service": settings.app_name, "environment": settings.environment}
