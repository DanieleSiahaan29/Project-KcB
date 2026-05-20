import { useState, useEffect } from 'react'

const STORAGE_KEY = 'jakarta_pathfinder_data'

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveToStorage(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

const defaultData = {
  totalRute: 0,
  totalWaktu: 0,
  riwayat: [],
}

let globalData = loadFromStorage() || { ...defaultData }
const listeners = new Set()

function notify() {
  listeners.forEach(fn => fn({ ...globalData }))
}

export function useAppStore() {
  const [data, setData] = useState({ ...globalData })

  useEffect(() => {
    listeners.add(setData)
    return () => listeners.delete(setData)
  }, [])

  const addRiwayat = (entry) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...entry
    }
    globalData = {
      ...globalData,
      totalRute: globalData.totalRute + 1,
      totalWaktu: globalData.totalWaktu + (entry.waktu || 0),
      riwayat: [newEntry, ...globalData.riwayat].slice(0, 50)
    }
    saveToStorage(globalData)
    notify()
  }

  const clearRiwayat = () => {
    globalData = { ...globalData, riwayat: [] }
    saveToStorage(globalData)
    notify()
  }

  return { ...data, addRiwayat, clearRiwayat }
}