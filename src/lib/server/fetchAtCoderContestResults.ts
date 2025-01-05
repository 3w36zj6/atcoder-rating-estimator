import type { AtCoderContestResult } from '$lib/AtCoderContestResult';

export type ContestType = 'algorithm' | 'heuristic';

type RawAtCoderContestResult = {
	IsRated: boolean;
	Place: number;
	OldRating: number;
	NewRating: number;
	Performance: number;
	InnerPerformance: number;
	ContestScreenName: string;
	ContestName: string;
	ContestNameEn: string;
	EndTime: string;
};

export const fetchAtCoderContestResults = async (
	userId: string,
	contestType: ContestType
): Promise<AtCoderContestResult[]> => {
	const url = `https://atcoder.jp/users/${userId}/history/json?contestType=${contestType}`;
	const response = await fetch(url);
	const contestResults = await response.json<RawAtCoderContestResult[]>();

	return contestResults.map((contestResult) => {
		return {
			isRated: contestResult.IsRated,
			place: contestResult.Place,
			oldRating: contestResult.OldRating,
			newRating: contestResult.NewRating,
			performance: contestResult.Performance,
			innerPerformance: contestResult.InnerPerformance,
			contestScreenName: contestResult.ContestScreenName,
			contestName: contestResult.ContestName,
			contestNameEn: contestResult.ContestNameEn,
			endTime: contestResult.EndTime
		};
	});
};
