<script lang="ts">
  import { timeSeries, latestMetrics, simStatus } from '../stores/simStore'
  import type { TimeSeriesPoint } from '../types'

  $: ts = $timeSeries
  $: running = $simStatus !== 'idle'

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
  <div class="h-[140px] border-t border-slate-200 bg-white flex shrink-0 shadow-sm">

    <!-- RPS chart -->
    <div class="flex-1 flex flex-col px-4 py-3 border-r border-slate-100">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Requests / sec</span>
        <span class="text-emerald-600 font-mono text-sm font-bold">{$latestMetrics.globalRPS}</span>
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
        <span class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Avg Latency</span>
        <span class="text-indigo-600 font-mono text-sm font-bold">{$latestMetrics.avgLatencyMs}ms</span>
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
    <div class="flex-1 flex flex-col px-4 py-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Error Rate</span>
        <span class="{$latestMetrics.errorRate > 0.05 ? 'text-red-500 font-bold' : 'text-slate-600'} font-mono text-sm font-bold">
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

  </div>
{/if}
