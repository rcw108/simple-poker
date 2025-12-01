import { dealCards, joinRoom, placeBet, revealCards, startNewRound, } from './socket.service.js';
export const initializeSockets = (io) => {
    io.on('connection', socket => {
        console.log(`User connected: ${socket.id}`);
        socket.on('joinRoom', data => joinRoom(io, socket, data));
        socket.on('placeBet', data => placeBet(io, socket, data));
        socket.on('dealCards', data => dealCards(io, socket, data));
        socket.on('revealCards', data => revealCards(io, socket, data));
        socket.on('startNewRound', data => startNewRound(io, socket, data));
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
