import type { AppNode, AppEdge, NodeKind, NodeParams } from '../types'

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
    case 'orchestrator': return `{{${l}}}`
  }
}

function nodeToParams(data: NodeParams): string {
  switch (data.kind) {
    case 'client': {
      let p = `rps=${data.rps} subtype=${data.subtype} trafficPattern=${data.trafficPattern ?? 'constant'}`
      if ((data.trafficPattern ?? 'constant') === 'ramp') p += ` rampDurationTicks=${data.rampDurationTicks}`
      if ((data.trafficPattern ?? 'constant') === 'spike') p += ` spikeFactor=${data.spikeFactor} spikeDurationTicks=${data.spikeDurationTicks} spikeIntervalTicks=${data.spikeIntervalTicks}`
      if ((data.trafficPattern ?? 'constant') === 'sine') p += ` sineAmplitude=${data.sineAmplitude} sinePeriodTicks=${data.sinePeriodTicks}`
      return p
    }
    case 'loadBalancer':
      return `algorithm=${data.algorithm} maxRPS=${data.maxRPS}`
    case 'server':
      return `cpuCores=${data.cpuCores} processingTimeMs=${data.processingTimeMs} errorRate=${data.errorRate}`
    case 'database':
      return `dbType=${data.dbType} queryTimeMs=${data.queryTimeMs} maxConnections=${data.maxConnections} errorRate=${data.errorRate}`
    case 'cache':
      return `hitRate=${data.hitRate} lookupTimeMs=${data.lookupTimeMs}`
    case 'cdn':
      return `hitRate=${data.hitRate} edgeLatencyMs=${data.edgeLatencyMs}`
    case 'storage':
      return `storageType=${data.storageType} readLatencyMs=${data.readLatencyMs} writeLatencyMs=${data.writeLatencyMs} errorRate=${data.errorRate}`
    case 'orchestrator':
      return `orchType=${data.orchType} minInstances=${data.minInstances} maxInstances=${data.maxInstances} instanceCpuCores=${data.instanceCpuCores} processingTimeMs=${data.processingTimeMs} containerPerSession=${data.containerPerSession} errorRate=${data.errorRate}`
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
    const params = nodeToParams(node.data)
    lines.push(`  ${id}${shape}`)
    lines.push(`  %% @params ${id} ${params}`)
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
