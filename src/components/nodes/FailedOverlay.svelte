<script lang="ts">
  import { failedNodes } from '../../stores/simStore'
  import { ZapOff } from 'lucide-svelte'
  export let id: string
</script>

{#if $failedNodes.has(id)}
  <div class="absolute inset-0 rounded-xl bg-red-50/95 border-2 border-red-400 flex items-center justify-center z-10 pointer-events-none">
    <div class="flex flex-col items-center gap-0.5">
      <span class="text-red-500"><ZapOff size={14} /></span>
      <span class="text-[9px] font-bold tracking-widest text-red-500">OFFLINE</span>
    </div>
  </div>
{/if}
