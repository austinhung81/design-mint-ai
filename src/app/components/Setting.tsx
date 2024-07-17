import React, { useEffect, useState } from 'react'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../components/ui/select'

import { Input } from '../../../components/ui/input'

const Setting = () => {
	const [apiKey, setApiKey] = useState('')

	const handleApiKeyChange = e => {
		const key = e.target.value
		window.parent.postMessage(
			{ pluginMessage: { type: 'set-value', name: 'openai_api_key', value: key } },
			'*'
		)
		setApiKey(key)
	}

	const getFigmaStorageValue = name => {
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

	useEffect(() => {
		getFigmaStorageValue('openai_api_key').then(value => {
			const key = (value ?? '') as string
			setApiKey(key)
		})
	}, [])

	return (
		<div className="w-full flex flex-col gap-6">
			<div className="flex flex-col justify-start items-start gap-2">
				<label htmlFor="model" className="block text-sm text-rice500 text-left w-full">
					<div className="flex items-center justify-between">
						<span>OpenAI API Key</span>
						<a
							href="https://platform.openai.com/api-keys"
							target="_blank"
							className="text-sm text-mint400 no-underline"
						>
							Get API key
						</a>
					</div>
				</label>
				<Input
					type="text"
					placeholder="Paste your key here"
					value={apiKey}
					onChange={handleApiKeyChange}
					id="apiKey"
				/>
			</div>
			<div className="flex flex-col justify-start items-start gap-2">
				<label htmlFor="model" className="block text-sm text-rice500 text-left">
					Model
				</label>
				<Select defaultValue="gbt-3.5-turbo">
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="gbt-3.5-turbo">gbt-3.5-turbo</SelectItem>
							<SelectItem value="gbt-4-turbo">gbt-4-turbo</SelectItem>
							<SelectItem value="gtp-4">gtp-4</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}

export default Setting
