<script lang="ts">
  import Bead from './Bead.svelte';
  import { beadsStore } from './stores.svelte';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Shrink } from '@lucide/svelte';
  let { gridWidth = 20, gridHeight = 20, layoutRotation = 90 } = $props();

  // For backward compatibility
  const gridSize = $derived(Math.max(gridWidth, gridHeight));

  // Helper function to create a range array
  const range = (s: number) => [...Array(s).keys()];

  // Derived values for canvas dimensions
  let totalSideWidth = $derived(2 * (Math.max(gridWidth, gridHeight) + 1));
  let totalSideHeight = $derived(2 * (Math.max(gridWidth, gridHeight) + 2));

  // Bead size constants
  const beadSizeRatio = 0.82;
  const beadWidth = 2 * beadSizeRatio;
  const beadHeight = 2;

  // Function to generate bead positions based on grid size and rotation
  function makeBeads(width: number, height: number, h: number, w: number, totalH: number, totalW: number, angle: number) {
    switch(angle) {
      case 90:
        return range(height).flatMap(i => range(width).map(j => ({
          id: (i*width + j).toString(),
          x: totalH - (beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5)),
          y: w * (i + 1.5) + 3,
          height: w,
          width: h,
        })));
      case 180:
        return range(height).flatMap(i => range(width).map(j => ({
          id: (i*width + j).toString(),
          x: totalW - (w * (i + 1.5)) - 6,
          y: totalH - (beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5)) + 1,
          height: h,
          width: w,
        })));
      case 270:
        return range(height).flatMap(i => range(width).map(j => ({
          id: (i*width + j).toString(),
          x: beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5) - 2,
          y: totalW - (w * (i + 1.5) + 3) - 2,
          height: w,
          width: h,
        })));
      default:
        return range(height).flatMap(i => range(width).map(j => ({
          id: (i*width + j).toString(),
          x: w * (i + 1.5) + 2,
          y: beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5),
          height: h,
          width: w,
        })));
    }
  }

  // Create beads based on current grid size and rotation
  let beads = $derived(makeBeads(
    gridWidth,
    gridHeight,
    beadHeight, 
    beadWidth, 
    totalSideWidth, 
    totalSideHeight, 
    layoutRotation
  ));

  // Pan and zoom state
  let isPanning = $state(false);
  let startX = $state(0);
  let startY = $state(0);
  let viewBoxX = $state(0);
  let viewBoxY = $state(0);
  let zoomLevel = $state(1.0);
  let panSensitivity = $state(0.2); // Add sensitivity factor (lower = less sensitive)
  
  // Computed viewBox that includes pan and zoom
  const computedViewBox = $derived(
    `${viewBoxX} ${viewBoxY} ${totalSideWidth / zoomLevel} ${totalSideHeight / zoomLevel}`
  );
  const isPannedOrZoomed = $derived(viewBoxX !== 0 || viewBoxY !== 0 || zoomLevel !== 1.0);

  // Check if painting is allowed (not in hand mode and in painting step)
  function canPaint() {
    return beadsStore.step === "painting" && !beadsStore.handMode;
  }

  // Handle mouse and touch events for pan and zoom
  function handlePointerDown(e: PointerEvent) {
    if (beadsStore.handMode) {
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      // Prevent default to avoid text selection during panning
      e.preventDefault();
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (isPanning && beadsStore.handMode) {
      const dx = ((e.clientX - startX) / zoomLevel) * panSensitivity;
      const dy = ((e.clientY - startY) / zoomLevel) * panSensitivity;
      viewBoxX -= dx;
      viewBoxY -= dy;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    }
  }

  function handlePointerUp() {
    if (isPanning) {
      isPanning = false;
    }
    
    if (canPaint()) {
      beadsStore.commitToHistory(beadsStore.canvasColors);
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    
    // Calculate zoom center point (mouse position)
    const target = e.currentTarget as SVGSVGElement;
    const svgRect = target.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    // Convert mouse position to SVG coordinates
    const svgPoint = {
      x: viewBoxX + (mouseX / svgRect.width) * (totalSideWidth / zoomLevel),
      y: viewBoxY + (mouseY / svgRect.height) * (totalSideHeight / zoomLevel)
    };
    
    // Apply zoom - negative deltaY means zoom in
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.5, Math.min(5, zoomLevel * zoomFactor));
    
    if (newZoom !== zoomLevel) {
      // Adjust viewBox to keep the mouse position fixed
      viewBoxX = svgPoint.x - (mouseX / svgRect.width) * (totalSideWidth / newZoom);
      viewBoxY = svgPoint.y - (mouseY / svgRect.height) * (totalSideHeight / newZoom);
      zoomLevel = newZoom;
    }
  }

  // Touch handling for mobile devices
  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 2) {
      // Handle pinch zoom (touch with two fingers)
      handlePinchZoom(e);
      return;
    }
    
    if (beadsStore.handMode) {
      // Handle panning with one finger in hand mode
      const touch = e.touches[0];
      const pointerEvent = new PointerEvent('pointermove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      handlePointerMove(pointerEvent);
      return;
    }
    
    if (beadsStore.step === "painting" && !beadsStore.handMode) {
      // Handle painting with touch
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
  }

  let lastTouchDistance = 0;
  
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      // Store initial distance between fingers for pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    } else if (beadsStore.handMode) {
      // Start panning with single touch in hand mode
      isPanning = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
  }

  function handlePinchZoom(e: TouchEvent) {
    if (e.touches.length !== 2) return;
    
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate center point between fingers
    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    
    // Convert center to SVG coordinates
    const target = e.currentTarget as SVGSVGElement;
    const svgRect = target.getBoundingClientRect();
    const svgPoint = {
      x: viewBoxX + (centerX - svgRect.left) / svgRect.width * (totalSideWidth / zoomLevel),
      y: viewBoxY + (centerY - svgRect.top) / svgRect.height * (totalSideHeight / zoomLevel)
    };
    
    // Calculate zoom factor
    const zoomFactor = distance / lastTouchDistance;
    lastTouchDistance = distance;
    
    // Apply zoom with constraints
    const newZoom = Math.max(0.5, Math.min(5, zoomLevel * zoomFactor));
    
    if (newZoom !== zoomLevel) {
      // Adjust viewBox to maintain center point
      viewBoxX = svgPoint.x - ((centerX - svgRect.left) / svgRect.width) * (totalSideWidth / newZoom);
      viewBoxY = svgPoint.y - ((centerY - svgRect.top) / svgRect.height) * (totalSideHeight / newZoom);
      zoomLevel = newZoom;
    }
  }

  function handleTouchEnd() {
    isPanning = false;
    if (canPaint()) {
      beadsStore.commitToHistory(beadsStore.canvasColors);
    }
  }

  // Reset view to center
  function resetView() {
    viewBoxX = 0;
    viewBoxY = 0;
    zoomLevel = 1.0;
  }
</script>

<div class="flex flex-col items-center w-full h-full min-h-[80vh] sm:min-h-0">
  <div class="flex items-center gap-4 my-2">
    <Button 
      variant="outline"
      onclick={resetView}
      aria-label="Reset view"
      size="icon"
      class={isPannedOrZoomed ? 'inline-flex' : 'hidden'}
    >
      <Shrink />
    </Button>
    <div class="text-sm text-slate-500">Zoom: {(zoomLevel * 100).toFixed(0)}%</div>
  </div>

  <svg 
    viewBox={computedViewBox} 
    ontouchmove={handleTouchMove}
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onwheel={handleWheel}
    class="touch-none w-full h-full max-h-[80vh] {beadsStore.handMode ? 'cursor-grab' : ''} {isPanning ? 'cursor-grabbing' : ''}"
  >
    {#each beads as bead (bead.id)}
      <Bead {...bead} />
    {/each}
  </svg>
</div> 