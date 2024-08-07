import React, { useEffect, useRef, useState } from 'react'
import { getFigmaStorageValue, getUser } from '../../../lib/utils'
import { ChatService } from '../service/ChatService'
import { ChatMessage, MessageType, Role } from '../models/ChatCompletion'
import { CustomError } from '../service/CustomError'
import { DEFAULT_MODEL } from '../constants/appConstants'
import Chat from './Chat'
import MessageBox, { MessageBoxHandles } from './MessageBox'
import { NotificationService } from '../service/NotificationService'
import { OpenAIModel } from '../models/model'
import { ChatSettings } from '../models/ChatSettings'
import { DEFAULT_INSTRUCTIONS, MAX_TITLE_LENGTH } from '../constants/appConstants'
import ConversationService, { Conversation } from '../service/ConversationService'
import { FileDataRef } from '../models/FileData'
import { Loader } from '../../../components/ui/loader'
import addIcon from '../assets/add.svg'
import { predefinedMessages } from '../service/PredefinedMessages'
import { getFrames } from '../../../lib/utils'

export interface User {
	id: string | null
	name: string
	photoUrl: string | null
	color: string
	sessionId: number
}

function getFirstValidString(...args: (string | undefined | null)[]): string {
	for (const arg of args) {
		if (arg !== null && arg !== undefined && arg.trim() !== '') {
			return arg
		}
	}
	return ''
}

