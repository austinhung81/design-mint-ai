figma.showUI(__html__, { width: 600, height: 700, title: 'Mint AI' })

function getMainComponentNames() {
	const mainComponents = figma.root.findAll(
		node => node.type === 'COMPONENT' && node.parent && node.parent.type === 'PAGE'
	)
	const componentNames = mainComponents.map(component => component.name)
	return componentNames
}

figma.ui.onmessage = msg => {
	if (msg.type === 'create-rectangles') {
		const nodes = []

		for (let i = 0; i < msg.count; i++) {
			const rect = figma.createRectangle()
			rect.x = i * 150
			rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }]
			figma.currentPage.appendChild(rect)
			nodes.push(rect)
		}

		figma.currentPage.selection = nodes
		figma.viewport.scrollAndZoomIntoView(nodes)

		// This is how figma responds back to the ui
		figma.ui.postMessage({
			type: 'create-rectangles',
			message: `Created ${msg.count} Rectangles`,
		})
	}

	figma.closePlugin()
}

figma.ui.onmessage = async msg => {
	if (msg.type === 'set-value') {
		await figma.clientStorage.setAsync(msg.name, msg.value)
	} else if (msg.type === 'get-value') {
		console.log(msg)
		const value = await figma.clientStorage.getAsync(msg.name)
		figma.ui.postMessage({ type: 'return-value', value: value })
	} else if (msg.type === 'get-main-component-names') {
		const componentNames = getMainComponentNames()
		figma.ui.postMessage({ type: 'main-component-names', names: componentNames })
	}
}
