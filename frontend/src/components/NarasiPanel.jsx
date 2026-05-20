import { useState, useEffect, useRef, useMemo } from 'react'
import { Play, Pause, SkipBack, SkipForward, Info, X, MapPin } from 'lucide-react'

// ─────────────────────────────────────
// HIGHLIGHT nama area di teks narasi
// Bungkus kata-kata yang cocok dengan landmark di dalam <span> berwarna
// ─────────────────────────────────────
function highlightAreas(text, color, landmarks = []) {
  if (!text || !landmarks.length) return text

  // Kumpulkan nama-nama unik dari landmarks
  const names = [...new Set(landmarks.map(l => l.name))].sort(
    (a, b) => b.length - a.length // prioritaskan nama terpanjang dulu
  )

  // Split teks berdasarkan nama area yang cocok
  const pattern = new RegExp(`(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')

  const parts = text.split(pattern)
  return parts.map((part, i) => {
    const isMatch = names.some(n => n.toLowerCase() === part.toLowerCase())
    if (isMatch) {
      return (
        <span
          key={i}
          style={{
            color,
            fontWeight: 700,
            background: `${color}15`,
            borderRadius: 4,
            padding: '0 3px',
          }}
        >
          {part}
        </span>
      )
    }
    return part
  })
}

// ─────────────────────────────────────
// NARASI STATIS (fallback saat AI belum siap)
// ─────────────────────────────────────
const NARASI_STATIC = {
  bfs: (step, idx, total) => {
    if (step.type === 'found')
      return `Pencarian selesai! BFS berhasil menemukan rute terpendek dengan pasti setelah memetakan ${step.expanded} titik persimpangan secara menyeluruh.`
    if (idx === 0)
      return `Algoritma BFS memulai pencarian. Strateginya adalah menyebar: memeriksa semua jalan terdekat dari titik awal lapis demi lapis, tanpa menebak arah.`
    if (idx < total * 0.4)
      return `Area pencarian meluas. Sudah ${step.visitedCount} titik yang dievaluasi. BFS tidak menebak arah, melainkan mengecek setiap kemungkinan secara objektif.`
    if (idx < total * 0.8)
      return `Eksplorasi semakin jauh. Sejauh ini ${step.expanded} persimpangan telah dipetakan. Proses ini memakan banyak waktu, namun menjamin jalur paling optimal tidak akan terlewat.`
    return `Tujuan sudah hampir dipastikan. Rute mulai mengerucut setelah algoritma memvalidasi hampir seluruh cabang jalan yang tersedia.`
  },
  astar: (step, idx, total) => {
    if (step.type === 'found')
      return `Tujuan tercapai! A* sukses menemukan rute paling optimal secara efisien, menyeimbangkan jarak tempuh nyata dan prediksi arah dengan sempurna.`
    if (idx === 0)
      return `Algoritma A* mulai berjalan. A* menggunakan tebakan cerdas (Heuristic) untuk memprioritaskan jalan yang secara visual mengarah lurus ke tujuan.`
    if (step.fScore)
      return `Mengevaluasi titik potensial (Skor: ${step.fScore}). Menempuh ${step.gScore}m, estimasi sisa ${step.hScore}m ke tujuan. Ini jalur paling logis saat ini.`
    return `Algoritma terus mengeliminasi cabang yang menjauh dari tujuan. Dari ${step.expanded} titik, A* hanya fokus menelusuri rute yang paling menjanjikan.`
  },
  hc: (step, idx, total) => {
    if (step.type === 'stuck')
      return `Pencarian menemui jalan buntu (Local Optima). Semua rute terdekat justru menjauh dari tujuan. Algoritma perlu mencoba dari sudut yang berbeda.`
    if (step.type === 'found')
      return `Tujuan ditemukan! Meski sempat menghadapi local optima, pendekatan agresif Hill Climbing akhirnya berhasil menemukan jalur ke tujuan.`
    if (idx === 0)
      return `Hill Climbing langsung bergerak menuju tujuan. Pendekatannya sangat greedy: selalu pilih jalan yang tampak paling dekat ke tujuan saat ini.`
    const pct = Math.round((idx / total) * 100)
    if (pct < 40)
      return `Bergerak maju, estimasi sisa jarak ${step.hScore || '?'}m ke tujuan. Hill Climbing memilih tetangga terdekat tanpa mempertimbangkan gambaran keseluruhan.`
    if (pct < 80)
      return `Sudah ${idx} langkah ditempuh. Setiap keputusan diambil hanya berdasarkan jarak ke tujuan saat ini — strategi cepat tapi berisiko menemui jalan buntu.`
    return `Hampir selesai. Tinggal beberapa langkah lagi. Algoritma terus maju selama ada tetangga yang lebih dekat ke tujuan.`
  },
}

// ─────────────────────────────────────
// DOWNSAMPLING STEPS
// ─────────────────────────────────────
function getDisplaySteps(steps, max = 40) {
  if (!steps || steps.length === 0) return []
  if (steps.length <= max) return steps.map((s, i) => ({ ...s, originalIndex: i }))

  const importantSteps = steps.filter(s => s.type === 'stuck' || s.type === 'found')
  const normalSteps    = steps.filter(s => s.type !== 'stuck' && s.type !== 'found')

  const sampleCount = Math.max(1, max - importantSteps.length)
  const interval    = Math.floor(normalSteps.length / sampleCount)
  const result      = []

  for (let i = 0; i < normalSteps.length; i += Math.max(1, interval)) {
    const origIdx = steps.indexOf(normalSteps[i])
    result.push({ ...normalSteps[i], originalIndex: origIdx >= 0 ? origIdx : i })
    if (result.length >= sampleCount) break
  }

  importantSteps.forEach(s => {
    const origIdx = steps.indexOf(s)
    if (!result.includes(s)) result.push({ ...s, originalIndex: origIdx >= 0 ? origIdx : steps.length - 1 })
  })

  return result
}

// ─────────────────────────────────────
// KOMPONEN UTAMA
// ─────────────────────────────────────
export default function NarasiPanel({ algo, result, config, narasiAI, narasiLoading, onClose, onStepChange, landmarks = [] }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying]     = useState(true)
  const [speed, setSpeed]             = useState(800)
  const intervalRef = useRef(null)

  const steps        = result?.steps || []
  const displaySteps = useMemo(() => getDisplaySteps(steps, 40), [steps])
  const totalDisplay = displaySteps.length
  const totalOriginal = steps.length

  // ── Autoplay
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalDisplay - 1) { setIsPlaying(false); return prev }
          const next = prev + 1
          onStepChange?.(displaySteps[next])
          return next
        })
      }, speed)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, totalDisplay])

  useEffect(() => { setCurrentStep(0); setIsPlaying(true) }, [algo])

  const handlePrev = () => {
    setIsPlaying(false)
    const next = Math.max(0, currentStep - 1)
    setCurrentStep(next); onStepChange?.(displaySteps[next])
  }
  const handleNext = () => {
    setIsPlaying(false)
    const next = Math.min(totalDisplay - 1, currentStep + 1)
    setCurrentStep(next); onStepChange?.(displaySteps[next])
  }
  const handlePlayPause = () => {
    if (currentStep >= totalDisplay - 1) { setCurrentStep(0); onStepChange?.(displaySteps[0]) }
    setIsPlaying(p => !p)
  }

  const step = displaySteps[currentStep]
  if (!step) return null

  const progress    = Math.round((currentStep / Math.max(totalDisplay - 1, 1)) * 100)
  const progressPct = progress / 100 // 0.0 ~ 1.0

  // ── Pilih paragraf narasi AI sesuai posisi slider
  const aiParagraphs = useMemo(() => {
    if (!narasiAI) return []
    return narasiAI.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  }, [narasiAI])

  const activeParagraphIdx = useMemo(() => {
    if (!aiParagraphs.length) return 0
    return Math.min(
      Math.floor(progressPct * aiParagraphs.length),
      aiParagraphs.length - 1
    )
  }, [progressPct, aiParagraphs.length])

  const activeParagraph = aiParagraphs[activeParagraphIdx] || ''
  const narasiText      = NARASI_STATIC[algo]?.(step, currentStep, totalDisplay) || ''

  // Teks yang ditampilkan
  const displayText = narasiLoading
    ? null
    : narasiAI
    ? activeParagraph
    : narasiText

  // Status badge
  const stepTypeColor =
    step.type === 'stuck'  ? { bg:'#FEF2F2', text:'#DC2626', border:'#FECACA' } :
    step.type === 'found'  ? { bg:'#F0FDF4', text:'#16A34A', border:'#BBF7D0' } :
                             { bg:'#EEF2FF', text:'#4F46E5', border:'#C7D2FE' }

  const stepTypeLabel =
    step.type === 'stuck' ? '⚠ Terjebak' :
    step.type === 'found' ? '✓ Tujuan Dicapai' :
    '◉ Menjelajah'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%',
      background: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ── HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: config.color, boxShadow: `0 0 0 3px ${config.color}25` }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{config.label}</span>
          <span style={{ fontSize: 11, color: '#6B7280', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '2px 8px', fontWeight: 500 }}>
            {config.sub}
          </span>
          {result?.stuckNode && (
            <span style={{ fontSize: 11, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>
              ⚠ Local Optima
            </span>
          )}
          {narasiAI && aiParagraphs.length > 1 && (
            <span style={{ fontSize: 10, background: `${config.color}15`, color: config.color, borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
              Paragraf {activeParagraphIdx + 1} / {aiParagraphs.length}
            </span>
          )}
        </div>

        {/* Stats singkat */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Jarak', val: result?.cost ? `${(result.cost/1000).toFixed(2)} km` : '—' },
              { label: 'Nodes', val: result?.expanded ?? '—' },
              { label: 'Waktu', val: result?.time != null ? `${result.time} ms` : '—' },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{val}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── BODY */}
      <div style={{ display: 'flex', overflow: 'hidden' }}>

        {/* Kiri — Narasi + Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 28px 18px', gap: 14 }}>

          {/* Step badge + narasi */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: stepTypeColor.bg, color: stepTypeColor.text, border: `1px solid ${stepTypeColor.border}`,
                letterSpacing: '0.3px',
              }}>
                {stepTypeLabel}
              </span>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
                Step {(step.originalIndex ?? currentStep) + 1} / {totalOriginal}
              </span>
              {step.attempt && step.attempt > 1 && (
                <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700 }}>
                  · Percobaan ke-{step.attempt}
                </span>
              )}
            </div>

            {narasiLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: '50%', background: config.color,
                      animation: 'narasi-bounce 1s infinite', animationDelay: `${i * 150}ms`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: '#6B7280' }}>
                  AI Lokal sedang merangkai cerita perjalananmu...
                </span>
              </div>
            ) : (
              <p style={{
                fontSize: 14, color: '#374151', lineHeight: 1.75, margin: 0,
                fontWeight: narasiAI ? 450 : 400,
                fontStyle: narasiAI ? 'normal' : 'normal',
                transition: 'opacity 0.3s ease',
              }}>
                {narasiAI
                  ? highlightAreas(displayText, config.color, landmarks)
                  : displayText
                }
              </p>
            )}
          </div>

          {/* Cluster progress dots — tampil jika ada AI narasi dengan banyak paragraf */}
          {narasiAI && aiParagraphs.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={11} color={config.color} />
              <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500, marginRight: 4 }}>Area:</span>
              {aiParagraphs.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === activeParagraphIdx ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === activeParagraphIdx ? config.color : '#E5E7EB',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setIsPlaying(false)
                    const targetStep = Math.round((i / aiParagraphs.length) * (totalDisplay - 1))
                    setCurrentStep(targetStep)
                    onStepChange?.(displaySteps[targetStep])
                  }}
                />
              ))}
            </div>
          )}

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', width: 20, textAlign: 'right' }}>
              {(step.originalIndex ?? currentStep) + 1}
            </span>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="range"
                min={0} max={totalDisplay - 1} value={currentStep}
                onChange={e => {
                  setIsPlaying(false)
                  const idx = Number(e.target.value)
                  setCurrentStep(idx); onStepChange?.(displaySteps[idx])
                }}
                style={{
                  width: '100%', height: 4, borderRadius: 4, outline: 'none', cursor: 'pointer',
                  appearance: 'none', WebkitAppearance: 'none',
                  background: `linear-gradient(to right, ${config.color} ${progress}%, #E5E7EB ${progress}%)`,
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', width: 20 }}>
              {totalOriginal}
            </span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Speed */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 12, padding: 3, gap: 2 }}>
              {[{ label:'0.5x', val:1600 }, { label:'1x', val:800 }, { label:'2x', val:400 }, { label:'4x', val:200 }].map(s => (
                <button key={s.label} onClick={() => setSpeed(s.val)} style={{
                  padding: '5px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  background: speed === s.val ? 'white' : 'transparent',
                  color: speed === s.val ? '#111827' : '#6B7280',
                  boxShadow: speed === s.val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Main controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handlePrev} disabled={currentStep === 0} style={{
                width: 36, height: 36, borderRadius: '50%', border: '1px solid #E5E7EB',
                background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#374151', opacity: currentStep === 0 ? 0.3 : 1, transition: 'all 0.15s',
              }}>
                <SkipBack size={15} />
              </button>
              <button onClick={handlePlayPause} style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                background: config.color, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', boxShadow: `0 4px 14px ${config.color}50`,
                transition: 'all 0.15s',
              }}>
                {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: 2 }} />}
              </button>
              <button onClick={handleNext} disabled={currentStep >= totalDisplay - 1} style={{
                width: 36, height: 36, borderRadius: '50%', border: '1px solid #E5E7EB',
                background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#374151', opacity: currentStep >= totalDisplay - 1 ? 0.3 : 1, transition: 'all 0.15s',
              }}>
                <SkipForward size={15} />
              </button>
            </div>

            <div style={{ width: 80, textAlign: 'right', fontSize: 11, color: '#9CA3AF' }}>
              Kecepatan
            </div>
          </div>
        </div>

        {/* Kanan — Telemetri */}
        <div style={{
          width: 200, borderLeft: '1px solid #F3F4F6',
          background: '#FAFAFA', padding: '18px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Info size={13} color={config.color} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Info Step</span>
          </div>

          {[
            { label: 'Node ke-',    val: step.expanded ?? '—' },
            { label: 'Dikunjungi',  val: step.visitedCount ?? '—' },
            step.gScore !== undefined && { label: 'g(n)',  val: `${step.gScore}m` },
            step.hScore !== undefined && { label: 'h(n)',  val: `${step.hScore}m` },
            step.fScore !== undefined && { label: 'f(n)',  val: step.fScore, highlight: true },
          ].filter(Boolean).map(({ label, val, highlight }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: '1px solid #F3F4F6',
            }}>
              <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: highlight ? config.color : '#111827' }}>
                {val}
              </span>
            </div>
          ))}

          {/* Mini legend */}
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
            {[
              { color: '#D1D5DB', label: 'Menjelajah' },
              { color: '#EF4444', label: 'Terjebak' },
              { color: '#10B981', label: 'Ditemukan' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes narasi-bounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-5px); opacity: 0.5; }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: ${config.color};
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}