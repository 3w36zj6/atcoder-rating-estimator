<script lang="ts">
	import type { AtCoderContestResult } from '$lib/AtCoderContestResult';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { Chart, type Plugin } from 'chart.js/auto';
	import { getRatingColor } from '$lib/getRatingColor';
	import {
		applyRatingCorrection,
		calculateAlgorithmRating,
		calculateHeuristicRating,
		inverseRatingCorrection
	} from '$lib/calculateRating';

	let performancesTextArea: string = '';
	let rate: number = 0;
	let chart: Chart | undefined;
	let chartCanvas: HTMLCanvasElement;
	let selectedContestType: 'algorithm' | 'heuristic_v1' | 'heuristic_v2' = 'algorithm';
	let atcoderID = 'tourist';
	const urlSearchParams = page.url.searchParams;

	const drawChart = (rates: number[]) => {
		if (chart) {
			chart.destroy();
		}
		const chartData = {
			labels: [...Array(320).keys()].map((i) => {
				return i * 10;
			}),
			datasets: [
				{
					title: 'Performance',
					label: 'New Rating',
					backgroundColor: 'rgb(128, 128, 128, 0)',
					borderColor: 'rgb(128, 128, 128 ,0.8)',
					pointRadius: 0,
					data: rates
				}
			]
		};

		const drawBackgroundPlugin: Plugin = {
			id: 'drawBackgroundPlugin',
			beforeDraw: (chart: Chart) => {
				const xScale = chart.scales['x'];
				const yScale = chart.scales['y'];
				const ctx = chart.ctx;

				for (const rate of [...Array(10).keys()].map((i) => {
					return i * 400;
				})) {
					ctx.fillStyle = `rgba(${getRatingColor(rate).join(', ')}, 0.2)`;
					ctx.fillRect(
						xScale.left,
						Math.min(yScale.getPixelForValue(rate + 400), yScale.bottom),
						xScale.width,
						Math.min(yScale.getPixelForValue(rate), yScale.bottom) -
							Math.min(yScale.getPixelForValue(rate + 400), yScale.bottom)
					);
					ctx.fillStyle = `rgba(${getRatingColor(rate).join(', ')}, 0.5)`;
					ctx.fillRect(
						xScale.getPixelForValue(rate),
						yScale.bottom,
						Math.min(xScale.getPixelForValue(rate + 400), xScale.right) -
							Math.min(xScale.getPixelForValue(rate), xScale.right),
						5
					);
				}
			}
		};

		chart = new Chart(chartCanvas, {
			type: 'line',
			data: chartData,
			options: {
				responsive: true,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						intersect: false,
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						titleColor: 'rgba(255, 255, 255)',
						bodyColor: 'rgba(255, 255, 255)',
						titleFont: {
							style: 'normal'
						},
						displayColors: false,
						callbacks: {
							title: (tooltipItems) => {
								return `Performance: ${tooltipItems[0].parsed.x}`;
							},
							label: (tooltipItems) => {
								return `Rating: ${tooltipItems.parsed.y}`;
							}
						}
					}
				},
				scales: {
					x: {
						type: 'linear',
						title: {
							display: true,
							text: 'Performance'
						},
						ticks: {
							stepSize: 100,
							maxTicksLimit: 32,
							callback: (value) => {
								return value.toString();
							}
						}
					},
					y: {
						type: 'linear',
						title: {
							display: true,
							text: 'New Rating'
						},
						ticks: {
							stepSize: 100,
							callback: (value) => {
								return value.toString();
							}
						}
					}
				}
			},
			plugins: [drawBackgroundPlugin]
		});
	};

	const handleCalculate = () => {
		const performances = performancesTextArea
			.split('\n')
			.map((p) => inverseRatingCorrection(parseInt(p)))
			.filter((p) => !isNaN(p))
			.map((p) => ({ performance: p }));

		if (performances.length === 0) {
			performances.push({ performance: 0 });
		}

		const calculateRating =
			selectedContestType === 'algorithm' ? calculateAlgorithmRating : calculateHeuristicRating;

		rate = calculateRating(performances);
		let newRates: number[] = [];
		for (const i of [...Array(320).keys()]) {
			newRates.push(calculateRating([...performances, { performance: i * 10 }]));
		}
		drawChart(newRates);
	};

	const handleImport = () => {
		const performances: number[] = [];
		urlSearchParams.set('id', atcoderID);
		if (browser) {
			goto(`?${urlSearchParams.toString()}`, { replaceState: true });

			const url = `./api/${atcoderID}/${selectedContestType === 'algorithm' ? 'algorithm' : 'heuristic'}`;
			fetch(url)
				.then((response) => response.json<AtCoderContestResult[]>())
				.then((contestResults) => {
					for (const contest of contestResults) {
						if (contest.isRated) {
							performances.push(Math.floor(applyRatingCorrection(contest.performance)));
						}
					}
					if (performances) {
						performancesTextArea = performances.join('\n');
						handleCalculate();
					}
				})
				.catch((error) => {
					console.error(error);
				});
		}
	};

	onMount(() => {
		const id = urlSearchParams.get('id');
		if (id) {
			atcoderID = id;
			handleImport();
		} else {
			handleCalculate();
		}
	});
