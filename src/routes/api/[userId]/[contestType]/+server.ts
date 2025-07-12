import { getUserContestResult } from '$lib/server/getUserContestResult';
import { json } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	if (params.contestType !== 'algorithm' && params.contestType !== 'heuristic') {
		return json([], { status: 400 });
	}

	const performances = await getUserContestResult(params.userId, params.contestType);

	return json(performances);
};
