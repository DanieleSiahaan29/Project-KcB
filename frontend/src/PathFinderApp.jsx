import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Map from './components/Map'
import LandingCard from './components/LandingCard'
import RoutePanel from './components/RoutePanel'
import NarasiPanel from './components/NarasiPanel'
import { loadGraph } from './utils/graph'
import { runBFS, runAStar, runBruteForce, runGreedy } from './hooks/useAlgorithm'
import { generateNarasi, parseWaypoint } from './utils/api'
import { findBestWaypoint, findLandmarkByName } from './utils/waypoint'

export default function PathfinderApp({ graph, initialStart, initialGoal, initialStartLabel, initialGoalLabel }) {
  const navigate = useNavigate()
  const [phase, setPhase]               = useState(initialStart ? 'result' : 'landing')
  const [startNode, setStartNode]       = useState(initialStart || null)
  const [goalNode, setGoalNode]         = useState(initialGoal || null)
  const [startLabel, setStartLabel]     = useState(initialStartLabel || '')
  const [goalLabel, setGoalLabel]       = useState(initialGoalLabel || '')
  const [waypointNode, setWaypointNode] = useState(null)
  const [waypointLabel, setWaypointLabel] = useState(null)
  const [results, setResults]           = useState(null)
  const [activeAlgo, setActiveAlgo]     = useState(null)
  const [isRunning, setIsRunning]       = useState(false)
  const [showNarasi, setShowNarasi]     = useState(false)
  const [narasi, setNarasi]             = useState({})
  const [narasiLoading, setNarasiLoading] = useState(false)
  const [activeStep, setActiveStep]     = useState(null)
  const [showHeatmap, setShowHeatmap]   = useState(false)
  const [presentMode, setPresentMode]   = useState(false)
  const [aiLoading, setAiLoading]       = useState(false)
  const [selectMode, setSelectMode]     = useState(null)
  const mapRef = useRef(null)

  // Auto search kalau dari dashboard
  useEffect(() => {
    if (initialStart && initialGoal && graph) {
      runSearch(initialStart, initialGoal)
    }
  }, [])

  const runSearch = useCallback((sNode, gNode, wNode = null) => {
    if (!graph) return
    setIsRunning(true)
    setNarasi({})
    setActiveAlgo(null)
    setShowNarasi(false)

    setTimeout(() => {
      const search = (s, g) => ({
        bfs:        runBFS(graph.nodes, graph.adj, s, g),
        astar:      runAStar(graph.nodes, graph.adj, s, g),
        bruteforce: runBruteForce(graph.nodes, graph.adj, s, g),
        greedy:     runGreedy(graph.nodes, graph.adj, s, g),
      })

      let bfs, astar, bruteforce, greedy
      if (wNode) {
        const r1 = search(sNode, wNode)
        const r2 = search(wNode, gNode)
        bfs        = merge(r1.bfs,        r2.bfs)
        astar      = merge(r1.astar,      r2.astar)
        bruteforce = merge(r1.bruteforce, r2.bruteforce)
        greedy     = merge(r1.greedy,     r2.greedy)
      } else {
        const r = search(sNode, gNode)
        bfs = r.bfs; astar = r.astar; bruteforce = r.bruteforce; greedy = r.greedy
      }

      setResults({ bfs, astar, bruteforce, greedy, startNode: sNode, goalNode: gNode, waypointNode: wNode })
      setPhase('result')
      setIsRunning(false)
    }, 100)
  }, [graph])

  function merge(r1, r2) {
    if (!r1?.path || !r2?.path) return {
      path: r1?.path || null,
      steps: [...(r1?.steps||[]), ...(r2?.steps||[])],
      expanded: (r1?.expanded||0)+(r2?.expanded||0),
      cost: r1?.cost||null,
      time: (r1?.time||0)+(r2?.time||0),
      stuckNode: r1?.stuckNode||r2?.stuckNode
    }
    return {
      path: [...r1.path, ...r2.path.slice(1)],
      steps: [...r1.steps, ...r2.steps],
      expanded: r1.expanded+r2.expanded,
      cost: (r1.cost||0)+(r2.cost||0),
      time: r1.time+r2.time,
      stuckNode: r1.stuckNode||r2.stuckNode
    }
  }

  const handleManualSearch = ({ startNode: s, goalNode: g, startLabel: sl, goalLabel: gl }) => {
    setStartNode(s); setGoalNode(g)
    setStartLabel(sl); setGoalLabel(gl)
    setWaypointNode(null); setWaypointLabel(null)
    runSearch(s, g)
  }

  const handleAISearch = async (prompt) => {
    if (!graph) return
    setAiLoading(true)
    try {
      const parsed = await parseWaypoint({ prompt, landmarks: graph.landmarks })
      let sNode = startNode, gNode = goalNode
      let sLabel = startLabel, gLabel = goalLabel

      if (parsed.origin) {
        const lm = findLandmarkByName(graph.landmarks, parsed.origin)
        if (lm) { sNode = lm.node_id; sLabel = lm.name }
      }
      if (parsed.destination) {
        const lm = findLandmarkByName(graph.landmarks, parsed.destination)
        if (lm) { gNode = lm.node_id; gLabel = lm.name }
      }

      let wNode = null, wLabel = null
      if ((parsed.waypoint_category || parsed.waypoint_name) && sNode && gNode) {
        const wp = findBestWaypoint(
          graph.landmarks, graph.nodes, sNode, gNode,
          parsed.waypoint_category, parsed.waypoint_name
        )
        if (wp) { wNode = wp.node_id; wLabel = wp.name }
      }

      setStartNode(sNode); setGoalNode(gNode)
      setStartLabel(sLabel); setGoalLabel(gLabel)
      setWaypointNode(wNode); setWaypointLabel(wLabel)
      runSearch(sNode, gNode, wNode)
    } catch(e) {
      alert('Gagal memproses prompt AI. Pastikan backend berjalan.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAlgoClick = async (key) => {
    if (activeAlgo === key) {
      setActiveAlgo(null); setShowNarasi(false); setActiveStep(null)
      return
    }
    setActiveAlgo(key); setShowNarasi(true)
    if (narasi[key]) return

    setNarasiLoading(true)
    const res = results[key]
    try {
      const text = await generateNarasi({
        algo: key, steps: res.steps,
        cost: res.cost, expanded: res.expanded,
        found: !!res.path, stuckNode: res.stuckNode
      })
      setNarasi(prev => ({ ...prev, [key]: text }))
    } catch(e) {
      setNarasi(prev => ({ ...prev, [key]: null }))
    } finally {
      setNarasiLoading(false)
    }
  }

  const handleFitBounds = useCallback(() => {
    if (!mapRef.current || !results) return
    const nodeIds = [results.startNode, results.goalNode, results.waypointNode].filter(Boolean)
    if (nodeIds.length < 2) return
    const latlngs = nodeIds.map(nid => {
      const n = graph.nodes[nid]
      return [n.lat, n.lng]
    })
    mapRef.current.fitBounds(latlngs, { padding: [80, 80], animate: true, duration: 0.8 })
  }, [results, graph])

  const handleReset = () => {
    setPhase('landing'); setResults(null)
    setStartNode(null); setGoalNode(null)
    setStartLabel(''); setGoalLabel('')
    setWaypointNode(null); setWaypointLabel(null)
    setActiveAlgo(null); setShowNarasi(false)
    setNarasi({}); setActiveStep(null)
    setShowHeatmap(false); setPresentMode(false)
    setSelectMode(null)
  }

  const activeConfig = [
    { key:'bfs',        label:'BFS',         sub:'Uninformed Search', color:'#5B5FEF' },
    { key:'astar',      label:'A*',           sub:'Informed Search',   color:'#10B981' },
    { key:'bruteforce', label:'Brute Force',  sub:'Exhaustive Search', color:'#EF4444' },
    { key:'greedy',     label:'Greedy',       sub:'Best-First Search', color:'#EC4899' },
  ].find(a => a.key === activeAlgo)

  const activeResult = results?.[activeAlgo]

  if (!graph) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm">Memuat data peta...</span>
      </div>
    </div>
  )

  return (
    <div className="w-full h-full relative">
      <Map
        graph={graph}
        onNodeSelect={(mode, nid) => {
          if (mode === 'start') { setStartNode(nid); setStartLabel(`Node ${nid.slice(-6)}`) }
          else { setGoalNode(nid); setGoalLabel(`Node ${nid.slice(-6)}`) }
          setSelectMode(null)
        }}
        selectMode={selectMode}
        results={results}
        activeAlgo={activeAlgo}
        activeStep={activeStep}
        showHeatmap={showHeatmap}
        mapRef={mapRef}
      />

      {phase === 'landing' && (
        <LandingCard
          landmarks={graph.landmarks}
          onSearch={handleManualSearch}
          onAISearch={handleAISearch}
          isLoading={isRunning || aiLoading}
        />
      )}

      {phase === 'result' && (
        <RoutePanel
          startLabel={startLabel}
          goalLabel={goalLabel}
          waypointLabel={waypointLabel}
          startNode={startNode}
          goalNode={goalNode}
          landmarks={graph?.landmarks || []}
          onChangeStart={(lm) => { setStartNode(lm.node_id); setStartLabel(lm.name) }}
          onChangeGoal={(lm) => { setGoalNode(lm.node_id); setGoalLabel(lm.name) }}
          onReset={handleReset}
          onFitBounds={handleFitBounds}
          results={results}
          activeAlgo={activeAlgo}
          onAlgoClick={handleAlgoClick}
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
          presentMode={presentMode}
          setPresentMode={setPresentMode}
        />
      )}

      {showNarasi && activeConfig && activeResult && (
        <NarasiPanel
          algo={activeAlgo}
          result={activeResult}
          config={activeConfig}
          narasiAI={narasi[activeAlgo]}
          narasiLoading={narasiLoading}
          onStepChange={setActiveStep}
          onClose={() => { setShowNarasi(false); setActiveAlgo(null); setActiveStep(null) }}
        />
      )}
    </div>
  )
}