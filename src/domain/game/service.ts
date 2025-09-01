import fs from 'fs'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { gameConfig } from '@/config'
import { MODELS } from '@/constants'
import { checkChance, getRandomIntBetween } from '@/utils/math'
import { IAi } from './ports/ai'
import { IPersistence } from './ports/persistence'
import {
	SYSTEM_PROMPT,
	WARMUP_PROMPT,
	DEFAULT_TEST_SYSTEM_PROMPT,
	DEFAULT_TEST_MESSAGE
} from './prompts'
import { game, IGameData, IMessage, IReport } from './types'
import { REPORT_CONTENT_WITH_PLACEHOLDERS } from './constants'
import path from 'path'

export class AiService {
	private aiClient: IAi
	private persistence: IPersistence
	private models: string[]

	constructor(aiClient: IAi, persistence: IPersistence, models: string[]) {
		this.aiClient = aiClient
		this.persistence = persistence
		this.models = models
	}

	async testMessage() {
		try {
			const testModel = MODELS[Math.floor(Math.random() * MODELS.length)]
			console.log('Testing message with params:', {
				model: testModel,
				systemPrompt: DEFAULT_TEST_SYSTEM_PROMPT,
				message: DEFAULT_TEST_MESSAGE
			})
			const response = await this.aiClient.sendMessage(
				DEFAULT_TEST_MESSAGE,
				testModel,
				DEFAULT_TEST_SYSTEM_PROMPT,
				[]
			)
			console.log('Test message response:', response)
		} catch (error) {
			console.error('Error testing message', error)
			throw error
		}
	}

	async warmUpModels() {
		try {
			const promises = this.models.map(async (model) => {
				this.persistence.addMessageToHistory(model, 'warmup', {
					role: 'user',
					content: WARMUP_PROMPT
				})
				return this.aiClient.sendMessage(WARMUP_PROMPT, model, SYSTEM_PROMPT, [])
			})

			const responses = await Promise.all(promises)

			responses.forEach((response, index) => {
				console.log(`[${this.models[index]}] Warmup response:`, response)
				console.log('\n--------------------------------\n')
				this.persistence.addMessageToHistory(this.models[index], 'warmup', {
					role: 'assistant',
					content: response
				})
			})
			console.log('Warmup models completed')
		} catch (error) {
			console.error('Error warming up models', error)
			throw error
		}
	}

	async playTournament() {
		try {
			const games = this.generateListOfGames()
			console.log('Starting tournament')
			console.log('Games:', games)
			const promises = games.map(async (game) => {
				await this.playGame(game)
			})
			await Promise.all(promises)
			// for (const game of games) {
			// await this.playGame(game)
			// }
			console.log('Tournament completed')
			const report = await this.persistence.getReport()
			await this.generateReportFile(report)
			console.log('Report generated')
		} catch (error) {
			console.error('Error playing game', error)
			throw error
		}
	}

