<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte'
  import { Server } from 'lucide-svelte'
  import { nodeMetrics, simStatus } from '../../stores/simStore'
  import { selectedNodeId } from '../../stores/graphStore'
  import type { ServerParams } from '../../types'

  export let id: string
  export let data: ServerParams
  export let selected: boolean = false

  $: metrics = $nodeMetrics.get(id)
  $: status = metrics?.status ?? 'idle'
  $: running = $simStatus === 'running'

  function handleClick() { selectedNodeId.set(id) }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="arch-node status-{status} px-3 py-2.5 {selected ? 'selected' : ''}" on:click={handleClick}>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />

  <div class="flex items-center gap-2 mb-1.5">
    <span class="w-2 h-2 rounded-full status-dot-{status} shrink-0"></span>
    <span class="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Server / VM</span>
  </div>

  <div class="flex items-center gap-2 mb-2">
    <span class="text-slate-500"><Server size={16} /></span>
    <span class="text-sm font-semibold text-slate-800 truncate">{data.label}</span>
  </div>

  <div class="text-[11px] text-slate-500 space-y-0.5">
    <div class="flex justify-between gap-3">
      <span>Cores</span>
      <span class="text-slate-700 font-mono">{data.cpuCores}</span>
    </div>
    <div class="flex justify-between gap-3">
      <span>Latency</span>
      <span class="text-slate-700 font-mono">{data.processingTimeMs}ms</span>
    </div>
    {#if running && metrics}
      <div class="pt-1 border-t border-slate-200 flex justify-between gap-3 text-emerald-600">
        <span>Live RPS</span>
        <span class="font-mono">{metrics.rps}/s</span>
      </div>
      <div class="flex justify-between gap-3 {metrics.status === 'overloaded' ? 'text-red-400' : metrics.status === 'stressed' ? 'text-amber-400' : 'text-slate-500'}">
        <span>Latency</span>
        <span class="font-mono">{metrics.avgLatencyMs}ms</span>
      </div>
    {/if}
  </div>
</div>
