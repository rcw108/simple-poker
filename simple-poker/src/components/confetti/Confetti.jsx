import { useRef, useState } from 'react'
import SvgConfetti from '../../ui/confetti/SvgConfetti'

const Confetti = () => {
	const [is, setIs] = useState(false)
	const buttonRef = useRef(null)

	const handleClick = () => {
		setIs(true)
		setTimeout(() => {
			setIs(false)
		}, 2000)
	}

	return (
		<main
			className='tg'
			style={{
				display: 'flex',
				height: '100%',
				width: '100%',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div style={{ position: 'relative' }}>
				{is && buttonRef.current && (
					<SvgConfetti wrapperRef={buttonRef.current} />
				)}
				<button ref={buttonRef} onClick={handleClick}>
					CLICK
				</button>
			</div>
		</main>
	)
}

export default Confetti
