import { modelDetails, OpenAIModel } from '../models/model'
import {
	ChatCompletion,
	ChatCompletionMessage,
	ChatCompletionRequest,
	ChatMessage,
	ChatMessagePart,
} from '../models/ChatCompletion'
import { CustomError } from './CustomError'
import { fetchStorageAPIKey } from '../config'
import { CHAT_COMPLETIONS_ENDPOINT, MODELS_ENDPOINT } from '../constants/apiEndpoints'
import { ChatSettings } from '../models/ChatSettings'
import { CHAT_STREAM_DEBOUNCE_TIME, DEFAULT_MODEL } from '../constants/appConstants'
import { NotificationService } from '../service/NotificationService'
import { FileDataRef } from '../models/FileData'

/*interface CompletionChunk {
	id: string
	object: string
	created: number
	model: string
	choices: CompletionChunkChoice[]
}

interface CompletionChunkChoice {
	index: number
	delta: {
		content: string
	}
	finish_reason: null | string // If there can be other values than 'null', use appropriate type instead of string.
}*/

export class ChatService {
	private static models: Promise<OpenAIModel[]> | null = null
	static abortController: AbortController | null = null

	static async mapChatMessagesToCompletionMessages(
		modelId: string,
		messages: ChatMessage[]
	): Promise<ChatCompletionMessage[]> {
		const model = await this.getModelById(modelId) // Retrieve the model details
		if (!model) {
			throw new Error(`Model with ID '${modelId}' not found`)
		}

		return messages.map(message => {
			const contentParts: ChatMessagePart[] = [
				{
					type: 'text',
					text: message.content,
				},
			]

			if (model.image_support && message.fileDataRef) {
				message.fileDataRef.forEach(fileRef => {
					const fileUrl = fileRef.fileData!.data
					if (fileUrl) {
						const fileType = fileRef.fileData!.type.startsWith('image')
							? 'image_url'
							: fileRef.fileData!.type
						contentParts.push({
							type: fileType,
							image_url: {
								url: fileUrl,
							},
						})
					}
				})
			}
			return {
				role: message.role,
				content: contentParts,
			}
		})
	}

	static async sendMessage(messages: ChatMessage[], modelId: string): Promise<ChatCompletion> {
		let endpoint = CHAT_COMPLETIONS_ENDPOINT
		const OPENAI_API_KEY = await fetchStorageAPIKey()
		let headers = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${OPENAI_API_KEY}`,
		}

		const mappedMessages = await ChatService.mapChatMessagesToCompletionMessages(modelId, messages)

		const requestBody: ChatCompletionRequest = {
			model: modelId,
			messages: mappedMessages,
		}
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(requestBody),
		})

		if (!response.ok) {
			const err = await response.json()
			throw new CustomError(err.error.message, err)
		}

		return await response.json()
	}

	private static lastCallbackTime: number = 0
	private static callDeferred: number | null = null
	private static accumulatedContent: string = '' // To accumulate content between debounced calls

	static debounceCallback(
		callback: (content: string, fileDataRef: FileDataRef[], keywords: string[]) => void,
		delay: number = CHAT_STREAM_DEBOUNCE_TIME
	) {
		return (content: string, fileDataRef: FileDataRef[], keywords: string[]) => {
			this.accumulatedContent += content // Accumulate content on each call
			const now = Date.now()
			const timeSinceLastCall = now - this.lastCallbackTime

			if (this.callDeferred !== null) {
				clearTimeout(this.callDeferred)
			}

			this.callDeferred = window.setTimeout(
				() => {
					callback(this.accumulatedContent, fileDataRef, keywords) // Pass the accumulated content to the original callback
					this.lastCallbackTime = Date.now()
					this.accumulatedContent = '' // Reset the accumulated content after the callback is called
				},
				delay - timeSinceLastCall < 0 ? 0 : delay - timeSinceLastCall
			) // Ensure non-negative delay

			this.lastCallbackTime = timeSinceLastCall < delay ? this.lastCallbackTime : now // Update last callback time if not within delay
		}
	}

	static async sendMessageStreamed(
		chatSettings: ChatSettings,
		messages: ChatMessage[],
		callback: (content: string, fileDataRef: FileDataRef[], keywords: string[]) => void
	): Promise<any> {
		const debouncedCallback = this.debounceCallback(callback)
		//const OPENAI_API_KEY = await fetchStorageAPIKey()
		this.abortController = new AbortController()
		/*let endpoint = CHAT_COMPLETIONS_ENDPOINT
		let headers = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${OPENAI_API_KEY}`,
		}*/

		const requestBody: ChatCompletionRequest = {
			model: DEFAULT_MODEL,
			messages: [],
			stream: true,
			seed: null,
			temperature: 0.2,
			top_p: null,
		}

		if (chatSettings) {
			const { model, temperature, top_p, seed } = chatSettings
			requestBody.model = model ?? requestBody.model
			requestBody.temperature = temperature ?? requestBody.temperature
			requestBody.top_p = top_p ?? requestBody.top_p
			requestBody.seed = seed ?? requestBody.seed
		}

