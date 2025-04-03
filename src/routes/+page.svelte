<script lang="ts">
	import { Point } from '$lib/geom/Point';
	import type { Polygon } from '$lib/geom/Polygon';
	import { Region, Voronoi } from '$lib/geom/Voronoi';
	import { Model } from '$lib/towngenerator/building/Model';
	import { Patch } from '$lib/towngenerator/building/Patch';
	import { AdministrationWard } from '$lib/towngenerator/wards/AdministrationWard';
	import { Castle } from '$lib/towngenerator/wards/Castle';
	import { Cathedral } from '$lib/towngenerator/wards/Cathedral';
	import { CommonWard } from '$lib/towngenerator/wards/CommonWard';
	import { CraftsmenWard } from '$lib/towngenerator/wards/CraftsmenWard';
	import { Farm } from '$lib/towngenerator/wards/Farm';
	import { GateWard } from '$lib/towngenerator/wards/GateWard';
	import { Market } from '$lib/towngenerator/wards/Market';
	import { MerchantWard } from '$lib/towngenerator/wards/MerchantWard';
	import { MilitaryWard } from '$lib/towngenerator/wards/MilitaryWard';
	import { Park } from '$lib/towngenerator/wards/Park';
	import { PatriciateWard } from '$lib/towngenerator/wards/PatriciateWard';
	import { Slum } from '$lib/towngenerator/wards/Slum';
	import { MathUtils } from '$lib/utils/MathUtils';
	import { Random } from '$lib/utils/Random';
	import { onMount } from 'svelte';
	import type { MultiPolygon } from '$lib/towngenerator/building/Building';

	let model: Model | undefined = $state();
	const thinkness = 1;

	let allPoints = $derived([
		...(model?.streets.flatMap((x) => x.vertices) ?? []),
		...(model?.patches
			.flatMap((x) => x.ward?.geometry ?? [])
			.flatMap((x) => x.polygons.flatMap((x) => x.vertices)) ?? [])
	]);
	let minX = $derived(Math.min(...allPoints.map((x) => x.x)));
	let minY = $derived(Math.min(...allPoints.map((x) => x.y)));
	let maxX = $derived(Math.max(...allPoints.map((x) => x.x)));
	let maxY = $derived(Math.max(...allPoints.map((x) => x.y)));
	let width = $derived(maxX - minX);
	let height = $derived(maxY - minY);

	let regions: Region[] = $state([]);
	let state_patches: Patch[] = $state([]);
	let state_inner: Patch[] = $state([]);
	let state_center: Point = $state(new Point(0, 0));
	const wallsNeeded = true;

	onMount(() => {
		setTimeout(() => {
			model = new Model(20, 1);
			//  model = new Model(15, 1824045469);

			// remove all patches without vertices
			const patches = model.patches;

			const centerPoints = patches.map((p) => p.shape.center);
			minX = Math.min(...centerPoints.map((p) => p.x));
			minY = Math.min(...centerPoints.map((p) => p.y));
			maxX = Math.max(...centerPoints.map((p) => p.x));
			maxY = Math.max(...centerPoints.map((p) => p.y));

			// state_center = center;
			state_patches = patches;
			state_inner = patches.filter((p) => p.withinCity);
		}, 3000);
	});

	// function unionSvg(patche: Patch) {
	// 	paper.setup(new paper.Size(100, 100));
	// 	const polygons = patche.ward?.geometry.map(polygonToPath) ?? [];
	// 	const paths = polygons.map(paper.Path.create);
	// 	const union = paths.reduce(
	// 		(acc, path) => {
	// 			if (acc) {
	// 				return acc.unite(path);
	// 			}
	// 			return path;
	// 		},
	// 		null as paper.PathItem | null
	// 	);
	// 	const svg = union?.exportSVG() as SVGElement;
	// 	const data = svg?.getAttribute('d');
	// 	return data;
	// }

	function polygonToPath(building: MultiPolygon) {
		return building.pathes
			.map(
				(p) =>
					p.vertices
						.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
						.join(' ') + 'z'
			)
			.join(' ');
	}
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<!-- <svg style="background-color: beige;" viewBox="{minX} {minY} {width} {height}">
	{#each state_patches as patch}
		<path
			d={patch.shape.vertices
				.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
				.join(' ') + 'z'}
			style="fill: {state_inner.includes(patch)
				? 'green'
				: 'blue'}; stroke: black; stroke-width: {thinkness};"
		/>
	{/each}
	<circle cx={state_center.x.toFixed(2)} cy={state_center.y.toFixed(2)} r="5" style="fill: red;" />
