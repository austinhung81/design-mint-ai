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

async function getAllColorStyles() {
	// Find all color styles
	const colorStyles = figma.getLocalPaintStyles().filter(style => style.paints[0].type === 'SOLID')

	// Convert color styles to hex values
	const colorHexValues = colorStyles.map(style => {
		const paint = style.paints[0] as SolidPaint
		const { r, g, b } = paint.color
		const hex = rgbToHex(r, g, b)
		return hex
	})
	console.log('Color styles:', colorHexValues)
	return colorHexValues
}

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

function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (value: number) => {
		const hex = Math.round(value).toString(16)
		return hex.length === 1 ? '0' + hex : hex
	}
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

async function findFrames(keywords: string[], colors: string[]) {
	// Load all pages asynchronously
	await figma.loadAllPagesAsync()
	console.log('Finding frames with keywords:', keywords)
	console.log('Finding frames with colors:', colors)
	const projectName = figma.root.name.replace(/ /g, '-') // Replace spaces with hyphens
	const frameNodes = figma.root.findAll(node => {
		if (node.type === 'FRAME' && node.parent.type === 'PAGE') {
			const hasMatchingChild = node.findAll(child => {
				let hasMatchingColor = false
				if ((child.type === 'COMPONENT' || child.type === 'INSTANCE') && 'fills' in child) {
					const fills = (child as GeometryMixin).fills
					if (Array.isArray(fills)) {
						hasMatchingColor = fills.some(fill => {
							if (fill.type === 'SOLID') {
								const hexColor = rgbToHex(
									fill.color.r * 255,
									fill.color.g * 255,
									fill.color.b * 255
								).toLowerCase()
								return colors.map(color => color.toLowerCase()).includes(hexColor)
							}
							return false
						})
					}
				}
				const hasMatchingKeyword = keywords.some(
					keyword => child.name.toLowerCase().includes(keyword.toLowerCase()) && child.visible
				)
				return (
					(colors.length === 0 && hasMatchingKeyword) || (hasMatchingColor && hasMatchingKeyword)
				)
			})
			return hasMatchingChild.length > 0
		}
		return false
	}) as FrameNode[] // Ensure the result is of type FrameNode[]

	// Sort frames by name (or another property) and limit to the most recent 20 frames
	// const sortedFrameNodes = frameNodes.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10)

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
				nodeId: nodeId,
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
		} else if (msg.type === 'get-color-styles') {
			const colorStyles = await getAllColorStyles()
			figma.ui.postMessage({ type: 'get-color-styles', colors: colorStyles })
		} else if (msg.type === 'get-user') {
			figma.ui.postMessage({ type: 'user', user: figma.currentUser })
		} else if (msg.type === 'find-frames') {
			const frames = await findFrames(msg.keywords, msg.colors)
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
		} else if (msg.type === 'insert-frame') {
			const node = (await figma.getNodeByIdAsync(msg.nodeId)) as SceneNode

			if (node) {
				// Duplicate the node to append a copy, as nodes cannot exist in two places at once.
				const clone = node.clone() // Cloning the node
				figma.currentPage.appendChild(clone)
			} else {
				console.error('Node not found or cannot be inserted')
			}
		}
	} catch (error) {
		console.error('Error processing message:', msg, error)
		figma.ui.postMessage({ type: 'error', message: error.message })
	}
}
