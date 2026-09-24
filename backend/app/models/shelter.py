from pydantic import BaseModel
from typing import List
from app.models.donation import FoodCategory

class ShelterBase(BaseModel):
    organization_name: str
    food_needs: List[FoodCategory]
    people_served: int
    max_capacity: float
    current_capacity: float
    latitude: float
    longitude: float

class ShelterCreate(ShelterBase):
    pass

class ShelterResponse(ShelterBase):
    id: str
