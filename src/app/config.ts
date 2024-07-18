import { getFigmaStorageValue } from '../../lib/utils'

export async function fetchStorageAPIKey() {
	const apiKey = await getFigmaStorageValue('openai_api_key')
	const key = (apiKey ?? '') as string
	return key
}
