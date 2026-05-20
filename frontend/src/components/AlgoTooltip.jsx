const ALGO_INFO = {
  bfs: {
    cara: 'Menjelajahi semua node level per level dari titik awal.',
    kelebihan: 'Menjamin jalur dengan jumlah langkah paling sedikit.',
    kekurangan: 'Boros memori — menyimpan semua node yang pernah dikunjungi.',
    kompleksitas: 'O(V + E)',
  },
  astar: {
    cara: 'Menggunakan f(n) = g(n) + h(n) untuk prioritaskan node terbaik.',
    kelebihan: 'Optimal dan efisien jika heuristik admissible.',
    kekurangan: 'Butuh heuristik yang baik — salah heuristik, salah jalur.',
    kompleksitas: 'O(E log V)',
  },
  hc: {
    cara: 'Selalu bergerak ke tetangga yang paling dekat ke tujuan.',
    kelebihan: 'Sangat cepat dan hemat memori.',
    kekurangan: 'Bisa terjebak di local optima dan tidak menjamin solusi optimal.',
    kompleksitas: 'O(V)',
  }
}

export default function AlgoTooltip({ algo, color }) {
  const info = ALGO_INFO[algo]
  if (!info) return null

  return (
    <div className="absolute left-full top-0 ml-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50 pointer-events-none">
      <div className="space-y-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-0.5">Cara Kerja</p>
          <p className="text-xs text-gray-700 leading-relaxed">{info.cara}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-green-600 mb-0.5">✓ Kelebihan</p>
          <p className="text-xs text-gray-700 leading-relaxed">{info.kelebihan}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-red-500 mb-0.5">✗ Kekurangan</p>
          <p className="text-xs text-gray-700 leading-relaxed">{info.kekurangan}</p>
        </div>
        <div className="pt-1.5 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Kompleksitas: <span className="font-mono font-semibold" style={{ color }}>{info.kompleksitas}</span>
          </p>
        </div>
      </div>
      {/* Arrow */}
      <div className="absolute top-3 -left-1.5 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-[-45deg]" />
    </div>
  )
}