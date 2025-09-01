import { IMessage, IReport, IGameData } from '../types'

export interface IPersistence {
	addMessageToHistory: (pk: string, sk: string, message: IMessage) => Promise<void>
	getHistory: (pk: string, sk: string) => Promise<IMessage[]>
	addPoints: (pk: string, sk: string, points: number) => Promise<void>
	getPoints: (pk: string, sk: string) => Promise<number>
	addMove: (pk: string, sk: string, move: string) => Promise<void>
	getMoves: (pk: string, sk: string) => Promise<string[]>
	initReportData: (pk: string, rounds: number, model1: string, model2: string) => Promise<void>
	addMoveToReport: (pk: string, model: string, move: string) => Promise<void>
	addPointToReport: (pk: string, model: string, points: number) => Promise<void>
	addInitialStrategyToReport: (pk: string, model: string, strategy: string) => Promise<void>
	addFinalStrategyToReport: (pk: string, model: string, strategy: string) => Promise<void>
	getReportGameData: (pk: string, model: string) => Promise<IGameData>
	getReport: () => Promise<IReport>
}
