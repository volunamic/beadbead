<script lang="ts">
  import { beadsStore } from './stores.svelte';

  const { id, x, y, width, height } = $props<{
    id?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }>();

  // Compute the color using derived values
  const colorId = $derived(beadsStore.canvasColors[id] ?? undefined);
  const color = $derived(
    colorId !== undefined 
      ? beadsStore.colorPalette[colorId] 
      : {h: 0, s: 100, l: 100}
  );
  const fill = $derived(`hsl(${color.h}, ${color.s}%, ${color.l}%)`);

  // Helper function to check if painting is allowed
  function canPaint() {
    return beadsStore.step === "painting" && !beadsStore.handMode;
  }

  // Paint function
  function paint() {
    if (!canPaint()) return;
    beadsStore.canvasColors = {
      ...beadsStore.canvasColors, 
      [id]: beadsStore.selectedColorId
    };
  }

  function handleClick() {
    if (!canPaint()) return;
    paint();
    beadsStore.commitToHistory(beadsStore.canvasColors);
  }

  function handleMouseEnter(e: MouseEvent) {
    if (!canPaint()) return;
    if (e.buttons === 1) paint();
  }
</script>

<rect
  id={id}
  x={x}
  y={y}
  width={width}
  height={height}
  {fill}
  stroke="darkgray" 
  stroke-width="0.1"
  class:paintable={canPaint()}
  onclick={handleClick}
  onmousedown={paint}
  onmouseenter={handleMouseEnter}
  onkeydown={(e) => e.key === 'Enter' && handleClick()}
  tabindex="0"
  role="button"
  aria-label="Bead"
/>

<style>
  rect {
    touch-action: none;
    outline: none;
  }
  rect:focus {
    stroke-width: 0.2;
  }
  .paintable:hover {
    stroke-width: 0.2;
    cursor: crosshair;
  }
</style> 