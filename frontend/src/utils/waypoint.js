import { haversine } from './graph'

/**
 * Cari landmark terbaik dari data internal berdasarkan kategori/nama.
 * Digunakan sebagai fallback jika Overpass tidak tersedia.
 */
export function findBestWaypoint(landmarks, nodes, originId, destId, category, specificName) {
  const origin = nodes[originId]
  const dest   = nodes[destId]
  if (!origin || !dest) return null

  let candidates = landmarks.filter(lm => {
    if (specificName) return lm.name.toLowerCase().includes(specificName.toLowerCase())
    return lm.category === category
  })
  if (!candidates.length) return null

  const midLat = (origin.lat + dest.lat) / 2
  const midLng = (origin.lng + dest.lng) / 2

  candidates = candidates.map(lm => {
    const n = nodes[lm.node_id]
    if (!n) return { ...lm, score: Infinity }
    const distFromMid    = haversine(midLat, midLng, n.lat, n.lng)
    const distFromOrigin = haversine(origin.lat, origin.lng, n.lat, n.lng)
    return { ...lm, score: distFromMid + distFromOrigin * 0.3 }
  })

  candidates.sort((a, b) => a.score - b.score)
  return candidates[0]
}

/** Snap koordinat lat/lng ke node graph terdekat. Returns node_id. */
export function snapToGraph(lat, lng, nodes) {
  let bestId = null
  let bestDist = Infinity
  for (const [id, n] of Object.entries(nodes)) {
    const dlat = lat - n.lat, dlng = lng - n.lng
    const dist = dlat * dlat + dlng * dlng  // approximate, no sqrt needed
    if (dist < bestDist) { bestDist = dist; bestId = id }
  }
  return bestId
}

/** Cari landmark berdasarkan nama (partial match). */
export function findLandmarkByName(landmarks, name) {
  if (!name) return null
  const lower = name.toLowerCase()
  return landmarks.find(lm =>
    lm.name.toLowerCase().includes(lower) ||
    lower.includes(lm.name.toLowerCase())
  ) || null
}

/**
 * Resolve waypoint dari response backend baru.
 * Menangani dua sumber: "overpass" dan "internal".
 *
 * @param {object} parsed    - Response dari /parse-waypoint
 * @param {object[]} landmarks
 * @param {object} nodes     - graph.nodes
 * @param {string} sNode     - origin node ID
 * @param {string} gNode     - destination node ID
 * @returns {{ wNode, wLabel, wSource, wLat, wLng }}
 */
export function resolveWaypointFromParsed(parsed, landmarks, nodes, sNode, gNode) {
  // Case 1: Backend sudah resolve ke node_id (Overpass atau internal dengan node_id)
  if (parsed.waypoint_node_id) {
    return {
      wNode:   parsed.waypoint_node_id,
      wLabel:  parsed.waypoint_name || 'Waypoint',
      wSource: parsed.waypoint_source || 'overpass',
      wLat:    parsed.waypoint_lat   || null,
      wLng:    parsed.waypoint_lng   || null,
      wCategory: parsed.waypoint_category || null,
    }
  }

  // Case 2: Backward-compat — cari dari landmark internal
  const category = parsed.waypoint_category || parsed.waypoint_category_internal || null
  const name     = parsed.waypoint_name_specific || parsed.waypoint_name || null

  if ((category || name) && sNode && gNode) {
    const wp = findBestWaypoint(landmarks, nodes, sNode, gNode, category, name)
    if (wp) {
      return {
        wNode:   wp.node_id,
        wLabel:  wp.name,
        wSource: 'internal',
        wLat:    null,
        wLng:    null,
        wCategory: wp.category || null,
      }
    }
  }

  return { wNode: null, wLabel: null, wSource: null, wLat: null, wLng: null, wCategory: null }
}

/** Badge warna per kategori waypoint */
export const WAYPOINT_CATEGORY_COLORS = {
  indomaret:    { bg: '#FEF3C7', color: '#D97706', label: 'Minimarket' },
  alfamart:     { bg: '#FEF3C7', color: '#D97706', label: 'Minimarket' },
  minimarket:   { bg: '#FEF3C7', color: '#D97706', label: 'Minimarket' },
  cafe:         { bg: '#FDF2F8', color: '#DB2777', label: 'Kafe' },
  kopi:         { bg: '#FDF2F8', color: '#DB2777', label: 'Kafe' },
  restoran:     { bg: '#FFF7ED', color: '#EA580C', label: 'Restoran' },
  makan:        { bg: '#FFF7ED', color: '#EA580C', label: 'Restoran' },
  apotek:       { bg: '#F0FDF4', color: '#16A34A', label: 'Apotek' },
  pharmacy:     { bg: '#F0FDF4', color: '#16A34A', label: 'Apotek' },
  atm:          { bg: '#EFF6FF', color: '#2563EB', label: 'ATM' },
  bank:         { bg: '#EFF6FF', color: '#2563EB', label: 'Bank' },
  spbu:         { bg: '#FEF9C3', color: '#CA8A04', label: 'SPBU' },
  bensin:       { bg: '#FEF9C3', color: '#CA8A04', label: 'SPBU' },
  'rumah sakit':{ bg: '#FFF1F2', color: '#E11D48', label: 'RS' },
  hospital:     { bg: '#FFF1F2', color: '#E11D48', label: 'RS' },
  masjid:       { bg: '#F0FDF4', color: '#15803D', label: 'Masjid' },
  gereja:       { bg: '#F5F3FF', color: '#7C3AED', label: 'Gereja' },
  taman:        { bg: '#ECFDF5', color: '#059669', label: 'Taman' },
  hotel:        { bg: '#EFF6FF', color: '#1D4ED8', label: 'Hotel' },
  internal:     { bg: '#F3F4F6', color: '#6B7280', label: 'Landmark' },
}

export function getWaypointBadge(category, source) {
  if (!category && source === 'internal') return WAYPOINT_CATEGORY_COLORS.internal
  const key = (category || '').toLowerCase()
  return WAYPOINT_CATEGORY_COLORS[key] || { bg: '#F3F4F6', color: '#6B7280', label: category || 'Waypoint' }
}