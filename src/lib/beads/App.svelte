<script lang="ts">
  import Canvas from './Canvas.svelte';
  import { beadsStore } from './stores.svelte';
  import { onMount } from 'svelte';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Undo, Redo, RotateCcwSquare, RotateCwSquare, TableCellsSplit, Trash2, Grid2x2, Hand, Grab, Camera } from '@lucide/svelte';

  // State for the app
  let gridSize = $state(20);
  let layoutRotation = $state(90);
  
  // Computed values
  const painting = $derived(beadsStore.step === "painting");
  const configuring = $derived(beadsStore.step === "configuring");
  
  // Initialize the app in painting mode
  onMount(() => {
    startPainting();
  });
  
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
  
  function handleReset() {
    beadsStore.resetAll();
    gridSize = 20;
    layoutRotation = 90;
  }

  function handleSnapAndDownload() {
    console.log("handleSnapAndDownload");
  }
  
  // Toggle hand mode for panning
  function toggleHandMode() {
    beadsStore.toggleHandMode();
  }
</script>

<main class="min-h-screen grid grid-cols-[fit-content(4em)_1fr_1fr] grid-areas-painting">
  <!-- Logo Section -->
  <div class="logo text-xl">
      <span class="hidden lg:block">Beadbead</span>
      <span class="lg:hidden">BB</span>
  </div>
  
  <!-- Config Panel -->
  <div class= "config-panel">
     <div class="flex flex-wrap items-center gap-2">
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
 
        <div class="cell-label">
          <p class="grid-size-label">{gridSize} x {gridSize}</p>
        </div>
        <div class="cell-slider">
          <input type="range" class="accent-slate-500" bind:value={gridSize} min={5} max={50} step={1}>
        </div>

        <div class="cell-reset-button ml-auto">
          <Button variant="destructive" size="icon" onclick={handleReset}>
            <Trash2 />
          </Button>
        </div>
      </div>
  </div>
  
  <!-- Painting Toolbox -->
  <div class="painting-toolbox h-screen p-1 shadow-md rounded-md w-[2em] sm:w-[4em] mt-4">
      <div class="cell-hue-slider">
        <input 
          type="range" class="hue-gradient"
          min={0} max={360} step={1}
          bind:value={beadsStore.colorPalette[beadsStore.selectedColorId].h}
        />
      </div>
      <div class="cell-sat-slider">
        <input 
          type="range" class="sat-gradient" 
          style="--h:{beadsStore.colorPalette[beadsStore.selectedColorId].h}; --l:{beadsStore.colorPalette[beadsStore.selectedColorId].l}%"
          min={0} max={100} step={1}
          bind:value={beadsStore.colorPalette[beadsStore.selectedColorId].s}
        />
      </div>
      <div class="cell-light-slider">
        <input 
          type="range" class="light-gradient" 
          style="--h:{beadsStore.colorPalette[beadsStore.selectedColorId].h}; --s:{beadsStore.colorPalette[beadsStore.selectedColorId].s}%"
          min={0} max={100} step={1}
          bind:value={beadsStore.colorPalette[beadsStore.selectedColorId].l}
        />
      </div>
      
        <div class="cell-colors flex flex-col gap-2 items-stretch">
          {#each beadsStore.colorPalette as color (color.id)}
            <button
              type="button"
              aria-label={`select color ${color.id}`}
              class:selected={color.id == beadsStore.selectedColorId}
              class:blank={color.l == 100}
              class="color"
              style="--h:{color.h}; --s:{color.s}%; --l:{color.l}%"
              onclick={() => selectColor(color.id)}
            ></button>
          {/each}
        </div>
  </div>
  
  <!-- Workspace -->
  <div class="workspace h-[calc(100vh-7rem)]">
    <Canvas gridSize={gridSize} layoutRotation={layoutRotation} />
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

  .painting-toolbox input[type="range"] {
    -webkit-appearance: none;
    width: 90%;
    height: 0.8em;
    border-radius: 0.2em;
    cursor: pointer;
  }
  
  .painting-toolbox input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 1.2em;
    width: 1.2em;
    border-radius: 1.2em;
    border: none;
    background: grey;
    cursor: pointer;
    box-shadow: 0 0 0.2em rgba(0,0,0,0.4);
  }
  
  .hue-gradient {
    background: linear-gradient(to right, rgb(255, 0, 0) 0%, rgb(255, 255, 0) 17%, rgb(0, 255, 0) 33%, rgb(0, 255, 255) 50%, rgb(0, 0, 255) 67%, rgb(255, 0, 255) 83%, rgb(255, 0, 0) 100%);
  }
  
  .sat-gradient {
    background: linear-gradient(to right, hsl(var(--h), 0%, var(--l)), hsl(var(--h), 100%, var(--l)));
  }
  
  .light-gradient {
    background: linear-gradient(to right, hsl(var(--h), var(--s), 0%), hsl(var(--h), var(--s), 50%), hsl(var(--h), var(--s), 100%));
  }
  
  .color {
    height: 1.8em;
    transition: all 0.3s ease;
    background-color: hsl(var(--h), var(--s), var(--l));
    box-sizing: border-box;
  }
  
  .color.selected {
    filter: drop-shadow(0 0 0.2em rgba(0,0,0,0.2));
    border-radius: 0.2em;
    border: 0.1em solid black;
    transform: scale(1.2) translateX(0.2em);
    transform-origin: center center;
    
  }
  
  .color:not(.selected) {
    border-radius: 0.2em;
  }
  
  .color:not(.selected):hover {
    transform: scale(1.2);
    cursor: pointer;
  }
  
  .blank:not(.selected) {
    filter: drop-shadow(0 0 0.1em rgba(0,0,0,0.2));
  }
</style> 