<script lang="ts">
  import {
    SvelteFlow,
    Background,
    Controls,
    MiniMap,
    type Connection,
    type NodeTypes,
    type EdgeTypes,
  } from '@xyflow/svelte'

  import ClientNode from './nodes/ClientNode.svelte'
  import ServerNode from './nodes/ServerNode.svelte'
  import LoadBalancerNode from './nodes/LoadBalancerNode.svelte'
  import DatabaseNode from './nodes/DatabaseNode.svelte'
  import CacheNode from './nodes/CacheNode.svelte'
  import CdnNode from './nodes/CdnNode.svelte'
  import StorageNode from './nodes/StorageNode.svelte'
  import TrafficEdge from './edges/TrafficEdge.svelte'

  import { nodes, edges, addNode, onConnect, selectedNodeId, selectedEdgeId, updateNodeData } from '../stores/graphStore'
  import { Network } from 'lucide-svelte'
  import type { NodeKind } from '../types'

  const nodeTypes: NodeTypes = {
    client: ClientNode,
    server: ServerNode,
    loadBalancer: LoadBalancerNode,
    database: DatabaseNode,
    cache: CacheNode,
    cdn: CdnNode,
    storage: StorageNode,
  }

  const edgeTypes: EdgeTypes = {
    traffic: TrafficEdge,
  }

  let flowEl: HTMLDivElement

  function getFlowPosition(screenX: number, screenY: number): { x: number; y: number } {
    if (!flowEl) return { x: screenX, y: screenY }
    const rect = flowEl.getBoundingClientRect()
    const viewport = flowEl.querySelector('.svelte-flow__viewport') as HTMLElement | null
    if (!viewport) return { x: screenX - rect.left, y: screenY - rect.top }
    const style = window.getComputedStyle(viewport)
    const matrix = new DOMMatrix(style.transform)
    const relX = screenX - rect.left
    const relY = screenY - rect.top
    return {
      x: (relX - matrix.m41) / matrix.m11,
      y: (relY - matrix.m42) / matrix.m22,
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    const kind = e.dataTransfer?.getData('nodeKind') as NodeKind | undefined
    if (!kind) return
    const subtype = e.dataTransfer?.getData('nodeSubtype')
    const pos = getFlowPosition(e.clientX, e.clientY)
    const id = addNode(kind, pos)
    if (subtype && kind === 'client') {
      updateNodeData(id, { subtype: subtype as any })
    }
  }

  function handleConnect(e: CustomEvent<Connection>) {
    onConnect(e.detail)
  }

  function handleNodeClick(e: CustomEvent) {
    const id = e.detail?.node?.id
    if (id) { selectedNodeId.set(id); selectedEdgeId.set(null) }
  }

  function handleEdgeClick(e: CustomEvent) {
    const id = e.detail?.edge?.id
    if (id) { selectedEdgeId.set(id); selectedNodeId.set(null) }
  }

  function handlePaneClick() {
    selectedNodeId.set(null)
    selectedEdgeId.set(null)
  }

  const nodeColorMap: Record<string, string> = {
    client: '#3b82f6',
    server: '#10b981',
    loadBalancer: '#8b5cf6',
    database: '#f59e0b',
    cache: '#06b6d4',
    cdn: '#f97316',
    storage: '#0ea5e9',
  }

  function miniMapColor(n: { type?: string }): string {
    return nodeColorMap[n.type ?? ''] ?? '#4b5563'
  }
</script>

<div
  bind:this={flowEl}
  class="flex-1 relative"
  on:drop={onDrop}
  on:dragover|preventDefault
>
  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    {edgeTypes}
    fitView
    on:connect={handleConnect}
    on:nodeclick={handleNodeClick}
    on:edgeclick={handleEdgeClick}
    on:paneclick={handlePaneClick}
    deleteKey="Delete"
    defaultEdgeOptions={{ type: 'traffic', data: { currentRPS: 0, intensity: 0, active: false } }}
  >
    <Background
      variant="dots"
      gap={24}
      size={1}
      color="#d1d5db"
    />
    <Controls position="bottom-right" />
    <MiniMap
      position="bottom-left"
      nodeColor={miniMapColor}
    />
  </SvelteFlow>

  <!-- Empty state hint -->
  {#if $nodes.length === 0}
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="text-center">
        <div class="text-slate-300 mb-2"><Network size={32} /></div>
        <p class="text-sm text-slate-400">Drag components from the sidebar</p>
      </div>
    </div>
  {/if}
</div>
