figma.showUI(__html__, { width: 600, height: 700, title: 'Mint AI' })

/* Handle postMessage from backend (optional)
window.onmessage = event => {
    if (event.data.pluginMessage) {
        const token = event.data.pluginMessage
        // Store the token and use it for future API requests
        console.log('OAuth token:', token)
    }
}*/

figma.on('close', async () => {
	try {
		await figma.clientStorage.setAsync('active_conversation_id', null)
		console.log('Storage value cleared on plugin close')
	} catch (error) {
		console.error('Error clearing storage value on plugin close:', error)
	}
})

async function getMainComponentNames() {
	// Load all pages asynchronously
	await figma.loadAllPagesAsync()

	const mainComponents = figma.root.findAll(node => node.type === 'COMPONENT')
	let componentNames = mainComponents.map(component => {
		// Check if the component has a parent and the parent has a name
		const parentName =
			component.parent && component.parent.name && component.parent.type !== 'PAGE'
				? component.parent.name
				: component.name
		return parentName
	})

	// Optional: Ensure names are unique if necessary
	componentNames = [...new Set(componentNames)] // Remove duplicates
	return componentNames
}

async function findFrames(keywords: string[]) {
	// Load all pages asynchronously
	await figma.loadAllPagesAsync()

	const projectName = figma.root.name.replace(/ /g, '-') // Replace spaces with hyphens
	const frameNodes = figma.root.findAll(node => {
		if (node.type === 'FRAME' && node.parent.type === 'PAGE') {
			const hasMatchingChild = node.findAll(child => {
				return (
					(child.type === 'COMPONENT' || child.type === 'INSTANCE') &&
					keywords.some(keyword => child.name.includes(keyword) && child.visible)
				)
			})
			return hasMatchingChild.length > 0
		}
		return false
	}) as FrameNode[] // Ensure the result is of type FrameNode[]

	const frameDetails = await Promise.all(
		frameNodes.map(async frame => {
			const nodeId = frame.id.replace(/:/g, '-') // Replace ':' with '-'
			const preview = await frame.exportAsync({
				format: 'PNG',
				constraint: { type: 'SCALE', value: 2 },
			})
			const previewUrl = `data:image/png;base64,${figma.base64Encode(preview)}`
			return {
				url: `https://www.figma.com/design/${figma.fileKey}/${projectName}?node-id=${nodeId}`,
				name: frame.name,
				node: frame,
				preview: previewUrl,
			}
		})
	)

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
			const componentNames = await getMainComponentNames()
			figma.ui.postMessage({ type: 'main-component-names', names: componentNames })
		} else if (msg.type === 'get-user') {
			figma.ui.postMessage({ type: 'user', user: figma.currentUser })
		} else if (msg.type === 'find-frames') {
			const frames = await findFrames(msg.keywords)
			figma.ui.postMessage({ type: 'frames', frames: frames })
		} else if (msg.type === 'navigate-to-node') {
			const node = (await figma.getNodeByIdAsync(msg.nodeId)) as SceneNode
			if (node) {
				// Ensure the node is on the current page
				if (node.parent.type === 'PAGE') {
					await figma.setCurrentPageAsync(node.parent)
				}
				figma.viewport.scrollAndZoomIntoView([node])
				figma.currentPage.selection = [node]
			}
		}
	} catch (error) {
		console.error('Error processing message:', msg, error)
		figma.ui.postMessage({ type: 'error', message: error.message })
	}
}
