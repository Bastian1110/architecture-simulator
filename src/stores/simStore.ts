import { writable, derived } from 'svelte/store'
import type { NodeMetrics, TimeSeriesPoint } from '../types'

export type SimStatus = 'idle' | 'running' | 'paused'

export const simStatus = writable<SimStatus>('idle')
export const simSpeed = writable<number>(1)
export const simTick = writable<number>(0)

// Per-node live metrics
export const nodeMetrics = writable<Map<string, NodeMetrics>>(new Map())

// Rolling time-series (last 120 points)
export const timeSeries = writable<TimeSeriesPoint[]>([])

// Internal accumulators for the simulation engine
export const requestAccumulators = writable<Map<string, number>>(new Map())
export const roundRobinCounters = writable<Map<string, number>>(new Map())

export function startSim() {
  simStatus.set('running')
}

export function pauseSim() {
  simStatus.set('paused')
}

export function resetSim() {
  simStatus.set('idle')
  simTick.set(0)
  nodeMetrics.set(new Map())
  timeSeries.set([])
  requestAccumulators.set(new Map())
  roundRobinCounters.set(new Map())
}

export function applyTickResult(result: {
  nodeMetrics: Map<string, NodeMetrics>
  edgeTraffic: Map<string, number>
  totalRPS: number
  avgLatencyMs: number
  errorRate: number
  newAccumulators: Map<string, number>
  newCounters: Map<string, number>
}) {
  simTick.update(t => {
    const nextTick = t + 1
    nodeMetrics.set(new Map(result.nodeMetrics))
    requestAccumulators.set(new Map(result.newAccumulators))
    roundRobinCounters.set(new Map(result.newCounters))
    timeSeries.update(ts => {
      const point: TimeSeriesPoint = {
        tick: nextTick,
        globalRPS: result.totalRPS,
        avgLatencyMs: result.avgLatencyMs,
        errorRate: result.errorRate,
      }
      return [...ts.slice(-119), point]
    })
    return nextTick
  })
}

export const latestMetrics = derived(timeSeries, $ts => {
  if ($ts.length === 0) return { globalRPS: 0, avgLatencyMs: 0, errorRate: 0 }
  return $ts[$ts.length - 1]
})
