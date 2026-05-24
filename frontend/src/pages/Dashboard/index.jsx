import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar, Clock as ClockIcon, Sparkles, ArrowRight,
  TrendingUp, TrendingDown, Navigation, CheckCircle2, ChevronRight, ChevronDown, MapPin, Search
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '../../stores/useAppStore'
import SharedSidebar from '../../components/SharedSidebar'

// ─── SVG CUSTOM COMPONENTS ────────────────────────────────
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
    {/* Background Illustration */}
    <rect width="800" height="400" rx="0" fill="#F4F5FB" />
    <circle cx="400" cy="240" r="140" fill="#EAEBF8" />

    {/* Clouds */}
    <g fill="#E6E8F6">
      <circle cx="210" cy="110" r="18" />
      <circle cx="235" cy="95" r="25" />
      <circle cx="265" cy="105" r="20" />
      <rect x="195" y="95" width="85" height="28" rx="14" />
    </g>
    <g fill="#E6E8F6">
      <circle cx="560" cy="120" r="15" />
      <circle cx="580" cy="105" r="22" />
      <circle cx="605" cy="115" r="18" />
      <rect x="550" y="105" width="70" height="25" rx="12.5" />
    </g>

    {/* Buildings Left */}
    <g id="buildings-left">
      <rect x="90" y="210" width="15" height="120" fill="#ABB3E6" />
      <rect x="105" y="210" width="15" height="120" fill="#949ED4" />
      <polygon points="90,210 105,185 105,210" fill="#ABB3E6" />
      <polygon points="120,210 105,185 105,210" fill="#949ED4" />
      <rect x="104" y="165" width="2" height="20" fill="#949ED4" />
      <rect x="125" y="195" width="17" height="135" fill="#BCC4F0" />
      <rect x="142" y="195" width="17" height="135" fill="#A2ABDE" />
      <path d="M 125 195 A 17 17 0 0 1 142 175 L 142 195 Z" fill="#BCC4F0" />
      <path d="M 159 195 A 17 17 0 0 0 142 175 L 142 195 Z" fill="#A2ABDE" />
      <rect x="141" y="155" width="2" height="20" fill="#A2ABDE" />
      <line x1="131" y1="210" x2="131" y2="310" stroke="#E1E4FA" strokeWidth="2" strokeDasharray="4 4" opacity="0.6"/>
      <line x1="136" y1="210" x2="136" y2="310" stroke="#E1E4FA" strokeWidth="2" strokeDasharray="2 4" opacity="0.6"/>
      <rect x="165" y="230" width="15" height="100" fill="#ABB3E6" />
      <rect x="180" y="230" width="15" height="100" fill="#949ED4" />
      <rect x="170" y="200" width="10" height="30" fill="#ABB3E6" />
      <rect x="180" y="200" width="10" height="30" fill="#949ED4" />
      <rect x="200" y="245" width="20" height="85" fill="#BCC4F0" />
      <rect x="220" y="245" width="20" height="85" fill="#A2ABDE" />
      <circle cx="210" cy="260" r="1.5" fill="#E1E4FA" />
      <circle cx="210" cy="275" r="1.5" fill="#E1E4FA" />
      <circle cx="210" cy="290" r="1.5" fill="#E1E4FA" />
    </g>

    {/* Buildings Right */}
    <g id="buildings-right">
      <rect x="520" y="225" width="18" height="105" fill="#ABB3E6" />
      <rect x="538" y="225" width="18" height="105" fill="#949ED4" />
      <circle cx="529" cy="245" r="2" fill="#E1E4FA" opacity="0.7"/>
      <circle cx="529" cy="265" r="2" fill="#E1E4FA" opacity="0.7"/>
      <rect x="565" y="160" width="23" height="170" fill="#BCC4F0" />
      <rect x="588" y="160" width="23" height="170" fill="#A2ABDE" />
      <line x1="573" y1="175" x2="573" y2="310" stroke="#E1E4FA" strokeWidth="2" strokeDasharray="4 4" opacity="0.7"/>
      <line x1="580" y1="175" x2="580" y2="310" stroke="#E1E4FA" strokeWidth="2" strokeDasharray="4 4" opacity="0.7"/>
      <line x1="596" y1="175" x2="596" y2="310" stroke="#C0C6ED" strokeWidth="2" strokeDasharray="4 4" opacity="0.7"/>
      <line x1="603" y1="175" x2="603" y2="310" stroke="#C0C6ED" strokeWidth="2" strokeDasharray="4 4" opacity="0.7"/>
      <rect x="630" y="195" width="10" height="35" fill="#ABB3E6" />
      <rect x="640" y="195" width="10" height="35" fill="#949ED4" />
      <rect x="625" y="230" width="15" height="100" fill="#ABB3E6" />
      <rect x="640" y="230" width="15" height="100" fill="#949ED4" />
      <rect x="665" y="240" width="15" height="90" fill="#BCC4F0" />
      <rect x="680" y="240" width="15" height="90" fill="#A2ABDE" />
      <polygon points="665,240 680,225 680,240" fill="#BCC4F0" />
      <polygon points="695,240 680,225 680,240" fill="#A2ABDE" />
    </g>

    {/* Monas Center */}
    <g id="monas">
      <polygon points="365,330 400,330 400,315 375,315" fill="#D0D3F2" />
      <polygon points="400,330 435,330 425,315 400,315" fill="#A9B0DE" />
      <polygon points="300,285 400,285 400,315 375,315" fill="#D0D3F2" />
      <polygon points="400,285 500,285 425,315 400,315" fill="#A9B0DE" />
      <rect x="300" y="275" width="100" height="10" fill="#E1E4FA" />
      <rect x="400" y="275" width="100" height="10" fill="#BAC1E8" />
      <rect x="385" y="265" width="15" height="10" fill="#D0D3F2" />
      <rect x="400" y="265" width="15" height="10" fill="#A9B0DE" />
      <polygon points="385,265 400,265 400,80 392,80" fill="#E1E4FA" />
      <polygon points="400,265 415,265 408,80 400,80" fill="#BAC1E8" />
      <polygon points="388,80 400,80 400,70 383,70" fill="#D0D3F2" />
      <polygon points="400,80 412,80 417,70 400,70" fill="#A9B0DE" />
      <polygon points="383,70 400,70 400,25 391,55" fill="#B4BCE8" />
      <polygon points="400,70 417,70 409,55 400,25" fill="#919BCE" />
    </g>

    {/* Shadows & Ground */}
    <ellipse cx="400" cy="342" rx="310" ry="6" fill="#D2D6E9" filter="url(#shadowBlur)" />
    <rect x="80" y="330" width="640" height="6" rx="3" fill="#4B5375" />
    <rect x="90" y="336" width="620" height="4" rx="2" fill="#323956" />
    <path d="M 395 330 L 395 318 A 5 5 0 0 1 405 318 L 405 330 Z" fill="#323956" />

    {/* Trees */}
    <g clipPath="url(#groundClip)">
      <circle cx="140" cy="330" r="18" fill="#A0D4B0" />
      <ellipse cx="200" cy="330" rx="40" ry="22" fill="#85C299" />
      <circle cx="245" cy="330" r="20" fill="#B5E3C3" />
      <ellipse cx="295" cy="330" rx="45" ry="25" fill="#A0D4B0" />
      <circle cx="345" cy="330" r="15" fill="#76B38A" />
      <ellipse cx="460" cy="330" rx="40" ry="22" fill="#A0D4B0" />
      <circle cx="510" cy="330" r="22" fill="#85C299" />
      <circle cx="550" cy="330" r="15" fill="#B5E3C3" />
      <ellipse cx="610" cy="330" rx="45" ry="22" fill="#A0D4B0" />
      <circle cx="660" cy="330" r="18" fill="#85C299" />
    </g>
  </svg>
)

