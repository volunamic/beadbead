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
		Download
	} from '@lucide/svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import ColorSliders from '$lib/components/composed/ColorSliders.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import ClearAllButton from '$lib/components/composed/ClearAllButton.svelte';
	import GridSizeSetting from '@/components/composed/GridSizeSetting.svelte';
	// State for the app
	let gridWidth = $state(20);
	let gridHeight = $state(20);

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
			const img = new Image();

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
				variant={beadsStore.handMode ? 'default' : 'outline'}
				size="icon"
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

			<div class="cell-history-buttons">
				<div class="history-buttons">
					<Button
						aria-label={beadsStore.history.cursor > 0 ? 'undo' : 'undo (disabled)'}
						disabled={beadsStore.history.cursor === 0}
						variant="outline"
						size="icon"
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
