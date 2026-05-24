import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, ChevronDown, MapPin,
  Navigation, RotateCcw, Layers,
  ChevronRight, CheckCircle2, Search,
  SkipBack, SkipForward, Play, Pause, X
} from 'lucide-react'
import SharedSidebar from '../../components/SharedSidebar'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { loadGraph } from '../../utils/graph'
import { runBFS, runAStar, runBruteForce, runGreedy } from '../../hooks/useAlgorithm'
import { generateNarasi, parseWaypoint } from '../../utils/api'
import { findBestWaypoint, findLandmarkByName, resolveWaypointFromParsed, getWaypointBadge, snapToGraph } from '../../utils/waypoint'
import { useAppStore } from '../../stores/useAppStore'
import NarasiPanel from '../../components/NarasiPanel'
// NarasiPanel masih di-import sebagai fallback, tapi kita pakai NarasiPanelFixed

// ─────────────────────────────────────
// SVG CUSTOM COMPONENTS
// ─────────────────────────────────────
const MonasIcon = ({ size = 44 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width={size} height={size}>
    <defs>
      <linearGradient id="monasGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" />
        <stop offset="50%" stopColor="#7B1FA2" />
        <stop offset="100%" stopColor="#4A148C" />
      </linearGradient>
      <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E040FB" />
        <stop offset="100%" stopColor="#8E24AA" />
      </linearGradient>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4A148C" floodOpacity="0.3" />
      </filter>
    </defs>
    <circle cx="100" cy="150" r="120" fill="#F3E5F5" />
    <polygon points="20,280 180,280 160,265 40,265" fill="#311B92" filter="url(#dropShadow)" />
    <polygon points="75,265 125,265 145,215 55,215" fill="url(#monasGradient)" />
    <polygon points="45,215 155,215 150,205 50,205" fill="#6A1B9A" />
    <rect x="80" y="200" width="40" height="5" fill="#4A148C" />
    <polygon points="85,200 115,200 107,60 93,60" fill="url(#monasGradient)" filter="url(#dropShadow)" />
    <path d="M 100 15 C 125 40 115 60 107 60 L 93 60 C 85 60 75 40 100 15 Z" fill="url(#flameGradient)" filter="url(#dropShadow)" />
    <path d="M 100 25 C 112 42 108 55 104 58 L 96 58 C 92 55 88 42 100 25 Z" fill="#EA80FC" />
    <polygon points="98,200 102,200 101,60 99,60" fill="#D1C4E9" opacity="0.4" />
  </svg>
)

const SkylineIllustration = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" style={{ width: '100%', height: 'auto', display: 'block' }}>
    <defs>
      <filter id="shadowBlur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <clipPath id="groundClip">
        <rect x="0" y="0" width="800" height="330" />
      </clipPath>
    </defs>
    <rect width="800" height="400" rx="0" fill="#F4F5FB" />
    <circle cx="400" cy="240" r="140" fill="#EAEBF8" />
    <g fill="#E6E8F6">
      <circle cx="210" cy="110" r="18" /><circle cx="235" cy="95" r="25" /><circle cx="265" cy="105" r="20" />
      <rect x="195" y="95" width="85" height="28" rx="14" />
    </g>
    <g fill="#E6E8F6">
      <circle cx="560" cy="120" r="15" /><circle cx="580" cy="105" r="22" /><circle cx="605" cy="115" r="18" />
      <rect x="550" y="105" width="70" height="25" rx="12.5" />
    </g>
    <g id="buildings-left">
      <rect x="90" y="210" width="15" height="120" fill="#ABB3E6" /><rect x="105" y="210" width="15" height="120" fill="#949ED4" />
      <polygon points="90,210 105,185 105,210" fill="#ABB3E6" /><polygon points="120,210 105,185 105,210" fill="#949ED4" />
      <rect x="104" y="165" width="2" height="20" fill="#949ED4" />
      <rect x="125" y="195" width="17" height="135" fill="#BCC4F0" /><rect x="142" y="195" width="17" height="135" fill="#A2ABDE" />
      <path d="M 125 195 A 17 17 0 0 1 142 175 L 142 195 Z" fill="#BCC4F0" />
      <path d="M 159 195 A 17 17 0 0 0 142 175 L 142 195 Z" fill="#A2ABDE" />
      <rect x="141" y="155" width="2" height="20" fill="#A2ABDE" />
      <rect x="165" y="230" width="15" height="100" fill="#ABB3E6" /><rect x="180" y="230" width="15" height="100" fill="#949ED4" />
      <rect x="200" y="245" width="20" height="85" fill="#BCC4F0" /><rect x="220" y="245" width="20" height="85" fill="#A2ABDE" />
    </g>
    <g id="buildings-right">
      <rect x="520" y="225" width="18" height="105" fill="#ABB3E6" /><rect x="538" y="225" width="18" height="105" fill="#949ED4" />
      <rect x="565" y="160" width="23" height="170" fill="#BCC4F0" /><rect x="588" y="160" width="23" height="170" fill="#A2ABDE" />
      <rect x="625" y="230" width="15" height="100" fill="#ABB3E6" /><rect x="640" y="230" width="15" height="100" fill="#949ED4" />
      <rect x="665" y="240" width="15" height="90" fill="#BCC4F0" /><rect x="680" y="240" width="15" height="90" fill="#A2ABDE" />
    </g>
    <g id="monas">
      <polygon points="365,330 400,330 400,315 375,315" fill="#D0D3F2" />
      <polygon points="400,330 435,330 425,315 400,315" fill="#A9B0DE" />
      <polygon points="300,285 400,285 400,315 375,315" fill="#D0D3F2" />
      <polygon points="400,285 500,285 425,315 400,315" fill="#A9B0DE" />
      <rect x="300" y="275" width="100" height="10" fill="#E1E4FA" /><rect x="400" y="275" width="100" height="10" fill="#BAC1E8" />
      <polygon points="385,265 400,265 400,80 392,80" fill="#E1E4FA" />
      <polygon points="400,265 415,265 408,80 400,80" fill="#BAC1E8" />
      <polygon points="383,70 400,70 400,25 391,55" fill="#B4BCE8" />
      <polygon points="400,70 417,70 409,55 400,25" fill="#919BCE" />
    </g>
    <ellipse cx="400" cy="342" rx="310" ry="6" fill="#D2D6E9" filter="url(#shadowBlur)" />
    <rect x="80" y="330" width="640" height="6" rx="3" fill="#4B5375" />
    <g clipPath="url(#groundClip)">
      <circle cx="140" cy="330" r="18" fill="#A0D4B0" />
      <ellipse cx="200" cy="330" rx="40" ry="22" fill="#85C299" />
      <circle cx="245" cy="330" r="20" fill="#B5E3C3" />
      <ellipse cx="295" cy="330" rx="45" ry="25" fill="#A0D4B0" />
      <ellipse cx="460" cy="330" rx="40" ry="22" fill="#A0D4B0" />
      <circle cx="510" cy="330" r="22" fill="#85C299" />
      <ellipse cx="610" cy="330" rx="45" ry="22" fill="#A0D4B0" />
    </g>
  </svg>
)

// NAV_ITEMS dipindah ke SharedSidebar

const ALGO_CONFIG = [
  { key:'bfs',        label:'BFS',         sub:'Uninformed', color:'#5B5FEF', bg:'#EEF2FF', border:'#C7D2FE', text:'#4338CA' },
  { key:'astar',      label:'A*',           sub:'Informed',   color:'#10B981', bg:'#F0FDF4', border:'#6EE7B7', text:'#065F46' },
  { key:'bruteforce', label:'Brute Force',  sub:'Exhaustive', color:'#EF4444', bg:'#FEF2F2', border:'#FECACA', text:'#991B1B' },
  { key:'greedy',     label:'Greedy',       sub:'Best-First', color:'#EC4899', bg:'#FDF2F8', border:'#F9A8D4', text:'#9D174D' },
]

