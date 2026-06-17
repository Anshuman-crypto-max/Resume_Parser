from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Candidate, CandidateMatch, JobDescription, User
from app.schemas import JobCreate, JobRead, MatchRead
from app.services.scoring import rank_candidate

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JobDescription:
    job = JobDescription(**payload.model_dump(), created_by_id=current_user.id)
    db.add(job)
    db.flush()

    candidates = db.query(Candidate).all()
    for candidate in candidates:
        ranking = rank_candidate(
            {
                "skills": candidate.skills,
                "score": candidate.score,
            },
            payload.description,
            payload.required_skills,
        )
        db.add(CandidateMatch(job_id=job.id, candidate_id=candidate.id, **ranking))
    db.commit()
    db.refresh(job)
    return job


@router.get("/{job_id}/rankings", response_model=list[MatchRead])
def get_rankings(
    job_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list[CandidateMatch]:
    job = db.get(JobDescription, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return (
        db.query(CandidateMatch)
        .options(joinedload(CandidateMatch.candidate))
        .filter(CandidateMatch.job_id == job_id)
        .order_by(CandidateMatch.match_score.desc())
        .all()
    )

