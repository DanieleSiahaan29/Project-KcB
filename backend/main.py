from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from google import genai
import os
import requests
import json
import math
from services.overpass import search_nearby_place, find_nearest_node_in_graph

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────
# MODELS
# ─────────────────────────────────────

class ClusterData(BaseModel):
    areaName: str
    stepStart: int
    stepEnd: int
    nodeCount: int
    avgLat: float
    avgLng: float
    direction: str

class NarasiRequest(BaseModel):
    algo: str
    steps: list
    cost: float | None
    expanded: int
    found: bool
    stuck_node: str | None = None
    # Data geografis (baru)
    clusters: list[ClusterData] = []
    total_steps: int = 0
    start_landmark: str = "Titik Asal"
    goal_landmark: str = "Tujuan"

class NarasiStepRequest(BaseModel):
    algo: str
    locations: list

class WaypointRequest(BaseModel):
    prompt: str
    landmarks: list
    origin_lat: float | None = None
    origin_lng: float | None = None
    dest_lat: float | None = None
    dest_lng: float | None = None
    graph_nodes: dict | None = None

# ─────────────────────────────────────
# PERSONA
# ─────────────────────────────────────

PERSONA = {
    "bfs": {
        "desc": "BFS — algoritma pencarian yang sangat teliti dan tidak pernah melewatkan satu persimpangan pun",
        "sifat": "teliti, sistematis, dan tidak suka menebak. Kamu bangga dengan ketelitianmu meski lambat. Bicaramu tenang dan metodis.",
        "gaya": "seperti seorang penjelajah sabar yang memetakan setiap sudut kota",
    },
    "astar": {
        "desc": "A* — algoritma pencarian cerdas yang bisa merasakan ke mana arah yang benar",
        "sifat": "percaya diri, analitis, dan selalu punya alasan di balik setiap keputusan. Kamu efisien dan tidak suka buang waktu.",
        "gaya": "seperti navigator berpengalaman yang menggabungkan insting dan logika",
    },
    "bruteforce": {
        "desc": "Brute Force — algoritma yang tidak kenal kompromi dan memeriksa SETIAP kemungkinan tanpa terkecuali",
        "sifat": "tegas, sedikit sombong soal ketepatan, tapi mengakui kelambatanmu dengan santai. Kamu lambat, sangat lambat, tapi hasilnya pasti 100% optimal. Kamu bangga karena tidak pernah melewatkan satu pun kemungkinan.",
        "gaya": "seperti pemeriksa forensik yang pantang menyerah dan selalu ingin memastikan tidak ada yang terlewat",
    },
    "greedy": {
        "desc": "Greedy Best-First Search — algoritma yang selalu mengejar yang tampak paling dekat ke tujuan saat ini",
        "sifat": "optimis, energetik, dan sedikit ceroboh. Kamu sangat cepat dan penuh percaya diri, tapi kadang kamu mengambil jalan yang tidak efisien karena tidak memperhitungkan jarak yang sudah ditempuh.",
        "gaya": "seperti pelari sprint yang langsung tancap gas tanpa terlalu banyak mikir",
    },
}

# ─────────────────────────────────────
# PROMPT BUILDERS
# ─────────────────────────────────────

def build_cluster_narrative(clusters: list) -> str:
    if not clusters:
        return "menyusuri berbagai sudut kota tanpa rencana pasti"
    parts = []
    transitions = ["Pertama", "Lalu", "Dari sana", "Kemudian", "Bergeser ke", "Akhirnya sampai di"]
    for i, c in enumerate(clusters):
        t = transitions[i] if i < len(transitions) else "Dan juga"
        parts.append(f"{t} area {c.areaName} (ke arah {c.direction})")
    return ", ".join(parts)