// Sidebar diganti SharedSidebar

// ─────────────────────────────────────
// MAP COMPONENT
// ─────────────────────────────────────
const COLORS = { bfs:'#5B5FEF', astar:'#10B981', bruteforce:'#EF4444', greedy:'#EC4899' }

function MapView({ graph, results, activeAlgo, activeStep, showHeatmap, mapRef, onNodeSelect, selectMode }) {
  const mapDivRef = useRef(null)
  const mapObj    = useRef(null)
  const layersRef = useRef({ bfs:[], astar:[], bruteforce:[], greedy:[], markers:[] })
  const heatmapRef = useRef([])
  const activeMarkerRef = useRef(null)
  const cumulativeNodesRef = useRef([])

  useEffect(() => {
    if (mapObj.current || !mapDivRef.current) return
    mapObj.current = L.map(mapDivRef.current, {
      center: [-6.2088, 106.8228], zoom: 14, zoomControl: false
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(mapObj.current)
    L.control.zoom({ position: 'topright' }).addTo(mapObj.current)
    if (mapRef) mapRef.current = mapObj.current
  }, [])

  useEffect(() => {
    if (!mapObj.current || !graph) return
    const handleClick = (e) => {
      if (!selectMode) return
      const nid = nearestNode(graph.nodes, e.latlng.lat, e.latlng.lng)
      onNodeSelect(selectMode, nid)
    }
    mapObj.current.on('click', handleClick)
    return () => mapObj.current?.off('click', handleClick)
  }, [graph, selectMode, onNodeSelect])

  useEffect(() => {
    if (!mapObj.current) return
    mapObj.current.getContainer().style.cursor = selectMode ? 'crosshair' : ''
  }, [selectMode])

  useEffect(() => {
    if (!mapObj.current || !graph || !results) return
    Object.values(layersRef.current).flat().forEach(l => { try { mapObj.current.removeLayer(l) } catch(e) {} })
    layersRef.current = { bfs:[], astar:[], bruteforce:[], greedy:[], markers:[] }

    ;['bfs','astar','bruteforce','greedy'].forEach(key => {
      const res = results[key]
      if (!res) return
      const color = COLORS[key]
      const isActive = activeAlgo === key
      const isDimmed = activeAlgo && !isActive

      // Hanya gambar titik static preview jika algo belum aktif (misal saat awal)
      // Jika active, rendering kumulatif dilakukan oleh effect terpisah.
      if (!isDimmed && !isActive) {
        const stepsToShow = res.steps.slice(0, 60)
        stepsToShow.forEach((step, i) => {
          const n = graph.nodes[step.current]
          if (!n) return
          // BFS: use very small nodes with low opacity for clean look
          const isBFS = key === 'bfs'
          const circ = L.circleMarker([n.lat, n.lng], {
            radius: isActive ? (isBFS ? 3 : 4) : 2,
            color, fillColor: color,
            fillOpacity: isActive ? (isBFS ? 0.18 : 0.28) : 0.10,
            opacity: isActive ? (isBFS ? 0.35 : 0.45) : 0.15,
            weight: 1
          }).addTo(mapObj.current)
          layersRef.current[key].push(circ)
        })
      }

      if (res.path) {
        const latlngs = res.path.map(nid => { const n = graph.nodes[nid]; return [n.lat, n.lng] })
        const line = L.polyline(latlngs, {
          color, weight: isActive ? 6 : isDimmed ? 2 : 4,
          opacity: isDimmed ? 0.2 : 0.9
        }).addTo(mapObj.current)
        layersRef.current[key].push(line)
      }

      // Sem stuck marker — Brute Force e Greedy não têm local optima
    })

    if (results.startNode) {
      const n = graph.nodes[results.startNode]
      if (n) {
        const m = L.marker([n.lat, n.lng], { icon: makeIcon('#5B5FEF', 'A'), zIndexOffset: 1000 }).addTo(mapObj.current)
        layersRef.current.markers.push(m)
      }
    }
    if (results.goalNode) {
      const n = graph.nodes[results.goalNode]
      if (n) {
        const m = L.marker([n.lat, n.lng], { icon: makeIcon('#EF4444', 'B'), zIndexOffset: 1000 }).addTo(mapObj.current)
        layersRef.current.markers.push(m)
      }
    }
    if (results.waypointNode) {
      const n = graph.nodes[results.waypointNode]
      if (n) {
        const m = L.marker([n.lat, n.lng], { icon: makeIcon('#7C4DFF', 'C'), zIndexOffset: 1000 }).addTo(mapObj.current)
        layersRef.current.markers.push(m)
      }
    }
  }, [results, activeAlgo, graph])

  useEffect(() => {
    if (!mapObj.current || !graph || !activeStep) return
    if (activeMarkerRef.current) { try { mapObj.current.removeLayer(activeMarkerRef.current) } catch(e) {} }
    const n = graph.nodes[activeStep.current]
    if (!n) return
    const color = COLORS[activeAlgo] || '#5B5FEF'
    const marker = L.circleMarker([n.lat, n.lng], { radius: 10, color, fillColor: color, fillOpacity: 0.4, opacity: 0.9, weight: 3 }).addTo(mapObj.current)
    activeMarkerRef.current = marker
    mapObj.current.panTo([n.lat, n.lng], { animate: true, duration: 0.3 })
  }, [activeStep, graph, activeAlgo])

  // Efek Cumulative Timelapse untuk titik node
  useEffect(() => {
    if (!mapObj.current || !graph || !results || !activeAlgo || !activeStep) return
    cumulativeNodesRef.current.forEach(l => { try { mapObj.current.removeLayer(l) } catch(e) {} })
    cumulativeNodesRef.current = []

    const res = results[activeAlgo]
    if (!res || !res.steps) return
    const color = COLORS[activeAlgo]
    const isBFS = activeAlgo === 'bfs'
    
    const limit = activeStep.originalIndex !== undefined ? activeStep.originalIndex + 1 : res.steps.length
    const stepsToShow = res.steps.slice(0, limit)
    
    stepsToShow.forEach(step => {
      const n = graph.nodes[step.current]
      if (!n) return
      const circ = L.circleMarker([n.lat, n.lng], {
        radius: isBFS ? 3 : 4,
        color, fillColor: color,
        fillOpacity: isBFS ? 0.18 : 0.28,
        opacity: isBFS ? 0.35 : 0.45,
        weight: 1
      }).addTo(mapObj.current)
      cumulativeNodesRef.current.push(circ)
    })
  }, [activeStep, activeAlgo, results, graph])

  useEffect(() => {
    if (!mapObj.current || !graph || !results) return
    heatmapRef.current.forEach(l => { try { mapObj.current.removeLayer(l) } catch(e) {} })
    heatmapRef.current = []
    if (!showHeatmap) return
    const algo = activeAlgo || 'astar'
    const res = results[algo]
    if (!res?.steps) return
    const color = COLORS[algo]
    const freq = {}
    res.steps.forEach(step => { freq[step.current] = (freq[step.current] || 0) + 1 })
    const maxFreq = Math.max(...Object.values(freq))
    Object.entries(freq).forEach(([nid, count]) => {
      const n = graph.nodes[nid]
      if (!n) return
      const intensity = count / maxFreq
      const circle = L.circleMarker([n.lat, n.lng], {
        radius: 4 + intensity * 10, color: 'transparent',
        fillColor: color, fillOpacity: 0.03 + intensity * 0.15, weight: 0
      }).addTo(mapObj.current)
      heatmapRef.current.push(circle)
    })
  }, [results, activeAlgo, showHeatmap, graph])

  useEffect(() => {
    if (!mapObj.current || !graph || !results) return
    const nodeIds = [results.startNode, results.goalNode, results.waypointNode].filter(Boolean)
    if (nodeIds.length < 2) return
    const latlngs = nodeIds.map(nid => { const n = graph.nodes[nid]; return [n.lat, n.lng] })
    mapObj.current.fitBounds(latlngs, { padding: [60, 60], animate: true, duration: 0.8 })
  }, [results, graph])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', borderRadius:20, overflow:'hidden' }}>
      <div ref={mapDivRef} style={{ width:'100%', height:'100%' }} />
      {/* Legend */}
      <div style={{
        position:'absolute', bottom:14, left:14, zIndex:500,
        display:'flex', alignItems:'center', gap:12,
        background:'rgba(255,255,255,0.93)', backdropFilter:'blur(8px)',
        borderRadius:14, padding:'8px 14px',
        boxShadow:'0 4px 16px rgba(0,0,0,0.08)', border:'1px solid rgba(255,255,255,0.8)',
      }}>
        {[
          { color:'#5B5FEF', label:'BFS' },
          { color:'#10B981', label:'A*' },
          { color:'#EF4444', label:'Brute Force' },
          { color:'#EC4899', label:'Greedy' },
          { color:'#5B5FEF', label:'Titik A', dot:true },
          { color:'#EF4444', label:'Titik B', dot:true },
        ].map(({ color, label, dot }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            {dot
              ? <div style={{ width:8, height:8, borderRadius:'50%', background:color, border:'2px solid white', boxShadow:`0 0 0 1px ${color}` }} />
              : <div style={{ width:16, height:3, borderRadius:2, background:color }} />
            }
            <span style={{ fontSize:11, color:'#374151', fontWeight:500 }}>{label}</span>
          </div>
        ))}
      </div>
      {selectMode && (
        <div style={{
          position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', zIndex:1000,
          background: selectMode === 'start' ? '#5B5FEF' : '#EF4444',
          color:'white', borderRadius:20, padding:'8px 18px',
          fontSize:12, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
        }}>
          {selectMode === 'start' ? '📍 Klik peta untuk titik asal' : '🎯 Klik peta untuk tujuan'}
        </div>
      )}
    </div>
  )
}

function nearestNode(nodes, lat, lng) {
  let bestId = null, bestDist = Infinity
  for (const [id, node] of Object.entries(nodes)) {
    const d = Math.hypot(node.lat - lat, node.lng - lng)
    if (d < bestDist) { bestDist = d; bestId = id }
  }
  return bestId
}

function makeIcon(color, label) {
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${label}</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15]
  })
}

