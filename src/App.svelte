<script lang="ts">
  import { onDestroy } from 'svelte'
  import { get } from 'svelte/store'

  import SimulationControls from './components/SimulationControls.svelte'
  import Toolbar from './components/Toolbar.svelte'
  import Canvas from './components/Canvas.svelte'
  import PropertiesPanel from './components/PropertiesPanel.svelte'
  import MetricsPanel from './components/MetricsPanel.svelte'
  import MermaidImportModal from './components/MermaidImportModal.svelte'
  import MermaidExportModal from './components/MermaidExportModal.svelte'
  import { mermaidModalOpen, mermaidExportOpen } from './stores/uiStore'

  import { nodes, edges, updateEdgeTraffic } from './stores/graphStore'
  import {
    simStatus,
    simSpeed,
    requestAccumulators,
    roundRobinCounters,
    applyTickResult,
  } from './stores/simStore'
  import { runTick } from './simulation/engine'

  let intervalId: ReturnType<typeof setInterval> | null = null

  function tick() {
    const currentNodes = get(nodes)
    const currentEdges = get(edges)
    const accumulators = get(requestAccumulators)
    const counters = get(roundRobinCounters)

    if (currentNodes.length === 0) return

    const result = runTick(currentNodes, currentEdges, 100, accumulators, counters)
    applyTickResult(result)
    updateEdgeTraffic(result.edgeTraffic)
  }

  function startLoop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    const speed = get(simSpeed)
    intervalId = setInterval(tick, Math.max(16, 100 / speed))
  }

  function stopLoop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // React to status + speed changes
  $: {
    const status = $simStatus
    const _speed = $simSpeed  // track speed changes too
    if (status === 'running') {
      startLoop()
    } else {
      stopLoop()
    }
  }

  onDestroy(stopLoop)
</script>

{#if $mermaidModalOpen}
  <MermaidImportModal />
{/if}
{#if $mermaidExportOpen}
  <MermaidExportModal />
{/if}

<div class="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden">
  <SimulationControls />

  <div class="flex flex-1 overflow-hidden">
    <Toolbar />

    <div class="flex flex-col flex-1 overflow-hidden">
      <div class="flex flex-1 overflow-hidden">
        <Canvas />
        <PropertiesPanel />
      </div>
      <MetricsPanel />
    </div>
  </div>
</div>
