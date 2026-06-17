from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import String, cast, func, or_
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, require_admin
from app.models import Candidate
from app.schemas import CandidateDetail, CandidateList, CandidateRead
from app.services.file_extractors import extract_resume_text, validate_resume_file
from app.services.resume_parser import parse_resume

router = APIRouter(prefix="/candidates", tags=["candidates"])
UPLOAD_DIR = Path("uploads")


@router.get("", response_model=CandidateList)
def list_candidates(
    search: str | None = None,
    skill: str | None = None,
    location: str | None = None,
    min_score: int | None = Query(default=None, ge=0, le=100),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> CandidateList:
    query = db.query(Candidate)
    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(Candidate.name.ilike(pattern), Candidate.email.ilike(pattern)))
    if skill:
        query = query.filter(cast(Candidate.skills, String).ilike(f"%{skill}%"))
    if location:
        query = query.filter(Candidate.location.ilike(f"%{location}%"))
    if min_score is not None:
        query = query.filter(Candidate.score >= min_score)

    total = query.count()
    items = query.order_by(Candidate.created_at.desc()).offset(offset).limit(limit).all()
    return CandidateList(items=items, total=total)


@router.post("/upload", response_model=CandidateRead, status_code=status.HTTP_201_CREATED)
async def upload_candidate(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Candidate:
    suffix = validate_resume_file(file)
    UPLOAD_DIR.mkdir(exist_ok=True)
    safe_name = f"{uuid4().hex}{suffix}"
    path = UPLOAD_DIR / safe_name
    path.write_bytes(await file.read())

    text = extract_resume_text(path)
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No readable text found")

    parsed = parse_resume(text)
    candidate = Candidate(
        name=parsed["name"],
        email=parsed.get("email"),
        phone=parsed.get("phone"),
        location=parsed.get("location"),
        linkedin=parsed.get("linkedin"),
        github=parsed.get("github"),
        skills=parsed.get("skills", []),
        education=parsed.get("education", []),
        experience=parsed.get("experience", []),
        projects=parsed.get("projects", []),
        certifications=parsed.get("certifications", []),
        raw_text=text,
        parsed_json=parsed,
        score=parsed.get("score", 0),
        source_filename=file.filename or safe_name,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/{candidate_id}", response_model=CandidateDetail)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Candidate:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return candidate


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
) -> None:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    db.delete(candidate)
    db.commit()