</script>

<svelte:head>
	<title>AtCoder Rating Estimator</title>
	<meta
		name="description"
		content="AtCoderのRatedコンテストで目標レーティングへの到達に必要なパフォーマンスを計算しグラフで表示します。"
	/>
</svelte:head>

<main>
	<section>
		<h1>AtCoder Rating Estimator</h1>
		<p>
			AtCoderのRatedコンテストで目標レーティングへの到達に必要なパフォーマンスを計算しグラフで表示します。
		</p>
	</section>
	<section>
		<h2>コンテスト区分</h2>
		<div class="mb-4 flex gap-4">
			<label class="flex items-center gap-2">
				<input
					type="radio"
					value="algorithm"
					bind:group={selectedContestType}
					class="text-blue-500 focus:ring-blue-500"
				/>
				<span class="text-sm text-gray-700">Algorithm</span>
				<label class="flex items-center gap-2">
					<input
						type="radio"
						value="heuristic_v1"
						bind:group={selectedContestType}
						class="text-blue-500 focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">Heuristic (v1)</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="radio"
						value="heuristic_v2"
						bind:group={selectedContestType}
						disabled
						class="text-blue-500 focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">Heuristic (v2)</span>
				</label>
			</label>
		</div>
	</section>
	<section>
		<h2>過去のパフォーマンス</h2>
		<div class="mb-4">
			<label for="atcoderId" class="flex items-center gap-4">
				<span class="min-w-[60px] text-sm font-medium text-gray-700">AtCoder ID:</span>
				<input
					id="atcoderId"
					bind:value={atcoderID}
					class="w-[200px] rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:border-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</label>
		</div>

		<div class="mb-4">
			<button
				on:click={handleImport}
				class="rounded-md bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				atcoder.jpからコンテスト履歴をインポート
			</button>
		</div>
		<p>
			改行区切りで入力してください。パフォーマンスの値はマイナス補正適用後の値を入力してください。
		</p>
		<div class="mb-4">
			<textarea
				bind:value={performancesTextArea}
				placeholder="enter your performances."
				class="h-[200px] w-[200px] rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:border-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
			></textarea>
		</div>
		<div class="mb-4">
			<button
				on:click={handleCalculate}
				class="rounded-md bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				計算
			</button>
		</div>
	</section>
	<section>
		<h2>現在のレーティング</h2>
		<p>{rate || '未参加'}</p>
	</section>
	<section>
		<h2>次回のレーティング</h2>
		<div id="chart"><canvas bind:this={chartCanvas}></canvas></div>
	</section>
	<section>
		<h2>Twitterでつぶやく</h2>
		<ul>
			<li>
				<a
					href="https://twitter.com/intent/tweet?hashtags=atcoder&amp;text=AtCoder%20Rating%20Estimator%20-%20{atcoderID}&amp;url={page.url
						.toString()
						.split('?')[0]}?id={atcoderID}">Tweet</a
				>
			</li>
		</ul>
	</section>
	<section>
		<h2>View on GitHub</h2>
		<p>
			<a href="https://github.com/3w36zj6/atcoder-rating-estimator"
				><img
					alt="atcoder-rating-estimator"
					src="https://gh-card.dev/repos/3w36zj6/atcoder-rating-estimator.svg?fullname="
				/></a
			>
		</p>
	</section>
	<section>
		<h2>Bibliography</h2>
		<ul>
			<li>
				<a href="https://www.dropbox.com/s/ixci4amralioaif/rating.pdf"
					>AtCoder Rating System ver. 1.00</a
				>
			</li>
			<li>
				<a href="https://www.dropbox.com/s/ne358pdixfafppm/AHC_rating.pdf">AHC Rating System</a>
			</li>
		</ul>
	</section>
</main>

<style>
	textarea {
		width: 150px;
		height: 200px;
	}
	#chart {
		position: relative;
		width: 900px;
	}
</style>
