import type { AppNode, AppEdge } from '../types'
import { DEFAULT_NODE_DATA } from '../types'

export interface ArchExample {
  id: string
  name: string
  subtitle: string
  description: string
  tags: string[]
  nodes: AppNode[]
  edges: AppEdge[]
}

// ─── helpers ────────────────────────────────────────────────────────────────

function n(id: string, kind: string, x: number, y: number, data: Record<string, any>): AppNode {
  const base = DEFAULT_NODE_DATA[kind as keyof typeof DEFAULT_NODE_DATA]
  return { id, type: kind as any, position: { x, y }, data: { ...base, ...data, kind } as any }
}

function e(id: string, src: string, tgt: string, protocol = 'http', required = false): AppEdge {
  return {
    id, source: src, target: tgt, type: 'traffic',
    data: { currentRPS: 0, intensity: 0, active: false, protocol: protocol as any, required },
    animated: false,
  }
}

// ─── 1. URL Shortener ────────────────────────────────────────────────────────

const urlShortener: ArchExample = {
  id: 'url-shortener',
  name: 'URL Shortener',
  subtitle: 'Inspired by Bit.ly / TinyURL',
  description: 'Cache-first redirect service. The Redis layer absorbs 90 %+ of reads. Push RPS past 2 000 to watch the DB connections saturate on cache misses.',
  tags: ['Cache-first', 'Read-heavy', 'SQL'],
  nodes: [
    n('u-browser', 'client',       60,  200, { label: 'Browser',        rps: 1000, subtype: 'browser' }),
    n('u-cdn',     'cdn',          300, 200, { label: 'CDN',            hitRate: 0.35, edgeLatencyMs: 12 }),
    n('u-lb',      'loadBalancer', 540, 200, { label: 'Load Balancer',  algorithm: 'roundRobin', maxRPS: 50000 }),
    n('u-api',     'server',       780, 200, { label: 'Redirect API',   cpuCores: 4, processingTimeMs: 8, errorRate: 0.002, middleware: [] }),
    n('u-cache',   'cache',        1020, 100, { label: 'Redis',          hitRate: 0.91, lookupTimeMs: 1 }),
    n('u-db',      'database',     1020, 310, { label: 'PostgreSQL',     dbType: 'sql', queryTimeMs: 6, maxConnections: 100, errorRate: 0.002 }),
    n('u-storage', 'storage',      1260, 200, { label: 'Analytics Store',storageType: 's3', readLatencyMs: 40, writeLatencyMs: 60, errorRate: 0.001 }),
  ],
  edges: [
    e('ue1', 'u-browser', 'u-cdn'),
    e('ue2', 'u-cdn',     'u-lb'),
    e('ue3', 'u-lb',      'u-api'),
    e('ue4', 'u-api',     'u-cache'),
    e('ue5', 'u-cache',   'u-db'),
    e('ue6', 'u-api',     'u-storage', 'http', true),
  ],
}

// ─── 2. Music Streaming ───────────────────────────────────────────────────────

const musicStreaming: ArchExample = {
  id: 'music-streaming',
  name: 'Music Streaming',
  subtitle: 'Inspired by audio-first streaming services',
  description: 'CDN delivers 95 %+ of audio chunks. Kill the CDN mid-run to see the origin servers collapse under full audio load. Try ramping mobile users to find the CDN breakpoint.',
  tags: ['CDN-heavy', 'Storage', 'High RPS'],
  nodes: [
    n('s-browser', 'client',       60,  120, { label: 'Desktop App',      rps: 800,  subtype: 'browser' }),
    n('s-mobile',  'client',       60,  300, { label: 'Mobile App',        rps: 1500, subtype: 'mobile' }),
    n('s-cdn',     'cdn',          300, 210, { label: 'Audio CDN',         hitRate: 0.94, edgeLatencyMs: 18 }),
    n('s-lb',      'loadBalancer', 540, 210, { label: 'Load Balancer',     algorithm: 'leastConnections', maxRPS: 50000 }),
    n('s-api',     'server',       780, 210, { label: 'Streaming API',     cpuCores: 8, processingTimeMs: 25, errorRate: 0.005, middleware: [] }),
    n('s-cache',   'cache',        1020, 120, { label: 'Redis',             hitRate: 0.82, lookupTimeMs: 2 }),
    n('s-db',      'database',     1020, 310, { label: 'Metadata DB',       dbType: 'sql', queryTimeMs: 12, maxConnections: 200, errorRate: 0.002 }),
    n('s-storage', 'storage',      1260, 210, { label: 'Audio Storage',     storageType: 's3', readLatencyMs: 45, writeLatencyMs: 80, errorRate: 0.001 }),
  ],
  edges: [
    e('se1', 's-browser', 's-cdn'),
    e('se2', 's-mobile',  's-cdn'),
    e('se3', 's-cdn',     's-lb'),
    e('se4', 's-lb',      's-api'),
    e('se5', 's-api',     's-cache'),
    e('se6', 's-cache',   's-db'),
    e('se7', 's-api',     's-storage', 'http', true),
  ],
}

