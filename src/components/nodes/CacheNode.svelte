<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte'
  import { Zap } from 'lucide-svelte'
  import { nodeMetrics, simStatus } from '../../stores/simStore'
  import { selectedNodeId } from '../../stores/graphStore'
  import type { CacheParams } from '../../types'

  export let id: string
  export let data: CacheParams
  export let selected: boolean = false

  $: metrics = $nodeMetrics.get(id)
  $: status = metrics?.status ?? 'idle'
  $: running = $simStatus === 'running'

  function handleClick() { selectedNodeId.set(id) }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="arch-node status-{status} {selected ? 'selected' : ''}" on:click={handleClick}>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />

  <div class="flex items-center gap-2 mb-2">
    <span style="color: #06b6d4"><Zap size={14} /></span>
    <span class="text-sm font-medium text-slate-800 flex-1 truncate">{data.label}</span>
    <span class="w-1.5 h-1.5 rounded-full status-dot-{status} shrink-0"></span>
  </div>

  <div class="text-[11px] text-slate-400 space-y-0.5">
    <div class="flex justify-between gap-3">
      <span>{Math.round(data.hitRate * 100)}% hit · {data.lookupTimeMs}ms</span>
      {#if running && metrics}
        <span class="text-slate-600 font-mono">{metrics.rps}/s</span>
      {/if}
    </div>
  </div>
</div>
