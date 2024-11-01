import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import '../../components/PokerTable.css'

const Card = ({ image, index, stage, flippedStage, combination }) => {
	const [isFlipped, setIsFlipped] = useState(false)
	const [hasDealt, setHasDealt] = useState(false)
	const [shouldStayFlipped, setShouldStayFlipped] = useState(false)
	const [reveal, setReveal] = useState(false)

	const cardVariants = {
		initial: {
			opacity: 0,
			y: '-100vh',
			rotateY: 0,
			scale: 0.5,
		},
		dealt: {
			opacity: 1,
			y: 0,
			scale: 1,
			rotate: 360,
			transition: {
				type: 'spring',
				duration: 0.8,
				damping: 20,
				mass: 1,
				delay: index * 0.15,
			},
		},
		flipped: {
			rotateY: 180,
			transition: {
				delay: index * 0.1 + 0.7,
				duration: 0.6,
				ease: 'easeInOut',
			},
		},
		unflipped: {
			rotateY: 0,
			transition: {
				duration: 0.6,
				ease: 'easeInOut',
			},
		},
		win: {
			scale: 1.15,
			rotateY: 180,
			transition: {
				duration: 0.3,
				delay: 1.8,
			},
		},
		lose: {
			rotateY: 180,
			scale: 0.85,
			transition: {
				duration: 0.3,
				delay: 1.8,
			},
		},
	}

	useEffect(() => {
		if (stage === 'betting' && !hasDealt) {
			setHasDealt(true)
		}

		// Проверка на переворот карты
		if (stage === flippedStage && !shouldStayFlipped) {
			setTimeout(() => {
				setIsFlipped(true)
				setShouldStayFlipped(true)
			}, (index * 0.05 + 0.2) * 300)
		}

		// Обработка состояния "reveal"
		if (stage === 'reveal') {
			setReveal(true)
			// Если комбинация отсутствует, оставляем карту перевернутой
			if (!combination) {
				setIsFlipped(true)
			}
		}

		// Сброс состояний при перезапуске игры
		if (stage === 'initial') {
			setIsFlipped(false)
			setHasDealt(false)
			setShouldStayFlipped(false)
			setReveal(false) // Сброс reveal
		}
	}, [stage, index, hasDealt, flippedStage, shouldStayFlipped, combination])

	return (
		<div className='card-container'>
			<motion.div
				className='card-inner'
				initial='initial'
				animate={[
					hasDealt ? 'dealt' : 'initial',
					reveal ? (combination ? 'win' : 'lose') : '',
					isFlipped ? 'flipped' : 'unflipped',
				]}
				variants={cardVariants}
				style={{
					width: '100%',
					height: '100%',
					position: 'relative',
					transformStyle: 'preserve-3d',
				}}
			>
				{/* Back of card */}
				<motion.div
					className='card-face card-back'
					style={{
						position: 'absolute',
						width: '100%',
						height: '100%',
						backfaceVisibility: 'hidden',
						WebkitBackfaceVisibility: 'hidden',
					}}
				>
					<img
						src='/assets/cards/empty.png'
						alt='Card back'
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
						}}
					/>
				</motion.div>

				{/* Front of card */}
				<motion.div
					className='card-face card-front'
					style={{
						position: 'absolute',
						width: '100%',
						height: '100%',
						backfaceVisibility: 'hidden',
						WebkitBackfaceVisibility: 'hidden',
						transform: 'rotateY(180deg)',
						animation: 'bright 0.6s linear',
					}}
				>
					<img
						src={image}
						alt={`Card ${index}`}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							transition: 'filter 0.3s',
							transitionDelay: '1.8s',
							filter:
								reveal && !combination ? 'brightness(0.5)' : 'brightness(1)',
						}}
					/>
				</motion.div>
			</motion.div>
		</div>
	)
}

export default Card
