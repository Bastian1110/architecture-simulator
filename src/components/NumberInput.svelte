<script lang="ts">
  export let value: number
  export let min: number = -Infinity
  export let max: number = Infinity
  export let step: number = 1
  export let cls: string = ''

  let inputEl: HTMLInputElement

  function nudge(dir: 1 | -1) {
    // Read live DOM value so typing + nudging stays in sync
    const current = inputEl ? (parseFloat(inputEl.value) || value) : value
    const next = Math.min(max, Math.max(min, current + dir * step))
    value = next
    if (inputEl) {
      inputEl.value = String(next)
      inputEl.dispatchEvent(new Event('input', { bubbles: true }))
      inputEl.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }
</script>

<div class="flex items-center gap-1">
  <button
    type="button"
    class="w-8 h-8 shrink-0 flex items-center justify-center rounded-md border border-slate-200
           bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 text-base font-medium
           transition-colors select-none"
    style="touch-action: manipulation;"
    on:click={() => nudge(-1)}
  >−</button>
  <input
    bind:this={inputEl}
    type="number"
    {min} {max} {step} {value}
    class={cls}
    on:input
    on:change
  />
  <button
    type="button"
    class="w-8 h-8 shrink-0 flex items-center justify-center rounded-md border border-slate-200
           bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 text-base font-medium
           transition-colors select-none"
    style="touch-action: manipulation;"
    on:click={() => nudge(1)}
  >+</button>
</div>
