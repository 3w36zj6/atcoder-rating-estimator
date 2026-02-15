<script lang="ts">
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
		calculateHeuristicRatingV2,
		inverseRatingCorrection
	} from '$lib/calculateRating';
	import type { UserContestResult } from '$lib/types/UserContestResult';

	let performancesTextArea: string = '';
	let rating: number = 0;
	let chart: Chart | undefined;
	let chartCanvas: HTMLCanvasElement;
	let selectedContestType: 'algorithm' | 'heuristic_v1' | 'heuristic_v2' = 'algorithm';
	let atcoderID = 'tourist';
	const urlSearchParams = page.url.searchParams;

	type ChartDataset = {
		label: string;
		borderColor: string;
		backgroundColor: string;
		data: number[];
	};

	const drawChart = (datasets: ChartDataset[]) => {
		if (chart) {
			chart.destroy();
		}
		const chartData = {
			labels: [...Array(320).keys()].map((i) => {
				return i * 10;
			}),
			datasets: datasets.map((ds) => ({
				label: ds.label,
				backgroundColor: ds.backgroundColor,
				borderColor: ds.borderColor,
				pointRadius: 0,
				data: ds.data
			}))
		};

		const drawBackgroundPlugin: Plugin = {
			id: 'drawBackgroundPlugin',
			beforeDraw: (chart: Chart) => {
				const xScale = chart.scales['x'];
				const yScale = chart.scales['y'];
				const ctx = chart.ctx;

				for (const rating of [...Array(10).keys()].map((i) => {
					return i * 400;
				})) {
					ctx.fillStyle = `rgba(${getRatingColor(rating).join(', ')}, 0.2)`;
					ctx.fillRect(
						xScale.left,
						Math.min(yScale.getPixelForValue(rating + 400), yScale.bottom),
						xScale.width,
						Math.min(yScale.getPixelForValue(rating), yScale.bottom) -
							Math.min(yScale.getPixelForValue(rating + 400), yScale.bottom)
					);
					ctx.fillStyle = `rgba(${getRatingColor(rating).join(', ')}, 0.5)`;
					ctx.fillRect(
						xScale.getPixelForValue(rating),
						yScale.bottom,
						Math.min(xScale.getPixelForValue(rating + 400), xScale.right) -
							Math.min(xScale.getPixelForValue(rating), xScale.right),
						5
					);
				}

				const currentRating = rating;
				ctx.fillStyle = `rgba(${getRatingColor(currentRating).join(', ')}, 0.5)`;
				ctx.fillRect(xScale.left, yScale.getPixelForValue(currentRating), xScale.width, 3);
			}
		};

		const hasMultipleDatasets = datasets.length > 1;

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
						displayColors: hasMultipleDatasets,
						usePointStyle: true,
						callbacks: {
							title: (tooltipItems) => {
								return `Performance: ${tooltipItems[0].parsed.x}`;
							},
							label: (tooltipItem) => {
								const roundedRating = Math.round(tooltipItem.parsed.y);
								if (hasMultipleDatasets) {
									return `${tooltipItem.dataset.label}: ${roundedRating}`;
								}
								return `Rating: ${roundedRating}`;
							},
							labelColor: (tooltipItem) => {
								const color = tooltipItem.dataset.borderColor as string;
								return {
									borderColor: color,
									backgroundColor: color,
									borderWidth: 0
								};
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

	let calculationDate: string = new Date().toISOString().slice(0, 10);

	const handleCalculate = () => {
		if (selectedContestType === 'heuristic_v2') {
			const performances = performancesTextArea
				.split('\n')
				.map((line) => {
					const [p, w, dateStr] = line.split(',');
					const performance = inverseRatingCorrection(Number(p));
					const weight = Number(w);
					const endTime = new Date(dateStr);
					if (isNaN(performance) || isNaN(weight) || isNaN(endTime.getTime())) return null;
					return { performance, weight, endTime };
				})
				.filter((p) => p !== null) as UserContestResult[];

			if (performances.length === 0) {
				performances.push({ performance: 0, weight: 1, endTime: new Date() });
			}

			const baseDate = new Date(calculationDate);
			baseDate.setHours(0, 0, 0, 0);

			rating = calculateHeuristicRatingV2(performances, baseDate);

			const weights = [0.5, 1] as const;
			const colors = [
				{ border: 'rgba(54, 162, 235, 0.8)', bg: 'rgba(54, 162, 235, 0)' },
				{ border: 'rgba(255, 99, 132, 0.8)', bg: 'rgba(255, 99, 132, 0)' }
			];
			const chartDatasets: ChartDataset[] = weights.map((w, idx) => {
				const ratingsForWeight: number[] = [];
				for (const i of [...Array(320).keys()]) {
					ratingsForWeight.push(
						calculateHeuristicRatingV2(
							[...performances, { performance: i * 10, weight: w, endTime: baseDate }],
							baseDate
						)
					);
				}
				return {
					label: `New Rating (weight=${w})`,
					borderColor: colors[idx].border,
					backgroundColor: colors[idx].bg,
					data: ratingsForWeight
				};
			});
			drawChart(chartDatasets);
			return;
		}
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

		rating = calculateRating(performances);
		let newRatings: number[] = [];
		for (const i of [...Array(320).keys()]) {
			newRatings.push(calculateRating([...performances, { performance: i * 10 }]));
		}
		drawChart([
			{
				label: 'New Rating',
				borderColor: 'rgb(128, 128, 128, 0.8)',
				backgroundColor: 'rgb(128, 128, 128, 0)',
				data: newRatings
			}
		]);
	};

	const handleImport = () => {
		urlSearchParams.set('id', atcoderID);
		if (browser) {
			goto(`?${urlSearchParams.toString()}`, { replaceState: true });

			const url = `./api/${atcoderID}/${selectedContestType === 'algorithm' ? 'algorithm' : 'heuristic'}`;
			fetch(url)
				.then((response) => response.json<UserContestResult[]>())
				.then((contestResults) => {
					if (selectedContestType === 'heuristic_v2') {
						performancesTextArea = contestResults
							.map((c) => {
								if (c.endTime === undefined || c.weight === undefined) {
									throw new Error('Invalid contest result: endTime or weight is undefined');
								}
								const performance = Math.floor(applyRatingCorrection(c.performance));
								const weight = c.weight;
								const endDate = new Date(c.endTime);
								return `${performance},${weight},${endDate.toISOString()}`;
							})
							.join('\n');
					} else {
						performancesTextArea = contestResults
							.map((contest) => Math.floor(applyRatingCorrection(contest.performance)).toString())
							.join('\n');
					}
					handleCalculate();
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
	<link rel="canonical" href="https://atcoder-rating-estimator.pages.dev/" />
	<meta property="og:site_name" content="AtCoder Rating Estimator" />
	<meta property="og:url" content="https://atcoder-rating-estimator.pages.dev/" />
	<meta property="og:title" content="AtCoder Rating Estimator" />
	<meta
		property="og:description"
		content="AtCoderのRatedコンテストで目標レーティングへの到達に必要なパフォーマンスを計算しグラフで表示します。"
	/>
	<meta property="og:type" content="website" />
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
		{#if selectedContestType === 'heuristic_v2'}
			<div class="mb-4">
				<p>パフォーマンス・重み・コンテストの終了日時をカンマ区切りで入力してください。</p>
				<textarea
					bind:value={performancesTextArea}
					placeholder="performance,weight,endTime"
					class="h-[200px] w-full max-w-[400px] rounded-md border border-gray-300 px-4 py-2 text-gray-700"
				></textarea>
			</div>
			<div class="mb-4">
				<label class="flex items-center gap-2">
					<span class="text-sm text-gray-700">計算基準日:</span>
					<input
						type="date"
						bind:value={calculationDate}
						class="rounded-md border border-gray-300 px-2 py-1 text-gray-700"
					/>
				</label>
			</div>
		{:else}
			<div class="mb-4">
				<textarea
					bind:value={performancesTextArea}
					placeholder="performance"
					class="h-[200px] w-[200px] rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:border-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
				></textarea>
			</div>
		{/if}
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
		<p>{rating || '未参加'}</p>
	</section>
	<section>
		<h2>次回のレーティング</h2>
		<div class="relative w-full max-w-[900px]"><canvas bind:this={chartCanvas}></canvas></div>
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
			<li>
				<a href="https://img.atcoder.jp/file/AHC_rating_v2.pdf">AHC Rating System (ver.2)</a>
			</li>
		</ul>
	</section>
</main>
