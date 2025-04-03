<script lang="ts">
	import Canvas from './Canvas.svelte';
	import { tick } from 'svelte';
	import { beadsStore } from './stores.svelte';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Undo,
		Redo,
		RotateCcwSquare,
		RotateCwSquare,
		TableCellsSplit,
		Trash2,
		Grid2x2,
		Hand,
		Grab,
		SlidersHorizontal,
		Download,
		ImageUpscale,
		ImagePlus
	} from '@lucide/svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	// import { Slider } from '$lib/components/ui/slider/index.js'; // Using standard range input instead
	import ColorSliders from '$lib/components/composed/ColorSliders.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import ClearAllButton from '$lib/components/composed/ClearAllButton.svelte';
	import GridSizeSetting from '$lib/components/composed/GridSizeSetting.svelte'; // Corrected path alias
	// State for the app
	let gridWidth = $state(20);
	let gridHeight = $state(20);
	let imageInput: HTMLInputElement | null = $state(null); // Reference to hidden file input

	// Computed values for compatibility with other parts of the app
	const gridSize = $derived(Math.max(gridWidth, gridHeight));
	const painting = $derived(beadsStore.step === 'painting');
	const configuring = $derived(beadsStore.step === 'configuring');

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
		return (
			activeElement instanceof HTMLInputElement ||
			activeElement instanceof HTMLTextAreaElement ||
			activeElement instanceof HTMLSelectElement
		);
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

	async function handleSnapAndDownload() {
		beadsStore.viewBoxX = 0;
		beadsStore.viewBoxY = 0;
		beadsStore.zoomLevel = 1.0;
		await tick();
		const svg = document.getElementById('drawingArea');
		if (!svg) {
			console.error('SVG element not found');
			return;
		}

		try {
			// Get the SVG's viewBox values
			const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 0, 0];
			const [, , vbWidthPre, vbHeight] = viewBox;
			let vbWidth = vbWidthPre;
			if (beadsStore.isStaggered) {
				vbWidth = vbWidthPre + 2;
			}

			// Create a clone of the SVG
			const clonedSvg = svg.cloneNode(true) as SVGElement;

			// Set explicit dimensions
			clonedSvg.setAttribute('width', String(vbWidth * 100)); // Increase size for better quality
			clonedSvg.setAttribute('height', String(vbHeight * 100));
			clonedSvg.setAttribute('viewBox', `0 0 ${vbWidth} ${vbHeight}`);

			// Create blob
			const svgData = new XMLSerializer().serializeToString(clonedSvg);
			const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

			// Create canvas with larger dimensions
			const canvas = document.createElement('canvas');
			canvas.width = vbWidth * 50; // Increase size for better quality
			canvas.height = vbHeight * 50;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				console.error('Failed to get canvas context');
				return;
			}

			// Enable image smoothing
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';

			const url = URL.createObjectURL(svgBlob);
			let img = new window.Image(canvas.width, canvas.height);

			await new Promise((resolve, reject) => {
				img.onload = () => {
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					URL.revokeObjectURL(url);
					resolve(null);
				};
				img.onerror = (e) => {
					console.error('Image loading error:', e);
					URL.revokeObjectURL(url);
					reject(e);
				};
				img.src = url;
			});

			// Create download link
			const link = document.createElement('a');
			link.download = 'beads-pattern.png';
			link.href = canvas.toDataURL('image/png', 1.0); // Use maximum quality
			document.body.appendChild(link); // Append to body
			link.click();
			document.body.removeChild(link); // Clean up
		} catch (error) {
			console.error('Error in handleSnapAndDownload:', error);
		}
	}

	// Toggle hand mode for panning
	function toggleHandMode() {
		beadsStore.toggleHandMode();
	}

	// Toggle image interaction mode
	function toggleImageMode() {
		beadsStore.toggleInteractionMode();
	}

	// Trigger hidden file input
	function triggerImageUpload() {
		imageInput?.click();
	}

	// Handle image file selection
	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			// @ts-ignore - Suppress TS error about constructor signature
			const reader = new FileReader(); 
			reader.onload = (e: Event) => { 
				const targetReader = e.target as FileReader | null; 
				if (targetReader?.result) {
					const src = targetReader.result as string;
					// Set initial image state - centered, scaled down, full opacity
					// TODO: Calculate better initial size/position based on canvas?
				beadsStore.uploadedImage = {
					src: src,
					x: 5, // Example initial position
					y: 5, // Example initial position
					width: 50, // Example initial size
						height: 50, // Example initial size
						opacity: 1
					};
					// Switch to image mode automatically after upload
					beadsStore.interactionMode = 'image';
				}
			};
			reader.readAsDataURL(file);
		}
		// Reset input value to allow uploading the same file again
		if (target) target.value = '';
	}

	// Handle transparency slider change (updated for range input)
	function handleOpacityChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value);
		if (beadsStore.uploadedImage) {
			beadsStore.uploadedImage = { ...beadsStore.uploadedImage, opacity: value / 100 };
		}
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
	<div class="config-panel">
		<div class="flex flex-wrap items-center sm:ml-12 gap-2">
			<Button variant="outline" size="icon" title="Rotate Left 90°" onclick={rotateLeft}>
				<RotateCcwSquare />
			</Button>
			<Button variant="outline" size="icon" title="Rotate Right 90°" onclick={rotateRight}>
				<RotateCwSquare />
			</Button>
			<Button variant="outline" size="icon" title="Staggered Mode" onclick={() => beadsStore.toggleStaggered()}>
				{#if beadsStore.isStaggered}
					<TableCellsSplit />
				{:else}
					<Grid2x2 />
				{/if}
			</Button>

			<!-- Hand Mode Toggle Button -->
			<Button
				variant={beadsStore.handMode ? 'default' : 'outline'}
				size="icon"
				disabled={beadsStore.interactionMode === 'image'} 
				onclick={toggleHandMode}
				aria-label={beadsStore.handMode ? 'Leave hand mode' : 'Switch to hand mode'}
				title={beadsStore.handMode ? 'Leave hand mode' : 'Switch to hand mode'}
			>
				{#if beadsStore.handMode}
					<Grab />
				{:else}
					<Hand />
				{/if}
			</Button>

			<!-- Upload Image Button -->
			<Button
				variant="outline"
				size="icon"
				onclick={triggerImageUpload}
				aria-label="Upload background image"
				title="Upload background image"
			>
				<ImagePlus />
			</Button>

			<!-- Image Mode Toggle Button -->
			<Button
				variant={beadsStore.interactionMode === 'image' ? 'default' : 'outline'}
				size="icon"
				onclick={toggleImageMode}
				aria-label={beadsStore.interactionMode === 'image' ? 'Leave image mode' : 'Switch to image mode'}
				title={beadsStore.interactionMode === 'image' ? 'Leave image mode' : 'Switch to image mode'}
			>
				<ImageUpscale />
			</Button>

			
			<input
				type="file"
				accept="image/*"
				class="hidden"
				bind:this={imageInput}
				onchange={handleImageUpload}
			/>

			<div class="cell-history-buttons">
				<div class="history-buttons">
					<Button
						aria-label={beadsStore.history.cursor > 0 ? 'undo' : 'undo (disabled)'}
						disabled={beadsStore.history.cursor === 0}
						variant="outline"
						size="icon"
						title="Undo"
						onclick={handleUndo}
					>
						<Undo />
					</Button>
					<Button
						aria-label={beadsStore.history.cursor < beadsStore.history.versions.length - 1
							? 'redo'
							: 'redo (disabled)'}
						disabled={beadsStore.history.cursor === beadsStore.history.versions.length - 1}
						variant="outline"
						size="icon"
						title="Redo"
						onclick={handleRedo}
					>
						<Redo />
					</Button>
				</div>
			</div>

			<GridSizeSetting bind:gridWidth bind:gridHeight />

			<div class="md:ml-auto flex gap-4">
				<Button
					variant="outline"
					onclick={handleSnapAndDownload}
					aria-label="Download pattern"
					size="sm"
				>
					<Download />
          <span>Download</span>
				</Button>
				<ClearAllButton />
			</div>
		</div>
	</div>

	<!-- Painting Toolbox -->
	<div class="painting-toolbox h-full p-1 shadow-md rounded-md w-fit mt-4">
		<Popover.Root>
			<Popover.Trigger class={buttonVariants({ variant: 'outline', size: 'icon', class: 'mb-2' })}>
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
					class={[
						{
							'color-selected': color.id == beadsStore.selectedColorId,
							'color-blank': color.l == 100
						},
						'color'
					]}
					style="--h:{color.h}; --s:{color.s}%; --l:{color.l}%"
					onclick={() => selectColor(color.id)}
				></Button>
			{/each}
		</div>
	</div>

	<!-- Workspace -->
	<div class="workspace h-[calc(100vh-7rem)] relative">
		<Canvas {gridWidth} {gridHeight} {layoutRotation} />
		<!-- Transparency Slider (conditionally rendered) -->
		{#if beadsStore.interactionMode === 'image' && beadsStore.uploadedImage}
			<div class="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 bg-background p-2 rounded shadow-lg z-10">
				<label for="opacity-slider" class="text-sm font-medium text-muted-foreground block mb-1"
					>Image Transparency: {Math.round(beadsStore.uploadedImage.opacity * 100)}%</label
				>
				<input
					type="range"
					id="opacity-slider"
					class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
					min="0"
					max="100"
					step="1"
					value={beadsStore.uploadedImage.opacity * 100}
					oninput={handleOpacityChange}
				/>
			</div>
		{/if}
	</div>
</main>

<style>
	main {
		padding: 1em;
	}

	.grid-areas-painting {
		grid-template-areas:
			'logo config-panel config-panel'
			'painting-toolbox workspace workspace';
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
