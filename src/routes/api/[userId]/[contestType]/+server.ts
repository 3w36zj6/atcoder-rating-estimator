import { fetchAtCoderContestResults } from '$lib/server/fetchAtCoderContestResults';
import { json } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	if (params.contestType !== 'algorithm' && params.contestType !== 'heuristic') {
		return json([], { status: 400 });
	}

	const contestResults = await fetchAtCoderContestResults(params.userId, params.contestType);

	return json(contestResults);
};
