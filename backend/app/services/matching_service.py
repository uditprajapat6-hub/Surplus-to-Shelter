import math
from datetime import datetime, timezone
from app.models.donation import DonationResponse
from app.models.shelter import ShelterResponse
from app.models.match import MatchCandidate, MatchScoreDetails

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula for distance in km
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_suitability(donation: DonationResponse, shelter: ShelterResponse) -> MatchCandidate:
    # 1. Distance Score (Closer is better, max 30km radius for score)
    dist_km = calculate_distance(donation.latitude, donation.longitude, shelter.latitude, shelter.longitude)
    distance_score = max(0, 100 - (dist_km * 3)) # Lose 3 points per km
    
    # 2. Capacity Score (Does shelter have room?)
    available_capacity = shelter.max_capacity - shelter.current_capacity
    if available_capacity >= donation.quantity:
        capacity_score = 100.0
    else:
        # Partial capacity fit
        capacity_score = (available_capacity / donation.quantity) * 100.0 if donation.quantity > 0 else 0

    # 3. Need Score (Does shelter want this food type?)
    need_score = 100.0 if donation.food_category in shelter.food_needs else 20.0
    
    # 4. Expiry Urgency Score
    # If it expires soon, we prioritize shelters that can accept immediately (distance becomes more important)
    hours_to_expiry = (donation.expiry_time - datetime.now(timezone.utc)).total_seconds() / 3600.0
    if hours_to_expiry < 2:
        expiry_urgency_score = 100.0
    elif hours_to_expiry < 12:
        expiry_urgency_score = 80.0
    else:
        expiry_urgency_score = 50.0

    # Weighted Suitability Score
    # Distance: 30%, Capacity: 30%, Need: 30%, Expiry: 10%
    overall_score = (distance_score * 0.3) + (capacity_score * 0.3) + (need_score * 0.3) + (expiry_urgency_score * 0.1)

    return MatchCandidate(
        shelter=shelter,
        distance_km=round(dist_km, 2),
        compatibility_score=round(overall_score, 1),
        score_details=MatchScoreDetails(
            distance_score=round(distance_score, 1),
            capacity_score=round(capacity_score, 1),
            need_score=round(need_score, 1),
            expiry_urgency_score=round(expiry_urgency_score, 1)
        )
    )

def find_best_matches(donation: DonationResponse, shelters: list[ShelterResponse]) -> list[MatchCandidate]:
    candidates = []
    for shelter in shelters:
        candidate = calculate_suitability(donation, shelter)
        # Filter out completely incompatible ones (e.g. 0 capacity score or score < 40)
        if candidate.compatibility_score > 40:
            candidates.append(candidate)
            
    # Sort by highest score
    candidates.sort(key=lambda x: x.compatibility_score, reverse=True)
    return candidates
