from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from datetime import datetime, timezone

from app.models.match import MatchResponse, MatchCandidate
from app.models.donation import DonationResponse
from app.models.shelter import ShelterResponse
from app.routes.donations import get_donation
from app.routes.shelters import get_shelters
from app.services.matching_service import find_best_matches
from app.database.mongodb import get_database
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/matching", tags=["Matching"])

@router.post("/{donation_id}", response_model=MatchResponse)
async def generate_matches(donation_id: str, current_user: dict = Depends(get_current_user)):
    donation_dict = await get_donation(donation_id, current_user)
    shelters_dicts = await get_shelters(current_user)
    
    donation = DonationResponse(**donation_dict)
    shelters = [ShelterResponse(**s) for s in shelters_dicts]
    
    candidates = find_best_matches(donation, shelters)
    
    return MatchResponse(
        donation_id=donation_id,
        matches=candidates[:5]
    )

@router.post("/{donation_id}/auto-match", response_model=MatchCandidate)
async def auto_match_donation(donation_id: str, current_user: dict = Depends(get_current_user)):
    donation_dict = await get_donation(donation_id, current_user)
    shelters_dicts = await get_shelters(current_user)
    
    donation = DonationResponse(**donation_dict)
    shelters = [ShelterResponse(**s) for s in shelters_dicts]
    
    candidates = find_best_matches(donation, shelters)
    
    if not candidates:
        raise HTTPException(status_code=404, detail="No suitable shelters found")
        
    best_match = candidates[0]
    
    db = get_database()
    if db is not None:
        db.donations.update_one(
            {"_id": ObjectId(donation_id)},
            {"$set": {
                "status": "MATCHED", 
                "matched_shelter_id": best_match.shelter.id,
                "match_score": best_match.compatibility_score
            }}
        )
        return best_match
    raise HTTPException(status_code=500, detail="Database not connected")
