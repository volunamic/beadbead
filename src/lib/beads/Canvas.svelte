<script lang="ts">
  import Bead from './Bead.svelte';
  import { beadsStore } from './stores.svelte';
  
  let { gridSize = 20, layoutRotation = 90 } = $props();

  // Helper function to create a range array
  const range = (s: number) => [...Array(s).keys()];

  // Derived values for canvas dimensions
  let totalSideWidth = $derived(2 * (gridSize + 1));
  let totalSideHeight = $derived(2 * (gridSize + 2));
  let viewBox = $derived(`0 0 ${totalSideWidth} ${totalSideHeight}`);

  // Bead size constants
  const beadSizeRatio = 0.82;
  const beadWidth = 2 * beadSizeRatio;
  const beadHeight = 2;

  // Function to generate bead positions based on grid size and rotation
  function makeBeads(size: number, h: number, w: number, totalH: number, totalW: number, angle: number) {
    switch(angle) {
      case 90:
        return range(size).flatMap(i => range(size).map(j => ({
          id: (i*size + j).toString(),
          x: totalH - (beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5)),
          y: w * (i + 1.5) + 3,
          height: w,
          width: h,
        })));
      case 180:
        return range(size).flatMap(i => range(size).map(j => ({
          id: (i*size + j).toString(),
          x: totalW - (w * (i + 1.5)) - 6,
          y: totalH - (beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5)) + 1,
          height: h,
          width: w,
        })));
      case 270:
        return range(size).flatMap(i => range(size).map(j => ({
          id: (i*size + j).toString(),
          x: beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5) - 2,
          y: totalW - (w * (i + 1.5) + 3) - 2,
          height: w,
          width: h,
        })));
      default:
        return range(size).flatMap(i => range(size).map(j => ({
          id: (i*size + j).toString(),
          x: w * (i + 1.5) + 2,
          y: beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5),
          height: h,
          width: w,
        })));
    }
  }

  // Create beads based on current grid size and rotation
  let beads = $derived(makeBeads(
    gridSize, 
    beadHeight, 
    beadWidth, 
    totalSideWidth, 
    totalSideHeight, 
    layoutRotation
  ));

  // Touch handling for mobile devices
  function handleTouchMove(e: TouchEvent) {
    if (beadsStore.step !== "painting") return;
    const touchElement = document.elementFromPoint(
      e.touches[0].pageX, 
      e.touches[0].pageY
    );
    if (touchElement && touchElement.id) {
      beadsStore.canvasColors = {
        ...beadsStore.canvasColors,
        [touchElement.id]: beadsStore.selectedColorId
      };
    }
  }

  function handlePointerUp() {
    beadsStore.commitToHistory(beadsStore.canvasColors);
  }
</script>

<svg {viewBox} ontouchmove={handleTouchMove} onpointerup={handlePointerUp}>
  {#each beads as bead (bead.id)}
    <Bead {...bead} />
  {/each}
</svg>

<style>
  svg {
    touch-action: none;
    max-height: 80vh;
  }
</style> 