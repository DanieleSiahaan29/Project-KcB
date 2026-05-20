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

export function runHillClimbing(nodes, adj, start, goal) {
  const t0 = performance.now()
  const gn = nodes[goal]

  function h(id) {
    const n = nodes[id]
    return haversine(n.lat, n.lng, gn.lat, gn.lng)
  }

  let bestPath = null
  let bestCost = Infinity
  let lastStuckNode = null
  const allSteps = []
  let totalExpanded = 0

  for (let attempt = 0; attempt < 10; attempt++) {
    const path = [start]
    const visited = new Set([start])
    let cur = start
    let stuck = false

    while (cur !== goal) {
      const neighbors = (adj[cur] || [])
        .map(e => e.to)
        .filter(n => !visited.has(n))

      if (!neighbors.length) {
        stuck = true
        lastStuckNode = cur
        allSteps.push({
          current: cur,
          expanded: totalExpanded,
          pathSoFar: [...path],
          visitedCount: visited.size,
          attempt: attempt + 1,
          stuck: true,
          stuckReason: 'Tidak ada tetangga yang belum dikunjungi',
          type: 'stuck'
        })
        break
      }

      const next = attempt > 0 && Math.random() < 0.2
        ? neighbors[Math.floor(Math.random() * neighbors.length)]
        : neighbors.reduce((best, n) => h(n) < h(best) ? n : best)

      // Cek apakah ini local optima
      if (h(next) >= h(cur) && cur !== start) {
        stuck = true
        lastStuckNode = cur
        allSteps.push({
          current: cur,
          expanded: totalExpanded,
          pathSoFar: [...path],
          visitedCount: visited.size,
          attempt: attempt + 1,
          stuck: true,
          stuckReason: 'Semua tetangga lebih jauh dari tujuan — local optima',
          type: 'stuck'
        })
        break
      }

      visited.add(next)
      path.push(next)
      totalExpanded++

      allSteps.push({
        current: next,
        expanded: totalExpanded,
        pathSoFar: [...path],
        visitedCount: visited.size,
        hScore: Math.round(h(next)),
        attempt: attempt + 1,
        stuck: false,
        type: next === goal ? 'found' : 'exploring'
      })

      cur = next
      if (path.length > 400) {
        stuck = true
        lastStuckNode = cur
        break
      }
    }

    if (!stuck && cur === goal) {
      const cost = pathCost(nodes, path)
      if (cost < bestCost) {
        bestCost = cost
        bestPath = [...path]
      }
    }
  }

  return {
    path: bestPath,
    steps: allSteps,
    expanded: totalExpanded,
    cost: bestPath ? bestCost : null,
    time: Math.round(performance.now() - t0),
    stuckNode: lastStuckNode
  }
}