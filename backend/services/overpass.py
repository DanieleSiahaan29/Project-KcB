"""
Overpass API Service
Mencari tempat-tempat di sekitar rute menggunakan OpenStreetMap Overpass API.
"""
import math
import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
TIMEOUT_SEC  = 5

# Mapping kategori bahasa natural → OSM tags
CATEGORY_MAP = {
    "indomaret":   '[name~"Indomaret",i][shop=convenience]',
    "alfamart":    '[name~"Alfamart",i][shop=convenience]',
    "minimarket":  '[shop=convenience]',
    "supermarket": '[shop=supermarket]',
    "cafe":        '[amenity=cafe]',
    "kopi":        '[amenity=cafe]',
    "coffee":      '[amenity=cafe]',
    "restoran":    '[amenity=restaurant]',
    "restaurant":  '[amenity=restaurant]',
    "makan":       '[amenity=restaurant]',
    "mcd":         '[name~"McDonald",i][amenity=fast_food]',
    "fastfood":    '[amenity=fast_food]',
    "apotek":      '[amenity=pharmacy]',
    "pharmacy":    '[amenity=pharmacy]',
    "apotik":      '[amenity=pharmacy]',
    "atm":         '[amenity=atm]',
    "bank":        '[amenity=bank]',
    "spbu":        '[amenity=fuel]',
    "bensin":      '[amenity=fuel]',
    "bbm":         '[amenity=fuel]',
    "rumah sakit": '[amenity=hospital]',
    "hospital":    '[amenity=hospital]',
    "rs":          '[amenity=hospital]',
    "klinik":      '[amenity=clinic]',
    "dokter":      '[amenity=doctors]',
    "masjid":      '[amenity=place_of_worship][religion=muslim]',
    "mushola":     '[amenity=place_of_worship][religion=muslim]',
    "gereja":      '[amenity=place_of_worship][religion=christian]',
    "taman":       '[leisure=park]',
    "parkir":      '[amenity=parking]',
    "hotel":       '[tourism=hotel]',
    "inap":        '[tourism=hotel]',
    "hostel":      '[tourism=hostel]',
    "mall":        '[shop=mall]',
    "plaza":       '[shop=mall]',
    "pasar":       '[amenity=marketplace]',
}


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Jarak dalam meter antara dua koordinat."""
    R = 6371000
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a  = math.sin(dp/2)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(a))


def _resolve_osm_filter(category: str) -> str | None:
    """Return OSM tag filter string untuk kategori tertentu."""
    cat = category.lower().strip()
    # Coba exact match dulu
    if cat in CATEGORY_MAP:
        return CATEGORY_MAP[cat]
    # Coba partial match
    for key, val in CATEGORY_MAP.items():
        if key in cat or cat in key:
            return val
    return None


def find_nearest_node_in_graph(lat: float, lng: float, graph_nodes: dict) -> str | None:
    """
    Snap koordinat Overpass ke node terdekat di graph Jakarta.
    Returns: node_id (str) atau None jika graph_nodes kosong.
    """
    best_id   = None
    best_dist = float("inf")
    for node_id, node in graph_nodes.items():
        d = _haversine(lat, lng, node["lat"], node["lng"])
        if d < best_dist:
            best_dist = d
            best_id   = node_id
    return best_id


async def search_nearby_place(
    lat: float,
    lng: float,
    category: str,
    radius_meter: int = 800,
    max_results: int = 5,
) -> list[dict]:
    """
    Cari tempat di sekitar koordinat menggunakan Overpass API.
    
    Returns list of:
    {
        name, lat, lng, category,
        distance_from_midpoint (meter), osm_id
    }
    Returns [] jika gagal / timeout.
    """
    osm_filter = _resolve_osm_filter(category)
    if not osm_filter:
        return []

    # Build Overpass QL query
    query = f"""
[out:json][timeout:{TIMEOUT_SEC}];
(
  node{osm_filter}(around:{radius_meter},{lat},{lng});
  way{osm_filter}(around:{radius_meter},{lat},{lng});
);
out center {max_results * 3};
"""

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SEC + 1) as client:
            resp = await client.post(OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    results = []
    for el in data.get("elements", []):
        # Ambil koordinat (node langsung, way pakai center)
        el_lat = el.get("lat") or el.get("center", {}).get("lat")
        el_lng = el.get("lon") or el.get("center", {}).get("lon")
        if el_lat is None or el_lng is None:
            continue

        name = (
            el.get("tags", {}).get("name")
            or el.get("tags", {}).get("name:id")
            or category.title()
        )
        dist = round(_haversine(lat, lng, el_lat, el_lng))
        results.append({
            "name":                  name,
            "lat":                   el_lat,
            "lng":                   el_lng,
            "category":              category,
            "distance_from_midpoint": dist,
            "osm_id":                str(el.get("id", "")),
        })

    # Urutkan berdasarkan jarak dari midpoint, ambil max_results
    results.sort(key=lambda x: x["distance_from_midpoint"])
    return results[:max_results]
