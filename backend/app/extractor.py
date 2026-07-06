import re
from typing import List
from .models import CandidateProfile

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}'

SKILL_KEYWORDS = [
    "python", "javascript", "react", "vue", "angular", "node.js", "express", 
    "fastapi", "django", "flask", "postgresql", "mysql", "mongodb", "sqlite",
    "aws", "docker", "kubernetes", "git", "html", "css", "typescript", "c++",
    "java", "spring", "rust", "go", "machine learning", "deep learning", "nlp",
    "sklearn", "pandas", "numpy", "pytorch", "tensorflow", "keras", "sql", "tableau",
    "c#", "net", "testing", "ci/cd", "devops", "cloud", "agile", "scrum"
]

EDUCATION_KEYWORDS = [
    "bachelor", "master", "phd", "degree", "university", "college", "institute", "school",
    "b.tech", "m.tech", "b.sc", "m.sc", "bca", "mca", "b.e", "m.e"
]

CERTIFICATION_KEYWORDS = [
    "certify", "certified", "certification", "aws", "microsoft", "google", "cisco", "pmp",
    "azure", "scrum master", "comptia"
]

def clean_and_split(text: str) -> List[str]:
    return [line.strip() for line in text.split('\n') if line.strip()]

def extract_candidate_info(text: str) -> CandidateProfile:
    lines = clean_and_split(text)
    
    # 1. Name: Heuristic - first non-empty line of the resume that doesn't look like contact details
    name = "Unknown"
    for line in lines[:5]:
        if "@" not in line and not any(char.isdigit() for char in line) and len(line.split()) <= 4:
            name = line
            break
            
    # 2. Email & Phone
    email_match = re.search(EMAIL_REGEX, text)
    email = email_match.group(0) if email_match else None
    
    phone_match = re.search(PHONE_REGEX, text)
    phone = phone_match.group(0) if phone_match else None

    # 3. Skills Extraction
    skills = []
    text_lower = text.lower()
    for skill in SKILL_KEYWORDS:
        pattern = rf'\b{re.escape(skill)}\b'
        if re.search(pattern, text_lower):
            skills.append(skill.upper() if len(skill) <= 3 else skill.title())
            
    # 4. Education Extraction
    education = []
    for line in lines:
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in EDUCATION_KEYWORDS):
            if len(line) < 150:
                education.append(line)
                
    # 5. Experience Extraction
    experience = []
    is_exp_section = False
    for line in lines:
        line_upper = line.upper()
        if any(keyword in line_upper for keyword in ["EXPERIENCE", "WORK HISTORY", "EMPLOYMENT", "CAREER HISTORY"]):
            is_exp_section = True
            continue
        if is_exp_section and any(keyword in line_upper for keyword in ["EDUCATION", "PROJECTS", "SKILLS", "CERTIFICATIONS", "AWARDS"]):
            is_exp_section = False
            
        if is_exp_section:
            if len(experience) < 10 and len(line) > 10:
                experience.append(line)

    # 6. Projects Extraction
    projects = []
    is_proj_section = False
    for line in lines:
        line_upper = line.upper()
        if any(keyword in line_upper for keyword in ["PROJECTS", "PERSONAL PROJECTS", "ACADEMIC PROJECTS"]):
            is_proj_section = True
            continue
        if is_proj_section and any(keyword in line_upper for keyword in ["EDUCATION", "EXPERIENCE", "SKILLS", "CERTIFICATIONS", "WORK HISTORY"]):
            is_proj_section = False
            
        if is_proj_section:
            if len(projects) < 10 and len(line) > 10:
                projects.append(line)

    # 7. Certifications
    certifications = []
    for line in lines:
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in CERTIFICATION_KEYWORDS):
            if len(line) < 150 and not any(x in line.upper() for x in ["EXPERIENCE", "PROJECTS"]):
                certifications.append(line)

    return CandidateProfile(
        name=name,
        email=email,
        phone=phone,
        skills=skills,
        experience=experience,
        education=education,
        projects=projects,
        certifications=certifications
    )