const RouteIcon = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="36" fill="#EEF2FF"/>
    <circle cx="36" cy="36" r="28" fill="url(#paint0_radial)" fillOpacity="0.5"/>
    <path d="M22 48C22 41 28 38 32 34C37 29 39 24 45 24" stroke="url(#paint1_linear)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="22" cy="48" r="5" fill="#6366F1"/>
    <circle cx="22" cy="48" r="9" fill="#6366F1" fillOpacity="0.15"/>
    <circle cx="32" cy="34" r="4" fill="#8B5CF6"/>
    <circle cx="32" cy="34" r="7" fill="#8B5CF6" fillOpacity="0.15"/>
    <path d="M45 17C41.686 17 39 19.686 39 23C39 28 45 34 45 34C45 34 51 28 51 23C51 19.686 48.314 17 45 17Z" fill="url(#paint2_linear)" />
    <circle cx="45" cy="23" r="2.5" fill="white"/>
    <path d="M50 42L51.5 45L55 46L51.5 47L50 50L48.5 47L45 46L48.5 45L50 42Z" fill="#A78BFA" fillOpacity="0.8" />
    <defs>
      <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 36) rotate(90) scale(28)">
        <stop stopColor="#C7D2FE"/>
        <stop offset="1" stopColor="#EEF2FF" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="paint1_linear" x1="22" y1="48" x2="45" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1"/>
        <stop offset="1" stopColor="#8B5CF6"/>
      </linearGradient>
      <linearGradient id="paint2_linear" x1="39" y1="17" x2="51" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1"/>
        <stop offset="1" stopColor="#8B5CF6"/>
      </linearGradient>
    </defs>
  </svg>
)

