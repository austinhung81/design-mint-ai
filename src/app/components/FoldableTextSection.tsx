import React, { CSSProperties, useRef, useState } from 'react'
import './FoldableTextSection.css' // Make sure this is correctly imported

interface FoldableTextSectionProps {
	content: string
}

const FoldableTextSection: React.FC<FoldableTextSectionProps> = ({ content }) => {
	const [isExpanded, setIsExpanded] = useState(false)
	const topOfDivRef = useRef<HTMLDivElement>(null) // Create a ref for the button

	const toggleSection = () => {
		const scrollPositionBeforeToggle = window.scrollY
		const rectBeforeToggle = topOfDivRef.current?.getBoundingClientRect()

		setIsExpanded(!isExpanded)

		setTimeout(() => {
			if (rectBeforeToggle && topOfDivRef.current) {
				// Reference to the top of the component after expanding/collapsing
				const rectAfterToggle = topOfDivRef.current.getBoundingClientRect()
				// Calculate the difference in position
				const positionDiff = rectAfterToggle.top - rectBeforeToggle.top
				// Correct the scroll position to maintain the view
				window.scrollTo({
					top: scrollPositionBeforeToggle + positionDiff,
					behavior: 'auto',
				})
			}
		}, 0)
	}

	const buttonStyles: CSSProperties = {
		color: 'var(--primary)',
		cursor: 'pointer',
		userSelect: 'none',
		backgroundColor: 'transparent',
		border: 'none',
		padding: 0,
		display: 'flex',
		alignItems: 'center',
		fontSize: '1rem',
		outline: 'none',
	}

	const contentStyles: CSSProperties = {
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-word',
		maxHeight: isExpanded ? 'none' : '4.5em',
		overflow: 'hidden',
		paddingLeft: '0.5em', // Space between the line and the content
	}

	return (
		<div ref={topOfDivRef}>
			<div className="wrapper">
				<div className="line" onClick={toggleSection}></div>
				{/* Always render the line */}
				<div style={contentStyles}>{content}</div>
			</div>
			<button onClick={toggleSection} style={buttonStyles} aria-expanded={isExpanded}>
				{isExpanded ? <>collapse</> : <>expand</>}
			</button>
		</div>
	)
}

export default FoldableTextSection
