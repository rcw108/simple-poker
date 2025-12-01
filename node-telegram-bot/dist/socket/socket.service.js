import { db } from '../serve.js';
import { evaluateHand, shuffleDeck } from '../utils.js';
import { gameRooms } from './state.gameRooms.js';
export const joinRoom = (io, socket, { roomId, userId }) => {
    if (!gameRooms[roomId]) {
        gameRooms[roomId] = {
            players: [],
            deck: shuffleDeck(),
            tableCards: [],
            stage: 'initial',
            bank: 0,
        };
        console.log(`Room ${roomId} created`);
    }
    const room = gameRooms[roomId];
    if (room.players.length >= 2) {
        socket.emit('error', 'Room is full.');
        return;
    }
    if (!room.players.find(player => player.id === userId)) {
        room.players.push({ id: userId, cards: [], balance: 100 });
        console.log(`User ${userId} added to room ${roomId}`);
    }
    socket.join(roomId);
    io.to(roomId).emit('roomUpdate', room);
};
export const placeBet = (io, socket, { roomId, userId, betAmount, }) => {
    const room = gameRooms[roomId];
    if (!room)
        return socket.emit('error', 'Room does not exist');
    const player = room.players.find(p => p.id === userId);
    if (!player || player.balance < betAmount)
        return socket.emit('error', 'Insufficient balance');
    player.balance -= Number(betAmount);
    room.bank += Number(betAmount);
    io.to(roomId).emit('betUpdate', { player, bank: room.bank });
    console.log(`Player ${userId} placed a bet of ${betAmount}`);
};
export const dealCards = (io, socket, { roomId }) => {
    const room = gameRooms[roomId];
    if (!room)
        return socket.emit('error', 'Room does not exist');
    if (room.players.length !== 2)
        return socket.emit('error', 'The game requires exactly two players to start.');
    if (room.stage !== 'initial')
        return socket.emit('error', 'Cannot deal cards. The game is not in the initial stage.');
    if (!room.deck || room.deck.length === 0)
        room.deck = shuffleDeck();
    for (let i = 0; i < 2; i++) {
        room.players.forEach(player => {
            const card = room.deck.shift();
            if (card)
                player.cards.push(card);
        });
    }
    room.tableCards = room.deck.splice(0, 5);
    room.stage = 'betting';
    io.to(roomId).emit('gameUpdate', room);
    console.log(`Cards dealt to players in room ${roomId}`);
};
export const revealCards = async (io, socket, { roomId }) => {
    const room = gameRooms[roomId];
    if (!room || room.stage !== 'betting')
        return socket.emit('error', 'Cannot reveal cards');
    const results = room.players.map(player => ({
        playerId: player.id,
        hand: evaluateHand([...player.cards, ...room.tableCards]),
    }));
    const winner = results.reduce((best, current) => current.hand.rank > best.hand.rank ? current : best);
    room.stage = 'reveal';
    const bank = room.bank;
    const playersCollection = db.collection('users');
    try {
        await playersCollection.updateOne({ id: winner.playerId }, { $inc: { balance: bank } });
        const gamesCollection = db.collection('games');
        await gamesCollection.insertOne({
            roomId,
            winnerId: winner.playerId,
            winnerHand: winner.hand,
            players: room.players.map(player => ({
                id: player.id,
                balance: player.balance,
                hand: results.find(res => res.playerId === player.id)?.hand,
            })),
            tableCards: room.tableCards,
            bank,
            timestamp: new Date(),
        });
        io.to(roomId).emit('gameResult', { winner, results, bank });
        console.log(`Game result saved for room ${roomId}`);
    }
    catch (error) {
        console.error('Error saving game result:', error);
        socket.emit('error', 'Internal server error.');
    }
};
export const startNewRound = (io, socket, { roomId }) => {
    const room = gameRooms[roomId];
    if (!room)
        return socket.emit('error', 'Room does not exist');
    room.deck = shuffleDeck();
    room.tableCards = [];
    room.bank = 0;
    room.players.forEach(player => (player.cards = []));
    room.stage = 'initial';
    io.to(roomId).emit('gameUpdate', room);
    console.log(`New round started in room ${roomId}`);
};