</svg> -->

<!-- {#if regions}
	<svg style="background-color: beige;" viewBox="{minX} {minY} {width} {height}">
		{#each regions as region}
			<path
				style="stroke: black; stroke-width: {thinkness}; fill:none;"
				d={region.vertices
					.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.c.x.toFixed(2)} ${p.c.y.toFixed(2)}`)
					.join(' ') + 'z'}
			/>
			<path
				d={region.vertices
					.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.c.x.toFixed(2)} ${p.c.y.toFixed(2)}`)
					.join(' ') + 'z'}
				style="fill: gray; stroke: none;"
			/>

			{#each region.vertices as triangle}
				<path
					d={[triangle.p1, triangle.p2, triangle.p3]
						.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
						.join(' ') + 'z'}
					class="triangle"
				/>
			{/each}
		{/each}
	</svg>
{/if} -->

{#if model}
	<svg style="background-color: beige;" viewBox="{minX} {minY} {width} {height}">
		{#each model.patches as patch}
			<g
				class="patch {patch.ward instanceof Cathedral
					? 'Cathedral'
					: patch.ward instanceof Slum
						? 'Slum'
						: patch.ward instanceof PatriciateWard
							? 'PatriciateWard'
							: patch.ward instanceof Park
								? 'Park'
								: patch.ward instanceof MilitaryWard
									? 'MilitaryWard'
									: patch.ward instanceof MerchantWard
										? 'MerchantWard'
										: patch.ward instanceof Market
											? 'Market'
											: patch.ward instanceof GateWard
												? 'GateWard'
												: patch.ward instanceof Farm
													? 'Farm'
													: patch.ward instanceof CraftsmenWard
														? 'CraftsmenWard'
														: patch.ward instanceof CommonWard
															? 'CommonWard'
															: patch.ward instanceof Cathedral
																? 'Cathedral'
																: patch.ward instanceof Castle
																	? 'Castle'
																	: patch.ward instanceof AdministrationWard
																		? 'AdministationWard'
																		: ''}"
			>
				{#each patch.ward?.geometry ?? [] as building}
					{#each building.polygons as p}
						<path class={p.type} d={polygonToPath(p)} />
					{/each}
				{/each}
			</g>
		{/each}
		{#if model.border}
			<path
				d={model.border.shape.vertices
					.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
					.join(' ') + 'z'}
				style="stroke: black; stroke-width: {thinkness}; fill: none;"
			/>
		{/if}
		{#each model.streets as street}
			<path
				class="street"
				d={street.vertices
					.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
					.join(' ')}
			/>
		{/each}

		{#each model.arteries as a}
			<path
				class="atery"
				d={a.vertices
					.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
					.join(' ')}
			/>
		{/each}

		{#each state_patches as patch}
			<path
				d={patch.shape.vertices
					.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
					.join(' ') + 'z'}
				style="stroke: black; stroke-width: 1; opacity: 0.1; fill:none"
			/>
		{/each}
		<circle
			cx={state_center.x.toFixed(2)}
			cy={state_center.y.toFixed(2)}
			r="5"
			style="fill: red; opacity: 0.2;"
		/>
	</svg>
{/if}

<style lang="scss">
	:root {
		--background: beige;
	}
	.triangle {
		stroke: red;
		stroke-width: 0.5;
		fill: transparent;
		&:hover {
			fill: red;
		}
	}
	.atery {
		stroke: green;
		stroke-width: 0.3;
		stroke-linecap: round;

		fill: none;
	}
	.street {
		stroke: var(--background);
		stroke: var(--background);
		outline: 0.5;
		outline-color: cadetblue;
		stroke-width: 2.5;
		stroke-linecap: round;
		fill: none;
	}
	.patch {
		.fill {
			fill: cadetblue;
		}
		.outline {
			fill: lightseagreen
		}

		stroke: none;
	}
	.Cathedral {
		.fill {
			fill: cornflowerblue;
		}
		.outline {
			fill: lightblue
		}
			}
</style>
