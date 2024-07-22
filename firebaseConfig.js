import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
	apiKey: process.env.FIREBASE_API_KEY,
	authDomain: 'design-mint-ai-3d5c8.firebaseapp.com',
	databaseURL: 'https://design-mint-ai-3d5c8-default-rtdb.asia-southeast1.firebasedatabase.app',
	projectId: 'design-mint-ai-3d5c8',
	storageBucket: 'design-mint-ai-3d5c8.appspot.com',
	messagingSenderId: '527960724381',
	appId: '1:527960724381:web:1eb3d9477d32db4db69574',
	measurementId: 'G-DYS319W0EC',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }
