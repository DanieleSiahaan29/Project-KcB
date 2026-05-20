import asyncio
import json
from services.overpass import search_nearby_place

print("Testing Overpass API directly...")
async def test():
    results = await search_nearby_place(-6.2088, 106.8456, "indomaret", 1000)
    print(results)

asyncio.run(test())
