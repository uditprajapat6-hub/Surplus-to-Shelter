import httpx
import logging

logger = logging.getLogger(__name__)

async def geocode_address(address: str) -> tuple[float, float]:
    """
    Geocodes an address to latitude and longitude using Nominatim (OpenStreetMap).
    Returns a tuple of (latitude, longitude).
    If geocoding fails, returns (None, None).
    """
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": address,
            "format": "json",
            "limit": 1
        }
        headers = {
            "User-Agent": "SurplusToShelterHackathonApp/1.0"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                logger.info(f"Geocoded '{address}' to {lat}, {lon}")
                return lat, lon
            logger.warning(f"No results found for address: {address}")
    except Exception as e:
        logger.error(f"Geocoding failed for '{address}': {e}")
    
    return None, None
