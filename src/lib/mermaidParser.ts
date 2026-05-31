import type { AppNode, AppEdge, NodeKind, NodeParams, Protocol } from '../types'
import { DEFAULT_NODE_DATA } from '../types'

type Shape = 'rect' | 'round' | 'cylinder' | 'stadium' | 'circle' | 'diamond' | 'subroutine'

interface ParsedNode {
  id: string
  label: string
  shape: Shape
}

interface ParsedEdge {
  source: string
  target: string
  protocol: Protocol
  required: boolean
}

interface ParseResult {
  nodes: ParsedNode[]
  edges: ParsedEdge[]
  error?: string
}

function clean(s: string): string {
  return s.replace(/^["'\s]+|["'\s]+$/g, '').trim()
}

function parseNodeToken(token: string): ParsedNode | null {
  const t = token.trim()
  if (!t) return null
  let m: RegExpMatchArray | null

  // [[label]] — subroutine → storage
  m = t.match(/^([\w][\w-]*)\[\[(.+?)\]\]$/)
  if (m) return { id: m[1], label: clean(m[2]), shape: 'subroutine' }

  // [(label)] — cylinder → database
  m = t.match(/^([\w][\w-]*)\[\((.+?)\)\]$/)
  if (m) return { id: m[1], label: clean(m[2]), shape: 'cylinder' }

  // ([label]) — stadium → cache
  m = t.match(/^([\w][\w-]*)\(\[(.+?)\]\)$/)
  if (m) return { id: m[1], label: clean(m[2]), shape: 'stadium' }

  // ((label)) — circle → client
  m = t.match(/^([\w][\w-]*)\(\((.+?)\)\)$/)
  if (m) return { id: m[1], label: clean(m[2]), shape: 'circle' }

  // [label] — rectangle → server
  m = t.match(/^([\w][\w-]*)\[(.+?)\]$/)
  if (m) return { id: m[1], label: clean(m[2]), shape: 'rect' }

  // (label) — rounded → service/cdn
  m = t.match(/^([\w][\w-]*)\((.+?)\)$/)
  if (m) return { id: m[1], label: clean(m[2]), shape: 'round' }

  // {label} — diamond → load balancer
  m = t.match(/^([\w][\w-]*)\{(.+?)\}$/)
  if (m) return { id: m[1], label: clean(m[2]), shape: 'diamond' }

  // bare id
  m = t.match(/^([\w][\w-]*)$/)
  if (m) return { id: m[1], label: m[1], shape: 'rect' }

  return null
}

function inferKind(node: ParsedNode): NodeKind {
  const text = (node.id + ' ' + node.label).toLowerCase()

  if (/client|browser|user|mobile|frontend/.test(text)) return 'client'
  if (/\blb\b|load.?bal|balancer/.test(text)) return 'loadBalancer'
  if (/cache|redis|memcach/.test(text)) return 'cache'
  if (/cdn|cloudfront|edge.?server|static/.test(text)) return 'cdn'
  if (/storage|s3|gcs|blob|minio|object.?stor/.test(text)) return 'storage'
  if (/\bdb\b|database|sql|postgres|mysql|mongo|dynamo|cassandra/.test(text)) return 'database'
  if (/server|api|service|backend|worker|pod|node|app|auth/.test(text)) return 'server'

  if (node.shape === 'subroutine') return 'storage'
  if (node.shape === 'cylinder') return 'database'
  if (node.shape === 'diamond') return 'loadBalancer'
  if (node.shape === 'circle') return 'client'
  if (node.shape === 'stadium') return 'cache'

  return 'server'
}

function inferProtocol(label: string): Protocol {
  const l = label.toLowerCase()
  if (/\bws\b|websocket/.test(l)) return 'websocket'
  if (/\bgrpc\b/.test(l)) return 'grpc'
  if (/\btcp\b/.test(l)) return 'tcp'
  return 'http'
}

export function parseMermaid(input: string): ParseResult {
  const lines = input
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('%%'))

  if (lines.length === 0) return { nodes: [], edges: [], error: 'Empty input.' }

  if (!/^(graph|flowchart)\b/i.test(lines[0])) {
    return { nodes: [], edges: [], error: 'Diagram must start with "graph" or "flowchart".' }
  }

  const nodeMap = new Map<string, ParsedNode>()
  const edges: ParsedEdge[] = []

  function register(n: ParsedNode) {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, n)
  }

  for (const raw of lines.slice(1)) {
    if (/^(subgraph\b|end\b|style\s|classDef\s|class\s|linkStyle\s|click\s)/.test(raw)) continue

    // Extract edge labels before stripping
    const edgeLabelMatch = raw.match(/\|([^|]*)\|/)
    const edgeLabel = edgeLabelMatch ? edgeLabelMatch[1] : ''

    // Detect dotted arrow (required dependency)
    const isDotted = /-.->|===>/.test(raw)

    // Detect arrow type for protocol
    let protocol: Protocol = edgeLabel ? inferProtocol(edgeLabel) : 'http'

    // Strip edge labels and normalize arrows
    let line = raw
      .replace(/\|[^|]*\|/g, '')
      .replace(/--[^->{}\[\]()]+-->/g, '-->')
      .replace(/--[^->{}\[\]()]+---/g, '---')
      .replace(/-\.->/g, '-->')
      .replace(/===>/g, '-->')

    const hasArrow = /-->|---/.test(line)

    if (!hasArrow) {
      const n = parseNodeToken(line)
      if (n) register(n)
      continue
    }

    const parts = line.split(/\s*(?:-->|---)\s*/)
    if (parts.length < 2) continue

    const groups: string[][] = []
    for (const part of parts) {
      const tokens = part.split(/\s*&\s*/).map(t => t.trim()).filter(Boolean)
      const ids: string[] = []
      for (const tok of tokens) {
        const n = parseNodeToken(tok)
        if (n) { register(n); ids.push(n.id) }
      }
      if (ids.length > 0) groups.push(ids)
    }

    for (let i = 0; i < groups.length - 1; i++) {
      for (const src of groups[i]) {
        for (const tgt of groups[i + 1]) {
          if (src !== tgt && !edges.find(e => e.source === src && e.target === tgt)) {
            edges.push({ source: src, target: tgt, protocol, required: isDotted })
          }
        }
      }
    }
  }

  if (nodeMap.size === 0) {
    return { nodes: [], edges: [], error: 'No nodes found. Check your syntax.' }
  }

  return { nodes: Array.from(nodeMap.values()), edges }
}