// ─────────────────────────────────────
// NARASI PANEL FIXED — Layout terkontrol penuh
// Playback selalu pinned di bawah, teks di-clamp
// ─────────────────────────────────────
const SPEED_OPTIONS = [
  { label: '0.5x', value: 0.5 },
  { label: '1x',   value: 1   },
  { label: '2x',   value: 2   },
  { label: '4x',   value: 4   },
]

// ─────────────────────────────────────
// FUNGSI KOMPRESI DATA (DOWNSAMPLING)
// ─────────────────────────────────────
function downsampleSteps(steps, maxFrames = 40) {
  if (!steps || steps.length === 0) return []
  if (steps.length <= maxFrames) {
    return steps.map((s, i) => ({ ...s, originalIndex: i }))
  }
  const result = []
  const interval = (steps.length - 1) / (maxFrames - 1)
  for (let i = 0; i < maxFrames - 1; i++) {
    const idx = Math.floor(i * interval)
    result.push({ ...steps[idx], originalIndex: idx })
  }
  const lastIdx = steps.length - 1
  result.push({ ...steps[lastIdx], originalIndex: lastIdx })
  return result
}

// Bungkus nama landmark dalam <span> berwarna
function highlightLandmarks(text, color, landmarks = []) {
  if (!text || !landmarks.length) return text
  const names = [...new Set(landmarks.map(l => l.name))]
    .sort((a, b) => b.length - a.length)
  const pattern = new RegExp(
    `(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  )
  const parts = text.split(pattern)
  return parts.map((part, i) => {
    const isMatch = names.some(n => n.toLowerCase() === part.toLowerCase())
    return isMatch ? (
      <span key={i} style={{ color, fontWeight: 700, background: `${color}18`, borderRadius: 4, padding: '0 3px' }}>
        {part}
      </span>
    ) : part
  })
}

function NarasiPanelFixed({ algo, result, config, narasiAI, narasiLoading, onStepChange, onClose, graph, landmarks = [] }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying]     = useState(false)
  const [speed, setSpeed]             = useState(1)
  const intervalRef = useRef(null)
  
  // Dynamic Narasi State
  const [dynamicNarasi, setDynamicNarasi] = useState('')
  const [isDynamicLoading, setIsDynamicLoading] = useState(false)
  const debounceTimerRef = useRef(null)
  
  const originalSteps = result?.steps || []
  const compressedSteps = useMemo(() => downsampleSteps(originalSteps, 40), [originalSteps])
  const totalFrames = compressedSteps.length
  const totalOriginalSteps = originalSteps.length

  // Sync step ke parent
  useEffect(() => {
    if (compressedSteps[currentStep]) onStepChange?.(compressedSteps[currentStep])
  }, [currentStep, compressedSteps])

  // Reset saat algo berganti
  useEffect(() => {
    setCurrentStep(0); setIsPlaying(false)
  }, [algo])

  // Autoplay
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!isPlaying) return
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= totalFrames - 1) { setIsPlaying(false); return prev }
        return prev + 1
      })
    }, 1000 / speed)
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, totalFrames])

  const step = compressedSteps[currentStep]

  // Ekstraksi nama lokasi dan panggil LLM untuk dynamic storytelling
  useEffect(() => {
    // Hanya generate jika sedang tidak autoplay (user sedang nge-scrub / berhenti)
    if (!isPlaying && step && graph?.adj) {
      const targetIndex = step.originalIndex ?? currentStep
      const startIdx = Math.max(0, targetIndex - 5)
      const recentSteps = originalSteps.slice(startIdx, targetIndex + 1)
      
      const locations = new Set()
      recentSteps.forEach(s => {
        const edges = graph.adj[s.current]
        if (edges) {
          edges.forEach(edge => {
            if (edge.name && edge.name !== 'Unknown' && edge.name !== 'unnamed') {
              locations.add(edge.name)
            }
          })
        }
      })
      
      const locArray = Array.from(locations).slice(0, 3) // maksimal ambil 3 nama unik
      if (locArray.length > 0) {
        setIsDynamicLoading(true)
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(async () => {
          try {
            const { generateNarasiStep } = await import('../../utils/api')
            const text = await generateNarasiStep({ algo, locations: locArray })
            if (text) setDynamicNarasi(text)
          } catch (e) {
            console.error(e)
          } finally {
            setIsDynamicLoading(false)
          }
        }, 500)
      } else {
        setDynamicNarasi('') // Kosongkan bila tidak ada nama jalan (pakai fallback)
      }
    }
  }, [step, isPlaying, algo, graph, originalSteps, currentStep])

  // ── Per-paragraf display untuk narasi AI
  const aiParagraphs = useMemo(() => {
    if (!narasiAI) return []
    return narasiAI.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  }, [narasiAI])

  const progressPct = totalFrames > 1 ? currentStep / (totalFrames - 1) : 0

  const activeParagraphIdx = useMemo(() => {
    if (!aiParagraphs.length) return 0
    return Math.min(Math.floor(progressPct * aiParagraphs.length), aiParagraphs.length - 1)
  }, [progressPct, aiParagraphs.length])

  // ── Teks yang ditampilkan
  const getDisplayContent = () => {
    // Prioritas 1: AI sedang loading
    if (narasiLoading) return { text: 'AI Lokal sedang merangkai cerita perjalananmu... sebentar ya!', isLoading: true }
    // Prioritas 2: Narasi AI penuh tersedia → tampilkan per-paragraf dengan highlight
    if (narasiAI && aiParagraphs.length) {
      return { text: aiParagraphs[activeParagraphIdx], isAI: true }
    }
    // Prioritas 3: Narasi dinamis per-step dari debounced LLM
    if (isDynamicLoading) return { text: 'Sedang membaca kondisi sekitar rute... (AI Lokal)', isLoading: true }
    if (dynamicNarasi) return { text: dynamicNarasi, isDynamic: true }
    // Prioritas 4: Fallback naratif TANPA angka atau node ID
    if (!step) return { text: '' }
    if (algo === 'bfs') {
      const phrases = [
        '"Aku mulai menyebarkan sayapku ke segala penjuru. Tidak ada jalan yang akan aku lewatkan, satu per satu pasti akan aku periksa."',
        '"Pelan tapi pasti... aku terus melangkah. Bukan soal cepat, tapi soal tidak melewatkan satu pun kemungkinan."',
        '"Area pencarianku semakin meluas. Ini memang capek, tapi aku tidak akan menyerah sebelum memetakan semuanya."',
        '"Aku seperti gelombang air yang terus menyebar. Lambat, tapi pasti akan mencapai setiap sudut."',
        '"Tidak ada jalan pintas buatku. Tapi justru itulah kekuatanku — aku tidak pernah salah jalan."',
      ]
      return { text: phrases[currentStep % phrases.length] }
    }
    if (algo === 'astar') {
      const phrases = [
        '"Instingku mengatakan arahnya ke sana. Aku tidak asal tebak — aku sudah kalkulasi semuanya."',
        '"Jalur ini terasa paling menjanjikan. Kombinasi antara seberapa jauh sudah aku tempuh dan seberapa dekat ke tujuan — semuanya masuk akal."',
        '"Aku mengeliminasi jalur-jalur yang tidak efisien. Kenapa buang waktu di jalan yang jelas salah?"',
        '"Satu langkah lebih dekat. Perhitunganku mengatakan ini jalur yang benar. Aku percaya data."',
        '"Heuristikku tajam hari ini. Aku bisa merasakan tujuan sudah dekat."',
      ]
      return { text: phrases[currentStep % phrases.length] }
    }
    if (algo === 'bruteforce') {
      if (step.type === 'found') return {
        text: '"Selesai! Aku telah memeriksa setiap kemungkinan dan ini adalah jalur TERPENDEK yang bisa ada. Tidak ada yang lebih pendek dari ini, aku jamin."'
      }
      if (currentStep === 0) return {
        text: '"Aku mulai dengan cara yang paling pasti: periksa semua kemungkinan path. Lambat? Iya. Tapi hasilnya 100% optimal dan tidak bisa dibantah."'
      }
      const phrases = [
        '"Aku sedang menjelajahi semua cabang dengan backtracking. Masih banyak yang harus kukunjungi."',
        '"Lebih dari separuh kemungkinan sudah kupeiksa. Melelahkan, tapi tidak ada jalan pintas untuk kesempurnaan."',
        '"Hampir selesai memeriksa semua kemungkinan. Jawaban terbaik sudah hampir pasti."',
      ]
      return { text: phrases[currentStep % phrases.length] }
    }
    if (algo === 'greedy') {
      if (step.type === 'found') return {
        text: '"Sampai! Aku langsung menuju yang tampak paling dekat dan berhasil. Cepat dan efisien!"'
      }
      if (currentStep === 0) return {
        text: '"Strategiku sederhana: selalu pilih node yang terasa paling dekat ke tujuan. Tidak peduli berapa jauh sudah kutempuh, yang penting goal terasa makin dekat."'
      }
      if (step.hScore) return {
        text: `"Node ini hanya ${step.hScore}m dari tujuan menurut estimasiku. Ini yang paling menjanjikan dari semua kandidat — aku pilih ini!"`
      }
      const phrases = [
        '"Aku terus bergerak ke arah yang tampak paling dekat ke tujuan."',
        '"Pilih yang tampak terbaik sekarang — itulah prinsipku!"',
      ]
      return { text: phrases[currentStep % phrases.length] }
    }
    return { text: '' }
  }

  // Badge status
  const getStatus = () => {
    if (result?.stuckNode && step?.current === result.stuckNode) return { label: 'Terjebak', color: '#EF4444', bg: '#FEF2F2' }
    if (!result?.path) return { label: 'Menjelajah', color: '#5B5FEF', bg: '#EEF2FF' }
    if (currentStep >= totalFrames - 2) return { label: 'Ditemukan', color: '#10B981', bg: '#F0FDF4' }
    return { label: 'Menjelajah', color: '#5B5FEF', bg: '#EEF2FF' }
  }
  const status = getStatus()

  // Info step extras
  const stepExtras = []
  if (step?.g != null) stepExtras.push({ label: 'g(n)', value: `${Math.round(step.g)}m` })
  if (step?.h != null) stepExtras.push({ label: 'h(n)', value: `${Math.round(step.h)}m` })
  if (step?.f != null) stepExtras.push({ label: 'f(n)', value: Math.round(step.f), highlight: true, color: config.color })

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto auto 1fr auto auto',
      height: '100%',
      overflow: 'hidden',
      padding: '14px 20px 12px',
      boxSizing: 'border-box',
      gap: 0,
    }}>

      {/* ROW 1: Header — algo name + stats + close */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:config.color, flexShrink:0 }} />
          <span style={{ fontSize:14, fontWeight:800, color:'#111827' }}>{config.label}</span>
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#F3F4F6', color:'#6B7280', fontWeight:500 }}>{config.sub}</span>
          {/* Tidak ada Local Optima badge (Hill Climbing sudah dihapus) */}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {/* Stats compact */}
          <div style={{ display:'flex', gap:14 }}>
            {[
              { v: result?.cost ? `${(result.cost/1000).toFixed(2)} km` : '—', l: 'Jarak' },
              { v: result?.expanded ?? '—', l: 'Nodes' },
              { v: result?.time != null ? `${result.time} ms` : '—', l: 'Waktu' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#111827', lineHeight:1.2 }}>{v}</div>
                <div style={{ fontSize:10, color:'#9CA3AF', fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ background:'#F3F4F6', border:'none', borderRadius:8, padding:'5px 6px', cursor:'pointer', display:'flex', alignItems:'center' }}>
            <X size={14} color="#6B7280" />
          </button>
        </div>
      </div>

      {/* ROW 2: Status badge + step info + compact node stats */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexShrink:0 }}>
        <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:status.bg, color:status.color, fontWeight:700, flexShrink:0 }}>
          ● {status.label}
        </span>
        <span style={{ fontSize:11, color:'#9CA3AF', fontWeight:500, flexShrink:0 }}>
          Step {(step?.originalIndex ?? currentStep) + 1} / {totalOriginalSteps}
        </span>
        {/* Tidak ada attempt counter untuk Brute Force / Greedy */}
        {/* Compact node stats — horizontal */}
        <div style={{ marginLeft:'auto', display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#6B7280' }}>Node: <b style={{ color:'#111827' }}>{step?.current ? step.current.slice(-4) : '—'}</b></span>
          <span style={{ fontSize:11, color:'#9CA3AF' }}>·</span>
          <span style={{ fontSize:11, color:'#6B7280' }}>Dikunjungi: <b style={{ color:'#111827' }}>{step?.visited ?? currentStep + 1}</b></span>
          {stepExtras.map(({ label, value, highlight, color }) => (
            <><span key={label+'-dot'} style={{ fontSize:11, color:'#9CA3AF' }}>·</span>
            <span key={label} style={{ fontSize:11, color:'#6B7280' }}>{label}: <b style={{ color: highlight ? color : '#111827' }}>{value}</b></span></>
          ))}
        </div>
      </div>

      {/* ROW 3: Teks narasi + paragraph dots navigator */}
      {(() => {
        const content = getDisplayContent()
        return (
          <div style={{ minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column', gap:6 }}>
            {/* Paragraph dots — hanya tampil jika narasi AI punya beberapa paragraf */}
            {narasiAI && aiParagraphs.length > 1 && (
              <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                {aiParagraphs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIsPlaying(false)
                      const target = Math.round((i / aiParagraphs.length) * (totalFrames - 1))
                      setCurrentStep(target)
                      onStepChange?.(compressedSteps[target])
                    }}
                    style={{
                      width: i === activeParagraphIdx ? 18 : 6,
                      height: 6, borderRadius: 3,
                      background: i === activeParagraphIdx ? config.color : '#E5E7EB',
                      border: 'none', cursor: 'pointer', padding: 0,
                      transition: 'all 0.25s ease',
                      flexShrink: 0,
                    }}
                    title={`Paragraf ${i + 1}`}
                  />
                ))}
                <span style={{ fontSize:10, color:'#9CA3AF', marginLeft:4 }}>
                  {activeParagraphIdx + 1}/{aiParagraphs.length}
                </span>
              </div>
            )}
            {/* Teks narasi */}
            <div style={{ overflowY: narasiAI ? 'auto' : 'hidden', flex:1, paddingRight:4 }}>
              {content.isLoading ? (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', gap:3 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width:6, height:6, borderRadius:'50%', background: config.color,
                        animation:'narasi-dot-bounce 1s infinite',
                        animationDelay:`${i*150}ms`,
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize:12, color:'#9CA3AF', fontStyle:'italic' }}>{content.text}</span>
                </div>
              ) : (
                <p style={{
                  margin: 0, fontSize: 13, color: '#374151',
                  lineHeight: 1.65, fontWeight: 500,
                  ...(!narasiAI && !content.isDynamic ? {
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  } : {})
                }}>
                  {content.isAI
                    ? highlightLandmarks(content.text, config.color, landmarks)
                    : content.text
                  }
                </p>
              )}
            </div>
          </div>
        )
      })()}

      {/* ROW 4: Slider progress */}
      <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:8, flexShrink:0 }}>
        <span style={{ fontSize:11, color:'#9CA3AF', fontWeight:500, minWidth:14, textAlign:'right' }}>{(step?.originalIndex ?? currentStep) + 1}</span>
        <div style={{ flex:1, position:'relative', height:16, display:'flex', alignItems:'center' }}>
          <input
            type="range"
            min={0} max={Math.max(totalFrames - 1, 0)}
            value={currentStep}
            onChange={e => { setCurrentStep(+e.target.value); setIsPlaying(false) }}
            style={{
              width:'100%', height:4, appearance:'none', WebkitAppearance:'none',
              background:`linear-gradient(to right, ${config.color} ${(currentStep/(Math.max(totalFrames-1,1)))*100}%, #E5E7EB ${(currentStep/(Math.max(totalFrames-1,1)))*100}%)`,
              borderRadius:2, outline:'none', cursor:'pointer',
            }}
          />
        </div>
        <span style={{ fontSize:11, color:'#9CA3AF', fontWeight:500, minWidth:14 }}>{totalOriginalSteps}</span>
      </div>

      {/* ROW 5: Speed selector + Playback controls — PINNED */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8, flexShrink:0 }}>
        {/* Speed buttons */}
        <div style={{ display:'flex', gap:4 }}>
          {SPEED_OPTIONS.map(({ label, value }) => (
            <button key={label} onClick={() => setSpeed(value)} style={{
              padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:600,
              background: speed === value ? config.color : '#F3F4F6',
              color: speed === value ? 'white' : '#6B7280',
              border: 'none', cursor:'pointer', transition:'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Playback buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button
            onClick={() => { setCurrentStep(0); setIsPlaying(false) }}
            style={{ background:'#F3F4F6', border:'none', borderRadius:10, padding:'7px 9px', cursor:'pointer', display:'flex', alignItems:'center' }}
          >
            <SkipBack size={14} color="#6B7280" />
          </button>
          <button
            onClick={() => setIsPlaying(p => !p)}
            style={{
              background: config.color, border:'none', borderRadius:12, padding:'9px 14px',
              cursor:'pointer', display:'flex', alignItems:'center',
              boxShadow:`0 4px 12px ${config.color}44`,
            }}
          >
            {isPlaying ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}
          </button>
          <button
            onClick={() => setCurrentStep(prev => Math.min(prev + 1, totalFrames - 1))}
            style={{ background:'#F3F4F6', border:'none', borderRadius:10, padding:'7px 9px', cursor:'pointer', display:'flex', alignItems:'center' }}
          >
            <SkipForward size={14} color="#6B7280" />
          </button>
        </div>

        <span style={{ fontSize:11, color:'#9CA3AF', fontWeight:500 }}>Kecepatan</span>
      </div>
    </div>
  )
}


export default function CariRute({ graph: graphProp }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { addRiwayat } = useAppStore()
  const mapRef     = useRef(null)
  const hasAutoSearched = useRef(false)

  const [graph, setGraph]             = useState(graphProp || null)
  const [startNode, setStartNode]     = useState(null)
  const [goalNode, setGoalNode]       = useState(null)
  const [startLabel, setStartLabel]   = useState('')
  const [goalLabel, setGoalLabel]     = useState('')
  const [waypointNode, setWaypointNode] = useState(null)
  const [waypointLabel, setWaypointLabel] = useState(null)
  const [results, setResults]         = useState(null)
  const [activeAlgo, setActiveAlgo]   = useState(null)
  const [isRunning, setIsRunning]     = useState(false)
  const [showNarasi, setShowNarasi]   = useState(false)
  const [narasi, setNarasi]           = useState({})
  const [narasiLoading, setNarasiLoading] = useState(false)
  const [activeStep, setActiveStep]   = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [selectMode, setSelectMode]   = useState(null)
  const [aiPrompt, setAiPrompt]       = useState('')
  const [aiLoading, setAiLoading]     = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (!graph) loadGraph().then(g => setGraph(g))
  }, [])

  const runSearch = useCallback((sNode, gNode, wNode = null, sLabel = null, gLabel = null) => {
    if (!graph) return
    setIsRunning(true)
    setNarasi({}); setActiveAlgo(null); setShowNarasi(false)

    setTimeout(() => {
      const search = (s, g) => ({
        bfs:        runBFS(graph.nodes, graph.adj, s, g),
        astar:      runAStar(graph.nodes, graph.adj, s, g),
        bruteforce: runBruteForce(graph.nodes, graph.adj, s, g),
        greedy:     runGreedy(graph.nodes, graph.adj, s, g),
      })

      let bfs, astar, bruteforce, greedy
      if (wNode) {
        const r1 = search(sNode, wNode), r2 = search(wNode, gNode)
        bfs = merge(r1.bfs, r2.bfs)
        astar = merge(r1.astar, r2.astar)
        bruteforce = merge(r1.bruteforce, r2.bruteforce)
        greedy = merge(r1.greedy, r2.greedy)
      } else {
        const r = search(sNode, gNode)
        bfs = r.bfs; astar = r.astar; bruteforce = r.bruteforce; greedy = r.greedy
      }

      const newResults = { bfs, astar, bruteforce, greedy, startNode: sNode, goalNode: gNode, waypointNode: wNode }
      setResults(newResults)
      setIsRunning(false)

      const bestAlgo = [bfs, astar, bruteforce, greedy].filter(r => r.cost).sort((a,b) => a.cost - b.cost)[0]
      addRiwayat({
        startLabel: sLabel || startLabel || sNode,
        goalLabel: gLabel || goalLabel || gNode,
        startNode: sNode, goalNode: gNode,
        bestCost: bestAlgo?.cost,
        bestExpanded: bestAlgo?.expanded,
        waktu: bestAlgo?.time || 0,
      })
    }, 100)
  }, [graph, startLabel, goalLabel, addRiwayat])

  // Auto-search dari navigation state (startNode/goalNode manual)
  useEffect(() => {
    if (location.state?.startNode && location.state?.goalNode && graph && !hasAutoSearched.current) {
      hasAutoSearched.current = true
      const { startNode: s, goalNode: g, startLabel: sl, goalLabel: gl } = location.state
      setStartNode(s); setGoalNode(g); setStartLabel(sl); setGoalLabel(gl)
      setTimeout(() => runSearch(s, g, null, sl, gl), 300)
    }
  }, [graph, location.state, runSearch])

  // Helper: resolve wNode dari hasil parsed AI
  // Jika Overpass gagal (waypoint_lat null) dan tipe external,
  // fallback ke node terdekat midpoint origin-destination.
  const resolveWaypointAI = useCallback((parsed, sNode, gNode) => {
    const wType = (parsed.waypoint_type || '').toLowerCase()
    const wLabel = (
      parsed.waypoint_name ||
      parsed.waypoint_name_specific ||
      parsed.waypoint_category_external ||
      parsed.waypoint_category ||
      'Singgah'
    )

    // Case 1: Overpass berhasil → snap koordinat ke graph
    if (parsed.waypoint_lat && parsed.waypoint_lng) {
      return {
        wNode: snapToGraph(parsed.waypoint_lat, parsed.waypoint_lng, graph.nodes),
        wLabel,
        wSource: 'overpass'
      }
    }

    // Case 2: Backend sudah snap ke node_id
    if (parsed.waypoint_node_id) {
      return { wNode: parsed.waypoint_node_id, wLabel, wSource: 'overpass' }
    }

    // Case 3: Internal landmark (masjid, taman, dll)
    if (wType === 'internal') {
      const wp = resolveWaypointFromParsed(parsed, graph.landmarks, graph.nodes, sNode, gNode)
      if (wp.wNode) return { wNode: wp.wNode, wLabel: wp.wLabel || wLabel, wSource: 'internal' }
    }

    // Case 4: External tapi Overpass gagal → fallback midpoint node
    if ((wType === 'external' || wLabel) && sNode && gNode) {
      const nS = graph.nodes[sNode], nG = graph.nodes[gNode]
      if (nS && nG) {
        const midLat = (nS.lat + nG.lat) / 2
        const midLng = (nS.lng + nG.lng) / 2
        const midNode = snapToGraph(midLat, midLng, graph.nodes)
        if (midNode) return { wNode: midNode, wLabel, wSource: 'fallback' }
      }
    }

    return { wNode: null, wLabel: null, wSource: null }
  }, [graph])

  // Auto-search dari AI Prompt yang dikirim Dashboard
  const hasAutoAI = useRef(false)
  useEffect(() => {
    if (location.state?.aiPrompt && graph && !hasAutoAI.current) {
      hasAutoAI.current = true
      const prompt = location.state.aiPrompt
      setAiPrompt(prompt)
      setTimeout(async () => {
        if (!graph) return
        setAiLoading(true)
        try {
          const parsed = await parseWaypoint({ prompt, landmarks: graph.landmarks })
          let sNode = null, gNode = null, sLabel = '', gLabel = ''
          if (parsed.origin) {
            const lm = findLandmarkByName(graph.landmarks, parsed.origin)
            if (lm) { sNode = lm.node_id; sLabel = lm.name }
          }
          if (parsed.destination) {
            const lm = findLandmarkByName(graph.landmarks, parsed.destination)
            if (lm) { gNode = lm.node_id; gLabel = lm.name }
          }
          if (!sNode || !gNode) { setAiLoading(false); return }
          const { wNode, wLabel } = resolveWaypointAI(parsed, sNode, gNode)
          setStartNode(sNode); setGoalNode(gNode); setStartLabel(sLabel); setGoalLabel(gLabel)
          setWaypointNode(wNode); setWaypointLabel(wLabel)
          runSearch(sNode, gNode, wNode, sLabel, gLabel)
        } catch(e) {
          console.error('Auto AI search error:', e)
        } finally { setAiLoading(false) }
      }, 400)
    }
  }, [graph, location.state, resolveWaypointAI])

  function merge(r1, r2) {
    if (!r1?.path || !r2?.path) return { path: r1?.path || null, steps: [...(r1?.steps||[]), ...(r2?.steps||[])], expanded: (r1?.expanded||0)+(r2?.expanded||0), cost: r1?.cost||null, time: (r1?.time||0)+(r2?.time||0), stuckNode: null }
    return { path: [...r1.path, ...r2.path.slice(1)], steps: [...r1.steps, ...r2.steps], expanded: r1.expanded+r2.expanded, cost: (r1.cost||0)+(r2.cost||0), time: r1.time+r2.time, stuckNode: null }
  }

  const handleAlgoClick = async (key) => {
    if (activeAlgo === key) { setActiveAlgo(null); setShowNarasi(false); setActiveStep(null); return }
    setActiveAlgo(key); setShowNarasi(true)
    setNarasiLoading(true)
    const res = results[key]
    try {
      const startNodeData = startNode ? graph?.nodes?.[startNode] : null
      const text = await generateNarasi({
        algo: key,
        steps: res.steps,
        cost: res.cost,
        expanded: res.expanded,
        found: !!res.path,
        stuckNode: res.stuckNode,
        nodes: graph?.nodes ?? null,
        landmarks: graph?.landmarks ?? null,
        startLandmark: startLabel || 'Titik Asal',
        goalLandmark: goalLabel || 'Tujuan',
        waypointLabel: waypointLabel || null,
        startNodeData,
      })
      setNarasi(prev => ({ ...prev, [key]: text }))
    } catch(e) {
      console.error('Narasi AI error:', e)
      setNarasi(prev => ({ ...prev, [key]: null }))
    } finally { setNarasiLoading(false) }
  }

  const handleAISearch = async () => {
    if (!aiPrompt.trim() || !graph) return
    setAiLoading(true)
    setShowSuggestions(false)
    try {
      const parsed = await parseWaypoint({
        prompt: aiPrompt,
        landmarks: graph.landmarks,
        originLat: startNode ? graph.nodes?.[startNode]?.lat : null,
        originLng: startNode ? graph.nodes?.[startNode]?.lng : null,
        destLat:   goalNode  ? graph.nodes?.[goalNode]?.lat  : null,
        destLng:   goalNode  ? graph.nodes?.[goalNode]?.lng  : null,
      })

      let sNode = startNode, gNode = goalNode, sLabel = startLabel, gLabel = goalLabel
      if (parsed.origin) {
        const lm = findLandmarkByName(graph.landmarks, parsed.origin)
        if (lm) { sNode = lm.node_id; sLabel = lm.name }
      }
      if (parsed.destination) {
        const lm = findLandmarkByName(graph.landmarks, parsed.destination)
        if (lm) { gNode = lm.node_id; gLabel = lm.name }
      }
      if (!sNode || !gNode) {
        alert('Tidak bisa menemukan lokasi asal atau tujuan. Coba sebutkan nama landmark yang ada.')
        return
      }

      const { wNode, wLabel } = resolveWaypointAI(parsed, sNode, gNode)
      setStartNode(sNode); setGoalNode(gNode); setStartLabel(sLabel); setGoalLabel(gLabel)
      setWaypointNode(wNode); setWaypointLabel(wLabel)
      runSearch(sNode, gNode, wNode, sLabel, gLabel)
    } catch(e) {
      console.error('AI Search error:', e)
      if (e.message?.includes('Failed to fetch') || e.message?.includes('fetch')) {
        alert('Tidak bisa terhubung ke backend. Pastikan backend berjalan di port 8000.')
      } else {
        alert('Gagal memproses prompt. Coba lagi atau gunakan pilihan manual.')
      }
    } finally { setAiLoading(false) }
  }

  const handleReset = () => {
    setStartNode(null); setGoalNode(null); setStartLabel(''); setGoalLabel('')
    setWaypointNode(null); setWaypointLabel(null); setResults(null)
    setActiveAlgo(null); setShowNarasi(false); setNarasi({}); setActiveStep(null)
    setSelectMode(null); setShowHeatmap(false)
  }

  const handleFitBounds = () => {
    if (!mapRef.current || !results) return
    const nodeIds = [results.startNode, results.goalNode, results.waypointNode].filter(Boolean)
    if (nodeIds.length < 2) return
    const latlngs = nodeIds.map(nid => { const n = graph.nodes[nid]; return [n.lat, n.lng] })
    mapRef.current.fitBounds(latlngs, { padding: [60, 60], animate: true })
  }

  const landmarks = graph?.landmarks || []
  const activeConfig = ALGO_CONFIG.find(a => a.key === activeAlgo)
  const activeResult = results?.[activeAlgo]

    // UBAH: narasiConfig sub teks
    const narasiConfig = activeConfig ? {
    ...activeConfig,
    sub: activeConfig.key === 'bfs' ? 'Uninformed Search'
       : activeConfig.key === 'astar' ? 'Informed Search'
       : activeConfig.key === 'bruteforce' ? 'Exhaustive Search'
       : 'Best-First Search'
  } : null

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', background:'#F6F7FB', overflow:'hidden', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <SharedSidebar />

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Header — compact */}
        <div style={{ padding:'18px 28px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#111827', margin:0 }}>Cari Rute</h1>
            <p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0', fontWeight:500 }}>Temukan jalur optimal di Jakarta dengan algoritma AI</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[
              { label:'Heatmap', icon:<Layers size={13} />, active: showHeatmap, onClick: () => setShowHeatmap(p => !p) },
              { label:'Fit Peta', icon:<Navigation size={13} />, onClick: handleFitBounds },
              { label:'Reset', icon:<RotateCcw size={13} />, onClick: handleReset },
            ].map(({ label, icon, active, onClick }) => (
              <button key={label} onClick={onClick} style={{
                display:'flex', alignItems:'center', gap:5, padding:'7px 14px',
                background: active ? '#EEF2FF' : 'white',
                border: `1px solid ${active ? '#C7D2FE' : '#E5E7EB'}`,
                borderRadius:10, fontSize:12, fontWeight:500,
                color: active ? '#5B5FEF' : '#6B7280', cursor:'pointer',
              }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY: Map + Right Panel side by side, then Narasi below */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0, padding:'0 20px 16px', gap:12 }}>

          {/* Top row: Map + Right Panel */}
          <div style={{ flex:1, display:'flex', gap:14, minHeight:0, overflow:'hidden' }}>

            {/* MAP — dominant */}
            <div style={{
              flex:1, minWidth:0, background:'white', borderRadius:22,
              border:'1px solid #ECECEC', overflow:'hidden',
              boxShadow:'0 4px 20px rgba(0,0,0,0.04)', padding:5,
            }}>
              {graph ? (
                <MapView
                  graph={graph}
                  results={results}
                  activeAlgo={activeAlgo}
                  activeStep={activeStep}
                  showHeatmap={showHeatmap}
                  mapRef={mapRef}
                  onNodeSelect={(mode, nid) => {
                    const matchingLandmark = landmarks.find(lm => lm.node_id === nid);
                    const label = matchingLandmark ? matchingLandmark.name : `Node ${nid.slice(-6)}`;
                    if (mode === 'start') { setStartNode(nid); setStartLabel(label) }
                    else { setGoalNode(nid); setGoalLabel(label) }
                    setSelectMode(null)
                  }}
                  selectMode={selectMode}
                />
              ) : (
                <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#F4F5FB', borderRadius:18 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ width:40, height:40, border:'3px solid #E5E7EB', borderTopColor:'#5B5FEF', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
                    <div style={{ fontSize:13, color:'#9CA3AF', fontWeight:500 }}>Memuat peta...</div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANEL — compact 320px */}
            <div style={{
              width:320, minWidth:320, display:'flex', flexDirection:'column', gap:10, flexShrink:0, overflowY:'auto',
            }}>

              {/* Search Card — AI + Manual combined */}
              <div style={{
                background:'white', borderRadius:20, border:'1px solid #ECECEC',
                boxShadow:'0 4px 16px rgba(0,0,0,0.03)', padding:'18px 18px 14px',
              }}>
                {/* AI Prompt */}
                <div style={{ marginBottom:14, position:'relative' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                    <div style={{ background:'#EEF2FF', padding:4, borderRadius:7 }}><Sparkles size={12} color="#5B5FEF" /></div>
                    <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>AI Route Prompt</span>
                    <span style={{ fontSize:10, color:'#A78BFA', fontWeight:600, background:'#F5F3FF', padding:'2px 7px', borderRadius:20 }}>✨ Baru: Bisa cari Indomaret, Cafe, ATM!</span>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', background:'#F9FAFB', border:`1px solid ${showSuggestions ? '#A5B4FC' : '#E5E7EB'}`, borderRadius:12, padding:'8px 12px', transition:'border-color 0.2s' }}>
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISearch() } }}
                      placeholder="Dari Monas ke Semanggi singgah Indomaret terdekat..."
                      rows={1}
                      style={{ flex:1, background:'transparent', border:'none', outline:'none', resize:'none', fontSize:12, color:'#4B5563', fontFamily:'inherit', lineHeight:1.4 }}
                    />
                    <button onClick={handleAISearch} disabled={aiLoading || !aiPrompt.trim()} style={{ background: aiLoading ? '#E5E7EB' : '#EEF2FF', color:'#5B5FEF', border:'none', borderRadius:8, padding:'5px 8px', cursor:(aiLoading||!aiPrompt.trim())?'not-allowed':'pointer', display:'flex', alignItems:'center', transition:'all 0.15s' }}>
                      {aiLoading
                        ? <div style={{ width:13, height:13, border:'2px solid #A5B4FC', borderTopColor:'#5B5FEF', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                        : <Search size={13} />
                      }
                    </button>
                  </div>
                  {/* Suggestion chips */}
                  {showSuggestions && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'white', border:'1px solid #E5E7EB', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.08)', padding:'8px', marginTop:4, display:'flex', flexDirection:'column', gap:4 }}>
                      <div style={{ fontSize:10, color:'#9CA3AF', fontWeight:600, padding:'2px 6px', marginBottom:2 }}>CONTOH PENCARIAN</div>
                      {[
                        { icon:'🏪', text:'Dari Bundaran HI ke Blok M mampir Indomaret terdekat' },
                        { icon:'☕', text:'Dari Monas ke GBK singgah cafe terdekat' },
                        { icon:'💊', text:'Dari Stasiun Gambir ke Plaza Indonesia lewat apotek' },
                        { icon:'🏧', text:'Dari Taman Menteng ke Semanggi mampir ATM dulu' },
                        { icon:'⛽', text:'Dari Bundaran HI ke Semanggi, isi bensin dulu' },
                      ].map(({ icon, text }) => (
                        <button
                          key={text}
                          onMouseDown={() => { setAiPrompt(text); setShowSuggestions(false) }}
                          style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, border:'none', background:'transparent', cursor:'pointer', textAlign:'left', fontSize:12, color:'#374151', fontWeight:500, transition:'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}
                        >
                          <span>{icon}</span>
                          <span>{text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ flex:1, height:1, background:'#F3F4F6' }} />
                  <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Atau Manual</span>
                  <div style={{ flex:1, height:1, background:'#F3F4F6' }} />
                </div>

                {/* Titik Asal */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#10B981', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ color:'white', fontSize:10, fontWeight:800 }}>A</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>Titik Asal</span>
                  </div>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', top:'50%', left:12, transform:'translateY(-50%)', cursor:'pointer', zIndex:10 }} onClick={() => setSelectMode('start')}>
                      <MapPin size={13} color={selectMode==='start'?'#5B5FEF':'#9CA3AF'} />
                    </div>
                    <select
                      value={startNode || ''}
                      onChange={e => { const val=e.target.value; const lm=landmarks.find(l=>l.node_id===val); setStartNode(val); setStartLabel(lm?lm.name:val); setSelectMode(null); }}
                      style={{ width:'100%', padding:'10px 32px 10px 30px', border:selectMode==='start'?'2px solid #5B5FEF':'1px solid #E5E7EB', borderRadius:12, background:selectMode==='start'?'#F5F6FF':'#F9FAFB', fontSize:13, color:'#374151', outline:'none', appearance:'none', cursor:'pointer' }}
                    >
                      <option value="">{startLabel || 'Pilih titik asal...'}</option>
                      {landmarks.map(lm => <option key={lm.id} value={lm.node_id}>{lm.name}</option>)}
                    </select>
                    <div style={{ position:'absolute', top:'50%', right:10, transform:'translateY(-50%)', pointerEvents:'none' }}><ChevronDown size={13} color="#9CA3AF" /></div>
                  </div>
                </div>

                {/* Titik Tujuan */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#EF4444', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ color:'white', fontSize:10, fontWeight:800 }}>B</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>Tujuan</span>
                  </div>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', top:'50%', left:12, transform:'translateY(-50%)', cursor:'pointer', zIndex:10 }} onClick={() => setSelectMode('goal')}>
                      <MapPin size={13} color={selectMode==='goal'?'#EF4444':'#9CA3AF'} />
                    </div>
                    <select
                      value={goalNode || ''}
                      onChange={e => { const val=e.target.value; const lm=landmarks.find(l=>l.node_id===val); setGoalNode(val); setGoalLabel(lm?lm.name:val); setSelectMode(null); }}
                      style={{ width:'100%', padding:'10px 32px 10px 30px', border:selectMode==='goal'?'2px solid #EF4444':'1px solid #E5E7EB', borderRadius:12, background:selectMode==='goal'?'#FEF2F2':'#F9FAFB', fontSize:13, color:'#374151', outline:'none', appearance:'none', cursor:'pointer' }}
                    >
                      <option value="">{goalLabel || 'Pilih tujuan...'}</option>
                      {landmarks.map(lm => <option key={lm.id} value={lm.node_id}>{lm.name}</option>)}
                    </select>
                    <div style={{ position:'absolute', top:'50%', right:10, transform:'translateY(-50%)', pointerEvents:'none' }}><ChevronDown size={13} color="#9CA3AF" /></div>
                  </div>
                </div>

                {/* Search Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { if (startNode && goalNode) runSearch(startNode, goalNode, waypointNode) }}
                  disabled={!startNode || !goalNode || isRunning}
                  style={{
                    width:'100%', padding:'13px', marginTop:2,
                    background: startNode && goalNode ? 'linear-gradient(135deg, #5B5FEF, #7C4DFF)' : '#E5E7EB',
                    color: startNode && goalNode ? 'white' : '#9CA3AF',
                    border:'none', borderRadius:14, fontSize:13, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                    cursor: startNode && goalNode ? 'pointer' : 'not-allowed',
                    boxShadow: startNode && goalNode ? '0 4px 16px rgba(91,95,239,0.28)' : 'none',
                  }}
                >
                  {isRunning ? (
                    <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Mencari...</>
                  ) : (
                    <>Cari Rute Terbaik <ArrowRight size={15} /></>
                  )}
                </motion.button>
              </div>

              {/* Results Card */}
              {results && (
                <div style={{
                  background:'white', borderRadius:20, border:'1px solid #ECECEC',
                  boxShadow:'0 4px 16px rgba(0,0,0,0.03)', padding:'16px 18px',
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.6, marginBottom:12 }}>Hasil Algoritma</div>

                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {ALGO_CONFIG.map(({ key, label, sub, color, bg, border, text }) => {
                      const r = results[key]
                      const isActive = activeAlgo === key
                      const costs = [results.bfs?.cost, results.astar?.cost, results.bruteforce?.cost, results.greedy?.cost].filter(Boolean)
                      const isBest = r?.cost && r.cost === Math.min(...costs)

                      return (
                        <motion.div
                          key={key}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => handleAlgoClick(key)}
                          style={{
                            padding:'11px 13px', borderRadius:14, cursor:'pointer',
                            background: isActive ? bg : '#F9FAFB',
                            border: `1.5px solid ${isActive ? border : 'transparent'}`,
                            transition:'all 0.2s',
                          }}
                        >
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                              <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
                              <span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>{label}</span>
                              <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background: isActive ? 'rgba(255,255,255,0.7)' : '#ECECEC', color: isActive ? text : '#6B7280', fontWeight:500 }}>{sub}</span>
                              {isBest && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:20, background:'#D1FAE5', color:'#065F46', fontWeight:700 }}>✓ Best</span>}
                              {/* Tidak ada Local Optima badge (Hill Climbing sudah dihapus) */}
                            </div>
                            <span style={{ fontSize:13, fontWeight:800, color: isActive ? color : '#374151' }}>
                              {r?.cost ? `${(r.cost/1000).toFixed(2)} km` : '—'}
                            </span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:15 }}>
                            <span style={{ fontSize:10, color:'#9CA3AF' }}>{r?.expanded ?? '—'} nodes</span>
                            <span style={{ fontSize:10, color:'#D1D5DB' }}>·</span>
                            <span style={{ fontSize:10, color:'#9CA3AF' }}>{r?.time ?? '—'} ms</span>
                            {isActive && <span style={{ fontSize:10, fontWeight:600, color, marginLeft:'auto' }}>▶ Lihat narasi</span>}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Kesimpulan — compact inline */}
                  {results.astar?.cost && (
                    <div style={{ marginTop:10, padding:'8px 12px', background:'#F0F7FF', borderRadius:10, border:'1px solid #BFDBFE', display:'flex', gap:6, alignItems:'flex-start' }}>
                      <span style={{ fontSize:14, lineHeight:1 }}>💡</span>
                      <p style={{ margin:0, fontSize:11, color:'#3B82F6', lineHeight:1.5, fontWeight:500 }}>
                        {results.astar.cost <= (results.bfs?.cost || Infinity)
                          ? 'A* menemukan jalur optimal dengan eksplorasi paling efisien.'
                          : 'BFS menemukan jalur lebih pendek, A* lebih hemat node.'}
                        {' Brute Force menjamin jalur terpendek absolut namun paling lambat. Greedy cepat tapi tidak selalu optimal.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* NARASI PANEL — full width, fixed height, playback always pinned */}
          <AnimatePresence>
            {showNarasi && narasiConfig && activeResult && (
              <motion.div
                initial={{ opacity:0, y:12 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:12 }}
                transition={{ duration:0.25, ease:[0.22,1,0.36,1] }}
                className="narasi-outer"
                style={{
                  background: 'white',
                  boxShadow: '0 -2px 16px rgba(0,0,0,0.05)',
                  flexShrink: 0,
                  borderRadius: 20,
                  border: `1px solid #ECECEC`,
                  borderTop: `3px solid ${narasiConfig.color}`,
                  height: 230,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <NarasiPanelFixed
                  algo={activeAlgo}
                  result={activeResult}
                  config={narasiConfig}
                  narasiAI={narasi[activeAlgo]}
                  narasiLoading={narasiLoading}
                  onStepChange={setActiveStep}
                  onClose={() => { setShowNarasi(false); setActiveAlgo(null); setActiveStep(null) }}
                  graph={graph}
                  landmarks={graph?.landmarks ?? []}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes narasi-dot-bounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-4px); opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }

        /* Slider thumb styling */
        .narasi-outer input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          border: 2px solid currentColor;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          border: 2px solid #5B5FEF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}