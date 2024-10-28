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

	/*// Fetch the files from Figma API
	const fetchFiles = async token => {
		try {
			const response = await fetch('https://api.figma.com/v1/files', {
				headers: {
					Authorization: `Bearer ${'figu_mjXUZE759W2Bemt7_XvKx1JjZSj9VTmsql-4im36'}`,
				},
			})
			const data = await response.json()
			if (data.files) {
				setFiles(data.files) // Set the fetched files to state
			}
		} catch (error) {
			console.error('Error fetching files:', error)
		}
	}*/

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
		/*
		const handleMessage = event => {
			if (event.origin !== 'http://54.199.221.121:8000') {
				console.warn('Origin mismatch:', event.origin)
				return
			}

			const accessToken = event.data.accessToken || 'figu_mjXUZE759W2Bemt7_XvKx1JjZSj9VTmsql-4im36'
			if (accessToken) {
				setAccessToken(accessToken)
				window.parent.postMessage(
					{ pluginMessage: { type: 'set-value', name: 'figma_access_token', value: accessToken } },
					'*'
				)
				fetchFiles(accessToken) // Fetch files after receiving the access token
			} else {
				console.error('No access token received')
			}
		}

		window.addEventListener('message', handleMessage)

		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'set-value',
					name: 'figma_access_token',
					value: 'figu_mjXUZE759W2Bemt7_XvKx1JjZSj9VTmsql-4im36',
				},
			},
			'*'
		)

		fetchFiles('figu_mjXUZE759W2Bemt7_XvKx1JjZSj9VTmsql-4im36')

		return () => {
			window.removeEventListener('message', handleMessage)
		}*/
	}, [])

	// Handle OAuth button click
	/*const handleOauth = () => {
		window.open('http://54.199.221.121:8000/auth')
	}

	// Handle file selection from the dropdown
	const handleFileSelect = fileId => {
		setSelectedFile(fileId)
		console.log('Selected file ID:', fileId)
		window.parent.postMessage(
			{ pluginMessage: { type: 'set-value', name: 'selected_file_id', value: fileId } },
			'*'
		)
	}*/

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
