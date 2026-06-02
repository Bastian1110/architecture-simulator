<script lang="ts">
  import { X, Sparkles, FolderOpen } from 'lucide-svelte'
  import { examplesModalOpen } from '../stores/uiStore'
  import { loadGraph, resetGraphMetrics } from '../stores/graphStore'
  import { resetSim } from '../stores/simStore'
  import { EXAMPLES } from '../lib/examples'
  import type { ArchExample } from '../lib/examples'

  const tagColors: Record<string, string> = {
    'Cache-first':    'bg-emerald-50 text-emerald-700',
    'Cache-critical': 'bg-emerald-50 text-emerald-700',
    'CDN-heavy':      'bg-sky-50 text-sky-700',
    'Read-heavy':     'bg-indigo-50 text-indigo-700',
    'High RPS':       'bg-orange-50 text-orange-700',
    'High scale':     'bg-orange-50 text-orange-700',
    'WebSocket':      'bg-violet-50 text-violet-700',
    'Pub/Sub':        'bg-violet-50 text-violet-700',
    'Fan-out':        'bg-pink-50 text-pink-700',
    'Real-time':      'bg-pink-50 text-pink-700',
    'Multi-tier':     'bg-slate-100 text-slate-600',
    'Orchestrator':   'bg-violet-50 text-violet-700',
    'SQL':            'bg-blue-50 text-blue-700',
  }

  function handleLoad(ex: ArchExample) {
    resetSim()
    resetGraphMetrics()
    loadGraph(ex.nodes, ex.edges)
    examplesModalOpen.set(false)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') examplesModalOpen.set(false)
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
  on:click|self={() => examplesModalOpen.set(false)}
>
  <div class="w-[720px] max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">

    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div class="flex items-center gap-2.5">
        <span style="color: #204878;"><Sparkles size={18} /></span>
        <div>
          <span class="font-semibold text-slate-800 text-sm">Example architectures</span>
          <p class="text-[11px] text-slate-400 mt-0.5">Based on real-world system design patterns — ready to simulate</p>
        </div>
      </div>
      <button class="text-slate-400 hover:text-slate-600 transition-colors" on:click={() => examplesModalOpen.set(false)}>
        <X size={18} />
      </button>
    </div>

    <!-- Grid -->
    <div class="flex-1 overflow-y-auto px-6 py-5">
      <div class="grid grid-cols-2 gap-4">
        {#each EXAMPLES as ex (ex.id)}
          <div class="border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col gap-3 group">
            <div class="flex-1 space-y-2">
              <div>
                <p class="text-sm font-semibold text-slate-800">{ex.name}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">{ex.subtitle}</p>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed">{ex.description}</p>
              <div class="flex flex-wrap gap-1.5 pt-0.5">
                {#each ex.tags as tag}
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full {tagColors[tag] ?? 'bg-slate-100 text-slate-500'}">
                    {tag}
                  </span>
                {/each}
                <span class="text-[10px] text-slate-400 self-center ml-auto">
                  {ex.nodes.length} nodes
                </span>
              </div>
            </div>
            <button
              class="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold
                     transition-colors text-white"
              style="background-color: #204878;"
              on:mouseenter={(e) => (e.currentTarget.style.backgroundColor = '#2d5c91')}
              on:mouseleave={(e) => (e.currentTarget.style.backgroundColor = '#204878')}
              on:click={() => handleLoad(ex)}
            >
              <FolderOpen size={13} /> Load example
            </button>
          </div>
        {/each}
      </div>
    </div>

  </div>
</div>
