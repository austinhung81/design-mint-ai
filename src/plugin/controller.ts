figma.showUI(__html__, { width: 600, height: 700, title: 'Mint AI' })

function getMainComponentNames() {
	const mainComponents = figma.root.findAll(
		node => node.type === 'COMPONENT' && node.parent && node.parent.type === 'PAGE'
	)
	const componentNames = mainComponents.map(component => component.name)
	return componentNames
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
