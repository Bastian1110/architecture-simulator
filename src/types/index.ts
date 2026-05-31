import type { Node, Edge } from '@xyflow/svelte'

export type NodeKind = 'client' | 'loadBalancer' | 'server' | 'database' | 'cache' | 'cdn'
export type NodeStatus = 'idle' | 'active' | 'stressed' | 'overloaded'
export type LBAlgorithm = 'roundRobin' | 'leastConnections' | 'random'

export interface ClientParams {
  kind: 'client'
  label: string
  subtype: 'browser' | 'mobile'
  rps: number
}

export interface LoadBalancerParams {
  kind: 'loadBalancer'
  label: string
  algorithm: LBAlgorithm
  maxRPS: number
}

export interface ServerParams {
  kind: 'server'
  label: string
  cpuCores: number
  processingTimeMs: number
  errorRate: number
}

export interface DatabaseParams {
  kind: 'database'
  label: string
  dbType: 'sql' | 'nosql'
  queryTimeMs: number
  maxConnections: number
  errorRate: number
}

export interface CacheParams {
  kind: 'cache'
  label: string
  hitRate: number
  lookupTimeMs: number
}

export interface CdnParams {
  kind: 'cdn'
  label: string
  hitRate: number
  edgeLatencyMs: number
}

export type NodeParams =
  | ClientParams
  | LoadBalancerParams
  | ServerParams
  | DatabaseParams
  | CacheParams
  | CdnParams

export type AppNode = Node<NodeParams, NodeKind>

export interface TrafficEdgeData {
  currentRPS: number
  intensity: number  // 0–1
  active: boolean
}

export type AppEdge = Edge<TrafficEdgeData>

export interface NodeMetrics {
  rps: number
  avgLatencyMs: number
  errorRate: number
  status: NodeStatus
}

export interface TimeSeriesPoint {
  tick: number
  globalRPS: number
  avgLatencyMs: number
  errorRate: number
}

export const DEFAULT_NODE_DATA: Record<NodeKind, NodeParams> = {
  client: {
    kind: 'client',
    label: 'Client',
    subtype: 'browser',
    rps: 10,
  },
  loadBalancer: {
    kind: 'loadBalancer',
    label: 'Load Balancer',
    algorithm: 'roundRobin',
    maxRPS: 5000,
  },
  server: {
    kind: 'server',
    label: 'Server',
    cpuCores: 2,
    processingTimeMs: 50,
    errorRate: 0.01,
  },
  database: {
    kind: 'database',
    label: 'Database',
    dbType: 'sql',
    queryTimeMs: 20,
    maxConnections: 20,
    errorRate: 0.005,
  },
  cache: {
    kind: 'cache',
    label: 'Cache',
    hitRate: 0.8,
    lookupTimeMs: 2,
  },
  cdn: {
    kind: 'cdn',
    label: 'CDN',
    hitRate: 0.9,
    edgeLatencyMs: 5,
  },
}
