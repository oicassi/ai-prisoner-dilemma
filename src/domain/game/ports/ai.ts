import { IMessage } from '../types'

export interface IAi {
	sendMessage: (
		message: string,
		model: string,
		systemPrompt: string,
		history: IMessage[]
	) => Promise<string>
}
