import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List

from .models import JobDescription, ScreeningResult
from .parser import parse_document
from .extractor import extract_candidate_info
from .scorer import score_candidate
from .utils import ensure_directory_exists, export_results
from .config import UPLOAD_DIR, OUTPUT_DIR

ALLOWED_JD_EXTENSIONS = ["pdf", "txt"]
ALLOWED_RESUME_EXTENSIONS = ["pdf", "docx", "doc", "txt"]

def is_allowed_file(filename: str, allowed_extensions: List[str]) -> bool:
    return filename.split('.')[-1].lower() in allowed_extensions

app = FastAPI(title="Rooman AI Resume Screening Agent API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ensure_directory_exists(UPLOAD_DIR)
ensure_directory_exists(OUTPUT_DIR)

# Stateful memory for current session
session_state = {
    "jd_text": "",
    "jd_requirements": [],
    "jd_title": "Default Job Profile",
    "resumes_list": [] # holds tuples of (filename, file_bytes)
}

@app.get("/")
def home():
    """
    GET / endpoint verifying backend status.
    """
    return {"message": "Resume Screening Agent Running"}

@app.post("/upload-jd")
async def upload_jd(file: UploadFile = File(...)):
    """
    POST /upload-jd: Receives job description file, parses text, and saves to upload folder.
    """
    if not is_allowed_file(file.filename, ALLOWED_JD_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Job description must be a PDF or TXT file.")

    ensure_directory_exists(UPLOAD_DIR)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        parsed_text = parse_document(file.filename, content)
        
        # Save to state
        session_state["jd_text"] = parsed_text
        session_state["jd_title"] = file.filename.split('.')[0].replace('-', ' ').title()
        
        # Simple extraction of requirements from text by seeking common skills
        # This will form the matching targets for candidate evaluation
        from .extractor import SKILL_KEYWORDS
        reqs = []
        parsed_lower = parsed_text.lower()
        for skill in SKILL_KEYWORDS:
            import re
            pattern = rf'\b{re.escape(skill)}\b'
            if re.search(pattern, parsed_lower):
                reqs.append(skill.upper() if len(skill) <= 3 else skill.title())
        session_state["jd_requirements"] = reqs
        
        return {
            "filename": file.filename,
            "title": session_state["jd_title"],
            "requirements": reqs,
            "text": parsed_text[:500] + "..." if len(parsed_text) > 500 else parsed_text
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing job description: {str(e)}")

@app.post("/upload-resumes")
async def upload_resumes(files: List[UploadFile] = File(...)):
    """
    POST /upload-resumes: Receives multiple resume files, saves them, and adds them to processing list.
    """
    ensure_directory_exists(UPLOAD_DIR)
    uploaded = []
    
    # Reset resumes state to let the user perform new analyses
    session_state["resumes_list"] = []
    
    for file in files:
        if not is_allowed_file(file.filename, ALLOWED_RESUME_EXTENSIONS):
            continue

        file_path = os.path.join(UPLOAD_DIR, file.filename)
        try:
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Store in session state
            session_state["resumes_list"].append((file.filename, content))
            uploaded.append(file.filename)
        except Exception:
            # Continue on error if a single resume fails
            continue
            
    return {"message": f"Successfully uploaded {len(uploaded)} resumes", "files": uploaded}

@app.post("/analyze", response_model=List[ScreeningResult])
async def analyze():
    """
    POST /analyze: Matches currently uploaded resumes against the current JD and exports results.
    """
    if not session_state["jd_text"]:
        raise HTTPException(status_code=400, detail="No Job Description uploaded. Please upload a JD first.")
    
    if not session_state["resumes_list"]:
        raise HTTPException(status_code=400, detail="No resumes uploaded. Please upload resumes first.")
        
    jd = JobDescription(
        title=session_state["jd_title"],
        description=session_state["jd_text"],
        requirements=session_state["jd_requirements"]
    )
    
    results = []
    for filename, content in session_state["resumes_list"]:
        try:
            # Parse text from resume bytes
            parsed_text = parse_document(filename, content)
            # Extract structured details
            profile = extract_candidate_info(parsed_text)
            # Calculate match score against JD
            screen_res = score_candidate(profile, jd, parsed_text)
            screen_res.filename = filename
            results.append(screen_res)
        except Exception as e:
            # Print or log error, keep going
            print(f"Error parsing/screening {filename}: {e}")
            
    if not results:
        raise HTTPException(status_code=500, detail="Failed to process any of the uploaded resumes.")
        
    # Sort descending by score
    results = sorted(results, key=lambda x: x.score, reverse=True)
    
    # Export results to output dir
    export_results(results)
    
    return results

@app.get("/download/csv")
def download_csv():
    """
    GET /download/csv: Downloads the generated ranked candidates CSV.
    """
    csv_path = os.path.join(OUTPUT_DIR, "ranked_candidates.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="CSV file not found. Run analyze first.")
    return FileResponse(csv_path, media_type="text/csv", filename="ranked_candidates.csv")

@app.get("/download/json")
def download_json():
    """
    GET /download/json: Downloads the generated ranked candidates JSON.
    """
    json_path = os.path.join(OUTPUT_DIR, "ranked_candidates.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="JSON file not found. Run analyze first.")
    return FileResponse(json_path, media_type="application/json", filename="ranked_candidates.json")
