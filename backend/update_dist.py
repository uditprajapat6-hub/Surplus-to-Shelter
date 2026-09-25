import math
from pymongo import MongoClient
db = MongoClient('mongodb+srv://s2s_backend:S2SBackend2026Secure@cluster0.xngqfcp.mongodb.net/?appName=Cluster0')['surplus_to_shelter']

for d in db.deliveries.find():
    if d.get('pickup_latitude') and d.get('dropoff_latitude'):
        lat1 = math.radians(d['pickup_latitude'])
        lon1 = math.radians(d['pickup_longitude'])
        lat2 = math.radians(d['dropoff_latitude'])
        lon2 = math.radians(d['dropoff_longitude'])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = round(6371 * c, 1)
        db.deliveries.update_one({'_id': d['_id']}, {'$set': {'distance_km': distance}})
