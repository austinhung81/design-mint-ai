import React from 'react'
//import ReactMarkdown from 'react-markdown'
//import { visit } from 'unist-util-visit'
//import './MarkdownBlock.css'
//import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
//import { Root } from 'hast'
//import gfm from 'remark-gfm'
//import remarkMath from 'remark-math'
//import rehypeKatex from 'rehype-katex'
//import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ChatBlockProps {
	markdown: string
	role: string
	loading: boolean
}

/*function rehypeInlineCodeProperty() {
	return function (tree: Root): void {
		visit(tree, 'element', node => {
			if (node.tagName === 'code') {
				const isInline = node.position && node.position.start.line === node.position.end.line
				node.properties.dataInline = isInline
			}
		})
	}
}*/

const MarkdownBlock: React.FC<ChatBlockProps> = ({ markdown, loading }) => {
	console.log(markdown)
	/*function inlineCodeBlock({ value }: { value: string }) {
		return <code>{value}</code>
	}

	function codeBlock({ node, className, children }: any) {
		if (!children) {
			return null
		}
		const value = String(children).replace(/\n$/, '')
		if (!value) {
			return null
		}
		// Note: OpenAI does not always annotate the Markdown code block with the language
		// Note: In this case, we will fall back to plaintext
		const match = /language-(\w+)/.exec(className || '')
		let language: string = match ? match[1] : 'plaintext'
		const isInline = node.properties.dataInline

		return isInline ? (
			inlineCodeBlock({ value: value })
		) : (
			<div className="border border-gray-200 dark:border-gray-800 rounded-md codeBlockContainer dark:bg-gray-850">
				<div className="flex items-center relative text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-850 px-4 py-1.5 text-xs font-sans justify-between rounded-t-md">
					<span>{language}</span>
				</div>
				<div className="overflow-y-auto">
					<SyntaxHighlighter language={language} style={oneLight} customStyle={{ margin: '0' }}>
						{value}
					</SyntaxHighlighter>
				</div>
			</div>
		)
	}

	const renderers = {
		code: codeBlock,
	}*/

	return (
		<div>
			{markdown}
			{loading && <span className="streaming-dot">•••</span>}
		</div>
	)
}

export default MarkdownBlock
