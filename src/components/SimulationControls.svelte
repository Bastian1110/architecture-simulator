<script lang="ts">
  import { simStatus, simSpeed, latestMetrics, startSim, pauseSim, resetSim } from '../stores/simStore'
  import { resetGraphMetrics } from '../stores/graphStore'
  import { mermaidModalOpen, mermaidExportOpen } from '../stores/uiStore'
  import { FileCode2, Share2 } from 'lucide-svelte'

  const speeds = [0.5, 1, 2, 5, 10]

  function handleReset() {
    resetSim()
    resetGraphMetrics()
  }

  $: isIdle = $simStatus === 'idle'
  $: isRunning = $simStatus === 'running'
  $: isPaused = $simStatus === 'paused'

  function setSpeed(e: Event) {
    simSpeed.set(parseFloat((e.target as HTMLSelectElement).value))
  }
</script>

<header class="flex items-center gap-3 px-3 py-2 bg-white border-b border-slate-200 shrink-0">
  <!-- Brand icon -->
  <img src="/icon.png" alt="Architecture" class="h-7 w-7 select-none shrink-0" />

  <div class="w-px h-4 bg-slate-200 mx-0.5"></div>

  <!-- Sim controls -->
  <div class="flex items-center gap-1.5">
    {#if !isRunning}
      <button
        class="px-3 py-1.5 rounded-md text-white text-xs font-medium transition-colors"
        style="background-color: #204878;"
        on:mouseenter={(e) => (e.currentTarget.style.backgroundColor = '#2d5c91')}
        on:mouseleave={(e) => (e.currentTarget.style.backgroundColor = '#204878')}
        on:click={isIdle || isPaused ? startSim : undefined}
      >
        {isPaused ? 'Resume Simulation' : 'Start Simulation'}
      </button>
    {:else}
      <button
        class="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
        on:click={pauseSim}
      >
        Pause
      </button>
    {/if}

    {#if !isIdle}
      <button
        class="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
        on:click={handleReset}
      >
        Reset
      </button>
    {/if}
  </div>

  <!-- Speed -->
  <div class="flex items-center gap-1.5">
    <span class="text-xs text-slate-400">Speed</span>
    <select
      class="text-xs bg-transparent border border-slate-200 rounded-md px-2 py-1 text-slate-600 focus:outline-none cursor-pointer"
      value={$simSpeed}
      on:change={setSpeed}
    >
      {#each speeds as s}
        <option value={s}>{s}×</option>
      {/each}
    </select>
  </div>

  <!-- Live metrics -->
  {#if !isIdle}
    <div class="flex items-center gap-4 ml-2">
      <span class="text-xs text-slate-500">
        <span class="font-mono font-medium text-slate-800">{$latestMetrics.globalRPS}</span> rps
      </span>
      <span class="text-xs text-slate-500">
        <span class="font-mono font-medium text-slate-800">{$latestMetrics.avgLatencyMs}</span> ms
      </span>
      {#if $latestMetrics.errorRate > 0}
        <span class="text-xs {$latestMetrics.errorRate > 0.05 ? 'text-red-500' : 'text-slate-500'}">
          <span class="font-mono font-medium">{($latestMetrics.errorRate * 100).toFixed(1)}</span>% err
        </span>
      {/if}
    </div>
  {/if}

  <!-- Import / Export -->
  <div class="ml-auto flex items-center gap-1">
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs transition-colors"
      on:click={() => mermaidModalOpen.set(true)}
    >
      <FileCode2 size={13} />
      Import
    </button>
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs transition-colors"
      on:click={() => mermaidExportOpen.set(true)}
    >
      <Share2 size={13} />
      Export
    </button>
  </div>
</header>
