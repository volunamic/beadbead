<script lang="ts">
	import { beadsStore } from '$lib/beads/stores.svelte';
</script>

<div class="grid ">
<div class="mb-4 space-y-1">
    <h4 class="font-medium leading-none">Color Adjustment</h4>
    <p class="text-muted-foreground text-sm">
      Adjust the color of the selected color.
    </p>
  </div>
<div class="cell-hue-slider">
	<input
		type="range"
		class="hue-gradient"
		min={0}
		max={360}
		step={1}
		bind:value={beadsStore.colorPalette[beadsStore.selectedColorId].h}
	/>
</div>
<div class="cell-sat-slider">
	<input
		type="range"
		class="sat-gradient"
		style="--h:{beadsStore.colorPalette[beadsStore.selectedColorId].h}; --l:{beadsStore
			.colorPalette[beadsStore.selectedColorId].l}%"
		min={0}
		max={100}
		step={1}
		bind:value={beadsStore.colorPalette[beadsStore.selectedColorId].s}
	/>
</div>
<div class="cell-light-slider">
	<input
		type="range"
		class="light-gradient"
		style="--h:{beadsStore.colorPalette[beadsStore.selectedColorId].h}; --s:{beadsStore
			.colorPalette[beadsStore.selectedColorId].s}%"
		min={0}
		max={100}
		step={1}
		bind:value={beadsStore.colorPalette[beadsStore.selectedColorId].l}
	/>
</div>
</div>

<style>
	input[type='range'] {
		-webkit-appearance: none;
		width: 90%;
		height: 0.8em;
		border-radius: 0.2em;
		cursor: pointer;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 1.2em;
		width: 1.2em;
		border-radius: 1.2em;
		border: none;
		background: grey;
		cursor: pointer;
		box-shadow: 0 0 0.2em rgba(0, 0, 0, 0.4);
	}
	.hue-gradient {
		background: linear-gradient(
			to right,
			rgb(255, 0, 0) 0%,
			rgb(255, 255, 0) 17%,
			rgb(0, 255, 0) 33%,
			rgb(0, 255, 255) 50%,
			rgb(0, 0, 255) 67%,
			rgb(255, 0, 255) 83%,
			rgb(255, 0, 0) 100%
		);
	}

	.sat-gradient {
		background: linear-gradient(
			to right,
			hsl(var(--h), 0%, var(--l)),
			hsl(var(--h), 100%, var(--l))
		);
	}

	.light-gradient {
		background: linear-gradient(
			to right,
			hsl(var(--h), var(--s), 0%),
			hsl(var(--h), var(--s), 50%),
			hsl(var(--h), var(--s), 100%)
		);
	}
</style>
