import { openRouterConfig } from './config'
import { InMemoryPersistenceClient } from '@driven/persistence/in-memory/client'
import { OpenRouterAiClient } from '@driven/ai/open-router/client'
import { AiService } from '@/domain/game/service'
import { MODELS } from './constants'

const persistence = new InMemoryPersistenceClient()
const aiClient = new OpenRouterAiClient(openRouterConfig.baseUrl!, openRouterConfig.apiKey!)
const service = new AiService(aiClient, persistence, MODELS)

const main = async () => {
	console.log('========== AI PRISONER DILEMMA ==========\n\n')
	console.log('---------- SIMPLE TEST ----------')
	await service.testMessage()
	console.log('\n\n---------- WARMUP MODELS ----------\n')
	await service.warmUpModels()
	console.log('\n\n---------- PLAY GAME ----------\n')
	await service.playTournament()
}

main()
