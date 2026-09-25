from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from app.models.donation import DonationCreate, DonationResponse, DonationStatus
from app.database.mongodb import get_database
from app.services.geocoding import geocode_address
from app.config import settings
from app.dependencies import get_current_donor, get_current_user

router = APIRouter(prefix="/api/donations", tags=["Donations"])

@router.post("", response_model=DonationResponse)
async def create_donation(donation: DonationCreate, current_user: dict = Depends(get_current_donor)):
    donation_data = donation.model_dump()
    
    # Inject donor_id
    donation_data["donor_id"] = current_user["id"]
    
    # Geocode address if latitude and longitude are 0
    if donation_data.get("latitude") == 0 and donation_data.get("longitude") == 0:
        lat, lon = await geocode_address(donation_data.get("pickup_address", ""))
        if lat is not None and lon is not None:
            donation_data["latitude"] = lat
            donation_data["longitude"] = lon

    donation_data["status"] = DonationStatus.POSTED
    donation_data["created_at"] = datetime.now(timezone.utc)
    
    db = get_database()
    
    if db is not None:
        result = db.donations.insert_one(donation_data)
        donation_data["id"] = str(result.inserted_id)
        
    return donation_data

@router.get("", response_model=List[DonationResponse])
async def get_donations(current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    if db is not None:
        query = {}
        if current_user["role"] == "DONOR":
            query["donor_id"] = current_user["id"]
        elif current_user["role"] == "SHELTER":
            query["$or"] = [
                {"matched_shelter_id": current_user["id"]},
                {"status": "POSTED"}
            ]
            
        cursor = db.donations.find(query).sort("created_at", -1)
        donations = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            if doc.get("status") in ["DRIVER_ASSIGNED", "DRIVER_ACCEPTED", "PICKUP_STARTED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"]:
                delivery = db.deliveries.find_one({"donation_id": doc["id"]}, sort=[("created_at", -1)])
                if delivery:
                    doc["driver_incentive"] = delivery.get("incentive_amount")
                    if current_user["role"] == "DONOR":
                        doc["pickup_otp"] = delivery.get("pickup_otp")
                    elif current_user["role"] == "SHELTER":
                        doc["dropoff_otp"] = delivery.get("dropoff_otp")
            donations.append(doc)
        return donations
    return []

@router.get("/{id}", response_model=DonationResponse)
async def get_donation(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    if db is not None:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        doc = db.donations.find_one({"_id": ObjectId(id)})
        if doc:
            # Enforce authorization
            if current_user["role"] == "DONOR" and doc.get("donor_id") != current_user["id"]:
                raise HTTPException(status_code=403, detail="Not authorized")
            if current_user["role"] == "SHELTER" and doc.get("matched_shelter_id") != current_user["id"]:
                raise HTTPException(status_code=403, detail="Not authorized")
                
            doc["id"] = str(doc["_id"])
            if doc.get("status") in ["DRIVER_ASSIGNED", "DRIVER_ACCEPTED", "PICKUP_STARTED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"]:
                delivery = db.deliveries.find_one({"donation_id": doc["id"]}, sort=[("created_at", -1)])
                if delivery:
                    doc["driver_incentive"] = delivery.get("incentive_amount")
                    if current_user["role"] == "DONOR":
                        doc["pickup_otp"] = delivery.get("pickup_otp")
                    elif current_user["role"] == "SHELTER":
                        doc["dropoff_otp"] = delivery.get("dropoff_otp")
            return doc
        raise HTTPException(status_code=404, detail="Donation not found")
    raise HTTPException(status_code=500, detail="Database not connected")
