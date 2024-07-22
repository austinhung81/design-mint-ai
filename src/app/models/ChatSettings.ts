export interface ChatSettings {
	id: string
	author: string
	icon?: null
	name: string
	description?: string
	instructions?: string
	model: string | null
	seed?: number | null
	temperature?: number | null
	top_p?: number | null
	showInSidebar?: number
}
