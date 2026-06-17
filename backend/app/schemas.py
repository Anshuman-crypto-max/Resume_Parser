from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models import UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CandidateBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    skills: list[str] = []
    education: list[dict] = []
    experience: list[dict] = []
    projects: list[dict] = []
    certifications: list[str] = []
    score: int = 0
    source_filename: str


class CandidateRead(CandidateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class CandidateDetail(CandidateRead):
    raw_text: str
    parsed_json: dict


class CandidateList(BaseModel):
    items: list[CandidateRead]
    total: int


class JobCreate(BaseModel):
    title: str
    department: str | None = None
    description: str
    required_skills: list[str] = []


class JobRead(JobCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class MatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    candidate_id: int
    match_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    rationale: str
    candidate: CandidateRead


class AnalyticsSummary(BaseModel):
    total_candidates: int
    average_score: float
    top_skills: list[dict]
    score_buckets: list[dict]
    candidates_by_location: list[dict]
    recent_candidates: list[CandidateRead]
