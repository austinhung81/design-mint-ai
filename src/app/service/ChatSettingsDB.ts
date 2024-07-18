import Dexie from 'dexie'
import { ChatSettings } from '../models/ChatSettings'
import { EventEmitter } from './EventEmitter'

export interface ChatSettingsChangeEvent {
	action: 'edit' | 'delete'
	gid: number
}

export const chatSettingsEmitter = new EventEmitter<ChatSettingsChangeEvent>()

class ChatSettingsDB extends Dexie {
	chatSettings: Dexie.Table<ChatSettings, number>

	constructor() {
		super('chatSettingsDB')
		this.version(1).stores({
			chatSettings: '&id, name, description, instructions, model, seed, temperature, top_p, icon',
		})
		this.version(2)
			.stores({
				chatSettings:
					'&id, name, description, instructions, model, seed, temperature, top_p, icon, showInSidebar',
			})
			.upgrade(tx => {
				return tx
					.table('chatSettings')
					.toCollection()
					.modify(chatSetting => {
						chatSetting.showInSidebar = false
					})
			})
		this.version(3)
			.stores({
				chatSettings:
					'&id, name, description, instructions, model, seed, temperature, top_p, icon, showInSidebar',
			})
			.upgrade(tx => {
				return tx
					.table('chatSettings')
					.toCollection()
					.modify(chatSetting => {
						chatSetting.showInSidebar = chatSetting.showInSidebar ? 1 : 0
					})
			})
		this.version(4).stores({
			chatSettings: '&id, name, description, model, showInSidebar',
		})
		this.chatSettings = this.table('chatSettings')

		this.on('populate', () => {
			this.chatSettings.bulkAdd([
				{
					id: 1,
					author: 'system',
					name: 'React UI Developer',
					description: 'Focused on React/Typescript/TailwindCSS development.',
					instructions:
						'You are an experienced front end developer familiar with react, angular, typescript, tailwindcss, bootstrap, material, next.js. When providing code, preserve existing comments and do not add new comments. Code should wrapped at 80 characters if possible. Be as brief as possible.',
					model: null,
					seed: null,
					temperature: 0.2,
					top_p: null,
				},
				{
					id: 2,
					author: 'system',
					name: 'Math Tutor',
					description: 'Focused on solving math problems.',
					instructions:
						'All math equations or multi-line math expressions should be enclosed with $$..$$. Shorter math expressions should be enclosed with $..$.',
					model: null,
					seed: null,
					temperature: 0.2,
					top_p: null,
				},
			])
		})
	}
}

export async function getChatSettingsById(id: number): Promise<ChatSettings | undefined> {
	const db: ChatSettingsDB = new ChatSettingsDB()
	return db.chatSettings.get(id)
}

export async function updateShowInSidebar(id: number, showInSidebar: number) {
	try {
		await chatSettingsDB.chatSettings.update(id, { showInSidebar })
		let event: ChatSettingsChangeEvent = { action: 'edit', gid: id }
		chatSettingsEmitter.emit('chatSettingsChanged', event)
	} catch (error) {
		console.error('Failed to update:', error)
	}
}

export async function deleteChatSetting(id: number) {
	try {
		await chatSettingsDB.chatSettings.delete(id)
		let event: ChatSettingsChangeEvent = { action: 'delete', gid: id }
		chatSettingsEmitter.emit('chatSettingsChanged', event)
	} catch (error) {
		console.error('Failed to update:', error)
	}
}

const chatSettingsDB = new ChatSettingsDB()

export default chatSettingsDB
