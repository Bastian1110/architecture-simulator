import { get } from 'svelte/store'
import { runHistory, nodeMetrics } from '../stores/simStore'
import { nodes, edges } from '../stores/graphStore'
import { graphToMermaid } from './mermaidExporter'

export function saveRunResults() {
  const history = get(runHistory)
  const metrics = get(nodeMetrics)
  const ns = get(nodes)
  const es = get(edges)

  const last = history[history.length - 1] ?? { globalRPS: 0, avgLatencyMs: 0, errorRate: 0 }

  const perNode: Record<string, { rps: number; avgLatencyMs: number; errorRate: number; status: string }> = {}
  for (const node of ns) {
    const m = metrics.get(node.id)
    if (m) perNode[node.data.label] = { rps: m.rps, avgLatencyMs: m.avgLatencyMs, errorRate: m.errorRate, status: m.status }
  }

  const report = {
    savedAt: new Date().toISOString(),
    ticks: last.tick,
    architecture: graphToMermaid(ns, es),
    summary: {
      globalRPS: last.globalRPS,
      avgLatencyMs: last.avgLatencyMs,
      errorRate: last.errorRate,
    },
    timeSeries: history,
    nodeMetrics: perNode,
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `archi-sim-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}
