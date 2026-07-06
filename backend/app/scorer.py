from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List
import os

from .models import CandidateProfile, JobDescription, ScreeningResult, CandidateScoreDetail
from .config import EMBEDDING_MODEL_NAME

_model = None

def get_embedding_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model

def calculate_semantic_similarity(jd_text: str, resume_text: str) -> float:
    """
    Computes semantic similarity using sentence transformers and cosine similarity.
    """
    if not jd_text or not resume_text:
        return 0.0
    model = get_embedding_model()
    embeddings = model.encode([jd_text, resume_text])
    sim = cosine_similarity([embeddings[0]], [embeddings[1]])
    return float(sim[0][0])

def score_candidate(candidate: CandidateProfile, jd: JobDescription, resume_text: str) -> ScreeningResult:
    """
    Computes weighted score details and summary explanation.
    """
    # 1. Skill Match (50%)
    jd_reqs = [req.lower() for req in jd.requirements]
    c_skills = [s.lower() for s in candidate.skills]
    
    matched_skills = []
    missing_skills = []
    
    if jd_reqs:
        for req in jd_reqs:
            found = False
            for s in c_skills:
                if req in s or s in req:
                    found = True
                    break
            if found:
                matched_skills.append(req)
            else:
                missing_skills.append(req)
        raw_skill_match = len(matched_skills) / len(jd_reqs)
    else:
        raw_skill_match = 1.0
        
    skill_match_score = raw_skill_match * 100.0

    # 2. Experience Match (20%)
    if candidate.experience:
        exp_score = min(100.0, len(candidate.experience) * 20.0)
    else:
        exp_score = 0.0
        
    # 3. Education Match (10%)
    if candidate.education:
        edu_score = min(100.0, len(candidate.education) * 50.0)
    else:
        edu_score = 0.0

    # 4. Projects Match (10%)
    if candidate.projects:
        proj_score = min(100.0, len(candidate.projects) * 33.3)
    else:
        proj_score = 0.0

    # 5. Certifications Match (10%)
    if candidate.certifications:
        cert_score = min(100.0, len(candidate.certifications) * 50.0)
    else:
        cert_score = 0.0

    # Semantic similarity (sentence-transformers)
    try:
        semantic_sim = calculate_semantic_similarity(jd.description, resume_text)
    except Exception:
        semantic_sim = 0.0

    # Total Score Calculation:
    # 50% Skill Match + 20% Experience + 10% Education + 10% Projects + 10% Certifications
    weighted_score = (
        (0.50 * skill_match_score) +
        (0.20 * exp_score) +
        (0.10 * edu_score) +
        (0.10 * proj_score) +
        (0.10 * cert_score)
    )
    
    score_details = CandidateScoreDetail(
        skill_match_score=round(skill_match_score, 2),
        experience_score=round(exp_score, 2),
        education_score=round(edu_score, 2),
        projects_score=round(proj_score, 2),
        certifications_score=round(cert_score, 2),
        semantic_similarity=round(semantic_sim * 100.0, 2)
    )

    # Explanation summary (fit_summary)
    fit_reasons = []
    if skill_match_score >= 80:
        fit_reasons.append(f"Excellent skill match ({len(matched_skills)}/{len(jd_reqs)} skills matched).")
    elif skill_match_score >= 50:
        fit_reasons.append(f"Moderate skill match. Key skills matched: {', '.join(matched_skills[:3])}.")
    else:
        fit_reasons.append("Low direct skill match with required tech stack.")

    if semantic_sim >= 0.70:
        fit_reasons.append("High context semantic matching with the job profile.")
    elif semantic_sim <= 0.40:
        fit_reasons.append("Low overall relevance to the job requirements context.")

    if exp_score >= 80:
        fit_reasons.append("Strong highlight of previous career roles and achievements.")
    if cert_score > 0:
        fit_reasons.append(f"Holds {len(candidate.certifications)} relevant professional certifications.")

    fit_summary = " ".join(fit_reasons)

    if weighted_score >= 75:
        recommendation = "Strong Fit"
    elif weighted_score >= 50:
        recommendation = "Moderate Fit"
    else:
        recommendation = "No Fit"

    # Generate custom interview questions
    questions = []
    for skill in missing_skills[:2]:
        questions.append(f"Can you explain if you have any exposure to or project experience with {skill}?")
    if exp_score < 40:
        questions.append("Can you describe in detail one of your most challenging professional projects?")
    questions.append("How do your current skills align with the core requirements of this role?")

    return ScreeningResult(
        filename="",
        candidate=candidate,
        score=round(weighted_score, 2),
        matched_skills=[s.title() for s in matched_skills],
        missing_skills=[s.title() for s in missing_skills],
        score_details=score_details,
        fit_summary=fit_summary,
        recommendation=recommendation,
        interview_questions=questions
    )
