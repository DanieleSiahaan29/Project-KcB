/**
 * geoCluster.js
 * Mengelompokkan steps algoritma pathfinding berdasarkan area geografis (landmark) terdekat.
 */

// Haversine distance dalam meter antara dua koordinat
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Tentukan arah relatif berdasarkan bearing dari titik start ke centroid cluster
function getDirection(startLat, startLng, targetLat, targetLng) {
  const dLng = (targetLng - startLng) * Math.PI / 180
  const lat1 = startLat * Math.PI / 180
  const lat2 = targetLat * Math.PI / 180
  const x = Math.sin(dLng) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const bearing = (Math.atan2(x, y) * 180 / Math.PI + 360) % 360
  if (bearing < 22.5 || bearing >= 337.5) return 'utara'
  if (bearing < 67.5) return 'timur laut'
  if (bearing < 112.5) return 'timur'
  if (bearing < 157.5) return 'tenggara'
  if (bearing < 202.5) return 'selatan'
  if (bearing < 247.5) return 'barat daya'
  if (bearing < 292.5) return 'barat'
  return 'barat laut'
}

// Cari landmark terdekat dari sebuah koordinat
function nearestLandmark(lat, lng, landmarks) {
  let best = null
  let bestDist = Infinity
  for (const lm of landmarks) {
    const d = haversine(lat, lng, lm.lat, lm.lng)
    if (d < bestDist) {
      bestDist = d
      best = lm
    }
  }
  return best
}

/**
 * Kelompokkan steps algoritma berdasarkan area landmark terdekat.
 *
 * @param {Array} steps        - Array step hasil algoritma (setiap step punya .current = nodeId)
 * @param {Object} nodes       - graph.nodes: { [nodeId]: { lat, lng } }
 * @param {Array} landmarks    - Array landmark dari graph: { id, name, lat, lng, ... }
 * @param {Object} [startNode] - Node awal { lat, lng } untuk kalkulasi arah (opsional)
 * @returns {Array} Array cluster, max 6 cluster
 */
export function clusterStepsByArea(steps, nodes, landmarks, startNode = null) {
  if (!steps || steps.length === 0 || !landmarks || landmarks.length === 0) return []

  // Tandai setiap step dengan nama landmark terdekat
  const labeled = steps.map((step, i) => {
    const node = nodes[step.current]
    if (!node) return { step, i, areaName: 'Area Tak Dikenal', lat: 0, lng: 0 }
    const lm = nearestLandmark(node.lat, node.lng, landmarks)
    return {
      step,
      i,
      areaName: lm ? lm.name : 'Area Tak Dikenal',
      lat: node.lat,
      lng: node.lng,
    }
  })

  // Buat cluster: gabungkan step berturut-turut dengan area yang sama
  const rawClusters = []
  let current = null

  for (const item of labeled) {
    if (!current || current.areaName !== item.areaName) {
      // Area baru → mulai cluster baru
      current = {
        areaName: item.areaName,
        stepStart: item.i,
        stepEnd: item.i,
        nodeCount: 1,
        latSum: item.lat,
        lngSum: item.lng,
        items: [item],
      }
      rawClusters.push(current)
    } else {
      // Masih area yang sama → extend cluster
      current.stepEnd = item.i
      current.nodeCount++
      current.latSum += item.lat
      current.lngSum += item.lng
      current.items.push(item)
    }
  }

  // Filter: minimal 3 step per cluster
  const validClusters = rawClusters.filter(c => c.nodeCount >= 3)

  // Hitung rata-rata koordinat dan arah relatif
  const originLat = startNode?.lat ?? (labeled[0]?.lat ?? -6.2)
  const originLng = startNode?.lng ?? (labeled[0]?.lng ?? 106.82)

  const enriched = validClusters.map(c => {
    const avgLat = c.latSum / c.nodeCount
    const avgLng = c.lngSum / c.nodeCount
    return {
      areaName: c.areaName,
      stepStart: c.stepStart,
      stepEnd: c.stepEnd,
      nodeCount: c.nodeCount,
      avgLat: parseFloat(avgLat.toFixed(5)),
      avgLng: parseFloat(avgLng.toFixed(5)),
      direction: getDirection(originLat, originLng, avgLat, avgLng),
    }
  })

  // Ambil maks 6 cluster paling representatif (berdasarkan nodeCount terbesar)
  if (enriched.length <= 6) return enriched

  // Selalu sertakan cluster pertama dan terakhir, sisanya ambil yang nodeCount terbesar
  const first = enriched[0]
  const last = enriched[enriched.length - 1]
  const middle = enriched
    .slice(1, -1)
    .sort((a, b) => b.nodeCount - a.nodeCount)
    .slice(0, 4)

  // Urutkan kembali berdasarkan stepStart
  return [first, ...middle, last].sort((a, b) => a.stepStart - b.stepStart)
}
