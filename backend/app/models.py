from pydantic import BaseModel, Field
from typing import List, Optional

class CandidateProfile(BaseModel):
    """
    Holds structured extraction details from a candidate's resume.
    """
    name: Optional[str] = Field(default="Unknown", description="Candidate full name")
    email: Optional[str] = Field(default=None, description="Email address")
    phone: Optional[str] = Field(default=None, description="Contact phone number")
    skills: List[str] = Field(default_factory=list, description="Extracted skills")
    experience: List[str] = Field(default_factory=list, description="Professional experience details")
    education: List[str] = Field(default_factory=list, description="Academic history")
    projects: List[str] = Field(default_factory=list, description="Personal or professional projects")
    certifications: List[str] = Field(default_factory=list, description="Certifications and licenses")

class JobDescription(BaseModel):
    """
    Represents the analyzed job description criteria.
    """
    title: str = Field(..., description="Job Title")
    description: str = Field("", description="Full job description text")
    requirements: List[str] = Field(default_factory=list, description="Extracted requirements or key skills from matching")

class CandidateScoreDetail(BaseModel):
    """
    Breakdown of candidate scoring mechanism.
    """
    skill_match_score: float = Field(..., description="Weighted Skill match score (50%)")
    experience_score: float = Field(..., description="Weighted Experience match score (20%)")
    education_score: float = Field(..., description="Weighted Education match score (10%)")
    projects_score: float = Field(..., description="Weighted Projects match score (10%)")
    certifications_score: float = Field(..., description="Weighted Certifications match score (10%)")
    semantic_similarity: float = Field(..., description="Raw Semantic Similarity between JD and resume text")

class ScreeningResult(BaseModel):
    """
    The final output of screening analysis for a candidate.
    """
    filename: str = Field(..., description="Resume filename")
    candidate: CandidateProfile = Field(..., description="Candidate parsed information")
    score: float = Field(..., description="Total combined score (0 - 100)")
    matched_skills: List[str] = Field(..., description="List of matched skills")
    missing_skills: List[str] = Field(..., description="List of missing skills from JD")
    score_details: CandidateScoreDetail = Field(..., description="Weighted score breakdown")
    fit_summary: str = Field(..., description="Explanation of WHY the candidate received this score")
    recommendation: str = Field(..., description="Actionable recommendation (e.g. Strong Fit, Moderate Fit, No Fit)")
    interview_questions: List[str] = Field(default_factory=list, description="Generated interview questions based on missing skills or summary")
