import type { AppNode, AppEdge } from '../types'

const KEY = 'archi-sim:designs'

export interface SavedDesign {
  id: string
  name: string
  savedAt: string
  nodeCount: number
  nodes: Pick<AppNode, 'id' | 'type' | 'position' | 'data'>[]
  edges: Pick<AppEdge, 'id' | 'source' | 'target' | 'type' | 'data' | 'animated'>[]
}

export function listDesigns(): SavedDesign[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveDesign(name: string, nodes: AppNode[], edges: AppEdge[]): SavedDesign {
  const design: SavedDesign = {
    id: `design-${Date.now()}`,
    name: name.trim() || `Design ${new Date().toLocaleDateString()}`,
    savedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
    edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, data: e.data, animated: e.animated ?? false })),
  }
  localStorage.setItem(KEY, JSON.stringify([design, ...listDesigns()]))
  return design
}

export function deleteDesign(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(listDesigns().filter(d => d.id !== id)))
}

export function toGraphData(design: SavedDesign): { nodes: AppNode[]; edges: AppEdge[] } {
  return {
    nodes: design.nodes as AppNode[],
    edges: design.edges as AppEdge[],
  }
}
