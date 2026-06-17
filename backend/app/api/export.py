import csv
from io import BytesIO, StringIO

from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Candidate

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/candidates.csv")
def export_csv(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> StreamingResponse:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "Location", "Score", "Skills", "LinkedIn", "GitHub"])
    for candidate in db.query(Candidate).order_by(Candidate.created_at.desc()).all():
        writer.writerow([
            candidate.name,
            candidate.email,
            candidate.phone,
            candidate.location,
            candidate.score,
            ", ".join(candidate.skills),
            candidate.linkedin,
            candidate.github,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candidates.csv"},
    )


@router.get("/candidates.pdf")
def export_pdf(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Response:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 48
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y, "Candidate Export")
    y -= 32
    pdf.setFont("Helvetica", 9)
    for candidate in db.query(Candidate).order_by(Candidate.score.desc()).limit(80):
        line = f"{candidate.name} | {candidate.email or '-'} | Score: {candidate.score} | {', '.join(candidate.skills[:6])}"
        pdf.drawString(40, y, line[:130])
        y -= 16
        if y < 48:
            pdf.showPage()
            pdf.setFont("Helvetica", 9)
            y = height - 48
    pdf.save()
    buffer.seek(0)
    return Response(
        content=buffer.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=candidates.pdf"},
    )

