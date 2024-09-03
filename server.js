const WebSocket = require('ws');
const { handleMessage, handleClientClose } = require('./handler');
const { handleStream } = require('./streamHandler');

const wss = new WebSocket.Server({ port: 8866 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type) {
                handleMessage(ws, message, wss); 
            }
        } catch (error) {
            handleStream(ws, message,wss);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        handleClientClose(); 
    });
});

console.log('WebSocket server is running on ws://103.130.213.138:8866');
