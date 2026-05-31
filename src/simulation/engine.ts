import type { AppNode, AppEdge, NodeMetrics, NodeStatus, LBAlgorithm } from '../types'

export interface TickResult {
  nodeMetrics: Map<string, NodeMetrics>
  edgeTraffic: Map<string, number>
  totalRPS: number
  avgLatencyMs: number
  errorRate: number
  newAccumulators: Map<string, number>
  newCounters: Map<string, number>
}

interface RouteResult {
  latency: number
  errored: boolean
}

function getMainOutgoing(nodeId: string, edges: AppEdge[]) {
  return edges.filter(e => e.source === nodeId && !e.data?.required)
}

function getRequiredOutgoing(nodeId: string, edges: AppEdge[]) {
  return edges.filter(e => e.source === nodeId && e.data?.required === true)
}

function pickTarget(
  nodeId: string,
  edges: AppEdge[],
  algorithm: LBAlgorithm,
  counters: Map<string, number>,
  nodeLoads: Map<string, { handled: number; capacity: number }>,
): AppEdge | null {
  const outgoing = getMainOutgoing(nodeId, edges)
  if (outgoing.length === 0) return null

  if (algorithm === 'roundRobin') {
    const idx = (counters.get(nodeId) ?? 0) % outgoing.length
    counters.set(nodeId, idx + 1)
    return outgoing[idx]
  }

  if (algorithm === 'leastConnections') {
    let best = outgoing[0]
    let bestLoad = nodeLoads.get(best.target)?.handled ?? 0
    for (const e of outgoing.slice(1)) {
      const load = nodeLoads.get(e.target)?.handled ?? 0
      if (load < bestLoad) { best = e; bestLoad = load }
    }
    return best
  }

  return outgoing[Math.floor(Math.random() * outgoing.length)]
}

function serverTotalMs(d: { processingTimeMs: number; middleware?: Array<{ latencyMs: number }> }): number {
  return d.processingTimeMs + (d.middleware ?? []).reduce((s, m) => s + m.latencyMs, 0)
}

function nodeCapacity(node: AppNode, tickMs: number): number {
  const d = node.data
  if (d.kind === 'server') {
    return Math.max(1, Math.floor(d.cpuCores * tickMs / serverTotalMs(d)))
  }
  if (d.kind === 'database') {
    return Math.max(1, Math.floor(d.maxConnections * tickMs / d.queryTimeMs))
  }
  return Infinity
}

function routeRequest(
  nodeId: string,
  nodes: AppNode[],
  edges: AppEdge[],
  nodeLoads: Map<string, { handled: number; capacity: number; latency: number; errors: number }>,
  edgeLoads: Map<string, number>,
  counters: Map<string, number>,
  tickMs: number,
  depth: number,
): RouteResult {
  if (depth > 16) return { latency: 0, errored: false }

  const node = nodes.find(n => n.id === nodeId)
  if (!node) return { latency: 0, errored: false }

  const load = nodeLoads.get(nodeId)!
  load.handled++

  const d = node.data
  let latency = 0
  let errored = false
  let nextEdge: AppEdge | null = null

  switch (d.kind) {
    case 'client': {
      const out = getMainOutgoing(nodeId, edges)
      nextEdge = out[Math.floor(Math.random() * out.length)] ?? null
      break
    }
    case 'cdn': {
      latency += d.edgeLatencyMs
      if (Math.random() >= d.hitRate) {
        const out = getMainOutgoing(nodeId, edges)
        nextEdge = out[Math.floor(Math.random() * out.length)] ?? null
      }
      break
    }
    case 'cache': {
      latency += d.lookupTimeMs
      if (Math.random() >= d.hitRate) {
        const out = getMainOutgoing(nodeId, edges)
        nextEdge = out[Math.floor(Math.random() * out.length)] ?? null
      }
      break
    }
    case 'loadBalancer': {
      latency += 2
      nextEdge = pickTarget(nodeId, edges, d.algorithm, counters, nodeLoads)
      break
    }
    case 'server': {
      latency += serverTotalMs(d)
      errored = Math.random() < d.errorRate

      // Required side calls (e.g. auth server, validation service)
      for (const reqEdge of getRequiredOutgoing(nodeId, edges)) {
        edgeLoads.set(reqEdge.id, (edgeLoads.get(reqEdge.id) ?? 0) + 1)
        const side = routeRequest(reqEdge.target, nodes, edges, nodeLoads, edgeLoads, counters, tickMs, depth + 1)
        latency += side.latency
        if (side.errored) errored = true
      }

      const out = getMainOutgoing(nodeId, edges)
      if (out.length > 0) nextEdge = out[Math.floor(Math.random() * out.length)]
      break
    }
    case 'database': {
      latency += d.queryTimeMs
      errored = Math.random() < d.errorRate
      const out = getMainOutgoing(nodeId, edges)
      if (out.length > 0) nextEdge = out[Math.floor(Math.random() * out.length)]
      break
    }
    case 'storage': {
      // Average of read/write latency (simplified model)
      latency += Math.round((d.readLatencyMs + d.writeLatencyMs) / 2)
      errored = Math.random() < d.errorRate
      const out = getMainOutgoing(nodeId, edges)
      if (out.length > 0) nextEdge = out[Math.floor(Math.random() * out.length)]
      break
    }
  }

  load.latency += latency
  if (errored) load.errors++

  if (nextEdge) {
    edgeLoads.set(nextEdge.id, (edgeLoads.get(nextEdge.id) ?? 0) + 1)
    const downstream = routeRequest(
      nextEdge.target, nodes, edges, nodeLoads, edgeLoads, counters, tickMs, depth + 1
    )
    return { latency: latency + downstream.latency, errored: errored || downstream.errored }
  }

  return { latency, errored }
}

