import { NavLink } from 'react-router-dom'
import { Home, Route, History, MapPin } from 'lucide-react'

// ─── SVG Monas Icon ───────────────────────────────────
const MonasIcon = ({ size = 52 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width={size} height={size}>
    <defs>
      <linearGradient id="monasGradientSB" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" />
        <stop offset="50%" stopColor="#7B1FA2" />
        <stop offset="100%" stopColor="#4A148C" />
      </linearGradient>
      <linearGradient id="flameGradientSB" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E040FB" />
        <stop offset="100%" stopColor="#8E24AA" />
      </linearGradient>
      <filter id="dropShadowSB" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4A148C" floodOpacity="0.3" />
      </filter>
    </defs>
    <circle cx="100" cy="150" r="120" fill="#F3E5F5" />
    <polygon points="20,280 180,280 160,265 40,265" fill="#311B92" filter="url(#dropShadowSB)" />
    <polygon points="75,265 125,265 145,215 55,215" fill="url(#monasGradientSB)" />
    <polygon points="45,215 155,215 150,205 50,205" fill="#6A1B9A" />
    <rect x="80" y="200" width="40" height="5" fill="#4A148C" />
    <polygon points="85,200 115,200 107,60 93,60" fill="url(#monasGradientSB)" filter="url(#dropShadowSB)" />
    <path d="M 100 15 C 125 40 115 60 107 60 L 93 60 C 85 60 75 40 100 15 Z" fill="url(#flameGradientSB)" filter="url(#dropShadowSB)" />
    <path d="M 100 25 C 112 42 108 55 104 58 L 96 58 C 92 55 88 42 100 25 Z" fill="#EA80FC" />
    <polygon points="98,200 102,200 101,60 99,60" fill="#D1C4E9" opacity="0.4" />
  </svg>
)

// ─── Skyline Illustration ─────────────────────────────
const SkylineIllustration = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" style={{ width: '100%', height: 'auto', display: 'block' }}>
    <defs>
      <filter id="shadowBlurSB" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <clipPath id="groundClipSB">
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
    <g id="buildings-left-sb">
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
    <g id="buildings-right-sb">
      <rect x="520" y="225" width="18" height="105" fill="#ABB3E6" /><rect x="538" y="225" width="18" height="105" fill="#949ED4" />
      <rect x="565" y="160" width="23" height="170" fill="#BCC4F0" /><rect x="588" y="160" width="23" height="170" fill="#A2ABDE" />
      <rect x="625" y="230" width="15" height="100" fill="#ABB3E6" /><rect x="640" y="230" width="15" height="100" fill="#949ED4" />
      <rect x="665" y="240" width="15" height="90" fill="#BCC4F0" /><rect x="680" y="240" width="15" height="90" fill="#A2ABDE" />
    </g>
    <g id="monas-sb">
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
    <ellipse cx="400" cy="342" rx="310" ry="6" fill="#D2D6E9" filter="url(#shadowBlurSB)" />
    <rect x="80" y="330" width="640" height="6" rx="3" fill="#4B5375" />
    <g clipPath="url(#groundClipSB)">
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

// ─── Nav Items — TANPA Tentang Aplikasi ──────────────
const NAV_ITEMS = [
  { path: '/',                 icon: Home,    label: 'Dashboard'         },
  { path: '/cari-rute',        icon: Route,   label: 'Cari Rute'         },
  { path: '/riwayat',          icon: History, label: 'Riwayat Pencarian' },
  { path: '/informasi-lokasi', icon: MapPin,  label: 'Informasi Lokasi'  },
]

// ─── SharedSidebar ─────────────────────────────────────
export default function SharedSidebar() {
  return (
    <div style={{
      width: 290,
      minWidth: 290,
      maxWidth: 290,
      background: 'white',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #ECECEC',
      boxShadow: '4px 0 24px rgba(0,0,0,0.01)',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Logo */}
      <div style={{ padding: '36px 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MonasIcon size={52} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', lineHeight: 1.2 }}>Jakarta</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#5B5FEF', lineHeight: 1.2 }}>Pathfinder</div>
            <div style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: 1.5, marginTop: 3, fontWeight: 600 }}>SMART AI OPTIMIZATION</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 16,
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 500,
              color: isActive ? '#5B5FEF' : '#6B7280',
              background: isActive ? '#EEF2FF' : 'transparent',
              position: 'relative', transition: 'all 0.2s ease',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 4, height: 24, background: '#5B5FEF', borderRadius: '0 4px 4px 0',
                  }} />
                )}
                <Icon size={18} color={isActive ? '#5B5FEF' : '#9CA3AF'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Skyline Card */}
      <div style={{
        margin: '0 20px 16px',
        background: 'white',
        borderRadius: 24,
        border: '1px solid #ECECEC',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
      }}>
        <div style={{ width: '100%', background: '#F4F5FB', display: 'flex', borderBottom: '1px solid #EEF2FF' }}>
          <SkylineIllustration />
        </div>
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Jakarta Pathfinder</div>
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, fontWeight: 500 }}>
            Temukan rute terbaik di Jakarta menggunakan AI untuk perjalanan yang lebih efisien.
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
          background: 'white', borderRadius: 20, border: '1px solid #ECECEC',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg,#5B5FEF,#7C4DFF)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>JP</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Jakarta Pathfinder</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>Mahasiswa KB</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  )
}
