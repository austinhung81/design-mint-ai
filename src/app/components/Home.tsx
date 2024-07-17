import React, { useEffect, useState } from 'react'

const Home = ({ setActiveTab }) => {
	const [apiKey, setApiKey] = useState('')

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
				</>
			)}
		</>
	)
}

export default Home
