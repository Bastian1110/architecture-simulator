<script lang="ts">
  import { X, Github } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  function dismiss() {
    localStorage.setItem('architecture-welcomed', '1')
    dispatch('dismiss')
  }

  const steps = [
    { icon: '⬅', text: 'Drag components from the left sidebar onto the canvas' },
    { icon: '→', text: 'Connect nodes by dragging from a handle dot to another node' },
    { icon: '✦', text: 'Click a node to edit its parameters in the right panel' },
    { icon: '↔', text: 'Click a connection to set its protocol (WS, gRPC, TCP) or mark it as a required call' },
    { icon: '▶', text: 'Press Start to simulate traffic flow and watch live metrics' },
  ]
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
  on:click|self={dismiss}
>
  <div class="w-[520px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">

    <!-- Header -->
    <div class="flex items-start justify-between px-6 pt-6 pb-4">
      <div class="flex items-center gap-3">
        <img src="/icon.png" alt="" class="h-10 w-10" />
        <div>
          <h1 class="text-lg font-semibold text-slate-800 leading-tight">Architecture</h1>
          <p class="text-xs text-slate-400 mt-0.5">Browser-based infrastructure simulator</p>
        </div>
      </div>
      <button
        class="text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
        on:click={dismiss}
      >
        <X size={18} />
      </button>
    </div>

    <!-- Steps -->
    <div class="px-6 pb-4 space-y-2.5">
      {#each steps as step}
        <div class="flex items-start gap-3">
          <span class="text-slate-300 text-sm w-4 shrink-0 mt-0.5">{step.icon}</span>
          <span class="text-sm text-slate-600">{step.text}</span>
        </div>
      {/each}
    </div>

    <!-- Divider + attribution -->
    <div class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
      <p class="text-[11px] text-slate-400">
        Vibe-coded by
        <a
          href="https://github.com/Bastian1110"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium hover:underline"
          style="color: #204878;"
        >Sebastian Mora @Bastian1110</a>
      </p>
      <button
        class="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
        style="background-color: #204878;"
        on:mouseenter={(e) => (e.currentTarget.style.backgroundColor = '#2d5c91')}
        on:mouseleave={(e) => (e.currentTarget.style.backgroundColor = '#204878')}
        on:click={dismiss}
      >
        Get started
      </button>
    </div>

  </div>
</div>
