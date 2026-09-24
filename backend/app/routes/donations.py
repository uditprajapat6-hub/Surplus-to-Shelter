from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from app.models.donation import DonationCreate, DonationResponse, DonationStatus
from app.database.mongodb import get_database
from app.config import settings

router = APIRouter(prefix="/api/donations", tags=["Donations"])

# Mock data store for demo mode
MOCK_DONATIONS = []

@router.post("", response_model=DonationResponse)
async def create_donation(donation: DonationCreate):
    donation_data = donation.model_dump()
    donation_data["status"] = DonationStatus.POSTED
    donation_data["created_at"] = datetime.now(timezone.utc)
    
    db = get_database()
    
    if db is not None and not settings.USE_MOCK_DATA:
        result = db.donations.insert_one(donation_data)
        donation_data["id"] = str(result.inserted_id)
    else:
        # Mock mode
        donation_data["id"] = str(ObjectId())
        MOCK_DONATIONS.append(donation_data)
        
    return donation_data

@router.get("", response_model=List[DonationResponse])
async def get_donations():
    db = get_database()
    
    if db is not None and not settings.USE_MOCK_DATA:
        cursor = db.donations.find().sort("created_at", -1)
        donations = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            donations.append(doc)
        return donations
    else:
        # Mock mode
        return MOCK_DONATIONS

@router.get("/{id}", response_model=DonationResponse)
async def get_donation(id: str):
    db = get_database()
    
    if db is not None and not settings.USE_MOCK_DATA:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        doc = db.donations.find_one({"_id": ObjectId(id)})
        if doc:
            doc["id"] = str(doc["_id"])
            return doc
        raise HTTPException(status_code=404, detail="Donation not found")
    else:
        # Mock mode
        for doc in MOCK_DONATIONS:
            if doc["id"] == id:
                return doc
        raise HTTPException(status_code=404, detail="Donation not found")
