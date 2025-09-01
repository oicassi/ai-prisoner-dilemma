export interface IMessage {
	role: 'user' | 'assistant' | 'system'
	content: string
}

export interface IGameData {
	moves: string[]
	points: number[]
	initialStrategy: string
	finalStrategy: string
}

export interface IReportEntry {
	rounds: number
	[modelName: string]: IGameData | number
}

export interface IReport extends Record<string, IReportEntry> {}

export type game = {
	model1: string
	model2: string
}
