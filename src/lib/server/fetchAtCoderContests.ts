import type { AtCoderContest } from '$lib/server/types/AtCoderContest';

type RawAtCoderContests = {
	id: string;
	start_epoch_second: number;
	duration_second: number;
	title: string;
	rate_change: string;
};

export const fetchAtCoderContests = async (): Promise<AtCoderContest[]> => {
	// https://github.com/kenkoooo/AtCoderProblems/blob/master/doc/api.md
	const url = 'https://kenkoooo.com/atcoder/resources/contests.json';
	const response = await fetch(url);
	const contests = await response.json<RawAtCoderContests[]>();

	return contests.map((contest) => {
		return {
			contestScreenName: `${contest.id}.contest.atcoder.jp`,
			startTime: new Date(contest.start_epoch_second * 1000),
			durationSecond: contest.duration_second,
			contestName: contest.title
		};
	});
};
