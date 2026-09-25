from pymongo import MongoClient
from app.models.delivery import DeliveryResponse
import traceback

client = MongoClient('mongodb+srv://s2s_backend:S2SBackend2026Secure@cluster0.xngqfcp.mongodb.net/?appName=Cluster0')
db = client['surplus_to_shelter']

errors = 0
for doc in db.deliveries.find():
    doc['id'] = str(doc['_id'])
    try:
        DeliveryResponse(**doc)
    except Exception as e:
        print('Error on delivery', doc['id'])
        traceback.print_exc()
        errors += 1
print('Total errors:', errors)
