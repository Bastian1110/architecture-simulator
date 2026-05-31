<script lang="ts">
  import { Monitor, Smartphone, Globe, Scale, Zap, Server, Database, HardDrive } from 'lucide-svelte'
  import type { NodeKind } from '../types'

  const items: Array<{ kind: NodeKind; component: any; label: string; subtype?: string }> = [
    { kind: 'client',       component: Monitor,    label: 'Browser'       },
    { kind: 'client',       component: Smartphone, label: 'Mobile',  subtype: 'mobile' },
    { kind: 'cdn',          component: Globe,      label: 'CDN'           },
    { kind: 'loadBalancer', component: Scale,      label: 'Load Balancer' },
    { kind: 'cache',        component: Zap,        label: 'Cache'         },
    { kind: 'server',       component: Server,     label: 'Server'        },
    { kind: 'database',     component: Database,   label: 'Database'      },
    { kind: 'storage',      component: HardDrive,  label: 'Storage'       },
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
             hover:bg-slate-100 transition-colors group w-full"
      draggable="true"
      title={item.label}
      on:dragstart={(e) => onDragStart(e, item.kind, item.subtype)}
    >
      <span class="text-slate-400 group-hover:text-slate-700 transition-colors">
        <svelte:component this={item.component} size={16} />
      </span>
      <span class="text-[9px] text-slate-400 group-hover:text-slate-600 text-center leading-tight">{item.label}</span>
    </div>
  {/each}
</aside>
