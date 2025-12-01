import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'
import { SOCKET_URL } from '../config'

const TestPage = () => {
	const [socket, setSocket] = useState(null)
	const [roomId, setRoomId] = useState('12345')
	const [userId, setUserId] = useState('')
	const [betAmount, setBetAmount] = useState(50)
	const [logs, setLogs] = useState([])
	const [connected, setConnected] = useState(false)

	// Initialize WebSocket connection
	useEffect(() => {
		const newSocket = io(SOCKET_URL) // Uses ngrok URL from config
		setSocket(newSocket)

		// Event listeners for WebSocket
		newSocket.on('connect', () => {
			addLog('Connected to server')
			setConnected(true)
		})

		newSocket.on('disconnect', () => {
			addLog('Disconnected from server')
			setConnected(false)
		})

		newSocket.on('roomUpdate', data => {
			addLog(`Room Update: ${JSON.stringify(data)}`)
		})

		newSocket.on('betUpdate', data => {
			addLog(`Bet Update: ${JSON.stringify(data)}`)
		})

		newSocket.on('gameUpdate', data => {
			addLog(`Game Update: ${JSON.stringify(data)}`)
		})

		newSocket.on('gameResult', data => {
			addLog(`Game Result: ${JSON.stringify(data)}`)
		})

		newSocket.on('error', data => {
			addLog(`Error: ${data}`)
		})

		return () => newSocket.disconnect()
	}, [])

	// Helper to log events
	const addLog = message => {
		setLogs(prevLogs => [
			...prevLogs,
			`[${new Date().toLocaleTimeString()}] ${message}`,
		])
	}

	// Join Room
	const handleJoinRoom = () => {
		if (!socket) return
		socket.emit('joinRoom', { roomId, userId })
		addLog(`Attempted to join room: ${roomId} as user: ${userId}`)
	}

	// Place Bet
	const handlePlaceBet = () => {
		if (!socket) return
		socket.emit('placeBet', { roomId, userId, betAmount })
		addLog(`Attempted to place a bet of ${betAmount} in room: ${roomId}`)
	}

	// Deal Cards
	const handleDealCards = () => {
		if (!socket) return
		socket.emit('dealCards', { roomId })
		addLog(`Attempted to deal cards in room: ${roomId}`)
	}

	// Reveal Cards
	const handleRevealCards = () => {
		if (!socket) return
		socket.emit('revealCards', { roomId })
		addLog(`Attempted to reveal cards in room: ${roomId}`)
	}

	const startNewRound = () => {
		if (!socket) return
		socket.emit('startNewRound', { roomId })
		addLog(`Attempted to start a new round in room: ${roomId}`)
	}

	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h1>WebSocket Test Page</h1>
			<div style={{ marginBottom: '20px' }}>
				<div>
					<label>Room ID:</label>
					<input
						type='text'
						value={roomId}
						onChange={e => setRoomId(e.target.value)}
						style={{ marginLeft: '10px' }}
					/>
				</div>
				<div>
					<label>User ID:</label>
					<input
						type='text'
						value={userId}
						onChange={e => setUserId(e.target.value)}
						style={{ marginLeft: '10px' }}
					/>
				</div>
				<div>
					<label>Bet Amount:</label>
					<input
						type='number'
						value={betAmount}
						onChange={e => setBetAmount(e.target.value)}
						style={{ marginLeft: '10px' }}
					/>
				</div>
			</div>

			<div style={{ marginBottom: '20px' }}>
				<button
					onClick={handleJoinRoom}
					disabled={!connected}
					style={{ marginRight: '10px' }}
				>
					Join Room
				</button>
				<button
					onClick={handlePlaceBet}
					disabled={!connected}
					style={{ marginRight: '10px' }}
				>
					Place Bet
				</button>
				<button
					onClick={handleDealCards}
					disabled={!connected}
					style={{ marginRight: '10px' }}
				>
					Deal Cards
				</button>
				<button
					style={{ marginRight: '10px' }}
					onClick={handleRevealCards}
					disabled={!connected}
				>
					Reveal Cards
				</button>
				<button onClick={startNewRound} disabled={!connected}>
					Start New Round
				</button>
			</div>

			<div style={{ marginTop: '20px' }}>
				<h3>Logs:</h3>
				<div
					style={{
						height: '200px',
						overflowY: 'scroll',
						background: '#f4f4f4',
						padding: '10px',
						border: '1px solid #ddd',
					}}
				>
					{logs.map((log, index) => (
						<div key={index}>{log}</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default TestPage
