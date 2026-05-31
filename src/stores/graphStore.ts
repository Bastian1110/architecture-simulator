import { writable } from 'svelte/store'
import { addEdge as xyAddEdge } from '@xyflow/svelte'
import type { Connection } from '@xyflow/svelte'
import type { AppNode, AppEdge, NodeKind, NodeParams } from '../types'
import { DEFAULT_NODE_DATA } from '../types'

export const nodes = writable<AppNode[]>([])
export const edges = writable<AppEdge[]>([])
export const selectedNodeId = writable<string | null>(null)

let nodeCounter = 0

export function addNode(kind: NodeKind, position: { x: number; y: number }) {
  const id = `${kind}-${++nodeCounter}`
  const data: NodeParams = {
    ...DEFAULT_NODE_DATA[kind],
    label: `${DEFAULT_NODE_DATA[kind].label} ${nodeCounter}`,
  }
  nodes.update(ns => [
    ...ns,
    { id, type: kind, position, data },
  ])
  return id
}

export function updateNodeData(id: string, patch: Partial<NodeParams>) {
  nodes.update(ns =>
    ns.map(n => (n.id === id ? { ...n, data: { ...n.data, ...patch } as NodeParams } : n))
  )
}

export function deleteNode(id: string) {
  nodes.update(ns => ns.filter(n => n.id !== id))
  edges.update(es => es.filter(e => e.source !== id && e.target !== id))
  selectedNodeId.update(sel => (sel === id ? null : sel))
}

export function onConnect(connection: Connection) {
  edges.update(es =>
    xyAddEdge(
      {
        ...connection,
        type: 'traffic',
        data: { currentRPS: 0, intensity: 0, active: false },
        animated: false,
      },
      es
    )
  )
}

export function updateEdgeTraffic(trafficMap: Map<string, number>) {
  edges.update(es =>
    es.map(e => {
      const rps = trafficMap.get(e.id) ?? 0
      const intensity = Math.min(1, rps / 100)
      return {
        ...e,
        data: { currentRPS: rps, intensity, active: rps > 0 },
      }
    })
  )
}

export function loadGraph(newNodes: AppNode[], newEdges: AppEdge[]) {
  nodes.set(newNodes)
  edges.set(newEdges)
  selectedNodeId.set(null)
}

export function resetGraphMetrics() {
  edges.update(es =>
    es.map(e => ({ ...e, data: { currentRPS: 0, intensity: 0, active: false } }))
  )
}
