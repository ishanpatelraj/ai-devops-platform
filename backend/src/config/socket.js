const {Server} = require('socket.io');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`)
        socket.on('disconnect', (reason) => {
            console.log(`Disconnected: ${socket.id}`);
        });
    });
    return io;
}

const getIo = () => {
    if(!io){
        throw new Error('Socket.io has not been initialized. Call initSocket first')
    }
    return io;
};

module.exports = {initSocket, getIo, getIO: getIo};