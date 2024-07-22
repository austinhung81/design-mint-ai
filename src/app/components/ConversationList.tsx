import React, { useEffect, useRef, useState } from 'react'

import ConversationService, {
	Conversation,
	ConversationChangeEvent,
	conversationsEmitter,
} from '../service/ConversationService'
import ConversationListItem from './ConversationListItem'

const ConversationList: React.FC = () => {
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [selectedId, setSelectedId] = useState(null)
	const scrollContainerRef = useRef<HTMLDivElement | null>(null)
	const [conversationsWithMarkers, setConversationsWithMarkers] = useState<Conversation[]>([])

	useEffect(() => {
		loadConversations()
		conversationsEmitter.on('conversationChangeEvent', handleConversationChange)

		return () => {
			conversationsEmitter.off('conversationChangeEvent', handleConversationChange)
		}
	}, [])

	useEffect(() => {
		const sortedConversations = [...conversations].sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp if not already sorted
		setConversationsWithMarkers(insertTimeMarkers(sortedConversations))
	}, [conversations])

	const getHeaderFromTimestamp = (timestamp: number) => {
		const today = new Date()
		const date = new Date(timestamp)

		const diffTime = Math.abs(today.getTime() - date.getTime())
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays === 1) {
			return 'today'
		}
		if (diffDays === 2) {
			return 'yesterday'
		}
		if (diffDays <= 7) {
			return 'previous-7-days'
		}
		if (diffDays <= 30) {
			return 'previous-30-days'
		}

		return date.toLocaleString(navigator.language, { month: 'long' })
	}

	const insertTimeMarkers = (conversations: Conversation[]) => {
		let lastHeader = ''
		const withMarkers: Conversation[] = []
		conversations.forEach(convo => {
			const currentHeader = getHeaderFromTimestamp(convo.timestamp)
			if (currentHeader !== lastHeader) {
				withMarkers.push({
					id: '0',
					userId: '0',
					gid: 0,
					messages: '',
					model: '',
					systemPrompt: '',
					timestamp: 0,
					marker: true,
					title: currentHeader,
				})
				lastHeader = currentHeader
			}
			withMarkers.push(convo)
		})
		return withMarkers
	}

	const loadConversations = async () => {
		ConversationService.loadRecentConversationsTitleOnly()
			.then(conversations => {
				setConversations(conversations)
			})
			.catch(error => {
				console.error('Error loading conversations:', error)
			})
	}

	const handleConversationChange = (event: ConversationChangeEvent) => {
		if (event.action === 'add') {
			const conversation = event.conversation!
			setSelectedId(conversation.id)
			setConversations(prevConversations => [conversation, ...prevConversations])

			if (scrollContainerRef.current) {
				if ('scrollTop' in scrollContainerRef.current) {
					scrollContainerRef.current.scrollTop = 0
				}
			}
		} else if (event.action === 'edit') {
			if (event.id === '0') {
				console.error('invali state, cannot edit id = 0')
			} else {
				setConversations(prevConversations =>
					prevConversations.map(conv => {
						if (conv.id === event.id && event.conversation) {
							return event.conversation
						}
						return conv
					})
				)
			}
		} else if (event.action === 'delete') {
			if (event.id === '0') {
				loadConversations()
			} else {
				setConversations(prevConversations =>
					prevConversations.filter(conv => conv.id !== event.id)
				)
			}
		}
	}

	const ConversationListItemMemo = React.memo(ConversationListItem)

	return (
		<div className="conversation-list-container">
			<div
				id="conversation-list"
				ref={scrollContainerRef}
				className="flex-col flex-1 transition-opacity duration-500 -mr-2 pr-2 overflow-y-auto"
			>
				<div className="flex flex-col gap-2 pb-2 dark:text-gray-100 text-gray-800 text-sm">
					<div className="relative overflow-x-hidden" style={{ height: 'auto', opacity: 1 }}>
						<ol>
							{conversationsWithMarkers.map((convo, index) => {
								if ('marker' in convo) {
									return (
										<li key={`marker-${index}`} className="sticky top-0 z-[16]">
											<h3 className="h-9 pb-2 pt-3 px-3 text-xs text-gray-500 font-medium text-ellipsis overflow-hidden bg-gray-50 dark:bg-gray-900">
												{convo.title}
											</h3>
										</li>
									)
								} else {
									return (
										<ConversationListItemMemo
											key={convo.id}
											convo={convo}
											isSelected={selectedId === convo.id}
											loadConversations={loadConversations}
											setSelectedId={setSelectedId}
										/>
									)
								}
							})}
						</ol>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ConversationList
