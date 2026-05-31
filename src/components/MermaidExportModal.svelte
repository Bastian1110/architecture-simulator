<script lang="ts">
  import { X, FileCode2, Copy, Check } from 'lucide-svelte'
  import { mermaidExportOpen } from '../stores/uiStore'
  import { nodes, edges } from '../stores/graphStore'
  import { graphToMermaid } from '../lib/mermaidExporter'

  $: mermaid = graphToMermaid($nodes, $edges)

  let copied = false

  async function handleCopy() {
    await navigator.clipboard.writeText(mermaid)
    copied = true
    setTimeout(() => { copied = false }, 2000)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') mermaidExportOpen.set(false)
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
  on:click|self={() => mermaidExportOpen.set(false)}
>
  <div class="w-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">

    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div class="flex items-center gap-2.5">
        <span style="color: #204878;"><FileCode2 size={18} /></span>
        <span class="font-semibold text-slate-800 text-sm">Export as Mermaid</span>
      </div>
      <button
        class="text-slate-400 hover:text-slate-600 transition-colors"
        on:click={() => mermaidExportOpen.set(false)}
      >
        <X size={18} />
      </button>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-3">
      <p class="text-xs text-slate-500">
        Paste this into any tool that supports Mermaid diagrams, or re-import it via "Import diagram".
      </p>
      <textarea
        class="w-full h-64 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono
               text-slate-800 focus:outline-none resize-none leading-relaxed"
        readonly
        value={mermaid}
      ></textarea>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <button
        class="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors font-medium"
        on:click={() => mermaidExportOpen.set(false)}
      >
        Close
      </button>
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors text-white shadow-sm"
        style="background-color: #204878;"
        on:mouseenter={(e) => (e.currentTarget.style.backgroundColor = '#2d5c91')}
        on:mouseleave={(e) => (e.currentTarget.style.backgroundColor = '#204878')}
        on:click={handleCopy}
      >
        {#if copied}
          <Check size={14} /> Copied
        {:else}
          <Copy size={14} /> Copy
        {/if}
      </button>
    </div>

  </div>
</div>
