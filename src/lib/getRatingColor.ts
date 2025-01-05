export const getRatingColor = (rating: number): [number, number, number] => {
	if (rating < 400) return [128, 128, 128];
	else if (rating < 800) return [128, 64, 0];
	else if (rating < 1200) return [0, 128, 0];
	else if (rating < 1600) return [0, 192, 192];
	else if (rating < 2000) return [0, 0, 255];
	else if (rating < 2400) return [192, 192, 0];
	else if (rating < 2800) return [255, 128, 0];
	return [255, 0, 0];
};
