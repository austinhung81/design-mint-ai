import React, { useEffect, useRef, useState } from 'react'

import ConversationService, {
	Conversation,
	ConversationChangeEvent,
	conversationsEmitter,
} from '../service/ConversationService'
import ConversationListItem from './ConversationListItem'
import { Loader } from '../../../components/ui/loader'

const ConversationList = ({ setActiveTab }) => {
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [selectedId, setSelectedId] = useState(null)
	const scrollContainerRef = useRef<HTMLDivElement | null>(null)
	const [conversationsWithMarkers, setConversationsWithMarkers] = useState<Conversation[]>([])
	const [isFetching, setIsFetching] = useState(true)
	const [isEmpty, setIsEmpty] = useState(false)

	useEffect(() => {
		loadConversations()
		conversationsEmitter.on('conversationChangeEvent', handleConversationChange)

		return () => {
			conversationsEmitter.off('conversationChangeEvent', handleConversationChange)
		}
	}, [])

	useEffect(() => {
		const sortedConversations = [...conversations].sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp if not already sorted
		setConversationsWithMarkers(sortedConversations)
	}, [conversations])

	const loadConversations = async () => {
		setIsFetching(true)
		ConversationService.loadRecentConversationsTitleOnly()
			.then(conversations => {
				setConversations(conversations)
				if (conversations.length === 0) {
					setIsEmpty(true)
				}
				setIsFetching(false)
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

	const setSelectedConversationId = id => {
		window.parent.postMessage(
			{ pluginMessage: { type: 'set-value', name: 'active_conversation_id', value: id } },
			'*'
		)
		setSelectedId(id)
		setActiveTab('home')
	}

	const EmptyList = () => {
		return (
			<div className="flex flex-col gap-60">
				<h1 className="text-2xl text-left text-mint400">Welcome 👋</h1>
				<div>
					<div className="text-sm text-rice400">You don’t have search history yet.</div>
					<div className="text-sm text-rice400">
						Go to{' '}
						<span
							onClick={() => setActiveTab('home')}
							className="underline underline-offset-2 text-mint400 cursor-pointer"
						>
							Home
						</span>{' '}
						to start your first search.
					</div>
				</div>
			</div>
		)
	}

	if (isFetching) {
		return (
			<div className="flex justify-center items-center pt-10">
				<Loader />
			</div>
		)
	}

	if (isEmpty) return <EmptyList />

	return (
		<div className="conversation-list-container">
			<h1 className="text-2xl text-left text-mint400 mb-6">Recent</h1>
			<div
				id="conversation-list"
				ref={scrollContainerRef}
				className="flex-col flex-1 transition-opacity duration-500 -mr-2 pr-2 overflow-y-auto"
			>
				<div className="flex flex-col">
					<div className="relative overflow-x-hidden" style={{ height: 'auto', opacity: 1 }}>
						<ol className="m-0">
							{conversationsWithMarkers.map(convo => {
								return (
									<ConversationListItemMemo
										key={convo.id}
										convo={convo}
										isSelected={selectedId === convo.id}
										loadConversations={loadConversations}
										setSelectedConversationId={setSelectedConversationId}
									/>
								)
							})}
						</ol>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ConversationList
