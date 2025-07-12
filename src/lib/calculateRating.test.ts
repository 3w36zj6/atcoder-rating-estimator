import { describe, expect, it } from 'vitest';
import {
	calculateAlgorithmRating,
	calculateHeuristicRating,
	calculateHeuristicRatingV2
} from './calculateRating';

describe('calculateAlgorithmRating', () => {
	it("should return the correct rating for tourist's performances", () => {
		// https://atcoder.jp/users/tourist/history
		const contestResults = [
			{ performance: 3920 },
			{ performance: 3200 },
			{ performance: 4310 },
			{ performance: 4391 },
			{ performance: 4356 },
			{ performance: 4017 },
			{ performance: 3687 },
			{ performance: 4152 },
			{ performance: 4395 },
			{ performance: 4415 }
		];
		const expectedRatings = [2720, 2851, 3368, 3647, 3802, 3834, 3806, 3860, 3949, 4021];

		for (const i of Array(contestResults.length).keys()) {
			expect(calculateAlgorithmRating(contestResults.slice(0, i + 1))).toBeCloseTo(
				expectedRatings[i],
				0
			);
		}
	});
	it("should return the correct rating for chokudai's performances", () => {
		// https://atcoder.jp/users/chokudai/history
		const contestResults = [
			{ performance: 2455 },
			{ performance: 3192 },
			{ performance: 3623 },
			{ performance: 2974 },
			{ performance: 2813 },
			{ performance: 3002 },
			{ performance: 3311 },
			{ performance: 2998 },
			{ performance: 2898 },
			{ performance: 3457 }
		];
		const expectedRatings = [1255, 2155, 2676, 2728, 2733, 2775, 2872, 2887, 2885, 2978];

		for (const i of Array(contestResults.length).keys()) {
			expect(calculateAlgorithmRating(contestResults.slice(0, i + 1))).toBeCloseTo(
				expectedRatings[i],
				0
			);
		}
	});
});

describe('calculateHeuristicRating', () => {
	it("should return the correct rating for tourist's performances", () => {
		// https://atcoder.jp/users/tourist/history

		const contestResults = [
			{ performance: 3254 },
			{ performance: 2119 },
			{ performance: 2471 },
			{ performance: 1297 },
			{ performance: 1446 }
		];
		const expectedRatings = [2254, 2299, 2382, 2382, 2383];

		for (const i of Array(contestResults.length).keys()) {
			expect(calculateHeuristicRating(contestResults.slice(0, i + 1))).toBeCloseTo(
				expectedRatings[i],
				0
			);
		}
	});
	it("should return the correct rating for chokudai's performances", () => {
		// https://atcoder.jp/users/chokudai/history
		const contestResults = [
			{ performance: 1338 },
			{ performance: 2399 },
			{ performance: 2531 },
			{ performance: 2789 },
			{ performance: 2269 }
		];
		const expectedRatings = [343, 1453, 1850, 2160, 2215];

		for (const i of Array(contestResults.length).keys()) {
			expect(calculateHeuristicRating(contestResults.slice(0, i + 1))).toBeCloseTo(
				expectedRatings[i],
				0
			);
		}
	});
});

describe('calculateHeuristicRatingV2', () => {
	it("should return the correct rating for tourist's performances", () => {
		// https://atcoder.jp/users/tourist/history

		const contestResults = [
			{ performance: 3254, endTime: new Date('2021-04-25T23:00:00+09:00'), weight: 1 },
			{ performance: 2119, endTime: new Date('2021-06-26T19:00:00+09:00'), weight: 1 },
			{ performance: 2471, endTime: new Date('2024-01-13T19:00:00+09:00'), weight: 1 },
			{ performance: 1297, endTime: new Date('2024-04-07T23:00:00+09:00'), weight: 1 },
			{ performance: 1446, endTime: new Date('2024-07-21T19:00:00+09:00'), weight: 1 }
		];

		expect(
			calculateHeuristicRatingV2(contestResults, new Date('2025-07-06T23:00:00+09:00'))
		).toBeCloseTo(2180, 0);
	});
});
