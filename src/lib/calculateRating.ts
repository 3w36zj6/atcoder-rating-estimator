import type { UserContestResult } from './types/UserContestResult';

export const applyRatingCorrection = (rating: number): number => {
	if (rating < 400) {
		return 400 / Math.exp((400 - rating) / 400);
	}
	return rating;
};

export const inverseRatingCorrection = (correctedRating: number): number => {
	if (correctedRating >= 400) {
		return correctedRating;
	}
	return 400 - 400 * Math.log(400 / correctedRating);
};

export const calculateAlgorithmRating = (contestResults: UserContestResult[]): number => {
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

	let rating = gInv(weightedGSum / weightSum) - f(performances.length);
	rating = applyRatingCorrection(rating);
	return rating;
};

export const calculateHeuristicRating = (contestResults: UserContestResult[]): number => {
	const S = 724.4744301;
	const R = 0.8271973364;

	const extendedPerformances = contestResults
		.map((result) => result.performance)
		.flatMap((p) => Array.from({ length: 100 }, (_, j) => p - S * Math.log(j + 1)))
		.sort((a, b) => b - a);

	let ratingDenominator = 0;
	let ratingNumerator = 0;

	for (let i = 0; i < 100; i++) {
		const power = R ** (i + 1);
		ratingDenominator += extendedPerformances[i] * power;
		ratingNumerator += power;
	}

	let rating = ratingDenominator / ratingNumerator;
	rating = applyRatingCorrection(rating);
	return rating;
};

export const calculateHeuristicRatingV2 = (
	contestResults: UserContestResult[],
	baseDate: Date
): number => {
	const S = 724.4744301;
	const R = 0.8271973364;

	const base = new Date(baseDate);
	base.setHours(0, 0, 0, 0);
	const baseTime = base.getTime();

	const decayedPerformances = contestResults.map(({ performance, endTime }) => {
		if (endTime == undefined) {
			throw new Error('invalid contest result: endTime is undefined');
		}
		const d = new Date(endTime);
		d.setHours(0, 0, 0, 0);
		const daysSince = Math.floor((baseTime - d.getTime()) / (1000 * 60 * 60 * 24));
		return performance + 150 - 100 * (daysSince / 365);
	});

	const weightedPerformances: { p: number; w: number }[] = contestResults.map((result, i) => {
		if (result.weight === undefined) {
			throw new Error('invalid contest result: weight is undefined');
		}
		return {
			p: decayedPerformances[i],
			w: result.weight
		};
	});

	const Q: { q: number; w: number }[] = [];
	for (const { p, w } of weightedPerformances) {
		for (let j = 1; j <= 100; j++) {
			Q.push({ q: p - S * Math.log(j), w });
		}
	}

	Q.sort((a, b) => b.q - a.q);

	const s: number[] = [];
	let sumW = 0;
	for (let i = 0; i < Q.length; i++) {
		sumW += Q[i].w;
		s.push(sumW);
	}

	let rating = 0;
	for (let i = 0; i < Q.length; i++) {
		const si_1 = i === 0 ? 0 : s[i - 1];
		const si = s[i];
		rating += Q[i].q * (R ** si_1 - R ** si);
	}

	rating = applyRatingCorrection(rating);
	return rating;
};