		const mappedMessages = await ChatService.mapChatMessagesToCompletionMessages(
			requestBody.model,
			messages
		)
		requestBody.messages = mappedMessages
		let response: Response
		let lastUserMessage = null

		if (requestBody?.messages && requestBody?.messages.length > 0) {
			for (let i = requestBody?.messages.length - 1; i >= 0; i--) {
				if (requestBody?.messages[i].role === 'user') {
					lastUserMessage = requestBody?.messages[i].content[0]?.text
					break
				}
			}
		}
		try {
			response = await fetch('https://river-on-tips.xyz/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
				},
				body: JSON.stringify({ prompt: lastUserMessage }),
			})
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				NotificationService.handleUnexpectedError(error, 'Stream reading was aborted.')
			} else if (error instanceof Error) {
				NotificationService.handleUnexpectedError(error, 'Error reading streamed response.')
			} else {
				console.error('An unexpected error occurred')
			}
			return
		}

		if (!response.ok) {
			const err = await response.json()
			throw new CustomError(err.error.message, err)
		}

		if (this.abortController.signal.aborted) {
			console.log('Stream aborted')
			return // Early return if the fetch was aborted
		}

		if (response.body) {
			const reader = response.body.getReader()
			const decoder = new TextDecoder('utf-8')

			let partialDecodedChunk = ''
			try {
				while (true) {
					const streamChunk = await reader.read()
					const { done, value } = streamChunk
					if (done) {
						break
					}

					let decodedChunk = decoder.decode(value)
					partialDecodedChunk += decodedChunk

					let jsonResponse
					try {
						jsonResponse = JSON.parse(partialDecodedChunk)
					} catch (err) {
						if (err instanceof SyntaxError) {
							continue
						} else {
							throw err
						}
					}

					const { keywords } = jsonResponse
					const fromPromptComponents = keywords?.from_prompt?.components || []

					let accumulatedContent = ''

					if (!keywords || fromPromptComponents.length === 0) {
						accumulatedContent = `I’m afraid I cannot find the designs based on the provided information. Please provide more context about what you are trying to find and I will do my best to assist you further.\n\n**Search Tips:**\n- **Describe the design**: Use words that describe how the design looks, what it's made of (e.g., components, shapes), or what it's called (layer names).`
					}

					debouncedCallback(accumulatedContent, [], fromPromptComponents)

					break
				}
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') {
					// User aborted the stream, so no need to propagate an error.
				} else if (error instanceof Error) {
					NotificationService.handleUnexpectedError(error, 'Error reading streamed response.')
				} else {
					console.error('An unexpected error occurred')
				}
				return
			}
		}
	}

	static cancelStream = (): void => {
		if (this.abortController) {
			this.abortController.abort()
			this.abortController = null
		}
	}

	static getModels = (): Promise<OpenAIModel[]> => {
		return ChatService.fetchModels()
	}

	static fetchModels = async (): Promise<OpenAIModel[]> => {
		const OPENAI_API_KEY = await fetchStorageAPIKey()
		this.models = fetch(MODELS_ENDPOINT, {
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
			},
		})
			.then(response => {
				if (!response.ok) {
					return response.json().then(err => {
						throw new Error(err.error.message)
					})
				}
				return response.json()
			})
			.catch(err => {
				throw new Error(err.message || err)
			})
			.then(data => {
				const models: OpenAIModel[] = data.data
				// Filter, enrich with contextWindow from the imported constant, and sort
				return models
					.filter(model => model.id.startsWith('gpt-'))
					.map(model => {
						const details = modelDetails[model.id] || {
							contextWindowSize: 0,
							knowledgeCutoffDate: '',
							imageSupport: false,
							preferred: false,
							deprecated: false,
						}
						return {
							...model,
							context_window: details.contextWindowSize,
							knowledge_cutoff: details.knowledgeCutoffDate,
							image_support: details.imageSupport,
							preferred: details.preferred,
							deprecated: details.deprecated,
						}
					})
					.sort((a, b) => b.id.localeCompare(a.id))
			})
		return this.models
	}

	static async getModelById(modelId: string): Promise<OpenAIModel | null> {
		try {
			const models = await ChatService.getModels()
			const foundModel = models.find(model => model.id === modelId)
			if (!foundModel) {
				throw new CustomError(`Model with ID '${modelId}' not found.`, {
					code: 'MODEL_NOT_FOUND',
					status: 404,
				})
			}

			return foundModel
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('Failed to get models:', error.message)
				throw new CustomError('Error retrieving models.', {
					code: 'FETCH_MODELS_FAILED',
					status: (error as any).status || 500,
				})
			} else {
				console.error('Unexpected error type:', error)
				throw new CustomError('Unknown error occurred.', {
					code: 'UNKNOWN_ERROR',
					status: 500,
				})
			}
		}
	}
}
