const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

// Đọc chứng chỉ SSL và khóa riêng
const serverOptions = {
    cert: fs.readFileSync('bwdjourney_id_vn_c5857_b8ff5_1729088192_a902cc4aa08960412aac9f299eec9eb6.crt'),
    key: fs.readFileSync('c5857_b8ff5_b1d0fc444fa13dbd56b605a652d71aef.key'),
};

// Tạo server HTTPS
const server = https.createServer(serverOptions);

// Tạo WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type) {
                handleMessage(ws, message, wss); 
            }
        } catch (error) {
            handleStream(ws, message, wss);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        handleClientClose(); 
    });
});

// Lắng nghe kết nối trên cổng 443 cho HTTPS
server.listen(8080, () => {
    console.log('WebSocket server is running on Server');
});