const ClockStatIcon = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="36" fill="#ECFDF5"/>
    <circle cx="36" cy="36" r="27" fill="url(#glowClock)" fillOpacity="0.55"/>
    <circle cx="36" cy="36" r="17" stroke="url(#clockStroke)" strokeWidth="4" strokeLinecap="round" />
    <circle cx="36" cy="36" r="2.8" fill="#10B981"/>
    <path d="M36 36L36 28" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M36 36L43 40" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="36" cy="18" r="2" fill="#A7F3D0"/>
    <circle cx="54" cy="36" r="2" fill="#A7F3D0"/>
    <circle cx="36" cy="54" r="2" fill="#A7F3D0"/>
    <circle cx="18" cy="36" r="2" fill="#A7F3D0"/>
    <path d="M51 18L52.5 21L56 22L52.5 23L51 26L49.5 23L46 22L49.5 21L51 18Z" fill="#6EE7B7" fillOpacity="0.85" />
    <defs>
      <radialGradient id="glowClock" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 36) rotate(90) scale(27)">
        <stop stopColor="#A7F3D0"/>
        <stop offset="1" stopColor="#ECFDF5" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="clockStroke" x1="19" y1="19" x2="53" y2="53" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34D399"/>
        <stop offset="1" stopColor="#10B981"/>
      </linearGradient>
    </defs>
  </svg>
)

const MapStatIcon = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="36" fill="#FFF7ED"/>
    <circle cx="36" cy="36" r="27" fill="url(#glowMap)" fillOpacity="0.55"/>
    <path d="M22 24L32 20L42 24L50 20V48L42 52L32 48L22 52V24Z" fill="url(#mapGradient)" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
    <path d="M32 20V48" stroke="#FDBA74" strokeWidth="1.8"/>
    <path d="M42 24V52" stroke="#FDBA74" strokeWidth="1.8"/>
    <path d="M36 28C32.686 28 30 30.686 30 34C30 39 36 45 36 45C36 45 42 39 42 34C42 30.686 39.314 28 36 28Z" fill="url(#pinGradient)" />
    <circle cx="36" cy="34" r="2.5" fill="white"/>
    <circle cx="26" cy="42" r="2" fill="#FDBA74"/>
    <circle cx="46" cy="38" r="2" fill="#FDBA74"/>
    <path d="M52 18L53.5 21L57 22L53.5 23L52 26L50.5 23L47 22L50.5 21L52 18Z" fill="#FBBF24" fillOpacity="0.9" />
    <defs>
      <radialGradient id="glowMap" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 36) rotate(90) scale(27)">
        <stop stopColor="#FED7AA"/>
        <stop offset="1" stopColor="#FFF7ED" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="mapGradient" x1="22" y1="20" x2="50" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE68A"/>
        <stop offset="1" stopColor="#FDBA74"/>
      </linearGradient>
      <linearGradient id="pinGradient" x1="30" y1="28" x2="42" y2="45" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B"/>
        <stop offset="1" stopColor="#FB923C"/>
      </linearGradient>
    </defs>
  </svg>
)

