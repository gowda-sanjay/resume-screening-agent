import os
import pandas as pd
import json
from typing import List
from .models import ScreeningResult
from .config import OUTPUT_DIR

def ensure_directory_exists(directory_path: str):
    if not os.path.exists(directory_path):
        os.makedirs(directory_path, exist_ok=True)

def export_results(results: List[ScreeningResult]) -> tuple[str, str]:
    """
    Exports ranked screening results to CSV and JSON formats.
    Returns absolute paths to the exported files.
    """
    ensure_directory_exists(OUTPUT_DIR)
    
    # Sort results by score descending
    sorted_results = sorted(results, key=lambda x: x.score, reverse=True)
    
    # Generate JSON
    json_path = os.path.join(OUTPUT_DIR, "ranked_candidates.json")
    serialized_results = []
    for rank, result in enumerate(sorted_results, 1):
        result_data = result.dict()
        result_data["rank"] = rank
        serialized_results.append(result_data)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(serialized_results, f, indent=2, ensure_ascii=False)
        
    # Generate CSV
    csv_path = os.path.join(OUTPUT_DIR, "ranked_candidates.csv")
    csv_data = []
    for rank, res in enumerate(sorted_results, 1):
        csv_data.append({
            "Rank": rank,
            "Candidate Name": res.candidate.name,
            "Email": res.candidate.email,
            "Phone": res.candidate.phone,
            "Score": res.score,
            "Matched Skills": ", ".join(res.matched_skills),
            "Missing Skills": ", ".join(res.missing_skills),
            "Recommendation": res.recommendation,
            "Fit Summary": res.fit_summary
        })
        
    df = pd.DataFrame(csv_data)
    df.to_csv(csv_path, index=False)
    
    return csv_path, json_path
