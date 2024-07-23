import React, {
	ChangeEvent,
	KeyboardEvent,
	RefObject,
	forwardRef,
	useDeferredValue,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from 'react'

import {
	getAnchorRect,
	getSearchValue,
	getTrigger,
	getTriggerOffset,
	replaceValue,
} from '../../../lib/utils'
import { Combobox, ComboboxPopover, ComboboxItem, useComboboxStore } from '@ariakit/react/combobox'
import { matchSorter } from 'match-sorter'

interface MessageTextareaProps {
	id: string
	name: string
	clearValue: boolean
	onKeyDownEvent: (event: KeyboardEvent<HTMLTextAreaElement>) => void
	onChangeEvent: (event: ChangeEvent<HTMLTextAreaElement>) => void
	onPasteEvent: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void
	placeholder: string
	componentNames: string[]
}

function getList({ trigger, componentNames }) {
	switch (trigger) {
		case '/':
			return componentNames.map(component => component)
		default:
			return []
	}
}

function getValue({ value, trigger, componentNames }) {
	const list = trigger === '/' ? componentNames : []
	return list.find(item => item === value)
}

const MessageTextarea = forwardRef<HTMLTextAreaElement, MessageTextareaProps>(
	(
		{
			id,
			name,
			clearValue,
			onKeyDownEvent,
			onChangeEvent,
			onPasteEvent,
			placeholder,
			componentNames,
		},
		ref: RefObject<HTMLTextAreaElement>
	) => {
		const [value, setValue] = useState('')
		const [trigger, setTrigger] = useState<string | null>(null)
		const [caretOffset, setCaretOffset] = useState<number | null>(null)

		const combobox = useComboboxStore()

		const searchValue = combobox.useState('value')
		const deferredSearchValue = useDeferredValue(searchValue)

		const matches = useMemo(() => {
			return matchSorter(getList({ trigger, componentNames }), deferredSearchValue, {
				baseSort: (a, b) => (a.index < b.index ? -1 : 1),
			}).slice(0, 10)
		}, [trigger, deferredSearchValue])

		const hasMatches = !!matches.length

		useLayoutEffect(() => {
			combobox.setOpen(hasMatches)
		}, [combobox, hasMatches])

		useLayoutEffect(() => {
			if (caretOffset != null) {
				ref.current?.setSelectionRange(caretOffset, caretOffset)
			}
		}, [caretOffset])

		useLayoutEffect(() => {
			if (clearValue) {
				setValue('')
			}
		}, [clearValue])

		// Re-calculates the position of the combobox popover in case the changes on
		// the textarea value have shifted the trigger character.
		useEffect(combobox.render, [combobox, value])

		const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
				combobox.hide()
			}
		}

		const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
			const trigger = getTrigger(event.target)
			const searchValue = getSearchValue(event.target)
			if (trigger) {
				setTrigger(trigger)
				combobox.show()
			} else if (!searchValue) {
				setTrigger(null)
				combobox.hide()
			}
			setValue(event.target.value)
			combobox.setValue(searchValue)
		}

		const onItemClick = (value: string) => () => {
			const textarea = ref.current
			if (!textarea) return
			const offset = getTriggerOffset(textarea)
			const displayValue = getValue({ value, trigger, componentNames })
			if (!displayValue) return
			setTrigger(null)
			setValue(replaceValue(offset, searchValue, displayValue))
			const nextCaretOffset = offset + displayValue.length + 1
			setCaretOffset(nextCaretOffset)
		}

		return (
			<div className="wrapper">
				<Combobox
					store={combobox}
					autoSelect
					value={value}
					// We'll overwrite how the combobox popover is shown, so we disable
					// the default behaviors.
					showOnClick={false}
					showOnChange={false}
					showOnKeyPress={false}
					// To the combobox state, we'll only set the value after the trigger
					// character (the search value), so we disable the default behavior.
					setValueOnChange={false}
					render={
						<textarea
							id={id}
							name={name}
							tabIndex={0}
							ref={ref}
							rows={4}
							className="flex-1 m-0 resize-none border-0 bg-transparent text-sm focus:ring-0 focus-visible:ring-0 outline-none shadow-none placeholder:text-sm"
							placeholder={placeholder}
							onScroll={combobox.render}
							// Hide the combobox popover whenever the selection changes.
							onPointerDown={combobox.hide}
							onChange={e => {
								onChange(e)
								onChangeEvent(e)
							}}
							onKeyDown={e => {
								onKeyDown(e)
								onKeyDownEvent(e)
							}}
							onPaste={onPasteEvent}
						/>
					}
				/>
				<ComboboxPopover
					store={combobox}
					hidden={!hasMatches}
					unmountOnHide
					fitViewport
					getAnchorRect={() => {
						const textarea = ref.current
						if (!textarea) return null
						return getAnchorRect(textarea)
					}}
					className="relative z-50 flex flex-col overflow-auto overscroll-contain border border-rice300 bg-white text-rice500 w-[245px] rounded-[8px]"
				>
					{matches.map(value => (
						<ComboboxItem
							key={value}
							value={value}
							focusOnHover
							onClick={onItemClick(value)}
							className="combobox-item flex cursor-default items-center gap-2 py-2 px-3 hover:bg-rice200 data-[active-item]:bg-rice200 leading-6"
						>
							<span>{value}</span>
						</ComboboxItem>
					))}
				</ComboboxPopover>
			</div>
		)
	}
)

export default MessageTextarea
