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
import { getFigmaStorageValue } from '../../../lib/utils'

const Setting = () => {
	const [apiKey, setApiKey] = useState('')
	const [openAiModel, setOpenAiModel] = useState('')

	const handleApiKeyChange = e => {
		const key = e.target.value
		window.parent.postMessage(
			{ pluginMessage: { type: 'set-value', name: 'openai_api_key', value: key } },
			'*'
		)
		setApiKey(key)
	}

	const handleOpenAiModelChange = key => {
		window.parent.postMessage(
			{ pluginMessage: { type: 'set-value', name: 'openai_model', value: key } },
			'*'
		)
		setOpenAiModel(key)
	}

	useEffect(() => {
		async function fetchStorageValues() {
			const apiKey = await getFigmaStorageValue('openai_api_key')
			const key = (apiKey ?? '') as string
			setApiKey(key)

			const openAiModel = await getFigmaStorageValue('openai_model')
			const modal = (openAiModel ?? 'gpt-3.5-turbo') as string
			window.parent.postMessage(
				{ pluginMessage: { type: 'set-value', name: 'openai_model', value: modal } },
				'*'
			)
			setOpenAiModel(modal)
		}

		fetchStorageValues()
	}, [])

	return (
		<div className="w-full flex flex-col gap-6">
			{/* API Key Input */}
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

			{/* Model Selection Dropdown */}
			<div className="flex flex-col justify-start items-start gap-2">
				<label htmlFor="model" className="block text-sm text-rice500 text-left">
					Model
				</label>
				<Select value={openAiModel} onValueChange={handleOpenAiModelChange}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
							<SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
							<SelectItem value="gpt-4">gpt-4</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}

export default Setting
