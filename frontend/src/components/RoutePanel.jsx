import { useState, useRef, useEffect } from 'react'
import AlgoTooltip from './AlgoTooltip'

const ALGO_CONFIG = [
  { key:'bfs',   label:'BFS',           sub:'Uninformed', color:'#1A73E8', activeBg:'#EFF6FF', activeBorder:'#BFDBFE', activeText:'#1D4ED8' },
  { key:'astar', label:'A*',            sub:'Informed',   color:'#0F9D58', activeBg:'#F0FDF4', activeBorder:'#BBF7D0', activeText:'#166534' },
  { key:'hc',    label:'Hill Climbing', sub:'Local',      color:'#F4B400', activeBg:'#FFFBEB', activeBorder:'#FDE68A', activeText:'#92400E' },
]

function LandmarkDropdown({ value, onChange, landmarks, placeholder, color, letter }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = landmarks.find(l => l.node_id === value)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
          open ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
        }`}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ background: color }}>
          <span className="text-white text-xs font-bold">{letter}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">{letter === 'A' ? 'Asal' : 'Tujuan'}</p>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {selected?.name || placeholder}
          </p>
        </div>
        <svg className={`text-gray-300 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto">
          <p className="text-xs text-gray-400 px-4 pt-3 pb-1.5 font-medium uppercase tracking-wide sticky top-0 bg-white">
            Pilih {letter === 'A' ? 'Asal' : 'Tujuan'}
          </p>
          {landmarks.map(lm => (
            <button
              key={lm.id}
              onClick={() => { onChange(lm); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 ${
                value === lm.node_id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {value === lm.node_id && <span className="text-blue-500 text-xs">✓</span>}
              {lm.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RoutePanel({
  startLabel, goalLabel, waypointLabel,
  startNode, goalNode, landmarks,
  onChangeStart, onChangeGoal,
  onReset, onFitBounds,
  results, activeAlgo, onAlgoClick,
  showHeatmap, setShowHeatmap,
  presentMode, setPresentMode
}) {
  const [hoveredAlgo, setHoveredAlgo] = useState(null)

  return (
    <>
      {/* Tombol kembali — tengah atas */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[1001]">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-md border border-gray-100 hover:shadow-lg transition-all text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 12L4 7L9 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Cari Rute Baru
        </button>
      </div>

      {/* Tombol zoom ke rute — muncul saat mode presentasi */}
      {presentMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1001]">
          <button
            onClick={onFitBounds}
            className="flex items-center gap-2.5 px-5 py-3 bg-white rounded-full shadow-lg border border-gray-100 hover:shadow-xl transition-all text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 6V2H6M10 2H14V6M14 10V14H10M6 14H2V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Lihat Area Rute
          </button>
        </div>
      )}

      {/* Panel utama */}
      <div className={`absolute top-5 left-5 z-[1000] w-80 transition-all duration-300 ease-in-out ${
        presentMode ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-100 translate-x-0'
      }`}>
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-visible">

          {/* Titik A & B dengan dropdown */}
          <div className="p-4 space-y-1.5">
            <LandmarkDropdown
              value={startNode}
              onChange={(lm) => onChangeStart(lm)}
              landmarks={landmarks || []}
              placeholder={startLabel || 'Pilih asal...'}
              color="#2563EB"
              letter="A"
            />

            {/* Connector */}
            <div className="flex items-center gap-3 px-4 py-0.5">
              <div className="w-7 flex justify-center">
                <div className="w-px h-3 bg-gray-200" />
              </div>
              {waypointLabel && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 rounded-full border border-violet-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-xs text-violet-600 font-medium">via {waypointLabel}</span>
                </div>
              )}
            </div>

            <LandmarkDropdown
              value={goalNode}
              onChange={(lm) => onChangeGoal(lm)}
              landmarks={landmarks || []}
              placeholder={goalLabel || 'Pilih tujuan...'}
              color="#EF4444"
              letter="B"
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-50 mx-4" />

          {/* Hasil algoritma */}
          {results && (
            <div className="p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Hasil Pencarian
              </p>

              {ALGO_CONFIG.map(({ key, label, sub, color, activeBg, activeBorder, activeText }) => {
                const r = results[key]
                const isActive = activeAlgo === key
                const costs = [results.bfs?.cost, results.astar?.cost, results.hc?.cost].filter(Boolean)
                const isBest = r?.cost && r.cost === Math.min(...costs)

                return (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => setHoveredAlgo(key)}
                    onMouseLeave={() => setHoveredAlgo(null)}
                  >
                    <button
                      onClick={() => onAlgoClick(key)}
                      className="w-full text-left p-3.5 rounded-2xl transition-all"
                      style={{
                        background: isActive ? activeBg : 'transparent',
                        border: `2px solid ${isActive ? activeBorder : 'transparent'}`,
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F9FAFB' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-sm font-semibold text-gray-800">{label}</span>
                          <span className="text-xs text-gray-400">{sub}</span>
                          {isBest && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                              terbaik
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold" style={{ color: isActive ? color : '#9CA3AF' }}>
                          {r?.cost ? `${(r.cost/1000).toFixed(2)}km` : '—'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 ml-5">
                        <span className="text-xs text-gray-400">{r?.expanded ?? '—'} nodes</span>
                        <span className="text-gray-200 text-xs">·</span>
                        <span className="text-xs text-gray-400">{r?.time ?? '—'}ms</span>
                        {key === 'hc' && r?.stuckNode && (
                          <>
                            <span className="text-gray-200 text-xs">·</span>
                            <span className="text-xs text-red-400 font-medium">⚠ terjebak</span>
                          </>
                        )}
                      </div>

                      {isActive && (
                        <div className="mt-1.5 ml-5">
                          <span className="text-xs font-medium" style={{ color }}>
                            ▶ Lihat animasi narasi
                          </span>
                        </div>
                      )}
                    </button>

                    {hoveredAlgo === key && !isActive && (
                      <AlgoTooltip algo={key} color={color} />
                    )}
                  </div>
                )
              })}

              {/* Kesimpulan */}
              {results.astar?.cost && results.bfs?.cost && (
                <div className="mt-1 p-3.5 bg-blue-50 rounded-2xl">
                  <p className="text-xs font-semibold text-blue-800 mb-1">Kesimpulan</p>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    {results.astar.cost <= results.bfs.cost
                      ? 'A* menemukan jalur optimal dengan eksplorasi paling efisien.'
                      : 'BFS menemukan jalur lebih pendek, A* lebih hemat dalam eksplorasi.'}
                    {results.hc?.stuckNode
                      ? ' Hill Climbing terjebak di local optima.'
                      : ' Hill Climbing berhasil menemukan rute alternatif.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {results && (
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => setShowHeatmap(p => !p)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border"
                style={{
                  background: showHeatmap ? '#F5F3FF' : 'transparent',
                  borderColor: showHeatmap ? '#DDD6FE' : '#E5E7EB',
                  color: showHeatmap ? '#7C3AED' : '#6B7280'
                }}
              >
                🔥 Heatmap
              </button>
              <button
                onClick={() => setPresentMode(p => !p)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border"
                style={{
                  background: presentMode ? '#111827' : 'transparent',
                  borderColor: presentMode ? '#111827' : '#E5E7EB',
                  color: presentMode ? 'white' : '#6B7280'
                }}
              >
                {presentMode ? '⊡ Exit' : '⊞ Presentasi'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}