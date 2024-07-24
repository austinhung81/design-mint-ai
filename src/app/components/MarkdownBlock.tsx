import React from 'react'
import MarkdownIt from 'markdown-it'

interface ChatBlockProps {
	markdown: string
	role: string
	loading: boolean
}

const MarkdownBlock: React.FC<ChatBlockProps> = ({ markdown, loading }) => {
	const md = new MarkdownIt()
	const renderedHTML = md.render(markdown)
	return (
		<>
			<div dangerouslySetInnerHTML={{ __html: renderedHTML }}></div>
			<div>{loading && <span className="streaming-dot">•••</span>}</div>
		</>
	)
}

export default MarkdownBlock
