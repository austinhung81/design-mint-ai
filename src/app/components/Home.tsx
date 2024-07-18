import { getFigmaStorageValue } from '../../../lib/utils'
import React, { useEffect, useState } from 'react'
import ChatPage from './ChatPage'

const Home = ({ setActiveTab }) => {
	const [apiKey, setApiKey] = useState('')

	useEffect(() => {
		async function fetchStorageValues() {
			const apiKey = await getFigmaStorageValue('openai_api_key')
			setApiKey((apiKey ?? '') as string)
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

	return <>{!apiKey ? <Welcome /> : <ChatPage />}</>
}

export default Home
