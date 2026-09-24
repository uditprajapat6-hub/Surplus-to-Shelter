from pydantic import BaseModel
from app.models.shelter import ShelterResponse

class MatchScoreDetails(BaseModel):
    distance_score: float
    capacity_score: float
    need_score: float
    expiry_urgency_score: float

class MatchCandidate(BaseModel):
    shelter: ShelterResponse
    distance_km: float
    compatibility_score: float
    score_details: MatchScoreDetails

class MatchResponse(BaseModel):
    donation_id: str
    matches: list[MatchCandidate]
