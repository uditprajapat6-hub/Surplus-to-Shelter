from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class DeliveryStatus(str, Enum):
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"

class DeliveryBase(BaseModel):
    donation_id: str
    shelter_id: str
    driver_id: str
    pickup_address: str
    dropoff_address: str
    distance_km: float

class DeliveryCreate(DeliveryBase):
    pass

class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus

class DeliveryResponse(DeliveryBase):
    id: str
    status: DeliveryStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
