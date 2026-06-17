import json
import re

from openai import OpenAI

from app.core.config import get_settings
from app.services.scoring import calculate_resume_score


SYSTEM_PROMPT = """
You extract resume data for an HR SaaS product. Return only valid JSON.
Schema:
{
  "name": string,
  "email": string | null,
  "phone": string | null,
  "location": string | null,
  "education": [{"degree": string, "institution": string, "year": string | null}],
  "skills": [string],
  "experience": [{"title": string, "company": string, "duration": string | null, "summary": string}],
  "projects": [{"name": string, "summary": string, "technologies": [string]}],
  "certifications": [string],
  "linkedin": string | null,
  "github": string | null
}
"""


COMMON_SKILLS = {
    "python", "java", "javascript", "typescript", "react", "node.js", "fastapi", "django",
    "sql", "postgresql", "mysql", "mongodb", "aws", "azure", "docker", "kubernetes",
    "machine learning", "data analysis", "excel", "power bi", "tableau", "git", "html",
    "css", "tailwind", "pandas", "numpy", "spark", "etl", "rest api", "graphql"
}


def _empty_result() -> dict:
    return {
        "name": "Unknown Candidate",
        "email": None,
        "phone": None,
        "location": None,
        "education": [],
        "skills": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "linkedin": None,
        "github": None,
    }


def _heuristic_parse(text: str) -> dict:
    result = _empty_result()
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if lines:
        result["name"] = lines[0][:120]

    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    phone = re.search(r"(?:\+?\d[\s\-()]*){8,}", text)
    linkedin = re.search(r"https?://(?:www\.)?linkedin\.com/[^\s)]+", text, re.I)
    github = re.search(r"https?://(?:www\.)?github\.com/[^\s)]+", text, re.I)

    result["email"] = email.group(0) if email else None
    result["phone"] = phone.group(0).strip() if phone else None
    result["linkedin"] = linkedin.group(0) if linkedin else None
    result["github"] = github.group(0) if github else None

    lowered = text.lower()
    result["skills"] = sorted({skill for skill in COMMON_SKILLS if skill in lowered})
    return result


def parse_resume(text: str) -> dict:
    settings = get_settings()
    parsed = None
    if settings.openai_api_key:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.1,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text[:16000]},
            ],
        )
        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)
    else:
        parsed = _heuristic_parse(text)

    normalized = _empty_result() | parsed
    normalized["skills"] = sorted({str(skill).strip() for skill in normalized.get("skills", []) if str(skill).strip()})
    normalized["score"] = calculate_resume_score(normalized, text)
    return normalized

