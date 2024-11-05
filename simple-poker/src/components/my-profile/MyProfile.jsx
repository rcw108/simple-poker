import { Link } from 'react-router-dom'
import { useBalance } from '../../providers/BalanceProvider'

const MyProfile = () => {
	const { balance } = useBalance()
	return (
		<main className='my-profile'>
			<div className='head-profile'>
				<Link to={'/'}>
					<img src='/assets/arrow.svg' alt='arrow' />
				</Link>
				<div className='popup'>
					<img src='/assets/info.svg' alt='info' />
				</div>
			</div>
			<div className='center'>
				<div className='balance-profile' style={{ color: '#fff' }}>
					<img src='/assets/pc1.png' alt='balance' />
					<span>{balance}</span>
				</div>
				<h2>Your Bank</h2>
			</div>
			<div className='bottom-profile'>
				<button className='withdraw'>Withdraw</button>
				<button className='add-chip'>Add Chips</button>
			</div>
		</main>
	)
}

export default MyProfile
