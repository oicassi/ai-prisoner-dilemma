import OpenAI from 'openai'
import { IAi } from '@/domain/game/ports/ai'
import { IMessage } from '@/domain/game/types'

export class OpenRouterAiClient implements IAi {
	private client: OpenAI

	constructor(baseUrl: string, apiKey: string) {
		if (!baseUrl) {
			throw new Error('OpenRouter base URL is required')
		}
		if (!apiKey) {
			throw new Error('OpenRouter API key is required')
		}

		this.client = new OpenAI({
			apiKey: apiKey,
			baseURL: baseUrl
		})
	}

	async sendMessage(
		message: string,
		model: string,
		systemPrompt: string,
		history: IMessage[]
	): Promise<string> {
		const messages: IMessage[] = [
			{
				role: 'system',
				content: systemPrompt
			},
			...history,
			{
				role: 'user',
				content: message
			}
		]
		const completion = await this.client.chat.completions.create({
			model,
			messages
		})

		return completion.choices[0].message.content || '<No response generated>'
	}
}