// ─── Constants ───────────────────────────────────────────
const ALGO_INFO = [
  { color: '#5B5FEF', bg: '#EEF2FF', label: 'BFS',         sub: 'Breadth First Search', desc: 'Mencari rute terpendek berdasarkan jumlah langkah' },
  { color: '#10B981', bg: '#F0FDF4', label: 'A*',           sub: 'A Star',               desc: 'Algoritma cerdas dengan heuristik untuk rute optimal' },
  { color: '#EF4444', bg: '#FEF2F2', label: 'Brute Force',  sub: 'Exhaustive Search',    desc: 'Memeriksa semua kemungkinan jalur untuk menemukan yang terpendek secara absolut' },
  { color: '#EC4899', bg: '#FDF2F8', label: 'Greedy',       sub: 'Best-First Search',    desc: 'Selalu memilih node yang tampak paling dekat ke tujuan tanpa mempertimbangkan jarak tempuh' },
]

// ─── LiveClock ────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const days   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  const d = time
  const dateStr = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} WIB`
  
  return (
    <div style={{
      background: 'white', borderRadius: 20, padding: '12px 20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #ECECEC',
      display: 'flex', alignItems: 'center', gap: 16
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Calendar size={15} color="#9CA3AF" />
        <span style={{ fontSize:13, color:'#6B7280', fontWeight:500 }}>{dateStr}</span>
      </div>
      <div style={{ width:1, height:16, background:'#E5E7EB' }} />
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <ClockIcon size={15} color="#5B5FEF" />
        <span style={{ fontSize:13, color:'#374151', fontWeight:600 }}>{timeStr}</span>
      </div>
    </div>
  )
}

// Sidebar dihapus — sekarang pakai SharedSidebar

// ─── MiniMap ─────────────────────────────────────────────
function MiniMap() {
  const divRef = useRef(null)
  const mapObj = useRef(null)

  useEffect(() => {
    if (mapObj.current || !divRef.current) return
    mapObj.current = L.map(divRef.current, { 
      center: [-6.2088, 106.8456], 
      zoom: 12, 
      zoomControl: false, 
      scrollWheelZoom: false, 
      dragging: true 
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(mapObj.current)
  }, [])

  const handleZoomIn = () => mapObj.current?.zoomIn()
  const handleZoomOut = () => mapObj.current?.zoomOut()
  const handleRecenter = () => mapObj.current?.setView([-6.2088, 106.8456], 12)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: 24, overflow: 'hidden' }}>
      <div ref={divRef} style={{ width: '100%', height: '100%' }} />

      <div style={{ position:'absolute', top:20, left:20, zIndex:500 }}>
        <motion.div 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRecenter}
          style={{ width:40, height:40, background:'white', borderRadius:12, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:'1px solid #F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
        >
          <Navigation size={16} color="#6B7280" />
        </motion.div>
      </div>

      <div style={{ position:'absolute', top:20, right:20, zIndex:500, display:'flex', flexDirection:'column', gap:6 }}>
        <motion.div 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleZoomIn} 
          style={{ width:40, height:40, background:'white', borderRadius:12, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:'1px solid #F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:22, fontWeight:500, color:'#374151', userSelect:'none' }}
        >+</motion.div>
        <motion.div 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleZoomOut} 
          style={{ width:40, height:40, background:'white', borderRadius:12, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:'1px solid #F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:22, fontWeight:500, color:'#374151', userSelect:'none' }}
        >−</motion.div>
      </div>

      <div style={{
        position:'absolute', bottom:20, left:20, zIndex:500, display:'flex', alignItems:'center', gap:20,
        background:'rgba(255,255,255,0.9)', backdropFilter:'blur(10px)', borderRadius:24, padding:'12px 20px',
        boxShadow:'0 4px 20px rgba(0,0,0,0.05)', border:'1px solid rgba(255,255,255,0.8)',
      }}>
        {[ { color:'#5B5FEF', label:'BFS' }, { color:'#10B981', label:'A*' }, { color:'#EF4444', label:'Brute Force' }, { color:'#EC4899', label:'Greedy' } ].map(({ color, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:color }} />
            <span style={{ fontSize:13, color:'#374151', fontWeight:600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────
function StatCard({ iconNode, label, value, sub, trend, trendUp, delay }) {
  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4 }}
      style={{
        flex:1, background:'white', borderRadius:24, padding:'20px', boxShadow:'0 4px 20px rgba(0,0,0,0.02)', border:'1px solid #ECECEC',
        display:'flex', alignItems:'center', gap:16
      }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {iconNode}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:24, fontWeight:800, color:'#111827', lineHeight:1 }}>{value}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
          <span style={{ fontSize:11, color:'#9CA3AF' }}>{sub}</span>
          {trend && (
            <div style={{ display:'flex', alignItems:'center', gap:2, fontSize:10, fontWeight:700, color: trendUp ? '#10B981' : '#EF4444', background: trendUp ? '#ECFDF5' : '#FEF2F2', padding:'2px 6px', borderRadius:12 }}>
              {trendUp ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />} {trend}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Dashboard ───────────────────────────────────────────
export default function Dashboard({ graph, onStartSearch }) {
  const navigate = useNavigate()
  const store    = useAppStore()
  const [startId,  setStartId]  = useState('')
  const [goalId,   setGoalId]   = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [showSugg, setShowSugg] = useState(false)

  const landmarks   = graph?.landmarks || []
  const totalLokasi = landmarks.length

  // Stats dinamis dari store
  const totalRute   = store.totalRute
  const totalRiwayat = store.riwayat?.length || 0
  const rataWaktu = totalRute > 0
    ? Math.round(store.totalWaktu / totalRute)
    : 0

  const handleCari = () => {
    if (!startId || !goalId) return
    const start = landmarks.find(l => l.node_id === startId)
    const goal  = landmarks.find(l => l.node_id === goalId)
    onStartSearch({ startNode:startId, goalNode:goalId, startLabel:start?.name, goalLabel:goal?.name })
    navigate('/cari-rute', {
      state: {
        startNode: startId,
        goalNode: goalId,
        startLabel: start?.name,
        goalLabel: goal?.name
      }
    })
  }

  // Submit AI prompt → kirim ke CariRute untuk diproses
  const handleAISubmit = () => {
    if (!aiPrompt.trim()) return
    navigate('/cari-rute', { state: { aiPrompt: aiPrompt.trim() } })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#F6F7FB', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <SharedSidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <div style={{ padding:'32px 36px 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
            <h1 style={{ fontSize:32, fontWeight:800, color:'#111827', margin:0, letterSpacing:'-0.5px' }}>Selamat datang! 👋</h1>
            <p style={{ fontSize:15, color:'#6B7280', margin:'6px 0 0', fontWeight:500 }}>Temukan rute terbaik di Jakarta dengan AI</p>
          </motion.div>
          <LiveClock />
        </div>

        <div style={{ flex:1, display:'flex', gap:24, padding:'0 36px 32px', overflow:'hidden', minHeight:0 }}>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:20, minWidth:0, overflow:'hidden' }}>
            <motion.div initial={{ opacity:0, scale:0.99 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.5 }} style={{ background:'white', borderRadius:28, position:'relative', flex:1, minHeight:0, boxShadow:'0 8px 30px rgba(0,0,0,0.03)', border:'1px solid #ECECEC', padding:6 }}>
              <MiniMap />
            </motion.div>

            {/* STAT CARDS - Dinamis dari store */}
            <div style={{ display:'flex', gap:20, flexShrink:0, height:110 }}>
              <StatCard 
                iconNode={<RouteIcon size={52} />} 
                label="Total Rute Dicari" 
                value={totalRute} 
                sub="Pencarian rute" 
                trend={totalRute > 0 ? `+${totalRute}` : undefined} 
                trendUp delay={0.1} 
              />
              <StatCard 
                iconNode={<ClockStatIcon size={52} />} 
                label="Rata-rata Waktu" 
                value={`${rataWaktu} ms`} 
                sub="Waktu komputasi" 
                trend={totalRute > 0 ? `${totalRiwayat} pencarian` : 'Belum ada data'} 
                trendUp={false} delay={0.2} 
              />
              <StatCard 
                iconNode={<MapStatIcon size={52} />} 
                label="Lokasi Tersedia" 
                value={totalLokasi} 
                sub="Titik lokasi" 
                trend={`+${totalLokasi}`} 
                trendUp delay={0.3} 
              />
            </div>
          </div>

          {/* RIGHT PANEL */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.4 }} style={{ width: 380, minWidth: 380, background: 'white', borderRadius: 32, boxShadow: '0 8px 30px rgba(0,0,0,0.03)', border: '1px solid #ECECEC', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding:28, display:'flex', flexDirection:'column', gap:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ padding:6, background:'#EEF2FF', borderRadius:10 }}><Sparkles size={18} color="#5B5FEF" /></div>
                <span style={{ fontWeight:800, fontSize:18, color:'#111827' }}>Cari Rute Terbaik</span>
              </div>
              
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:12 }}>Search AI</div>
                <div style={{ borderRadius:20, border:`1px solid ${showSugg ? '#A5B4FC' : '#C7D2FE'}`, background:'white', padding:16, boxShadow:'0 2px 12px rgba(91,95,239,0.04)', position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ background:'#EEF2FF', padding:4, borderRadius:6 }}><Sparkles size={12} color="#5B5FEF" /></div>
                      <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>AI Route Prompt</span>
                    </div>
                    <span style={{ fontSize:10, color:'#A78BFA', fontWeight:600, background:'#F5F3FF', padding:'2px 7px', borderRadius:20 }}>✨ Coba Indomaret, Cafe, ATM!</span>
                  </div>
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onFocus={() => setShowSugg(true)}
                    onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAISubmit()
                      }
                    }}
                    placeholder="Dari Monas ke Semanggi singgah Indomaret terdekat..."
                    rows={2}
                    style={{ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:13, color:'#4B5563', fontFamily:'inherit', marginTop:4 }}
                  />
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                    <button
                      onClick={handleAISubmit}
                      disabled={!aiPrompt.trim()}
                      style={{
                        background: !aiPrompt.trim() ? '#E5E7EB' : '#EEF2FF',
                        color: !aiPrompt.trim() ? '#9CA3AF' : '#5B5FEF',
                        border: 'none', borderRadius: 8, padding: '6px 12px',
                        cursor: !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontWeight: 600, fontSize: 12, transition: 'all 0.15s'
                      }}
                    >
                      <Search size={14} /> Cari
                    </button>
                  </div>
                  {showSugg && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'white', border:'1px solid #E5E7EB', borderRadius:16, boxShadow:'0 8px 24px rgba(0,0,0,0.08)', padding:'8px', marginTop:4 }}>
                      <div style={{ fontSize:10, color:'#9CA3AF', fontWeight:600, padding:'2px 8px', marginBottom:4 }}>CONTOH PENCARIAN</div>
                      {[
                        { icon:'🏪', text:'Dari Bundaran HI ke Blok M mampir Indomaret terdekat' },
                        { icon:'☕', text:'Dari Monas ke GBK singgah cafe terdekat' },
                        { icon:'💊', text:'Dari Stasiun Gambir ke Plaza Indonesia lewat apotek' },
                        { icon:'🏧', text:'Dari Taman Menteng ke Semanggi mampir ATM dulu' },
                        { icon:'⛽', text:'Dari Bundaran HI ke Semanggi, isi bensin dulu' },
                      ].map(({ icon, text }) => (
                        <button
                          key={text}
                          onMouseDown={() => { setAiPrompt(text); setShowSugg(false) }}
                          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', borderRadius:10, border:'none', background:'transparent', cursor:'pointer', textAlign:'left', fontSize:12, color:'#374151', fontWeight:500 }}
                          onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}
                        >
                          <span>{icon}</span><span>{text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, height:1, background:'#F3F4F6' }} /><span style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase' }}>Atau Pilih Manual</span><div style={{ flex:1, height:1, background:'#F3F4F6' }} />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'#10B981', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'white', fontSize:11, fontWeight:800 }}>A</span></div>
                    <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>Titik Asal</span>
                  </div>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', top:'50%', left:16, transform:'translateY(-50%)' }}><MapPin size={16} color="#9CA3AF" /></div>
                    <select value={startId} onChange={e => setStartId(e.target.value)} style={{ width:'100%', padding:'16px 40px', border:'1px solid #ECECEC', borderRadius:16, background:'white', fontSize:14, color:'#374151', outline:'none', appearance:'none' }}>
                      <option value="">Pilih titik asal...</option>
                      {landmarks.map(lm => <option key={lm.id} value={lm.node_id}>{lm.name}</option>)}
                    </select>
                    <div style={{ position:'absolute', top:'50%', right:16, transform:'translateY(-50%)' }}><ChevronDown size={16} color="#9CA3AF" /></div>
                  </div>
                </div>

                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'#EF4444', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'white', fontSize:11, fontWeight:800 }}>B</span></div>
                    <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>Tujuan</span>
                  </div>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', top:'50%', left:16, transform:'translateY(-50%)' }}><MapPin size={16} color="#9CA3AF" /></div>
                    <select value={goalId} onChange={e => setGoalId(e.target.value)} style={{ width:'100%', padding:'16px 40px', border:'1px solid #ECECEC', borderRadius:16, background:'white', fontSize:14, color:'#374151', outline:'none', appearance:'none' }}>
                      <option value="">Pilih tujuan...</option>
                      {landmarks.map(lm => <option key={lm.id} value={lm.node_id}>{lm.name}</option>)}
                    </select>
                    <div style={{ position:'absolute', top:'50%', right:16, transform:'translateY(-50%)' }}><ChevronDown size={16} color="#9CA3AF" /></div>
                  </div>
                </div>

                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={handleCari} style={{ width:'100%', padding:'16px', marginTop:8, background: 'linear-gradient(135deg, #5B5FEF 0%, #7C4DFF 100%)', color: 'white', border:'none', borderRadius:16, fontSize:15, fontWeight:700, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow: '0 6px 20px rgba(91,95,239,0.3)' }}>
                  Cari Rute Terbaik <ArrowRight size={18} />
                </motion.button>
              </div>

              <div style={{ borderTop:'1px solid #F3F4F6', paddingTop:24 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:16 }}>Algoritma Tersedia</div>
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {ALGO_INFO.map(({ color, bg, label, sub, desc }) => (
                    <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><div style={{ width:14, height:14, borderRadius:'50%', background:color }} /></div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}><span style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{label}</span><span style={{ fontSize:11, color:'#9CA3AF' }}>({sub})</span></div>
                        <p style={{ fontSize:12, color:'#6B7280', margin:0, lineHeight:1.5 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}