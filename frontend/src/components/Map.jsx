import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { nearestNode } from '../utils/graph'

const COLORS = {
  bfs:   '#1A73E8',
  astar: '#0F9D58',
  hc:    '#F4B400'
}

export default function Map({
  graph, onNodeSelect, selectMode,
  results, activeAlgo, activeStep, showHeatmap, mapRef
}) {
  const mapDivRef = useRef(null)
  const mapObj    = useRef(null)
  const layersRef = useRef({ bfs: [], astar: [], hc: [], markers: [] })
  const heatmapRef = useRef([])
  
  // ✅ Tambahkan ref untuk marker yang sedang aktif
  const activeMarkerRef = useRef(null)

  // Init peta
  useEffect(() => {
    if (mapObj.current) return
    mapObj.current = L.map(mapDivRef.current, {
      center: [-6.2088, 106.8228],
      zoom: 14,
      zoomControl: false
    })
    if (mapRef) mapRef.current = mapObj.current
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(mapObj.current)

    L.control.zoom({ position: 'bottomright' }).addTo(mapObj.current)
  }, [])

  // Klik peta untuk pilih node
  useEffect(() => {
    if (!mapObj.current || !graph) return
    const handleClick = (e) => {
      if (!selectMode) return
      const nid = nearestNode(graph.nodes, e.latlng.lat, e.latlng.lng)
      onNodeSelect(selectMode, nid)
    }
    mapObj.current.on('click', handleClick)
    return () => mapObj.current.off('click', handleClick)
  }, [graph, selectMode, onNodeSelect])

  // Cursor crosshair saat mode select
  useEffect(() => {
    if (!mapObj.current) return
    mapObj.current.getContainer().style.cursor = selectMode ? 'crosshair' : ''
  }, [selectMode])

  // Gambar hasil di peta
  useEffect(() => {
    if (!mapObj.current || !graph || !results) return

    // Bersihkan layer lama
    Object.values(layersRef.current).flat().forEach(l => {
      try { mapObj.current.removeLayer(l) } catch(e) {}
    })
    layersRef.current = { bfs: [], astar: [], hc: [], markers: [] }

    const algos = ['bfs', 'astar', 'hc']

    algos.forEach(key => {
      const res = results[key]
      if (!res) return

      const color   = COLORS[key]
      const isActive = activeAlgo === key
      const isDimmed = activeAlgo && !isActive

      // Gambar explored nodes
      if (!isDimmed) {
        const stepsToShow = isActive ? res.steps : res.steps.slice(0, 150)
        stepsToShow.forEach(step => {
          const n = graph.nodes[step.current]
          if (!n) return
          const circ = L.circleMarker([n.lat, n.lng], {
            radius: isActive ? 4 : 2.5,
            color,
            fillColor: color,
            fillOpacity: isActive ? 0.3 : 0.15,
            opacity: isActive ? 0.5 : 0.2,
            weight: 1
          }).addTo(mapObj.current)
          layersRef.current[key].push(circ)
        })
      }

      // Gambar path final
      if (res.path) {
        const latlngs = res.path.map(nid => {
          const n = graph.nodes[nid]
          return [n.lat, n.lng]
        })
        const line = L.polyline(latlngs, {
          color,
          weight: isActive ? 6 : isDimmed ? 2 : 4,
          opacity: isDimmed ? 0.2 : 0.85
        }).addTo(mapObj.current)
        layersRef.current[key].push(line)
      }

      // Titik terjebak Hill Climbing
      if (key === 'hc' && res.stuckNode && (!activeAlgo || isActive)) {
        const n = graph.nodes[res.stuckNode]
        if (n) {
          const stuck = L.circleMarker([n.lat, n.lng], {
            radius: 10,
            color: '#DB4437',
            fillColor: '#DB4437',
            fillOpacity: 0.3,
            weight: 2,
            dashArray: '4'
          }).addTo(mapObj.current)

          stuck.bindTooltip('⚠ Hill Climbing terjebak di sini', {
            permanent: isActive,
            className: 'stuck-tooltip',
            direction: 'top'
          })

          layersRef.current[key].push(stuck)
        }
      }
    })

    // Marker start & goal
    if (results.startNode) {
      const n = graph.nodes[results.startNode]
      if (n) {
        const m = L.marker([n.lat, n.lng], {
          icon: makeIcon('#1A73E8', 'A'),
          zIndexOffset: 1000
        }).addTo(mapObj.current)
        layersRef.current.markers.push(m)
      }
    }

    if (results.goalNode) {
      const n = graph.nodes[results.goalNode]
      if (n) {
        const m = L.marker([n.lat, n.lng], {
          icon: makeIcon('#DB4437', 'B'),
          zIndexOffset: 1000
        }).addTo(mapObj.current)
        layersRef.current.markers.push(m)
      }
    }
  
    // Marker Waypoint
    if (results.waypointNode) {
      const n = graph.nodes[results.waypointNode]
      if (n) {
        const m = L.marker([n.lat, n.lng], {
          icon: makeIcon('#7C3AED', 'C'),
          zIndexOffset: 1000
        }).addTo(mapObj.current)
        layersRef.current.markers.push(m)
      }
    }

  }, [results, activeAlgo, graph])

  // ✅ Tambahkan useEffect baru untuk highlight node aktif dari narasi panel
  useEffect(() => {
    if (!mapObj.current || !graph || !activeStep) return

    // Hapus marker aktif sebelumnya
    if (activeMarkerRef.current) {
      try { mapObj.current.removeLayer(activeMarkerRef.current) } catch(e) {}
    }

    const n = graph.nodes[activeStep.current]
    if (!n) return

    const color = activeAlgo === 'bfs' ? '#1A73E8' :
                  activeAlgo === 'astar' ? '#0F9D58' : '#F4B400'

    // Lingkaran besar berkedip di node aktif
    const marker = L.circleMarker([n.lat, n.lng], {
      radius: 10,
      color: color,
      fillColor: color,
      fillOpacity: 0.4,
      opacity: 0.9,
      weight: 3
    }).addTo(mapObj.current)

    activeMarkerRef.current = marker

    // Pan peta ke node aktif dengan smooth
    mapObj.current.panTo([n.lat, n.lng], { animate: true, duration: 0.3 })

  }, [activeStep, graph, activeAlgo])

  
  // Gambar heatmap eksplorasi
  useEffect(() => {
    if (!mapObj.current || !graph || !results) return

    // Bersihkan heatmap lama
    heatmapRef.current.forEach(l => {
      try { mapObj.current.removeLayer(l) } catch(e) {}
    })
    heatmapRef.current = []

    if (!showHeatmap) return

    const algo = activeAlgo || 'astar'
    const res  = results[algo]
    if (!res?.steps) return

    const color = algo === 'bfs' ? '#1A73E8' :
                  algo === 'astar' ? '#0F9D58' : '#F4B400'

    // Hitung frekuensi kunjungan tiap node
    const freq = {}
    res.steps.forEach(step => {
      const nid = step.current
      freq[nid] = (freq[nid] || 0) + 1
    })

    const maxFreq = Math.max(...Object.values(freq))

    // Gambar lingkaran per node — radius & opacity sesuai frekuensi
    Object.entries(freq).forEach(([nid, count]) => {
      const n = graph.nodes[nid]
      if (!n) return

      const intensity = count / maxFreq
      const radius    = 4 + intensity * 10
      const opacity   = 0.03 + intensity * 0.15

      const circle = L.circleMarker([n.lat, n.lng], {
        radius,
        color:       'transparent',
        fillColor:   color,
        fillOpacity: opacity,
        weight:      0
      }).addTo(mapObj.current)

      heatmapRef.current.push(circle)
    })

  }, [results, activeAlgo, showHeatmap, graph])

  // Auto fit bounds ke area rute
  useEffect(() => {
    if (!mapObj.current || !graph || !results) return

    const nodeIds = [
      results.startNode,
      results.goalNode,
      results.waypointNode
    ].filter(Boolean)

    if (nodeIds.length < 2) return

    const latlngs = nodeIds.map(nid => {
      const n = graph.nodes[nid]
      return [n.lat, n.lng]
    })

    mapObj.current.fitBounds(latlngs, {
      padding: [60, 60],
      animate: true,
      duration: 0.8
    })

  }, [results, graph])

  return (
    <div className="relative w-full h-full">
      <div ref={mapDivRef} className="w-full h-full" />

      {/* Legend */}
      {results && (
        <div className="absolute bottom-6 right-4 z-[1000] bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Legenda
          </p>
          <div className="space-y-1.5">
            {[
              { color: '#1A73E8', label: 'BFS', sub: 'Uninformed' },
              { color: '#0F9D58', label: 'A*',  sub: 'Informed'   },
              { color: '#F4B400', label: 'Hill Climbing', sub: 'Local Search' },
            ].map(({ color, label, sub }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-6 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs text-gray-700 font-medium">{label}</span>
                <span className="text-xs text-gray-400">{sub}</span>
              </div>
            ))}
            <div className="pt-1.5 mt-1 border-t border-gray-100 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm shrink-0" />
                <span className="text-xs text-gray-500">Titik A (Asal)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm shrink-0" />
                <span className="text-xs text-gray-500">Titik B (Tujuan)</span>
              </div>
              {results?.waypointNode && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-white shadow-sm shrink-0" />
                  <span className="text-xs text-gray-500">Titik C (Singgah)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function makeIcon(color, label) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      font-family:'Google Sans',sans-serif;font-size:13px;font-weight:700;
      color:white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    ">${label}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  })
}