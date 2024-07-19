import React from 'react'
import { EllipsisHorizontalIcon, ArrowLongRightIcon } from '@heroicons/react/24/outline'
import Tooltip from '../../../components/ui/tooltip'

interface SubmitButtonProps {
	loading: boolean
	disabled: boolean
	name?: string
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ loading, disabled, name }) => {
	const strokeColor = disabled ? 'currentColor' : 'white'

	return (
		<Tooltip title="send-message" side="top" sideOffset={0}>
			<button
				name={name}
				type="submit"
				disabled={loading || disabled}
				className="disabled:opacity-40 relative z-10 text-white"
			>
				{loading ? (
					<EllipsisHorizontalIcon
						className="animate-ellipsis-pulse"
						width={24}
						height={24}
						stroke={strokeColor}
					/>
				) : (
					<div className="rounded-full bg-mint400 w-9 h-9 flex items-center justify-center">
						<ArrowLongRightIcon width={24} height={24} />
					</div>
				)}
			</button>
		</Tooltip>
	)
}
