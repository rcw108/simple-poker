import { motion } from 'framer-motion'
import React from 'react'

const svgIcons = ['❤️', '👍', '😍', '🎉', '🔥', '💥', '✨']

function SvgConfetti() {
	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				pointerEvents: 'none',
				zIndex: 50,
				overflow: 'hidden',
			}}
		>
			{svgIcons.map((icon, index) => {
				const horizontalSpread = Math.random() * 300 - 150
				const fallDistance = Math.random() * 500 + 250
				const delay = Math.random() * 0.5

				return (
					<motion.div
						key={`${icon}-${index}`}
						initial={{
							opacity: 0,
							scale: 0.3,
							x: 0,
							y: -100,
						}}
						animate={{
							x: horizontalSpread,
							y: fallDistance,
							rotate: [0, Math.random() * 540],
							opacity: [1, 0.8, 0.5, 0.2, 0],
							scale: [1, 1.2, 1, 0.7, 0.4],
						}}
						transition={{
							duration: 2.5,
							delay: delay,
							ease: 'easeInOut',
						}}
						style={{
							position: 'absolute',
							left: '50%',
							top: '50%',
							fontSize: '4rem',
						}}
					>
						{icon}
					</motion.div>
				)
			})}
		</div>
	)
}

export default SvgConfetti
