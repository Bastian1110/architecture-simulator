<script lang="ts">
  import { getBezierPath } from '@xyflow/svelte'
  import type { EdgeProps } from '@xyflow/svelte'
  import type { TrafficEdgeData } from '../../types'

  type $$Props = EdgeProps

  export let id: string
  export let sourceX: number
  export let sourceY: number
  export let targetX: number
  export let targetY: number
  export let sourcePosition: any
  export let targetPosition: any
  export let data: TrafficEdgeData | undefined = undefined

  $: [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  $: protocol = data?.protocol ?? 'http'
  $: required = data?.required ?? false
  $: intensity = data?.intensity ?? 0
  $: active = data?.active ?? false
  $: strokeWidth = 1.5 + intensity * 3

  $: stroke = required && !active
    ? '#a5b4fc'  // indigo tint for required-but-idle
    : intensityToColor(intensity)

  $: dashSpeed = (1.2 - intensity * 0.8).toFixed(2)

  // Required edges always show dashes; active edges animate
  $: dashArray = required && !active ? '4 4' : active ? '8 4' : 'none'

  $: showLabel = protocol !== 'http' || required

  const protocolLabel: Record<string, string> = {
    websocket: 'WS',
    grpc: 'gRPC',
    tcp: 'TCP',
    http: '',
  }

  function intensityToColor(v: number): string {
    if (v < 0.001) return '#94a3b8'
    if (v < 0.4) {
      const t = v / 0.4
      return lerpColor('#10b981', '#f59e0b', t)
    }
    const t = (v - 0.4) / 0.6
    return lerpColor('#f59e0b', '#ef4444', t)
  }

  function lerpColor(a: string, b: string, t: number): string {
    const hex = (s: string) => [
      parseInt(s.slice(1, 3), 16),
      parseInt(s.slice(3, 5), 16),
      parseInt(s.slice(5, 7), 16),
    ]
    const [r1, g1, b1] = hex(a)
    const [r2, g2, b2] = hex(b)
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const bl = Math.round(b1 + (b2 - b1) * t)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
  }
</script>

<path
  {id}
  d={edgePath}
  fill="none"
  stroke={stroke}
  stroke-width={strokeWidth}
  stroke-dasharray={dashArray}
  class={active ? 'traffic-edge-active' : ''}
  style="animation-duration: {dashSpeed}s"
/>

{#if active}
  <circle r="3" fill={stroke} opacity="0.9">
    <animateMotion dur="{dashSpeed}s" repeatCount="indefinite">
      <mpath href="#{id}" />
    </animateMotion>
  </circle>
{/if}

{#if showLabel}
  <g transform="translate({labelX},{labelY})">
    <rect
      x={-18} y={-8} width={36} height={16} rx={3}
      fill="white" stroke="#e2e8f0" stroke-width="1"
    />
    <text
      text-anchor="middle" dominant-baseline="middle"
      font-size="8" font-family="monospace"
      fill={required && !active ? '#818cf8' : '#64748b'}
    >
      {required && protocol === 'http' ? 'req' : (protocolLabel[protocol] || protocol)}{required && protocol !== 'http' ? '·req' : ''}
    </text>
  </g>
{/if}