function computeStatus(handled: number, capacity: number): NodeStatus {
  if (handled === 0) return 'idle'
  const ratio = capacity === Infinity ? 0 : handled / capacity
  if (ratio < 0.5) return 'active'
  if (ratio < 0.9) return 'stressed'
  return 'overloaded'
}

const BATCH_CAP = 3000

export function runTick(
  nodes: AppNode[],
  edges: AppEdge[],
  tickMs: number,
  accumulators: Map<string, number>,
  roundRobinCounters: Map<string, number>,
): TickResult {
  const nodeLoads = new Map<string, { handled: number; capacity: number; latency: number; errors: number }>()
  const edgeLoads = new Map<string, number>()
  const newAccumulators = new Map(accumulators)
  const newCounters = new Map(roundRobinCounters)

  for (const node of nodes) {
    nodeLoads.set(node.id, { handled: 0, capacity: nodeCapacity(node, tickMs), latency: 0, errors: 0 })
  }

  let totalCompleted = 0
  let totalLatency = 0
  let totalErrors = 0

  const clients = nodes.filter(n => n.data.kind === 'client')
  for (const client of clients) {
    const rps = (client.data as { rps: number }).rps
    const prev = newAccumulators.get(client.id) ?? 0
    const next = prev + rps * tickMs / 1000
    const target = Math.floor(next)
    newAccumulators.set(client.id, next - target)

    // Sample at most BATCH_CAP requests and scale results proportionally
    const count = Math.min(target, BATCH_CAP)
    if (count === 0) continue
    const scale = target / count

    let batchLatency = 0
    let batchErrors = 0

    for (let i = 0; i < count; i++) {
      const result = routeRequest(client.id, nodes, edges, nodeLoads, edgeLoads, newCounters, tickMs, 0)
      batchLatency += result.latency
      if (result.errored) batchErrors++
    }

    // Scale metrics if we sampled
    if (scale > 1) {
      for (const load of nodeLoads.values()) {
        load.handled = Math.round(load.handled * scale)
        load.latency = Math.round(load.latency * scale)
        load.errors = Math.round(load.errors * scale)
      }
      for (const [eid, c] of edgeLoads) {
        edgeLoads.set(eid, Math.round(c * scale))
      }
    }

    totalCompleted += Math.round(count * scale)
    totalLatency += Math.round(batchLatency * scale)
    totalErrors += Math.round(batchErrors * scale)
  }

  const tickSeconds = tickMs / 1000
  const nodeMetrics = new Map<string, NodeMetrics>()
  for (const node of nodes) {
    const load = nodeLoads.get(node.id)!
    nodeMetrics.set(node.id, {
      rps: Math.round(load.handled / tickSeconds),
      avgLatencyMs: load.handled > 0 ? Math.round(load.latency / load.handled) : 0,
      errorRate: load.handled > 0 ? load.errors / load.handled : 0,
      status: computeStatus(load.handled, load.capacity),
    })
  }

  const edgeTraffic = new Map<string, number>()
  for (const [edgeId, count] of edgeLoads) {
    edgeTraffic.set(edgeId, Math.round(count / tickSeconds))
  }

  const totalRPS = Math.round(totalCompleted / tickSeconds)
  const avgLatencyMs = totalCompleted > 0 ? Math.round(totalLatency / totalCompleted) : 0
  const errorRate = totalCompleted > 0 ? totalErrors / totalCompleted : 0

  return { nodeMetrics, edgeTraffic, totalRPS, avgLatencyMs, errorRate, newAccumulators, newCounters }
}
