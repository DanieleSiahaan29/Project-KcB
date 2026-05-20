import osmnx as ox
import json
import math

print("=" * 55)
print("  JAKARTA PATHFINDER — Graph Data Fetcher")
print("=" * 55)

print("\n[1/4] Mengambil data jalan dari OpenStreetMap...")
print("      (Estimasi waktu: 1-3 menit)\n")

ox.settings.timeout = 180

# Pakai place name — lebih reliable daripada bbox
G = ox.graph_from_place(
    [
        "Menteng, Jakarta, Indonesia",
        "Tanah Abang, Jakarta, Indonesia",
        "Setiabudi, Jakarta, Indonesia",
        "Kebayoran Baru, Jakarta, Indonesia",
        "Gambir, Jakarta, Indonesia",
    ],
    network_type="drive",
    simplify=True
)

print(f"      ✓ Graf berhasil diambil")
print(f"      ✓ Total node : {len(G.nodes)}")
print(f"      ✓ Total edge : {len(G.edges)}")

print("\n[2/4] Memproses data jalan...")
G = ox.add_edge_speeds(G, fallback=40)
G = ox.add_edge_travel_times(G)

print("\n[3/4] Mengkonversi ke format JSON...")

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(a))

nodes = {}
for node_id, data in G.nodes(data=True):
    nodes[str(node_id)] = {
        "id":  str(node_id),
        "lat": round(data["y"], 7),
        "lng": round(data["x"], 7)
    }

edges = []
seen = set()
for u, v, data in G.edges(data=True):
    key = tuple(sorted([str(u), str(v)]))
    if key in seen:
        continue
    seen.add(key)
    length = data.get("length", 0)
    if length <= 0:
        nu, nv = G.nodes[u], G.nodes[v]
        length = haversine(nu["y"], nu["x"], nv["y"], nv["x"])
    edges.append({
        "u":      str(u),
        "v":      str(v),
        "length": round(length, 2),
        "name":   data.get("name", "") if isinstance(data.get("name"), str) else ""
    })

LANDMARKS = [
    { "id": "monas",          "name": "Monas",                    "lat": -6.1754,  "lng": 106.8272, "category": "landmark"    },
    { "id": "bundaran_hi",    "name": "Bundaran HI",              "lat": -6.1935,  "lng": 106.8227, "category": "landmark"    },
    { "id": "semanggi",       "name": "Semanggi",                 "lat": -6.2087,  "lng": 106.8197, "category": "landmark"    },
    { "id": "gbk",            "name": "GBK",                      "lat": -6.2183,  "lng": 106.8021, "category": "landmark"    },
    { "id": "blok_m",         "name": "Blok M",                   "lat": -6.2441,  "lng": 106.7988, "category": "landmark"    },
    { "id": "sta_sudirman",   "name": "Stasiun Sudirman",         "lat": -6.2008,  "lng": 106.8228, "category": "stasiun"     },
    { "id": "sta_gambir",     "name": "Stasiun Gambir",           "lat": -6.1666,  "lng": 106.8306, "category": "stasiun"     },
    { "id": "sta_tanah_abang","name": "Stasiun Tanah Abang",      "lat": -6.1864,  "lng": 106.8100, "category": "stasiun"     },
    { "id": "rs_cipto",       "name": "RS Cipto Mangunkusumo",    "lat": -6.1934,  "lng": 106.8451, "category": "rumah_sakit" },
    { "id": "rs_jakarta",     "name": "RS Jakarta",               "lat": -6.1679,  "lng": 106.8406, "category": "rumah_sakit" },
    { "id": "plaza_indonesia","name": "Plaza Indonesia",          "lat": -6.1930,  "lng": 106.8218, "category": "mall"        },
    { "id": "grand_indonesia","name": "Grand Indonesia",          "lat": -6.1952,  "lng": 106.8201, "category": "mall"        },
    { "id": "pacific_place",  "name": "Pacific Place",            "lat": -6.2243,  "lng": 106.8089, "category": "mall"        },
    { "id": "plaza_senayan",  "name": "Plaza Senayan",            "lat": -6.2261,  "lng": 106.8004, "category": "mall"        },
    { "id": "taman_suropati", "name": "Taman Suropati",           "lat": -6.2004,  "lng": 106.8362, "category": "taman"       },
    { "id": "taman_menteng",  "name": "Taman Menteng",            "lat": -6.1990,  "lng": 106.8302, "category": "taman"       },
    { "id": "gereja_katedral","name": "Gereja Katedral",          "lat": -6.1693,  "lng": 106.8317, "category": "gereja"      },
    { "id": "gereja_imanuel", "name": "Gereja Imanuel",           "lat": -6.1742,  "lng": 106.8283, "category": "gereja"      },
    { "id": "masjid_istiqlal","name": "Masjid Istiqlal",          "lat": -6.1702,  "lng": 106.8317, "category": "masjid"      },
    { "id": "masjid_agung",   "name": "Masjid Agung Sunda Kelapa","lat": -6.1956,  "lng": 106.8363, "category": "masjid"      },
    { "id": "superindo",      "name": "Superindo Sudirman",       "lat": -6.2012,  "lng": 106.8198, "category": "supermarket" },
    { "id": "hero_gatot",     "name": "Hero Gatot Subroto",       "lat": -6.2289,  "lng": 106.8221, "category": "supermarket" },
]

print("\n      Menghubungkan landmark ke graf...")
for lm in LANDMARKS:
    best_id, best_dist = None, float("inf")
    for nid, n in nodes.items():
        d = haversine(lm["lat"], lm["lng"], n["lat"], n["lng"])
        if d < best_dist:
            best_dist = d
            best_id = nid
    lm["node_id"] = best_id
    lm["snap_dist"] = round(best_dist, 1)
    print(f"      ✓ {lm['name']:35s} → {best_dist:.0f}m")

print("\n[4/4] Menyimpan ke file JSON...")

output = {
    "meta": {
        "area":        "Jakarta Central Corridor",
        "coverage":    "Menteng + Sudirman-Thamrin",
        "total_nodes": len(nodes),
        "total_edges": len(edges)
    },
    "nodes":     nodes,
    "edges":     edges,
    "landmarks": LANDMARKS
}

with open("jakarta_graph.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

size_mb = len(json.dumps(output)) / 1024 / 1024
print(f"\n      ✓ File tersimpan : jakarta_graph.json")
print(f"      ✓ Ukuran file    : {size_mb:.2f} MB")
print(f"      ✓ Total node     : {len(nodes)}")
print(f"      ✓ Total edge     : {len(edges)}")
print(f"      ✓ Total landmark : {len(LANDMARKS)}")
print("\n" + "=" * 55)
print("  SELESAI — Data siap dipakai frontend!")
print("=" * 55 + "\n")