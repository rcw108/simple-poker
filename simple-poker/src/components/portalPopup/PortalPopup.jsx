import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { portalData } from './portalPopup.data'

const PortalPopup = () => {
	const [isOpen, setIsOpen] = useState(false)

	return ReactDOM.createPortal(
		<>
			<div className='popup' onClick={() => setIsOpen(true)}>
				<img src='/assets/info.svg' alt='info' />
			</div>
			{isOpen && (
				<div className='openedPopup'>
					<div className='closePopup' onClick={() => setIsOpen(false)}>
						<img src='/assets/close.svg' alt='close' />
					</div>
					<div className='contentPopup'>
						<div className='logoPopup'>
							<img src='/assets/first-logo.png' alt='logo' />
						</div>
						<div className='titleContent'>
							<p>
								The winning combination of cards is the one that is higher than
								your opponent. Learn the combinations of cards from the lowest
								weakest to the strongest.
							</p>
						</div>
						<div className='combinationPopup'>
							{portalData.map(item => (
								<div className='itemPopup' key={item.id}>
									<h4>{item.title}</h4>
									<p>{item.text}</p>
									<img src={item.src} alt={item.title} />
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</>,
		document.body
	)
}

export default PortalPopup
