<script lang="ts">
  import { X, FileCode2, AlertCircle, CheckCircle2 } from 'lucide-svelte'
  import { mermaidModalOpen } from '../stores/uiStore'
  import { loadGraph, resetGraphMetrics } from '../stores/graphStore'
  import { resetSim } from '../stores/simStore'
  import { mermaidToGraph, parseMermaid } from '../lib/mermaidParser'

  const EXAMPLE = `graph LR
  browser[Browser] --> lb{Load Balancer}
  mobile[Mobile App] --> lb
  lb --> api1[API Server]
  lb --> api2[API Server]
  api1 --> cache([Redis])
  api2 --> cache
  api1 --> db[(PostgreSQL)]
  api2 --> db`

  let value = EXAMPLE
  let error: string | undefined = undefined
  let nodeCount = 0

  $: {
    const result = parseMermaid(value)
    error = result.error
    nodeCount = result.nodes.length
  }

  $: valid = !error && nodeCount > 0

  function handleImport() {
    const result = mermaidToGraph(value)
    if (result.error) { error = result.error; return }
    resetSim()
    resetGraphMetrics()
    loadGraph(result.nodes, result.edges)
    mermaidModalOpen.set(false)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') mermaidModalOpen.set(false)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && valid) handleImport()
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Overlay -->
<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
  on:click|self={() => mermaidModalOpen.set(false)}
>
  <div class="w-[640px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">

    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div class="flex items-center gap-2.5">
        <span class="text-indigo-500"><FileCode2 size={18} /></span>
        <span class="font-semibold text-slate-800 text-sm">Import from Mermaid</span>
      </div>
      <button
        class="text-slate-400 hover:text-slate-600 transition-colors"
        on:click={() => mermaidModalOpen.set(false)}
      >
        <X size={18} />
      </button>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">

      <p class="text-xs text-slate-500 leading-relaxed">
        Paste a <code class="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono text-[11px]">graph</code> or
        <code class="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono text-[11px]">flowchart</code> Mermaid diagram.
        Node types are inferred from labels and shapes — or use the shape hints below.
      </p>

      <!-- Shape reference -->
      <div class="grid grid-cols-3 gap-1 text-[11px]">
        {#each [
          ['id[Label]',     'Server'],
          ['id(Label)',     'CDN'],
          ['id[(Label)]',   'Database'],
          ['id([Label])',   'Cache'],
          ['id((Label))',   'Client'],
          ['id{Label}',     'Load Balancer'],
          ['id[[Label]]',   'Storage'],
          ['-.->',          'Required call'],
          ['-- ws -->',     'WebSocket'],
        ] as [shape, type]}
          <div class="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5">
            <code class="text-slate-600 font-mono">{shape}</code>
            <span class="text-slate-400">→</span>
            <span class="text-slate-600">{type}</span>
          </div>
        {/each}
      </div>

      <!-- Textarea -->
      <div class="space-y-1.5">
        <textarea
          class="w-full h-56 bg-slate-50 border rounded-xl px-4 py-3 text-sm font-mono text-slate-800
                 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400
                 resize-none transition-colors leading-relaxed
                 {error ? 'border-red-300' : valid ? 'border-emerald-300' : 'border-slate-200'}"
          bind:value
          placeholder={EXAMPLE}
          spellcheck="false"
        ></textarea>

        <!-- Status bar -->
        <div class="flex items-center gap-2 h-5">
          {#if error}
            <span class="text-red-500"><AlertCircle size={13} /></span>
            <span class="text-xs text-red-500">{error}</span>
          {:else if valid}
            <span class="text-emerald-500"><CheckCircle2 size={13} /></span>
            <span class="text-xs text-emerald-600">{nodeCount} node{nodeCount !== 1 ? 's' : ''} detected</span>
          {/if}
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <span class="text-[11px] text-slate-400 font-mono">
        {#if valid}Cmd+Enter to import{/if}
      </span>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors font-medium"
          on:click={() => mermaidModalOpen.set(false)}
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                 {valid
                   ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-sm'
                   : 'bg-slate-200 text-slate-400 cursor-not-allowed'}"
          disabled={!valid}
          on:click={handleImport}
        >
          Import
        </button>
      </div>
    </div>

  </div>
</div>
