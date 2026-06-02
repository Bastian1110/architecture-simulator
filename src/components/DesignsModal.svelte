<script lang="ts">
  import { X, BookMarked, Trash2, FolderOpen, Check } from 'lucide-svelte'
  import { designsModalOpen } from '../stores/uiStore'
  import { nodes, edges, loadGraph, resetGraphMetrics } from '../stores/graphStore'
  import { resetSim } from '../stores/simStore'
  import { listDesigns, saveDesign, deleteDesign, toGraphData } from '../lib/localDesigns'
  import type { SavedDesign } from '../lib/localDesigns'

  let designs: SavedDesign[] = listDesigns()
  let saveName = ''
  let saved = false

  function refresh() { designs = listDesigns() }

  function handleSave() {
    if ($nodes.length === 0) return
    saveDesign(saveName, $nodes, $edges)
    saveName = ''
    saved = true
    setTimeout(() => { saved = false }, 2000)
    refresh()
  }

  function handleLoad(design: SavedDesign) {
    const { nodes: ns, edges: es } = toGraphData(design)
    resetSim()
    resetGraphMetrics()
    loadGraph(ns, es)
    designsModalOpen.set(false)
  }

  function handleDelete(id: string) {
    deleteDesign(id)
    refresh()
  }

  function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') designsModalOpen.set(false)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && $nodes.length > 0) handleSave()
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
  on:click|self={() => designsModalOpen.set(false)}
>
  <div class="w-[540px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">

    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div class="flex items-center gap-2.5">
        <span style="color: #204878;"><BookMarked size={18} /></span>
        <span class="font-semibold text-slate-800 text-sm">Saved designs</span>
        {#if designs.length > 0}
          <span class="text-[11px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{designs.length}</span>
        {/if}
      </div>
      <button class="text-slate-400 hover:text-slate-600 transition-colors" on:click={() => designsModalOpen.set(false)}>
        <X size={18} />
      </button>
    </div>

    <!-- Design list -->
    <div class="flex-1 overflow-y-auto">
      {#if designs.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center px-8">
          <BookMarked size={32} class="text-slate-200 mb-3" />
          <p class="text-sm text-slate-400 font-medium">No saved designs yet</p>
          <p class="text-xs text-slate-400 mt-1">Build an architecture below and save it — you can come back to it any time.</p>
        </div>
      {:else}
        <ul class="divide-y divide-slate-100">
          {#each designs as design (design.id)}
            <li class="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors group">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">{design.name}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  {formatDate(design.savedAt)} · {design.nodeCount} node{design.nodeCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                         text-slate-600 hover:bg-slate-200"
                  on:click={() => handleLoad(design)}
                >
                  <FolderOpen size={13} /> Load
                </button>
                <button
                  class="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  title="Delete"
                  on:click={() => handleDelete(design.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Save footer -->
    <div class="border-t border-slate-100 px-6 py-4 bg-slate-50/60 space-y-3">
      <p class="text-xs text-slate-500 font-medium">Save current design</p>
      <div class="flex gap-2">
        <input
          class="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800
                 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
          placeholder="e.g. Basic web app with Redis cache"
          bind:value={saveName}
        />
        <button
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                 {$nodes.length > 0 ? 'text-white shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}"
          style={$nodes.length > 0 ? 'background-color: #204878;' : ''}
          disabled={$nodes.length === 0}
          on:click={handleSave}
        >
          {#if saved}
            <Check size={14} /> Saved
          {:else}
            Save
          {/if}
        </button>
      </div>
      {#if $nodes.length === 0}
        <p class="text-[11px] text-slate-400">Add nodes to the canvas before saving.</p>
      {:else}
        <p class="text-[11px] text-slate-400">{$nodes.length} node{$nodes.length !== 1 ? 's' : ''} · Cmd+Enter to save</p>
      {/if}
    </div>

  </div>
</div>