// ─── 3. Real-time Chat ───────────────────────────────────────────────────────

const chatApp: ArchExample = {
  id: 'real-time-chat',
  name: 'Real-time Chat',
  subtitle: 'Inspired by large-scale messaging platforms',
  description: 'WebSocket gateway maintains millions of persistent connections. Redis handles pub/sub fan-out. Spike traffic to 10× and watch the gateway queue build before errors cascade.',
  tags: ['WebSocket', 'Pub/Sub', 'Fan-out'],
  nodes: [
    n('c-browser', 'client',       60,  120, { label: 'Web Client',        rps: 600,  subtype: 'browser' }),
    n('c-mobile',  'client',       60,  300, { label: 'Mobile Client',     rps: 1400, subtype: 'mobile',
      trafficPattern: 'spike', spikeFactor: 3, spikeDurationTicks: 40, spikeIntervalTicks: 300 }),
    n('c-lb',      'loadBalancer', 300, 210, { label: 'Load Balancer',     algorithm: 'leastConnections', maxRPS: 50000 }),
    n('c-gw',      'server',       540, 120, { label: 'WS Gateway',        cpuCores: 16, processingTimeMs: 4, errorRate: 0.001, middleware: [] }),
    n('c-msg',     'server',       540, 320, { label: 'Message Service',   cpuCores: 4,  processingTimeMs: 22, errorRate: 0.005, middleware: [] }),
    n('c-cache',   'cache',        780, 120, { label: 'Redis Pub/Sub',     hitRate: 0.65, lookupTimeMs: 1 }),
    n('c-db',      'database',     780, 320, { label: 'Message DB',        dbType: 'sql', queryTimeMs: 18, maxConnections: 200, errorRate: 0.003 }),
    n('c-storage', 'storage',      1020, 210, { label: 'Media Storage',    storageType: 's3', readLatencyMs: 55, writeLatencyMs: 90, errorRate: 0.002 }),
  ],
  edges: [
    e('ce1', 'c-browser', 'c-lb',      'websocket'),
    e('ce2', 'c-mobile',  'c-lb',      'websocket'),
    e('ce3', 'c-lb',      'c-gw',      'websocket'),
    e('ce4', 'c-lb',      'c-msg',     'http'),
    e('ce5', 'c-gw',      'c-cache',   'http', true),
    e('ce6', 'c-msg',     'c-db'),
    e('ce7', 'c-msg',     'c-storage'),
  ],
}

// ─── 4. E-commerce Platform ──────────────────────────────────────────────────

const ecommerce: ArchExample = {
  id: 'e-commerce',
  name: 'E-commerce Platform',
  subtitle: 'Inspired by large online retail backends',
  description: 'Checkout goes through an orchestrated payment service — the real bottleneck at scale. Ramp users past 500 rps and watch the payment pods max out before the API servers do.',
  tags: ['Multi-tier', 'Orchestrator', 'SQL'],
  nodes: [
    n('ec-browser',  'client',       60,  210, { label: 'Shopper',           rps: 400,  subtype: 'browser' }),
    n('ec-cdn',      'cdn',          300, 210, { label: 'Static CDN',        hitRate: 0.75, edgeLatencyMs: 10 }),
    n('ec-lb',       'loadBalancer', 540, 210, { label: 'Load Balancer',     algorithm: 'roundRobin', maxRPS: 50000 }),
    n('ec-api',      'server',       780, 210, { label: 'Product API',       cpuCores: 8,  processingTimeMs: 35, errorRate: 0.008, middleware: [] }),
    n('ec-cache',    'cache',        1020, 100, { label: 'Session Cache',    hitRate: 0.80, lookupTimeMs: 2 }),
    n('ec-db',       'database',     1020, 310, { label: 'Orders DB',        dbType: 'sql', queryTimeMs: 22, maxConnections: 150, errorRate: 0.003 }),
    n('ec-payment',  'orchestrator', 1260, 120, { label: 'Payment Service',  orchType: 'kubernetes', minInstances: 2, maxInstances: 8, instanceCpuCores: 2, processingTimeMs: 120, containerPerSession: 0.05, errorRate: 0.01 }),
    n('ec-storage',  'storage',      1260, 310, { label: 'Product Images',   storageType: 's3', readLatencyMs: 35, writeLatencyMs: 70, errorRate: 0.001 }),
  ],
  edges: [
    e('ece1', 'ec-browser',  'ec-cdn'),
    e('ece2', 'ec-cdn',      'ec-lb'),
    e('ece3', 'ec-lb',       'ec-api'),
    e('ece4', 'ec-api',      'ec-cache'),
    e('ece5', 'ec-cache',    'ec-db'),
    e('ece6', 'ec-api',      'ec-payment', 'http', true),
    e('ece7', 'ec-api',      'ec-storage'),
  ],
}

// ─── 5. Social Media Feed ────────────────────────────────────────────────────

