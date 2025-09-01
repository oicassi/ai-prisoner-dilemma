export const getRandomIntBetween = (min: number, max: number): number => {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export const checkChance = (percentage: number): boolean => {
	return Math.random() < percentage
}
