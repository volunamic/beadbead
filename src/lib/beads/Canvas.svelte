<script lang="ts">
	import Bead from './Bead.svelte';
	import { beadsStore } from './stores.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Shrink, CircleX, Image, ImageOff } from '@lucide/svelte'; // Added Eye, EyeOff
	import { onMount } from 'svelte'; // Needed for interactjs later
	import interact from 'interactjs'; // Import interactjs

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
	function makeBeads(
		width: number,
		height: number,
		h: number,
		w: number,
		totalH: number,
		totalW: number,
		angle: number
	) {
		switch (angle) {
			case 90:
				return range(height).flatMap((i) =>
					range(width).map((j) => ({
						id: (i * width + j).toString(),
						x: totalH - (beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5)),
						y: w * (i + 1.5) + 3,
						height: w,
						width: h
					}))
				);
			case 180:
				return range(height).flatMap((i) =>
					range(width).map((j) => ({
						id: (i * width + j).toString(),
						x: totalW - w * (i + 1.5) - 6,
						y: totalH - (beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5)) + 1,
						height: h,
						width: w
					}))
				);
			case 270:
				return range(height).flatMap((i) =>
					range(width).map((j) => ({
						id: (i * width + j).toString(),
						x: beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5) - 2,
						y: totalW - (w * (i + 1.5) + 3) - 2,
						height: w,
						width: h
					}))
				);
			default:
				return range(height).flatMap((i) =>
					range(width).map((j) => ({
						id: (i * width + j).toString(),
						x: w * (i + 1.5) + 2,
						y: beadsStore.isStaggered && i % 2 ? h * (j + 1) : h * (j + 1.5),
						height: h,
						width: w
					}))
				);
		}
	}

	// Create beads based on current grid size and rotation
	let beads = $derived(
		makeBeads(
			gridWidth,
			gridHeight,
			beadHeight,
			beadWidth,
			totalSideWidth,
			totalSideHeight,
			layoutRotation
		)
	);

	// Update computedViewBox to use store values
	const computedViewBox = $derived(
		`${beadsStore.viewBoxX} ${beadsStore.viewBoxY} ${totalSideWidth / beadsStore.zoomLevel} ${totalSideHeight / beadsStore.zoomLevel}`
	);
	const isPannedOrZoomed = $derived(
		beadsStore.viewBoxX !== 0 || beadsStore.viewBoxY !== 0 || beadsStore.zoomLevel !== 1.0
	);

	// Check if painting is allowed (not in hand mode and in painting interaction mode)
	function canPaint() {
		return beadsStore.interactionMode === 'painting' && !beadsStore.handMode;
	}

	// Handle mouse and touch events for pan, zoom, and painting
	function handlePointerDown(e: PointerEvent) {
		// Prioritize image interaction if in image mode and clicking the image
		const targetElement = e.target as SVGElement;
		if (beadsStore.interactionMode === 'image' && targetElement.id === 'uploaded-bg-image') {
			// Let interactjs handle drag/resize, but toggle selection on simple click
			return;
		}

		if (beadsStore.handMode) {
			beadsStore.isPanning = true;
			beadsStore.startX = e.clientX;
			beadsStore.startY = e.clientY;
			e.preventDefault(); // Prevent text selection during panning
		} else if (canPaint()) {
			// Handle painting start (if needed, though Bead.svelte handles clicks)
		}
	}

	function handlePointerMove(e: PointerEvent) {
		// Panning logic
		if (beadsStore.isPanning && beadsStore.handMode) {
			const dx =
				((e.clientX - beadsStore.startX) / beadsStore.zoomLevel) * beadsStore.panSensitivity;
			const dy =
				((e.clientY - beadsStore.startY) / beadsStore.zoomLevel) * beadsStore.panSensitivity;
			beadsStore.viewBoxX -= dx;
			beadsStore.viewBoxY -= dy;
			beadsStore.startX = e.clientX;
			beadsStore.startY = e.clientY;
			e.preventDefault();
			return; // Don't paint while panning
		}
	}

	function handlePointerUp(e: PointerEvent) {
		// Check for simple click on image to toggle selection
		const targetElement = e.target as SVGElement;
		if (
			beadsStore.interactionMode === 'image' &&
			targetElement.id === 'uploaded-bg-image' &&
			!beadsStore.isPanning // Avoid toggling selection after panning/dragging
		) {
			beadsStore.toggleImageSelected();
		}

		if (beadsStore.isPanning) {
			beadsStore.isPanning = false;
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
			x: beadsStore.viewBoxX + (mouseX / svgRect.width) * (totalSideWidth / beadsStore.zoomLevel),
			y: beadsStore.viewBoxY + (mouseY / svgRect.height) * (totalSideHeight / beadsStore.zoomLevel)
		};

		// Apply zoom - negative deltaY means zoom in
		const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
		const newZoom = Math.max(0.5, Math.min(5, beadsStore.zoomLevel * zoomFactor));

		if (newZoom !== beadsStore.zoomLevel) {
			// Adjust viewBox to keep the mouse position fixed
			beadsStore.viewBoxX = svgPoint.x - (mouseX / svgRect.width) * (totalSideWidth / newZoom);
			beadsStore.viewBoxY = svgPoint.y - (mouseY / svgRect.height) * (totalSideHeight / newZoom);
			beadsStore.zoomLevel = newZoom;
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
			return; // Don't paint if panning
		}

		// Handle painting with touch only if in painting mode
		if (canPaint()) {
			const touchElement = document.elementFromPoint(e.touches[0].pageX, e.touches[0].pageY);
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
			beadsStore.isPanning = true;
			beadsStore.startX = e.touches[0].clientX;
			beadsStore.startY = e.touches[0].clientY;
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
			x:
				beadsStore.viewBoxX +
				((centerX - svgRect.left) / svgRect.width) * (totalSideWidth / beadsStore.zoomLevel),
			y:
				beadsStore.viewBoxY +
				((centerY - svgRect.top) / svgRect.height) * (totalSideHeight / beadsStore.zoomLevel)
		};

		// Calculate zoom factor
		const zoomFactor = distance / lastTouchDistance;
		lastTouchDistance = distance;

		// Apply zoom with constraints
		const newZoom = Math.max(0.5, Math.min(5, beadsStore.zoomLevel * zoomFactor));

		if (newZoom !== beadsStore.zoomLevel) {
			// Adjust viewBox to maintain center point
			beadsStore.viewBoxX =
				svgPoint.x - ((centerX - svgRect.left) / svgRect.width) * (totalSideWidth / newZoom);
			beadsStore.viewBoxY =
				svgPoint.y - ((centerY - svgRect.top) / svgRect.height) * (totalSideHeight / newZoom);
			beadsStore.zoomLevel = newZoom;
		}
	}

	function handleTouchEnd() {
		beadsStore.isPanning = false;
		if (canPaint()) {
			beadsStore.commitToHistory(beadsStore.canvasColors);
		}
	}

	// Reset view to center
	function resetView() {
		beadsStore.viewBoxX = 0;
		beadsStore.viewBoxY = 0;
		beadsStore.zoomLevel = 1.0;
	}

	// Setup interactjs for the image
	onMount(() => {
		const imageElementSelector = '#uploaded-bg-image';

		interact(imageElementSelector)
			.draggable({
				inertia: false,
				modifiers: [
					interact.modifiers.restrictRect({
						endOnly: true
					})
				],
				autoScroll: true,
				listeners: {
					start(event) {
						beadsStore.isImageSelected = true;
					},
					move(event) {
						// Draggable listener - Divide by pixelsPerSvgUnit
						if (beadsStore.interactionMode !== 'image' || !beadsStore.uploadedImage) return;

						const svgElement = document.getElementById('drawingArea');
						if (!svgElement) return;
						const svgRect = svgElement.getBoundingClientRect();
						const currentViewBoxWidth = totalSideWidth / beadsStore.zoomLevel;
						const currentViewBoxHeight = totalSideHeight / beadsStore.zoomLevel;
						const pixelsPerSvgUnitX = svgRect.width > 0 ? svgRect.width / currentViewBoxWidth : 1;
						const pixelsPerSvgUnitY =
							svgRect.height > 0 ? svgRect.height / currentViewBoxHeight : 1;

						// Calculate change in SVG units by dividing screen delta by pixels per unit
						const dx_svg = event.dx / pixelsPerSvgUnitX;
						const dy_svg = event.dy / pixelsPerSvgUnitY;

						// Apply sensitivity (optional, currently 1.0)
						const final_dx = dx_svg * beadsStore.imageDragSensitivity;
						const final_dy = dy_svg * beadsStore.imageDragSensitivity;

						beadsStore.uploadedImage = {
							...beadsStore.uploadedImage,
							x: beadsStore.uploadedImage.x + final_dx,
							y: beadsStore.uploadedImage.y + final_dy
						};
					},
					end(event) {
						// Optional: Update state after drag end if needed
					}
				},
				enabled: beadsStore.interactionMode === 'image' && !!beadsStore.uploadedImage
			})
			.resizable({
				edges: { left: true, right: true, bottom: true, top: true },
				listeners: {
					move(event) {
						// Resizable listener - Apply scaling factor to deltas
						if (beadsStore.interactionMode !== 'image' || !beadsStore.uploadedImage) return;

						const svgElement = document.getElementById('drawingArea');
						if (!svgElement) return;
						const svgRect = svgElement.getBoundingClientRect();

						if (svgRect.width === 0 || svgRect.height === 0) return; // Avoid division by zero

						const currentViewBoxWidth = totalSideWidth / beadsStore.zoomLevel;
						const currentViewBoxHeight = totalSideHeight / beadsStore.zoomLevel;

						// Calculate SVG units per screen pixel
						const svgUnitsPerPixelX = currentViewBoxWidth / svgRect.width;
						const svgUnitsPerPixelY = currentViewBoxHeight / svgRect.height;

						let { x, y, width, height } = beadsStore.uploadedImage; // Get current state

						// Calculate change in dimensions in SVG units using DELTAS and ratios
						const dw_svg = event.deltaRect.width * svgUnitsPerPixelX;
						const dh_svg = event.deltaRect.height * svgUnitsPerPixelY;

						// Calculate change in position in SVG units using DELTAS and ratios
						const dx_svg = event.deltaRect.left * svgUnitsPerPixelX;
						const dy_svg = event.deltaRect.top * svgUnitsPerPixelY;

						// Apply changes
						width += dw_svg;
						height += dh_svg;
						x += dx_svg;
						y += dy_svg;

						// Ensure minimum size (in SVG units)
						const minSize = 20; // Match minimum size defined in modifiers
						width = Math.max(minSize, width);
						height = Math.max(minSize, height);

						beadsStore.uploadedImage = {
							...beadsStore.uploadedImage,
							x: x,
							y: y,
							width: width,
							height: height
						};
					}
				},
				modifiers: [
					// Restored modifiers
					interact.modifiers.restrictSize({
						min: { width: 20, height: 20 } // Example minimum size
					})
				],
				inertia: false,
				enabled: beadsStore.interactionMode === 'image' && !!beadsStore.uploadedImage
			});

		// Reactive update for enabling/disabling interactjs based on mode/image presence
		$effect(() => {
			const isEnabled = beadsStore.interactionMode === 'image' && !!beadsStore.uploadedImage;
			interact(imageElementSelector).draggable({ enabled: isEnabled });
			interact(imageElementSelector).resizable({ enabled: isEnabled });

			// Add/remove selection class based on interactjs state and selection store
			const element = document.querySelector(imageElementSelector);
			if (element) {
				if (beadsStore.isImageSelected && isEnabled) {
					element.classList.add('selected');
				} else {
					element.classList.remove('selected');
				}
			}
		});
	});

	function handleToggleImage(event: MouseEvent) {
		event.stopPropagation(); // Prevent other clicks
     beadsStore.toggleUploadedImageVisibility(); // Corrected method name
	}

	// Define missing handleCloseImage function
	function handleCloseImage(event: MouseEvent) {
		event.stopPropagation(); // Prevent other clicks
		beadsStore.resetImageState();
	}
	// --- End Close Button Positioning ---
