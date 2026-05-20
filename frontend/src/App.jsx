import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { loadGraph } from './utils/graph'

// Import semua halaman dengan benar
import Dashboard from './pages/Dashboard/index.jsx'
import CariRute from './pages/CariRute/index.jsx'
import Riwayat from './pages/Riwayat/index.jsx'
import InformasiLokasi from './pages/InformasiLokasi/index.jsx'

export default function App() {
  const [graph, setGraph] = useState(null)
  const [searchParams, setSearchParams] = useState(null)

  useEffect(() => {
    // Memuat data peta
    loadGraph().then(g => setGraph(g))
  }, [])

  const handleDashboardSearch = (params) => {
    setSearchParams(params)
  }

  return (
    <Routes>
      {/* Halaman Utama / Dashboard */}
      <Route 
        path="/" 
        element={
          <Dashboard
            graph={graph}
            onStartSearch={handleDashboardSearch}
          />
        } 
      />
      
      {/* Halaman Cari Rute yang baru */}
      <Route 
        path="/cari-rute" 
        element={
          <CariRute graph={graph} />
        } 
      />
      
      <Route path="/riwayat" element={<Riwayat />} />
      <Route path="/informasi-lokasi" element={<InformasiLokasi />} />

      {/* Fallback: Jika URL salah, kembalikan ke Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}