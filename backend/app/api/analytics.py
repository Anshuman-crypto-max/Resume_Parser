from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Candidate
from app.schemas import AnalyticsSummary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def analytics_summary(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> AnalyticsSummary:
    candidates = db.query(Candidate).all()
    total = len(candidates)
    average = db.query(func.avg(Candidate.score)).scalar() or 0

    skills = Counter(skill for candidate in candidates for skill in candidate.skills)
    locations = Counter(candidate.location or "Unknown" for candidate in candidates)
    buckets = [
        {"label": "0-39", "count": sum(1 for c in candidates if c.score < 40)},
        {"label": "40-59", "count": sum(1 for c in candidates if 40 <= c.score < 60)},
        {"label": "60-79", "count": sum(1 for c in candidates if 60 <= c.score < 80)},
        {"label": "80-100", "count": sum(1 for c in candidates if c.score >= 80)},
    ]
    recent = db.query(Candidate).order_by(Candidate.created_at.desc()).limit(6).all()
    return AnalyticsSummary(
        total_candidates=total,
        average_score=round(float(average), 2),
        top_skills=[{"name": name, "count": count} for name, count in skills.most_common(10)],
        score_buckets=buckets,
        candidates_by_location=[{"name": name, "count": count} for name, count in locations.most_common(8)],
        recent_candidates=recent,
    )

