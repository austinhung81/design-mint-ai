figma.showUI(__html__, { width: 600, height: 700, title: 'Mint AI' })

function getMainComponentNames() {
	console.log('Getting main component names', figma.root)
	const mainComponents = figma.root.findAll(node => node.type === 'COMPONENT')
	let componentNames = mainComponents.map(component => {
		// Check if the component has a parent and the parent has a name
		const parentName = component.parent && component.parent.name ? component.parent.name : ''
		return parentName
	})

	// Optional: Ensure names are unique if necessary
	// This step might not be needed if parent names are sufficient for distinction
	componentNames = [...new Set(componentNames)] // Remove duplicates
	console.log('Main component names:', componentNames)
	return componentNames
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
		}
	} catch (error) {
		console.error('Error processing message:', msg, error)
		figma.ui.postMessage({ type: 'error', message: error.message })
	}
}
