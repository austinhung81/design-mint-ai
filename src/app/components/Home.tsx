import { getFigmaStorageValue, getProjectMainComponents } from '../../../lib/utils'
import React, { useEffect, useState } from 'react'
import ChatPage from './ChatPage'

const Home = ({ setActiveTab }) => {
	const [apiKey, setApiKey] = useState('')
	//const [componentNames, setComponentNames] = useState([])

	useEffect(() => {
		async function fetchStorageValues() {
			const apiKey = await getFigmaStorageValue('openai_api_key')
			const openaiModel = await getFigmaStorageValue('openai_model')
			const componentNames = await getProjectMainComponents()
			console.log('componentNames', componentNames)
			if (!apiKey || !openaiModel) {
				setApiKey(null)
				return
			}
			const userAPIKey = (apiKey ?? '') as string
			setApiKey(userAPIKey)
		}

		fetchStorageValues()
		// Send a message to get main component names
	}, []) // Depend on activeTab to re-run when it changes

	const Welcome = () => {
		return (
			<div className="flex flex-col gap-60 p-4">
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

	return <>{!apiKey ? <Welcome /> : <ChatPage setActiveTab={setActiveTab} />}</>
}

export default Home
