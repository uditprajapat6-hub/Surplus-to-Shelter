from fastapi import APIRouter, HTTPException
from typing import List

from app.models.match import MatchResponse, MatchCandidate
from app.routes.donations import get_donation
from app.routes.shelters import get_shelters
from app.services.matching_service import find_best_matches

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
