import '../../components/PokerTable.css'

export const TelegramUser = ({ telegramUser }) => {
	return (
		<div className='user-info'>
			<span>
				Welcome, {telegramUser.first_name}
				{telegramUser.username ? ` (@${telegramUser.username})` : ''}!
			</span>
		</div>
	)
}
