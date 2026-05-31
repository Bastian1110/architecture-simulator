<script lang="ts">
  import { nodes, selectedNodeId, updateNodeData, deleteNode } from '../stores/graphStore'
  import { nodeMetrics, simStatus } from '../stores/simStore'
  import type { NodeParams } from '../types'

  $: selectedNode = $selectedNodeId ? $nodes.find(n => n.id === $selectedNodeId) : null
  $: metrics = $selectedNodeId ? $nodeMetrics.get($selectedNodeId) : null
  $: running = $simStatus !== 'idle'

  function patch(partial: Partial<NodeParams>) {
    if (!$selectedNodeId) return
    updateNodeData($selectedNodeId, partial)
  }

  function inputVal(e: Event): string {
    return (e.target as HTMLInputElement).value
  }
  function numVal(e: Event): number {
    return parseFloat((e.target as HTMLInputElement).value)
  }
  function selVal(e: Event): string {
    return (e.target as HTMLSelectElement).value
  }

  const statusColor: Record<string, string> = {
    idle: 'text-slate-400',
    active: 'text-emerald-600',
    stressed: 'text-amber-600',
    overloaded: 'text-red-500',
  }

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
  const labelCls = "text-xs text-slate-500 font-medium"
</script>

{#if selectedNode}
  <aside class="w-64 bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <span class="text-xs font-medium text-slate-600">{selectedNode.data.label}</span>
      <button
        class="text-slate-300 hover:text-slate-500 text-sm leading-none transition-colors"
        on:click={() => selectedNodeId.set(null)}
      >✕</button>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">

      <!-- Live metrics -->
      {#if running && metrics}
        <div class="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
          <div class="text-xs text-slate-500 font-medium mb-2">Live</div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400">Status</span>
            <span class="{statusColor[metrics.status] ?? 'text-slate-500'} capitalize font-medium">
              {metrics.status}
            </span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400">Throughput</span>
            <span class="text-slate-700 font-mono">{metrics.rps}/s</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400">Latency</span>
            <span class="text-slate-700 font-mono">{metrics.avgLatencyMs}ms</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400">Error rate</span>
            <span class="{metrics.errorRate > 0.05 ? 'text-red-500 font-medium' : 'text-slate-600'} font-mono">
              {(metrics.errorRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      {/if}

      <!-- Label -->
      <div class="space-y-1">
        <label class={labelCls}>Label</label>
        <input
          class={inputCls}
          value={selectedNode.data.label}
          on:input={(e) => patch({ label: inputVal(e) })}
        />
      </div>

      <!-- Kind-specific fields -->
      {#if selectedNode.data.kind === 'client'}
        <div class="space-y-3">
          <div class="space-y-1">
            <label class={labelCls}>Type</label>
            <select class={inputCls}
              value={selectedNode.data.subtype}
              on:change={(e) => patch({ subtype: selVal(e) })}
            >
              <option value="browser">Browser</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Requests / Second</label>
            <input type="number" min="1" max="10000" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.rps}
              on:change={(e) => patch({ rps: numVal(e) })}
            />
          </div>
        </div>

      {:else if selectedNode.data.kind === 'server'}
        <div class="space-y-3">
          <div class="space-y-1">
            <label class={labelCls}>CPU Cores</label>
            <input type="number" min="1" max="256" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.cpuCores}
              on:change={(e) => patch({ cpuCores: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Processing Time (ms)</label>
            <input type="number" min="1" max="10000" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.processingTimeMs}
              on:change={(e) => patch({ processingTimeMs: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Error Rate (0–1)</label>
            <input type="number" min="0" max="1" step="0.01" class="{inputCls} font-mono"
              value={selectedNode.data.errorRate}
              on:change={(e) => patch({ errorRate: numVal(e) })}
            />
          </div>
        </div>

      {:else if selectedNode.data.kind === 'loadBalancer'}
        <div class="space-y-3">
          <div class="space-y-1">
            <label class={labelCls}>Algorithm</label>
            <select class={inputCls}
              value={selectedNode.data.algorithm}
              on:change={(e) => patch({ algorithm: selVal(e) })}
            >
              <option value="roundRobin">Round Robin</option>
              <option value="leastConnections">Least Connections</option>
              <option value="random">Random</option>
            </select>
          </div>
        </div>

      {:else if selectedNode.data.kind === 'database'}
        <div class="space-y-3">
          <div class="space-y-1">
            <label class={labelCls}>DB Type</label>
            <select class={inputCls}
              value={selectedNode.data.dbType}
              on:change={(e) => patch({ dbType: selVal(e) })}
            >
              <option value="sql">SQL (PostgreSQL, MySQL…)</option>
              <option value="nosql">NoSQL (MongoDB, DynamoDB…)</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Query Time (ms)</label>
            <input type="number" min="1" max="5000" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.queryTimeMs}
              on:change={(e) => patch({ queryTimeMs: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Max Connections</label>
            <input type="number" min="1" max="1000" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.maxConnections}
              on:change={(e) => patch({ maxConnections: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Error Rate (0–1)</label>
            <input type="number" min="0" max="1" step="0.01" class="{inputCls} font-mono"
              value={selectedNode.data.errorRate}
              on:change={(e) => patch({ errorRate: numVal(e) })}
            />
          </div>
        </div>

      {:else if selectedNode.data.kind === 'cache'}
        <div class="space-y-3">
          <div class="space-y-1">
            <label class={labelCls}>Hit Rate (0–1)</label>
            <input type="number" min="0" max="1" step="0.01" class="{inputCls} font-mono"
              value={selectedNode.data.hitRate}
              on:change={(e) => patch({ hitRate: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Lookup Time (ms)</label>
            <input type="number" min="0" max="100" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.lookupTimeMs}
              on:change={(e) => patch({ lookupTimeMs: numVal(e) })}
            />
          </div>
        </div>

      {:else if selectedNode.data.kind === 'cdn'}
        <div class="space-y-3">
          <div class="space-y-1">
            <label class={labelCls}>Hit Rate (0–1)</label>
            <input type="number" min="0" max="1" step="0.01" class="{inputCls} font-mono"
              value={selectedNode.data.hitRate}
              on:change={(e) => patch({ hitRate: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Edge Latency (ms)</label>
            <input type="number" min="1" max="500" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.edgeLatencyMs}
              on:change={(e) => patch({ edgeLatencyMs: numVal(e) })}
            />
          </div>
        </div>
      {/if}

      <!-- Delete -->
      <div class="pt-2 border-t border-slate-100">
        <button
          class="w-full px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500
                 hover:text-red-600 text-xs font-medium transition-colors border border-red-100"
          on:click={() => { if ($selectedNodeId) deleteNode($selectedNodeId); selectedNodeId.set(null) }}
        >
          Delete Node
        </button>
      </div>

    </div>
  </aside>
{/if}
