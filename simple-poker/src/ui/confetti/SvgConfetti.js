import { motion } from 'framer-motion'
import React from 'react'

const svgIcons = Array(100).fill(['/assets/PokerChip2.png']).flat()

function SvgConfetti({ wrapperRef }) {
	console.log(wrapperRef)

	return (
		<div
			style={{
				position: 'absolute',
				// inset: 0,
				pointerEvents: 'none',
				zIndex: 999,
				left: '50%',
				top: '50%',
				transform: 'translate(-50%, -50%)',
				overflow: 'visible',
			}}
		>
			{svgIcons.map((icon, index) => {
				const horizontalSpread = Math.random() * 300 - 150
				const upwardInitial = -(Math.random() * 10 + 100) // Higher initial rise
				const downwardFall = Math.random() * 400 + 300 // Deeper descent
				const rotateValue = Math.random() * 720 - 360
				const delay = Math.random() * 0.8

				return (
					<motion.img
						src={icon}
						alt='confetti'
						key={`${icon}-${index}`}
						initial={{
							opacity: 1,
							scale: 0.4,
							x: wrapperRef.offsetLeft + wrapperRef.offsetWidth / 2,
							y: wrapperRef.offsetTop + wrapperRef.offsetHeight / 2,
						}}
						animate={{
							x: [0, horizontalSpread * 0.7, horizontalSpread], // More horizontal spread
							y: [0, upwardInitial, downwardFall * Math.sin(2 * Math.PI * 0.2)], // Parabolic arc
							rotate: [0, rotateValue],
							opacity: [1, 0.8, 0.5, 0.2, 0],
							scale: [0.4, 1.4, 1, 0.6], // Larger scale at peak
						}}
						transition={{
							duration: 2.5, // Longer duration for the arc
							delay: delay,
							ease: [0.42, 0, 0.58, 1], // Easing function for the arc
						}}
						style={{
							position: 'absolute',
							width: '15px',
							height: '15px',
						}}
					/>
				)
			})}
		</div>
	)
}

export default SvgConfetti
