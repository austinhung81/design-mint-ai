import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import getCaretCoordinates from 'textarea-caret'

export const defaultTriggers = ['/']

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function getFigmaStorageValue(name) {
	window.parent.postMessage({ pluginMessage: { type: 'get-value', name: name } }, '*')

	const promise = new Promise(function (resolve) {
		window.addEventListener(
			'message',
			function (event) {
				resolve(event.data.pluginMessage.value)
			},
			{ once: true }
		)
	})

	return promise
}

export function getProjectMainComponents() {
	window.parent.postMessage({ pluginMessage: { type: 'get-main-component-names' } }, '*')

	const promise = new Promise(function (resolve) {
		window.addEventListener(
			'message',
			function (event) {
				resolve(event.data.pluginMessage.names)
			},
			{ once: true }
		)
	})

	return promise
}

export function getProjectColorStyles() {
	window.parent.postMessage({ pluginMessage: { type: 'get-color-styles' } }, '*')

	const promise = new Promise(function (resolve) {
		window.addEventListener(
			'message',
			function (event) {
				resolve(event.data.pluginMessage.colors)
			},
			{ once: true }
		)
	})

	return promise
}

export function getProjectEditors() {
	window.parent.postMessage({ pluginMessage: { type: 'get-editors' } }, '*')

	const promise = new Promise(function (resolve) {
		window.addEventListener(
			'message',
			function (event) {
				resolve(event.data.pluginMessage.editors)
			},
			{ once: true }
		)
	})

	return promise
}

export function getFrames({ keywords, colors }: { keywords: string[]; colors: string[] }) {
	window.parent.postMessage({ pluginMessage: { type: 'find-frames', keywords, colors } }, '*')

	const promise = new Promise(function (resolve) {
		window.addEventListener(
			'message',
			function (event) {
				resolve(event.data.pluginMessage.frames)
			},
			{ once: true }
		)
	})

	return promise
}

export function getUser() {
	window.parent.postMessage({ pluginMessage: { type: 'get-user' } }, '*')

	const promise = new Promise(function (resolve) {
		window.addEventListener(
			'message',
			function (event) {
				resolve(event.data.pluginMessage.user)
			},
			{ once: true }
		)
	})

	return promise
}

export function getTriggerOffset(element: HTMLTextAreaElement, triggers = defaultTriggers) {
	const { value, selectionStart } = element
	for (let i = selectionStart; i >= 0; i--) {
		const char = value[i]
		if (char && triggers.includes(char)) {
			return i
		}
	}
	return -1
}

export function getTrigger(element: HTMLTextAreaElement, triggers = defaultTriggers) {
	const { value, selectionStart } = element
	const previousChar = value[selectionStart - 1]
	if (!previousChar) return null
	const secondPreviousChar = value[selectionStart - 2]
	const isIsolated = !secondPreviousChar || /\s/.test(secondPreviousChar)
	if (!isIsolated) return null
	if (triggers.includes(previousChar)) return previousChar
	return null
}

export function getSearchValue(element: HTMLTextAreaElement, triggers = defaultTriggers) {
	const offset = getTriggerOffset(element, triggers)
	if (offset === -1) return ''
	return element.value.slice(offset + 1, element.selectionStart)
}

export function getAnchorRect(element: HTMLTextAreaElement, triggers = defaultTriggers) {
	const offset = getTriggerOffset(element, triggers)
	const { left, top, height } = getCaretCoordinates(element, offset + 1)
	const { x, y } = element.getBoundingClientRect()
	return {
		x: left + x - element.scrollLeft,
		y: top + y - element.scrollTop,
		height,
	}
}

export function replaceValue(offset: number, searchValue: string, displayValue: string) {
	return (prevValue: string) => {
		const nextValue = `${prevValue.slice(0, offset) + displayValue} ${prevValue.slice(
			offset + searchValue.length + 1
		)}`
		return nextValue
	}
}
