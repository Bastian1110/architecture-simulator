<script lang="ts">
  import { timeSeries, latestMetrics, simStatus, nodeMetrics } from '../stores/simStore'
  import { nodes } from '../stores/graphStore'
  import type { TimeSeriesPoint, NodeKind } from '../types'

  $: ts = $timeSeries
  $: running = $simStatus !== 'idle'

  function bottleneckSuggestion(kind: NodeKind, util: number): string {
    const overloaded = util >= 1
    switch (kind) {
      case 'server':      return overloaded ? 'Overloaded — add CPU cores or more instances' : 'High CPU — add cores or scale horizontally'
      case 'database':    return overloaded ? 'Overloaded — add read replicas or connection pooler' : 'High connections — consider a read replica or cache'
      case 'orchestrator':return overloaded ? 'Overloaded — increase max pods or cores per pod' : 'Near capacity — raise max pods'
      case 'storage':     return overloaded ? 'Overloaded — raise concurrency or front with a CDN' : 'High I/O — cache frequent reads'
      case 'loadBalancer':return overloaded ? 'Saturated — raise maxRPS cap' : 'Approaching limit — check maxRPS'
      default:            return overloaded ? 'Node is overloaded' : 'Approaching saturation'
    }
  }

  $: bottleneck = (() => {
    if ($nodeMetrics.size === 0) return null
    let maxUtil = 0.6  // only surface nodes above 60%
    let best: { label: string; kind: NodeKind; util: number } | null = null
    for (const node of $nodes) {
      const m = $nodeMetrics.get(node.id)
      if (!m || m.utilization <= maxUtil) continue
      maxUtil = m.utilization
      best = { label: node.data.label, kind: node.data.kind, util: m.utilization }
    }
    return best
  })()

  const W = 240
  const H = 60
  const PAD = 4

  function toPolyline(points: TimeSeriesPoint[], key: keyof TimeSeriesPoint, maxVal: number): string {
    if (points.length < 2) return ''
    const n = points.length
    return points
      .map((p, i) => {
        const x = PAD + (i / (n - 1)) * (W - PAD * 2)
        const val = Number(p[key])
        const y = (H - PAD) - (Math.min(val, maxVal) / maxVal) * (H - PAD * 2)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }
</script>

{#if running}
  <div class="h-[120px] border-t border-slate-200 bg-white flex shrink-0">

    <!-- RPS chart -->
    <div class="flex-1 flex flex-col px-4 py-3 border-r border-slate-100">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-400">Requests / sec</span>
        <span class="text-slate-700 font-mono text-sm font-medium">{$latestMetrics.globalRPS}</span>
      </div>
      <svg viewBox="0 0 {W} {H}" class="flex-1 w-full">
        <defs>
          <linearGradient id="grad-rps" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} stroke="#f1f5f9" stroke-width="1" />
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#f1f5f9" stroke-width="1" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#f1f5f9" stroke-width="1" />
        {#if ts.length > 1}
          {@const line = toPolyline(ts, 'globalRPS', Math.max(10, ...ts.map(p => p.globalRPS)))}
          <polygon points="{PAD},{H - PAD} {line} {W - PAD},{H - PAD}" fill="url(#grad-rps)" />
          <polyline points={line} fill="none" stroke="#10b981" stroke-width="1.5" stroke-linejoin="round" />
        {/if}
      </svg>
    </div>

    <!-- Latency chart -->
    <div class="flex-1 flex flex-col px-4 py-3 border-r border-slate-100">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-400">Avg latency</span>
        <span class="text-slate-700 font-mono text-sm font-medium">{$latestMetrics.avgLatencyMs}ms</span>
      </div>
      <svg viewBox="0 0 {W} {H}" class="flex-1 w-full">
        <defs>
          <linearGradient id="grad-lat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} stroke="#f1f5f9" stroke-width="1" />
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#f1f5f9" stroke-width="1" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#f1f5f9" stroke-width="1" />
        {#if ts.length > 1}
          {@const line = toPolyline(ts, 'avgLatencyMs', Math.max(50, ...ts.map(p => p.avgLatencyMs)))}
          <polygon points="{PAD},{H - PAD} {line} {W - PAD},{H - PAD}" fill="url(#grad-lat)" />
          <polyline points={line} fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linejoin="round" />
        {/if}
      </svg>
    </div>

    <!-- Error rate chart -->
    <div class="flex-1 flex flex-col px-4 py-3 border-r border-slate-100">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-400">Error rate</span>
        <span class="{$latestMetrics.errorRate > 0.05 ? 'text-red-500 font-medium' : 'text-slate-700'} font-mono text-sm">
          {($latestMetrics.errorRate * 100).toFixed(1)}%
        </span>
      </div>
      <svg viewBox="0 0 {W} {H}" class="flex-1 w-full">
        <defs>
          <linearGradient id="grad-err" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} stroke="#f1f5f9" stroke-width="1" />
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#f1f5f9" stroke-width="1" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#f1f5f9" stroke-width="1" />
        {#if ts.length > 1}
          {@const line = toPolyline(ts, 'errorRate', Math.max(0.1, ...ts.map(p => p.errorRate)))}
          <polygon points="{PAD},{H - PAD} {line} {W - PAD},{H - PAD}" fill="url(#grad-err)" />
          <polyline points={line} fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linejoin="round" />
        {/if}
      </svg>
    </div>

    <!-- Bottleneck panel -->
    <div class="w-52 shrink-0 flex flex-col px-4 py-3">
      <span class="text-xs text-slate-400 mb-2">Bottleneck</span>
      {#if bottleneck}
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full shrink-0 {bottleneck.util >= 1 ? 'bg-red-500' : 'bg-amber-400'}"></span>
          <span class="text-xs font-semibold {bottleneck.util >= 1 ? 'text-red-600' : 'text-amber-700'} truncate">{bottleneck.label}</span>
        </div>
        <span class="text-[11px] font-mono text-slate-500 mb-1.5">{Math.round(bottleneck.util * 100)}% utilized</span>
        <p class="text-[10px] text-slate-500 leading-relaxed">{bottleneckSuggestion(bottleneck.kind, bottleneck.util)}</p>
      {:else}
        <p class="text-[10px] text-slate-400 leading-relaxed">No bottleneck detected — all nodes below 60% utilization.</p>
      {/if}
    </div>

  </div>
{/if}
