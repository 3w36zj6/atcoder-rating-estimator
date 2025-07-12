import type { UserContestResult } from '$lib/types/UserContestResult';
import { fetchAtCoderContestResults } from './fetchAtCoderContestResults';
import { fetchAtCoderContests } from './fetchAtCoderContests';

export const getUserContestResult = async (
	userId: string,
	contestType: 'algorithm' | 'heuristic'
): Promise<UserContestResult[]> => {
	const contestResults = await fetchAtCoderContestResults(userId, contestType);
	const contests = await fetchAtCoderContests();

	const contestMap = new Map(contests.map((c) => [c.contestScreenName, c]));

	const ratedResults = contestResults.filter((c) => c.isRated && c.performance > 0);

	return ratedResults.map((result) => {
		const contestInfo = contestMap.get(result.contestScreenName);
		let weight = 1;
		// NOTE: All contests before 2024 have a weight of 1.
		// https://atcoder.jp/posts/1380
		const endYear = new Date(result.endTime).getFullYear();
		if (endYear > 2024 && contestInfo) {
			weight = contestInfo.durationSecond >= 24 * 60 * 60 ? 1 : 0.5;
		}
		return {
			performance: result.performance,
			endTime: result.endTime,
			weight
		};
	});
};
