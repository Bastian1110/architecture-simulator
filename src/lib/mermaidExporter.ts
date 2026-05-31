import type { AppNode, AppEdge, NodeKind } from '../types'

function sanitizeId(id: string): string {
  return id.replace(/-/g, '_')
}

function nodeToShape(kind: NodeKind, label: string): string {
  const l = label.replace(/[[\](){}]/g, '')
  switch (kind) {
    case 'client':       return `((${l}))`
    case 'loadBalancer': return `{${l}}`
    case 'database':     return `[(${l})]`
    case 'cache':        return `([${l}])`
    case 'storage':      return `[[${l}]]`
    case 'cdn':          return `(${l})`
    case 'server':       return `[${l}]`
  }
}

function edgeArrow(protocol: string, required: boolean): string {
  if (required && protocol !== 'http') return `-. ${protocol} .->`
  if (required) return `-.->`
  if (protocol !== 'http') return `-- ${protocol} -->`
  return `-->`
}

export function graphToMermaid(nodes: AppNode[], edges: AppEdge[]): string {
  const lines: string[] = ['graph LR']

  for (const node of nodes) {
    const id = sanitizeId(node.id)
    const shape = nodeToShape(node.data.kind, node.data.label)
    lines.push(`  ${id}${shape}`)
  }

  lines.push('')

  for (const edge of edges) {
    const src = sanitizeId(edge.source)
    const tgt = sanitizeId(edge.target)
    const protocol = edge.data?.protocol ?? 'http'
    const required = edge.data?.required ?? false
    const arrow = edgeArrow(protocol, required)
    lines.push(`  ${src} ${arrow} ${tgt}`)
  }

  return lines.join('\n')
}
