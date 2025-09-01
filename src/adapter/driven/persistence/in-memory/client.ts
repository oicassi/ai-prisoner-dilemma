import { IPersistence } from '@/domain/game/ports/persistence'
import { IGameData, IMessage, IReport, IReportEntry } from '@/domain/game/types'
import { IInMemoryHistory, IInMemoryMoves, IInMemoryPoints, IInMemoryReport } from './types'

export class InMemoryPersistenceClient implements IPersistence {
	private history: IInMemoryHistory
	private points: IInMemoryPoints
	private moves: IInMemoryMoves
	private report: IInMemoryReport

	constructor() {
		this.history = {}
		this.points = {}
		this.moves = {}
		this.report = {}
	}

	async addMessageToHistory(pk: string, sk: string, message: IMessage): Promise<void> {
		if (!this.history[pk]) {
			this.history[pk] = {}
		}
		if (!this.history[pk][sk]) {
			this.history[pk][sk] = []
		}
		this.history[pk][sk].push(message)
	}

	async getHistory(pk: string, sk: string): Promise<IMessage[]> {
		return this.history[pk]?.[sk] || []
	}

	async addPoints(pk: string, sk: string, points: number): Promise<void> {
		if (!this.points[pk]) {
			this.points[pk] = {}
		}
		if (!this.points[pk][sk]) {
			this.points[pk][sk] = 0
		}
		this.points[pk][sk] += points
	}

	async getPoints(pk: string, sk: string): Promise<number> {
		return this.points[pk]?.[sk] || 0
	}

	async addMove(pk: string, sk: string, move: string): Promise<void> {
		if (!this.moves[pk]) {
			this.moves[pk] = {}
		}
		if (!this.moves[pk][sk]) {
			this.moves[pk][sk] = []
		}
		this.moves[pk][sk].push(move)
	}

	async getMoves(pk: string, sk: string): Promise<string[]> {
		return this.moves[pk]?.[sk] || []
	}

	async initReportData(pk: string, rounds: number, model1: string, model2: string): Promise<void> {
		if (!this.report[pk]) {
			this.report[pk] = {
				rounds
			}
		}
		this.report[pk][model1] = { moves: [], points: [], initialStrategy: '', finalStrategy: '' }
		this.report[pk][model2] = { moves: [], points: [], initialStrategy: '', finalStrategy: '' }
	}

	async addMoveToReport(pk: string, model: string, move: string): Promise<void> {
		;(this.report[pk][model] as IGameData).moves.push(move)
	}

	async addPointToReport(pk: string, model: string, points: number): Promise<void> {
		;(this.report[pk][model] as IGameData).points.push(points)
	}

	async addInitialStrategyToReport(pk: string, model: string, strategy: string): Promise<void> {
		;(this.report[pk][model] as IGameData).initialStrategy = strategy
	}

	async addFinalStrategyToReport(pk: string, model: string, strategy: string): Promise<void> {
		;(this.report[pk][model] as IGameData).finalStrategy = strategy
	}

	async getReportGameData(pk: string, model: string): Promise<IGameData> {
		return this.report[pk][model] as IGameData
	}

	async getReport(): Promise<IReport> {
		return this.report
	}
}
