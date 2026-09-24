from fastapi import APIRouter, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime, timezone

from app.models.match import MatchResponse, MatchCandidate
from app.routes.donations import get_donation, MOCK_DONATIONS
from app.routes.shelters import get_shelters
from app.services.matching_service import find_best_matches
from app.database.mongodb import get_database
from app.config import settings

router = APIRouter(prefix="/api/matching", tags=["Matching"])

@router.post("/{donation_id}", response_model=MatchResponse)
async def generate_matches(donation_id: str):
    # Fetch donation
    donation = await get_donation(donation_id)
    
    # Fetch all shelters
    shelters = await get_shelters()
    
    # Calculate matches
    candidates = find_best_matches(donation, shelters)
    
    # Return top 5 matches
    return MatchResponse(
        donation_id=donation_id,
        matches=candidates[:5]
    )

@router.post("/{donation_id}/auto-match", response_model=MatchCandidate)
async def auto_match_donation(donation_id: str):
    donation = await get_donation(donation_id)
    shelters = await get_shelters()
    candidates = find_best_matches(donation, shelters)
    
    if not candidates:
        raise HTTPException(status_code=404, detail="No suitable shelters found")
        
    best_match = candidates[0]
    
    db = get_database()
    if db is not None and not settings.USE_MOCK_DATA:
        db.donations.update_one(
            {"_id": ObjectId(donation_id)},
            {"$set": {
                "status": "MATCHED", 
                "matched_shelter_id": best_match.shelter.id,
                "match_score": best_match.compatibility_score
            }}
        )
    else:
        for doc in MOCK_DONATIONS:
            if doc["id"] == donation_id:
                doc["status"] = "MATCHED"
                doc["matched_shelter_id"] = best_match.shelter.id
                doc["match_score"] = best_match.compatibility_score
                
    return best_match
