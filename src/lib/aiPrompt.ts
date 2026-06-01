export const AI_PROMPT = `You are generating a Mermaid architecture diagram for a load-simulation tool.
Output only the diagram — no prose, no code fences.

## Node shapes → type mapping

  id[Label]       →  Server (app / API / worker)
  id(Label)       →  CDN / edge cache
  id[(Label)]     →  Database (SQL or NoSQL)
  id([Label])     →  In-memory Cache (Redis, Memcached)
  id((Label))     →  Client (browser or mobile)
  id{Label}       →  Load Balancer
  id[[Label]]     →  Object Storage (S3, GCS, Blob)
  id{{Label}}     →  Orchestrator (Kubernetes, ECS, Swarm, Nomad)

## Edge syntax

  A --> B               HTTP (default)
  A -- grpc --> B       gRPC
  A -- ws --> B         WebSocket
  A -- tcp --> B        TCP
  A -.-> B              Required dependency (hard failure if down)

## Node parameters
Add a \`%% @params <id> key=value ...\` line immediately after each node declaration.
Estimate realistic values based on the architecture and expected traffic load.

  client        rps=<int>  subtype=browser|mobile
  server        cpuCores=<int>  processingTimeMs=<int>  errorRate=<0–1>
  loadBalancer  algorithm=roundRobin|leastConnections|random  maxRPS=<int>
  database      dbType=sql|nosql  queryTimeMs=<int>  maxConnections=<int>  errorRate=<0–1>
  cache         hitRate=<0–1>  lookupTimeMs=<int>
  cdn           hitRate=<0–1>  edgeLatencyMs=<int>
  storage       storageType=s3|gcs|blob|minio  readLatencyMs=<int>  writeLatencyMs=<int>  errorRate=<0–1>
  orchestrator  orchType=kubernetes|ecs|swarm|nomad  minInstances=<int>  maxInstances=<int>
                instanceCpuCores=<int>  processingTimeMs=<int>  containerPerSession=<float>  errorRate=<0–1>

## Example output

graph LR
  browser((Browser))
  %% @params browser rps=500 subtype=browser
  lb{Load Balancer}
  %% @params lb algorithm=roundRobin maxRPS=50000
  api[API Server]
  %% @params api cpuCores=8 processingTimeMs=30 errorRate=0.01
  cache([Redis])
  %% @params cache hitRate=0.85 lookupTimeMs=1
  db[(PostgreSQL)]
  %% @params db dbType=sql queryTimeMs=15 maxConnections=200 errorRate=0.002

  browser --> lb
  lb --> api
  api --> cache
  api --> db

---

Architecture to diagram:

[Paste your architecture description, service list, HAR file summary, or existing diagram here]`
