<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  let { gridWidth = $bindable(20), gridHeight = $bindable(20) } = $props();

</script>

        
<div class="grid-controls flex gap-2 items-center">
    <label class="flex items-center gap-1">
      W:
      <Input type="number" placeholder="width" min="5" max="50" class="w-16 p-1 text-sm border rounded" bind:value={gridWidth} />


      
    </label>
    <label class="flex items-center gap-1">
      H:
      <Input type="number" placeholder="height" min="5" max="50" class="w-16 p-1 text-sm border rounded" bind:value={gridHeight} />
      
    </label>
  </div>