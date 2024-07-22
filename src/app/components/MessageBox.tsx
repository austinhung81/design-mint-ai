// MessageBox.tsx
import React, {
	FormEvent,
	forwardRef,
	KeyboardEvent,
	useCallback,
	useImperativeHandle,
	useRef,
	useState,
} from 'react'
import { MAX_ROWS, SNIPPET_MARKERS } from '../constants/appConstants'
import { SubmitButton } from './SubmitButton'
import { ChatService } from '../service/ChatService'
import { StopCircleIcon } from '@heroicons/react/24/outline'
import Tooltip from '../../../components/ui/tooltip'
import FileDataPreview from './FileDataPreview'
import { FileDataRef } from '../models/FileData'
import { preprocessImage } from '../../../lib/ImageUtils'
import MessageTextarea from './MessageTextarea'

interface MessageBoxProps {
	callApp: Function
	loading: boolean
	setLoading: (loading: boolean) => void
	allowImageAttachment: string
	componentNames: string[]
}

// Methods exposed to clients using useRef<MessageBoxHandles>
export interface MessageBoxHandles {
	clearInputValue: () => void
	getTextValue: () => string
	reset: () => void
	resizeTextArea: () => void
	focusTextarea: () => void
	pasteText: (text: string) => void
}

const MessageBox = forwardRef<MessageBoxHandles, MessageBoxProps>(
	({ loading, setLoading, callApp, allowImageAttachment, componentNames }, ref) => {
		const textValue = useRef('')
		const [isTextEmpty, setIsTextEmpty] = useState(true)
		const textAreaRef = useRef<HTMLTextAreaElement>(null)
		const resizeTimeoutRef = useRef<number | null>(null)
		const [fileDataRef, setFileDataRef] = useState<FileDataRef[]>([])
		const [isSubmitted, setIsSubmitted] = useState(false)

		const setTextValue = (value: string) => {
			textValue.current = value
		}

		const setTextAreaValue = (value: string) => {
			if (textAreaRef.current) {
				textAreaRef.current.value = value
			}
			setIsTextEmpty(textAreaRef.current?.value.trim() === '')
			debouncedResize()
		}

		useImperativeHandle(ref, () => ({
			// Method to clear the textarea
			clearInputValue: () => {
				clearValueAndUndoHistory()
			},
			getTextValue: () => {
				return textValue.current
			},
			reset: () => {
				clearValueAndUndoHistory()
				setTextValue('')
				setTextAreaValue('')
				setFileDataRef([])
			},
			resizeTextArea: () => {
				if (textAreaRef.current) {
					textAreaRef.current.style.height = 'auto'
				}
			},
			focusTextarea: () => {
				if (textAreaRef.current) {
					textAreaRef.current.focus()
				}
			},
			pasteText: (text: string) => {
				insertTextAtCursorPosition(text)
			},
		}))

		// Function to handle auto-resizing of the textarea
		const handleAutoResize = useCallback(() => {
			if (textAreaRef.current) {
				const target = textAreaRef.current
				const maxHeight = parseInt(getComputedStyle(target).lineHeight || '0', 10) * MAX_ROWS

				target.style.height = 'auto'
				if (target.scrollHeight <= maxHeight) {
					target.style.height = `${target.scrollHeight}px`
				} else {
					target.style.height = `${maxHeight}px`
				}
			}
		}, [])

		// Debounced resize function
		const debouncedResize = useCallback(() => {
			if (resizeTimeoutRef.current !== null) {
				clearTimeout(resizeTimeoutRef.current)
			}
			resizeTimeoutRef.current = window.setTimeout(() => {
				handleAutoResize()
			}, 100) // Adjust the debounce time as needed
		}, [])

		const handleTextValueUpdated = () => {
			debouncedResize()

			// After resizing, scroll the textarea to the insertion point (end of the pasted text).
			if (textAreaRef.current) {
				const textarea = textAreaRef.current
				// Check if the pasted content goes beyond the max height (overflow scenario)
				if (textarea.scrollHeight > textarea.clientHeight) {
					// Scroll to the bottom of the textarea
					textarea.scrollTop = textarea.scrollHeight
				}
			}
		}

		function clearValueAndUndoHistory() {
			setFileDataRef([])
			setTextValue('')
			setTextAreaValue('')
		}

		const insertTextAtCursorPosition = (textToInsert: string) => {
			if (textAreaRef.current) {
				const textArea = textAreaRef.current
				const startPos = textArea.selectionStart || 0
				const endPos = textArea.selectionEnd || 0
				const text = textArea.value
				const newTextValue = text.substring(0, startPos) + textToInsert + text.substring(endPos)

				// Update the state with the new value
				setTextValue(newTextValue)
				setTextAreaValue(newTextValue)

				// Dispatch a new InputEvent for the insertion of text
				// This event should be undoable
				// const inputEvent = new InputEvent('input', {
				//   bubbles: true,
				//   cancelable: true,
				//   inputType: 'insertText',
				//   data: textToInsert,
				// });
				// textArea.dispatchEvent(inputEvent);

				// Move the cursor to the end of the inserted text
				const newCursorPos = startPos + textToInsert.length
				setTimeout(() => {
					textArea.selectionStart = newCursorPos
					textArea.selectionEnd = newCursorPos
					// Scroll to the insertion point after the DOM update
					if (textArea.scrollHeight > textArea.clientHeight) {
						textArea.scrollTop = textArea.scrollHeight
					}
				}, 0)
			}
		}

		const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
			if (event.clipboardData && event.clipboardData.items) {
				const items = event.clipboardData.items

				for (const item of items) {
					if (item.type.indexOf('image') === 0 && allowImageAttachment !== 'no') {
						event.preventDefault()
						const file = item.getAsFile()
						if (file) {
							const reader = new FileReader()
							reader.onload = loadEvent => {
								if (loadEvent.target !== null) {
									const base64Data = loadEvent.target.result

									if (typeof base64Data === 'string') {
										preprocessImage(file, (base64Data, processedFile) => {
											setFileDataRef(prevData => [
												...prevData,
												{
													id: 0,
													fileData: {
														data: base64Data,
														type: processedFile.type,
														source: 'pasted',
														filename: 'pasted-image',
													},
												},
											])
										})
										if (allowImageAttachment == 'warn') {
											// todo: could warn user
										}
									}
								}
							}
							reader.readAsDataURL(file)
						}
					} else {
					}
				}
			}

			// Get the pasted text from the clipboard
			const pastedText = event.clipboardData.getData('text/plain')

			// Check if the pasted text contains the snippet markers
			const containsBeginMarker = pastedText.includes(SNIPPET_MARKERS.begin)
			const containsEndMarker = pastedText.includes(SNIPPET_MARKERS.end)

			// If either marker is found, just allow the default paste behavior
			if (containsBeginMarker || containsEndMarker) {
				return // Early return if markers are present
			}

			// Count the number of newlines in the pasted text
			const newlineCount = (pastedText.match(/\n/g) || []).length

			// Check if there are MAX_ROWS or more newlines
			if (newlineCount >= MAX_ROWS || pastedText.length > 80 * MAX_ROWS) {
				event.preventDefault()
				const modifiedText = `${SNIPPET_MARKERS.begin}\n${pastedText}\n${SNIPPET_MARKERS.end}\n`
				insertTextAtCursorPosition(modifiedText)
			} else {
				// Allow the default paste behavior to occur
				// The textarea value will be updated automatically
			}
		}

		const checkForSpecialKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
			const isEnter = e.key === 'Enter'

			if (isEnter) {
				/*if (e.shiftKey) {
					return
				} else {
					if (!loading) {
						e.preventDefault()
						if (textAreaRef.current) {
							setTextValue(textAreaRef.current.value)
						}
						callApp(
							textAreaRef.current?.value || '',
							allowImageAttachment === 'yes' ? fileDataRef : []
						)
					}
				}*/
			}
		}

		const handleTextChange = () => {
			console.log('handleTextChange', textAreaRef.current?.value)
			setIsSubmitted(false)
			setIsTextEmpty(textAreaRef.current?.value.trim() === '')
			handleTextValueUpdated()
		}

		const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			e.stopPropagation()
			if (textAreaRef.current) {
				setTextValue(textAreaRef.current.value)
			}
			callApp(textAreaRef.current?.value || '', allowImageAttachment === 'yes' ? fileDataRef : [])
			if (textAreaRef.current) {
				textAreaRef.current.style.height = 'auto'
			}
			setIsSubmitted(true)
		}
		const handleCancel = (event: React.MouseEvent<HTMLButtonElement>) => {
			event.preventDefault()
			event.stopPropagation()

			ChatService.cancelStream()
			setLoading(false)
		}

		const handleRemoveFileData = (index: number) => {
			setFileDataRef(fileDataRef.filter((_, i) => i !== index))
		}

		return (
			<div className="fix bottom-0 left-0 w-full bg-rice200 p-4">
				<form
					onSubmit={handleSubmit}
					className="stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl 4xl:max-w7xl"
				>
					<div
						id="message-box-border"
						style={{ borderRadius: '1rem' }}
						className="relative flex min-h-[135px] w-full p-4 bg-white"
					>
						{/* FileDataPreview Full Width at the Top */}
						{fileDataRef.length > 0 && (
							<div className="w-full">
								<FileDataPreview
									fileDataRef={fileDataRef}
									removeFileData={handleRemoveFileData}
									allowImageAttachment={allowImageAttachment == 'yes'}
								/>
							</div>
						)}
						{/* Container for Textarea and Buttons */}
						<div className="flex flex-col w-full relative">
							{/* Grammarly extension container */}
							{/*<div
								className="flex items-center "
								style={{ flexShrink: 0, minWidth: 'fit-content' }}
							>
								 Grammarly extension buttons will render here without overlapping 
							</div>*/}

							{/* Textarea */}
							<MessageTextarea
								id="sendMessageInput"
								name="message"
								ref={textAreaRef}
								placeholder="Find anything......"
								onKeyDownEvent={checkForSpecialKey}
								onChangeEvent={handleTextChange}
								onPasteEvent={handlePaste}
								clearValue={isSubmitted}
								componentNames={componentNames}
							/>

							{/* Cancel/Submit Button */}
							<div className="flex justify-end">
								{loading ? (
									<Tooltip title="cancel-output" side="top" sideOffset={0}>
										<button onClick={e => handleCancel(e)} className="p-1">
											<StopCircleIcon className="h-6 w-6" />
										</button>
									</Tooltip>
								) : (
									<SubmitButton disabled={isTextEmpty || loading} loading={loading} />
								)}
							</div>
						</div>
					</div>
				</form>
			</div>
		)
	}
)

export default MessageBox
