from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from bson import ObjectId
import random

from app.models.delivery import DeliveryCreate, DeliveryResponse, DeliveryStatusUpdate, DeliveryStatus
from app.database.mongodb import get_database
from app.dependencies import get_current_user, get_current_driver

router = APIRouter(prefix="/api/deliveries", tags=["Deliveries"])

@router.post("", response_model=DeliveryResponse)
async def create_delivery(delivery: DeliveryCreate, current_user: dict = Depends(get_current_user)):
    delivery_data = delivery.model_dump()
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    # Auto-assign an available driver
    if not delivery_data.get("driver_id"):
        available_driver = db.users.find_one({"role": "DRIVER", "is_available": True})
        if available_driver:
            delivery_data["driver_id"] = str(available_driver["_id"])
        else:
            raise HTTPException(status_code=400, detail="No active drivers are currently available to pick up this donation. Please try again later.")

    delivery_data["status"] = "ASSIGNED"
    
    # Generate OTPs
    delivery_data["pickup_otp"] = str(random.randint(1000, 9999))
    delivery_data["dropoff_otp"] = str(random.randint(1000, 9999))
    
    # Calculate distance using Haversine formula
    if not delivery_data.get("distance_km") and delivery_data.get("pickup_latitude") and delivery_data.get("dropoff_latitude"):
        import math
        lat1 = math.radians(delivery_data["pickup_latitude"])
        lon1 = math.radians(delivery_data["pickup_longitude"])
        lat2 = math.radians(delivery_data["dropoff_latitude"])
        lon2 = math.radians(delivery_data["dropoff_longitude"])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = 6371 * c
        delivery_data["distance_km"] = round(distance, 1)
        
    # Calculate incentive amount: base ₹20 + ₹5 per km
    dist = delivery_data.get("distance_km", 0)
    delivery_data["incentive_amount"] = round(20 + (5 * dist), 2)
        
    now = datetime.now(timezone.utc)
    delivery_data["created_at"] = now
    delivery_data["updated_at"] = now
    
    result = db.deliveries.insert_one(delivery_data)
    delivery_data["id"] = str(result.inserted_id)
    
    # Also update the donation status and matched shelter
    db.donations.update_one(
        {"_id": ObjectId(delivery.donation_id)},
        {"$set": {
            "status": "DRIVER_ASSIGNED",
            "matched_shelter_id": delivery_data.get("shelter_id")
        }}
    )
    return delivery_data

@router.get("", response_model=List[DeliveryResponse])
async def get_all_deliveries(current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is not None:
        query = {}
        if current_user["role"] == "DRIVER":
            query["driver_id"] = current_user["id"]
        elif current_user["role"] == "SHELTER":
            query["shelter_id"] = current_user["id"]
            
        cursor = db.deliveries.find(query).sort("created_at", -1)
        deliveries = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            
            # Fetch associated donation details
            donation = db.donations.find_one({"_id": ObjectId(doc["donation_id"])})
            if donation:
                doc["food_name"] = donation.get("food_name")
                doc["quantity"] = donation.get("quantity")
                doc["unit"] = donation.get("unit")
                doc["food_category"] = donation.get("food_category")
                
            deliveries.append(doc)
        return deliveries
    raise HTTPException(status_code=500, detail="Database not connected")

@router.get("/{id}", response_model=DeliveryResponse)
async def get_delivery(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is not None:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        doc = db.deliveries.find_one({"_id": ObjectId(id)})
        if doc:
            doc["id"] = str(doc["_id"])
            
            # Fetch associated donation details
            donation = db.donations.find_one({"_id": ObjectId(doc["donation_id"])})
            if donation:
                doc["food_name"] = donation.get("food_name")
                doc["quantity"] = donation.get("quantity")
                doc["unit"] = donation.get("unit")
                doc["food_category"] = donation.get("food_category")
                
            return doc
        raise HTTPException(status_code=404, detail="Delivery not found")
    raise HTTPException(status_code=500, detail="Database not connected")

@router.put("/{id}/status", response_model=DeliveryResponse)
async def update_delivery_status(id: str, status_update: DeliveryStatusUpdate, current_user: dict = Depends(get_current_driver)):
    db = get_database()
    now = datetime.now(timezone.utc)
    
    if db is not None:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid ID format")
            
        # Verify driver owns this
        existing = db.deliveries.find_one({"_id": ObjectId(id)})
        if not existing or existing.get("driver_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        # OTP Validation
        if status_update.status == DeliveryStatus.PICKED_UP:
            if existing.get("pickup_otp") and status_update.otp != existing.get("pickup_otp"):
                raise HTTPException(status_code=400, detail="Invalid Pickup OTP")
        elif status_update.status == DeliveryStatus.DELIVERED:
            if existing.get("dropoff_otp") and status_update.otp != existing.get("dropoff_otp"):
                raise HTTPException(status_code=400, detail="Invalid Dropoff OTP")

        result = db.deliveries.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"status": status_update.status, "updated_at": now}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Delivery not found or status identical")
            
        # Update donation status automatically based on delivery status
        donation_status_map = {
            DeliveryStatus.ACCEPTED: "DRIVER_ACCEPTED",
            DeliveryStatus.PICKUP_STARTED: "PICKUP_STARTED",
            DeliveryStatus.PICKED_UP: "PICKED_UP",
            DeliveryStatus.OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
            DeliveryStatus.DELIVERED: "DELIVERED",
            DeliveryStatus.CANCELLED: "MATCHED"
        }
        
        if status_update.status in donation_status_map:
            db.donations.update_one(
                {"_id": ObjectId(existing["donation_id"])},
                {"$set": {"status": donation_status_map[status_update.status]}}
            )
            
        doc = db.deliveries.find_one({"_id": ObjectId(id)})
        doc["id"] = str(doc["_id"])
        
        # Fetch associated donation details
        donation = db.donations.find_one({"_id": ObjectId(doc["donation_id"])})
        if donation:
            doc["food_name"] = donation.get("food_name")
            doc["quantity"] = donation.get("quantity")
            doc["unit"] = donation.get("unit")
            doc["food_category"] = donation.get("food_category")
            
        return doc
    raise HTTPException(status_code=500, detail="Database not connected")
