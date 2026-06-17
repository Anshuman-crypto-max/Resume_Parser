import re


IMPORTANT_FIELDS = ["email", "phone", "location", "education", "skills", "experience"]


def normalize_skill(skill: str) -> str:
    return re.sub(r"\s+", " ", skill.strip().lower())


def calculate_resume_score(parsed: dict, raw_text: str) -> int:
    score = 20
    for field in IMPORTANT_FIELDS:
        value = parsed.get(field)
        if isinstance(value, list) and value:
            score += 10
        elif isinstance(value, str) and value.strip():
            score += 10

    skills = parsed.get("skills") or []
    experience = parsed.get("experience") or []
    projects = parsed.get("projects") or []
    certifications = parsed.get("certifications") or []

    score += min(len(skills), 12)
    score += min(len(experience) * 4, 12)
    score += min(len(projects) * 3, 9)
    score += min(len(certifications) * 2, 6)
    if len(raw_text) > 2500:
        score += 6
    if parsed.get("linkedin"):
        score += 4
    if parsed.get("github"):
        score += 4
    return max(0, min(100, score))


def rank_candidate(candidate: dict, job_description: str, required_skills: list[str]) -> dict:
    candidate_skills = {normalize_skill(skill) for skill in candidate.get("skills", [])}
    required = {normalize_skill(skill) for skill in required_skills if skill.strip()}
    if not required:
        required = {
            normalize_skill(token)
            for token in re.findall(r"\b[A-Za-z][A-Za-z+#.\- ]{1,30}\b", job_description)
            if len(token.strip()) > 2
        }

    matched = sorted(candidate_skills.intersection(required))
    missing = sorted(required.difference(candidate_skills))
    skill_score = (len(matched) / max(len(required), 1)) * 70
    resume_score = float(candidate.get("score") or 0) * 0.3
    final_score = round(min(100, skill_score + resume_score), 2)

    rationale = (
        f"Matched {len(matched)} of {len(required)} required skills. "
        f"Resume quality contributed {round(resume_score, 2)} points."
    )
    return {
        "match_score": final_score,
        "matched_skills": matched,
        "missing_skills": missing[:20],
        "rationale": rationale,
    }

