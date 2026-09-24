from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from app.models.delivery import DeliveryCreate, DeliveryResponse, DeliveryStatusUpdate, DeliveryStatus
from app.database.mongodb import get_database
from app.config import settings

router = APIRouter(prefix="/api/deliveries", tags=["Deliveries"])

# Mock data for Demo Mode
MOCK_DELIVERIES = []

@router.post("", response_model=DeliveryResponse)
async def create_delivery(delivery: DeliveryCreate):
    delivery_data = delivery.model_dump()
    delivery_data["status"] = DeliveryStatus.ASSIGNED
    now = datetime.now(timezone.utc)
    delivery_data["created_at"] = now
    delivery_data["updated_at"] = now
    
    db = get_database()
    
    if db is not None and not settings.USE_MOCK_DATA:
        result = db.deliveries.insert_one(delivery_data)
        delivery_data["id"] = str(result.inserted_id)
        
        # Also update the donation status to DRIVER_ASSIGNED
        db.donations.update_one(
            {"_id": ObjectId(delivery.donation_id)},
            {"$set": {"status": "DRIVER_ASSIGNED"}}
        )
    else:
        # Mock mode
        delivery_data["id"] = str(ObjectId())
        MOCK_DELIVERIES.append(delivery_data)
        
    return delivery_data

@router.get("", response_model=List[DeliveryResponse])
async def get_all_deliveries():
    db = get_database()
    if db is not None and not settings.USE_MOCK_DATA:
        cursor = db.deliveries.find().sort("created_at", -1)
        deliveries = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            deliveries.append(doc)
        return deliveries
    return MOCK_DELIVERIES

@router.get("/{id}", response_model=DeliveryResponse)
async def get_delivery(id: str):
    db = get_database()
    if db is not None and not settings.USE_MOCK_DATA:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        doc = db.deliveries.find_one({"_id": ObjectId(id)})
        if doc:
            doc["id"] = str(doc["_id"])
            return doc
        raise HTTPException(status_code=404, detail="Delivery not found")
    else:
        for d in MOCK_DELIVERIES:
            if d["id"] == id:
                return d
        raise HTTPException(status_code=404, detail="Delivery not found")

@router.put("/{id}/status", response_model=DeliveryResponse)
async def update_delivery_status(id: str, status_update: DeliveryStatusUpdate):
    db = get_database()
    now = datetime.now(timezone.utc)
    
    if db is not None and not settings.USE_MOCK_DATA:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid ID format")
            
        result = db.deliveries.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"status": status_update.status, "updated_at": now}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Delivery not found or status identical")
            
        # If delivered, update donation status too
        if status_update.status == DeliveryStatus.DELIVERED:
            delivery = db.deliveries.find_one({"_id": ObjectId(id)})
            if delivery:
                db.donations.update_one(
                    {"_id": ObjectId(delivery["donation_id"])},
                    {"$set": {"status": "DELIVERED"}}
                )
            
        doc = db.deliveries.find_one({"_id": ObjectId(id)})
        doc["id"] = str(doc["_id"])
        return doc
    else:
        for d in MOCK_DELIVERIES:
            if d["id"] == id:
                d["status"] = status_update.status
                d["updated_at"] = now
                return d
        raise HTTPException(status_code=404, detail="Delivery not found")
