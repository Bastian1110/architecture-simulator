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
  import WelcomeModal from './components/WelcomeModal.svelte'
  import { mermaidModalOpen, mermaidExportOpen } from './stores/uiStore'

  import { nodes, edges, updateEdgeTraffic, addNode, updateNodeData } from './stores/graphStore'
  import type { NodeKind } from './types'
  import {
    simStatus,
    simSpeed,
    requestAccumulators,
    roundRobinCounters,
    applyTickResult,
  } from './stores/simStore'
  import { runTick } from './simulation/engine'

  let showWelcome = !localStorage.getItem('architecture-welcomed')

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

  $: {
    const status = $simStatus
    const _speed = $simSpeed
    if (status === 'running') {
      startLoop()
    } else {
      stopLoop()
    }
  }

  onDestroy(stopLoop)

  const shortcuts: Record<string, { kind: NodeKind; subtype?: string }> = {
    b: { kind: 'client' },
    m: { kind: 'client', subtype: 'mobile' },
    s: { kind: 'server' },
    l: { kind: 'loadBalancer' },
    d: { kind: 'database' },
    c: { kind: 'cache' },
    n: { kind: 'cdn' },
    o: { kind: 'storage' },
    k: { kind: 'orchestrator' },
  }

  function handleKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if ((e.target as HTMLElement).isContentEditable) return
    if (e.metaKey || e.ctrlKey || e.altKey) return

    const sc = shortcuts[e.key.toLowerCase()]
    if (!sc) return

    e.preventDefault()
    // Place near viewport center with slight jitter so stacked nodes are offset
    const pos = { x: 220 + Math.random() * 160, y: 120 + Math.random() * 120 }
    const id = addNode(sc.kind, pos)
    if (sc.subtype) updateNodeData(id, { subtype: sc.subtype as any })
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showWelcome}
  <WelcomeModal on:dismiss={() => { showWelcome = false }} />
{/if}
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
