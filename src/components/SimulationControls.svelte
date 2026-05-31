<script lang="ts">
  import { simStatus, simSpeed, simTick, latestMetrics, startSim, pauseSim, resetSim } from '../stores/simStore'
  import { resetGraphMetrics } from '../stores/graphStore'
  import { mermaidModalOpen } from '../stores/uiStore'
  import { Network, FileCode2 } from 'lucide-svelte'

  const speeds = [0.5, 1, 2, 5, 10]

  function handleReset() {
    resetSim()
    resetGraphMetrics()
  }

  $: isIdle = $simStatus === 'idle'
  $: isRunning = $simStatus === 'running'
  $: isPaused = $simStatus === 'paused'
</script>

<header class="flex items-center gap-4 px-4 py-2 bg-white border-b border-slate-200 shrink-0 z-10 shadow-sm">
  <!-- Brand -->
  <div class="flex items-center gap-2 mr-2">
    <span class="text-indigo-500"><Network size={16} /></span>
    <span class="font-bold text-slate-800 text-sm tracking-tight">ArchiSim</span>
  </div>

  <!-- Sim controls -->
  <div class="flex items-center gap-2">
    {#if !isRunning}
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400
               text-white text-xs font-semibold transition-colors shadow-sm"
        on:click={isIdle || isPaused ? startSim : undefined}
      >
        <span>▶</span> {isPaused ? 'Resume' : 'Start'}
      </button>
    {:else}
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400
               text-white text-xs font-semibold transition-colors shadow-sm"
        on:click={pauseSim}
      >
        <span>⏸</span> Pause
      </button>
    {/if}

    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300
             text-slate-700 text-xs font-semibold transition-colors"
      on:click={handleReset}
    >
      <span>⏹</span> Reset
    </button>
  </div>

  <!-- Mermaid import -->
  <button
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200
           text-slate-600 hover:text-slate-800 text-xs font-medium transition-colors border border-slate-200"
    on:click={() => mermaidModalOpen.set(true)}
  >
    <FileCode2 size={13} />
    From Mermaid
  </button>

  <!-- Speed -->
  <div class="flex items-center gap-1.5 ml-1">
    <span class="text-xs text-slate-500">Speed</span>
    <div class="flex gap-0.5">
      {#each speeds as s}
        <button
          class="px-2 py-1 rounded text-xs font-mono transition-colors
                 {$simSpeed === s
                   ? 'bg-indigo-500 text-white shadow-sm'
                   : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'}"
          on:click={() => simSpeed.set(s)}
        >
          {s}×
        </button>
      {/each}
    </div>
  </div>

  <!-- Divider -->
  <div class="w-px h-5 bg-slate-200 mx-1"></div>

  <!-- Live metrics -->
  <div class="flex items-center gap-4 text-xs">
    <div class="flex items-center gap-1.5">
      <span class="text-slate-400">RPS</span>
      <span class="font-mono text-emerald-600 font-semibold w-12 text-right">
        {$latestMetrics.globalRPS}
      </span>
    </div>
    <div class="flex items-center gap-1.5">
      <span class="text-slate-400">Latency</span>
      <span class="font-mono text-indigo-600 font-semibold w-16 text-right">
        {$latestMetrics.avgLatencyMs}ms
      </span>
    </div>
    <div class="flex items-center gap-1.5">
      <span class="text-slate-400">Errors</span>
      <span class="font-mono w-12 text-right
                   {$latestMetrics.errorRate > 0.05 ? 'text-red-500 font-semibold' : 'text-slate-500'}">
        {($latestMetrics.errorRate * 100).toFixed(1)}%
      </span>
    </div>
  </div>

  <!-- Tick counter -->
  {#if !isIdle}
    <div class="ml-auto flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full {isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
      <span class="text-xs text-slate-400 font-mono">tick {$simTick}</span>
    </div>
  {/if}
</header>
