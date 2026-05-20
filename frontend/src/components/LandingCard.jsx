import { useState } from 'react'

const EXAMPLES = [
  'Dari Bundaran HI ke Blok M singgah gereja terdekat',
  'Dari Monas ke GBK lewat taman dulu',
  'Dari Stasiun Gambir ke Plaza Indonesia mampir masjid',
]

export default function LandingCard({ landmarks = [], onSearch, onAISearch, isLoading }) {
  const [aiPrompt, setAiPrompt]         = useState('')
  const [startId, setStartId]           = useState('')
  const [goalId, setGoalId]             = useState('')
  
  const [showExamples, setShowExamples] = useState(false)
  const [openStart, setOpenStart]       = useState(false)
  const [openGoal, setOpenGoal]         = useState(false)

  const handleSubmit = () => {
    if (isLoading) return
    if (aiPrompt.trim()) { onAISearch(aiPrompt.trim()); return }
    if (startId && goalId) {
      const start = landmarks.find(l => l.node_id === startId)
      const goal  = landmarks.find(l => l.node_id === goalId)
      onSearch({ startNode: startId, goalNode: goalId, startLabel: start?.name, goalLabel: goal?.name })
    }
  }

  const canSubmit = aiPrompt.trim() || (startId && goalId)

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center p-4 pointer-events-none">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />

      {/* Card Utama — Lebar tetap, tinggi akan menyesuaikan isi secara natural */}
      <div className="relative w-[320px] bg-white rounded-[2rem] shadow-2xl pointer-events-auto flex flex-col transition-all duration-300">

        {/* Header */}
        <div className="px-7 pt-8 pb-6 border-b border-gray-100/60 bg-white rounded-t-[2rem]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
              <span className="text-white font-bold text-base font-mono tracking-wider">JP</span>
            </div>
            <div className="space-y-0.5">
              <h1 className="font-bold text-gray-900 text-xl tracking-tight leading-none">
                Jakarta <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Pathfinder</span>
              </h1>
              <p className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">Smart AI Optimization</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-7 bg-white">

          {/* AI Prompt Area */}
          <div className="relative z-40 group">
            <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-100/50 rounded-2xl p-1.5 transition-all duration-300 focus-within:shadow-lg focus-within:shadow-blue-100/50 focus-within:border-blue-300 focus-within:bg-white">
              <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                  <span className="text-white leading-none" style={{ fontSize: 11 }}>✦</span>
                </div>
                <span className="text-xs font-bold text-gray-700 tracking-wide">AI Route Prompt</span>
              </div>

              {/* MURNI HANYA DIUBAH DI SINI: rows={6} agar kotak teksnya panjang ke bawah */}
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onFocus={() => { setShowExamples(true); setOpenStart(false); setOpenGoal(false); }}
                placeholder={'Coba: "Dari Monas ke GBK singgah di masjid terdekat"'}
                rows={6}
                className="w-full bg-transparent px-3 py-2 text-sm resize-none outline-none text-gray-800 placeholder-gray-400/80 leading-relaxed font-medium"
              />
            </div>

            {/* Dropdown AI Prompt */}
            {showExamples && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExamples(false)} />
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-blue-900/5 z-50 overflow-hidden ring-1 ring-black/5">
                  <p className="text-[10px] text-gray-400 px-5 pt-4 pb-2 font-bold uppercase tracking-wider">
                    Saran Prompt Cerdas
                  </p>
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => { setAiPrompt(ex); setShowExamples(false) }}
                      className="w-full text-left px-5 py-3 text-xs font-medium text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:text-blue-700 transition-all border-t border-gray-50/80"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 opacity-70">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-gray-200" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ATAU MANUAL</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-gray-200" />
          </div>

          {/* Manual Inputs Section */}
          <div className="relative flex flex-col">
            
            {/* Input A (Asal) */}
            <div className="relative z-30">
              <div
                onClick={() => { setOpenStart(!openStart); setOpenGoal(false); setShowExamples(false); }}
                className={`flex items-center gap-3 p-2 border rounded-2xl cursor-pointer transition-all duration-300 ${
                  openStart ? 'border-blue-400 ring-4 ring-blue-50 bg-white' : 'border-gray-200 bg-gray-50/40 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-sm">
                  A
                </div>
                <div className="flex-1 pr-2 truncate">
                  {startId 
                    ? <span className="text-sm font-semibold text-gray-800">{landmarks.find(l => l.node_id === startId)?.name}</span> 
                    : <span className="text-sm font-medium text-gray-400">Pilih titik asal...</span>}
                </div>
                <div className="pr-3 text-gray-400">
                  <svg className={`w-4 h-4 transition-transform duration-300 ${openStart ? 'rotate-180 text-blue-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Dropdown A */}
              {openStart && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenStart(false)} />
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-blue-900/10 z-50 max-h-64 overflow-y-auto ring-1 ring-black/5 p-1.5 custom-scrollbar">
                    {landmarks.map(lm => (
                      <div
                        key={lm.id}
                        onClick={() => { setStartId(lm.node_id); setOpenStart(false); }}
                        className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl cursor-pointer transition-colors"
                      >
                        {lm.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Swap Button */}
            <div className="relative h-4 z-20 flex justify-center">
              <button
                onClick={() => { const t = startId; setStartId(goalId); setGoalId(t) }}
                className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:scale-110 hover:shadow-[0_8px_16px_rgba(79,70,229,0.15)] transition-all duration-300"
              >
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                  <path d="M3.5 1.5V10.5M3.5 10.5L1.5 8.5M3.5 10.5L5.5 8.5M8.5 10.5V1.5M8.5 1.5L6.5 3.5M8.5 1.5L10.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Input B (Tujuan) */}
            <div className="relative z-10">
              <div
                onClick={() => { setOpenGoal(!openGoal); setOpenStart(false); setShowExamples(false); }}
                className={`flex items-center gap-3 p-2 border rounded-2xl cursor-pointer transition-all duration-300 ${
                  openGoal ? 'border-red-400 ring-4 ring-red-50 bg-white' : 'border-gray-200 bg-gray-50/40 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 text-red-500 flex items-center justify-center shrink-0 font-bold text-sm">
                  B
                </div>
                <div className="flex-1 pr-2 truncate">
                  {goalId 
                    ? <span className="text-sm font-semibold text-gray-800">{landmarks.find(l => l.node_id === goalId)?.name}</span> 
                    : <span className="text-sm font-medium text-gray-400">Pilih tujuan...</span>}
                </div>
                <div className="pr-3 text-gray-400">
                  <svg className={`w-4 h-4 transition-transform duration-300 ${openGoal ? 'rotate-180 text-red-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Dropdown B */}
              {openGoal && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenGoal(false)} />
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-red-900/10 z-50 max-h-64 overflow-y-auto ring-1 ring-black/5 p-1.5 custom-scrollbar">
                    {landmarks.map(lm => (
                      <div
                        key={lm.id}
                        onClick={() => { setGoalId(lm.node_id); setOpenGoal(false); }}
                        className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl cursor-pointer transition-colors"
                      >
                        {lm.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="w-full mt-2 py-4 rounded-2xl text-white text-base font-bold tracking-wide shadow-lg transition-all duration-300 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:shadow-indigo-500/30 hover:-translate-y-1 active:translate-y-0"
            style={{
              background: canSubmit && !isLoading
                ? 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)'
                : '#D1D5DB'
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2.5">
                <div className="w-5 h-5 border-[2.5px] border-white/40 border-t-white rounded-full animate-spin" />
                {aiPrompt.trim() ? 'AI Memproses...' : 'Mencari Rute...'}
              </span>
            ) : aiPrompt.trim() ? '✦ Generate AI Route' : 'Cari Rute Manual'}
          </button>
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 bg-white rounded-b-[2rem] mt-auto">
          <div className="flex items-center justify-center gap-3">
            {[
              { color: '#3B82F6', label: 'BFS', bg: 'bg-blue-50' },
              { color: '#10B981', label: 'A*', bg: 'bg-emerald-50' },
              { color: '#F59E0B', label: 'Hill Climbing', bg: 'bg-amber-50' },
            ].map(({ color, label, bg }) => (
               <div key={label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-100 ${bg}`}>
                 <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: color }} />
                 <span className="text-[10px] font-bold text-gray-600 tracking-wide">{label}</span>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}