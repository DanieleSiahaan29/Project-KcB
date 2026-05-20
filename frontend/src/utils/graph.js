// Load dan parse jakarta_graph.json
export async function loadGraph() {
  const res = await fetch('/jakarta_graph.json')
  const data = await res.json()
  
  // Bangun adjacency list
  const adj = {}
  Object.keys(data.nodes).forEach(id => {
    adj[id] = []
  })
  
  data.edges.forEach(({ u, v, length, name }) => {
    adj[u].push({ to: v, weight: length, name })
    adj[v].push({ to: u, weight: length, name })
  })

  return {
    nodes: data.nodes,
    edges: data.edges,
    landmarks: data.landmarks,
    adj,
    meta: data.meta
  }
}

// Cari node terdekat dari koordinat lat/lng
export function nearestNode(nodes, lat, lng) {
  let bestId = null
  let bestDist = Infinity

  for (const [id, node] of Object.entries(nodes)) {
    const d = Math.hypot(node.lat - lat, node.lng - lng)
    if (d < bestDist) {
      bestDist = d
      bestId = id
    }
  }
  return bestId
}

// Hitung jarak haversine dalam meter
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const p1 = lat1 * Math.PI / 180
  const p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180
  const dl = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Hitung total cost sebuah path
export function pathCost(nodes, path) {
  let total = 0
  for (let i = 0; i < path.length - 1; i++) {
    const a = nodes[path[i]]
    const b = nodes[path[i + 1]]
    total += haversine(a.lat, a.lng, b.lat, b.lng)
  }
  return Math.round(total)
}