const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Frontend Connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`Frontend Disconnected: ${socket.id}`);
        });
    });
    return io;
};

const getIo = () => io;

module.exports = {initSocket, getIo};