import { getFigmaStorageValue } from '../../../lib/utils'
import React, { useEffect, useState } from 'react'

const Home = ({ setActiveTab }) => {
	const [apiKey, setApiKey] = useState('')
	const [openAiModel, setOpenAiModel] = useState('')

	useEffect(() => {
		async function fetchStorageValues() {
			const apiKey = await getFigmaStorageValue('openai_api_key')
			const key = (apiKey ?? '') as string
			console.log(key)
			setApiKey(key)

			const openAiModel = await getFigmaStorageValue('openai_model')
			const modal = (openAiModel ?? '') as string
			console.log(modal)
			setOpenAiModel(modal)
		}

		fetchStorageValues()
	}, [])

	const Welcome = () => {
		return (
			<div className="flex flex-col gap-60">
				<h1 className="text-2xl text-left text-mint400">Welcome 👋</h1>
				<span className="text-sm text-rice400">
					To start using, go to{' '}
					<span
						onClick={() => setActiveTab('setting')}
						className="underline underline-offset-2 text-mint400 cursor-pointer"
					>
						Settings
					</span>{' '}
					tab and set the OpenAI key
				</span>
			</div>
		)
	}

	return (
		<>
			{!apiKey ? (
				<Welcome />
			) : (
				<>
					<div>Start your Chat</div>
					<div>{openAiModel}</div>
				</>
			)}
		</>
	)
}

export default Home