const socialFeed: ArchExample = {
  id: 'social-feed',
  name: 'Social Media Feed',
  subtitle: 'Inspired by high-scale social timelines',
  description: 'Timeline cache keeps 88 % of feed reads off the DB. Kill the Redis node mid-run to simulate a cache failure — the DB immediately saturates. Try sine-wave traffic to mimic viral moments.',
  tags: ['Fan-out', 'Cache-critical', 'High scale'],
  nodes: [
    n('sf-browser', 'client',       60,  120, { label: 'Web Client',        rps: 1500, subtype: 'browser' }),
    n('sf-mobile',  'client',       60,  320, { label: 'Mobile Client',     rps: 3000, subtype: 'mobile',
      trafficPattern: 'sine', sineAmplitude: 0.4, sinePeriodTicks: 600 }),
    n('sf-cdn',     'cdn',          300, 210, { label: 'Media CDN',         hitRate: 0.88, edgeLatencyMs: 14 }),
    n('sf-lb',      'loadBalancer', 540, 210, { label: 'Load Balancer',     algorithm: 'leastConnections', maxRPS: 100000 }),
    n('sf-api',     'server',       780, 210, { label: 'Feed API',          cpuCores: 16, processingTimeMs: 20, errorRate: 0.003, middleware: [] }),
    n('sf-cache',   'cache',        1020, 100, { label: 'Timeline Cache',   hitRate: 0.88, lookupTimeMs: 1 }),
    n('sf-db',      'database',     1020, 320, { label: 'Posts DB',         dbType: 'sql', queryTimeMs: 25, maxConnections: 500, errorRate: 0.002 }),
    n('sf-storage', 'storage',      1260, 210, { label: 'Media Storage',    storageType: 's3', readLatencyMs: 40, writeLatencyMs: 75, errorRate: 0.001 }),
  ],
  edges: [
    e('sfe1', 'sf-browser', 'sf-cdn'),
    e('sfe2', 'sf-mobile',  'sf-cdn'),
    e('sfe3', 'sf-cdn',     'sf-lb'),
    e('sfe4', 'sf-lb',      'sf-api'),
    e('sfe5', 'sf-api',     'sf-cache'),
    e('sfe6', 'sf-cache',   'sf-db'),
    e('sfe7', 'sf-api',     'sf-storage', 'http', true),
  ],
}

// ─── 6. Ride Sharing ─────────────────────────────────────────────────────────

const rideSharing: ArchExample = {
  id: 'ride-sharing',
  name: 'Ride Sharing',
  subtitle: 'Inspired by real-time location matching platforms',
  description: 'Drivers and riders connect via WebSocket for live location updates. The matching orchestrator is the bottleneck — it runs complex geospatial queries. Ramp to 800 rps to find the pod ceiling.',
  tags: ['WebSocket', 'Real-time', 'Orchestrator'],
  nodes: [
    n('r-driver',  'client',       60,  120, { label: 'Driver App',        rps: 400,  subtype: 'mobile' }),
    n('r-rider',   'client',       60,  320, { label: 'Rider App',         rps: 300,  subtype: 'mobile' }),
    n('r-lb',      'loadBalancer', 300, 210, { label: 'Load Balancer',     algorithm: 'leastConnections', maxRPS: 50000 }),
    n('r-ws',      'server',       540, 120, { label: 'Location Gateway',  cpuCores: 8, processingTimeMs: 6, errorRate: 0.002, middleware: [] }),
    n('r-api',     'server',       540, 320, { label: 'Trip API',          cpuCores: 4, processingTimeMs: 30, errorRate: 0.005, middleware: [] }),
    n('r-cache',   'cache',        780, 120, { label: 'Location Cache',   hitRate: 0.55, lookupTimeMs: 2 }),
    n('r-match',   'orchestrator', 780, 320, { label: 'Matching Engine',  orchType: 'kubernetes', minInstances: 3, maxInstances: 12, instanceCpuCores: 4, processingTimeMs: 80, containerPerSession: 0.08, errorRate: 0.01 }),
    n('r-db',      'database',     1020, 210, { label: 'Trips DB',         dbType: 'sql', queryTimeMs: 20, maxConnections: 200, errorRate: 0.003 }),
  ],
  edges: [
    e('re1', 'r-driver', 'r-lb',    'websocket'),
    e('re2', 'r-rider',  'r-lb',    'websocket'),
    e('re3', 'r-lb',     'r-ws',    'websocket'),
    e('re4', 'r-lb',     'r-api',   'http'),
    e('re5', 'r-ws',     'r-cache', 'http', true),
    e('re6', 'r-api',    'r-match', 'grpc', true),
    e('re7', 'r-match',  'r-db'),
    e('re8', 'r-api',    'r-db'),
  ],
}

// ─── export ──────────────────────────────────────────────────────────────────

export const EXAMPLES: ArchExample[] = [
  urlShortener,
  musicStreaming,
  chatApp,
  ecommerce,
  socialFeed,
  rideSharing,
]
