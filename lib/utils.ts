import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
