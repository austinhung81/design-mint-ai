import { db } from '../../../firebaseConfig'
import {
	collection,
	doc,
	getDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	getDocs,
	query,
	orderBy,
	limit,
	where,
} from 'firebase/firestore'
import { EventEmitter } from './EventEmitter'
import FileDataService from './FileDataService'
import { ChatMessage } from '../models/ChatCompletion'
import { getUser } from '../../../lib/utils'
import { User } from '../components/ChatPage'

export interface Conversation {
	id: string // Changed from number to string
	userId: string
	gid: number
	timestamp: number
	title: string
	model: string | null
	systemPrompt: string
	messages: string // stringified ChatMessage[]
	marker?: boolean
}

export interface ConversationChangeEvent {
	action: 'add' | 'edit' | 'delete'
	id: string // Changed from number to string
	conversation?: Conversation // not set on delete
}

const conversationsCollection = collection(db, 'conversations')
const NUM_INITIAL_CONVERSATIONS = 200

class ConversationService {
	static async getConversationById(id: string): Promise<Conversation | undefined> {
		// Changed from number to string
		const docRef = doc(conversationsCollection, id)
		const docSnap = await getDoc(docRef)
		return docSnap.exists() ? (docSnap.data() as Conversation) : undefined
	}

	static async getChatMessages(conversation: Conversation): Promise<ChatMessage[]> {
		const messages: ChatMessage[] = JSON.parse(conversation.messages)

		const messagesWithFileDataPromises = messages.map(async message => {
			if (!message.fileDataRef) {
				return message
			}
			const fileDataRefsPromises = (message.fileDataRef || []).map(async fileDataRef => {
				fileDataRef.fileData = (await FileDataService.getFileData(fileDataRef.id)) || null
				return fileDataRef
			})

			message.fileDataRef = await Promise.all(fileDataRefsPromises)
			return message
		})

		// Wait for all messages to have their fileDataRefs loaded
		return Promise.all(messagesWithFileDataPromises)
	}

	static async searchConversationsByTitle(searchString: string): Promise<Conversation[]> {
		const q = query(
			conversationsCollection,
			where('title', '>=', searchString),
			where('title', '<=', searchString + '\uf8ff')
		)
		const querySnapshot = await getDocs(q)
		return querySnapshot.docs.map(doc => doc.data() as Conversation)
	}

	static async searchWithinConversations(searchString: string): Promise<Conversation[]> {
		const querySnapshot = await getDocs(conversationsCollection)
		return querySnapshot.docs
			.map(doc => doc.data() as Conversation)
			.filter(conversation => conversation.messages.includes(searchString))
	}

	static async addConversation(conversation: Conversation): Promise<void> {
		const docRef = doc(conversationsCollection, conversation.id)
		await setDoc(docRef, conversation)
		let event: ConversationChangeEvent = {
			action: 'add',
			id: conversation.id,
			conversation: conversation,
		}
		conversationsEmitter.emit('conversationChangeEvent', event)
	}

	static deepCopyChatMessages(messages: ChatMessage[]): ChatMessage[] {
		return messages.map(msg => ({
			...msg,
			fileDataRef: msg.fileDataRef?.map(fileRef => ({
				...fileRef,
				fileData: fileRef.fileData ? { ...fileRef.fileData } : null,
			})),
		}))
	}

	static async updateConversation(
		conversation: Conversation,
		messages: ChatMessage[]
	): Promise<void> {
		const messagesCopy = ConversationService.deepCopyChatMessages(messages)

		for (let i = 0; i < messagesCopy.length; i++) {
			const fileDataRefs = messagesCopy[i].fileDataRef
			if (fileDataRefs) {
				for (let j = 0; j < fileDataRefs.length; j++) {
					const fileRef = fileDataRefs[j]
					if (fileRef.id === 0 && fileRef.fileData) {
						const fileId = await FileDataService.addFileData(fileRef.fileData)
						// Update the ID in both messagesCopy and the original messages array
						fileDataRefs[j].id = fileId
						messages[i].fileDataRef![j].id = fileId
					}
					// Set the fileData to null after processing
					fileDataRefs[j].fileData = null
				}
			}
		}

		conversation.messages = JSON.stringify(messagesCopy)
		const docRef = doc(conversationsCollection, conversation.id)
		await setDoc(docRef, conversation, { merge: true })
		let event: ConversationChangeEvent = {
			action: 'edit',
			id: conversation.id,
			conversation: conversation,
		}
		conversationsEmitter.emit('conversationChangeEvent', event)
	}

	static async updateConversationPartial(conversation: Conversation, changes: any): Promise<void> {
		const docRef = doc(conversationsCollection, conversation.id)
		await updateDoc(docRef, changes)
	}

	static async deleteConversation(id: string): Promise<void> {
		// Changed from number to string
		const docRef = doc(conversationsCollection, id)
		const docSnap = await getDoc(docRef)

		if (docSnap.exists()) {
			const conversation = docSnap.data() as Conversation
			const messages: ChatMessage[] = JSON.parse(conversation.messages)

			for (let message of messages) {
				if (message.fileDataRef && message.fileDataRef.length > 0) {
					await Promise.all(
						message.fileDataRef.map(async fileRef => {
							if (fileRef.id) {
								await FileDataService.deleteFileData(fileRef.id)
							}
						})
					)
				}
			}
			await deleteDoc(docRef)
			let event: ConversationChangeEvent = { action: 'delete', id: id }
			conversationsEmitter.emit('conversationChangeEvent', event)
		} else {
			console.log(`Conversation with ID ${id} not found.`)
		}
	}

	static async deleteAllConversations(): Promise<void> {
		const querySnapshot = await getDocs(conversationsCollection)
		const batch = db.batch()
		querySnapshot.forEach(doc => {
			batch.delete(doc.ref)
		})
		await batch.commit()
		await FileDataService.deleteAllFileData()
		let event: ConversationChangeEvent = { action: 'delete', id: '0' }
		conversationsEmitter.emit('conversationChangeEvent', event)
	}

	static async loadRecentConversationsTitleOnly(): Promise<Conversation[]> {
		const user = (await getUser()) as User
		try {
			const q = query(
				conversationsCollection,
				where('userId', '==', user.id),
				orderBy('timestamp', 'desc'),
				limit(NUM_INITIAL_CONVERSATIONS)
			)
			const querySnapshot = await getDocs(q)
			return querySnapshot.docs.map(doc => {
				const conversation = doc.data() as Conversation
				const conversationWithEmptyMessages = { ...conversation, messages: '[]' }
				return conversationWithEmptyMessages
			})
		} catch (error) {
			console.error('Error loading recent conversations:', error)
			throw error
		}
	}

	static async countConversationsByGid(id: number): Promise<number> {
		const q = query(conversationsCollection, where('gid', '==', id))
		const querySnapshot = await getDocs(q)
		return querySnapshot.size
	}

	static async deleteConversationsByGid(gid: number): Promise<void> {
		const q = query(conversationsCollection, where('gid', '==', gid))
		const querySnapshot = await getDocs(q)
		for (const doc of querySnapshot.docs) {
			await ConversationService.deleteConversation(doc.id)
		}
		let event: ConversationChangeEvent = { action: 'delete', id: '0' }
		conversationsEmitter.emit('conversationChangeEvent', event)
	}
}

export const conversationsEmitter = new EventEmitter<ConversationChangeEvent>()
export default ConversationService