def build_geographic_prompt(req: NarasiRequest) -> str:
    p = PERSONA.get(req.algo, PERSONA["bfs"])
    journey = build_cluster_narrative(req.clusters)

    if req.found:
        outcome = f"berhasil menemukan jalur dari {req.start_landmark} menuju {req.goal_landmark}"
        if req.algo == "bruteforce":
            emotion = (
                f"Kamu BERHASIL menemukan jalur TERPENDEK ABSOLUT sepanjang {req.cost}m setelah memeriksa {req.expanded} node dengan metode exhaustive. "
                "Ungkapkan rasa puas dan bangga yang tulus karena hasilmu pasti 100% optimal."
            )
        elif req.algo == "greedy":
            emotion = (
                f"Kamu BERHASIL menemukan jalur sepanjang {req.cost}m dengan cepat setelah hanya memeriksa {req.expanded} node, meski jalurnya mungkin bukan yang terpendek. "
                "Ungkapkan rasa senang dan optimis, boleh sedikit bangga dengan kecepatan."
            )
        else:
            emotion = (
                "Ungkapkan rasa lega, bangga, dan syukur yang tulus karena berhasil. "
                "Boleh sedikit dramatis seperti orang yang baru selesai petualangan panjang."
            )
    elif req.stuck_node:
        outcome = f"terjebak dan gagal menemukan jalur dari {req.start_landmark} ke {req.goal_landmark}"
        emotion = (
            "Ungkapkan rasa frustrasi, kekecewaan mendalam, dan sedikit humor pahit karena terjebak. "
            "Ceritakan betapa menjengkelkannya terjebak padahal sudah usaha keras."
        )
    else:
        outcome = f"tidak berhasil menemukan jalur dari {req.start_landmark} ke {req.goal_landmark}"
        if req.algo == "bruteforce":
            emotion = f"Kamu tidak berhasil menemukan jalur setelah memeriksa {req.expanded} node. Ungkapkan kebingungan yang jujur."
        elif req.algo == "greedy":
            emotion = f"Kamu gagal menemukan jalur setelah {req.expanded} node. Ungkapkan kekecewaan energetik."
        else:
            emotion = "Ungkapkan kebingungan dan rasa lelah yang jujur."

    return f"""Kamu adalah {p['desc']}.
Kepribadianmu: {p['sifat']}
Gaya berceritamu: {p['gaya']}.

Kamu baru saja selesai menjelajahi jalan-jalan Jakarta dalam misi mencari rute, dan kamu {outcome}.

Selama perjalananmu, kamu melewati: {journey}.

TUGAS:
Tulislah pengalaman perjalananmu dalam 4-5 paragraf pendek yang MENGALIR SEPERTI CERITA.
Gunakan sudut pandang orang pertama ("Aku...").
Sebutkan nama-nama area Jakarta yang kamu lewati (seperti {req.start_landmark}, {req.goal_landmark}, dll) secara natural dalam cerita — jangan daftar.
Tunjukkan kepribadian dan emosimu sepanjang narasi.
Bahasa santai seperti bercerita ke teman — bukan laporan, bukan presentasi, bukan bullet point.
Jangan sebut angka-angka teknis (node, ms, meter) secara kaku — kalau mau sebutkan, selipkan secara natural.
{emotion}
PENTING: Pisahkan tiap paragraf dengan satu baris kosong. Jangan gunakan bullet point atau heading."""


def build_prompt(req: NarasiRequest) -> str:
    """Fallback prompt bila tidak ada clusters."""
    p = PERSONA.get(req.algo, PERSONA["bfs"])

    if req.found:
        outcome = f"berhasil menemukan jalur dari {req.start_landmark} menuju {req.goal_landmark}"
        if req.algo == "bruteforce":
            emotion = f"Kamu BERHASIL menemukan jalur TERPENDEK ABSOLUT sepanjang {req.cost}m setelah memeriksa {req.expanded} node dengan metode exhaustive. Ungkapkan rasa puas dan bangga yang tulus."
        elif req.algo == "greedy":
            emotion = f"Kamu BERHASIL menemukan jalur sepanjang {req.cost}m dengan cepat setelah hanya memeriksa {req.expanded} node. Ungkapkan rasa senang dan optimis."
        else:
            emotion = "Ungkapkan rasa lega dan bangga yang tulus. Boleh sedikit dramatis."
    elif req.stuck_node:
        outcome = f"terjebak dan gagal menemukan jalur dari {req.start_landmark} ke {req.goal_landmark}"
        emotion = "Ungkapkan frustrasi dan humor pahit karena terjebak di local optima."
    else:
        outcome = f"tidak berhasil menemukan jalur dari {req.start_landmark} ke {req.goal_landmark}"
        if req.algo == "bruteforce":
            emotion = f"Kamu tidak berhasil menemukan jalur setelah memeriksa {req.expanded} node. Ungkapkan kebingungan jujur."
        elif req.algo == "greedy":
            emotion = f"Kamu gagal menemukan jalur setelah {req.expanded} node. Ungkapkan kekecewaan."
        else:
            emotion = "Ungkapkan kebingungan dan rasa lelah yang jujur."

    return f"""Kamu adalah {p['desc']}.
Kepribadianmu: {p['sifat']}
Gaya berceritamu: {p['gaya']}.

Kamu baru saja selesai menjelajahi jalan-jalan Jakarta dan kamu {outcome}.

TUGAS:
Tulislah pengalaman perjalananmu dalam 4-5 paragraf pendek yang mengalir seperti cerita.
Gunakan sudut pandang orang pertama ("Aku...").
Sebutkan {req.start_landmark} dan {req.goal_landmark} secara natural dalam cerita.
Bahasa santai seperti bercerita ke teman. Jangan kaku, jangan technical.
{emotion}
PENTING: Pisahkan tiap paragraf dengan satu baris kosong. Jangan gunakan bullet point."""

