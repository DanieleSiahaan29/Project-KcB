import { clusterStepsByArea } from './geoCluster'

const BASE_URL = 'http://localhost:8000'

/**
 * Generate narasi AI berbasis geographic cluster.
 * Mengirim cluster area (bukan raw steps) ke backend.
 */
export async function generateNarasi({
  algo, steps, cost, expanded, found, stuckNode,
  // Data geografis tambahan
  nodes = null, landmarks = null,
  startLandmark = null, goalLandmark = null,
  startNodeData = null,
}) {
  // Buat clusters jika data geografis tersedia
  let clusters = []
  if (steps && nodes && landmarks && landmarks.length > 0) {
    clusters = clusterStepsByArea(steps, nodes, landmarks, startNodeData)
  }

  const body = {
    algo,
    // Tetap kirim sample steps untuk kompatibilitas backward
    steps: steps ? steps.slice(0, 5) : [],
    cost: cost ?? 0,
    expanded,
    found,
    stuck_node: stuckNode ?? null,
    // Data geografis baru
    clusters,
    total_steps: steps?.length ?? 0,
    start_landmark: startLandmark ?? 'Titik Asal',
    goal_landmark: goalLandmark ?? 'Tujuan',
  }

  const res = await fetch(`${BASE_URL}/narasi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error('Gagal generate narasi')
  const data = await res.json()
  return data.narasi
}

export async function generateNarasiStep({ algo, locations }) {
  const res = await fetch(`${BASE_URL}/narasi-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ algo, locations }),
  })
  if (!res.ok) throw new Error('Gagal generate narasi step')
  const data = await res.json()
  return data.narasi
}

export async function parseWaypoint({
  prompt, landmarks,
  originLat = null, originLng = null,
  destLat = null, destLng = null,
  graphNodes = null,
}) {
  // Kirim sample graph_nodes (maksimal 500 node) agar backend bisa snap ke node terdekat
  let sampleNodes = null
  if (graphNodes) {
    const keys = Object.keys(graphNodes).slice(0, 500)
    sampleNodes = {}
    for (const k of keys) sampleNodes[k] = graphNodes[k]
  }

  const res = await fetch(`${BASE_URL}/parse-waypoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      landmarks,
      origin_lat: originLat,
      origin_lng: originLng,
      dest_lat: destLat,
      dest_lng: destLng,
      graph_nodes: sampleNodes,
    }),
  })
  if (!res.ok) throw new Error('Gagal parse waypoint')
  return await res.json()
}