function layoutNodes(
  parsedNodes: ParsedNode[],
  parsedEdges: ParsedEdge[],
): Map<string, { x: number; y: number }> {
  const outgoing = new Map<string, string[]>()
  const inCount = new Map<string, number>()

  for (const n of parsedNodes) {
    outgoing.set(n.id, [])
    inCount.set(n.id, 0)
  }
  for (const e of parsedEdges) {
    if (outgoing.has(e.source) && outgoing.has(e.target)) {
      outgoing.get(e.source)!.push(e.target)
      inCount.set(e.target, (inCount.get(e.target) ?? 0) + 1)
    }
  }

  const levels = new Map<string, number>()
  const sources = parsedNodes.filter(n => (inCount.get(n.id) ?? 0) === 0)
  const queue = (sources.length > 0 ? sources : [parsedNodes[0]]).map(n => n.id)
  queue.forEach(id => levels.set(id, 0))

  let head = 0
  while (head < queue.length) {
    const id = queue[head++]
    const level = levels.get(id)!
    for (const next of outgoing.get(id) ?? []) {
      if (!levels.has(next)) {
        levels.set(next, level + 1)
        queue.push(next)
      }
    }
  }

  let maxLevel = Math.max(0, ...Array.from(levels.values()))
  for (const n of parsedNodes) {
    if (!levels.has(n.id)) levels.set(n.id, ++maxLevel)
  }

  const byLevel = new Map<number, string[]>()
  for (const [id, level] of levels) {
    if (!byLevel.has(level)) byLevel.set(level, [])
    byLevel.get(level)!.push(id)
  }

  const COL_W = 240
  const ROW_H = 140
  const positions = new Map<string, { x: number; y: number }>()

  for (const [level, ids] of byLevel) {
    const totalH = (ids.length - 1) * ROW_H
    ids.forEach((id, i) => {
      positions.set(id, { x: level * COL_W + 60, y: i * ROW_H - totalH / 2 + 280 })
    })
  }

  return positions
}

export interface LoadGraphResult {
  nodes: AppNode[]
  edges: AppEdge[]
  error?: string
}

let importCounter = 0

export function mermaidToGraph(input: string): LoadGraphResult {
  const { nodes: pNodes, edges: pEdges, error } = parseMermaid(input)
  if (error || pNodes.length === 0) {
    return { nodes: [], edges: [], error: error ?? 'No nodes found.' }
  }

  const positions = layoutNodes(pNodes, pEdges)
  const idMap = new Map<string, string>()

  const appNodes: AppNode[] = pNodes.map(n => {
    const kind = inferKind(n)
    const appId = `${kind}-${++importCounter}`
    idMap.set(n.id, appId)
    const pos = positions.get(n.id) ?? { x: 100, y: 100 }
    return {
      id: appId,
      type: kind,
      position: pos,
      data: { ...DEFAULT_NODE_DATA[kind], label: n.label } as NodeParams,
    }
  })

  const appEdges: AppEdge[] = pEdges
    .filter(e => idMap.has(e.source) && idMap.has(e.target))
    .map((e, i) => ({
      id: `edge-${importCounter}-${i}`,
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
      type: 'traffic' as const,
      data: {
        currentRPS: 0,
        intensity: 0,
        active: false,
        protocol: e.protocol,
        required: e.required,
      },
      animated: false,
    }))

  return { nodes: appNodes, edges: appEdges }
}
