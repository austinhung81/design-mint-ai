import React, { useEffect, useRef } from 'react'
import ChatBlock from './ChatBlock'
import { ChatMessage } from '../models/ChatCompletion'
import { Conversation } from '../service/ConversationService'

interface Props {
	chatBlocks: ChatMessage[]
	onChatScroll: (isAtBottom: boolean) => void
	allowAutoScroll: boolean
	model: string | null
	onModelChange: (value: string | null) => void
	conversation: Conversation | null
	loading: boolean
}

const Chat: React.FC<Props> = ({ chatBlocks, onChatScroll, allowAutoScroll, loading }) => {
	const chatDivRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (chatDivRef.current && allowAutoScroll) {
			chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight
		}
	}, [chatBlocks])

	useEffect(() => {
		const chatContainer = chatDivRef.current
		if (chatContainer) {
			const isAtBottom =
				chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight

			// Initially hide the button if chat is at the bottom
			onChatScroll(isAtBottom)
		}
	}, [])

	const handleScroll = () => {
		if (chatDivRef.current) {
			const scrollThreshold = 20
			const isAtBottom =
				chatDivRef.current.scrollHeight - chatDivRef.current.scrollTop <=
				chatDivRef.current.clientHeight + scrollThreshold

			// Notify parent component about the auto-scroll status
			onChatScroll(isAtBottom)

			// Disable auto-scroll if the user scrolls up
			if (!isAtBottom) {
				onChatScroll(false)
			}
		}
	}

	return (
		<div
			id={'chat-container'}
			ref={chatDivRef}
			className="relative chat-container flex-1 overflow-auto"
			onScroll={handleScroll}
		>
			<div
				id={'chat-container1'}
				className="relative chat-container1 flex flex-col items-center text-sm dark:bg-gray-900"
			>
				{chatBlocks.map((block, index) => (
					<ChatBlock
						key={`chat-block-${block.id}`}
						block={block}
						loading={index === chatBlocks.length - 1 && loading}
						isLastBlock={index === chatBlocks.length - 1}
					/>
				))}
				<div className="w-full h-24 flex-shrink-0"></div>
			</div>
		</div>
	)
}

export default Chat
