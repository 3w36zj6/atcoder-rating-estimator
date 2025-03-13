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
	// NOTE: Using proxy to bypass AtCoder's Web Application Firewall.
	//const url = `https://atcoder.jp/users/${userId}/history/json?contestType=${contestType === 'algorithm' ? 'algo' : 'heuristic'}`;
	const url = `https://script.google.com/macros/s/AKfycby-CKUsGoe7YZBeIf9FMwvCK6JIfqnVkN-8764iNkRApGPns158Q6vJPxpDdnGfsDXU/exec?type=${contestType === 'algorithm' ? 'algo' : 'heuristic'}&id=${userId}`;
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
