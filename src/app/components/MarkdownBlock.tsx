import React, { useEffect, useRef } from 'react'
import MarkdownIt from 'markdown-it'

interface ChatBlockProps {
	markdown: string
	role: string
	loading: boolean
}

const MarkdownBlock: React.FC<ChatBlockProps> = ({ markdown, loading }) => {
	const md = MarkdownIt({
		html: true,
		linkify: true,
		typographer: true,
	})
	const renderedHTML = md.render(markdown)
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (container) {
			// Handle clicks in the container
			const handleContainerClick = (event: MouseEvent) => {
				const target = event.target as HTMLElement
				// Check for anchor (<a>) clicks
				if (target.tagName === 'A') {
					event.preventDefault()
					const url = new URL((target as HTMLAnchorElement).href)
					const nodeId = url.searchParams.get('node-id')?.replace(/-/g, ':')
					if (nodeId) {
						parent.postMessage({ pluginMessage: { type: 'navigate-to-node', nodeId } }, '*')
					}
				}

				if (target.dataset.type === 'insert-frame') {
					const nodeId = target.dataset.nodeId?.replace(/-/g, ':')
					if (nodeId) {
						parent.postMessage({ pluginMessage: { type: 'insert-frame', nodeId: nodeId } }, '*')
					}
				}
			}

			container.addEventListener('click', handleContainerClick)
			return () => {
				container.removeEventListener('click', handleContainerClick)
			}
		}
	}, [])

	return (
		<>
			<div ref={containerRef} dangerouslySetInnerHTML={{ __html: renderedHTML }}></div>
			<div>{loading && <span className="streaming-dot">•••</span>}</div>
		</>
	)
}

export default MarkdownBlock
