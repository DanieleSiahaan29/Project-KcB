import asyncio
from main import app, WaypointRequest, parse_waypoint
import json

async def test():
    req = WaypointRequest(
        prompt="Dari Monas ke Semanggi singgah Indomaret terdekat",
        landmarks=[{"name": "Monas", "category": "landmark", "id": "1", "node_id": "n1"}],
        origin_lat=-6.1754, origin_lng=106.8272,
        dest_lat=-6.2146, dest_lng=106.8145,
        graph_nodes={"n1": {"lat": -6.1754, "lng": 106.8272}}
    )
    try:
        res = await parse_waypoint(req)
        print(json.dumps(res, indent=2))
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
