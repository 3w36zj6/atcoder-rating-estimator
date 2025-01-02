export type AtCoderContestResult = {
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

export type ContestType = 'algorithm' | 'heuristic';

export const fetchAtCoderContestResults = async (
	userId: string,
	contestType: ContestType
): Promise<AtCoderContestResult[]> => {
	const url = `https://atcoder.jp/users/${userId}/history/json?contestType=${contestType}`;
	const response = await fetch(url);
	const contestResults = await response.json();
	return contestResults as AtCoderContestResult[];
};
