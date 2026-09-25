from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class DeliveryStatus(str, Enum):
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    PICKUP_STARTED = "PICKUP_STARTED"
    PICKED_UP = "PICKED_UP"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class DeliveryBase(BaseModel):
    donation_id: str
    shelter_id: str
    pickup_address: str
    dropoff_address: str
    driver_id: Optional[str] = None
    distance_km: Optional[float] = 0.0
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    dropoff_latitude: Optional[float] = None
    dropoff_longitude: Optional[float] = None
    pickup_otp: Optional[str] = None
    dropoff_otp: Optional[str] = None
    incentive_amount: Optional[float] = 0.0

class DeliveryCreate(DeliveryBase):
    pass

class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus
    otp: Optional[str] = None

class DeliveryResponse(DeliveryBase):
    id: str
    status: DeliveryStatus
    created_at: datetime
    updated_at: datetime
    
    # Injected from associated donation
    food_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    food_category: Optional[str] = None

    class Config:
        populate_by_name = True