const ChatPage = ({
	setActiveTab,
	className = null,
	componentNames = null,
	activeConversationId,
}) => {
	const [conversation, setConversation] = useState<Conversation | null>(null)
	const [model, setModel] = useState<OpenAIModel | null>(null)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [loading, setLoading] = useState(false)
	const [allowAutoScroll, setAllowAutoScroll] = useState(true)
	//const buttonRef = useRef<HTMLButtonElement | null>(null)
	const messageBoxRef = useRef<MessageBoxHandles>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [userId, setUserId] = useState(null)
	const [frames, setFrames] = useState(null)
	useEffect(() => {
		async function fetchStorageValues() {
			setIsLoading(true)
			const openaiModel = await getFigmaStorageValue('openai_model')
			const user = (await getUser()) as User
			const key = (openaiModel ?? '') as string
			const frames = await getFrames(['Card 3'])
			fetchModelById(key)
				.then(async (model: OpenAIModel | null) => {
					setModel(model)
					if (activeConversationId) {
						await handleSelectedConversation(activeConversationId)
					}
				})
				.finally(() => setIsLoading(false))
			setUserId(user?.id)
			setFrames(frames)
		}
		fetchStorageValues()
	}, [])

	useEffect(() => {
		const fetchConversation = async () => {
			if (activeConversationId) {
				await handleSelectedConversation(activeConversationId)
			} else {
				newConversation()
			}
		}

		fetchConversation()
	}, [activeConversationId])

	useEffect(() => {
		if (messages.length === 0) {
			setConversation(null)
		}
		if (conversation && conversation.id) {
			// Only update if there are messages
			if (messages.length > 0) {
				ConversationService.updateConversation(conversation, messages)
			}
		}
	}, [messages])

	const newConversation = () => {
		setConversation(null)
		clearInputArea()
		setMessages([])
		messageBoxRef.current?.focusTextarea()
	}

	const handleSelectedConversation = (id: string | null): Promise<void> => {
		return new Promise(resolve => {
			if (id && id.length > 0) {
				ConversationService.getConversationById(id).then(conversation => {
					if (conversation) {
						setConversation(conversation)
						clearInputArea()
						ConversationService.getChatMessages(conversation).then((messages: ChatMessage[]) => {
							if (messages.length == 0) {
								console.warn('possible state problem')
							} else {
								setMessages(messages)
							}
							resolve() // Resolve the promise here after all async operations
						})
					} else {
						resolve() // Resolve the promise if no conversation is found
					}
				})
			} else {
				newConversation()
				resolve() // Resolve the promise if id is null or empty
			}
			setAllowAutoScroll(true)
			messageBoxRef.current?.focusTextarea()
		})
	}

	/*const handleQuoteSelectedText = () => {
		const selection = window.getSelection()
		if (selection) {
			const selectedText = selection.toString()
			const modifiedText = `Assistant wrote:\n${SNIPPET_MARKERS.begin}\n${selectedText}\n${SNIPPET_MARKERS.end}\n`
			messageBoxRef.current?.pasteText(modifiedText)
			messageBoxRef.current?.focusTextarea()
		}
	}*/

	const handleUserScroll = (isAtBottom: boolean) => {
		setAllowAutoScroll(isAtBottom)
	}

	const fetchModelById = async (modelId: string): Promise<OpenAIModel | null> => {
		try {
			const fetchedModel = await ChatService.getModelById(modelId)
			return fetchedModel
		} catch (error) {
			console.error('Failed to fetch model:', error)
			if (error instanceof Error) {
				NotificationService.handleUnexpectedError(error, 'Failed to fetch model.')
			}
			return null
		}
	}

	const handleModelChange = (value: string | null) => {
		if (value === null) {
			setModel(null)
		} else {
			fetchModelById(value).then(setModel)
		}
	}

	function getTitle(message: string): string {
		let title = message.trimStart() // Remove leading newlines
		let firstNewLineIndex = title.indexOf('\n')
		if (firstNewLineIndex === -1) {
			firstNewLineIndex = title.length
		}
		return title.substring(0, Math.min(firstNewLineIndex, MAX_TITLE_LENGTH))
	}

	function getEffectiveChatSettings(): ChatSettings {
		return {
			id: '0',
			author: 'system',
			name: 'default',
			model: model?.id || DEFAULT_MODEL,
		}
	}

	function startConversation(message: string) {
		const id = Date.now().toString()
		const timestamp = Date.now()
		let shortenedText = getTitle(message)
		let instructions = getFirstValidString(DEFAULT_INSTRUCTIONS)
		const conversation: Conversation = {
			id: id,
			userId: userId,
			gid: Number(getEffectiveChatSettings().id),
			timestamp: timestamp,
			title: shortenedText,
			model: model?.id || DEFAULT_MODEL,
			systemPrompt: instructions,
			messages: '[]',
		}
		setConversation(conversation)
		ConversationService.addConversation(conversation)
	}

	const addMessage = (
		role: Role,
		messageType: MessageType,
		message: string,
		fileDataRef: FileDataRef[],
		callback?: (callback: ChatMessage[]) => void
	) => {
		let content: string = message

		setMessages((prevMessages: ChatMessage[]) => {
			const message: ChatMessage = {
				id: prevMessages.length + 1,
				role: role,
				messageType: messageType,
				content: content,
				fileDataRef: fileDataRef,
			}
			return [...prevMessages, message]
		})

		const newMessage: ChatMessage = {
			id: messages.length + 1,
			role: role,
			messageType: messageType,
			content: content,
			fileDataRef: fileDataRef,
		}
		const updatedMessages = [...messages, newMessage]
		console.log('updatedMessages', updatedMessages)
		if (callback) {
			callback(updatedMessages)
		}
	}
	const clearInputArea = () => {
		messageBoxRef.current?.clearInputValue()
	}

	function handleStreamedResponse(content: string, fileDataRef: FileDataRef[]) {
		console.log('handleStreamedResponse', frames)
		setMessages(prevMessages => {
			let isNew: boolean = false
			try {
				// todo: this shouldn't be necessary
				if (prevMessages.length == 0) {
					console.error('prevMessages should not be empty in handleStreamedResponse.')
					return []
				}
				if (prevMessages[prevMessages.length - 1].role == Role.User) {
					isNew = true
				}
			} catch (e) {
				console.error('Error getting the role')
				console.error('prevMessages = ' + JSON.stringify(prevMessages))
				console.error(e)
			}

			if (isNew) {
				const message: ChatMessage = {
					id: prevMessages.length + 1,
					role: Role.Assistant,
					messageType: MessageType.Normal,
					content: content,
					fileDataRef: fileDataRef,
				}
				return [...prevMessages, message]
			} else {
				const frameNames = frames.map((frame, index) => `${index + 1}. ${frame.name}`).join('\n')
				// Clone the last message and update its content
				const updatedMessage = {
					...prevMessages[prevMessages.length - 1],
					//content: prevMessages[prevMessages.length - 1].content + content,
					content: `Here are the files of the designs:\n${frameNames}`,
				}
				// Replace the old last message with the updated one
				return [...prevMessages.slice(0, -1), updatedMessage]
			}
		})
	}

	function sendMessage(updatedMessages: ChatMessage[]) {
		setLoading(true)
		clearInputArea()
		let systemPrompt = getFirstValidString(conversation?.systemPrompt, DEFAULT_INSTRUCTIONS)
		let messages: ChatMessage[] = [
			{
				role: Role.System,
				content: systemPrompt,
			} as ChatMessage,
			...updatedMessages,
		]

		let effectiveSettings = getEffectiveChatSettings()

		ChatService.sendMessageStreamed(effectiveSettings, messages, handleStreamedResponse)
			.then(() => {
				// nop
			})
			.catch(err => {
				if (err instanceof CustomError) {
					const message: string = err.message
					setLoading(false)
					addMessage(Role.Assistant, MessageType.Error, message, [])
				} else {
					NotificationService.handleUnexpectedError(err, 'Failed to send message to openai.')
				}
			})
			.finally(() => {
				setLoading(false) // Stop loading here, whether successful or not
			})
	}

	const callApp = (message: string, fileDataRef: FileDataRef[]) => {
		if (!conversation) {
			startConversation(message)
		}
		setAllowAutoScroll(true)
		addMessage(Role.User, MessageType.Normal, message, fileDataRef, sendMessage)
	}

	/*const createButton = () => {
		const button = document.createElement('button')
		button.className =
			'px-2 py-1 bg-gray-100 text-black dark:text-black dark:bg-gray-200 border border-gray-200 dark:border-gray-800 rounded-md shadow-md hover:bg-gray-200 dark:hover:bg-gray-100 focus:outline-none'

		const iconContainer = document.createElement('div')
		iconContainer.className = 'h-5 w-5'

		button.appendChild(iconContainer)
		// Stop propagation for mousedown and mouseup to avoid affecting other event listeners
		button.addEventListener('mousedown', event => event.stopPropagation())
		button.addEventListener('mouseup', event => event.stopPropagation())
		button.addEventListener('click', handleQuoteSelectedText)
		return button
	}
	const handleMouseUp = () => {
		const selection = window.getSelection()
		if (selection && selection.toString().trim() !== '') {
			const range = selection.getRangeAt(0)
			const rect = range.getBoundingClientRect()

			// Remove the existing button if it exists
			if (buttonRef.current && buttonRef.current.parentNode) {
				buttonRef.current.parentNode.removeChild(buttonRef.current)
			}

			const newButton = createButton()
			const buttonHeight = 30 // Approximate height of the button
			const buttonWidth = newButton.offsetWidth

			const chatContainer = document.getElementById('chat-container1')
			if (chatContainer) {
				const containerRect = chatContainer.getBoundingClientRect()

				newButton.style.position = 'absolute'
				newButton.style.left = `${
					rect.left - containerRect.left + rect.width / 2 - buttonWidth / 2
				}px` // Center horizontally relative to container
				newButton.style.top = `${rect.top - containerRect.top - buttonHeight}px` // Position above the selection relative to container
				newButton.style.display = 'inline-block'
				newButton.style.verticalAlign = 'middle'
				newButton.style.zIndex = '1000'

				chatContainer.appendChild(newButton)

				buttonRef.current = newButton
			}
		}
	}*/
	if (isLoading) {
		return (
			<div className="flex justify-center items-center pt-10">
				<Loader />
			</div>
		)
	} else if (!model && !conversation) {
		return (
			<div className="flex flex-col gap-60 p-4">
				<h1 className="text-2xl text-left text-mint400">Oops! Invalid API Key</h1>
				<span className="text-sm text-rice400">
					Please go to{' '}
					<span
						onClick={() => setActiveTab('setting')}
						className="underline underline-offset-2 text-mint400 cursor-pointer"
					>
						Settings
					</span>{' '}
					to check your API key again
				</span>
			</div>
		)
	} else {
		return (
			<div className="relative">
				{conversation && (
					<a
						className="absolute cursor-pointer flex items-center right-4 -top-9 underline text-mint400"
						onClick={() => newConversation()}
					>
						<img src={addIcon} width={16} height={16} />
						<span>New Search</span>
					</a>
				)}
				<div
					className={`${className} overflow-hidden w-full h-full relative flex z-0 dark:bg-gray-900`}
				>
					<div className="flex flex-col items-stretch w-full h-full">
						<main className="relative h-full transition-width flex flex-col overflow-hidden items-stretch flex-1">
							{conversation ? (
								<Chat
									chatBlocks={messages}
									onChatScroll={handleUserScroll}
									conversation={conversation}
									model={model?.id || DEFAULT_MODEL}
									onModelChange={handleModelChange}
									allowAutoScroll={allowAutoScroll}
									loading={loading}
								/>
							) : (
								<div className="h-[calc(100%-188px)]">
									<h1 className="text-2xl text-left text-mint400 p-4">
										We can help to find your designs.
										<br /> Here are template you can try:
									</h1>
									<div className="flex flex-col gap-3 px-4">
										{predefinedMessages.map((message, index) => (
											<div
												key={index}
												onClick={() => callApp(message, [])}
												className="cursor-pointer text-sm text-rice400 border border-rice300 rounded-[36px] leading-5 py-2 px-4 text-left"
											>
												{message}
											</div>
										))}
									</div>
								</div>
							)}
							<MessageBox
								ref={messageBoxRef}
								callApp={callApp}
								loading={loading}
								setLoading={setLoading}
								componentNames={componentNames}
								allowImageAttachment="no"
							/>
						</main>
					</div>
				</div>
			</div>
		)
	}
}

export default ChatPage
