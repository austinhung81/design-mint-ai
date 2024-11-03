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
			const handleLinkClick = (event: MouseEvent) => {
				const target = event.target as HTMLAnchorElement
				if (target.tagName === 'A') {
					event.preventDefault()
					const url = new URL(target.href)
					const nodeId = url.searchParams.get('node-id')?.replace(/-/g, ':')
					if (nodeId) {
						parent.postMessage({ pluginMessage: { type: 'navigate-to-node', nodeId } }, '*')
					}
				}
			}

			container.addEventListener('click', handleLinkClick)
			return () => {
				container.removeEventListener('click', handleLinkClick)
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
