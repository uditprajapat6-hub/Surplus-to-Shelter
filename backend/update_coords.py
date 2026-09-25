from pymongo import MongoClient
db = MongoClient('mongodb+srv://s2s_backend:S2SBackend2026Secure@cluster0.xngqfcp.mongodb.net/?appName=Cluster0')['surplus_to_shelter']
db.users.update_many(
    {'role': 'SHELTER', 'address': 'jagatpura'},
    {'$set': {'address': 'Jagatpura, Jaipur, Rajasthan, India', 'latitude': 26.8208, 'longitude': 75.8368}}
)
db.users.update_many(
    {'role': 'DONOR', 'address': 'jagatpura'},
    {'$set': {'address': 'Jagatpura, Jaipur, Rajasthan, India', 'latitude': 26.8208, 'longitude': 75.8368}}
)
# Update any existing deliveries to point to Jaipur coords
db.deliveries.update_many(
    {},
    {'$set': {'dropoff_latitude': 26.8208, 'dropoff_longitude': 75.8368, 'pickup_latitude': 26.8208, 'pickup_longitude': 75.8368}}
)
db.donations.update_many(
    {},
    {'$set': {'latitude': 26.8208, 'longitude': 75.8368}}
)
print("Updated coordinates")
