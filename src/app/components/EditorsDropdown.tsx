import React, { useState } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../components/ui/select'

const EditorsDropdown = () => {
	const [selectedEditor, setSelectedEditor] = useState('') // To store the selected editor

	const handleEditorChange = value => {
		let displayValue
		switch (value) {
			case 'me':
				displayValue = 'Me'
				break
			case 'all':
				displayValue = 'All'
				break
			default:
				displayValue = 'By: Me'
		}
		setSelectedEditor(`By: ${displayValue}`)
	}

	return (
		<Select onValueChange={handleEditorChange}>
			<SelectTrigger className="min-w-[120px] rounded-full">
				<SelectValue placeholder="By: Editor">{selectedEditor}</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="me">Me</SelectItem>
				<SelectItem value="all">All</SelectItem>
			</SelectContent>
		</Select>
	)
}

export default EditorsDropdown
