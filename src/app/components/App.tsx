import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import '../style.css'
import Setting from './Setting'
import Home from './Home'

function App() {
	const [activeTab, setActiveTab] = useState('home')
	return (
		<Tabs
			value={activeTab}
			onValueChange={setActiveTab}
			className="flex flex-col justify-start items-start"
		>
			<TabsList className="px-4 border-y w-full flex items-start justify-start">
				<TabsTrigger value="home">Home</TabsTrigger>
				<TabsTrigger value="history">History</TabsTrigger>
				<TabsTrigger value="setting">Setting</TabsTrigger>
			</TabsList>
			<TabsContent value="home" className="h-[calc(100vh-52px)] p-0">
				<Home setActiveTab={setActiveTab} />
			</TabsContent>
			<TabsContent value="history">History Page</TabsContent>
			<TabsContent value="setting">
				<Setting />
			</TabsContent>
		</Tabs>
	)
}

export default App
