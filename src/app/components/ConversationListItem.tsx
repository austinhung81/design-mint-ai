import React, { useState } from 'react'
import { Conversation } from '../service/ConversationService'
import chatBubble from '../assets/chat-bubble.svg'

interface ConversationListItemProps {
	convo: Conversation
	isSelected: boolean
	loadConversations: () => void
	setSelectedConversationId: (id: string) => void
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
	convo,
	setSelectedConversationId,
}) => {
	console.log('ConversationListItem', convo)
	const [isEditingTitle, setIsEditingTitle] = useState(false)

	const selectConversation = () => {
		if (isEditingTitle) {
			// If in edit mode, cancel edit mode and select the new conversation
			setIsEditingTitle(false)
		}
		setSelectedConversationId(convo.id)
	}

	function displayDateRule(timestamp) {
		const date = new Date(timestamp)
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)
		const dateToCompare = new Date(date.getFullYear(), date.getMonth(), date.getDate())

		// Same day
		if (dateToCompare.getTime() === today.getTime()) {
			const diffMins = Math.round((+now - +date) / 1000 / 60)
			const diffHours = Math.floor(diffMins / 60)

			if (diffHours > 0) {
				return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
			} else {
				return `${diffMins} mins ago`
			}
		}

		// Yesterday
		if (dateToCompare.getTime() === yesterday.getTime()) {
			return 'yesterday'
		}

		// Before yesterday
		return date.toLocaleString()
	}

	if (convo.id === '0') {
		return null
	}

	return (
		<li
			key={convo.id}
			className="relative cursor-pointer flex flex-col z-[15] gap-2 opacity-100 h-auto border-b border-b-rice300 p-4"
			onClick={() => selectConversation()}
		>
			<div className="flex-1 flex">
				<img src={chatBubble} width={24} height={24} />
				<span className="text-mint400 text-base pl-3 overflow-hidden truncate">{convo.title}</span>
			</div>
			<div className="pl-9 text-left text-base text-rice400">
				{displayDateRule(convo.timestamp)}
			</div>
		</li>
	)
}

export default ConversationListItem
