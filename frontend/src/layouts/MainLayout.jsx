import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { path: '/',                icon: '⊞', label: 'Dashboard'          },
  { path: '/cari-rute',       icon: '◎', label: 'Cari Rute'          },
  { path: '/riwayat',         icon: '◷', label: 'Riwayat Pencarian'  },
  { path: '/informasi-lokasi',icon: '⊙', label: 'Informasi Lokasi'   },
  { path: '/tentang',         icon: 'ⓘ', label: 'Tentang Aplikasi'   },
]

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  const d = time
  const dateStr = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} WIB`

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span>📅</span><span>{dateStr}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span>🕐</span><span>{timeStr}</span>
      </div>
    </div>
  )
}

export default function MainLayout({ children, title, subtitle }) {
  const location = useLocation()

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-sm">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-lg">📍</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">Jakarta</div>
              <div className="font-bold text-indigo-600 text-sm leading-tight">Pathfinder</div>
              <div className="text-xs text-gray-400 mt-0.5">SMART AI OPTIMIZATION</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ path, icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Card tentang */}
        <div className="mx-3 mb-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <p className="text-xs font-bold text-gray-800 mb-1">Tentang Jakarta Pathfinder</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Temukan rute terbaik di Jakarta menggunakan AI untuk perjalanan yang lebih efisien.
          </p>
          {/* Ilustrasi kota sederhana */}
          <div className="mt-3 flex items-end justify-center gap-1 h-12 opacity-40">
            {[16,24,20,32,28,20,24,16].map((h,i) => (
              <div key={i} className="w-3 bg-indigo-300 rounded-t-sm" style={{ height: h }} />
            ))}
          </div>
        </div>

        {/* User */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">JP</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">Jakarta Pathfinder</p>
              <p className="text-xs text-gray-400">Mahasiswa KB</p>
            </div>
            <span className="text-gray-400 text-xs">⌄</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <Clock />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}