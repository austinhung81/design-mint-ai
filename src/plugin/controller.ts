figma.showUI(__html__, { width: 600, height: 700, title: 'Mint AI' })

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
		const value = await figma.clientStorage.getAsync(msg.name)
		figma.ui.postMessage({ type: 'return-value', value: value })
	}
}

// Clear clientStorage when plugin is closed
figma.on('close', async () => {
	await figma.clientStorage.setAsync('openai_api_key', null)
})
