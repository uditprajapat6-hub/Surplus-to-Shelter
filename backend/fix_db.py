from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb+srv://s2s_backend:S2SBackend2026Secure@cluster0.xngqfcp.mongodb.net/?appName=Cluster0')
db = client['surplus_to_shelter']

for delivery in db.deliveries.find({'pickup_latitude': None}):
    donation = db.donations.find_one({'_id': ObjectId(delivery['donation_id'])}) if 'donation_id' in delivery and len(str(delivery['donation_id'])) == 24 else None
            
    p_lat = donation.get('latitude', 28.6139) if donation else 28.6139
    p_lon = donation.get('longitude', 77.2090) if donation else 77.2090
    
    db.deliveries.update_one(
        {'_id': delivery['_id']},
        {'$set': {
            'pickup_latitude': p_lat,
            'pickup_longitude': p_lon,
            'dropoff_latitude': 28.5355,
            'dropoff_longitude': 77.3910,
            'pickup_otp': '1234',
            'dropoff_otp': '5678'
        }}
    )
    print('Updated delivery')
