figma.showUI(__html__, { width: 600, height: 700, title: 'Mint AI' })

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

async function findFramesWithCheckbox() {
	console.log('figma', figma)
	const projectName = figma.root.name // Get the project name from the file name
	const framesWithCheckbox = figma.root.findAll(node => {
		if (node.type === 'FRAME') {
			console.log('node:', node.name)
			const checkboxes = node.findAll(child => {
				console.log('child:', child.name)
				return child.type === 'COMPONENT' && child.name === 'Checkbox'
			})
			return checkboxes.length > 0
		}
		return false
	}) as FrameNode[] // Ensure the result is of type FrameNode[]

	console.log('Frames with checkbox:', framesWithCheckbox)

	const frameDetails = framesWithCheckbox.map(frame => ({
		url: `https://www.figma.com/file/${figma.fileKey}/${projectName}?node-id=${frame.id}`,
		node: frame,
	}))

	console.log('Frames with checkbox:', frameDetails)

	// Clone and append frames to the current page
	for (const frame of framesWithCheckbox) {
		const clonedFrame = frame.clone()
		figma.currentPage.appendChild(clonedFrame)
	}

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
		} else if (msg.type === 'find-frames-with-checkbox') {
			const frames = await findFramesWithCheckbox()
			figma.ui.postMessage({ type: 'frames-with-checkbox', frames: frames })
		}
	} catch (error) {
		console.error('Error processing message:', msg, error)
		figma.ui.postMessage({ type: 'error', message: error.message })
	}
}
