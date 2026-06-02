import type { Node, Edge } from '@xyflow/svelte'

export type NodeKind = 'client' | 'loadBalancer' | 'server' | 'database' | 'cache' | 'cdn' | 'storage' | 'orchestrator'
export type NodeStatus = 'idle' | 'active' | 'stressed' | 'overloaded'
export type LBAlgorithm = 'roundRobin' | 'leastConnections' | 'random'
export type Protocol = 'http' | 'websocket' | 'grpc' | 'tcp'
export type OrchType = 'kubernetes' | 'ecs' | 'swarm' | 'nomad'
export type TrafficPattern = 'constant' | 'ramp' | 'spike' | 'sine'

export interface MiddlewareStep {
  id: string
  name: string
  latencyMs: number
}

export interface ClientParams {
  kind: 'client'
  label: string
  subtype: 'browser' | 'mobile'
  rps: number
  trafficPattern: TrafficPattern
  rampDurationTicks: number
  spikeFactor: number
  spikeDurationTicks: number
  spikeIntervalTicks: number
  sineAmplitude: number
  sinePeriodTicks: number
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
  middleware: MiddlewareStep[]
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

export interface StorageParams {
  kind: 'storage'
  label: string
  storageType: 's3' | 'gcs' | 'blob' | 'minio'
  readLatencyMs: number
  writeLatencyMs: number
  errorRate: number
}

export interface OrchestratorParams {
  kind: 'orchestrator'
  label: string
  orchType: OrchType
  minInstances: number
  maxInstances: number
  instanceCpuCores: number
  processingTimeMs: number
  containerPerSession: number
  errorRate: number
}

export type NodeParams =
  | ClientParams
  | LoadBalancerParams
  | ServerParams
  | DatabaseParams
  | CacheParams
  | CdnParams
  | StorageParams
  | OrchestratorParams

export type AppNode = Node<NodeParams, NodeKind>

export interface TrafficEdgeData {
  currentRPS: number
  intensity: number
  active: boolean
  protocol: Protocol
  required: boolean
}

export type AppEdge = Edge<TrafficEdgeData>

export interface NodeMetrics {
  rps: number
  avgLatencyMs: number
  errorRate: number
  status: NodeStatus
  utilization: number
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
    rps: 100,
    trafficPattern: 'constant',
    rampDurationTicks: 300,
    spikeFactor: 5,
    spikeDurationTicks: 30,
    spikeIntervalTicks: 200,
    sineAmplitude: 0.5,
    sinePeriodTicks: 400,
  },
  loadBalancer: {
    kind: 'loadBalancer',
    label: 'Load Balancer',
    algorithm: 'roundRobin',
    maxRPS: 50000,
  },
  server: {
    kind: 'server',
    label: 'Server',
    cpuCores: 4,
    processingTimeMs: 50,
    errorRate: 0.01,
    middleware: [],
  },
  database: {
    kind: 'database',
    label: 'Database',
    dbType: 'sql',
    queryTimeMs: 20,
    maxConnections: 100,
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
  storage: {
    kind: 'storage',
    label: 'Object Storage',
    storageType: 's3',
    readLatencyMs: 50,
    writeLatencyMs: 80,
    errorRate: 0.001,
  },
  orchestrator: {
    kind: 'orchestrator',
    label: 'Kubernetes',
    orchType: 'kubernetes',
    minInstances: 2,
    maxInstances: 10,
    instanceCpuCores: 2,
    processingTimeMs: 50,
    containerPerSession: 0.1,
    errorRate: 0.01,
  },
}
