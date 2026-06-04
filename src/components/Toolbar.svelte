<script lang="ts">
  import { Monitor, Smartphone, Globe, Scale, Zap, Server, Database, HardDrive, Boxes } from 'lucide-svelte'
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
    { kind: 'orchestrator', component: Boxes,      label: 'Orchestrator',  key: 'K' },
  ]

  // ── Mouse / HTML5 drag ────────────────────────────────────────────────────
  function onDragStart(e: DragEvent, kind: NodeKind, subtype?: string) {
    e.dataTransfer!.setData('nodeKind', kind)
    if (subtype) e.dataTransfer!.setData('nodeSubtype', subtype)
    e.dataTransfer!.effectAllowed = 'move'
  }

  // ── Touch / Pencil drag ───────────────────────────────────────────────────
  let activeDrag: { kind: NodeKind; subtype?: string; startX: number; startY: number } | null = null
  let ghostEl: HTMLDivElement | null = null

  function startTouchDrag(e: TouchEvent, kind: NodeKind, subtype: string | undefined, label: string) {
    e.preventDefault()
    const t = e.touches[0]
    activeDrag = { kind, subtype, startX: t.clientX, startY: t.clientY }

    ghostEl = document.createElement('div')
    Object.assign(ghostEl.style, {
      position: 'fixed',
      left: `${t.clientX - 36}px`,
      top: `${t.clientY - 52}px`,
      width: '72px',
      padding: '10px 6px',
      background: '#ffffff',
      border: '2px solid #204878',
      borderRadius: '10px',
      textAlign: 'center',
      fontSize: '11px',
      fontWeight: '600',
      color: '#204878',
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '0.92',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      userSelect: 'none',
      transition: 'none',
    })
    ghostEl.textContent = label
    document.body.appendChild(ghostEl)

    window.addEventListener('touchmove', moveTouchDrag, { passive: false })
    window.addEventListener('touchend', endTouchDrag)
    window.addEventListener('touchcancel', cancelTouchDrag)
  }

  function moveTouchDrag(e: TouchEvent) {
    e.preventDefault()
    const t = e.touches[0]
    if (ghostEl) {
      ghostEl.style.left = `${t.clientX - 36}px`
      ghostEl.style.top = `${t.clientY - 52}px`
    }
  }

  function endTouchDrag(e: TouchEvent) {
    const t = e.changedTouches[0]
    const drag = activeDrag
    activeDrag = null
    cleanup()

    if (!drag) return

    const dx = t.clientX - drag.startX
    const dy = t.clientY - drag.startY

    const el = document.elementFromPoint(t.clientX, t.clientY)
    if (!el) return

    if (Math.hypot(dx, dy) > 8) {
      // Dragged far enough → drop at touch position on canvas
      el.dispatchEvent(new CustomEvent('toolbar-touch-drop', {
        bubbles: true,
        detail: { clientX: t.clientX, clientY: t.clientY, kind: drag.kind, subtype: drag.subtype },
      }))
    } else {
      // Short tap → add at canvas centre
      document.dispatchEvent(new CustomEvent('toolbar-touch-tap', {
        detail: { kind: drag.kind, subtype: drag.subtype },
      }))
    }
  }

  function cancelTouchDrag() {
    activeDrag = null
    cleanup()
  }

  function cleanup() {
    ghostEl?.remove()
    ghostEl = null
    window.removeEventListener('touchmove', moveTouchDrag)
    window.removeEventListener('touchend', endTouchDrag)
    window.removeEventListener('touchcancel', cancelTouchDrag)
  }
</script>

<aside class="w-[62px] flex flex-col items-center gap-0.5 py-2 bg-white border-r border-slate-200 shrink-0">
  {#each items as item}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="flex flex-col items-center gap-1 px-1 py-2 rounded-lg cursor-grab active:cursor-grabbing
             hover:bg-slate-100 active:bg-slate-100 transition-colors group w-full relative select-none"
      style="touch-action: none; -webkit-touch-callout: none;"
      draggable="true"
      title="{item.label} — press {item.key}"
      on:dragstart={(e) => onDragStart(e, item.kind, item.subtype)}
      on:touchstart|nonpassive={(e) => startTouchDrag(e, item.kind, item.subtype, item.label)}
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
