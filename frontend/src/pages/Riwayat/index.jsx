import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, MapPin,
  ArrowRight, Trash2, ChevronLeft, ChevronRight,
  MoreVertical, Clock, Navigation2, Route,
  Search
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { loadGraph } from '../../utils/graph'
import { runBFS, runAStar, runHillClimbing } from '../../hooks/useAlgorithm'
import { useAppStore } from '../../stores/useAppStore'
import SharedSidebar from '../../components/SharedSidebar'

// ─────────────────────────────────────
// SVG CUSTOM COMPONENTS
// ─────────────────────────────────────
const MonasIcon = ({ size = 44 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width={size} height={size}>
    <defs>
      <linearGradient id="monasGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#9C27B0" /><stop offset="50%" stopColor="#7B1FA2" /><stop offset="100%" stopColor="#4A148C" /></linearGradient>
      <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#E040FB" /><stop offset="100%" stopColor="#8E24AA" /></linearGradient>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4A148C" floodOpacity="0.3" /></filter>
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

// ── SkylineIllustration diperbaiki sama persis dengan halaman Cari Rute ──
const SkylineIllustration = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" style={{ width: '100%', height: 'auto', display: 'block' }}>
    <defs>
      <filter id="shadowBlurR" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <clipPath id="groundClipR">
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
    {/* Monas di tengah */}
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
    <ellipse cx="400" cy="342" rx="310" ry="6" fill="#D2D6E9" filter="url(#shadowBlurR)" />
    <rect x="80" y="330" width="640" height="6" rx="3" fill="#4B5375" />
    <g clipPath="url(#groundClipR)">
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

// SIDEBAR diganti SharedSidebar

const ALGO_COLORS = {
  bfs: { color: '#5B5FEF', bg: '#EEF2FF', label: 'BFS', sub: 'Uninformed' },
  astar: { color: '#10B981', bg: '#F0FDF4', label: 'A*', sub: 'Informed' },
  hc: { color: '#F59E0B', bg: '#FFFBEB', label: 'Hill Climbing', sub: 'Local' },
}

const ITEMS_PER_PAGE = 5

// Sidebar diganti SharedSidebar

// ─────────────────────────────────────
// MINI MAP PREVIEW — Peta asli Leaflet dengan rute nyata
// Menjalankan algoritma terbaik dan render path di peta kecil
// ─────────────────────────────────────
function MiniMapPreview({ startNodeId, goalNodeId, graph, algoColor = '#5B5FEF', bestAlgo = 'astar' }) {
  const mapRef = useRef(null)
  const mapDivRef = useRef(null)
  const layersRef = useRef([])

  useEffect(() => {
    if (!mapDivRef.current || !graph || !startNodeId || !goalNodeId) return

    // Inisialisasi map sekali
    if (!mapRef.current) {
      mapRef.current = L.map(mapDivRef.current, {
        zoomControl: false, dragging: false, scrollWheelZoom: false,
        doubleClickZoom: false, boxZoom: false, keyboard: false,
        attributionControl: false, zoomAnimation: false, fadeAnimation: false,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    const mapObj = mapRef.current

    // Hapus layer lama
    layersRef.current.forEach(l => { try { mapObj.removeLayer(l) } catch (e) { } })
    layersRef.current = []

    const startNode = graph.nodes[startNodeId]
    const goalNode = graph.nodes[goalNodeId]
    if (!startNode || !goalNode) return

    // Jalankan algoritma terbaik untuk mendapatkan path nyata
    let result = null
    try {
      if (bestAlgo === 'bfs') {
        result = runBFS(graph.nodes, graph.adj, startNodeId, goalNodeId)
      } else if (bestAlgo === 'hc') {
        result = runHillClimbing(graph.nodes, graph.adj, startNodeId, goalNodeId)
      } else {
        result = runAStar(graph.nodes, graph.adj, startNodeId, goalNodeId)
      }
    } catch (e) {
      result = null
    }

    const allBounds = [[startNode.lat, startNode.lng], [goalNode.lat, goalNode.lng]]

    // Render path nyata jika ada
    if (result?.path && result.path.length > 1) {
      const latlngs = result.path
        .map(nid => graph.nodes[nid])
        .filter(Boolean)
        .map(n => [n.lat, n.lng])

      const line = L.polyline(latlngs, {
        color: algoColor, weight: 3, opacity: 0.95,
        lineJoin: 'round', lineCap: 'round',
      }).addTo(mapObj)
      layersRef.current.push(line)

      // Update bounds ke seluruh path
      latlngs.forEach(ll => allBounds.push(ll))
    } else {
      // Fallback: garis putus-putus A→B jika path tidak ditemukan
      const dashed = L.polyline(
        [[startNode.lat, startNode.lng], [goalNode.lat, goalNode.lng]],
        { color: algoColor, weight: 2, opacity: 0.7, dashArray: '6, 5' }
      ).addTo(mapObj)
      layersRef.current.push(dashed)
    }

    // Marker Titik A (hijau)
    const markerA = L.circleMarker([startNode.lat, startNode.lng], {
      radius: 5, color: 'white', weight: 2,
      fillColor: '#10B981', fillOpacity: 1,
    }).addTo(mapObj)
    layersRef.current.push(markerA)

    // Marker Titik B (merah)
    const markerB = L.circleMarker([goalNode.lat, goalNode.lng], {
      radius: 5, color: 'white', weight: 2,
      fillColor: '#EF4444', fillOpacity: 1,
    }).addTo(mapObj)
    layersRef.current.push(markerB)

    // Fit bounds ke seluruh rute
    mapObj.fitBounds(allBounds, { padding: [14, 14], animate: false, maxZoom: 16 })

    // Fix render glitch
    setTimeout(() => { try { mapObj.invalidateSize() } catch (e) { } }, 100)
    setTimeout(() => { try { mapObj.invalidateSize() } catch (e) { } }, 300)

  }, [startNodeId, goalNodeId, graph, algoColor, bestAlgo])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove() } catch (e) { }
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div style={{
      width: 130, height: 88, borderRadius: 14, overflow: 'hidden',
      border: '1px solid #E5E7EB', flexShrink: 0, position: 'relative',
      background: '#F8F9FD', zIndex: 1,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {graph ? (
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 16, height: 16, border: '2px solid #5B5FEF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────
// RIWAYAT CARD
// ─────────────────────────────────────
function RiwayatCard({ item, onLihatRute, onHapus, index, graph }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const date = new Date(item.timestamp)
  const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'

  const algoKey = item.bestAlgo || 'astar'
  const algoInfo = ALGO_COLORS[algoKey] || ALGO_COLORS.astar
  const isStuck = algoKey === 'hc' && item.stuckNode

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{
        background: 'white', borderRadius: 20,
        border: '1px solid #ECECEC',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 20,
        transition: 'box-shadow 0.2s',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
      whileHover={{ boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', border: '2px solid white', boxShadow: '0 0 0 1.5px #10B981' }} />
            <div style={{ width: 1.5, height: 16, background: '#E5E7EB' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', border: '2px solid white', boxShadow: '0 0 0 1.5px #EF4444' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500, marginBottom: 1 }}>Titik Asal</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.startLabel || 'Titik A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500, marginBottom: 1 }}>Titik Tujuan</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.goalLabel || 'Titik B'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 500 }}>Algoritma</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: algoInfo.bg, color: algoInfo.color,
          }}>
            {algoInfo.label}
          </span>
          {isStuck && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: '#FEE2E2', color: '#DC2626', fontWeight: 600 }}>Local Optima</span>}
          {!isStuck && item.bestCost && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: '#D1FAE5', color: '#065F46', fontWeight: 700 }}>Terbaik</span>}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{item.bestCost ? `${(item.bestCost / 1000).toFixed(2)} km` : '—'}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>Jarak</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{item.waktu != null ? `${item.waktu} ms` : '—'}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>Waktu</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{item.bestExpanded ?? '—'}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>Nodes</div>
          </div>
        </div>
      </div>

      {/* Mini Map — peta nyata dengan rute algoritmanya */}
      <MiniMapPreview
        startNodeId={item.startNode}
        goalNodeId={item.goalNode}
        graph={graph}
        algoColor={algoInfo.color}
        bestAlgo={algoKey}
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 2 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="2" width="10" height="9" rx="2" stroke="#9CA3AF" strokeWidth="1.2" />
              <path d="M4 1v2M8 1v2M1 5h10" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{dateStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <Clock size={10} color="#9CA3AF" />
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeStr}</span>
          </div>
        </div>

        <button
          onClick={() => onLihatRute(item)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 12,
            background: '#5B5FEF', color: 'white', border: 'none',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(91,95,239,0.25)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4F46E5'}
          onMouseLeave={e => e.currentTarget.style.background = '#5B5FEF'}
        >
          <ArrowRight size={13} /> Lihat Rute
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 8, color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <MoreVertical size={16} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', right: 0, top: '100%', zIndex: 100,
                  background: 'white', borderRadius: 12, border: '1px solid #ECECEC',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden',
                  minWidth: 140,
                }}
              >
                <button
                  onClick={() => { onHapus(item.id); setMenuOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#EF4444', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────
function EmptyState() {
  const navigate = useNavigate()
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <History size={36} color="#5B5FEF" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Belum ada riwayat</div>
        <div style={{ fontSize: 14, color: '#6B7280', maxWidth: 280, lineHeight: 1.6 }}>
          Riwayat pencarian rute akan muncul di sini setelah kamu menggunakan fitur Cari Rute.
        </div>
      </div>
      <button
        onClick={() => navigate('/cari-rute')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg,#5B5FEF,#7C4DFF)', color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(91,95,239,0.3)' }}
      >
        <Route size={16} /> Cari Rute Sekarang
      </button>
    </div>
  )
}

// ─────────────────────────────────────
// RIWAYAT PAGE
// ─────────────────────────────────────
export default function Riwayat() {
  const navigate = useNavigate()
  const { riwayat, clearRiwayat } = useAppStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // STATE GRAPH UNTUK MINIMAP ASLI
  const [graph, setGraph] = useState(null)

  useEffect(() => {
    loadGraph().then(setGraph)
  }, [])

  const filtered = riwayat.filter(item => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      item.startLabel?.toLowerCase().includes(q) ||
      item.goalLabel?.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleLihatRute = (item) => {
    navigate('/cari-rute', {
      state: {
        startNode: item.startNode,
        goalNode: item.goalNode,
        startLabel: item.startLabel,
        goalLabel: item.goalLabel,
      }
    })
  }

  const handleHapus = (id) => {
    // Logika hapus per item sesuai store kamu
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#F6F7FB', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <SharedSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '32px 36px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>Riwayat Pencarian</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '6px 0 0', fontWeight: 500 }}>
              Daftar riwayat pencarian rute yang telah kamu lakukan
            </p>
          </motion.div>

          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { icon: <Navigation2 size={14} color="#5B5FEF" />, label: 'Total Rute', val: riwayat.length, bg: '#EEF2FF' },
            ].map(({ icon, label, val, bg }) => (
              <div key={label} style={{ background: 'white', borderRadius: 16, padding: '10px 18px', border: '1px solid #ECECEC', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 36px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #ECECEC', borderRadius: 14, padding: '10px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.03)' }}>
            <Search size={15} color="#9CA3AF" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari berdasarkan lokasi..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent', fontFamily: 'inherit' }}
            />
          </div>

          {riwayat.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, fontWeight: 500, color: '#EF4444', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
            >
              <Trash2 size={14} /> Hapus Semua
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 36px 24px' }}>
          {riwayat.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
              <Search size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 15, fontWeight: 600 }}>Tidak ditemukan</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Coba kata kunci lain</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentItems.map((item, i) => (
                <RiwayatCard
                  key={item.id}
                  item={item}
                  index={i}
                  graph={graph}
                  onLihatRute={handleLihatRute}
                  onHapus={handleHapus}
                />
              ))}
            </div>
          )}
        </div>

        {filtered.length > ITEMS_PER_PAGE && (
          <div style={{ padding: '12px 36px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #ECECEC', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: '#374151' }}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: page === p ? '#5B5FEF' : 'white', color: page === p ? 'white' : '#374151', fontSize: 13, fontWeight: page === p ? 700 : 500, cursor: 'pointer', border: page === p ? 'none' : '1px solid #ECECEC', transition: 'all 0.15s' }}>
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #ECECEC', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: '#374151' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'white', borderRadius: 24, padding: '28px 32px', maxWidth: 360, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Trash2 size={22} color="#EF4444" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Hapus Semua Riwayat?</div>
              <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
                Semua riwayat pencarian akan dihapus permanen dan tidak bisa dikembalikan.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  style={{ flex: 1, padding: '12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  onClick={() => { clearRiwayat(); setShowClearConfirm(false); setPage(1) }}
                  style={{ flex: 1, padding: '12px', background: '#EF4444', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                >
                  Hapus Semua
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}