	private async playGame(game: game) {
		const rounds = getRandomIntBetween(gameConfig.minRounds, gameConfig.maxRounds)
		const gameId = `${game.model1}___${game.model2}`

		this.persistence.initReportData(gameId, rounds, game.model1, game.model2)

		console.log('\n--------------------------------\n')
		console.log(`Playing game between ${game.model1} and ${game.model2} for ${rounds} rounds`)

		let currentRound = 1

		while (currentRound <= rounds) {
			console.log(`>> Round ${currentRound}`)
			const model1History: IMessage[] = [
				{
					role: 'system',
					content: SYSTEM_PROMPT
				},
				...(await this.persistence.getHistory(game.model1, 'warmup')),
				...(await this.persistence.getHistory(game.model1, game.model2))
			]
			const model2History: IMessage[] = [
				{
					role: 'system',
					content: SYSTEM_PROMPT
				},
				...(await this.persistence.getHistory(game.model2, 'warmup')),
				...(await this.persistence.getHistory(game.model2, game.model1))
			]
			const message = `round ${currentRound}`
			const promises = [
				this.aiClient.sendMessage(message, game.model1, SYSTEM_PROMPT, model1History),
				this.aiClient.sendMessage(message, game.model2, SYSTEM_PROMPT, model2History)
			]
			const responses = await Promise.all(promises)
			let model1Response = responses[0].trim().toLowerCase()
			let model2Response = responses[1].trim().toLowerCase()

			if (!this.validateResponse(model1Response)) {
				const newResponse = checkChance(0.5) ? 'cooperate' : 'defect'
				console.log(`Model 1 [${game.model1}] response is invalid, setting to ${newResponse}`)
				console.log('invalid response', model1Response)
				model1Response = newResponse
			}

			if (!this.validateResponse(model2Response)) {
				const newResponse = checkChance(0.5) ? 'cooperate' : 'defect'
				console.log(`Model 2 [${game.model2}] response is invalid, setting to ${newResponse}`)
				console.log('invalid response', model2Response)
				model2Response = newResponse
			}

			const model1OgResponse = model1Response
			const model2OgResponse = model2Response

			model1Response = this.checkForNoise(model1Response, gameConfig.noiseLevel)
			model2Response = this.checkForNoise(model2Response, gameConfig.noiseLevel)

			console.log(
				`Model 1 [${game.model1}] response:\t ${model1Response} ${model1Response !== model1OgResponse ? '(with noise)' : ''}`
			)
			console.log(
				`Model 2 [${game.model2}] response:\t ${model2Response} ${model2Response !== model2OgResponse ? '(with noise)' : ''}`
			)

			const { model1Points, model2Points } = this.calculatePoints(model1Response, model2Response)
			this.persistence.addPoints(`${game.model1}`, game.model2, model1Points)
			this.persistence.addPoints(`${game.model2}`, game.model1, model2Points)

			const model1CurrentScore = await this.persistence.getPoints(`${game.model1}`, game.model2)
			const model2CurrentScore = await this.persistence.getPoints(`${game.model2}`, game.model1)

			const model1HistoryMessage = this.generateHistoryMessage(
				model1Response,
				model1CurrentScore,
				model2Response,
				model2CurrentScore,
				currentRound
			)
			const model2HistoryMessage = this.generateHistoryMessage(
				model2Response,
				model2CurrentScore,
				model1Response,
				model1CurrentScore,
				currentRound
			)
			this.persistence.addMessageToHistory(game.model1, game.model2, model1HistoryMessage)
			this.persistence.addMessageToHistory(game.model2, game.model1, model2HistoryMessage)
			this.persistence.addMove(game.model1, game.model2, model1Response)
			this.persistence.addMove(game.model2, game.model1, model2Response)

			const model1Move = this.generateReportMove(model1Response, model1OgResponse)
			const model2Move = this.generateReportMove(model2Response, model2OgResponse)

			this.persistence.addMoveToReport(gameId, game.model1, model1Move)
			this.persistence.addMoveToReport(gameId, game.model2, model2Move)
			this.persistence.addPointToReport(gameId, game.model1, model1Points)
			this.persistence.addPointToReport(gameId, game.model2, model2Points)
			this.persistence.addInitialStrategyToReport(gameId, game.model1, model1Response)
			currentRound++
		}

		const model1History: IMessage[] = [
			{
				role: 'system',
				content: SYSTEM_PROMPT
			},
			...(await this.persistence.getHistory(game.model1, 'warmup')),
			...(await this.persistence.getHistory(game.model1, game.model2))
		]

		const model2History: IMessage[] = [
			{
				role: 'system',
				content: SYSTEM_PROMPT
			},
			...(await this.persistence.getHistory(game.model2, 'warmup')),
			...(await this.persistence.getHistory(game.model2, game.model1))
		]
		const message = 'The game has finished'
		const promises = [
			this.aiClient.sendMessage(message, game.model1, SYSTEM_PROMPT, model1History),
			this.aiClient.sendMessage(message, game.model2, SYSTEM_PROMPT, model2History)
		]
		const [model1Response, model2Response] = await Promise.all(promises)
		this.persistence.addMessageToHistory(game.model1, game.model2, {
			role: 'assistant',
			content: model1Response
		})
		this.persistence.addMessageToHistory(game.model2, game.model1, {
			role: 'assistant',
			content: model2Response
		})

		const model1InitialStrategy = model1History[2].content
		const model2InitialStrategy = model2History[2].content
		this.persistence.addInitialStrategyToReport(gameId, game.model1, model1InitialStrategy)
		this.persistence.addInitialStrategyToReport(gameId, game.model2, model2InitialStrategy)
		this.persistence.addFinalStrategyToReport(gameId, game.model1, model1Response)
		this.persistence.addFinalStrategyToReport(gameId, game.model2, model2Response)
	}

	private generateListOfGames(): game[] {
		const games: game[] = []
		for (let i = 0; i < this.models.length; i++) {
			for (let j = i + 1; j < this.models.length; j++) {
				games.push({
					model1: this.models[i],
					model2: this.models[j]
				})
			}
		}
		return games
	}

	private validateResponse(response: string): boolean {
		return response === 'cooperate' || response === 'defect'
	}

	private calculatePoints(
		model1Response: string,
		model2Response: string
	): { model1Points: number; model2Points: number } {
		let model1Points = 0
		let model2Points = 0
		if (model1Response === 'cooperate' && model2Response === 'cooperate') {
			model1Points = 3
			model2Points = 3
		} else if (model1Response === 'defect' && model2Response === 'defect') {
			model1Points = 1
			model2Points = 1
		} else if (model1Response === 'cooperate' && model2Response === 'defect') {
			model1Points = 0
			model2Points = 5
		} else if (model1Response === 'defect' && model2Response === 'cooperate') {
			model1Points = 5
			model2Points = 0
		}
		return { model1Points, model2Points }
	}

	private generateReportMove(response: string, ogResponse: string): string {
		if (response === 'cooperate') return `🟢`
		if (response === 'defect' && ogResponse === 'cooperate') return '🟡'
		return '🔴'
	}

