
from pymongo import MongoClient
from bson import ObjectId
db = MongoClient('mongodb+srv://s2s_backend:S2SBackend2026Secure@cluster0.xngqfcp.mongodb.net/?appName=Cluster0')['surplus_to_shelter']
d = db.deliveries.find().sort('created_at', -1)[0]
donation_id = ObjectId(d['donation_id']) if isinstance(d['donation_id'], str) else d['donation_id']
db.donations.update_one({'_id': donation_id}, {'$set': {'matched_shelter_id': d['shelter_id']}})
print('Fixed!')

