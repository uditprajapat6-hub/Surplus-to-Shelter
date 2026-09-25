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
    MATCHING = "MATCHING"
    MATCHED = "MATCHED"
    SHELTER_ACCEPTED = "SHELTER_ACCEPTED"
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED"
    DRIVER_ACCEPTED = "DRIVER_ACCEPTED"
    PICKUP_STARTED = "PICKUP_STARTED"
    PICKED_UP = "PICKED_UP"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

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
    estimated_servings: Optional[int] = None
    pickup_available_from: Optional[datetime] = None
    pickup_available_until: Optional[datetime] = None
    packaging_condition: Optional[str] = "GOOD"

class DonationCreate(DonationBase):
    pass

class DonationResponse(DonationBase):
    id: str
    status: DonationStatus = DonationStatus.POSTED
    created_at: datetime
    matched_shelter_id: Optional[str] = None
    match_score: Optional[float] = None
    pickup_otp: Optional[str] = None
    dropoff_otp: Optional[str] = None
    driver_incentive: Optional[float] = None

    class Config:
        populate_by_name = True