# ─────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────

LMSTUDIO_URL = "http://127.0.0.1:1234/v1/chat/completions"
LMSTUDIO_MODEL = "google/gemma-4-e4b"


def call_lmstudio(system: str, user: str, temperature: float = 0.8) -> str:
    payload = {
        "model": LMSTUDIO_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "stream": False,
    }
    response = requests.post(LMSTUDIO_URL, json=payload, timeout=60)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


@app.post("/narasi")
async def generate_narasi(req: NarasiRequest):
    try:
        # Gunakan geographic prompt jika ada clusters, fallback ke prompt lama
        if req.clusters:
            prompt = build_geographic_prompt(req)
        else:
            prompt = build_prompt(req)

        narasi = call_lmstudio(
            system=(
                "Kamu adalah seorang penulis cerita petualangan berbahasa Indonesia yang ekspresif dan berbakat. "
                "Tugasmu adalah menuliskan pengalaman algoritma pencarian rute sebagai kisah orang pertama yang hidup dan menyentuh. "
                "WAJIB: Hanya tulis paragraf mengalir. DILARANG: bullet point, heading, angka teknis kaku, atau kata-kata kering seperti 'node', 'ms', 'meter'. "
                "Buat pembaca seolah ikut merasakan perjalanan itu."
            ),
            user=prompt,
            temperature=0.9,
        )
        return {"narasi": narasi}
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal terhubung ke LM Studio. Pastikan 'Local Server' di LM Studio berjalan di port 1234. Error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/narasi-step")
async def generate_narasi_step(req: NarasiStepRequest):
    try:
        if not req.locations:
            return {"narasi": ""}

        algo_name = req.algo.upper()
        personality = {
            "BFS": "teliti dan sabar, selalu menyebar ke semua arah",
            "ASTAR": "cerdas dan intuitif, percaya pada insting terbaik",
            "BRUTEFORCE": "tegas dan pasti, memeriksa semua kemungkinan tanpa terkecuali",
            "GREEDY": "optimis dan energetik, selalu mengejar yang tampak paling dekat ke tujuan",
        }.get(algo_name, "penuh rasa ingin tahu")

        loc_list = req.locations
        loc_phrase = " dan ".join(loc_list) if len(loc_list) > 1 else loc_list[0]

        prompt = (
            f"Kamu adalah algoritma {algo_name} — kepribadianmu: {personality}.\n"
            f"Kamu sedang menjelajahi jalan-jalan Jakarta dan barusan melewati kawasan {loc_phrase}.\n"
            f"Ceritakan dalam 1-2 kalimat apa yang kamu rasakan atau pikirkan saat menyusuri area ini. "
            f"Gaya bahasa: orang pertama ('Aku'), santai, ekspresif, seperti bercerita ke teman. "
            f"Boleh menyebut nama tempat secara natural. Jangan sebut angka teknis. "
            f"Langsung ke ceritanya tanpa basa-basi."
        )

        narasi = call_lmstudio(
            system=(
                "Kamu penulis cerita navigasi berbahasa Indonesia. "
                "Tuliskan hanya 1-2 kalimat ekspresif bergaya orang pertama. Tidak ada bullet point."
            ),
            user=prompt,
            temperature=0.9,
        )
        if narasi.startswith('"') and narasi.endswith('"'):
            narasi = narasi[1:-1]
        return {"narasi": f'"{narasi}"'}
    except Exception:
        return {"narasi": ""}


