from pydantic import BaseModel, Field
from typing import List, Optional
from app.models.donation import FoodCategory

class ShelterBase(BaseModel):
    name: Optional[str] = Field(None, alias="organization_name")
    organization_name: Optional[str] = None
    food_needs: Optional[List[str]] = []
    people_served: Optional[int] = 0
    max_capacity: Optional[float] = 100.0
    current_capacity: Optional[float] = 0.0
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    address: Optional[str] = None

class ShelterCreate(ShelterBase):
    pass

class ShelterResponse(ShelterBase):
    id: str

    class Config:
        populate_by_name = True
