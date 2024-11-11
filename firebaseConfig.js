import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
	apiKey: process.env.FIREBASE_API_KEY,
	authDomain: 'design-mint-ai-32e24.firebaseapp.com',
	databaseURL: 'https://design-mint-ai-32e24-default-rtdb.asia-southeast1.firebasedatabase.app',
	projectId: 'design-mint-ai-32e24',
	storageBucket: 'design-mint-ai-32e24.firebasestorage.app',
	messagingSenderId: '706788338098',
	appId: '1:706788338098:web:eae1e8e6c6f8a20ebcdcab',
	measurementId: 'G-TLYDW5SBSC',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }
