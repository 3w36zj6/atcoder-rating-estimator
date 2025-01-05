import type { AtCoderContestResult } from './AtCoderContestResult';

type ContestResult = Pick<AtCoderContestResult, 'performance'>;

export const calculateRating = (contestResults: ContestResult[]): number => {
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
