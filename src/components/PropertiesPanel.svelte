<script lang="ts">
  import { nodes, edges, selectedNodeId, selectedEdgeId, updateNodeData, updateEdgeData, deleteNode } from '../stores/graphStore'
  import { nodeMetrics, simStatus } from '../stores/simStore'
  import type { NodeParams, MiddlewareStep } from '../types'

  $: selectedNode = $selectedNodeId ? $nodes.find(n => n.id === $selectedNodeId) : null
  $: selectedEdge = $selectedEdgeId ? $edges.find(e => e.id === $selectedEdgeId) : null
  $: metrics = $selectedNodeId ? $nodeMetrics.get($selectedNodeId) : null
  $: running = $simStatus !== 'idle'

  $: edgeSource = selectedEdge ? $nodes.find(n => n.id === selectedEdge.source) : null
  $: edgeTarget = selectedEdge ? $nodes.find(n => n.id === selectedEdge.target) : null

  function patch(partial: Partial<NodeParams>) {
    if (!$selectedNodeId) return
    updateNodeData($selectedNodeId, partial)
  }

  function patchEdge(partial: Record<string, any>) {
    if (!$selectedEdgeId) return
    updateEdgeData($selectedEdgeId, partial as any)
  }

  function inputVal(e: Event): string { return (e.target as HTMLInputElement).value }
  function numVal(e: Event): number { return parseFloat((e.target as HTMLInputElement).value) }
  function selVal(e: Event): string { return (e.target as HTMLSelectElement).value }
  function checkVal(e: Event): boolean { return (e.target as HTMLInputElement).checked }

  const statusColor: Record<string, string> = {
    idle: 'text-slate-400',
    active: 'text-emerald-600',
    stressed: 'text-amber-600',
    overloaded: 'text-red-500',
  }

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
  const labelCls = "text-xs text-slate-500 font-medium"

  let stepCounter = 0
  function addStep() {
    if (!selectedNode || selectedNode.data.kind !== 'server') return
    const steps: MiddlewareStep[] = [...(selectedNode.data.middleware ?? []), {
      id: `step-${++stepCounter}`,
      name: 'Step',
      latencyMs: 10,
    }]
    patch({ middleware: steps } as any)
  }

  function removeStep(stepId: string) {
    if (!selectedNode || selectedNode.data.kind !== 'server') return
    patch({ middleware: selectedNode.data.middleware.filter(s => s.id !== stepId) } as any)
  }

  function updateStepName(stepId: string, e: Event) {
    if (!selectedNode || selectedNode.data.kind !== 'server') return
    const steps = selectedNode.data.middleware.map(s => s.id === stepId ? { ...s, name: inputVal(e) } : s)
    patch({ middleware: steps } as any)
  }

  function updateStepLatency(stepId: string, e: Event) {
    if (!selectedNode || selectedNode.data.kind !== 'server') return
    const steps = selectedNode.data.middleware.map(s => s.id === stepId ? { ...s, latencyMs: numVal(e) } : s)
    patch({ middleware: steps } as any)
  }
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
            <span class="{statusColor[metrics.status] ?? 'text-slate-500'} capitalize font-medium">{metrics.status}</span>
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
            <select class={inputCls} value={selectedNode.data.subtype} on:change={(e) => patch({ subtype: selVal(e) })}>
              <option value="browser">Browser</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Requests / Second</label>
            <input type="number" min="1" max="100000" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.rps}
              on:change={(e) => patch({ rps: numVal(e) })}
            />
          </div>
          <p class="text-[10px] text-slate-400">
            ~{Math.round(selectedNode.data.rps / 10).toLocaleString()} concurrent users (estimated)
          </p>
        </div>

      {:else if selectedNode.data.kind === 'server'}
        <div class="space-y-3">
          <div class="space-y-1">
            <label class={labelCls}>CPU Cores</label>
            <input type="number" min="1" max="1024" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.cpuCores}
              on:change={(e) => patch({ cpuCores: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Base Processing Time (ms)</label>
            <input type="number" min="1" max="60000" step="1" class="{inputCls} font-mono"
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

          <!-- Middleware chain -->
          <div class="space-y-2 pt-1 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <label class={labelCls}>Pipeline steps</label>
              <button
                class="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                on:click={addStep}
              >+ Add</button>
            </div>
            {#if selectedNode.data.middleware.length === 0}
              <p class="text-[10px] text-slate-400">No middleware. Add steps like auth checks, validation, etc.</p>
            {:else}
              {#each selectedNode.data.middleware as step (step.id)}
                <div class="flex items-center gap-1.5">
                  <input
                    class="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                    value={step.name}
                    on:input={(e) => updateStepName(step.id, e)}
                  />
                  <input
                    type="number" min="0" max="60000"
                    class="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-700 focus:outline-none focus:border-slate-400"
                    value={step.latencyMs}
                    on:change={(e) => updateStepLatency(step.id, e)}
                  />
                  <span class="text-[10px] text-slate-400">ms</span>
                  <button
                    class="text-slate-300 hover:text-red-400 transition-colors text-sm leading-none"
                    on:click={() => removeStep(step.id)}
                  >✕</button>
                </div>
              {/each}
              <p class="text-[10px] text-slate-400">
                Total: {selectedNode.data.processingTimeMs + selectedNode.data.middleware.reduce((s, m) => s + m.latencyMs, 0)}ms per request
              </p>
            {/if}
          </div>
        </div>

      {:else if selectedNode.data.kind === 'loadBalancer'}
        <div class="space-y-3">
          <div class="space-y-1">
            <label class={labelCls}>Algorithm</label>
            <select class={inputCls} value={selectedNode.data.algorithm} on:change={(e) => patch({ algorithm: selVal(e) })}>
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
            <select class={inputCls} value={selectedNode.data.dbType} on:change={(e) => patch({ dbType: selVal(e) })}>
              <option value="sql">SQL (PostgreSQL, MySQL…)</option>
              <option value="nosql">NoSQL (MongoDB, DynamoDB…)</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Query Time (ms)</label>
            <input type="number" min="1" max="60000" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.queryTimeMs}
              on:change={(e) => patch({ queryTimeMs: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Max Connections</label>
            <input type="number" min="1" max="10000" step="1" class="{inputCls} font-mono"
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
            <input type="number" min="0" max="10000" step="1" class="{inputCls} font-mono"
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
            <input type="number" min="1" max="2000" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.edgeLatencyMs}
              on:change={(e) => patch({ edgeLatencyMs: numVal(e) })}
            />
          </div>
        </div>

      {:else if selectedNode.data.kind === 'storage'}
        <div class="space-y-3">
          <div class="space-y-1">
            <label class={labelCls}>Provider</label>
            <select class={inputCls} value={selectedNode.data.storageType} on:change={(e) => patch({ storageType: selVal(e) })}>
              <option value="s3">AWS S3</option>
              <option value="gcs">Google Cloud Storage</option>
              <option value="blob">Azure Blob Storage</option>
              <option value="minio">MinIO (self-hosted)</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Read Latency (ms)</label>
            <input type="number" min="1" max="60000" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.readLatencyMs}
              on:change={(e) => patch({ readLatencyMs: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Write Latency (ms)</label>
            <input type="number" min="1" max="60000" step="1" class="{inputCls} font-mono"
              value={selectedNode.data.writeLatencyMs}
              on:change={(e) => patch({ writeLatencyMs: numVal(e) })}
            />
          </div>
          <div class="space-y-1">
            <label class={labelCls}>Error Rate (0–1)</label>
            <input type="number" min="0" max="1" step="0.001" class="{inputCls} font-mono"
              value={selectedNode.data.errorRate}
              on:change={(e) => patch({ errorRate: numVal(e) })}
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
          Delete node
        </button>
      </div>

    </div>
  </aside>

{:else if selectedEdge}
  <aside class="w-64 bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <span class="text-xs font-medium text-slate-600">Connection</span>
      <button
        class="text-slate-300 hover:text-slate-500 text-sm leading-none transition-colors"
        on:click={() => selectedEdgeId.set(null)}
      >✕</button>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">

      <!-- Edge endpoints -->
      <div class="text-xs text-slate-400 space-y-0.5">
        <div class="flex items-center gap-1.5">
          <span class="font-medium text-slate-600">{edgeSource?.data.label ?? '?'}</span>
          <span>→</span>
          <span class="font-medium text-slate-600">{edgeTarget?.data.label ?? '?'}</span>
        </div>
        {#if selectedEdge.data?.currentRPS}
          <div class="font-mono">{selectedEdge.data.currentRPS}/s</div>
        {/if}
      </div>

      <!-- Protocol -->
      <div class="space-y-1">
        <label class="text-xs text-slate-500 font-medium">Protocol</label>
        <select
          class={inputCls}
          value={selectedEdge.data?.protocol ?? 'http'}
          on:change={(e) => patchEdge({ protocol: selVal(e) })}
        >
          <option value="http">HTTP / REST</option>
          <option value="websocket">WebSocket</option>
          <option value="grpc">gRPC</option>
          <option value="tcp">TCP / raw socket</option>
        </select>
      </div>

      <!-- Required call -->
      <div class="space-y-2">
        <label class="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            class="mt-0.5 rounded"
            checked={selectedEdge.data?.required ?? false}
            on:change={(e) => patchEdge({ required: checkVal(e) })}
          />
          <span class="text-xs text-slate-600">
            <span class="font-medium">Required call</span>
            <span class="block text-slate-400 mt-0.5">
              Every request through the source node also calls this target (e.g. auth validation, rate limiter).
              Adds the target's latency to the source.
            </span>
          </span>
        </label>
      </div>

    </div>
  </aside>
{/if}
