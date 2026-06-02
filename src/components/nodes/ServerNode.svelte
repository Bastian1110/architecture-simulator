<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte'
  import { Server } from 'lucide-svelte'
  import { nodeMetrics, simStatus } from '../../stores/simStore'
  import { selectedNodeId } from '../../stores/graphStore'
  import FailedOverlay from './FailedOverlay.svelte'
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
<div class="arch-node status-{status} {selected ? 'selected' : ''} relative" on:click={handleClick}>
  <FailedOverlay {id} />
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />

  <div class="flex items-center gap-2 mb-2">
    <span style="color: #10b981"><Server size={14} /></span>
    <span class="text-sm font-medium text-slate-800 flex-1 truncate">{data.label}</span>
    <span class="w-1.5 h-1.5 rounded-full status-dot-{status} shrink-0"></span>
  </div>

  <div class="text-[11px] text-slate-400 space-y-0.5">
    <div class="flex justify-between gap-3">
      <span>{data.cpuCores} cores · {data.processingTimeMs}ms</span>
      {#if running && metrics}
        <span class="{metrics.status === 'overloaded' ? 'text-red-400' : metrics.status === 'stressed' ? 'text-amber-500' : 'text-slate-600'} font-mono">{metrics.rps}/s</span>
      {/if}
    </div>
    {#if running && metrics && metrics.avgLatencyMs > 0}
      <div class="text-slate-400">{metrics.avgLatencyMs}ms avg</div>
    {/if}
  </div>
</div>
