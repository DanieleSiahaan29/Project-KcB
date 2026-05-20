import { useState } from 'react'

const EXAMPLES = [
  'dari Bundaran HI ke Blok M singgah gereja',
  'dari Monas ke GBK lewat taman dulu',
  'dari Stasiun Gambir ke Plaza Indonesia mampir masjid',
]

export default function WaypointBar({ onSubmit, isLoading }) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    onSubmit(input.trim())
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
        focused ? 'border-blue-400 bg-white shadow-md' : 'border-gray-200 bg-gray-50'
      }`}>
        {/* Icon AI */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
          <span className="text-white text-xs">✦</span>
        </div>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ketik rute... contoh: dari Monas ke GBK singgah masjid"
          className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />

        {isLoading ? (
          <div className="flex gap-0.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: `${i*150}ms` }} />
            ))}
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs rounded-lg transition-all"
          >
            Cari
          </button>
        )}
      </div>

      {/* Contoh prompt */}
      {focused && !input && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <p className="text-xs text-gray-400 px-3 pt-2 pb-1">Contoh pencarian:</p>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onMouseDown={() => setInput(ex)}
              className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
            >
              ✦ {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}