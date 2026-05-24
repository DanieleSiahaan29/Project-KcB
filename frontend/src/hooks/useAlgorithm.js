import { haversine, pathCost } from '../utils/graph'

export function runBFS(nodes, adj, start, goal) {
  const t0 = performance.now()
  const queue = [[start]]
  const visited = new Set([start])
  const steps = []
  let expanded = 0

  while (queue.length) {
    const path = queue.shift()
    const node = path[path.length - 1]
    expanded++
    steps.push({
      current: node,
      expanded,
      pathSoFar: [...path],
      visitedCount: visited.size,
      type: node === goal ? 'found' : 'exploring'
    })
    if (node === goal) {
      return { path, steps, expanded, cost: pathCost(nodes, path), time: Math.round(performance.now() - t0), stuckNode: null }
    }
    for (const { to } of adj[node] || []) {
      if (!visited.has(to)) {
        visited.add(to)
        queue.push([...path, to])
      }
    }
  }
  return { path: null, steps, expanded, cost: null, time: Math.round(performance.now() - t0), stuckNode: null }
}

export function runAStar(nodes, adj, start, goal) {
  const t0 = performance.now()
  const gn = nodes[goal]

  function h(id) {
    const n = nodes[id]
    return haversine(n.lat, n.lng, gn.lat, gn.lng)
  }

  const open = [[h(start), start, [start], 0]]
  const visited = {}
  const steps = []
  let expanded = 0

  while (open.length) {
    open.sort((a, b) => a[0] - b[0])
    const [f, node, path, g] = open.shift()
    if (visited[node] !== undefined && visited[node] <= g) continue
    visited[node] = g
    expanded++
    steps.push({
      current: node,
      expanded,
      pathSoFar: [...path],
      visitedCount: Object.keys(visited).length,
      gScore: Math.round(g),
      hScore: Math.round(h(node)),
      fScore: Math.round(f),
      type: node === goal ? 'found' : 'exploring'
    })
    if (node === goal) {
      return { path, steps, expanded, cost: pathCost(nodes, path), time: Math.round(performance.now() - t0), stuckNode: null }
    }
    for (const { to, weight } of adj[node] || []) {
      const ng = g + weight
      if (visited[to] === undefined || visited[to] > ng) {
        open.push([ng + h(to), to, [...path, to], ng])
      }
    }
  }
  return { path: null, steps, expanded, cost: null, time: Math.round(performance.now() - t0), stuckNode: null }
}

// TAMBAH: Brute Force — Exhaustive Dijkstra mencari semua kemungkinan berdasar cost
export function runBruteForce(nodes, adj, start, goal) {
  const t0 = performance.now()
  const open = [[0, start, [start], 0]]
  const visited = {}
  const steps = []
  let expanded = 0

  while (open.length) {
    open.sort((a, b) => a[0] - b[0])
    const [f, node, path, g] = open.shift()
    if (visited[node] !== undefined && visited[node] <= g) continue
    visited[node] = g
    expanded++
    
    steps.push({
      current: node,
      expanded,
      pathSoFar: [...path],
      visitedCount: Object.keys(visited).length,
      gScore: Math.round(g),
      hScore: 0,
      fScore: Math.round(g),
      type: node === goal ? 'found' : 'exploring'
    })
    
    if (node === goal) {
      return { path, steps, expanded, cost: pathCost(nodes, path), time: Math.round(performance.now() - t0), stuckNode: null }
    }
    
    for (const { to, weight } of adj[node] || []) {
      const ng = g + weight
      if (visited[to] === undefined || visited[to] > ng) {
        open.push([ng, to, [...path, to], ng])
      }
    }
  }
  
  return { path: null, steps, expanded, cost: null, time: Math.round(performance.now() - t0), stuckNode: null }
}

// TAMBAH: Greedy Best-First Search — priority queue berdasarkan h(n) saja
export function runGreedy(nodes, adj, start, goal) {
  const t0 = performance.now()
  const gn = nodes[goal]

  function h(id) {
    const n = nodes[id]
    return haversine(n.lat, n.lng, gn.lat, gn.lng)
  }

  // Min-heap: [hScore, nodeId, path]
  const open = [[h(start), start, [start]]]
  const visited = new Set()
  const steps = []
  let expanded = 0

  while (open.length) {
    // Sort by h(n) only — greedy
    open.sort((a, b) => a[0] - b[0])
    const [hScore, node, path] = open.shift()

    if (visited.has(node)) continue
    visited.add(node)
    expanded++

    steps.push({
      current: node,
      expanded,
      pathSoFar: [...path],
      visitedCount: visited.size,
      hScore: Math.round(hScore),
      type: node === goal ? 'found' : 'exploring'
    })

    if (node === goal) {
      return {
        path,
        steps,
        expanded,
        cost: pathCost(nodes, path),
        time: Math.round(performance.now() - t0),
        stuckNode: null
      }
    }

    for (const { to } of adj[node] || []) {
      if (!visited.has(to)) {
        open.push([h(to), to, [...path, to]])
      }
    }
  }

  return { path: null, steps, expanded, cost: null, time: Math.round(performance.now() - t0), stuckNode: null }
}