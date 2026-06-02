import type { AppNode, AppEdge, NodeMetrics, NodeStatus, LBAlgorithm, TrafficPattern } from '../types'

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

interface ClientLike {
  rps: number
  trafficPattern?: TrafficPattern
  rampDurationTicks?: number
  spikeFactor?: number
  spikeDurationTicks?: number
  spikeIntervalTicks?: number
  sineAmplitude?: number
  sinePeriodTicks?: number
}

function effectiveRPS(d: ClientLike, tick: number): number {
  const rps = d.rps
  switch (d.trafficPattern ?? 'constant') {
    case 'ramp':
      return Math.round(rps * Math.min(1, tick / (d.rampDurationTicks ?? 300)))
    case 'spike': {
      const phase = tick % (d.spikeIntervalTicks ?? 200)
      return phase < (d.spikeDurationTicks ?? 30) ? Math.round(rps * (d.spikeFactor ?? 5)) : rps
    }
    case 'sine': {
      const wave = Math.sin(2 * Math.PI * tick / (d.sinePeriodTicks ?? 400))
      return Math.max(0, Math.round(rps * (1 + (d.sineAmplitude ?? 0.5) * wave)))
    }
    default:
      return rps
  }
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
  if (d.kind === 'storage') {
    const avgMs = (d.readLatencyMs + d.writeLatencyMs) / 2
    const concurrency = d.storageType === 'minio' ? 20 : 200
    return Math.max(1, Math.floor(concurrency * tickMs / avgMs))
  }
  if (d.kind === 'orchestrator') {
    const totalCores = d.maxInstances * d.instanceCpuCores
    return Math.max(1, Math.floor(totalCores * tickMs / d.processingTimeMs))
  }
  return Infinity
}

// M/M/c queueing model approximation.
// util = handled/capacity = per-worker utilisation (ρ in M/M/c notation).
// parallelism = number of parallel workers (cores, connections, …).
//
// Stable (ρ < 1):  W ≈ T · (1 + ρ / (c · (1 – ρ)))
// Overloaded (ρ ≥ 1): queue grows without bound → severe latency + errors.
function computeQueueingEffect(
  util: number,
  parallelism: number,
): { latencyMultiplier: number; extraErrorRate: number } {
  if (util <= 0.01 || parallelism <= 0) return { latencyMultiplier: 1, extraErrorRate: 0 }

  if (util >= 1) {
    return {
      latencyMultiplier: 1 + util * 5,
      extraErrorRate: Math.min(0.95, (util - 1) * 0.8),
    }
  }

  const latencyMultiplier = 1 + util / (parallelism * (1 - util))
  return { latencyMultiplier: Math.min(latencyMultiplier, 50), extraErrorRate: 0 }
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
  failedNodeIds: Set<string>,
): RouteResult {
  if (depth > 16) return { latency: 0, errored: false }

  if (failedNodeIds.has(nodeId)) {
    const load = nodeLoads.get(nodeId)
    if (load) { load.handled++; load.errors++ }
    return { latency: 0, errored: true }
  }

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
        const side = routeRequest(reqEdge.target, nodes, edges, nodeLoads, edgeLoads, counters, tickMs, depth + 1, failedNodeIds)
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
    case 'orchestrator': {
      latency += d.processingTimeMs
      errored = Math.random() < d.errorRate

      // Required side calls (e.g. per-container DB calls)
      for (const reqEdge of getRequiredOutgoing(nodeId, edges)) {
        edgeLoads.set(reqEdge.id, (edgeLoads.get(reqEdge.id) ?? 0) + 1)
        const side = routeRequest(reqEdge.target, nodes, edges, nodeLoads, edgeLoads, counters, tickMs, depth + 1, failedNodeIds)
        latency += side.latency
        if (side.errored) errored = true
      }

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
      nextEdge.target, nodes, edges, nodeLoads, edgeLoads, counters, tickMs, depth + 1, failedNodeIds
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
  currentTick: number,
  failedNodeIds: Set<string>,
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
    if (failedNodeIds.has(client.id)) continue
    const rps = effectiveRPS(client.data as ClientLike, currentTick)
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
      const result = routeRequest(client.id, nodes, edges, nodeLoads, edgeLoads, newCounters, tickMs, 0, failedNodeIds)
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

  // Apply M/M/c queueing corrections using final (scaled) load counts.
  // Extra latency is added to the global total weighted by requests through each node.
  let adjustedTotalLatency = totalLatency
  const nodeMetrics = new Map<string, NodeMetrics>()

  for (const node of nodes) {
    const load = nodeLoads.get(node.id)!
    const d = node.data
    const isFailed = failedNodeIds.has(node.id)

    let avgLatency = load.handled > 0 ? load.latency / load.handled : 0
    let errorRate = load.handled > 0 ? load.errors / load.handled : 0
    let utilization = 0

    if (!isFailed && load.capacity !== Infinity && load.handled > 0) {
      utilization = load.handled / load.capacity
      let parallelism = 0

      if (d.kind === 'server') parallelism = d.cpuCores
      else if (d.kind === 'database') parallelism = d.maxConnections
      else if (d.kind === 'storage') parallelism = d.storageType === 'minio' ? 20 : 200
      else if (d.kind === 'orchestrator') parallelism = d.maxInstances * d.instanceCpuCores

      if (parallelism > 0) {
        const { latencyMultiplier, extraErrorRate } = computeQueueingEffect(utilization, parallelism)
        adjustedTotalLatency += avgLatency * (latencyMultiplier - 1) * load.handled
        avgLatency *= latencyMultiplier
        errorRate = Math.min(1, errorRate + extraErrorRate)
      }
    }

    nodeMetrics.set(node.id, {
      rps: Math.round(load.handled / tickSeconds),
      avgLatencyMs: Math.round(avgLatency),
      errorRate: isFailed ? 1 : errorRate,
      status: isFailed ? 'overloaded' : computeStatus(load.handled, load.capacity),
      utilization: isFailed ? 1 : Math.min(2, utilization),
    })
  }

  const edgeTraffic = new Map<string, number>()
  for (const [edgeId, count] of edgeLoads) {
    edgeTraffic.set(edgeId, Math.round(count / tickSeconds))
  }

  const totalRPS = Math.round(totalCompleted / tickSeconds)
  const avgLatencyMs = totalCompleted > 0 ? Math.round(adjustedTotalLatency / totalCompleted) : 0
  const errorRate = totalCompleted > 0 ? totalErrors / totalCompleted : 0

  return { nodeMetrics, edgeTraffic, totalRPS, avgLatencyMs, errorRate, newAccumulators, newCounters }
}