</script>

<div
	class="relative flex flex-col items-center w-full h-full min-h-[80vh] sm:min-h-0"
>
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
		{#if beadsStore.uploadedImage}
			
			<!-- Toggle Visibility Button -->
			<Button
				variant="outline"
				size="sm"
				onclick={handleToggleImage}
				aria-label={beadsStore.isUploadedImageVisible ? 'Hide Image' : 'Show Image'}
				title={beadsStore.isUploadedImageVisible ? 'Hide Image' : 'Show Image'}
			>
				{#if beadsStore.isUploadedImageVisible}
        <ImageOff class="w-4 h-4" />
				{:else}
					<Image class="w-4 h-4" />
				{/if}
			</Button>
		{/if}
		<div class="text-sm text-slate-500">Zoom: {(beadsStore.zoomLevel * 100).toFixed(0)}%</div>
	</div>

	<svg
		id="drawingArea"
		viewBox={computedViewBox}
		ontouchmove={handleTouchMove}
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onwheel={handleWheel}
		class="touch-none w-full h-full max-h-[80vh] {beadsStore.handMode
			? 'cursor-grab'
			: ''} {beadsStore.isPanning ? 'cursor-grabbing' : ''}"
	>
		<!-- Render Beads -->
		{#each beads as bead (bead.id)}
			<Bead {...bead} />
		{/each}

		<!-- Render Uploaded Image -->
		{#if beadsStore.uploadedImage && beadsStore.isUploadedImageVisible}
			<image
				id="uploaded-bg-image"
				href={beadsStore.uploadedImage.src}
				x={beadsStore.uploadedImage.x}
				y={beadsStore.uploadedImage.y}
				width={beadsStore.uploadedImage.width}
				height={beadsStore.uploadedImage.height}
				opacity={beadsStore.uploadedImage.opacity}
				style="cursor: {beadsStore.interactionMode === 'image'
					? 'move'
					: 'default'}; touch-action: none; pointer-events: {beadsStore.interactionMode === 'image'
					? 'auto'
					: 'none'};"
				aria-label="Uploaded Image"
				class="relative h-auto"
			>
			</image>
		{/if}
	</svg>
</div>

<style>
	.selected {
		outline: 2px dashed blue; /* Basic selection indicator */
		outline-offset: 2px;
	}
</style>
