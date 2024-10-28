figma.showUI(__html__, { width: 600, height: 700, title: 'Mint AI' })

/* Handle postMessage from backend (optional)
window.onmessage = event => {
	if (event.data.pluginMessage) {
		const token = event.data.pluginMessage
		// Store the token and use it for future API requests
		console.log('OAuth token:', token)
	}
}*/

function getMainComponentNames() {
	const mainComponents = figma.root.findAll(node => node.type === 'COMPONENT')
	let componentNames = mainComponents.map(component => {
		// Check if the component has a parent and the parent has a name
		//console.log('component.parent:', component.parent)
		const parentName =
			component.parent && component.parent.name && component.parent.type !== 'PAGE'
				? component.parent.name
				: component.name
		return parentName
	})

	// Optional: Ensure names are unique if necessary
	// This step might not be needed if parent names are sufficient for distinction
	componentNames = [...new Set(componentNames)] // Remove duplicates
	//console.log('Main component names:', componentNames)
	return componentNames
}

async function findFrames(keywords: string[]) {
	const projectName = figma.root.name // Get the project name from the file name
	const frameNodes = figma.root.findAll(node => {
		if (node.type === 'FRAME') {
			const frames = node.findAll(child => {
				return (
					(child.type === 'COMPONENT' || child.type === 'INSTANCE') && child.name === keywords[0]
				)
			})
			return frames.length > 0
		}
		return false
	}) as FrameNode[] // Ensure the result is of type FrameNode[]
	console.log('figma', figma)
	console.log('figma.fileKey', figma.fileKey)
	console.log('figma.currentUser', figma.currentUser)
	const frameDetails = frameNodes.map(frame => ({
		url: `https://www.figma.com/file/${figma.fileKey}/${projectName}?node-id=${frame.id}`,
		name: frame.name,
		node: frame,
	}))

	/* Clone and append frames to the current page
	for (const frame of framesWithCheckbox) {
		const clonedFrame = frame.clone()
		figma.currentPage.appendChild(clonedFrame)
	}*/

	return frameDetails
}

figma.ui.onmessage = async msg => {
	try {
		if (msg.type === 'set-value') {
			await figma.clientStorage.setAsync(msg.name, msg.value)
		} else if (msg.type === 'get-value') {
			const value = await figma.clientStorage.getAsync(msg.name)
			figma.ui.postMessage({ type: 'return-value', value: value })
		} else if (msg.type === 'get-main-component-names') {
			const componentNames = getMainComponentNames()
			figma.ui.postMessage({ type: 'main-component-names', names: componentNames })
		} else if (msg.type === 'get-user') {
			figma.ui.postMessage({ type: 'user', user: figma.currentUser })
		} else if (msg.type === 'find-frames') {
			const frames = await findFrames(msg.keywords)
			figma.ui.postMessage({ type: 'frames', frames: frames })
		}
	} catch (error) {
		console.error('Error processing message:', msg, error)
		figma.ui.postMessage({ type: 'error', message: error.message })
	}
}
