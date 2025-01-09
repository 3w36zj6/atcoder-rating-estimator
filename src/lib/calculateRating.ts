import type { AtCoderContestResult } from './AtCoderContestResult';

type ContestResult = Pick<AtCoderContestResult, 'performance'>;

export const calculateAlgorithmRating = (contestResults: ContestResult[]): number => {
	if (contestResults.length === 0) {
		throw new Error('performances is empty');
	}
	const f = (n: number) => {
		const F = (n: number) => {
			let numerator = 0;
			let denominator = 0;
			for (let i = 1; i <= n; i++) {
				numerator += Math.pow(0.81, i);
				denominator += Math.pow(0.9, i);
			}
			return Math.sqrt(numerator) / denominator;
		};
		const FInf = Math.sqrt(0.81 / (1 - 0.81)) / (0.9 / (1 - 0.9));
		return ((F(n) - FInf) / (F(1) - FInf)) * 1200;
	};
	const g = (x: number) => Math.pow(2, x / 800);
	const gInv = (y: number) => 800 * Math.log2(y);

	let weightedGSum = 0;
	let weightSum = 0;
	const performances = contestResults.map((result) => result.performance).reverse();
	for (let i = 0; i < performances.length; i++) {
		const weight = Math.pow(0.9, i);
		weightedGSum += g(performances[i]) * weight;
		weightSum += weight;
	}

	let rate = gInv(weightedGSum / weightSum) - f(performances.length);
	if (rate < 400) {
		rate = 400 / Math.exp((400 - rate) / 400);
	}
	return rate;
};

export const calculateHeuristicRating = (contestResults: ContestResult[]): number => {
	const S = 724.4744301;
	const R = 0.8271973364;

	const extendedPerformances = contestResults
		.map((result) => result.performance)
		.flatMap((p) => Array.from({ length: 100 }, (_, j) => p - S * Math.log(j + 1)))
		.sort((a, b) => b - a);

	let rateDenominator = 0;
	let rateNumerator = 0;

	for (let i = 0; i < 100; i++) {
		const power = R ** (i + 1);
		rateDenominator += extendedPerformances[i] * power;
		rateNumerator += power;
	}

	let rate = rateDenominator / rateNumerator;
	if (rate < 400) {
		rate = 400 / Math.exp((400 - rate) / 400);
	}

	return rate;
};