	private generateHistoryMessage(
		yourMove: string,
		yourScore: number,
		opponentMove: string,
		opponentScore: number,
		currentRound: number
	): IMessage {
		return {
			role: 'user',
			content: `[round ${currentRound}]
			[your move] ${yourMove}
			[your current score] ${yourScore}
			[opponent's move] ${opponentMove}
			[opponent's current score] ${opponentScore}`
		}
	}

	private checkForNoise(response: string, noiseLevel: number): string {
		if (checkChance(noiseLevel) && response === 'cooperate') return 'defect'
		return response
	}

	private async generateReportFile(report: IReport) {
		const reportsDir = path.join(process.cwd(), 'reports')
		if (!fs.existsSync(reportsDir)) {
			fs.mkdirSync(reportsDir, { recursive: true })
		}
		let content = `# Tournament Report
\n---\n\n${new Date().toLocaleDateString()}
\n\n> Move Legend
🟢 = Cooperate
🔴 = Defect
🟡 = Defect (caused by noise)`
		for (const game of Object.keys(report)) {
			let gameContent = REPORT_CONTENT_WITH_PLACEHOLDERS
			const [model1, model2] = game.split('___')
			gameContent = gameContent.replace(/{{gameId}}/g, game)
			gameContent = gameContent.replace(/{{modelA}}/g, model1)
			gameContent = gameContent.replace(/{{modelB}}/g, model2)
			gameContent = gameContent.replace(/{{rounds}}/g, report[game].rounds.toString())
			gameContent = gameContent.replace(/{{noiseLevel}}/g, gameConfig.noiseLevel.toString())
			gameContent = gameContent.replace(
				/{{modelAMoves}}/g,
				(report[game][model1] as IGameData).moves.join(' ')
			)
			gameContent = gameContent.replace(
				/{{modelBMoves}}/g,
				(report[game][model2] as IGameData).moves.join(' ')
			)
			gameContent = gameContent.replace(
				/{{modelAPoints}}/g,
				(report[game][model1] as IGameData).points.reduce((acc, curr) => acc + curr, 0).toString()
			)
			gameContent = gameContent.replace(
				/{{modelBPoints}}/g,
				(report[game][model2] as IGameData).points.reduce((acc, curr) => acc + curr, 0).toString()
			)
			gameContent = gameContent.replace(
				/{{modelAInitialStrategy}}/g,
				(report[game][model1] as IGameData).initialStrategy
			)
			gameContent = gameContent.replace(
				/{{modelBInitialStrategy}}/g,
				(report[game][model2] as IGameData).initialStrategy
			)
			gameContent = gameContent.replace(
				/{{modelAFinalStrategy}}/g,
				(report[game][model1] as IGameData).finalStrategy
			)
			gameContent = gameContent.replace(
				/{{modelBFinalStrategy}}/g,
				(report[game][model2] as IGameData).finalStrategy
			)
			const scoreChartFileName = await this.generateScoreChart(
				(report[game][model1] as IGameData).points,
				(report[game][model2] as IGameData).points,
				game,
				reportsDir
			)
			gameContent = gameContent.replace(/{{scoreChartFile}}/g, `./${scoreChartFileName}`)
			content += gameContent
			content += '\n---\n'
		}

		const reportName = `tournament-report-${new Date().valueOf()}.md`
		const reportPath = path.join(reportsDir, reportName)
		fs.writeFileSync(reportPath, content)
	}

	private async generateScoreChart(
		model1Points: number[],
		model2Points: number[],
		gameId: string,
		reportsDir: string
	): Promise<string> {
		const width = 600
		const height = 400
		const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height })
		const rounds = new Array(model1Points.length).fill(0).map((_, index) => index + 1)
		const [model1, model2] = gameId.split('___')

		const roundCumulativePoints = rounds.map((round, index) => {
			return model1Points.slice(0, index + 1).reduce((acc, curr) => acc + curr, 0)
		})
		const roundCumulativePoints2 = rounds.map((round, index) => {
			return model2Points.slice(0, index + 1).reduce((acc, curr) => acc + curr, 0)
		})
		const configuration = {
			type: 'line' as const,
			data: {
				labels: rounds,
				datasets: [
					{
						label: `Model A - ${model1}`,
						data: roundCumulativePoints,
						borderColor: 'blue',
						fill: false
					},
					{
						label: `Model B - ${model2}`,
						data: roundCumulativePoints2,
						borderColor: 'red',
						fill: false
					}
				]
			},
			options: {
				plugins: {
					title: {
						display: true,
						text: gameId.replace('___', ' vs ')
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Rounds'
						}
					},
					y: {
						title: {
							display: true,
							text: 'Score'
						}
					}
				}
			}
		}

		const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration)

		const imageFileName = `${gameId.replace(/\//g, '_').replace(/\./g, '_')}-${new Date().valueOf()}.png`
		const imagePath = path.join(reportsDir, imageFileName)
		fs.writeFileSync(imagePath, imageBuffer)
		return imageFileName
	}
}
