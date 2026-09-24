from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class FoodCategory(str, Enum):
    COOKED_MEALS = "Cooked meals"
    FRUITS = "Fruits"
    VEGETABLES = "Vegetables"
    BAKERY = "Bakery"
    PACKAGED_FOOD = "Packaged food"
    OTHER = "Other"

class DonationStatus(str, Enum):
    POSTED = "POSTED"
    MATCHED = "MATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    EXPIRED = "EXPIRED"

class DonationBase(BaseModel):
    food_name: str
    food_category: FoodCategory
    quantity: float
    unit: str
    preparation_time: datetime
    expiry_time: datetime
    is_vegetarian: bool
    allergens: List[str] = []
    pickup_address: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    image_url: Optional[str] = None

class DonationCreate(DonationBase):
    pass

class DonationResponse(DonationBase):
    id: str
    status: DonationStatus = DonationStatus.POSTED
    created_at: datetime

    class Config:
        populate_by_name = True
