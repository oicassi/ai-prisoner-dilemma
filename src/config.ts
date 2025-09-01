import { config } from 'dotenv'

config()

const openRouterConfig = {
	apiKey: process.env.OPEN_ROUTER_API_KEY,
	baseUrl: process.env.OPEN_ROUTER_BASE_URL
}

const gameConfig = {
	noiseLevel: Number(process.env.NOISE_LEVEL) || 0.1,
	minRounds: Number(process.env.MIN_ROUNDS) || 10,
	maxRounds: Number(process.env.MAX_ROUNDS) || 20
}

export { openRouterConfig, gameConfig }
