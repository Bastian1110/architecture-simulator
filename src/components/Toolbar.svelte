<script lang="ts">
  import { Monitor, Smartphone, Globe, Scale, Zap, Server, Database, HardDrive } from 'lucide-svelte'
  import type { NodeKind } from '../types'

  const items: Array<{ kind: NodeKind; component: any; label: string; key: string; subtype?: string }> = [
    { kind: 'client',       component: Monitor,    label: 'Browser',       key: 'B' },
    { kind: 'client',       component: Smartphone, label: 'Mobile',        key: 'M', subtype: 'mobile' },
    { kind: 'cdn',          component: Globe,      label: 'CDN',           key: 'N' },
    { kind: 'loadBalancer', component: Scale,      label: 'Load Balancer', key: 'L' },
    { kind: 'cache',        component: Zap,        label: 'Cache',         key: 'C' },
    { kind: 'server',       component: Server,     label: 'Server',        key: 'S' },
    { kind: 'database',     component: Database,   label: 'Database',      key: 'D' },
    { kind: 'storage',      component: HardDrive,  label: 'Storage',       key: 'O' },
  ]

  function onDragStart(e: DragEvent, kind: NodeKind, subtype?: string) {
    e.dataTransfer!.setData('nodeKind', kind)
    if (subtype) e.dataTransfer!.setData('nodeSubtype', subtype)
    e.dataTransfer!.effectAllowed = 'move'
  }
</script>

<aside class="w-[62px] flex flex-col items-center gap-0.5 py-2 bg-white border-r border-slate-200 shrink-0">
  {#each items as item}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="flex flex-col items-center gap-1 px-1 py-2 rounded-lg cursor-grab active:cursor-grabbing
             hover:bg-slate-100 transition-colors group w-full relative"
      draggable="true"
      title="{item.label} — press {item.key}"
      on:dragstart={(e) => onDragStart(e, item.kind, item.subtype)}
    >
      <span class="text-slate-400 group-hover:text-slate-700 transition-colors">
        <svelte:component this={item.component} size={16} />
      </span>
      <span class="text-[9px] text-slate-400 group-hover:text-slate-600 text-center leading-tight">{item.label}</span>
      <span
        class="absolute top-1 right-1.5 text-[8px] font-mono text-slate-300 group-hover:text-slate-400 leading-none"
      >{item.key}</span>
    </div>
  {/each}
</aside>
