import React, { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import MarkdownBlock from './MarkdownBlock'
import { ChatMessage, MessageType } from '../models/ChatCompletion'
import UserContentBlock from './UserContentBlock'
import userIcon from '../assets/user.svg'
import systemIcon from '../assets/system.svg'
//import Markdown from 'react-markdown'

interface Props {
	block: ChatMessage
	loading: boolean
	isLastBlock: boolean
}

const ChatBlock: React.FC<Props> = ({ block, loading }) => {
	const [isEdit, setIsEdit] = useState(false)
	const [editedBlockContent, setEditedBlockContent] = useState('')
	const contentRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const errorStyles =
		block.messageType === MessageType.Error
			? {
					backgroundColor: '#F5E6E6',
					borderColor: 'red',
					borderWidth: '1px',
					borderRadius: '8px',
					padding: '10px',
			  }
			: {}

	useEffect(() => {
		if (isEdit) {
			textareaRef.current?.focus()
			textareaRef.current?.setSelectionRange(0, 0)
		}
	}, [isEdit])

	const handleEditSave = () => {
		// todo: notify main to change content block
		setIsEdit(false)
	}

	const handleEditCancel = () => {
		setIsEdit(false)
	}

	const checkForSpecialKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		const isEnter = e.key === 'Enter'
		const isEscape = e.key === 'Escape'

		if (isEnter) {
			e.preventDefault()
			handleEditSave()
		} else if (isEscape) {
			e.preventDefault()
			handleEditCancel()
		}
	}

	const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		setEditedBlockContent(event.target.value)
	}

	return (
		<div
			key={`chat-block-${block.id}`}
			className={`group w-full text-gray-800 dark:text-gray-100
            ${
							block.role === 'assistant'
								? 'bg-custom-gray dark:bg-gray-900'
								: 'bg-white dark:bg-gray-850'
						}`}
		>
			<div className="text-base p-4 flex m-auto flex-col">
				<div className="w-full flex">
					<div className="w-[24px] flex flex-col relative items-end mr-4">
						<div className="relative flex h-[24px] w-[24px] p-0 rounded-sm items-center justify-center">
							{block.role === 'user' ? (
								<img src={userIcon} alt="" />
							) : block.role === 'assistant' ? (
								<img src={systemIcon} alt="" />
							) : null}
						</div>
					</div>
					<div className="relative flex w-[calc(100%-50px)] flex-col gap-1 md:gap-3 lg:w-full">
						<div
							id={`message-block-${block.id}`}
							className="flex flex-grow flex-col gap-3"
							style={errorStyles}
						>
							<div className="min-h-[20px] flex flex-col items-start gap-4">
								{isEdit ? (
									<textarea
										spellCheck={false}
										tabIndex={0}
										ref={textareaRef}
										style={{
											height: undefined,
											lineHeight: '1.33',
											fontSize: '1rem',
										}}
										className="border border-black/10 bg-white dark:border-gray-900/50 dark:bg-gray-700 w-full m-0 p-0 pr-7 pl-2 md:pl-0 resize-none bg-transparent dark:bg-transparent  focus:ring-0 focus-visible:ring-0 outline-none shadow-none"
										onChange={handleTextChange}
										onKeyDown={checkForSpecialKey}
										value={editedBlockContent}
									></textarea>
								) : (
									<div
										ref={contentRef}
										className="markdown prose w-full break-words dark:prose-invert light text-left"
									>
										{block.role === 'user' ? (
											<UserContentBlock
												text={block.content}
												fileDataRef={block.fileDataRef ? block.fileDataRef : []}
											/>
										) : (
											<MarkdownBlock markdown={block.content} role={block.role} loading={loading} />
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ChatBlock
