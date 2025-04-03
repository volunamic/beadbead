<script lang="ts">
  import { Input } from '$lib/components/ui/input/index.js';
  let { gridWidth = $bindable(20), gridHeight = $bindable(20) } = $props();

  const MIN_GRID_SIZE = 1;
  const MAX_GRID_SIZE = 100;

  $effect(() => {
    if (gridWidth < MIN_GRID_SIZE || gridWidth > MAX_GRID_SIZE) {
      gridWidth = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, gridWidth));
    }
    if (gridHeight < MIN_GRID_SIZE || gridHeight > MAX_GRID_SIZE) {
      gridHeight = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, gridHeight));
    }
  });

  // Unified input handler with type safety
  function handleInput(event: Event, dimension: 'width' | 'height') {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(value)) {
      dimension === 'width' ? gridWidth = value : gridHeight = value;
    }
  }
</script>

<div class="grid-controls flex gap-2 items-center">
  <label class="flex items-center gap-1">
    W:
    <Input 
      type="number" 
      min={MIN_GRID_SIZE}
      max={MAX_GRID_SIZE}
      placeholder="width" 
      class="w-16 p-1 text-sm border rounded" 
      bind:value={gridWidth}
      oninput={(e) => handleInput(e, 'width')}
    />
  </label>
  <label class="flex items-center gap-1">
    H:
    <Input 
      type="number" 
      min={MIN_GRID_SIZE} 
      max={MAX_GRID_SIZE}
      placeholder="height" 
      class="w-16 p-1 text-sm border rounded" 
      bind:value={gridHeight}
      oninput={(e) => handleInput(e, 'height')}
    />
  </label>
</div>
