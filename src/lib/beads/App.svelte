<script lang="ts">
  import Canvas from './Canvas.svelte';
  import { beadsStore } from './stores.svelte';
  import { onMount } from 'svelte';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Undo, Redo, RotateCcwSquare, RotateCwSquare, TableCellsSplit, Trash2, Grid2x2, Hand, Grab, Palette, SlidersHorizontal, MousePointer2 } from '@lucide/svelte';
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Slider } from "$lib/components/ui/slider/index.js";
  import ColorSliders from "$lib/components/composed/ColorSliders.svelte";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import ClearAllButton from "$lib/components/composed/ClearAllButton.svelte";
	import GridSizeSetting from '@/components/composed/GridSizeSetting.svelte';
  // State for the app
  let gridWidth = $state(20);
  let gridHeight = $state(20);
  
  // Computed values for compatibility with other parts of the app
  const gridSize = $derived(Math.max(gridWidth, gridHeight));
  const painting = $derived(beadsStore.step === "painting");
  const configuring = $derived(beadsStore.step === "configuring");
  
  let layoutRotation = $state(90);
  
  // Initialize the app in painting mode
  onMount(() => {
    startPainting();
  });
  
  // Handle keyboard shortcuts
  function handleKeyDown(event: KeyboardEvent) {
    // Don't handle keyboard shortcuts if an input element is focused
    if (isInputFocused()) return;
    
    if (event.code === 'Space' && !event.repeat) {
      // Toggle hand mode with spacebar
      event.preventDefault();
      toggleHandMode();
    }
  }
  
  // Check if an input element is currently focused
  function isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement instanceof HTMLInputElement || 
           activeElement instanceof HTMLTextAreaElement || 
           activeElement instanceof HTMLSelectElement;
  }
  
  // Rotation actions
  function rotateRight() {
    layoutRotation = (layoutRotation + 90) % 360;
  }
  
  function rotateLeft() {
    layoutRotation = (layoutRotation - 90 + 360) % 360;
  }
  
  // Step change action
  function startPainting() {
    beadsStore.setStepPainting();
  }
  
  // Color selection
  function selectColor(id: number) {
    beadsStore.selectedColorId = id;
  }
  
  // History actions
  function handleUndo() {
    beadsStore.undoHistory();
    beadsStore.canvasColors = beadsStore.history.versions[beadsStore.history.cursor];
  }
  
  function handleRedo() {
    beadsStore.redoHistory();
    beadsStore.canvasColors = beadsStore.history.versions[beadsStore.history.cursor];
  }

  function handleSnapAndDownload() {
    console.log("handleSnapAndDownload");
  }
  
  // Toggle hand mode for panning
  function toggleHandMode() {
    beadsStore.toggleHandMode();
  }
  
  // Toggle select mode
  function toggleSelectMode() {
    beadsStore.toggleSelectMode();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<main class="min-h-screen grid grid-cols-[fit-content(4em)_1fr_1fr] grid-areas-painting">
  <!-- Logo Section -->
  <div class="logo text-xl">
      <span class="hidden lg:block">Beadbead</span>
      <span class="lg:hidden">BB</span>
  </div>
  
  <!-- Config Panel -->
  <div class= "config-panel">
     <div class="flex flex-wrap items-center sm:ml-12 gap-2">
      <Button variant="outline" size="icon" onclick={rotateLeft}>
        <RotateCcwSquare />
      </Button>
      <Button variant="outline" size="icon" onclick={rotateRight}>
        <RotateCwSquare />
      </Button>
      <Button variant="outline" size="icon" onclick={() => beadsStore.toggleStaggered()}>
        {#if beadsStore.isStaggered}
          <TableCellsSplit />
        {:else}
          <Grid2x2 />
        {/if}
      </Button>
      
      <!-- Hand Mode Toggle Button -->
      <Button 
        variant={beadsStore.handMode ? "default" : "outline"} 
        size="icon" 
        onclick={toggleHandMode}
        aria-label={beadsStore.handMode ? "Leave hand mode" : "Switch to hand mode"}
        title={beadsStore.handMode ? "Leave hand mode" : "Switch to hand mode"}
      >
        {#if beadsStore.handMode}
          <Grab />
        {:else}
          <Hand />
        {/if}
      </Button>
      
      <div class="cell-history-buttons">
        <div class="history-buttons">
          <Button aria-label={beadsStore.history.cursor > 0 ? 'undo' : 'undo (disabled)'} 
            disabled={beadsStore.history.cursor === 0} 
            variant="outline" size="icon" onclick={handleUndo}>
            <Undo />
          </Button>
          <Button
            aria-label={beadsStore.history.cursor < beadsStore.history.versions.length - 1 ? 'redo' : 'redo (disabled)'} 
            disabled={beadsStore.history.cursor === beadsStore.history.versions.length - 1} 
            variant="outline" size="icon" onclick={handleRedo}>
            <Redo />
          </Button>
        </div>
      </div>
 
       
      <GridSizeSetting bind:gridWidth={gridWidth} bind:gridHeight={gridHeight} />

        <ClearAllButton />
                
       
      </div>
  </div>
  
  <!-- Painting Toolbox -->
  <div class="painting-toolbox h-full p-1 shadow-md rounded-md w-fit mt-4">
      
    <Popover.Root>
      <Popover.Trigger class={buttonVariants({ variant: "outline", size: "icon", class: "mb-2" })}>
        <SlidersHorizontal />
      </Popover.Trigger>
      <Popover.Content>
        <ColorSliders />
      </Popover.Content>
    </Popover.Root>

      
        <div class="cell-colors flex flex-col gap-2 items-stretch">
          {#each beadsStore.colorPalette as color (color.id)}
            <Button
              type="button"
              variant="color"
              size="icon"
              aria-label={`select color ${color.id}`}
              class={[{'color-selected': color.id == beadsStore.selectedColorId, 'color-blank': color.l == 100}, 'color']}
              style="--h:{color.h}; --s:{color.s}%; --l:{color.l}%"
              onclick={() => selectColor(color.id)}
            >
            </Button>
          {/each}
        </div>
  </div>
  
  <!-- Workspace -->
  <div class="workspace h-[calc(100vh-7rem)]">
    <Canvas {gridWidth} {gridHeight} {layoutRotation} />
  </div>
</main>

<style>
  main {
    padding: 1em;
  }

  .grid-areas-painting {
    grid-template-areas: 
      "logo config-panel config-panel"
      "painting-toolbox workspace workspace";
  }

  .logo {
    grid-area: logo;
  }
  .config-panel {
    grid-area: config-panel;
  }

  .painting-toolbox {
    grid-area: painting-toolbox;
  }
  .workspace {
    grid-area: workspace;
  }

</style> 