@app.post("/parse-waypoint")
async def parse_waypoint(req: WaypointRequest):
    try:
        # ── Step 1: Gunakan Gemini untuk parsing intent
        landmark_list = "\n".join([
            f"- {lm['name']} (kategori: {lm['category']}, id: {lm['id']})"
            for lm in req.landmarks
        ])
        internal_categories = "landmark, stasiun, rumah_sakit, mall, taman, gereja, masjid, supermarket"

        prompt = f"""
Kamu adalah asisten navigasi Jakarta. Dari input pengguna, ekstrak informasi rute.

Daftar landmark INTERNAL yang tersedia (hanya ini yang tergolong 'internal'):
{landmark_list}

Input pengguna: "{req.prompt}"

Tentukan waypoint_type:
- "internal" = tempat singgah ada di daftar landmark di atas (masjid, taman, dll yang terdata)
- "external" = tempat singgah TIDAK ada di daftar (Indomaret, Alfamart, cafe, apotek, ATM, SPBU, restoran, dll)

Jawab HANYA dalam format JSON seperti ini, tanpa teks lain:
{{
  "origin": "nama landmark asal atau null",
  "destination": "nama landmark tujuan atau null",
  "waypoint_type": "internal atau external atau null",
  "waypoint_category_internal": "kategori dari daftar internal atau null",
  "waypoint_category_external": "kategori OSM dalam bahasa natural (indomaret/cafe/apotek/atm/spbu/dll) atau null",
  "waypoint_name_specific": "nama spesifik jika disebutkan (Indomaret, Starbucks, dll) atau null",
  "confidence": "high/medium/low"
}}
"""
        # Gunakan LM Studio untuk mem-parsing prompt (menghindari limit Gemini)
        system_prompt = "Kamu adalah sistem parser JSON. Hanya keluarkan format JSON valid tanpa penjelasan apapun."
        response_text = call_lmstudio(
            system=system_prompt,
            user=prompt,
            temperature=0.1
        )
        
        text   = response_text.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(text)

        # ── Step 2: Resolve waypoint berdasarkan type
        waypoint_node_id = None
        waypoint_name    = None
        waypoint_lat     = None
        waypoint_lng     = None
        waypoint_source  = None
        waypoint_category = None

        wtype = (parsed.get("waypoint_type") or "").lower()

        if wtype == "external" and req.origin_lat and req.dest_lat:
            # Hitung midpoint antara origin dan destination
            mid_lat = (req.origin_lat + req.dest_lat) / 2
            mid_lng = (req.origin_lng + req.dest_lng) / 2

            # Tentukan kategori yang akan di-query ke Overpass
            ext_cat = (
                parsed.get("waypoint_name_specific")
                or parsed.get("waypoint_category_external")
                or ""
            ).lower().strip()

            if ext_cat:
                overpass_results = await search_nearby_place(
                    lat=mid_lat,
                    lng=mid_lng,
                    category=ext_cat,
                    radius_meter=1000,
                )

                if overpass_results:
                    best = overpass_results[0]
                    waypoint_lat  = best["lat"]
                    waypoint_lng  = best["lng"]
                    waypoint_name = best["name"]
                    waypoint_category = best["category"]
                    waypoint_source   = "overpass"

                    # Snap ke node terdekat di graph
                    if req.graph_nodes:
                        waypoint_node_id = find_nearest_node_in_graph(
                            waypoint_lat, waypoint_lng, req.graph_nodes
                        )

        if wtype == "internal" or (wtype == "external" and waypoint_node_id is None):
            # Fallback ke landmark internal
            int_cat  = parsed.get("waypoint_category_internal")
            int_name = parsed.get("waypoint_name_specific")
            if int_cat or int_name:
                for lm in req.landmarks:
                    name_match = int_name and int_name.lower() in lm["name"].lower()
                    cat_match  = int_cat  and lm.get("category", "") == int_cat
                    if name_match or cat_match:
                        waypoint_node_id  = lm["node_id"]
                        waypoint_name     = lm["name"]
                        waypoint_category = lm.get("category")
                        waypoint_source   = "internal"
                        break

        return {
            "origin":           parsed.get("origin"),
            "destination":      parsed.get("destination"),
            "waypoint_node_id": waypoint_node_id,
            "waypoint_name":    waypoint_name,
            "waypoint_category": waypoint_category,
            "waypoint_source":  waypoint_source,
            "waypoint_lat":     waypoint_lat,
            "waypoint_lng":     waypoint_lng,
            "confidence":       parsed.get("confidence", "medium"),
            # Backward compat fields
            "waypoint_type":    wtype or None,
            "waypoint_category_internal": parsed.get("waypoint_category_internal"),
            "waypoint_category_external": parsed.get("waypoint_category_external"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}